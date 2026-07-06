import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";
import styles from "./ErrorAlert.module.css";

export type AlertVariant = "error" | "success" | "warning" | "info";

interface ErrorAlertProps {
  message: string;
  variant?: AlertVariant;
  onRetry?: () => void;
  onDismiss?: () => void;
  action?: ReactNode;
}

const ICONS = {
  error: AlertTriangle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
} as const;

export function ErrorAlert({ message, variant = "error", onRetry, onDismiss, action }: ErrorAlertProps) {
  const Icon = ICONS[variant];

  return (
    <div className={[styles.alert, styles[variant]].join(" ")} role="alert">
      <Icon size={18} className={styles.icon} />
      <span className={styles.message}>{message}</span>
      {action}
      {onRetry && (
        <Button variant="outline" size="small" onClick={onRetry}>
          Повторить
        </Button>
      )}
      {onDismiss && !onRetry && (
        <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label="Закрыть">
          ×
        </button>
      )}
    </div>
  );
}
