import * as XLSX from 'xlsx';
import { EmployeeData, AttendanceRecord, AttendanceStatus, Holiday, Stat } from '../types';
import { WEEKEND_DAYS, FULL_DAY_HOURS, HALF_DAY_HOURS } from '../constants';

export const getStatus = (record: AttendanceRecord, holidayDates: Set<string>): AttendanceStatus => {
  const dateString = record.date.toISOString().split('T')[0];
  const dayOfWeek = record.date.getDay();

  const isHoliday = holidayDates.has(dateString);
  const isWeekend = WEEKEND_DAYS.includes(dayOfWeek);
  
  if (record.workHoursDecimal > 0) {
    if (isHoliday) return AttendanceStatus.WORK_ON_HOLIDAY;
    if (isWeekend) return AttendanceStatus.WORK_ON_WEEKEND;
    if (record.workHoursDecimal >= FULL_DAY_HOURS) return AttendanceStatus.PRESENT;
    if (record.workHoursDecimal >= HALF_DAY_HOURS) return AttendanceStatus.SHORT_HOURS;
    return AttendanceStatus.HALF_DAY;
  } else {
    // If reason indicates Out of Office, it might be Present. This is handled during record update.
    if(record.reason === 'Out of Office' && record.workHoursDecimal === FULL_DAY_HOURS) return AttendanceStatus.PRESENT;
    if (isHoliday) return AttendanceStatus.HOLIDAY;
    if (isWeekend) return AttendanceStatus.WEEKEND;
    return AttendanceStatus.ABSENT;
  }
};

export const decimalToTimeString = (decimalHours: number): string => {
    if (isNaN(decimalHours) || decimalHours < 0) return '0:00';
    const totalMinutes = Math.round(decimalHours * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const analyzeData = (employees: EmployeeData[], holidays: Holiday[]): EmployeeData[] => {
    if (employees.length === 0) return [];
    
    const holidayDates = new Set(holidays.map(h => h.date));
    
    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    for (const employee of employees) {
        for (const record of employee.records) {
            const recordDate = new Date(record.date);
            if (!minDate || recordDate < minDate) minDate = recordDate;
            if (!maxDate || recordDate > maxDate) maxDate = recordDate;
        }
    }

    if (!minDate || !maxDate) return employees;
    
    const analyzedEmployees: EmployeeData[] = [];

    for (const employee of employees) {
        const recordsMap = new Map<string, AttendanceRecord>(
            employee.records.map(r => [new Date(r.date).toISOString().split('T')[0], {...r, date: new Date(r.date)}])
        );

        const newRecords: AttendanceRecord[] = [];
        const currentDate = new Date(minDate);
        
        while (currentDate <= maxDate) {
            const dateString = currentDate.toISOString().split('T')[0];
            let record = recordsMap.get(dateString);

            if (!record) {
                record = {
                    id: `${employee.employeeName}-${dateString}`,
                    date: new Date(currentDate),
                    name: employee.employeeName,
                    inTime: null,
                    outTime: null,
                    totalHours: null,
                    workHoursDecimal: 0,
                    status: AttendanceStatus.UNKNOWN,
                    reason: '',
                    isAiEnhanced: false,
                };
            }
            
            record.status = getStatus(record, holidayDates);
            newRecords.push(record);

            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        analyzedEmployees.push({
            employeeName: employee.employeeName,
            records: newRecords.sort((a,b) => a.date.getTime() - b.date.getTime()),
        });
    }

    return analyzedEmployees;
};

export const generateSummaryStats = (records: AttendanceRecord[]): Stat[] => {
    const totalDays = records.length;
    const present = records.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const absent = records.filter(r => r.status === AttendanceStatus.ABSENT).length;
    const halfDays = records.filter(r => r.status === AttendanceStatus.HALF_DAY).length;
    const shortHours = records.filter(r => r.status === AttendanceStatus.SHORT_HOURS).length;
    const holidays = records.filter(r => r.status === AttendanceStatus.HOLIDAY || r.status === AttendanceStatus.WORK_ON_HOLIDAY).length;
    const weekends = records.filter(r => r.status === AttendanceStatus.WEEKEND || r.status === AttendanceStatus.WORK_ON_WEEKEND).length;
    const workOnHoliday = records.filter(r => r.status === AttendanceStatus.WORK_ON_HOLIDAY).length;
    
    const totalWorkableDays = totalDays - holidays - weekends;
    const totalHoursDecimal = records.reduce((sum, r) => sum + r.workHoursDecimal, 0);
    const totalHoursFormatted = decimalToTimeString(totalHoursDecimal);
    
    return [
        { label: 'Total Workable Days', value: totalWorkableDays, color: 'bg-blue-500' },
        { label: 'Present Days', value: present, color: 'bg-green-500' },
        { label: 'Absent Days', value: absent, color: 'bg-red-500' },
        { label: 'Short/Half Days', value: `${shortHours}/${halfDays}`, color: 'bg-yellow-500' },
        { label: 'Work on Holiday', value: workOnHoliday, color: 'bg-purple-500' },
        { label: 'Total Hours Worked', value: totalHoursFormatted, color: 'bg-slate-700', totalHoursDecimal },
    ];
};

// Enhanced color scheme with better contrast and visual distinction
const EXCEL_STATUS_FORMATTING: Record<AttendanceStatus, {
    fill: string;
    font: string;
    border: string;
    pattern?: 'solid' | 'lightHorizontal' | 'lightVertical' | 'darkHorizontal';
}> = {
    [AttendanceStatus.PRESENT]: {
        fill: "d4edda",        // Light green background
        font: "155724",        // Dark green text
        border: "28a745"       // Green border
    },
    [AttendanceStatus.ABSENT]: {
        fill: "f8d7da",        // Light red background
        font: "721c24",        // Dark red text
        border: "dc3545"       // Red border
    },
    [AttendanceStatus.HALF_DAY]: {
        fill: "fff3cd",        // Light yellow background
        font: "856404",        // Dark yellow/brown text
        border: "ffc107"       // Yellow border
    },
    [AttendanceStatus.SHORT_HOURS]: {
        fill: "ffeaa7",        // Light orange background
        font: "d63031",        // Dark orange text
        border: "fd7e14"       // Orange border
    },
    [AttendanceStatus.WEEKEND]: {
        fill: "e9ecef",        // Light gray background
        font: "495057",        // Dark gray text
        border: "6c757d"       // Gray border
    },
    [AttendanceStatus.HOLIDAY]: {
        fill: "cce5ff",        // Light blue background
        font: "004085",        // Dark blue text
        border: "007bff"       // Blue border
    },
    [AttendanceStatus.WORK_ON_HOLIDAY]: {
        fill: "e2d5f0",        // Light purple background
        font: "5a2d82",        // Dark purple text
        border: "6f42c1"       // Purple border
    },
    [AttendanceStatus.WORK_ON_WEEKEND]: {
        fill: "d1c4e9",        // Light indigo background
        font: "4527a0",        // Dark indigo text
        border: "673ab7"       // Indigo border
    },
    [AttendanceStatus.UNKNOWN]: {
        fill: "f8f9fa",        // Very light gray background
        font: "6c757d",        // Medium gray text
        border: "dee2e6"       // Light gray border
    }
};

export const exportToExcel = (records: AttendanceRecord[], summary: Stat[], employeeName: string, dateRange: {start: Date, end: Date}) => {
    // Create workbook first
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Enhanced Summary with legend
    const summaryData = [
        ['Employee Attendance Summary'],
        [],
        ['Employee Name:', employeeName],
        ['Period:', `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`],
        [],
        ['Metric', 'Value'],
        ...summary.map(s => [s.label, s.value]),
        [],
        ['Color Legend:'],
        ['Present', 'Light Green Background'],
        ['Absent', 'Light Red Background'],
        ['Half Day', 'Light Yellow Background'],
        ['Short Hours', 'Light Orange Background'],
        ['Weekend', 'Light Gray Background'],
        ['Holiday', 'Light Blue Background'],
        ['Work on Holiday', 'Light Purple Background'],
        ['Work on Weekend', 'Light Indigo Background']
    ];
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths for summary
    summaryWs['!cols'] = [{ wch: 25 }, { wch: 20 }];
    
    // Apply title formatting
    if (summaryWs['A1']) {
        summaryWs['A1'].s = {
            font: { bold: true, sz: 16 },
            alignment: { horizontal: 'center' },
            fill: { fgColor: { rgb: "CCCCCC" } }
        };
    }
    
    // Merge title cell
    summaryWs['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    
    // Sheet 2: Enhanced Detailed Report
    const headers = ['Date', 'Day', 'In Time', 'Out Time', 'Total Hours', 'Status', 'Reason / Note'];
    const reportData = [
        headers,
        ...records.map(r => [
            r.date.toLocaleDateString(),
            r.date.toLocaleDateString('en-US', { weekday: 'long' }),
            r.inTime || '-',
            r.outTime || '-',
            r.totalHours || '0:00',
            r.status,
            r.reason || '-'
        ])
    ];

    const reportWs = XLSX.utils.aoa_to_sheet(reportData);
    
    // Set column widths
    reportWs['!cols'] = [
        { wch: 12 }, { wch: 12 }, { wch: 10 }, 
        { wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 50 }
    ];

    // Apply header formatting
    for (let C = 0; C < headers.length; ++C) {
        const cellAddress = XLSX.utils.encode_cell({c: C, r: 0});
        if (reportWs[cellAddress]) {
            reportWs[cellAddress].s = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "4472C4" } },
                alignment: { horizontal: 'center', vertical: 'center' },
                border: {
                    top: { style: 'thin', color: { rgb: "000000" } },
                    bottom: { style: 'thin', color: { rgb: "000000" } },
                    left: { style: 'thin', color: { rgb: "000000" } },
                    right: { style: 'thin', color: { rgb: "000000" } }
                }
            };
        }
    }

    // Apply data row formatting based on status
    records.forEach((record, index) => {
        const rowNum = index + 1; // +1 because row 0 is header
        const formatting = EXCEL_STATUS_FORMATTING[record.status];
        
        // Create style based on status
        let rowStyle = {
            fill: { fgColor: { rgb: formatting.fill } },
            font: { 
                color: { rgb: formatting.font },
                sz: 10
            },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
                top: { style: 'thin', color: { rgb: "D0D0D0" } },
                bottom: { style: 'thin', color: { rgb: "D0D0D0" } },
                left: { style: 'thin', color: { rgb: "D0D0D0" } },
                right: { style: 'thin', color: { rgb: "D0D0D0" } }
            }
        };

        // Add special formatting for specific statuses
        if (record.status === AttendanceStatus.ABSENT || record.status === AttendanceStatus.WORK_ON_HOLIDAY) {
            rowStyle.font.bold = true;
        }
        
        if (record.status === AttendanceStatus.WEEKEND || record.status === AttendanceStatus.WORK_ON_WEEKEND) {
            rowStyle.font.italic = true;
        }
        
        if (record.status === AttendanceStatus.HOLIDAY || record.status === AttendanceStatus.WORK_ON_HOLIDAY) {
            rowStyle.border = {
                top: { style: 'medium', color: { rgb: formatting.border } },
                bottom: { style: 'medium', color: { rgb: formatting.border } },
                left: { style: 'medium', color: { rgb: formatting.border } },
                right: { style: 'medium', color: { rgb: formatting.border } }
            };
        }

        // Apply style to each cell in the row
        for (let C = 0; C < headers.length; ++C) {
            const cellAddress = XLSX.utils.encode_cell({c: C, r: rowNum});
            
            // Ensure cell exists
            if (!reportWs[cellAddress]) {
                reportWs[cellAddress] = { v: reportData[rowNum][C], t: 's' };
            }
            
            // Apply the style
            let cellStyle = { ...rowStyle };
            
            // Left-align the reason/note column for better readability
            if (C === 6) {
                cellStyle.alignment = { horizontal: 'left', vertical: 'center' };
            }
            
            reportWs[cellAddress].s = cellStyle;
        }
    });

    // Add sheets to workbook
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    XLSX.utils.book_append_sheet(wb, reportWs, 'Detailed Report');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Attendance_Report_${employeeName.replace(/\s+/g, '_')}_${timestamp}.xlsx`;
    
    // Write the file
    XLSX.writeFile(wb, filename);
};