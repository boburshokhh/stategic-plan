import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { parseWorkbookBuffer, ParsedDirection, ParsedTask } from './excel-parser.util';
import { matchDepartmentAlias, slugifyDepartmentCode } from './department-aliases';

/** Соответствие названия листа Excel коду направления (совпадает с prisma/seed.ts). */
const SHEET_TO_DIRECTION_CODE: Record<string, string> = {
  Эксплуатация: 'A',
  Кадры: 'B',
  Цифровизация: 'C',
  HSE: 'D',
  'Зеленая энергетика': 'E',
};

export interface ImportSummary {
  directions: number;
  tasks: number;
  subtasks: number;
  departmentsCreated: number;
  reports: number;
}

export interface ImportStatus {
  lastImport: {
    fileName: string;
    importedAt: Date;
    summary: ImportSummary;
  } | null;
  planStats: {
    directions: number;
    tasks: number;
    subtasks: number;
    quarterlyReports: number;
    departments: number;
  };
}

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStatus(): Promise<ImportStatus> {
    const [lastRun, directions, tasks, subtasks, quarterlyReports, departments] = await Promise.all([
      this.prisma.excelImportRun.findFirst({ orderBy: { importedAt: 'desc' } }),
      this.prisma.direction.count(),
      this.prisma.task.count(),
      this.prisma.subtask.count(),
      this.prisma.quarterlyReport.count(),
      this.prisma.department.count(),
    ]);

    const planStats = { directions, tasks, subtasks, quarterlyReports, departments };

    if (!lastRun) {
      return { lastImport: null, planStats };
    }

    const batchStart = new Date(lastRun.importedAt.getTime() - 60_000);
    const batchRuns = await this.prisma.excelImportRun.findMany({
      where: { fileName: lastRun.fileName, importedAt: { gte: batchStart } },
      select: { entityType: true },
    });

    const summary: ImportSummary = {
      directions: batchRuns.filter((r) => r.entityType === 'direction').length,
      tasks: batchRuns.filter((r) => r.entityType === 'task').length,
      subtasks: batchRuns.filter((r) => r.entityType === 'subtask').length,
      reports: batchRuns.filter((r) => r.entityType === 'quarterly_report').length,
      departmentsCreated: 0,
    };

    return {
      lastImport: { fileName: lastRun.fileName, importedAt: lastRun.importedAt, summary },
      planStats,
    };
  }

  async importFromBuffer(buffer: Buffer, fileName: string): Promise<ImportSummary> {
    const parsedDirections = parseWorkbookBuffer(buffer);
    const plan = await this.ensureActivePlan();

    const summary: ImportSummary = { directions: 0, tasks: 0, subtasks: 0, departmentsCreated: 0, reports: 0 };

    for (const parsedDirection of parsedDirections) {
      await this.importDirection(plan.id, fileName, parsedDirection, summary);
    }

    this.logger.log(
      `Импорт "${fileName}" завершён: ${summary.directions} направлений, ${summary.tasks} задач, ` +
        `${summary.subtasks} подзадач, ${summary.reports} отчётов, ${summary.departmentsCreated} новых отделов.`,
    );

    return summary;
  }

  private async ensureActivePlan() {
    const existing = await this.prisma.strategicPlan.findFirst({ where: { status: 'active' } });
    if (existing) return existing;

    return this.prisma.strategicPlan.create({
      data: {
        title: 'Стратегический план Бухарского ОУМГ СП ООО "Asia Trans Gas"',
        yearFrom: 2026,
        yearTo: 2028,
        status: 'active',
      },
    });
  }

  private async importDirection(
    planId: string,
    fileName: string,
    parsed: ParsedDirection,
    summary: ImportSummary,
  ) {
    const code = SHEET_TO_DIRECTION_CODE[parsed.sheetName];
    if (!code) {
      this.logger.warn(`Лист "${parsed.sheetName}" не сопоставлен ни одному направлению, пропущен`);
      return;
    }

    const direction = await this.prisma.direction.upsert({
      where: { planId_code: { planId, code } },
      update: { name: parsed.title },
      create: { planId, code, name: parsed.title, sortOrder: Object.keys(SHEET_TO_DIRECTION_CODE).indexOf(parsed.sheetName) + 1 },
    });
    summary.directions += 1;

    for (const [yearStr, themeTitle] of Object.entries(parsed.yearThemes)) {
      await this.prisma.directionYearTheme.upsert({
        where: { directionId_year: { directionId: direction.id, year: Number(yearStr) } },
        update: { themeTitle },
        create: { planId, directionId: direction.id, year: Number(yearStr), themeTitle },
      });
    }

    for (let taskIndex = 0; taskIndex < parsed.tasks.length; taskIndex++) {
      await this.importTask(direction.id, fileName, parsed.sheetName, parsed.tasks[taskIndex], taskIndex + 1, summary);
    }
  }

  private async importTask(
    directionId: string,
    fileName: string,
    sheetName: string,
    parsedTask: ParsedTask,
    sortOrder: number,
    summary: ImportSummary,
  ) {
    const existingTask = await this.prisma.task.findFirst({ where: { directionId, sortOrder } });
    const task = existingTask
      ? await this.prisma.task.update({
          where: { id: existingTask.id },
          data: { number: parsedTask.number, title: parsedTask.title },
        })
      : await this.prisma.task.create({
          data: { directionId, number: parsedTask.number, title: parsedTask.title, sortOrder },
        });
    summary.tasks += 1;

    await this.logImportRun(fileName, sheetName, parsedTask.rowNumber, 'task', task.id, parsedTask.title);

    // Год 2026 обрабатывается отдельно, чтобы отчёты можно было привязать
    // к первой подзадаче года (см. ограничение алгоритма ниже).
    const subtasksByYearIds: Record<number, string[]> = { 2026: [], 2027: [], 2028: [] };

    for (const year of [2026, 2027, 2028]) {
      const parsedSubtasks = parsedTask.subtasksByYear[year] ?? [];
      for (let i = 0; i < parsedSubtasks.length; i++) {
        const parsedSubtask = parsedSubtasks[i];
        const subtaskSortOrder = i + 1;
        const existingSubtask = await this.prisma.subtask.findFirst({
          where: { taskId: task.id, year, sortOrder: subtaskSortOrder },
        });
        const subtask = existingSubtask
          ? await this.prisma.subtask.update({ where: { id: existingSubtask.id }, data: { title: parsedSubtask.title } })
          : await this.prisma.subtask.create({
              data: { taskId: task.id, year, title: parsedSubtask.title, sortOrder: subtaskSortOrder },
            });
        summary.subtasks += 1;
        subtasksByYearIds[year].push(subtask.id);
        await this.logImportRun(fileName, sheetName, parsedSubtask.rowNumber, 'subtask', subtask.id, parsedSubtask.title);
      }
    }

    if (parsedTask.quarterlyReports.length === 0) {
      return;
    }

    // ОГРАНИЧЕНИЕ АЛГОРИТМА: в исходном файле квартальный отчёт привязан к
    // строке задачи, а не к конкретной подзадаче года. Поэтому все отчёты
    // задачи агрегируются на первую подзадачу 2026 года (либо создаётся
    // "служебная" подзадача с названием задачи, если подзадач на 2026 нет).
    let targetSubtaskId = subtasksByYearIds[2026][0];
    if (!targetSubtaskId) {
      const placeholder = await this.prisma.subtask.create({
        data: { taskId: task.id, year: 2026, title: parsedTask.title, sortOrder: 1 },
      });
      targetSubtaskId = placeholder.id;
      summary.subtasks += 1;
    }

    for (const report of parsedTask.quarterlyReports) {
      const reportingPeriod = await this.prisma.reportingPeriod.findUnique({
        where: { year_quarter: { year: 2026, quarter: report.quarter } },
      });
      if (!reportingPeriod) {
        this.logger.warn(`Отчётный период 2026 Q${report.quarter} не найден, отчёт из строки ${report.rowNumber} пропущен`);
        continue;
      }

      const departmentMentions = report.departmentMentions.length > 0 ? report.departmentMentions : ['Не указан'];

      for (const mention of departmentMentions) {
        const department = await this.resolveDepartment(mention, summary);

        await this.prisma.subtaskDepartment.upsert({
          where: { subtaskId_departmentId: { subtaskId: targetSubtaskId, departmentId: department.id } },
          update: {},
          create: { subtaskId: targetSubtaskId, departmentId: department.id, role: 'owner' },
        });

        const quarterlyReport = await this.prisma.quarterlyReport.upsert({
          where: {
            subtaskId_reportingPeriodId_departmentId: {
              subtaskId: targetSubtaskId,
              reportingPeriodId: reportingPeriod.id,
              departmentId: department.id,
            },
          },
          update: { content: report.reportText, status: 'completed' },
          create: {
            subtaskId: targetSubtaskId,
            reportingPeriodId: reportingPeriod.id,
            departmentId: department.id,
            content: report.reportText,
            status: 'completed',
          },
        });
        summary.reports += 1;

        await this.logImportRun(fileName, sheetName, report.rowNumber, 'quarterly_report', quarterlyReport.id, report.rawText);
      }
    }
  }

  private async resolveDepartment(mention: string, summary: ImportSummary) {
    const alias = matchDepartmentAlias(mention);
    if (alias) {
      return this.prisma.department.upsert({
        where: { code: alias.code },
        update: {},
        create: { code: alias.code, name: alias.name },
      });
    }

    const code = slugifyDepartmentCode(mention);
    const existing = await this.prisma.department.findUnique({ where: { code } });
    if (existing) return existing;

    summary.departmentsCreated += 1;
    return this.prisma.department.create({ data: { code, name: mention } });
  }

  private logImportRun(fileName: string, sheetName: string, rowNumber: number, entityType: string, entityId: string, rawCell: string) {
    return this.prisma.excelImportRun.create({
      data: { fileName, sheetName, rowNumber, entityType, entityId, rawCell: rawCell.slice(0, 2000) },
    });
  }
}
