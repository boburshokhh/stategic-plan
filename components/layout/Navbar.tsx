"use client";

import { usePageHeaderValue } from "../../lib/layout/PageHeaderContext";
import { Breadcrumbs } from "./Breadcrumbs";
import { PeriodSelector } from "./PeriodSelector";
import styles from "./Navbar.module.css";

export function Navbar() {
  const { title, breadcrumbs } = usePageHeaderValue();

  return (
    <header className={styles.navbar}>
      <div className={styles.titleBlock}>
        <Breadcrumbs items={breadcrumbs} />
        <h1 className={styles.title}>{title}</h1>
      </div>
      <PeriodSelector />
    </header>
  );
}
