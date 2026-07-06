import { BadRequestException } from '@nestjs/common';

/** Допустимые типы вложений к отчёту/этапу (department_description.md §2.3): документы и фото. */
export const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
]);

export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

export function attachmentFileFilter(
  _req: unknown,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(file.mimetype)) {
    callback(new BadRequestException('Недопустимый тип файла. Разрешены: PDF, DOC(X), XLS(X), JPG, PNG'), false);
    return;
  }
  callback(null, true);
}
