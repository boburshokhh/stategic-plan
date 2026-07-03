import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import styles from "./ErrorAlert.module.css";

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorAlert({ message, onRetry }: ErrorAlertProps) {
  return (
    <div className={styles.alert}>
      <AlertTriangle size={18} />
      <span className={styles.message}>{message}</span>
      {onRetry && (
        <Button variant="outline" size="small" onClick={onRetry}>
          Повторить
        </Button>
      )}
    </div>
  );
}
