import { IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSubtaskDto {
  @IsUUID()
  taskId: string;

  @IsInt()
  year: number;

  @IsString()
  title: string;

  @IsInt()
  sortOrder: number;

  @IsOptional()
  @IsString()
  expectedResult?: string;
}
