import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./IconButton.module.css";

type IconButtonVariant = "ghost" | "muted" | "primary" | "danger" | "chip";
type IconButtonSize = "xs" | "sm" | "md";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  label: string;
  children: ReactNode;
}

export function IconButton({
  variant = "ghost",
  size = "sm",
  label,
  children,
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={[styles.button, styles[variant], styles[size], className ?? ""].join(" ").trim()}
      {...rest}
    >
      {children}
    </button>
  );
}
