"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../lib/auth/AuthContext";
import { PageHeaderProvider } from "../../lib/layout/PageHeaderContext";
import { NotificationProvider } from "../../lib/notifications/NotificationContext";
import { AppShell } from "../../components/layout/AppShell";
import { NotificationToaster } from "../../components/ui/NotificationToaster";
import { EmptyState } from "../../components/ui/EmptyState";

function FullScreenState({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {children}
    </div>
  );
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <FullScreenState>
        <Loader2 size={28} className="spin" color="var(--color-primary)" />
      </FullScreenState>
    );
  }

  if (!user) {
    return null;
  }

  if (user.role === "dept_user" && !user.departmentId) {
    return (
      <FullScreenState>
        <EmptyState
          title="Пользователь не привязан к отделу"
          description="Обратитесь к администратору системы, чтобы получить доступ к разделу «Отделы»."
        />
      </FullScreenState>
    );
  }

  return (
    <NotificationProvider>
      <PageHeaderProvider>
        <AppShell>{children}</AppShell>
        <NotificationToaster />
      </PageHeaderProvider>
    </NotificationProvider>
  );
}
