import { IsDateString, IsString, MaxLength } from 'class-validator';

export class HolidayCreateDto {
  @IsString()
  @MaxLength(150)
  name: string;

  @IsDateString()
  date: string;
}
