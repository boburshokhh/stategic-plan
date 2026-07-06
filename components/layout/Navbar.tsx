"use client";

import { Menu } from "lucide-react";
import { usePageHeaderValue } from "../../lib/layout/PageHeaderContext";
import { useMobileNav } from "../../lib/layout/MobileNavContext";
import { Breadcrumbs } from "./Breadcrumbs";
import { PeriodSelector } from "./PeriodSelector";
import styles from "./Navbar.module.css";

export function Navbar() {
  const { title, breadcrumbs } = usePageHeaderValue();
  const { toggle } = useMobileNav();

  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <button type="button" className={styles.menuButton} onClick={toggle} aria-label="Открыть меню">
          <Menu size={18} strokeWidth={1.75} />
        </button>
        <div className={styles.titleBlock}>
          <Breadcrumbs items={breadcrumbs} />
          <h1 className={styles.title}>{title}</h1>
        </div>
      </div>
      <div className={styles.right}>
        <PeriodSelector />
      </div>
    </header>
  );
}
