import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStrategicPlanDto } from './dto/create-strategic-plan.dto';

@Injectable()
export class StrategicPlansService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateStrategicPlanDto) {
    return this.prisma.strategicPlan.create({ data: dto });
  }

  findAll() {
    return this.prisma.strategicPlan.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findActiveWithTree() {
    const plan = await this.prisma.strategicPlan.findFirst({
      where: { status: 'active' },
      include: {
        directions: {
          orderBy: { sortOrder: 'asc' },
          include: {
            yearThemes: true,
            tasks: {
              orderBy: { sortOrder: 'asc' },
              include: {
                subtasks: {
                  orderBy: { sortOrder: 'asc' },
                  include: { departments: { include: { department: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Активный стратегический план не найден');
    }

    return plan;
  }

  findOne(id: string) {
    return this.prisma.strategicPlan.findUniqueOrThrow({ where: { id } });
  }
}
