"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { useCreateReportItem } from "../../lib/hooks/useReports";
import { Input } from "../ui/FormField";
import { Button } from "../ui/Button";

export function AddReportItemForm({ reportId }: { reportId: string }) {
  const [title, setTitle] = useState("");
  const createMutation = useCreateReportItem(reportId);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    createMutation.mutate({ title: trimmed }, { onSuccess: () => setTitle("") });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
      <Input
        placeholder="Название нового этапа"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        style={{ flex: 1 }}
      />
      <Button type="submit" variant="outline" loading={createMutation.isPending} disabled={!title.trim()}>
        <Plus size={15} /> Добавить этап
      </Button>
    </form>
  );
}
