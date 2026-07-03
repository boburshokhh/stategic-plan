import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Breadcrumb } from "../../lib/layout/PageHeaderContext";
import styles from "./Breadcrumbs.module.css";

export function Breadcrumbs({ items }: { items: Breadcrumb[] }) {
  if (items.length === 0) return null;

  return (
    <nav className={styles.trail}>
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {index > 0 && <ChevronRight size={12} />}
          {item.href ? (
            <Link href={item.href} className={styles.link}>
              {item.label}
            </Link>
          ) : (
            <span className={styles.current}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
