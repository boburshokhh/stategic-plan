import type { ReactNode } from "react";
import styles from "./Badge.module.css";

export type BadgeVariant = "success" | "warning" | "danger" | "info" | "secondary" | "primary";

interface BadgeProps {
  variant: BadgeVariant;
  pill?: boolean;
  children: ReactNode;
}

/** Label-бейдж (мягкий фон) по умолчанию; pill — сплошная заливка для счётчиков. */
export function Badge({ variant, pill, children }: BadgeProps) {
  return <span className={[styles.badge, styles[variant], pill ? styles.pill : ""].join(" ")}>{children}</span>;
}
