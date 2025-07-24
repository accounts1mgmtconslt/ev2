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

export const exportToExcel = (records: AttendanceRecord[], summary: Stat[], employeeName: string, dateRange: {start: Date, end: Date}) => {
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Summary
    const summaryData = [
        ['Employee Attendance Summary'],
        [],
        ['Employee Name:', employeeName],
        ['Period:', `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`],
        [],
        ['Metric', 'Value'],
        ...summary.map(s => [s.label, s.value])
    ];
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 20 }, { wch: 15 }];

    // Sheet 2: Detailed Report with formatting
    const headers = ['Date', 'Day', 'In Time', 'Out Time', 'Total Hours', 'Status', 'Reason / Note'];
    const reportWs = XLSX.utils.aoa_to_sheet([headers]);
    
    // Set column widths
    reportWs['!cols'] = [
        { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, 
        { wch: 12 }, { wch: 18 }, { wch: 40 }
    ];

    // Add data rows with formatting
    records.forEach((record, index) => {
        const rowIndex = index + 1;
        const rowData = [
            record.date.toLocaleDateString(),
            record.date.toLocaleDateString('en-US', { weekday: 'long' }),
            record.inTime || '-',
            record.outTime || '-',
            record.totalHours || '0:00',
            record.status,
            record.reason || '-'
        ];

        // Add row data
        rowData.forEach((cellValue, colIndex) => {
            const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
            reportWs[cellAddress] = { v: cellValue, t: 's' };
        });
    });

    // Apply formatting based on status
    const getStatusColor = (status: AttendanceStatus) => {
        switch (status) {
            case AttendanceStatus.PRESENT: return { fgColor: { rgb: "D4EDDA" } };
            case AttendanceStatus.ABSENT: return { fgColor: { rgb: "F8D7DA" } };
            case AttendanceStatus.HALF_DAY: return { fgColor: { rgb: "FFF3CD" } };
            case AttendanceStatus.SHORT_HOURS: return { fgColor: { rgb: "FFEAA7" } };
            case AttendanceStatus.WEEKEND: return { fgColor: { rgb: "E9ECEF" } };
            case AttendanceStatus.HOLIDAY: return { fgColor: { rgb: "CCE5FF" } };
            case AttendanceStatus.WORK_ON_HOLIDAY: return { fgColor: { rgb: "E2D5F0" } };
            case AttendanceStatus.WORK_ON_WEEKEND: return { fgColor: { rgb: "D1C4E9" } };
            default: return { fgColor: { rgb: "FFFFFF" } };
        }
    };

    const getFontColor = (status: AttendanceStatus) => {
        switch (status) {
            case AttendanceStatus.PRESENT: return { rgb: "155724" };
            case AttendanceStatus.ABSENT: return { rgb: "721C24" };
            case AttendanceStatus.HALF_DAY: return { rgb: "856404" };
            case AttendanceStatus.SHORT_HOURS: return { rgb: "D63031" };
            case AttendanceStatus.WEEKEND: return { rgb: "495057" };
            case AttendanceStatus.HOLIDAY: return { rgb: "004085" };
            case AttendanceStatus.WORK_ON_HOLIDAY: return { rgb: "5A2D82" };
            case AttendanceStatus.WORK_ON_WEEKEND: return { rgb: "4527A0" };
            default: return { rgb: "000000" };
        }
    };

    // Format header row
    for (let col = 0; col < headers.length; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (reportWs[cellAddress]) {
            reportWs[cellAddress].s = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "4472C4" } },
                alignment: { horizontal: "center" }
            };
        }
    }

    // Format data rows based on status
    records.forEach((record, index) => {
        const rowIndex = index + 1;
        const fillColor = getStatusColor(record.status);
        const fontColor = getFontColor(record.status);
        
        for (let col = 0; col < headers.length; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: col });
            if (reportWs[cellAddress]) {
                reportWs[cellAddress].s = {
                    fill: fillColor,
                    font: { 
                        color: fontColor,
                        bold: record.status === AttendanceStatus.ABSENT || 
                              record.status === AttendanceStatus.WORK_ON_HOLIDAY ||
                              record.status === AttendanceStatus.WORK_ON_WEEKEND
                    },
                    alignment: { 
                        horizontal: col === 6 ? "left" : "center",
                        wrapText: col === 6
                    }
                };
            }
        }
    });

    // Add sheets to workbook
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    XLSX.utils.book_append_sheet(wb, reportWs, 'Detailed Report');

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Attendance_Report_${employeeName.replace(/\s+/g, '_')}_${timestamp}.xlsx`;
    
    // Write file
    XLSX.writeFile(wb, filename);
};