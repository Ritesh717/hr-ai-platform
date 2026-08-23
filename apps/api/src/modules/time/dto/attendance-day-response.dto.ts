export type AttendanceStatus = 'present' | 'remote' | 'leave' | 'absent' | 'weekend' | 'holiday';

export class AttendanceDayResponseDto {
  date: string;
  status: AttendanceStatus;
  hoursWorked?: number;
  note?: string;
}
