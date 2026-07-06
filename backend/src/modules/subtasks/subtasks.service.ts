import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';
import { AssignDepartmentsDto } from './dto/assign-departments.dto';

@Injectable()
export class SubtasksService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateSubtaskDto) {
    return this.prisma.subtask.create({ data: dto });
  }

  findAll(taskId?: string, year?: number) {
    return this.prisma.subtask.findMany({
      where: {
        taskId,
        year,
      },
      orderBy: { sortOrder: 'asc' },
      include: { departments: { include: { department: true } } },
    });
  }

  findOne(id: string) {
    return this.prisma.subtask.findUniqueOrThrow({
      where: { id },
      include: { departments: { include: { department: true } } },
    });
  }

  update(id: string, dto: UpdateSubtaskDto) {
    return this.prisma.subtask.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.subtask.delete({ where: { id } });
  }

  /**
   * Этап планирования: назначает ответственные отделы на подзадачу.
   * Полностью заменяет предыдущий набор назначений (idempotent PUT).
   */
  async assignDepartments(subtaskId: string, dto: AssignDepartmentsDto) {
    await this.prisma.subtask.findUniqueOrThrow({ where: { id: subtaskId } });

    return this.prisma.$transaction(async (tx) => {
      await tx.subtaskDepartment.deleteMany({ where: { subtaskId } });
      await tx.subtaskDepartment.createMany({
        data: dto.departments.map((assignment) => ({
          subtaskId,
          departmentId: assignment.departmentId,
          role: assignment.role,
        })),
      });
      return tx.subtaskDepartment.findMany({
        where: { subtaskId },
        include: { department: true },
      });
    });
  }
}
