/** Зеркалит backend/src/modules/quarterly-reports/attachment-file-filter.util.ts для клиентской валидации до загрузки. */
export const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
]);

export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_EXTENSIONS = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png";
