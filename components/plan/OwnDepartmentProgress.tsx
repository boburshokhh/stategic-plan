import { useBySubtaskReports } from "../../lib/hooks/useReports";
import { CompletenessBar } from "../ui/CompletenessBar";

interface OwnDepartmentProgressProps {
  subtaskId: string;
  periodId?: string;
  departmentId: string;
}

/** Мини-прогресс подзадачи для своего отдела (DESING.md §6: SubtaskRow). */
export function OwnDepartmentProgress({ subtaskId, periodId, departmentId }: OwnDepartmentProgressProps) {
  const { data: reports } = useBySubtaskReports(subtaskId, periodId);
  const ownReport = reports?.find((report) => report.departmentId === departmentId);

  if (!ownReport) return null;

  return (
    <div style={{ width: 96 }}>
      <CompletenessBar percent={ownReport.progress.progressPercent} showLabel={false} />
    </div>
  );
}
