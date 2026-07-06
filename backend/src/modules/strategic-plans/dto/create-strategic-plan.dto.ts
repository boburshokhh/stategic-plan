import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { PlanStatus } from '@prisma/client';

export class CreateStrategicPlanDto {
  @IsString()
  title: string;

  @IsInt()
  yearFrom: number;

  @IsInt()
  yearTo: number;

  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;
}
