"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth/AuthContext";
import { ApiError } from "../../lib/api/client";
import { Field, Input } from "../../components/ui/FormField";
import { Button } from "../../components/ui/Button";
import { ErrorAlert } from "../../components/ui/ErrorAlert";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(username, password);
      router.replace("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Не удалось выполнить вход");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.title}>Стратегический план</div>
          <div className={styles.subtitle}>Asia Trans Gas · 2026–2028</div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <Field label="Логин">
            <Input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </Field>
          <Field label="Пароль">
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </Field>

          {error && <ErrorAlert message={error} />}

          <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
            Войти
          </Button>
        </form>
      </div>
    </div>
  );
}
