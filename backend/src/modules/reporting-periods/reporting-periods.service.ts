import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReportingPeriodDto } from './dto/create-reporting-period.dto';

@Injectable()
export class ReportingPeriodsService {
  private readonly logger = new Logger(ReportingPeriodsService.name);

  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateReportingPeriodDto) {
    return this.prisma.reportingPeriod.create({ data: dto });
  }

  findAll(year?: number) {
    return this.prisma.reportingPeriod.findMany({
      where: year ? { year } : undefined,
      orderBy: [{ year: 'asc' }, { quarter: 'asc' }],
    });
  }

  findOne(id: string) {
    return this.prisma.reportingPeriod.findUniqueOrThrow({ where: { id } });
  }

  findCurrent() {
    const now = new Date();
    const year = now.getFullYear();
    const quarter = Math.ceil((now.getMonth() + 1) / 3);
    return this.prisma.reportingPeriod.findUnique({
      where: { year_quarter: { year, quarter } },
    });
  }

  /**
   * Этап 3 (deskription.md): за 5 последних рабочих дней квартала система
   * должна автоматически подготовить пустые отчёты по всем парам
   * (подзадача, отдел), назначенным на неё — отдел лишь дополняет текст.
   * Идемпотентно: используется UNIQUE(subtaskId, reportingPeriodId, departmentId).
   */
  async openCollectionWindow(reportingPeriodId: string) {
    const period = await this.prisma.reportingPeriod.findUniqueOrThrow({
      where: { id: reportingPeriodId },
    });

    const assignments = await this.prisma.subtaskDepartment.findMany({
      where: { subtask: { year: period.year } },
      select: { subtaskId: true, departmentId: true },
    });

    if (assignments.length === 0) {
      return { created: 0 };
    }

    const result = await this.prisma.quarterlyReport.createMany({
      data: assignments.map((assignment) => ({
        subtaskId: assignment.subtaskId,
        departmentId: assignment.departmentId,
        reportingPeriodId,
        status: 'not_started' as const,
      })),
      skipDuplicates: true,
    });

    this.logger.log(`Открыто окно сбора отчётности ${reportingPeriodId}: создано ${result.count} черновиков`);
    return { created: result.count };
  }

  /** Ежедневно проверяет, не начался ли период сбора отчётности, и готовит черновики. */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async autoOpenDueCollectionWindows() {
    const now = new Date();
    const duePeriods = await this.prisma.reportingPeriod.findMany({
      where: { collectionStart: { lte: now }, collectionEnd: { gte: now } },
    });

    for (const period of duePeriods) {
      await this.openCollectionWindow(period.id);
    }
  }
}
