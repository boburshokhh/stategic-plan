import { Type } from 'class-transformer';
import { IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

class ReportItemAssigneeInput {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  externalName?: string;
}

/** Полный список исполнителей этапа (заменяет предыдущий набор, как assign-departments.dto). */
export class AssignReportItemMembersDto {
  @ValidateNested({ each: true })
  @Type(() => ReportItemAssigneeInput)
  assignees: ReportItemAssigneeInput[];
}
