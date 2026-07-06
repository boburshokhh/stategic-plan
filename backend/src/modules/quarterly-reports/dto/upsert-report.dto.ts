import { IsEnum, IsString } from 'class-validator';
import { ReportStatus } from '@prisma/client';

export class UpsertReportDto {
  @IsString()
  content: string;

  @IsEnum(ReportStatus)
  status: ReportStatus;
}
