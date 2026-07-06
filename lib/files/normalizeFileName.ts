/**
 * Исправляет mojibake в именах файлов (UTF-8, ошибочно прочитанный как Latin-1).
 * Дублирует backend normalize-uploaded-file-name.util.ts для отображения в UI.
 */
export function normalizeFileName(name: string): string {
  if (!name) return name;

  const hasCyrillic = /[\u0400-\u04FF]/.test(name);
  const looksLikeMojibake = /[ÃÐÑÂâ]/.test(name);

  if (hasCyrillic && !looksLikeMojibake) {
    return name;
  }

  const bytes = new Uint8Array([...name].map((char) => char.charCodeAt(0) & 0xff));
  const decoded = new TextDecoder("utf-8").decode(bytes);

  if (decoded === name || decoded.includes("\uFFFD")) {
    return name;
  }

  const decodedHasCyrillic = /[\u0400-\u04FF]/.test(decoded);
  if (decodedHasCyrillic || looksLikeMojibake) {
    return decoded;
  }

  return name;
}
