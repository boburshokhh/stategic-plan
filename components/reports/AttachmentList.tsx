"use client";

import { useRef, useState } from "react";
import { FileText, FileSpreadsheet, Image as ImageIcon, File as FileIcon, Paperclip, Trash2 } from "lucide-react";
import { downloadAttachment } from "../../lib/api/client";
import { useRemoveAttachment, useUploadAttachment } from "../../lib/hooks/useReports";
import { ALLOWED_ATTACHMENT_EXTENSIONS, ALLOWED_ATTACHMENT_MIME_TYPES, MAX_ATTACHMENT_SIZE_BYTES } from "../../lib/api/attachment-constraints";
import { formatBytes } from "../../lib/format";
import type { ReportAttachment } from "../../lib/api/types";
import styles from "./AttachmentList.module.css";

function iconFor(mimeType: string) {
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return FileSpreadsheet;
  if (mimeType.includes("pdf") || mimeType.includes("word")) return FileText;
  return FileIcon;
}

interface AttachmentListProps {
  reportId: string;
  itemId: string | null;
  attachments: ReportAttachment[];
  canEdit: boolean;
}

export function AttachmentList({ reportId, itemId, attachments, canEdit }: AttachmentListProps) {
  const uploadMutation = useUploadAttachment(reportId);
  const removeMutation = useRemoveAttachment(reportId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(file.type)) {
      setError("Недопустимый тип файла. Разрешены: PDF, DOC(X), XLS(X), JPG, PNG");
      return;
    }
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      setError("Файл превышает максимальный размер 10 МБ");
      return;
    }

    uploadMutation.mutate(
      { itemId, file },
      { onError: (uploadError) => setError(uploadError instanceof Error ? uploadError.message : "Не удалось загрузить файл") },
    );
  }

  return (
    <div className={styles.list}>
      {attachments.map((attachment) => {
        const Icon = iconFor(attachment.mimeType);
        return (
          <div key={attachment.id} className={styles.item}>
            <div className={styles.itemLeft}>
              <Icon size={18} className={styles.icon} />
              <span
                className={styles.name}
                onClick={() => downloadAttachment(reportId, attachment.id, attachment.fileName)}
                title="Скачать"
              >
                {attachment.fileName}
              </span>
            </div>
            <div className={styles.itemRight}>
              <span className={styles.size}>{formatBytes(attachment.sizeBytes)}</span>
              {canEdit && (
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => removeMutation.mutate(attachment.id)}
                  title="Удалить"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {canEdit && (
        <div className={styles.uploadRow}>
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_ATTACHMENT_EXTENSIONS}
            style={{ display: "none" }}
            onChange={handleFileSelected}
          />
          <button
            type="button"
            className={styles.uploadLink}
            disabled={uploadMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={18} />
            {uploadMutation.isPending ? "Загрузка…" : "Прикрепить файл"}
          </button>
        </div>
      )}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
