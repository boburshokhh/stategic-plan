import { Type } from 'class-transformer';
import { ArrayMinSize, IsEnum, IsUUID, ValidateNested } from 'class-validator';
import { SubtaskDepartmentRole } from '@prisma/client';

class DepartmentAssignmentDto {
  @IsUUID()
  departmentId: string;

  @IsEnum(SubtaskDepartmentRole)
  role: SubtaskDepartmentRole;
}

/** Полный список отделов, назначенных на подзадачу (заменяет предыдущие назначения). */
export class AssignDepartmentsDto {
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DepartmentAssignmentDto)
  departments: DepartmentAssignmentDto[];
}
