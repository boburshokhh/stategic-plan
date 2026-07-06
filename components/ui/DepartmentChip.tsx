import type { SubtaskDepartmentRole } from "../../lib/api/types";
import styles from "./DepartmentChip.module.css";

interface DepartmentChipProps {
  name: string;
  role: SubtaskDepartmentRole;
}

export function DepartmentChip({ name, role }: DepartmentChipProps) {
  const label = role === "owner" ? `ОТВ: ${name}` : name;
  return <span className={[styles.chip, styles[role]].join(" ")}>{label}</span>;
}
