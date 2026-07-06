import * as XLSX from 'xlsx';
import { matchDepartmentPrefix, splitDepartmentMentions } from './department-aliases';

/** Листы плана, содержащие иерархию задач/подзадач. Дашборд и черновой лист "Кадры new" пропускаются. */
export const DIRECTION_SHEETS = ['Эксплуатация', 'Кадры', 'Цифровизация', 'HSE', 'Зеленая энергетика'];

const SUBTASK_YEARS = [2026, 2027, 2028];

export interface ParsedQuarterlyReport {
  quarter: number;
  rawText: string;
  departmentMentions: string[];
  reportText: string;
  rowNumber: number;
}

export interface ParsedSubtask {
  year: number;
  title: string;
  rowNumber: number;
}

export interface ParsedTask {
  number: number | null;
  title: string;
  rowNumber: number;
  subtasksByYear: Record<number, ParsedSubtask[]>;
  /** Отчёты за 2026 год, встреченные на строках этой задачи (см. ограничение алгоритма в import.service.ts). */
  quarterlyReports: ParsedQuarterlyReport[];
}

export interface ParsedDirection {
  sheetName: string;
  title: string;
  yearThemes: Record<number, string>;
  tasks: ParsedTask[];
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/** Разбирает всю книгу Excel в структурированное представление направлений/задач/подзадач/отчётов. */
export function parseWorkbookBuffer(buffer: Buffer): ParsedDirection[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const directions: ParsedDirection[] = [];

  for (const sheetName of DIRECTION_SHEETS) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null, raw: true });
    directions.push(parseDirectionSheet(sheetName, rows));
  }

  return directions;
}

function parseDirectionSheet(sheetName: string, rows: unknown[][]): ParsedDirection {
  const headerRowIndex = rows.findIndex((row) => cellText(row?.[0]) === '№');
  if (headerRowIndex === -1) {
    throw new Error(`Не найдена строка заголовка (колонка "№") на листе "${sheetName}"`);
  }

  const headerRow = rows[headerRowIndex];
  const directionTitle = cellText(headerRow?.[2]) || sheetName;

  // Строка ниже заголовка содержит года (2026/2027/2028), ещё одна ниже - тексты
  // годовых тем и заголовки квартальных колонок ("2026 год N квартал").
  const themesRowIndex = headerRowIndex + 2;
  const themesRow = rows[themesRowIndex] ?? [];

  const yearThemes: Record<number, string> = {};
  SUBTASK_YEARS.forEach((year, idx) => {
    const text = cellText(themesRow[2 + idx]);
    if (text) yearThemes[year] = text;
  });

  const quarterColumns = detectQuarterColumns(themesRow);

  const tasks: ParsedTask[] = [];
  let currentTask: ParsedTask | null = null;

  for (let rowIndex = themesRowIndex + 1; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex] ?? [];
    const numberCell = cellText(row[0]);
    const titleCell = cellText(row[1]);

    if (/^\d+$/.test(numberCell)) {
      currentTask = {
        number: Number(numberCell),
        title: titleCell,
        rowNumber: rowIndex + 1,
        subtasksByYear: { 2026: [], 2027: [], 2028: [] },
        quarterlyReports: [],
      };
      tasks.push(currentTask);
    }

    if (!currentTask) {
      continue;
    }

    SUBTASK_YEARS.forEach((year, idx) => {
      const text = cellText(row[2 + idx]);
      if (text) {
        currentTask!.subtasksByYear[year].push({ year, title: text, rowNumber: rowIndex + 1 });
      }
    });

    for (const { column, quarter } of quarterColumns) {
      const text = cellText(row[column]);
      if (!text) continue;
      const { departmentMentions, reportText } = splitDepartmentAndText(text);
      currentTask.quarterlyReports.push({
        quarter,
        rawText: text,
        departmentMentions,
        reportText,
        rowNumber: rowIndex + 1,
      });
    }
  }

  return { sheetName, title: directionTitle, yearThemes, tasks };
}

function detectQuarterColumns(themesRow: unknown[]): Array<{ column: number; quarter: number }> {
  const result: Array<{ column: number; quarter: number }> = [];
  themesRow.forEach((cell, column) => {
    const match = cellText(cell).match(/(\d)\s*квартал/i);
    if (match) {
      result.push({ column, quarter: Number(match[1]) });
    }
  });
  return result;
}

const MAX_DEPARTMENT_LINE_LENGTH = 80;

/**
 * Отдел обычно указан на первой строке ячейки, а текст отчёта - после
 * переноса строки (например "ОТВ\r\nВыполнено за I квартал: ..."). Если
 * переноса нет, отдел бывает написан слитно с текстом ("Отдел кадров
 * собирается информация...") - в этом случае ищем известный алиас в начале
 * строки.
 */
function splitDepartmentAndText(raw: string): { departmentMentions: string[]; reportText: string } {
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const newlineIndex = normalized.indexOf('\n');

  if (newlineIndex !== -1) {
    const firstLine = normalized.slice(0, newlineIndex).trim();
    const rest = normalized.slice(newlineIndex + 1).trim();
    if (firstLine && firstLine.length <= MAX_DEPARTMENT_LINE_LENGTH) {
      return { departmentMentions: splitDepartmentMentions(firstLine), reportText: rest || firstLine };
    }
  }

  const prefixMatch = matchDepartmentPrefix(normalized);
  if (prefixMatch) {
    return {
      departmentMentions: [prefixMatch.name],
      reportText: normalized.slice(prefixMatch.matchedLength).trim(),
    };
  }

  return { departmentMentions: [], reportText: normalized };
}
