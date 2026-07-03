"use client";

import { usePageHeader } from "../../../../lib/layout/PageHeaderContext";
import { ExcelImportPanel } from "../../../../components/admin/ExcelImportPanel";

export default function AdminImportPage() {
  usePageHeader("Импорт Excel", [
    { label: "Администрирование" },
    { label: "Импорт Excel" },
  ]);

  return <ExcelImportPanel />;
}
