import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';

/** Локальное файловое хранилище вложений: backend/uploads/reports/<reportId>/<uuid>-<name>. */
const UPLOADS_ROOT = join(process.cwd(), 'uploads', 'reports');

export async function saveAttachmentFile(reportId: string, originalName: string, buffer: Buffer) {
  const dir = join(UPLOADS_ROOT, reportId);
  await mkdir(dir, { recursive: true });
  const storedName = `${randomUUID()}-${originalName.replace(/[^\w.\-]+/g, '_')}`;
  const storagePath = join(dir, storedName);
  await writeFile(storagePath, buffer);
  return storagePath;
}

export async function deleteAttachmentFile(storagePath: string) {
  await unlink(storagePath).catch(() => undefined);
}
