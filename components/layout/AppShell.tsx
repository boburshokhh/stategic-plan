"use client";

import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { MobileNavProvider, useMobileNav } from "../../lib/layout/MobileNavContext";
import styles from "./AppShell.module.css";

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { isOpen, close } = useMobileNav();

  return (
    <div className={styles.shell}>
      {isOpen && (
        <button type="button" className={styles.overlay} onClick={close} aria-label="Закрыть меню" />
      )}
      <Sidebar />
      <div className={styles.content}>
        <Navbar />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <MobileNavProvider>
      <AppShellInner>{children}</AppShellInner>
    </MobileNavProvider>
  );
}
