"use client";

import { useCallback, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { importApi } from "../../lib/api/endpoints";
import { ApiError } from "../../lib/api/client";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { ErrorAlert } from "../ui/ErrorAlert";
import styles from "./ExcelImportPanel.module.css";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function ExcelImportPanel() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["import", "status"],
    queryFn: importApi.getStatus,
  });

  const importMutation = useMutation({
    mutationFn: importApi.uploadExcel,
    onSuccess: () => {
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["import", "status"] });
      queryClient.invalidateQueries({ queryKey: ["plans", "active"] });
    },
  });

  const pickFile = useCallback((file: File | null) => {
    if (!file) return;
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) return;
    setSelectedFile(file);
    importMutation.reset();
  }, [importMutation]);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragActive(false);
      if (importMutation.isPending) return;
      pickFile(event.dataTransfer.files[0] ?? null);
    },
    [importMutation.isPending, pickFile],
  );

  const handleImport = () => {
    if (!selectedFile) return;
    importMutation.mutate(selectedFile);
  };

  return (
    <Card title="Импорт из Excel" subtitle="Загрузка стратегического плана из файла .xlsx">
      <div
        className={[
          styles.dropzone,
          dragActive ? styles.dropzoneActive : "",
          importMutation.isPending ? styles.dropzoneDisabled : "",
        ].join(" ")}
        onClick={() => !importMutation.isPending && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        <Upload size={28} strokeWidth={1.5} className={styles.icon} />
        <div style={{ fontWeight: 500, color: "var(--color-text-heading)" }}>
          Перетащите файл или нажмите для выбора
        </div>
        <div className={styles.hint}>
          Листы: Эксплуатация, Кадры, Цифровизация, HSE, Зеленая энергетика
        </div>
        {selectedFile && <div className={styles.fileName}>{selectedFile.name}</div>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className={styles.hiddenInput}
        onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
      />

      {importMutation.isPending && (
        <div className={styles.progress}>
          <div className={styles.progressBar} style={{ width: "70%" }} />
        </div>
      )}

      {importMutation.isError && (
        <div style={{ marginTop: 16 }}>
          <ErrorAlert
            message={importMutation.error instanceof ApiError ? importMutation.error.message : "Ошибка импорта"}
          />
        </div>
      )}

      {importMutation.isSuccess && (
        <div className={styles.result}>
          Импорт завершён: {importMutation.data.directions} направлений, {importMutation.data.tasks} задач,{" "}
          {importMutation.data.subtasks} подзадач, {importMutation.data.reports} отчётов
          {importMutation.data.departmentsCreated > 0 && `, ${importMutation.data.departmentsCreated} новых отделов`}.
        </div>
      )}

      <div className={styles.actions}>
        <Button
          variant="primary"
          loading={importMutation.isPending}
          disabled={!selectedFile || importMutation.isPending}
          onClick={handleImport}
        >
          Импортировать
        </Button>
      </div>

      {!statusLoading && status && (
        <>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{status.planStats.directions}</div>
              <div className={styles.statLabel}>Направлений</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{status.planStats.tasks}</div>
              <div className={styles.statLabel}>Задач</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{status.planStats.subtasks}</div>
              <div className={styles.statLabel}>Подзадач</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{status.planStats.quarterlyReports}</div>
              <div className={styles.statLabel}>Отчётов</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{status.planStats.departments}</div>
              <div className={styles.statLabel}>Отделов</div>
            </div>
          </div>

          {status.lastImport && (
            <div className={styles.lastImport}>
              Последний импорт: <strong>{status.lastImport.fileName}</strong> —{" "}
              {formatDate(status.lastImport.importedAt)}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
