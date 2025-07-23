
import React, { useState, useMemo } from 'react';
import { Holiday } from '../types';

interface HolidayManagerProps {
  holidays: Holiday[];
  onClose: () => void;
  onSave: (holidays: Holiday[]) => void;
  dateRange: { start: Date; end: Date };
}

const HolidayManager: React.FC<HolidayManagerProps> = ({ holidays, onClose, onSave, dateRange }) => {
  const [localHolidays, setLocalHolidays] = useState([...holidays]);
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');

  const displayedHolidays = useMemo(() => {
      return localHolidays
        .filter(h => {
          const holidayDate = new Date(h.date + 'T00:00:00Z');
          const startDate = new Date(dateRange.start);
          startDate.setUTCHours(0,0,0,0);
          const endDate = new Date(dateRange.end);
          endDate.setUTCHours(0,0,0,0);
          return holidayDate >= startDate && holidayDate <= endDate;
        })
        .sort((a,b) => a.date.localeCompare(b.date))
  }, [localHolidays, dateRange]);

  const handleAddHoliday = () => {
    if (newHolidayName && newHolidayDate && !localHolidays.some(h => h.date === newHolidayDate)) {
      setLocalHolidays([...localHolidays, { name: newHolidayName, date: newHolidayDate }]);
      setNewHolidayName('');
      setNewHolidayDate('');
    }
  };

  const handleRemoveHoliday = (date: string) => {
    setLocalHolidays(localHolidays.filter(h => h.date !== date));
  };
  
  const handleSave = () => {
    onSave(localHolidays);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in-fast">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold text-slate-800 mb-1">Manage Public Holidays</h2>
        <p className="text-sm text-slate-500 mb-4">Showing holidays for the current report period. Add or remove from the global list.</p>
        
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 mb-4 border rounded-md p-2 bg-slate-50">
            {displayedHolidays.length > 0 ? displayedHolidays.map(holiday => (
                <div key={holiday.date} className="flex items-center justify-between p-2 bg-white shadow-sm rounded-md">
                    <div>
                        <p className="font-medium text-slate-700">{holiday.name}</p>
                        <p className="text-sm text-slate-500">{new Date(holiday.date + 'T00:00:00Z').toLocaleDateString(undefined, { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <button onClick={() => handleRemoveHoliday(holiday.date)} className="text-red-500 hover:text-red-700 text-2xl font-bold">&times;</button>
                </div>
            )) : <p className="text-center text-slate-500 py-4">No holidays in this period.</p>}
        </div>

        <div className="border-t pt-4 space-y-3">
            <h3 className="font-semibold text-slate-700">Add New Holiday</h3>
            <div className="flex flex-col sm:flex-row gap-2">
                <input 
                    type="date"
                    value={newHolidayDate}
                    onChange={e => setNewHolidayDate(e.target.value)}
                    className="flex-grow block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <input 
                    type="text"
                    placeholder="Holiday Name"
                    value={newHolidayName}
                    onChange={e => setNewHolidayName(e.target.value)}
                    className="flex-grow block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
            </div>
             <button onClick={handleAddHoliday} className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300" disabled={!newHolidayDate || !newHolidayName}>Add Holiday</button>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Save and Re-analyze
          </button>
        </div>
      </div>
    </div>
  );
};

export default HolidayManager;