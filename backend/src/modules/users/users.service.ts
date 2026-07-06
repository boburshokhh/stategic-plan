import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        role: dto.role,
        departmentId: dto.departmentId,
      },
    });
    return this.sanitize(user);
  }

  async findAll() {
    const users = await this.prisma.user.findMany({ include: { department: true } });
    return users.map((user) => this.sanitize(user));
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id }, include: { department: true } });
    return this.sanitize(user);
  }

  private sanitize<T extends { passwordHash: string }>(user: T) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
