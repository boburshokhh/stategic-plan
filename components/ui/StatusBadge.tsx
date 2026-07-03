import { Badge, type BadgeVariant } from "./Badge";
import type { ReportStatus, SummaryStatus } from "../../lib/api/types";

const REPORT_STATUS_MAP: Record<ReportStatus, { label: string; variant: BadgeVariant }> = {
  not_started: { label: "Не начато", variant: "secondary" },
  in_progress: { label: "В работе", variant: "warning" },
  completed: { label: "Выполнено", variant: "success" },
};

const SUMMARY_STATUS_MAP: Record<SummaryStatus, { label: string; variant: BadgeVariant }> = {
  draft: { label: "Черновик", variant: "warning" },
  approved: { label: "Утверждена", variant: "success" },
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  const { label, variant } = REPORT_STATUS_MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function SummaryStatusBadge({ status }: { status: SummaryStatus }) {
  const { label, variant } = SUMMARY_STATUS_MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}
