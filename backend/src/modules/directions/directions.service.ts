import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDirectionDto } from './dto/create-direction.dto';

@Injectable()
export class DirectionsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateDirectionDto) {
    return this.prisma.direction.create({ data: dto });
  }

  findAll(planId?: string) {
    return this.prisma.direction.findMany({
      where: planId ? { planId } : undefined,
      orderBy: { sortOrder: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.direction.findUniqueOrThrow({ where: { id } });
  }

  /** Дерево Direction -> Task -> Subtask, опционально отфильтрованное по году подзадач. */
  findTree(id: string, year?: number) {
    return this.prisma.direction.findUniqueOrThrow({
      where: { id },
      include: {
        yearThemes: true,
        tasks: {
          orderBy: { sortOrder: 'asc' },
          include: {
            subtasks: {
              where: year ? { year } : undefined,
              orderBy: { sortOrder: 'asc' },
              include: { departments: { include: { department: true } } },
            },
          },
        },
      },
    });
  }
}
