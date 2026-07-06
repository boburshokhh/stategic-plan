"use client";

import { useState } from "react";
import { ChevronRight, History } from "lucide-react";
import type { ReportRevision } from "../../lib/api/types";
import { formatDateTime } from "../../lib/format";
import { iconSize } from "../../lib/icons";
import styles from "./RevisionHistory.module.css";

export function RevisionHistory({ revisions }: { revisions: ReportRevision[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (revisions.length === 0) return null;

  return (
    <div>
      <button type="button" className={styles.toggle} onClick={() => setIsOpen((open) => !open)}>
        <History {...iconSize("sm")} className={styles.toggleIcon} />
        История изменений ({revisions.length})
        <ChevronRight
          {...iconSize("xs")}
          className={[styles.chevron, isOpen ? styles.chevronOpen : ""].join(" ").trim()}
        />
      </button>

      {isOpen && (
        <div className={styles.list}>
          {revisions.map((revision) => (
            <div key={revision.id} className={styles.entry}>
              <div className={styles.meta}>
                {formatDateTime(revision.changedAt)} · {revision.changedBy?.fullName ?? "—"}
              </div>
              <div className={styles.content}>{revision.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
