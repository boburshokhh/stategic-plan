/**
 * Multer/busboy передаёт UTF-8 имена файлов из multipart как latin1-строку.
 * В UI это выглядит как «Ð¶Ð°Ñ.pdf» вместо «жая.pdf».
 */
export function normalizeUploadedFileName(name: string): string {
  if (!name) return name;

  const hasCyrillic = /[\u0400-\u04FF]/.test(name);
  const looksLikeMojibake = /[ÃÐÑÂâ]/.test(name);

  if (hasCyrillic && !looksLikeMojibake) {
    return name;
  }

  const decoded = Buffer.from(name, 'latin1').toString('utf8');
  if (decoded === name || decoded.includes('\uFFFD')) {
    return name;
  }

  const decodedHasCyrillic = /[\u0400-\u04FF]/.test(decoded);
  if (decodedHasCyrillic || looksLikeMojibake) {
    return decoded;
  }

  return name;
}
