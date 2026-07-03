import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import styles from "./Button.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "default" | "danger" | "ghost";
  size?: "default" | "small";
  loading?: boolean;
}

export function Button({
  variant = "default",
  size = "default",
  loading,
  disabled,
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={[styles.button, styles[variant], size === "small" ? styles.small : "", className ?? ""]
        .join(" ")
        .trim()}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 size={14} className="spin" />}
      {children}
    </button>
  );
}
