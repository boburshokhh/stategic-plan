import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AggregationService } from '../aggregation/aggregation.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aggregationService: AggregationService,
  ) {}

  /** KPI-агрегаты по всем направлениям активного плана за выбранный квартал. */
  async getOverview(year: number, quarter: number) {
    const [period, directions] = await Promise.all([
      this.prisma.reportingPeriod.findUnique({ where: { year_quarter: { year, quarter } } }),
      this.prisma.direction.findMany({ orderBy: { sortOrder: 'asc' } }),
    ]);

    if (!period) {
      return { year, quarter, directions: [] };
    }

    const directionStats = await Promise.all(
      directions.map(async (direction) => {
        const completeness = await this.aggregationService.getCompleteness(direction.id, period.id);
        return {
          directionId: direction.id,
          directionCode: direction.code,
          directionName: direction.name,
          totalExpected: completeness.totalExpected,
          completed: completeness.completed,
          inProgress: completeness.inProgress,
          missingCount: completeness.missing.length,
          completenessPercent: completeness.completenessPercent,
          missing: completeness.missing.map((item) => ({
            ...item,
            directionId: direction.id,
            directionName: direction.name,
          })),
        };
      }),
    );

    const totals = directionStats.reduce(
      (acc, direction) => ({
        completed: acc.completed + direction.completed,
        inProgress: acc.inProgress + direction.inProgress,
        missingCount: acc.missingCount + direction.missingCount,
        totalExpected: acc.totalExpected + direction.totalExpected,
      }),
      { completed: 0, inProgress: 0, missingCount: 0, totalExpected: 0 },
    );

    const missingReports = directionStats
      .flatMap((direction) => direction.missing)
      .sort((a, b) => a.directionName.localeCompare(b.directionName, 'ru') || a.departmentName.localeCompare(b.departmentName, 'ru'));

    return {
      year,
      quarter,
      reportingPeriodId: period.id,
      directions: directionStats.map(({ missing: _missing, ...direction }) => direction),
      totals,
      missingReports,
      overallCompletenessPercent:
        totals.totalExpected === 0
          ? 100
          : Math.round((totals.completed / totals.totalExpected) * 100),
    };
  }
}
