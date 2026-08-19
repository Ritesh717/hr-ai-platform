import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DepartmentUpdateDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;
}
