/** Единые параметры line-иконок Lucide для всего UI. */
export const ICON_STROKE = 1.75;

export const ICON_SIZE = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 20,
} as const;

export type IconSize = keyof typeof ICON_SIZE;

export function iconSize(size: IconSize = "sm") {
  return { size: ICON_SIZE[size], strokeWidth: ICON_STROKE };
}
