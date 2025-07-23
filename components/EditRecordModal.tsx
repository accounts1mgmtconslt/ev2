
import React, { useState, useEffect } from 'react';
import { AttendanceRecord, RecordUpdatePayload } from '../types';
import { QUICK_REASONS } from '../constants';

interface EditRecordModalProps {
  record: AttendanceRecord | null;
  onClose: () => void;
  onSave: (payload: RecordUpdatePayload) => void;
}

const EditRecordModal: React.FC<EditRecordModalProps> = ({ record, onClose, onSave }) => {
  const [reason, setReason] = useState('');
  const [creditHours, setCreditHours] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (record) {
      setReason(record.reason || '');
      // Reset credit hours unless a quick reason implies it
      setCreditHours(undefined);
    }
  }, [record]);

  if (!record) return null;

  const handleQuickReasonSelect = (qr: typeof QUICK_REASONS[0]) => {
    setReason(qr.value);
    setCreditHours(qr.creditHours);
  }

  const handleSave = () => {
    onSave({
      recordId: record.id,
      updates: {
        reason,
        creditHours
      }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in-fast">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800">Edit Record</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-2xl font-bold">&times;</button>
        </div>
        <div className="space-y-4">
            <div>
                <p><span className="font-semibold">Date:</span> {new Date(record.date).toLocaleDateString()}</p>
                <p><span className="font-semibold">Employee:</span> {record.name}</p>
                <p><span className="font-semibold">Status:</span> {record.status}</p>
            </div>
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-slate-700">Reason / Note</label>
              <textarea
                id="reason"
                rows={3}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setCreditHours(undefined); // Manual typing resets credit hours
                }}
                placeholder="e.g., Client meeting ran late, Approved leave, etc."
              />
            </div>
            <div>
              <p className="block text-sm font-medium text-slate-700 mb-2">Quick Reasons</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_REASONS.map(qr => (
                  <button 
                    key={qr.label}
                    onClick={() => handleQuickReasonSelect(qr)}
                    className="px-3 py-1 text-sm border border-slate-300 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {qr.label}
                  </button>
                ))}
              </div>
              {creditHours !== undefined && (
                <p className="text-xs text-green-600 mt-2">Note: This selection will credit {creditHours} hours for this day.</p>
              )}
            </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditRecordModal;