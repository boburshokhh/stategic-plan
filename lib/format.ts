export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateShort(value: string) {
  return new Date(value).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function daysUntil(value: string) {
  const target = new Date(value);
  const now = new Date();
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export function formatQuarter(quarter: number) {
  return `Квартал ${quarter}`;
}

export function formatQuarterYear(quarter: number, year: number) {
  return `Квартал ${quarter} ${year}`;
}
