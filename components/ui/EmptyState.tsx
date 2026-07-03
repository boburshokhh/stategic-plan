import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.wrapper}>
      <Icon size={40} className={styles.icon} strokeWidth={1.5} />
      <div className={styles.title}>{title}</div>
      {description && <div className={styles.description}>{description}</div>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
