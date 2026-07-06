import type { LucideIcon } from "lucide-react";
import { Cpu, Leaf, ShieldCheck, Users, Wrench } from "lucide-react";

export interface DirectionVisual {
  icon: LucideIcon;
  accentClass: string;
}

const DIRECTION_VISUALS: Record<string, DirectionVisual> = {
  A: { icon: Wrench, accentClass: "primary" },
  B: { icon: Users, accentClass: "warning" },
  C: { icon: Cpu, accentClass: "info" },
  D: { icon: ShieldCheck, accentClass: "secondary" },
  E: { icon: Leaf, accentClass: "success" },
};

const DEFAULT_VISUAL: DirectionVisual = { icon: Wrench, accentClass: "primary" };

export function getDirectionVisual(code: string): DirectionVisual {
  return DIRECTION_VISUALS[code] ?? DEFAULT_VISUAL;
}
