"use client";

import { useState, type FormEvent } from "react";
import { ListPlus, X } from "lucide-react";
import { useCreateReportItem } from "../../lib/hooks/useReports";
import { iconSize } from "../../lib/icons";
import { Input } from "../ui/FormField";
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";
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
        <ListPlus {...iconSize("lg")} />
        Добавить шаг
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formHeader}>
        <ListPlus {...iconSize("sm")} className={styles.formHeaderIcon} />
        <span className={styles.formHeaderTitle}>Новый этап</span>
        <IconButton variant="ghost" size="xs" label="Закрыть" onClick={() => { setIsOpen(false); setTitle(""); }}>
          <X {...iconSize("xs")} />
        </IconButton>
      </div>
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
