import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateTaskDto) {
    return this.prisma.task.create({ data: dto });
  }

  findAll(directionId?: string) {
    return this.prisma.task.findMany({
      where: directionId ? { directionId } : undefined,
      orderBy: { sortOrder: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.task.findUniqueOrThrow({
      where: { id },
      include: { subtasks: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  update(id: string, dto: UpdateTaskDto) {
    return this.prisma.task.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.task.delete({ where: { id } });
  }
}
