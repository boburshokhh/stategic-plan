import { randomUUID } from 'crypto';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LdapService } from './ldap.service';
import { LoginDto } from './dto/login.dto';

const LDAP_USER_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly ldapService: LdapService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const ldapUser = await this.ldapService.authenticate(dto.username, dto.password);
    const ldapRole = this.resolveLdapRole(ldapUser.email);
    const ldapDepartmentId = await this.resolveLdapDepartmentId(ldapUser.email);

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: ldapUser.email, mode: 'insensitive' } },
          { email: { equals: dto.username.trim(), mode: 'insensitive' } },
        ],
      },
    });

    if (!user) {
      const passwordHash = await bcrypt.hash(randomUUID(), LDAP_USER_SALT_ROUNDS);
      user = await this.prisma.user.create({
        data: {
          email: ldapUser.email,
          fullName: ldapUser.fullName,
          role: ldapRole,
          departmentId: ldapDepartmentId ?? undefined,
          passwordHash,
        },
      });
      this.logger.log(`Автоматическая регистрация LDAP-пользователя: ${ldapUser.email} (${ldapRole})`);
    } else {
      const updates: { role?: UserRole; departmentId?: string } = {};

      if (user.role !== ldapRole) {
        updates.role = ldapRole;
      }

      if (ldapDepartmentId && user.departmentId !== ldapDepartmentId) {
        updates.departmentId = ldapDepartmentId;
      }

      if (Object.keys(updates).length > 0) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: updates,
        });
        this.logger.log(`Обновлён LDAP-пользователь: ${ldapUser.email}`);
      }
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        departmentId: user.departmentId,
      },
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { department: true },
    });
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  private resolveLdapRole(email: string): UserRole {
    const adminEmails = (this.configService.get<string>('LDAP_ADMIN_EMAILS') ?? '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    return adminEmails.includes(email.toLowerCase()) ? UserRole.admin : UserRole.dept_user;
  }

  private async resolveLdapDepartmentId(email: string): Promise<string | null> {
    const mappings = (this.configService.get<string>('LDAP_USER_DEPARTMENTS') ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    for (const mapping of mappings) {
      const separatorIndex = mapping.indexOf(':');
      if (separatorIndex === -1) {
        continue;
      }

      const mappedEmail = mapping.slice(0, separatorIndex).trim().toLowerCase();
      const departmentCode = mapping.slice(separatorIndex + 1).trim();
      if (mappedEmail !== email.toLowerCase() || !departmentCode) {
        continue;
      }

      const department = await this.prisma.department.findFirst({
        where: { code: { equals: departmentCode, mode: 'insensitive' } },
      });

      if (!department) {
        this.logger.warn(`Отдел "${departmentCode}" не найден для LDAP-пользователя ${email}`);
        return null;
      }

      return department.id;
    }

    return null;
  }
}
