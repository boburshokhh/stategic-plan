import { IsInt, IsISO8601, Max, Min } from 'class-validator';

export class CreateReportingPeriodDto {
  @IsInt()
  year: number;

  @IsInt()
  @Min(1)
  @Max(4)
  quarter: number;

  @IsISO8601()
  collectionStart: string;

  @IsISO8601()
  collectionEnd: string;

  @IsISO8601()
  aggregationStart: string;

  @IsISO8601()
  aggregationEnd: string;
}
