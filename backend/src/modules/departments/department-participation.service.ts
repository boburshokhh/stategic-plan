import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReportStatus, SubtaskDepartmentRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { ParticipateSubtasksDto } from './dto/participate-subtasks.dto';

@Injectable()
export class DepartmentParticipationService {
  constructor(private readonly prisma: PrismaService) {}

  private assertDepartmentMember(user: AuthenticatedUser) {
    if (!user.departmentId) {
      throw new BadRequestException('Пользователь не привязан к отделу');
    }
    return user.departmentId;
  }

  /** Подзадачи года с контекстом и статусом участия текущего отдела. */
  async findMySubtasks(user: AuthenticatedUser, year: number) {
    const departmentId = this.assertDepartmentMember(user);

    const subtasks = await this.prisma.subtask.findMany({
      where: { year },
      orderBy: [{ task: { direction: { sortOrder: 'asc' } } }, { task: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
      include: {
        task: { include: { direction: true } },
        departments: { where: { departmentId } },
      },
    });

    const subtaskIds = subtasks.map((s) => s.id);
    const completedReports = subtaskIds.length
      ? await this.prisma.quarterlyReport.findMany({
          where: {
            departmentId,
            subtaskId: { in: subtaskIds },
            status: ReportStatus.completed,
          },
          select: { subtaskId: true },
        })
      : [];

    const completedSubtaskIds = new Set(completedReports.map((r) => r.subtaskId));

    return subtasks.map((subtask) => {
      const assignment = subtask.departments[0] ?? null;
      const enrollment = assignment
        ? {
            role: assignment.role,
            enrolledAt: assignment.createdAt.toISOString(),
          }
        : null;

      const canUnenroll =
        assignment?.role === SubtaskDepartmentRole.participant && !completedSubtaskIds.has(subtask.id);

      return {
        subtaskId: subtask.id,
        year: subtask.year,
        title: subtask.title,
        sortOrder: subtask.sortOrder,
        expectedResult: subtask.expectedResult,
        task: {
          id: subtask.task.id,
          number: subtask.task.number,
          title: subtask.task.title,
        },
        direction: {
          id: subtask.task.direction.id,
          code: subtask.task.direction.code,
          name: subtask.task.direction.name,
        },
        enrollment,
        canUnenroll,
      };
    });
  }

  /** Заявить участие отдела как participant в выбранных подзадачах. */
  async participate(user: AuthenticatedUser, dto: ParticipateSubtasksDto) {
    const departmentId = this.assertDepartmentMember(user);

    const subtasks = await this.prisma.subtask.findMany({
      where: { id: { in: dto.subtaskIds } },
      select: { id: true, year: true },
    });

    if (subtasks.length !== dto.subtaskIds.length) {
      throw new NotFoundException('Одна или несколько подзадач не найдены');
    }

    const existingAssignments = await this.prisma.subtaskDepartment.findMany({
      where: { departmentId, subtaskId: { in: dto.subtaskIds } },
      select: { subtaskId: true, role: true },
    });
    const existingBySubtask = new Map(existingAssignments.map((a) => [a.subtaskId, a.role]));

    const toEnroll = dto.subtaskIds.filter((id) => !existingBySubtask.has(id));

    return this.prisma.$transaction(async (tx) => {
      if (toEnroll.length > 0) {
        await tx.subtaskDepartment.createMany({
          data: toEnroll.map((subtaskId) => ({
            subtaskId,
            departmentId,
            role: SubtaskDepartmentRole.participant,
          })),
          skipDuplicates: true,
        });
      }

      const enrolledSubtasks = subtasks.filter(
        (s) => toEnroll.includes(s.id) || existingBySubtask.get(s.id) === SubtaskDepartmentRole.participant,
      );

      const years = [...new Set(enrolledSubtasks.map((s) => s.year))];
      let reportsCreated = 0;

      for (const year of years) {
        const yearSubtaskIds = enrolledSubtasks.filter((s) => s.year === year).map((s) => s.id);
        const periods = await tx.reportingPeriod.findMany({
          where: { year },
        });

        if (periods.length === 0) continue;

        const reportRows = periods.flatMap((period) =>
          yearSubtaskIds.map((subtaskId) => ({
            subtaskId,
            departmentId,
            reportingPeriodId: period.id,
            status: ReportStatus.not_started,
          })),
        );

        if (reportRows.length > 0) {
          const result = await tx.quarterlyReport.createMany({
            data: reportRows,
            skipDuplicates: true,
          });
          reportsCreated += result.count;
        }
      }

      return {
        enrolled: toEnroll.length,
        skipped: dto.subtaskIds.length - toEnroll.length,
        reportsCreated,
      };
    });
  }

  /** Снять участие participant, если нет сданных отчётов. */
  async unparticipate(user: AuthenticatedUser, subtaskId: string) {
    const departmentId = this.assertDepartmentMember(user);

    const assignment = await this.prisma.subtaskDepartment.findUnique({
      where: { subtaskId_departmentId: { subtaskId, departmentId } },
    });

    if (!assignment) {
      throw new NotFoundException('Отдел не участвует в этой подзадаче');
    }

    if (assignment.role === SubtaskDepartmentRole.owner) {
      throw new ForbiddenException('Назначенный ответственный не может снять участие самостоятельно');
    }

    const completedReport = await this.prisma.quarterlyReport.findFirst({
      where: {
        subtaskId,
        departmentId,
        status: ReportStatus.completed,
      },
    });

    if (completedReport) {
      throw new BadRequestException('Нельзя снять участие: есть сданные отчёты по этой подзадаче');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.quarterlyReport.deleteMany({
        where: {
          subtaskId,
          departmentId,
          status: { in: [ReportStatus.not_started, ReportStatus.in_progress] },
        },
      });

      await tx.subtaskDepartment.delete({
        where: { subtaskId_departmentId: { subtaskId, departmentId } },
      });

      return { removed: true };
    });
  }
}
