import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSummaryDto {
  @IsUUID()
  reportingPeriodId: string;

  @IsString()
  completedItems: string;

  @IsOptional()
  @IsString()
  deviations?: string;

  @IsOptional()
  @IsString()
  risks?: string;
}
