import { Settings, Users, Monitor, Shield, Leaf } from "lucide-react";
import type { DashboardDirectionStat } from "../../lib/api/types";
import { Badge } from "../ui/Badge";
import styles from "./DirectionHealthGrid.module.css";

const DIRECTION_ICONS: Record<string, typeof Settings> = {
  A: Settings,
  B: Users,
  C: Monitor,
  D: Shield,
  E: Leaf,
};

function progressVariant(percent: number) {
  if (percent < 50) return styles.fillDanger;
  if (percent < 80) return styles.fillWarning;
  return styles.fillSuccess;
}

export function DirectionHealthGrid({ directions }: { directions: DashboardDirectionStat[] }) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>Состояние направлений</h3>
      </div>
      <div className={styles.grid}>
        {directions.map((direction) => {
          const Icon = DIRECTION_ICONS[direction.directionCode] ?? Settings;
          return (
            <div key={direction.directionId} className={styles.card}>
              <div className={styles.iconWrap}>
                <Icon size={20} strokeWidth={1.75} />
              </div>
              <div className={styles.name}>{direction.directionName}</div>
              <div className={styles.meta}>
                <span>Прогресс</span>
                <span>{direction.completenessPercent}%</span>
              </div>
              <div className={styles.track}>
                <div
                  className={[styles.fill, progressVariant(direction.completenessPercent)].join(" ")}
                  style={{ width: `${direction.completenessPercent}%` }}
                />
              </div>
              <div className={styles.badges}>
                <Badge variant="success">{direction.completed} сдано</Badge>
                {direction.inProgress > 0 && <Badge variant="warning">{direction.inProgress} в работе</Badge>}
                {direction.missingCount > 0 && <Badge variant="danger">{direction.missingCount} пропусков</Badge>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
