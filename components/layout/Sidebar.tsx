"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, TreePine, LogOut, Upload } from "lucide-react";
import { useAuth } from "../../lib/auth/AuthContext";
import { usePeriod } from "../../lib/period/PeriodContext";
import { useMyReports } from "../../lib/hooks/useReports";
import { useMobileNav } from "../../lib/layout/MobileNavContext";
import { Badge } from "../ui/Badge";
import type { AuthUser, UserRole } from "../../lib/api/types";
import styles from "./Sidebar.module.css";

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function formatUserRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "Администратор";
    case "direction_head":
      return "Руководитель направления";
    case "dept_user":
      return "Сотрудник отдела";
    default:
      return "—";
  }
}

function formatDepartmentName(user: AuthUser) {
  return user.department?.shortName ?? user.department?.name ?? "Отдел не назначен";
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { selectedPeriod } = usePeriod();
  const { isOpen, close } = useMobileNav();
  const { data: myReports } = useMyReports(selectedPeriod?.id);

  const pendingCount = myReports?.filter((report) => report.status !== "completed").length ?? 0;

  const navItems = [
    { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
    ...(user?.role === "dept_user"
      ? [{ href: "/reports/my", label: "Мои отчёты", icon: ClipboardList, count: pendingCount }]
      : []),
    { href: "/plan", label: "Стратегический план", icon: TreePine },
    ...(user?.role === "admin"
      ? [{ href: "/admin/import", label: "Импорт Excel", icon: Upload }]
      : []),
  ];

  return (
    <aside className={[styles.sidebar, isOpen ? styles.sidebarOpen : ""].join(" ")}>
      <div className={styles.brand}>
        <span className={styles.brandTitle}>{user ? formatDepartmentName(user) : "—"}</span>
        <span className={styles.brandSubtitle}>Стратегический план · Asia Trans Gas</span>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className={[styles.navItem, isActive ? styles.navItemActive : ""].join(" ")}
            >
              <Icon size={18} strokeWidth={1.75} />
              <span className={styles.navLabel}>{item.label}</span>
              {"count" in item && item.count! > 0 && <Badge variant="primary" pill>{item.count}</Badge>}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className={styles.userCard}>
          <div className={styles.avatar}>{getInitials(user.fullName)}</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user.fullName}</div>
            <div className={styles.userRole}>{formatUserRole(user.role)}</div>
          </div>
          <button className={styles.logoutButton} onClick={logout} title="Выйти" type="button">
            <LogOut size={16} />
          </button>
        </div>
      )}
    </aside>
  );
}
