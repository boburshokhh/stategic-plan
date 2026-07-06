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

function statusSelectClass(status: ReportStatus) {
  if (status === "completed") return styles.statusSelectCompleted;
  if (status === "in_progress") return styles.statusSelectInProgress;
  return styles.statusSelectNotStarted;
}

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

  const isInProgress = item.status === "in_progress";

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
    <article className={[styles.item, isInProgress ? styles.itemInProgress : ""].join(" ").trim()}>
      {isInProgress && <div className={styles.itemAccent} aria-hidden />}

      <div className={[styles.headerRow, isInProgress ? styles.headerRowAccent : ""].join(" ").trim()}>
        <div className={styles.headerLeft}>
          {canEdit && (
            <div className={styles.orderControls}>
              <button type="button" className={styles.orderButton} disabled={isFirst} onClick={() => onMove("up")} aria-label="Переместить вверх">
                <ChevronUp size={16} />
              </button>
              <button type="button" className={styles.orderButton} disabled={isLast} onClick={() => onMove("down")} aria-label="Переместить вниз">
                <ChevronDown size={16} />
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
            <div className={styles.titleReadonly}>{item.title}</div>
          )}
        </div>

        <div className={styles.headerActions}>
          {canEdit ? (
            <select
              className={[styles.statusSelect, statusSelectClass(item.status)].join(" ")}
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
            <span className={styles.statusReadonly}>{STATUS_OPTIONS.find((o) => o.value === item.status)?.label}</span>
          )}
          {canEdit && (
            <button type="button" className={styles.deleteButton} onClick={handleRemove} title="Удалить этап">
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      <div className={[styles.body, isInProgress ? styles.bodyAccent : ""].join(" ").trim()}>
        {canEdit ? (
          <Textarea
            placeholder="Описание этапа..."
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onBlur={saveContent}
            rows={3}
          />
        ) : (
          content && <p className={styles.contentReadonly}>{content}</p>
        )}

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Исполнители</div>
          <AssigneeEditor
            reportId={reportId}
            itemId={item.id}
            assignees={item.assignees}
            departmentId={departmentId}
            canEdit={canEdit}
          />
        </div>

        <div className={[styles.section, styles.sectionBordered].join(" ")}>
          <div className={styles.sectionLabel}>Вложения</div>
          <AttachmentList reportId={reportId} itemId={item.id} attachments={item.attachments} canEdit={canEdit} />
        </div>
      </div>
    </article>
  );
}
