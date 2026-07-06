import { IsInt, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ParticipationQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(2026)
  @Max(2028)
  year: number;
}
