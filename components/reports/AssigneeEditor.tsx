"use client";

import { useState } from "react";
import { Plus, UserPlus, X } from "lucide-react";
import { useDepartmentMembers } from "../../lib/hooks/useDepartments";
import { useAssignItemMembers } from "../../lib/hooks/useReports";
import type { ReportItemAssignee } from "../../lib/api/types";
import styles from "./AssigneeEditor.module.css";

interface AssigneeEditorProps {
  reportId: string;
  itemId: string;
  assignees: ReportItemAssignee[];
  departmentId?: string | null;
  canEdit: boolean;
}

function toPayload(assignees: ReportItemAssignee[]) {
  return assignees.map((assignee) =>
    assignee.userId ? { userId: assignee.userId } : { externalName: assignee.externalName ?? "" },
  );
}

export function AssigneeEditor({ reportId, itemId, assignees, departmentId, canEdit }: AssigneeEditorProps) {
  const { data: members } = useDepartmentMembers(departmentId);
  const assignMutation = useAssignItemMembers(reportId);
  const [isAddingExternal, setIsAddingExternal] = useState(false);
  const [externalName, setExternalName] = useState("");

  const availableMembers = (members ?? []).filter(
    (member) => !assignees.some((assignee) => assignee.userId === member.id),
  );

  function remove(assignee: ReportItemAssignee) {
    const next = assignees.filter((item) => item.id !== assignee.id);
    assignMutation.mutate({ itemId, assignees: toPayload(next) });
  }

  function addMember(userId: string) {
    if (!userId) return;
    assignMutation.mutate({ itemId, assignees: [...toPayload(assignees), { userId }] });
  }

  function addExternal() {
    const trimmed = externalName.trim();
    if (!trimmed) {
      setIsAddingExternal(false);
      return;
    }
    assignMutation.mutate({ itemId, assignees: [...toPayload(assignees), { externalName: trimmed }] });
    setExternalName("");
    setIsAddingExternal(false);
  }

  return (
    <div className={styles.wrapper}>
      {assignees.map((assignee) => (
        <span key={assignee.id} className={styles.chip}>
          {assignee.user?.fullName ?? assignee.externalName}
          {canEdit && (
            <button type="button" className={styles.chipRemove} onClick={() => remove(assignee)} aria-label="Удалить">
              <X size={14} />
            </button>
          )}
        </span>
      ))}

      {canEdit && !isAddingExternal && availableMembers.length > 0 && (
        <select className={styles.addDeptSelect} value="" onChange={(event) => addMember(event.target.value)}>
          <option value="">Сотрудник отдела</option>
          {availableMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.fullName}
            </option>
          ))}
        </select>
      )}

      {canEdit && !isAddingExternal && availableMembers.length === 0 && (
        <span className={styles.addDept}>
          <Plus size={16} />
          Сотрудник отдела
        </span>
      )}

      {canEdit && !isAddingExternal && (
        <button type="button" className={styles.addExternal} onClick={() => setIsAddingExternal(true)}>
          <UserPlus size={16} />
          Внешний участник
        </button>
      )}

      {canEdit && isAddingExternal && (
        <span className={styles.externalForm}>
          <input
            autoFocus
            className={styles.externalInput}
            placeholder="ФИО"
            value={externalName}
            onChange={(event) => setExternalName(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && addExternal()}
            onBlur={addExternal}
          />
        </span>
      )}
    </div>
  );
}
