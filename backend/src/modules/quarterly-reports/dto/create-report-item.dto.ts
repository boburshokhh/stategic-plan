import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ReportStatus } from '@prisma/client';

/** Этап внутри квартального отчёта (department_description.md §3). */
export class CreateReportItemDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}
