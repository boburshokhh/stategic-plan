/**
 * Соответствие "сырых" названий отделов, встречающихся в ячейках квартальных
 * отчётов Excel, каноническим кодам departments.code (см. prisma/seed.ts).
 * Ключи проверяются как подстроки (без учёта регистра), поэтому порядок
 * важен: более специфичные варианты должны идти раньше общих.
 */
export const DEPARTMENT_ALIASES: Array<{ pattern: RegExp; code: string; name: string }> = [
  { pattern: /отдел\s+тбиоос/i, code: 'TBIOOS', name: 'Отдел ТБиООС' },
  { pattern: /\bтбиоос\b/i, code: 'TBIOOS', name: 'Отдел ТБиООС' },
  { pattern: /отдел\s+кадров/i, code: 'HR', name: 'Отдел кадров' },
  { pattern: /оциа/i, code: 'OCIA', name: 'Отдел цифровизации и автоматизации' },
  { pattern: /отдел\s+по\s+управлению\s+трубопроводом|\bоут\b/i, code: 'OUT', name: 'Отдел управления трубопроводом' },
  { pattern: /\bцду\b/i, code: 'CDU', name: 'Центральное диспетчерское управление' },
  { pattern: /\bахо\b/i, code: 'AHO', name: 'Административно-хозяйственный отдел' },
  { pattern: /\botv\b|\bотв\b/i, code: 'OTV', name: 'Отдел технических вопросов' },
];

/** Слэйгифицирует нераспознанное название отдела в код для создания нового справочного значения. */
export function slugifyDepartmentCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-ZА-Я0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30) || 'UNKNOWN';
}

/**
 * Извлекает из "сырого" фрагмента ("ОТВ и Отдел ТБиООС", "АХО и Отдел ТБиООС ")
 * список отдельных названий отделов, упомянутых через союз "и" или запятую.
 */
export function splitDepartmentMentions(raw: string): string[] {
  return raw
    .split(/\s+и\s+|,/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function matchDepartmentAlias(raw: string): { code: string; name: string } | null {
  for (const alias of DEPARTMENT_ALIASES) {
    if (alias.pattern.test(raw)) {
      return { code: alias.code, name: alias.name };
    }
  }
  return null;
}

/**
 * Ищет упоминание отдела в самом начале текста (без разделителя переносом
 * строки), например "Отдел кадров собирается информация...". Возвращает
 * длину совпавшего префикса, чтобы вызывающий код мог отделить его от текста.
 */
export function matchDepartmentPrefix(text: string): { code: string; name: string; matchedLength: number } | null {
  for (const alias of DEPARTMENT_ALIASES) {
    const anchored = new RegExp(`^\\s*(?:${alias.pattern.source})`, 'i');
    const match = text.match(anchored);
    if (match) {
      return { code: alias.code, name: alias.name, matchedLength: match[0].length };
    }
  }
  return null;
}
