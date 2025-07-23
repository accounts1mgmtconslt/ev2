
import React from 'react';
import { EmployeeData, AttendanceRecord, AttendanceStatus } from '../types';
import { STATUS_COLORS } from '../constants';
import { MagicIcon, LoadingSpinner } from './icons/Icon';

interface DataPreviewProps {
  data: EmployeeData[];
  onAnalyze: () => void;
  onSkip: () => void;
  isAnalyzing: boolean;
}

const DataPreview: React.FC<DataPreviewProps> = ({ data, onAnalyze, onSkip, isAnalyzing }) => {
  const totalEmployees = data.length;
  const totalRecords = data.reduce((acc, curr) => acc + curr.records.length, 0);
  const previewRecords = data.flatMap(emp => emp.records).slice(0, 15);

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Data Preview & Verification</h2>
        <p className="text-slate-600 mb-6">
          We've successfully parsed your file. Below is a summary and a preview of the first 15 records.
          Please verify this looks correct before proceeding to the full report.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-100 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-indigo-600">{totalEmployees}</p>
                <p className="text-sm font-medium text-slate-500">Employees Found</p>
            </div>
            <div className="bg-slate-100 p-4 rounded-lg text-center">
                <p className="text-3xl font-bold text-indigo-600">{totalRecords}</p>
                <p className="text-sm font-medium text-slate-500">Total Days Processed</p>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {previewRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.date.toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[record.status]}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.totalHours || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-end gap-4">
            <button
                onClick={onSkip}
                disabled={isAnalyzing}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-slate-700 bg-slate-200 hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50"
            >
                Skip to Report
            </button>
            <button
                onClick={onAnalyze}
                disabled={!process.env.API_KEY || isAnalyzing}
                className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
            >
                {isAnalyzing ? <LoadingSpinner/> : <MagicIcon />}
                <span className="ml-2">{isAnalyzing ? 'Analyzing...' : 'Analyze with Gemini AI'}</span>
            </button>
        </div>
        {!process.env.API_KEY && (
          <p className="text-right text-xs text-amber-600 mt-2">
            Gemini AI analysis is disabled. API key is not configured.
          </p>
        )}
      </div>
    </div>
  );
};

export default DataPreview;
