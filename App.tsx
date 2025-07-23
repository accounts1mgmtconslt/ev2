
import React, { useState, useCallback, useEffect } from 'react';
import { AppStep, EmployeeData, AttendanceRecord, Holiday, AttendanceStatus, RecordUpdatePayload } from './types';
import { parseCsv } from './services/parserService';
import { analyzeData, getStatus, decimalToTimeString } from './services/reportService';
import { enhanceWithAI, AIEnhancement } from './services/geminiService';
import { INITIAL_HOLIDAYS } from './constants';
import Stepper from './components/Stepper';
import FileUpload from './components/FileUpload';
import DataPreview from './components/DataPreview';
import ReportView from './components/ReportView';
import { XCircleIcon, CheckCircleIcon } from './components/icons/Icon';

const App: React.FC = () => {
    const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
    const [employeeData, setEmployeeData] = useState<EmployeeData[] | null>(null);
    const [holidays, setHolidays] = useState<Holiday[]>(INITIAL_HOLIDAYS);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const resetState = () => {
        setStep(AppStep.UPLOAD);
        setEmployeeData(null);
        setIsLoading(false);
        setError(null);
        setSuccessMessage(null);
    }
    
    const showMessage = (setter: React.Dispatch<React.SetStateAction<string | null>>, message: string) => {
        setter(message);
        setTimeout(() => setter(null), 5000);
    };

    const handleFileUploaded = useCallback(async (file: File) => {
        setIsLoading(true);
        setError(null);
        try {
            const text = await file.text();
            const parsed = await parseCsv(text);
            if (parsed.length === 0) {
                throw new Error("No employee data could be parsed from the file. Please check the format.");
            }
            const analyzed = analyzeData(parsed, holidays);
            setEmployeeData(analyzed);
            setStep(AppStep.PREVIEW);
        } catch (e: any) {
            setError(e.message || 'An unknown error occurred during parsing.');
            setStep(AppStep.UPLOAD);
        } finally {
            setIsLoading(false);
        }
    }, [holidays]);
    
    const handleAIAnalysis = useCallback(async () => {
        if (!employeeData) return;
        setIsLoading(true);
        setError(null);
        try {
            const recordsToAnalyze = employeeData.flatMap(e => e.records)
              .filter(r => [AttendanceStatus.ABSENT, AttendanceStatus.HALF_DAY, AttendanceStatus.SHORT_HOURS].includes(r.status));

            const enhancements = await enhanceWithAI(recordsToAnalyze, "all employees");
            
            const enhancementMap = new Map<string, AIEnhancement>(enhancements.map(e => [e.date, e]));
            
            const enhancedData = employeeData.map(emp => ({
                ...emp,
                records: emp.records.map(rec => {
                    const recDateStr = rec.date.toISOString().split('T')[0];
                    if (enhancementMap.has(recDateStr)) {
                        const enhancement = enhancementMap.get(recDateStr)!;
                        return { 
                            ...rec, 
                            reason: enhancement.suggestedReason,
                            isAiEnhanced: true,
                         };
                    }
                    return rec;
                })
            }));
            
            setEmployeeData(enhancedData);
            setStep(AppStep.REPORT);
            showMessage(setSuccessMessage, 'AI analysis complete! Reasons have been added to relevant records.');
        } catch (e: any) {
            showMessage(setError, e.message || 'An unknown error occurred during AI analysis.');
            setStep(AppStep.REPORT);
        } finally {
            setIsLoading(false);
        }
    }, [employeeData]);
    
    const handleSkipToReport = () => {
        setStep(AppStep.REPORT);
    };
    
    const handleRecordUpdate = (payload: RecordUpdatePayload) => {
        if (!employeeData) return;

        const { recordId, updates } = payload;
        const holidayDates = new Set(holidays.map(h => h.date));

        const newData = employeeData.map(emp => ({
            ...emp,
            records: emp.records.map(rec => {
                if (rec.id === recordId) {
                    const newRec = { ...rec, reason: updates.reason, isAiEnhanced: false };
                    
                    if (updates.creditHours !== undefined && updates.creditHours !== null) {
                        newRec.workHoursDecimal = updates.creditHours;
                        newRec.totalHours = decimalToTimeString(updates.creditHours);
                        // Recalculate status based on new hours
                        newRec.status = getStatus(newRec, holidayDates);
                    }
                    return newRec;
                }
                return rec;
            })
        }));
        setEmployeeData(newData);
    };

    const handleHolidaysUpdate = (newHolidays: Holiday[]) => {
        setHolidays(newHolidays);
        if (employeeData) {
            // Re-run analysis with new holidays, preserving user edits on a deep copy of the data.
            const dataToReAnalyze = employeeData.map(emp => ({
                ...emp,
                records: emp.records.map(rec => ({ ...rec })),
            }));
            const reAnalyzed = analyzeData(dataToReAnalyze, newHolidays);
            setEmployeeData(reAnalyzed);
            showMessage(setSuccessMessage, 'Holidays updated and report re-analyzed.');
        }
    }

    const STEPS = [AppStep.UPLOAD, AppStep.PREVIEW, AppStep.REPORT];
    
    const renderStepContent = () => {
        switch (step) {
            case AppStep.UPLOAD:
                return <FileUpload onFileUploaded={handleFileUploaded} />;
            case AppStep.PREVIEW:
                return employeeData && <DataPreview data={employeeData} onAnalyze={handleAIAnalysis} onSkip={handleSkipToReport} isAnalyzing={isLoading}/>;
            case AppStep.REPORT:
                return employeeData && <ReportView data={employeeData} onRecordUpdate={handleRecordUpdate} onHolidaysUpdate={handleHolidaysUpdate} holidays={holidays} />;
            default:
                return <FileUpload onFileUploaded={handleFileUploaded} />;
        }
    };

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Employee Attendance Tracker</h1>
                    <p className="mt-2 text-lg text-slate-600">Parse, analyze, and report on employee attendance with ease.</p>
                </header>
                
                {error && (
                    <div className="my-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-3">
                       <XCircleIcon /> {error}
                    </div>
                )}
                {successMessage && (
                    <div className="my-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-3">
                       <CheckCircleIcon /> {successMessage}
                    </div>
                )}

                {isLoading && step === AppStep.UPLOAD && (
                    <div className="flex justify-center items-center flex-col my-10">
                        <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-24 w-24 mb-4"></div>
                        <p className="text-lg font-semibold text-slate-700">Parsing and Analyzing File...</p>
                        <style>{`.loader { border-top-color: #4f46e5; animation: spinner 1.5s linear infinite; } @keyframes spinner { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                )}

                <main className="bg-white rounded-xl shadow-lg p-6 min-h-[500px] flex flex-col items-center">
                    <div className="w-full mb-12">
                        <Stepper currentStep={step} steps={STEPS} />
                    </div>
                    <div className="w-full flex-grow">
                        {renderStepContent()}
                    </div>
                </main>
                 <footer className="text-center mt-8">
                    {step !== AppStep.UPLOAD && 
                        <button onClick={resetState} className="text-sm text-slate-500 hover:text-slate-700 hover:underline">Start over with a new file</button>
                    }
                </footer>
            </div>
        </div>
    );
}

export default App;