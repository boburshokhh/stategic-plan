import { IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTaskDto {
  @IsUUID()
  directionId: string;

  @IsOptional()
  @IsInt()
  number?: number;

  @IsString()
  title: string;

  @IsInt()
  sortOrder: number;
}
