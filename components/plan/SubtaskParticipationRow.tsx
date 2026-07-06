import type { SubtaskParticipationItem } from "../../lib/api/types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import styles from "./SubtaskParticipationRow.module.css";

interface SubtaskParticipationRowProps {
  item: SubtaskParticipationItem;
  selected: boolean;
  onToggle: (subtaskId: string) => void;
  onUnenroll?: (subtaskId: string) => void;
  unenrolling?: boolean;
}

export function SubtaskParticipationRow({
  item,
  selected,
  onToggle,
  onUnenroll,
  unenrolling,
}: SubtaskParticipationRowProps) {
  const isOwner = item.enrollment?.role === "owner";
  const isParticipant = item.enrollment?.role === "participant";
  const canSelect = !item.enrollment;

  return (
    <div className={[styles.row, isParticipant || isOwner ? styles.rowEnrolled : ""].join(" ")}>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={selected}
          disabled={!canSelect}
          onChange={() => onToggle(item.subtaskId)}
          title={isOwner ? "Назначен ответственным" : isParticipant ? "Уже участник" : undefined}
        />
        <div className={styles.titleBlock}>
          <span className={styles.title}>{item.title}</span>
          {item.expectedResult && <span className={styles.expectedResult}>{item.expectedResult}</span>}
        </div>
      </label>

      <div className={styles.actions}>
        {isOwner && <Badge variant="primary">Ответственный</Badge>}
        {isParticipant && <Badge variant="secondary">Участник</Badge>}
        {item.canUnenroll && onUnenroll && (
          <Button
            type="button"
            variant="outline"
            size="small"
            loading={unenrolling}
            onClick={() => onUnenroll(item.subtaskId)}
          >
            Снять участие
          </Button>
        )}
      </div>
    </div>
  );
}
