import type { ReactNode } from "react";
import styles from "./Card.module.css";

interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  flat?: boolean;
  className?: string;
  children: ReactNode;
}

export function Card({ title, subtitle, actions, flat, className, children }: CardProps) {
  return (
    <div className={[styles.card, flat ? styles.flat : "", className ?? ""].join(" ").trim()}>
      {(title || actions) && (
        <div className={styles.header}>
          <div>
            {title && <div className={styles.title}>{title}</div>}
            {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
