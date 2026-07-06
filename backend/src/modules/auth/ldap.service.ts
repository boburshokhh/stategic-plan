import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Entry } from 'ldapts';

export interface LdapUserInfo {
  email: string;
  fullName: string;
}

@Injectable()
export class LdapService {
  private readonly logger = new Logger(LdapService.name);

  constructor(private readonly configService: ConfigService) {}

  async authenticate(username: string, password: string): Promise<LdapUserInfo> {
    const server = this.configService.get<string>('LDAP_SERVER');
    const baseDn = this.configService.get<string>('LDAP_BASE_DN');
    const userDn = this.configService.get<string>('LDAP_USER_DN');

    if (!server || !baseDn) {
      this.logger.error('LDAP_SERVER или LDAP_BASE_DN не заданы в .env');
      throw new UnauthorizedException('Сервис аутентификации недоступен');
    }

    const normalizedUsername = username.trim();
    const bindCandidates = this.buildBindCandidates(normalizedUsername, baseDn, userDn);

    for (const bindDn of bindCandidates) {
      const ldapUser = await this.tryDirectBind(server, bindDn, password, normalizedUsername, baseDn, userDn);
      if (ldapUser) {
        return ldapUser;
      }
    }

    const ldapUser = await this.searchWithServiceAccount(server, normalizedUsername, password, baseDn, userDn);
    if (ldapUser) {
      return ldapUser;
    }

    throw new UnauthorizedException('Неверный логин или пароль');
  }

  private buildBindCandidates(username: string, baseDn: string, userDn?: string): string[] {
    const candidates: string[] = [];
    const samAccount = this.extractSamAccount(username);
    const emailDomain = username.includes('@') ? username.split('@').pop()! : null;
    const baseDomain = this.domainFromBaseDn(baseDn);

    const add = (value: string) => {
      if (value && !candidates.includes(value)) {
        candidates.push(value);
      }
    };

    if (username.includes('@') || username.includes('\\')) {
      add(username);
    }

    if (emailDomain) {
      add(`${samAccount}@${emailDomain}`);
    }

    if (baseDomain) {
      add(`${samAccount}@${baseDomain}`);
    }

    if (userDn) {
      add(`cn=${this.escapeDn(samAccount)},${userDn}`);
    }

    if (!username.includes('@') && !username.includes('\\')) {
      add(samAccount);
    }

    return candidates;
  }

  private async tryDirectBind(
    server: string,
    bindDn: string,
    password: string,
    username: string,
    baseDn: string,
    userDn?: string,
  ): Promise<LdapUserInfo | null> {
    const client = new Client({ url: server, timeout: 10_000, connectTimeout: 10_000 });

    try {
      await client.bind(bindDn, password);
    } catch {
      return null;
    }

    try {
      // После UPN/domain bind обычный пользователь не может искать в AD — берём данные из bind DN.
      if (bindDn.includes('@') || bindDn.includes('\\')) {
        return this.mapFromBindIdentity(bindDn, username, baseDn);
      }

      const entry = await this.lookupProfile(client, bindDn, username, baseDn, userDn);
      return entry ? this.mapEntry(entry, username) : this.mapFromBindIdentity(bindDn, username, baseDn);
    } finally {
      await client.unbind().catch(() => undefined);
    }
  }

  private async searchWithServiceAccount(
    server: string,
    username: string,
    password: string,
    baseDn: string,
    userDn?: string,
  ): Promise<LdapUserInfo | null> {
    const serviceBindDn = this.configService.get<string>('LDAP_BIND_DN');
    const servicePassword = this.configService.get<string>('LDAP_BIND_PASSWORD');

    if (!serviceBindDn || !servicePassword) {
      return null;
    }

    const searchClient = new Client({ url: server, timeout: 10_000, connectTimeout: 10_000 });

    try {
      await searchClient.bind(serviceBindDn, servicePassword);
      const entry = await this.searchByUsername(searchClient, username, baseDn, userDn);
      if (!entry?.dn) {
        return null;
      }

      const userClient = new Client({ url: server, timeout: 10_000, connectTimeout: 10_000 });
      try {
        await userClient.bind(entry.dn, password);
      } catch {
        return null;
      } finally {
        await userClient.unbind().catch(() => undefined);
      }

      return this.mapEntry(entry, username);
    } catch (error) {
      this.logger.warn(`LDAP service-account search не удался для ${username}`, error);
      return null;
    } finally {
      await searchClient.unbind().catch(() => undefined);
    }
  }

  private async lookupProfile(
    client: Client,
    bindDn: string,
    username: string,
    baseDn: string,
    userDn?: string,
  ): Promise<Entry | null> {
    if (!bindDn.includes('@') && !bindDn.includes('\\')) {
      const byDn = await this.searchEntry(client, bindDn).catch(() => null);
      if (byDn) {
        return byDn;
      }
    }

    return this.searchByUsername(client, username, baseDn, userDn).catch(() => null);
  }

  private async searchByUsername(
    client: Client,
    username: string,
    baseDn: string,
    userDn?: string,
  ): Promise<Entry | null> {
    const samAccount = this.extractSamAccount(username);
    const escapedSam = this.escapeFilter(samAccount);
    const escapedUsername = this.escapeFilter(username);
    const filter = `(&(objectCategory=person)(objectClass=user)(|(sAMAccountName=${escapedSam})(userPrincipalName=${escapedUsername})(mail=${escapedUsername})))`;

    const searchBase = userDn || baseDn;
    const { searchEntries } = await client.search(searchBase, {
      scope: 'sub',
      filter,
      attributes: ['mail', 'displayName', 'cn', 'userPrincipalName', 'sAMAccountName'],
      sizeLimit: 1,
    });

    return searchEntries[0] ?? null;
  }

  private async searchEntry(client: Client, dn: string): Promise<Entry | null> {
    const { searchEntries } = await client.search(dn, {
      scope: 'base',
      filter: '(objectClass=*)',
      attributes: ['mail', 'displayName', 'cn', 'userPrincipalName', 'sAMAccountName'],
    });
    return searchEntries[0] ?? null;
  }

  private mapEntry(entry: Entry, fallbackUsername: string): LdapUserInfo {
    const email =
      this.readAttribute(entry, 'mail') ??
      this.readAttribute(entry, 'userPrincipalName') ??
      (fallbackUsername.includes('@') ? fallbackUsername : `${fallbackUsername}@local`);

    const fullName =
      this.readAttribute(entry, 'displayName') ??
      this.readAttribute(entry, 'cn') ??
      this.readAttribute(entry, 'sAMAccountName') ??
      this.extractSamAccount(fallbackUsername);

    return {
      email: email.toLowerCase(),
      fullName,
    };
  }

  private mapFromBindIdentity(bindDn: string, fallbackUsername: string, baseDn: string): LdapUserInfo {
    if (bindDn.includes('@')) {
      const samAccount = this.extractSamAccount(bindDn);
      return {
        email: bindDn.toLowerCase(),
        fullName: samAccount,
      };
    }

    const samAccount = this.extractSamAccount(bindDn.includes('\\') ? bindDn : fallbackUsername);
    const domain = this.domainFromBaseDn(baseDn);
    const email = fallbackUsername.includes('@')
      ? fallbackUsername
      : domain
        ? `${samAccount}@${domain}`
        : `${samAccount}@local`;

    return {
      email: email.toLowerCase(),
      fullName: samAccount,
    };
  }

  private extractSamAccount(username: string): string {
    if (username.includes('\\')) {
      return username.split('\\').pop()!;
    }
    if (username.includes('@')) {
      return username.split('@')[0];
    }
    return username;
  }

  private readAttribute(entry: Entry, name: string): string | undefined {
    const raw = entry[name];
    if (Array.isArray(raw)) {
      return raw[0] !== undefined ? String(raw[0]) : undefined;
    }
    if (raw instanceof Buffer) {
      return raw.toString('utf8');
    }
    return raw !== undefined ? String(raw) : undefined;
  }

  private domainFromBaseDn(baseDn: string): string | null {
    const parts = baseDn
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.toLowerCase().startsWith('dc='))
      .map((part) => part.slice(3));

    return parts.length > 0 ? parts.join('.') : null;
  }

  private escapeFilter(value: string): string {
    return value
      .replace(/\\/g, '\\5c')
      .replace(/\*/g, '\\2a')
      .replace(/\(/g, '\\28')
      .replace(/\)/g, '\\29')
      .replace(/\0/g, '\\00');
  }

  private escapeDn(value: string): string {
    return value.replace(/[,+"\\<>;=#]/g, (char) => `\\${char.charCodeAt(0).toString(16)}`);
  }
}
