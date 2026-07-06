import { IsInt, IsString, IsUUID } from 'class-validator';

export class CreateDirectionDto {
  @IsUUID()
  planId: string;

  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsInt()
  sortOrder: number;
}
