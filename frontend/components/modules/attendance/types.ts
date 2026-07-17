export interface AttendanceDay {
  date: string;
  day: number;
  dayOfWeek: number;
  isWeekend: boolean;
  status: 'PRESENT' | 'WFH' | 'LEAVE' | 'ABSENT' | 'HALF_DAY' | 'WEEKEND' | 'HOLIDAY';
  clockIn?: string;
  clockOut?: string;
  hoursWorked: number;
  overtime: number;
}

export interface LeaveBalance {
  type: string;
  limit: number;
  used: number;
  remaining: number;
}
