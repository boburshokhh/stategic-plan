import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Button } from "../ui/Button";
import styles from "./PlanPageHeader.module.css";

interface PlanPageHeaderProps {
  title: string;
  yearFrom: number;
  yearTo: number;
  description?: string;
}

export function PlanPageHeader({ title, yearFrom, yearTo, description }: PlanPageHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.text}>
        <h2 className={styles.title}>
          {title} {yearFrom}–{yearTo}
        </h2>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      <div className={styles.actions}>
        <Link href="/reports/my">
          <Button variant="primary">
            <ClipboardList size={18} strokeWidth={1.75} />
            Мои отчёты
          </Button>
        </Link>
      </div>
    </div>
  );
}
