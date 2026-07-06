"use client";

import { useState, type FormEvent } from "react";
import { PlusCircle } from "lucide-react";
import { useCreateReportItem } from "../../lib/hooks/useReports";
import { Input } from "../ui/FormField";
import { Button } from "../ui/Button";
import styles from "./AddReportItemForm.module.css";

export function AddReportItemForm({ reportId }: { reportId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const createMutation = useCreateReportItem(reportId);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    createMutation.mutate(
      { title: trimmed },
      {
        onSuccess: () => {
          setTitle("");
          setIsOpen(false);
        },
      },
    );
  }

  if (!isOpen) {
    return (
      <button type="button" className={styles.addButton} onClick={() => setIsOpen(true)}>
        <PlusCircle size={20} />
        Добавить шаг
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <Input
        placeholder="Название нового этапа"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        autoFocus
        className={styles.input}
      />
      <div className={styles.actions}>
        <Button type="submit" variant="primary" loading={createMutation.isPending} disabled={!title.trim()}>
          Добавить
        </Button>
        <Button type="button" variant="outline" onClick={() => { setIsOpen(false); setTitle(""); }}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
