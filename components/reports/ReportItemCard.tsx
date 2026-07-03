"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import type { ReportItem, ReportStatus } from "../../lib/api/types";
import { useRemoveReportItem, useUpdateReportItem } from "../../lib/hooks/useReports";
import { Textarea } from "../ui/FormField";
import { AssigneeEditor } from "./AssigneeEditor";
import { AttachmentList } from "./AttachmentList";
import styles from "./ReportItemCard.module.css";

const STATUS_OPTIONS: Array<{ value: ReportStatus; label: string }> = [
  { value: "not_started", label: "Не начато" },
  { value: "in_progress", label: "В работе" },
  { value: "completed", label: "Выполнено" },
];

interface ReportItemCardProps {
  reportId: string;
  item: ReportItem;
  departmentId?: string | null;
  canEdit: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: "up" | "down") => void;
}

export function ReportItemCard({ reportId, item, departmentId, canEdit, isFirst, isLast, onMove }: ReportItemCardProps) {
  const updateMutation = useUpdateReportItem(reportId);
  const removeMutation = useRemoveReportItem(reportId);
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content);

  function saveTitle() {
    if (title.trim() && title !== item.title) {
      updateMutation.mutate({ itemId: item.id, dto: { title: title.trim() } });
    } else if (!title.trim()) {
      setTitle(item.title);
    }
  }

  function saveContent() {
    if (content !== item.content) {
      updateMutation.mutate({ itemId: item.id, dto: { content } });
    }
  }

  function handleStatusChange(status: ReportStatus) {
    updateMutation.mutate({ itemId: item.id, dto: { status } });
  }

  function handleRemove() {
    if (window.confirm(`Удалить этап «${item.title}»?`)) {
      removeMutation.mutate(item.id);
    }
  }

  return (
    <div className={styles.item}>
      <div className={styles.headerRow}>
        {canEdit && (
          <div className={styles.orderControls}>
            <button type="button" className={styles.orderButton} disabled={isFirst} onClick={() => onMove("up")}>
              <ChevronUp size={14} />
            </button>
            <button type="button" className={styles.orderButton} disabled={isLast} onClick={() => onMove("down")}>
              <ChevronDown size={14} />
            </button>
          </div>
        )}

        {canEdit ? (
          <input
            className={styles.titleInput}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={saveTitle}
          />
        ) : (
          <div className={styles.titleInput}>{item.title}</div>
        )}

        <div className={styles.headerActions}>
          {canEdit ? (
            <select
              className={styles.statusSelect}
              value={item.status}
              onChange={(event) => handleStatusChange(event.target.value as ReportStatus)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <span className={styles.statusSelect}>{STATUS_OPTIONS.find((o) => o.value === item.status)?.label}</span>
          )}
          {canEdit && (
            <button type="button" className={styles.deleteButton} onClick={handleRemove} title="Удалить этап">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {canEdit ? (
        <Textarea
          placeholder="Описание выполненных работ по этапу"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onBlur={saveContent}
          rows={3}
        />
      ) : (
        content && <p style={{ whiteSpace: "pre-wrap" }}>{content}</p>
      )}

      <div>
        <div className={styles.sectionLabel}>Исполнители</div>
        <AssigneeEditor
          reportId={reportId}
          itemId={item.id}
          assignees={item.assignees}
          departmentId={departmentId}
          canEdit={canEdit}
        />
      </div>

      <div>
        <div className={styles.sectionLabel}>Вложения</div>
        <AttachmentList reportId={reportId} itemId={item.id} attachments={item.attachments} canEdit={canEdit} />
      </div>
    </div>
  );
}
