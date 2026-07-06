import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateDepartmentDto) {
    return this.prisma.department.create({ data: dto });
  }

  findAll() {
    return this.prisma.department.findMany({ orderBy: { name: 'asc' } });
  }

  findOne(id: string) {
    return this.prisma.department.findUniqueOrThrow({ where: { id } });
  }

  /** Сотрудники отдела — источник для выбора исполнителей этапа отчёта. */
  findMembers(id: string) {
    return this.prisma.user.findMany({
      where: { departmentId: id },
      select: { id: true, fullName: true, email: true, role: true },
      orderBy: { fullName: 'asc' },
    });
  }

  update(id: string, dto: UpdateDepartmentDto) {
    return this.prisma.department.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.department.delete({ where: { id } });
  }
}
