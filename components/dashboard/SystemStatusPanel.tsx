import Link from "next/link";
import { ArrowRight, Upload, Database } from "lucide-react";
import type { ImportStatus } from "../../lib/api/types";
import styles from "./SystemStatusPanel.module.css";

interface SystemStatusPanelProps {
  importStatus: ImportStatus;
}

export function SystemStatusPanel({ importStatus }: SystemStatusPanelProps) {
  const stats = [
    { label: "Направлений", value: importStatus.planStats.directions },
    { label: "Задач", value: importStatus.planStats.tasks },
    { label: "Подзадач", value: importStatus.planStats.subtasks },
    { label: "Отчётов", value: importStatus.planStats.quarterlyReports },
    { label: "Отделов", value: importStatus.planStats.departments },
  ];

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.iconWrap}>
          <Database size={20} strokeWidth={1.75} />
        </div>
        <div>
          <h3 className={styles.title}>Данные плана в системе</h3>
          <p className={styles.subtitle}>
            {importStatus.lastImport
              ? `Импортировано: ${importStatus.lastImport.fileName}`
              : "План ещё не импортирован"}
          </p>
        </div>
        <Link href="/admin/import" className={styles.link}>
          <Upload size={14} />
          Импорт Excel <ArrowRight size={14} />
        </Link>
      </div>
      <div className={styles.stats}>
        {stats.map((item) => (
          <div key={item.label} className={styles.stat}>
            <div className={styles.statValue}>{item.value}</div>
            <div className={styles.statLabel}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
