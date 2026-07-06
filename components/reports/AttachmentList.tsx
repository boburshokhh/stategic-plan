"use client";

import { useRef, useState } from "react";
import {
  Download,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { downloadAttachment } from "../../lib/api/client";
import { useRemoveAttachment, useUploadAttachment } from "../../lib/hooks/useReports";
import { ALLOWED_ATTACHMENT_EXTENSIONS, ALLOWED_ATTACHMENT_MIME_TYPES, MAX_ATTACHMENT_SIZE_BYTES } from "../../lib/api/attachment-constraints";
import { formatBytes } from "../../lib/format";
import { normalizeFileName } from "../../lib/files/normalizeFileName";
import { iconSize } from "../../lib/icons";
import type { ReportAttachment } from "../../lib/api/types";
import { IconButton } from "../ui/IconButton";
import styles from "./AttachmentList.module.css";

function iconFor(mimeType: string): { Icon: LucideIcon; tone: "pdf" | "sheet" | "image" | "default" } {
  if (mimeType.startsWith("image/")) return { Icon: FileImage, tone: "image" };
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return { Icon: FileSpreadsheet, tone: "sheet" };
  if (mimeType.includes("pdf") || mimeType.includes("word")) return { Icon: FileText, tone: "pdf" };
  return { Icon: File, tone: "default" };
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
        const { Icon, tone } = iconFor(attachment.mimeType);
        const displayName = normalizeFileName(attachment.fileName);
        return (
          <div key={attachment.id} className={styles.item}>
            <div className={styles.itemLeft}>
              <span className={[styles.iconWrap, styles[`icon_${tone}`]].join(" ")}>
                <Icon {...iconSize("sm")} />
              </span>
              <span
                className={styles.name}
                onClick={() => downloadAttachment(reportId, attachment.id, displayName)}
                title="Скачать"
              >
                {displayName}
              </span>
            </div>
            <div className={styles.itemRight}>
              <span className={styles.size}>{formatBytes(attachment.sizeBytes)}</span>
              <IconButton
                variant="primary"
                size="xs"
                label="Скачать файл"
                onClick={() => downloadAttachment(reportId, attachment.id, displayName)}
              >
                <Download {...iconSize("xs")} />
              </IconButton>
              {canEdit && (
                <IconButton
                  variant="danger"
                  size="xs"
                  label="Удалить файл"
                  onClick={() => removeMutation.mutate(attachment.id)}
                >
                  <Trash2 {...iconSize("xs")} />
                </IconButton>
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
            {uploadMutation.isPending ? (
              <Loader2 {...iconSize("sm")} className="spin" />
            ) : (
              <Upload {...iconSize("sm")} />
            )}
            {uploadMutation.isPending ? "Загрузка…" : "Прикрепить файл"}
          </button>
        </div>
      )}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
