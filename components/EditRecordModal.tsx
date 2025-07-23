
import React, { useState, useEffect } from 'react';
import { AttendanceRecord, RecordUpdatePayload } from '../types';
import { QUICK_REASONS, FULL_DAY_HOURS } from '../constants';

interface EditRecordModalProps {
  record: AttendanceRecord | null;
  onClose: () => void;
  onSave: (payload: RecordUpdatePayload) => void;
}

const EditRecordModal: React.FC<EditRecordModalProps> = ({ record, onClose, onSave }) => {
  const [reason, setReason] = useState('');
  const [creditHours, setCreditHours] = useState<number | undefined>(undefined);
  const [selectedAction, setSelectedAction] = useState('');

  useEffect(() => {
    if (record) {
      setReason(record.reason || '');
      setCreditHours(undefined);
      setSelectedAction('');
    }
  }, [record]);

  if (!record) return null;

  const handleActionChange = (action: string) => {
    setSelectedAction(action);
    if (action === 'other') {
      setReason('');
      setCreditHours(undefined);
    } else if (action) {
      const quickReason = QUICK_REASONS.find(qr => qr.value === action);
      if (quickReason) {
        setReason(quickReason.value);
        setCreditHours(quickReason.creditHours);
      }
    }
  };

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
              <label htmlFor="action-select" className="block text-sm font-medium text-slate-700">Action</label>
              <select
                id="action-select"
                value={selectedAction}
                onChange={(e) => handleActionChange(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select an action...</option>
                {QUICK_REASONS.map(qr => (
                  <option key={qr.value} value={qr.value}>{qr.label}</option>
                ))}
                <option value="other">Other (specify reason)</option>
              </select>
            </div>
            {(selectedAction === 'other' || selectedAction === '') && (
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-slate-700">Reason / Note</label>
              <textarea
                id="reason"
                rows={3}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setCreditHours(undefined);
                }}
                placeholder="e.g., Client meeting ran late, Approved leave, etc."
              />
            </div>
            )}
            {creditHours !== undefined && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700">
                  <span className="font-semibold">Credit Hours:</span> {creditHours} hours will be credited for this day.
                </p>
              </div>
            )}
            {selectedAction && selectedAction !== 'other' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">Selected:</span> {selectedAction}
                </p>
              </div>
            )}
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