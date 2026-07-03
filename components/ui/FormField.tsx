import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import styles from "./FormField.module.css";

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, hint, error, children }: FieldProps) {
  return (
    <div className={styles.field}>
      {label && <label className={styles.label}>{label}</label>}
      {children}
      {error ? <span className={styles.error}>{error}</span> : hint ? <span className={styles.hint}>{hint}</span> : null}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input className={[styles.control, className ?? ""].join(" ").trim()} {...rest} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea className={[styles.control, className ?? ""].join(" ").trim()} {...rest} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props;
  return <select className={[styles.control, className ?? ""].join(" ").trim()} {...rest} />;
}
