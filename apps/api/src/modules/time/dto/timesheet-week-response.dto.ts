export class TimesheetRowDto {
  projectCode: string;
  projectName: string;
  hours: number[];
}

export class TimesheetWeekResponseDto {
  weekStart: string;
  weekEnd: string;
  rows: TimesheetRowDto[];
  isSubmitted: boolean;
}
