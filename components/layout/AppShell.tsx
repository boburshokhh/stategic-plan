import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import styles from "./AppShell.module.css";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.content}>
        <Navbar />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
