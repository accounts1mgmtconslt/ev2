
import React, { useMemo } from 'react';
import { EmployeeData } from '../types';
import { generateSummaryStats } from '../services/reportService';
import { decimalToTimeString } from '../services/reportService';

interface AllEmployeesSummaryProps {
  data: EmployeeData[];
}

const AllEmployeesSummary: React.FC<AllEmployeesSummaryProps> = ({ data }) => {
    const summaryData = useMemo(() => {
        return data.map(employee => {
            const stats = generateSummaryStats(employee.records);
            const presentDays = stats.find(s => s.label === 'Present Days')?.value || 0;
            const absentDays = stats.find(s => s.label === 'Absent Days')?.value || 0;
            const shortHalfDays = stats.find(s => s.label === 'Short/Half Days')?.value || '0/0';
            const totalHoursDecimal = stats.find(s => s.label === 'Total Hours Worked')?.totalHoursDecimal || 0;

            return {
                name: employee.employeeName,
                presentDays,
                absentDays,
                shortHalfDays,
                totalHoursDecimal,
            }
        });
    }, [data]);
    
    const maxHours = useMemo(() => {
        const hours = summaryData.map(d => d.totalHoursDecimal);
        return Math.max(...hours, 1); // Avoid division by zero
    }, [summaryData]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-8 animate-fade-in">
            <div>
                <h3 className="text-2xl font-bold text-slate-800">All Employees Summary</h3>
                <p className="text-slate-500">A high-level overview of attendance for the selected period.</p>
            </div>
            
            {/* Summary Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employee</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Present</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Absent</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Short/Half</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total Hours</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {summaryData.map(emp => (
                            <tr key={emp.name}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{emp.name}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-green-600 font-semibold">{emp.presentDays}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-red-600 font-semibold">{emp.absentDays}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-yellow-600 font-semibold">{emp.shortHalfDays}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-slate-700 font-bold">{decimalToTimeString(emp.totalHoursDecimal)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Hours Chart */}
            <div>
                 <h4 className="text-lg font-semibold text-slate-700 mb-4">Total Hours Worked Comparison</h4>
                 <div className="space-y-4">
                     {[...summaryData].sort((a,b) => b.totalHoursDecimal - a.totalHoursDecimal).map(emp => (
                         <div key={emp.name} className="grid grid-cols-4 items-center gap-4">
                             <p className="col-span-1 text-sm font-medium text-slate-600 truncate">{emp.name}</p>
                             <div className="col-span-3 flex items-center gap-2">
                                 <div className="w-full bg-slate-200 rounded-full h-4">
                                     <div 
                                        className="bg-indigo-600 h-4 rounded-full transition-all duration-500"
                                        style={{ width: `${(emp.totalHoursDecimal / maxHours) * 100}%` }}
                                     ></div>
                                 </div>
                                 <p className="text-sm font-semibold text-indigo-700 w-20 text-right">{decimalToTimeString(emp.totalHoursDecimal)}</p>
                             </div>
                         </div>
                     ))}
                 </div>
            </div>

        </div>
    );
};

export default AllEmployeesSummary;