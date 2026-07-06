import { PrismaClient, ReportStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { existsSync, readFileSync } from 'fs';
import { basename, resolve } from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ImportService } from '../src/modules/import/import.service';
const prisma = new PrismaClient();

const SALT_ROUNDS = 10;
const DEMO_PASSWORD = 'password123';

/** Направления плана в порядке следования листов Excel. */
const DIRECTIONS = [
  { code: 'A', name: 'Эксплуатация', sortOrder: 1 },
  { code: 'B', name: 'Кадры', sortOrder: 2 },
  { code: 'C', name: 'Цифровизация', sortOrder: 3 },
  { code: 'D', name: 'HSE', sortOrder: 4 },
  { code: 'E', name: 'Зелёная энергетика', sortOrder: 5 },
];

/** Отделы-исполнители, встречающиеся в квартальных отчётах Excel. */
const DEPARTMENTS = [
  { code: 'OTV', name: 'Отдел технических вопросов', shortName: 'ОТВ' },
  { code: 'OCIA', name: 'Отдел цифровизации и автоматизации', shortName: 'ОЦиА' },
  { code: 'HR', name: 'Отдел кадров', shortName: 'Отдел кадров' },
  { code: 'CDU', name: 'Центральное диспетчерское управление', shortName: 'ЦДУ' },
  { code: 'TBIOOS', name: 'Отдел техники безопасности и охраны окружающей среды', shortName: 'Отдел ТБиООС' },
  { code: 'OUT', name: 'Отдел управления трубопроводом', shortName: 'ОУТ' },
  { code: 'AHO', name: 'Административно-хозяйственный отдел', shortName: 'АХО' },
];

/** Календарные окна сбора/агрегации отчётности на 2026 год (последние 5 рабочих дней квартала / первые 5 следующего). */
const REPORTING_PERIODS_2026 = [
  { quarter: 1, collectionStart: '2026-03-25', collectionEnd: '2026-03-31', aggregationStart: '2026-04-01', aggregationEnd: '2026-04-07' },
  { quarter: 2, collectionStart: '2026-06-24', collectionEnd: '2026-06-30', aggregationStart: '2026-07-01', aggregationEnd: '2026-07-07' },
  { quarter: 3, collectionStart: '2026-09-24', collectionEnd: '2026-09-30', aggregationStart: '2026-10-01', aggregationEnd: '2026-10-07' },
  { quarter: 4, collectionStart: '2026-12-25', collectionEnd: '2026-12-31', aggregationStart: '2027-01-01', aggregationEnd: '2027-01-07' },
];

/** Демонстрационные этапы для первого отчёта ОТВ после импорта Excel. */
const DEMO_REPORT_ITEMS: Array<{ title: string; status: ReportStatus; content: string; assign: boolean }> = [
  { title: 'Сбор статистики по остановкам за квартал', status: 'completed', content: 'Собраны данные СКАДА и журналов ЦДУ за отчётный период.', assign: true },  { title: 'Классификация причин остановок', status: 'completed', content: 'Причины сгруппированы по 5 категориям, подготовлена сводная таблица.', assign: true },
  { title: 'Сравнение с отраслевыми показателями', status: 'in_progress', content: 'Запрошены бенчмарки у смежных ГТС, ожидается ответ.', assign: true },
  { title: 'Подготовка предложений по снижению аварийности', status: 'not_started', content: '', assign: false },
  { title: 'Согласование предложений с руководством', status: 'not_started', content: '', assign: false },
];

async function main() {
  const plan = await prisma.strategicPlan.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Стратегический план Бухарского ОУМГ СП ООО "Asia Trans Gas"',
      yearFrom: 2026,
      yearTo: 2028,
      status: 'active',
    },
  });

  const directionsByCode: Record<string, { id: string }> = {};
  for (const direction of DIRECTIONS) {
    directionsByCode[direction.code] = await prisma.direction.upsert({
      where: { planId_code: { planId: plan.id, code: direction.code } },
      update: { name: direction.name, sortOrder: direction.sortOrder },
      create: { ...direction, planId: plan.id },
    });
  }

  const departmentsByCode: Record<string, { id: string }> = {};
  for (const department of DEPARTMENTS) {
    departmentsByCode[department.code] = await prisma.department.upsert({
      where: { code: department.code },
      update: { name: department.name, shortName: department.shortName },
      create: department,
    });
  }

  for (const period of REPORTING_PERIODS_2026) {
    await prisma.reportingPeriod.upsert({
      where: { year_quarter: { year: 2026, quarter: period.quarter } },
      update: {},
      create: {
        year: 2026,
        quarter: period.quarter,
        collectionStart: new Date(period.collectionStart),
        collectionEnd: new Date(period.collectionEnd),
        aggregationStart: new Date(period.aggregationStart),
        aggregationEnd: new Date(period.aggregationEnd),
      },
    });
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
  const otvUser = await prisma.user.upsert({
    where: { email: 'otv@atg.local' },
    update: {},
    create: {
      email: 'otv@atg.local',
      passwordHash,
      fullName: 'Иванов Артём Олегович',
      role: 'dept_user',
      departmentId: departmentsByCode.OTV.id,
    },
  });
  await prisma.user.upsert({
    where: { email: 'head@atg.local' },
    update: {},
    create: {
      email: 'head@atg.local',
      passwordHash,
      fullName: 'Каримов Шерзод Баходирович',
      role: 'direction_head',
    },
  });
  await prisma.user.upsert({
    where: { email: 'admin@atg.local' },
    update: {},
    create: {
      email: 'admin@atg.local',
      passwordHash,
      fullName: 'Администратор системы',
      role: 'admin',
    },
  });

  await ensureDevOpenCollectionWindow();

  const excelPath = process.env.EXCEL_IMPORT_PATH;
  if (excelPath) {
    const resolved = resolve(process.cwd(), excelPath);
    if (existsSync(resolved)) {
      const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
      const importService = app.get(ImportService);
      const summary = await importService.importFromBuffer(readFileSync(resolved), basename(resolved));
      console.log(`Excel import: ${summary.directions} направлений, ${summary.tasks} задач, ${summary.subtasks} подзадач, ${summary.reports} отчётов.`);
      await app.close();
      await seedDemoReportItems(otvUser.id, departmentsByCode.OTV.id);
    } else {
      console.warn(`EXCEL_IMPORT_PATH задан, но файл не найден: ${resolved}`);
    }
  } else {
    console.warn('EXCEL_IMPORT_PATH не задан — структура плана не импортирована из Excel.');
  }

  console.log(
    'Seed completed: 1 plan, 5 directions, 7+ departments, 4 reporting periods (2026), ' +
      '3 demo users (otv/head/admin@atg.local, пароль "password123").',
  );
}

/** Добавляет демо-этапы к первому отчёту ОТВ за текущий квартал (если импорт создал отчёт). */
async function seedDemoReportItems(otvUserId: string, otvDepartmentId: string) {
  const devPeriod = await ensureDevOpenCollectionWindow();
  if (!devPeriod) return;

  const otvReport = await prisma.quarterlyReport.findFirst({
    where: { departmentId: otvDepartmentId, reportingPeriodId: devPeriod.id },
    orderBy: { createdAt: 'asc' },
  });
  if (!otvReport) return;

  for (let i = 0; i < DEMO_REPORT_ITEMS.length; i++) {
    const demoItem = DEMO_REPORT_ITEMS[i];
    const existingItem = await prisma.reportItem.findFirst({
      where: { reportId: otvReport.id, sortOrder: i + 1 },
    });
    if (existingItem) continue;

    await prisma.reportItem.create({
      data: {
        reportId: otvReport.id,
        sortOrder: i + 1,
        title: demoItem.title,
        status: demoItem.status,
        content: demoItem.content,
        assignees: demoItem.assign ? { create: [{ userId: otvUserId }] } : undefined,
      },
    });
  }
}
/**
 * Находит ReportingPeriod текущего календарного квартала и при необходимости
 * расширяет его окно сбора так, чтобы оно включало сегодняшний день —
 * это позволяет сразу протестировать заполнение отчёта после запуска seed.
 */
async function ensureDevOpenCollectionWindow() {
  const now = new Date();
  const year = now.getFullYear();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);

  const period = await prisma.reportingPeriod.findUnique({ where: { year_quarter: { year, quarter } } });
  if (!period) {
    return null;
  }

  if (now >= period.collectionStart && now <= period.collectionEnd) {
    return period;
  }

  const collectionStart = new Date(now);
  collectionStart.setDate(collectionStart.getDate() - 2);
  const collectionEnd = new Date(now);
  collectionEnd.setDate(collectionEnd.getDate() + 14);

  const updated = await prisma.reportingPeriod.update({
    where: { id: period.id },
    data: { collectionStart, collectionEnd },
  });

  console.log(
    `Dev-режим: окно сбора ${year} Q${quarter} расширено до ${collectionStart.toISOString().slice(0, 10)} — ` +
      `${collectionEnd.toISOString().slice(0, 10)}, чтобы форму отчёта можно было заполнить прямо сейчас.`,
  );

  return updated;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
