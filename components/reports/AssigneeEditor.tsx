"use client";

import { useState } from "react";
import { CircleX, UserRound, UserRoundPlus, Users } from "lucide-react";
import { useDepartmentMembers } from "../../lib/hooks/useDepartments";
import { useAssignItemMembers } from "../../lib/hooks/useReports";
import type { ReportItemAssignee } from "../../lib/api/types";
import { iconSize } from "../../lib/icons";
import { IconButton } from "../ui/IconButton";
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
          <span className={styles.chipAvatar} aria-hidden>
            <UserRound {...iconSize("sm")} />
          </span>
          <span className={styles.chipName}>{assignee.user?.fullName ?? assignee.externalName}</span>
          {canEdit && (
            <IconButton
              variant="chip"
              size="sm"
              label="Удалить исполнителя"
              className={styles.chipRemove}
              onClick={() => remove(assignee)}
            >
              <CircleX {...iconSize("sm")} />
            </IconButton>
          )}
        </span>
      ))}

      {canEdit && !isAddingExternal && availableMembers.length > 0 && (
        <label className={styles.addDeptSelectWrap}>
          <Users {...iconSize("xs")} className={styles.addIcon} />
          <select className={styles.addDeptSelect} value="" onChange={(event) => addMember(event.target.value)}>
            <option value="">Сотрудник отдела</option>
            {availableMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.fullName}
              </option>
            ))}
          </select>
        </label>
      )}

      {canEdit && !isAddingExternal && availableMembers.length === 0 && (
        <span className={styles.addDept}>
          <Users {...iconSize("sm")} />
          Сотрудник отдела
        </span>
      )}

      {canEdit && !isAddingExternal && (
        <button type="button" className={styles.addExternal} onClick={() => setIsAddingExternal(true)}>
          <UserRoundPlus {...iconSize("sm")} />
          Внешний участник
        </button>
      )}

      {canEdit && isAddingExternal && (
        <span className={styles.externalForm}>
          <UserRoundPlus {...iconSize("sm")} className={styles.addIcon} />
          <input
            autoFocus
            className={styles.externalInput}
            placeholder="ФИО"
            value={externalName}
            onChange={(event) => setExternalName(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && addExternal()}
            onBlur={addExternal}
          />
          <IconButton variant="chip" size="sm" label="Отменить" onClick={() => setIsAddingExternal(false)}>
            <CircleX {...iconSize("sm")} />
          </IconButton>
        </span>
      )}
    </div>
  );
}
