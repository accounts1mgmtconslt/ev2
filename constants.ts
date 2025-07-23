
import { Holiday, AttendanceStatus } from './types';

// Default UAE Public Holidays for 2025. This list can be managed by the user in the UI.
export const INITIAL_HOLIDAYS: Holiday[] = [
  { date: '2025-01-01', name: 'New Year\'s Day' },
  { date: '2025-03-30', name: 'Eid al-Fitr 1' },
  { date: '2025-03-31', name: 'Eid al-Fitr 2' },
  { date: '2025-04-01', name: 'Eid al-Fitr 3' },
  { date: '2025-06-05', name: 'Arafat Day' },
  { date: '2025-06-06', name: 'Eid al-Adha 1' },
  { date: '2025-06-07', name: 'Eid al-Adha 2' },
  { date: '2025-06-08', name: 'Eid al-Adha 3' },
  { date: '2025-06-26', name: 'Islamic New Year' },
  { date: '2025-09-04', name: 'Prophet Muhammad\'s Birthday' },
  { date: '2025-12-02', name: 'UAE National Day 1' },
  { date: '2025-12-03', name: 'UAE National Day 2' },
];

// Weekends are Saturday (6) and Sunday (0)
export const WEEKEND_DAYS = [6, 0];

export const STATUS_COLORS: Record<AttendanceStatus, string> = {
  [AttendanceStatus.PRESENT]: 'bg-green-100 text-green-800',
  [AttendanceStatus.ABSENT]: 'bg-red-100 text-red-800',
  [AttendanceStatus.HALF_DAY]: 'bg-yellow-100 text-yellow-800',
  [AttendanceStatus.SHORT_HOURS]: 'bg-amber-100 text-amber-800',
  [AttendanceStatus.WEEKEND]: 'bg-slate-200 text-slate-600',
  [AttendanceStatus.HOLIDAY]: 'bg-sky-100 text-sky-800',
  [AttendanceStatus.WORK_ON_HOLIDAY]: 'bg-purple-200 text-purple-900 font-bold',
  [AttendanceStatus.WORK_ON_WEEKEND]: 'bg-indigo-200 text-indigo-900 font-bold',
  [AttendanceStatus.UNKNOWN]: 'bg-gray-100 text-gray-500',
};

export const FULL_DAY_HOURS = 8;
export const HALF_DAY_HOURS = 4;

export const QUICK_REASONS: { label: string; value: string; creditHours?: number }[] = [
    { label: 'Out of Office', value: 'Out of Office', creditHours: FULL_DAY_HOURS },
    { label: 'Sick Leave', value: 'Sick Leave', creditHours: FULL_DAY_HOURS },
    { label: 'Approved Leave', value: 'Approved Leave', creditHours: FULL_DAY_HOURS },
    { label: 'Client Meeting', value: 'Client Meeting', creditHours: FULL_DAY_HOURS },
    { label: 'Forgot to Punch Out', value: 'Forgot to Punch Out' },
];