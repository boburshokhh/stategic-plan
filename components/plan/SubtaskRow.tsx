import type { Subtask } from "../../lib/api/types";
import { DepartmentChip } from "../ui/DepartmentChip";
import { OwnDepartmentProgress } from "./OwnDepartmentProgress";
import styles from "./SubtaskRow.module.css";

interface SubtaskRowProps {
  subtask: Subtask;
  ownDepartmentId?: string | null;
  periodId?: string;
  onClick: () => void;
}

export function SubtaskRow({ subtask, ownDepartmentId, periodId, onClick }: SubtaskRowProps) {
  const isOwn = ownDepartmentId ? subtask.departments?.some((d) => d.departmentId === ownDepartmentId) : false;

  return (
    <div className={[styles.row, isOwn ? styles.rowOwn : ""].join(" ")} onClick={onClick}>
      <div className={styles.titleBlock}>
        <span className={styles.title}>{subtask.title}</span>
        {subtask.expectedResult && <span className={styles.expectedResult}>{subtask.expectedResult}</span>}
      </div>

      {isOwn && ownDepartmentId && (
        <OwnDepartmentProgress subtaskId={subtask.id} periodId={periodId} departmentId={ownDepartmentId} />
      )}

      <div className={styles.chips}>
        {subtask.departments?.map((assignment) => (
          <DepartmentChip
            key={assignment.id}
            name={assignment.department.shortName ?? assignment.department.name}
            role={assignment.role}
          />
        ))}
      </div>
    </div>
  );
}
