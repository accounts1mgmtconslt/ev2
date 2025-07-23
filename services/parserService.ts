import Papa from 'papaparse';
import { EmployeeData, AttendanceRecord, AttendanceStatus } from '../types';

// Helper to parse HH:MM:SS into decimal hours
const timeStringToDecimal = (timeStr: string | null): number => {
  if (!timeStr || !/^\d{1,2}:\d{2}(:\d{2})?$/.test(timeStr)) return 0;
  const parts = timeStr.split(':').map(Number);
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  const seconds = parts[2] || 0;
  return hours + minutes / 60 + seconds / 3600;
};

// More robust date parser
const parseDate = (dateStr: string): Date | null => {
  if (!dateStr || dateStr.trim() === '-') return null;

  // Try parsing formats like MM/DD/YYYY, M/D/YYYY
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  // Try parsing formats like MM-DD-YY
  const parts = dateStr.match(/(\d{1,2})-(\d{1,2})-(\d{2,4})/);
  if (parts) {
      const month = parseInt(parts[1], 10) -1;
      const day = parseInt(parts[2], 10);
      let year = parseInt(parts[3], 10);
      if(year < 100) {
        year += 2000; // assume 21st century
      }
      date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
          return date;
      }
  }

  return null;
};


export const parseCsv = (csvText: string): Promise<EmployeeData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      skipEmptyLines: true,
      complete: (results: any) => {
        try {
          const rows: string[][] = results.data;
          const employeeDataMap = new Map<string, AttendanceRecord[]>();
          let currentEmployee = '';

          for (const row of rows) {
            // Check for employee header row e.g., "Dolly (21 : All Users )"
            if (row.length > 1 && row[0].includes('(') && row[0].includes('All Users')) {
              const match = row[0].match(/^(.*?)\s*\(/);
              if (match && match[1]) {
                currentEmployee = match[1].trim();
                if (!employeeDataMap.has(currentEmployee)) {
                  employeeDataMap.set(currentEmployee, []);
                }
              }
              continue;
            }
            
            // Skip headers or irrelevant rows
            if (row[0]?.toLowerCase() === 'date' || !currentEmployee) {
              continue;
            }
            
            const [dateStr, name, inTime, outTime, totalHours] = row;
            
            // Ensure the row belongs to the current employee context
            if (name?.trim().toLowerCase() !== currentEmployee.toLowerCase()) {
                // This might be a row for a different employee without a header, we can try to handle it
                const employeeName = name?.trim();
                if(employeeName) {
                    currentEmployee = employeeName;
                     if (!employeeDataMap.has(currentEmployee)) {
                        employeeDataMap.set(currentEmployee, []);
                    }
                } else {
                     continue; // Skip if no name
                }
            }

            const date = parseDate(dateStr);
            if (date) {
                const workHoursDecimal = timeStringToDecimal(totalHours);
                const record: AttendanceRecord = {
                    id: `${currentEmployee}-${date.toISOString()}`,
                    date,
                    name: currentEmployee,
                    inTime: inTime?.trim() === '-' ? null : inTime?.trim(),
                    outTime: outTime?.trim() === '-' ? null : outTime?.trim(),
                    totalHours: totalHours?.trim() === '-' ? null : totalHours?.trim(),
                    workHoursDecimal,
                    status: AttendanceStatus.UNKNOWN, // Status will be determined in the analysis step
                    reason: '',
                    isAiEnhanced: false,
                };
                const records = employeeDataMap.get(currentEmployee);
                if (records) {
                    records.push(record);
                }
            }
          }

          const employeeDataArray: EmployeeData[] = Array.from(employeeDataMap.entries()).map(([employeeName, records]) => ({
            employeeName,
            records,
          }));
          
          resolve(employeeDataArray);

        } catch (error) {
          reject(new Error("Failed to parse CSV file. Please check the file format."));
        }
      },
      error: (error: any) => {
        reject(new Error(`CSV Parsing Error: ${error.message}`));
      },
    });
  });
};