"use client";

import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import type { NotificationVariant } from "../../lib/notifications/NotificationContext";
import { useNotification } from "../../lib/notifications/NotificationContext";
import styles from "./NotificationToaster.module.css";

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
} as const;

function Toast({ id, variant, title, message }: { id: string; variant: NotificationVariant; title: string; message?: string }) {
  const { dismiss } = useNotification();
  const Icon = ICONS[variant];

  return (
    <div className={[styles.toast, styles[variant]].join(" ")} role="status" aria-live="polite">
      <div className={styles.iconWrap}>
        <Icon size={16} />
      </div>
      <div className={styles.content}>
        <div className={styles.title}>{title}</div>
        {message && <div className={styles.message}>{message}</div>}
      </div>
      <button type="button" className={styles.dismiss} onClick={() => dismiss(id)} aria-label="Закрыть">
        <X size={16} />
      </button>
    </div>
  );
}

export function NotificationToaster() {
  const { notifications } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className={styles.toaster} aria-label="Уведомления">
      {notifications.map((item) => (
        <Toast key={item.id} {...item} />
      ))}
    </div>
  );
}
