import { IsOptional, IsString } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  shortName?: string;
}
