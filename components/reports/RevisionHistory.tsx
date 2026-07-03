"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, History } from "lucide-react";
import type { ReportRevision } from "../../lib/api/types";
import { formatDateTime } from "../../lib/format";

export function RevisionHistory({ revisions }: { revisions: ReportRevision[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (revisions.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--color-text-body)",
          fontSize: "0.8125rem",
        }}
      >
        <History size={14} />
        История изменений ({revisions.length})
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {isOpen && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {revisions.map((revision) => (
            <div
              key={revision.id}
              style={{
                borderLeft: "2px solid var(--color-border)",
                paddingLeft: 12,
                fontSize: "0.8125rem",
              }}
            >
              <div style={{ color: "var(--color-text-body)", marginBottom: 4 }}>
                {formatDateTime(revision.changedAt)} · {revision.changedBy?.fullName ?? "—"}
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>{revision.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
