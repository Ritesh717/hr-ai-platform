export class ClockStatusResponseDto {
  isClockedIn: boolean;
  clockInTime?: string; // ISO

  static fromEntry(entry: { clockInTime: Date; clockOutTime: Date | null } | null): ClockStatusResponseDto {
    if (!entry || entry.clockOutTime !== null) {
      return { isClockedIn: false };
    }
    return { isClockedIn: true, clockInTime: entry.clockInTime.toISOString() };
  }
}
