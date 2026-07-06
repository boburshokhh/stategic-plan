"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type NotificationVariant = "success" | "error" | "warning" | "info";

export interface NotificationItem {
  id: string;
  variant: NotificationVariant;
  title: string;
  message?: string;
}

interface NotifyOptions {
  variant: NotificationVariant;
  title: string;
  message?: string;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  notify: (options: NotifyOptions) => void;
  dismiss: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const AUTO_DISMISS_MS = 5000;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setNotifications((items) => items.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    ({ variant, title, message }: NotifyOptions) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setNotifications((items) => [...items, { id, variant, title, message }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notifications, notify, dismiss }), [notifications, notify, dismiss]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
}
