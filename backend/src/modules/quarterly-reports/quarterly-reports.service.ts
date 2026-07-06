import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ReportStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { UpsertReportDto } from './dto/upsert-report.dto';
import { CreateReportItemDto } from './dto/create-report-item.dto';
import { UpdateReportItemDto } from './dto/update-report-item.dto';
import { ReorderReportItemsDto } from './dto/reorder-report-items.dto';
import { AssignReportItemMembersDto } from './dto/assign-report-item-members.dto';
import { deleteAttachmentFile, saveAttachmentFile } from './attachment-storage.util';
import { normalizeUploadedFileName } from './normalize-uploaded-file-name.util';

const MIN_COMPLETED_CONTENT_LENGTH = 10;
const MIN_REPORT_ITEMS = 2;

/** Прогресс подзадачи/отчёта по этапам (department_description.md §3.3). */
function computeProgress(items: { status: ReportStatus }[]) {
  const totalItems = items.length;
  const completedItems = items.filter((item) => item.status === 'completed').length;
  return {
    totalItems,
    completedItems,
    progressPercent: totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100),
  };
}

function normalizeAttachment<T extends { fileName: string }>(attachment: T): T {
  return { ...attachment, fileName: normalizeUploadedFileName(attachment.fileName) };
}

const ITEM_DETAIL_INCLUDE = {
  assignees: { include: { user: { select: { id: true, fullName: true } } } },
  attachments: true,
} as const;

@Injectable()
export class QuarterlyReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Отчёты отдела текущего пользователя за квартал ("Мои отчёты"). */
  async findMyReports(user: AuthenticatedUser, reportingPeriodId?: string) {
    if (!user.departmentId) {
      throw new BadRequestException('Пользователь не привязан к отделу');
    }

    const reports = await this.prisma.quarterlyReport.findMany({
      where: { departmentId: user.departmentId, reportingPeriodId },
      include: {
        subtask: { include: { task: { include: { direction: true } } } },
        reportingPeriod: true,
        items: { select: { status: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return reports.map(({ items, ...report }) => ({ ...report, progress: computeProgress(items) }));
  }

  async findBySubtask(subtaskId: string, reportingPeriodId?: string) {
    const reports = await this.prisma.quarterlyReport.findMany({
      where: { subtaskId, reportingPeriodId },
      include: { department: true, reportingPeriod: true, items: { select: { status: true } } },
    });

    return reports.map(({ items, ...report }) => ({ ...report, progress: computeProgress(items) }));
  }

  /**
   * Создаёт черновик отчёта отдела по подзадаче за квартал, если его ещё нет.
   * Нужно для подзадач, назначенных из Excel (ответственный ОТВ), где отчёт
   * не создавался автоматически для каждого квартала.
   */
  async ensureMyReport(user: AuthenticatedUser, subtaskId: string, reportingPeriodId: string) {
    if (!user.departmentId) {
      throw new BadRequestException('Пользователь не привязан к отделу');
    }

    const [assignment, subtask, period] = await Promise.all([
      this.prisma.subtaskDepartment.findUnique({
        where: { subtaskId_departmentId: { subtaskId, departmentId: user.departmentId } },
      }),
      this.prisma.subtask.findUnique({ where: { id: subtaskId } }),
      this.prisma.reportingPeriod.findUnique({ where: { id: reportingPeriodId } }),
    ]);

    if (!assignment) {
      throw new ForbiddenException('Ваш отдел не участвует в этой подзадаче');
    }
    if (!subtask) {
      throw new NotFoundException('Подзадача не найдена');
    }
    if (!period) {
      throw new NotFoundException('Отчётный период не найден');
    }
    if (subtask.year !== period.year) {
      throw new BadRequestException(
        `Подзадача относится к ${subtask.year} году. Выберите квартал ${subtask.year} года в переключателе периода.`,
      );
    }

    const report = await this.prisma.quarterlyReport.upsert({
      where: {
        subtaskId_reportingPeriodId_departmentId: {
          subtaskId,
          reportingPeriodId,
          departmentId: user.departmentId,
        },
      },
      create: {
        subtaskId,
        reportingPeriodId,
        departmentId: user.departmentId,
        status: ReportStatus.not_started,
      },
      update: {},
      include: {
        subtask: { include: { task: { include: { direction: true } } } },
        reportingPeriod: true,
        items: { select: { status: true } },
      },
    });

    const { items, ...rest } = report;
    return { ...rest, progress: computeProgress(items) };
  }

  async findOne(id: string) {
    const report = await this.prisma.quarterlyReport.findUnique({
      where: { id },
      include: {
        department: true,
        reportingPeriod: true,
        subtask: { include: { task: { include: { direction: true } } } },
        revisions: { orderBy: { changedAt: 'desc' }, include: { changedBy: { select: { id: true, fullName: true } } } },
        attachments: { where: { reportItemId: null } },
        items: { orderBy: { sortOrder: 'asc' }, include: ITEM_DETAIL_INCLUDE },
      },
    });
    if (!report) {
      throw new NotFoundException('Отчёт не найден');
    }

    return {
      ...report,
      progress: computeProgress(report.items),
      attachments: report.attachments.map(normalizeAttachment),
      items: report.items.map((item) => ({
        ...item,
        attachments: item.attachments.map(normalizeAttachment),
      })),
    };
  }

  private async loadReportForEdit(id: string) {
    const report = await this.prisma.quarterlyReport.findUnique({
      where: { id },
      include: { reportingPeriod: true },
    });
    if (!report) {
      throw new NotFoundException('Отчёт не найден');
    }
    return report;
  }

  /**
   * dept_user редактирует только отчёты своего отдела; admin — без ограничений по времени.
   */
  private assertCanEditReport(report: { departmentId: string }, user: AuthenticatedUser) {
    if (user.role === UserRole.dept_user && report.departmentId !== user.departmentId) {
      throw new ForbiddenException('Отчёт принадлежит другому отделу');
    }
  }

  async update(id: string, dto: UpsertReportDto, user: AuthenticatedUser) {
    const report = await this.loadReportForEdit(id);
    this.assertCanEditReport(report, user);

    const itemCount = await this.prisma.reportItem.count({ where: { reportId: id } });
    if (itemCount < MIN_REPORT_ITEMS) {
      throw new BadRequestException(
        `Отчёт должен содержать минимум ${MIN_REPORT_ITEMS} шага реализации. Сейчас добавлено: ${itemCount} из ${MIN_REPORT_ITEMS}.`,
      );
    }

    if (dto.status === ReportStatus.completed) {
      const incompleteItems = await this.prisma.reportItem.count({
        where: { reportId: id, status: { not: ReportStatus.completed } },
      });
      if (incompleteItems > 0) {
        throw new BadRequestException(
          `Для статуса «Выполнено» все шаги должны быть выполнены. Не завершено: ${incompleteItems} из ${itemCount}.`,
        );
      }
    }

    if (dto.status === 'completed' && dto.content.trim().length < MIN_COMPLETED_CONTENT_LENGTH) {
      throw new BadRequestException(
        `Для статуса «Выполнено полностью» описание должно содержать не менее ${MIN_COMPLETED_CONTENT_LENGTH} символов`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.quarterlyReport.update({
        where: { id },
        data: {
          content: dto.content,
          status: dto.status,
          submittedById: user.id,
          submittedAt: new Date(),
        },
      });

      await tx.reportRevision.create({
        data: { reportId: id, content: dto.content, changedById: user.id },
      });

      return updated;
    });
  }

  /** Проверка руководителем направления при агрегации (Этап 4). */
  async review(id: string, user: AuthenticatedUser) {
    if (user.role === UserRole.dept_user) {
      throw new ForbiddenException('Недостаточно прав для проверки отчёта');
    }

    return this.prisma.quarterlyReport.update({
      where: { id },
      data: { reviewedById: user.id, reviewedAt: new Date() },
    });
  }

  // -------------------------------------------------------------------------
  // Этапы отчёта (ReportItem) — department_description.md §3
  // -------------------------------------------------------------------------

  async createItem(reportId: string, dto: CreateReportItemDto, user: AuthenticatedUser) {
    const report = await this.loadReportForEdit(reportId);
    this.assertCanEditReport(report, user);

    const last = await this.prisma.reportItem.findFirst({
      where: { reportId },
      orderBy: { sortOrder: 'desc' },
    });

    return this.prisma.reportItem.create({
      data: {
        reportId,
        title: dto.title,
        content: dto.content ?? '',
        status: dto.status ?? ReportStatus.not_started,
        sortOrder: (last?.sortOrder ?? 0) + 1,
      },
      include: ITEM_DETAIL_INCLUDE,
    });
  }

  private async loadItemForEdit(reportId: string, itemId: string) {
    const report = await this.loadReportForEdit(reportId);
    const item = await this.prisma.reportItem.findUnique({ where: { id: itemId } });
    if (!item || item.reportId !== reportId) {
      throw new NotFoundException('Этап отчёта не найден');
    }
    return { report, item };
  }

  async updateItem(reportId: string, itemId: string, dto: UpdateReportItemDto, user: AuthenticatedUser) {
    const { report } = await this.loadItemForEdit(reportId, itemId);
    this.assertCanEditReport(report, user);

    if (dto.status === 'completed' && !(dto.title ?? '').trim()) {
      const existing = await this.prisma.reportItem.findUniqueOrThrow({ where: { id: itemId } });
      if (!existing.title.trim()) {
        throw new BadRequestException('У завершённого этапа должно быть название');
      }
    }

    return this.prisma.reportItem.update({
      where: { id: itemId },
      data: { title: dto.title, content: dto.content, status: dto.status },
      include: ITEM_DETAIL_INCLUDE,
    });
  }

  async removeItem(reportId: string, itemId: string, user: AuthenticatedUser) {
    const { report } = await this.loadItemForEdit(reportId, itemId);
    this.assertCanEditReport(report, user);

    const itemCount = await this.prisma.reportItem.count({ where: { reportId } });
    if (itemCount <= MIN_REPORT_ITEMS) {
      throw new BadRequestException(
        `Нельзя удалить шаг: в отчёте должно остаться минимум ${MIN_REPORT_ITEMS} шага реализации.`,
      );
    }

    await this.prisma.reportItem.delete({ where: { id: itemId } });
    return { removed: true };
  }

  async reorderItems(reportId: string, dto: ReorderReportItemsDto, user: AuthenticatedUser) {
    const report = await this.loadReportForEdit(reportId);
    this.assertCanEditReport(report, user);

    const items = await this.prisma.reportItem.findMany({ where: { reportId } });
    const knownIds = new Set(items.map((item) => item.id));
    if (dto.itemIds.length !== items.length || !dto.itemIds.every((id) => knownIds.has(id))) {
      throw new BadRequestException('Список этапов не соответствует текущему составу отчёта');
    }

    await this.prisma.$transaction(
      dto.itemIds.map((itemId, index) =>
        this.prisma.reportItem.update({ where: { id: itemId }, data: { sortOrder: index + 1 } }),
      ),
    );

    return this.prisma.reportItem.findMany({
      where: { reportId },
      orderBy: { sortOrder: 'asc' },
      include: ITEM_DETAIL_INCLUDE,
    });
  }

  /** Полная замена списка исполнителей этапа — сотрудники отдела и/или внешние ФИО. */
  async assignItemMembers(reportId: string, itemId: string, dto: AssignReportItemMembersDto, user: AuthenticatedUser) {
    const { report } = await this.loadItemForEdit(reportId, itemId);
    this.assertCanEditReport(report, user);

    return this.prisma.$transaction(async (tx) => {
      await tx.reportItemAssignee.deleteMany({ where: { reportItemId: itemId } });
      if (dto.assignees.length > 0) {
        await tx.reportItemAssignee.createMany({
          data: dto.assignees.map((assignee) => ({
            reportItemId: itemId,
            userId: assignee.userId,
            externalName: assignee.userId ? null : assignee.externalName,
          })),
        });
      }
      return tx.reportItemAssignee.findMany({
        where: { reportItemId: itemId },
        include: { user: { select: { id: true, fullName: true } } },
      });
    });
  }

  // -------------------------------------------------------------------------
  // Вложения (ReportAttachment) — документы и фото, department_description.md §2.3
  // -------------------------------------------------------------------------

  async addAttachment(
    reportId: string,
    itemId: string | null,
    file: Express.Multer.File,
    user: AuthenticatedUser,
    explicitFileName?: string,
  ) {
    const report = await this.loadReportForEdit(reportId);
    this.assertCanEditReport(report, user);

    if (itemId) {
      const item = await this.prisma.reportItem.findUnique({ where: { id: itemId } });
      if (!item || item.reportId !== reportId) {
        throw new NotFoundException('Этап отчёта не найден');
      }
    }

    const fileName = normalizeUploadedFileName(explicitFileName?.trim() || file.originalname);
    const storagePath = await saveAttachmentFile(reportId, fileName, file.buffer);

    const attachment = await this.prisma.reportAttachment.create({
      data: {
        reportId,
        reportItemId: itemId,
        fileName,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storagePath,
        uploadedById: user.id,
      },
    });

    return normalizeAttachment(attachment);
  }

  async getAttachmentForDownload(reportId: string, attachmentId: string) {
    const attachment = await this.prisma.reportAttachment.findUnique({ where: { id: attachmentId } });
    if (!attachment || attachment.reportId !== reportId) {
      throw new NotFoundException('Вложение не найдено');
    }
    return normalizeAttachment(attachment);
  }

  async removeAttachment(reportId: string, attachmentId: string, user: AuthenticatedUser) {
    const report = await this.loadReportForEdit(reportId);
    this.assertCanEditReport(report, user);

    const attachment = await this.prisma.reportAttachment.findUnique({ where: { id: attachmentId } });
    if (!attachment || attachment.reportId !== reportId) {
      throw new NotFoundException('Вложение не найдено');
    }

    await this.prisma.reportAttachment.delete({ where: { id: attachmentId } });
    await deleteAttachmentFile(attachment.storagePath);
    return { removed: true };
  }
}
