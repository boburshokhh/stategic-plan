import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSummaryDto } from './dto/create-summary.dto';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';

@Injectable()
export class AggregationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Этап 4 (deskription.md): сравнивает ожидаемые пары (подзадача, отдел)
   * из subtask_departments с фактически поданными quarterly_reports
   * для направления за конкретный квартал.
   */
  async getCompleteness(directionId: string, reportingPeriodId: string) {
    const period = await this.prisma.reportingPeriod.findUniqueOrThrow({ where: { id: reportingPeriodId } });

    const expectedAssignments = await this.prisma.subtaskDepartment.findMany({
      where: { subtask: { year: period.year, task: { directionId } } },
      include: {
        department: true,
        subtask: { include: { task: true } },
      },
    });

    const submittedReports = await this.prisma.quarterlyReport.findMany({
      where: { reportingPeriodId, subtask: { task: { directionId } } },
      select: { subtaskId: true, departmentId: true, status: true },
    });

    const submittedKey = (subtaskId: string, departmentId: string) => `${subtaskId}:${departmentId}`;
    const completedKeys = new Set(
      submittedReports.filter((r) => r.status === 'completed').map((r) => submittedKey(r.subtaskId, r.departmentId)),
    );
    const submittedAnyKeys = new Set(
      submittedReports.map((r) => submittedKey(r.subtaskId, r.departmentId)),
    );

    const missing = expectedAssignments.filter(
      (assignment) => !submittedAnyKeys.has(submittedKey(assignment.subtaskId, assignment.departmentId)),
    );
    const inProgress = expectedAssignments.filter((assignment) => {
      const key = submittedKey(assignment.subtaskId, assignment.departmentId);
      return submittedAnyKeys.has(key) && !completedKeys.has(key);
    });

    const total = expectedAssignments.length;
    const completed = expectedAssignments.length - missing.length - inProgress.length;

    return {
      directionId,
      reportingPeriodId,
      totalExpected: total,
      completed,
      inProgress: inProgress.length,
      missing: missing.map((m) => ({
        subtaskId: m.subtaskId,
        subtaskTitle: m.subtask.title,
        taskTitle: m.subtask.task.title,
        departmentId: m.departmentId,
        departmentName: m.department.name,
      })),
      completenessPercent: total === 0 ? 100 : Math.round((completed / total) * 100),
    };
  }

  async upsertSummary(directionId: string, dto: CreateSummaryDto) {
    return this.prisma.directionSummary.upsert({
      where: { directionId_reportingPeriodId: { directionId, reportingPeriodId: dto.reportingPeriodId } },
      update: {
        completedItems: dto.completedItems,
        deviations: dto.deviations,
        risks: dto.risks,
        status: 'draft',
      },
      create: {
        directionId,
        reportingPeriodId: dto.reportingPeriodId,
        completedItems: dto.completedItems,
        deviations: dto.deviations,
        risks: dto.risks,
      },
    });
  }

  async approveSummary(id: string, user: AuthenticatedUser) {
    return this.prisma.directionSummary.update({
      where: { id },
      data: { status: 'approved', approvedById: user.id },
    });
  }

  getSummary(directionId: string, reportingPeriodId: string) {
    return this.prisma.directionSummary.findUnique({
      where: { directionId_reportingPeriodId: { directionId, reportingPeriodId } },
    });
  }
}
