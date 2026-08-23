import { IsArray, IsNumber, IsString, Length, ArrayMinSize, ArrayMaxSize, Min } from 'class-validator';

export class TimesheetRowUpdateDto {
  @IsString()
  @Length(1, 50)
  projectCode: string;

  @IsString()
  @Length(1, 200)
  projectName: string;

  @IsArray()
  @ArrayMinSize(7)
  @ArrayMaxSize(7)
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  hours: number[];
}
