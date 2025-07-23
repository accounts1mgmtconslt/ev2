
export enum AppStep {
  UPLOAD = 'Upload File',
  PREVIEW = 'Preview Data',
  REPORT = 'View Report',
}

export enum AttendanceStatus {
  PRESENT = 'Present',
  ABSENT = 'Absent',
  HALF_DAY = 'Half-day',
  SHORT_HOURS = 'Short Hours',
  WEEKEND = 'Weekend',
  HOLIDAY = 'Public Holiday',
  WORK_ON_HOLIDAY = 'Work on Holiday',
  WORK_ON_WEEKEND = 'Work on Weekend',
  UNKNOWN = 'Unknown',
}

export interface AttendanceRecord {
  id: string;
  date: Date;
  name: string;
  inTime: string | null;
  outTime: string | null;
  totalHours: string | null;
  workHoursDecimal: number;
  status: AttendanceStatus;
  reason: string;
  isAiEnhanced: boolean;
}

export interface EmployeeData {
  employeeName: string;
  records: AttendanceRecord[];
}

export interface Holiday {
  date: string; // YYYY-MM-DD format
  name: string;
}

export interface Stat {
  label: string;
  value: string | number;
  color: string;
  totalHoursDecimal?: number;
}

export interface RecordUpdatePayload {
  recordId: string;
  updates: {
    reason: string;
    creditHours?: number;
  };
}