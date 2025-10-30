import React, { useState, useEffect } from 'react';
import { X, Clock, Save, User, Calendar } from 'lucide-react';
import { useMember } from '../hooks/useMember';
import { useAuth } from '../hooks/useAuth';

interface RecordOOTOHModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startTime: string, startDate: string, endTime: string | null, endDate: string | null, workDone: string | null, selectedMemberId?: string) => void;
  isLoading: boolean;
  selectedMemberId?: string;
}

const RecordOOTOHModal: React.FC<RecordOOTOHModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  selectedMemberId,
}) => {
  const { members } = useMember();
  const { user: currentUser } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [workDone, setWorkDone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get the member we're recording for
  const targetMember = members.find(m => m.user_id === (selectedMemberId || currentUser?.id));
  const isRecordingForOther = selectedMemberId && selectedMemberId !== currentUser?.id;

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setStartDate(today);
      setEndDate('');
      setStartTime(`${hours}:${minutes}`);
      setEndTime('');
      setWorkDone('');
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (endTime) {
      const effectiveEndDate = endDate || startDate;

      if (!effectiveEndDate) {
        newErrors.endDate = 'End date is required when end time is provided';
      } else {
        const startDateTime = new Date(`${startDate}T${startTime}`);
        const endDateTime = new Date(`${effectiveEndDate}T${endTime}`);

        if (endDateTime <= startDateTime) {
          newErrors.endTime = 'End date/time must be after start date/time';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const startDateTime = new Date(startDate);
    startDateTime.setHours(startHours, startMinutes, 0, 0);
    const startTimeISO = startDateTime.toISOString();

    let endTimeISO: string | null = null;
    let endDateValue: string | null = null;
    if (endTime) {
      const effectiveEndDate = endDate || startDate;
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      const endDateTime = new Date(effectiveEndDate);
      endDateTime.setHours(endHours, endMinutes, 0, 0);
      endTimeISO = endDateTime.toISOString();
      endDateValue = effectiveEndDate;
    }

    onConfirm(startTimeISO, startDate, endTimeISO, endDateValue, workDone || null, selectedMemberId);
  };

  const handleClose = () => {
    setStartDate('');
    setEndDate('');
    setStartTime('');
    setEndTime('');
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                Record Office Hours
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                Enter your office start and end times
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0 ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
            <p className="text-xs text-blue-800 dark:text-blue-300 flex items-start">
              <span className="mr-1.5">ℹ️</span>
              <span>
                Enter your office start time and optionally add the end time. You can leave end time empty and update it later.
              </span>
            </p>
          </div>

          {isRecordingForOther && targetMember && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-green-700 dark:text-green-300 flex-shrink-0" />
                <p className="text-sm text-green-800 dark:text-green-300">
                  Recording office hours for <span className="font-semibold">{targetMember.auth_fullname?.fullname}</span>
                </p>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isLoading}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full pl-10 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed [color-scheme:light] dark:[color-scheme:dark] ${
                  errors.startDate
                    ? 'border-red-300 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-400'
                    : 'border-gray-200 dark:border-gray-600 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500'
                }`}
                required
              />
            </div>
            {errors.startDate && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center">
                <span className="mr-1">⚠</span>
                {errors.startDate}
              </p>
            )}
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Date when you entered the office
            </p>
          </div>

          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Time <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isLoading}
                className={`w-full pl-10 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.startTime
                    ? 'border-red-300 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-400'
                    : 'border-gray-200 dark:border-gray-600 focus:ring-green-500 dark:focus:ring-green-400 focus:border-green-500'
                }`}
                required
              />
            </div>
            {errors.startTime && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center">
                <span className="mr-1">⚠</span>
                {errors.startTime}
              </p>
            )}
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Time when you entered the office
            </p>
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isLoading}
                min={startDate}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full pl-10 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed [color-scheme:light] dark:[color-scheme:dark] ${
                  errors.endDate
                    ? 'border-red-300 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-400'
                    : 'border-gray-200 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500'
                }`}
              />
            </div>
            {errors.endDate && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center">
                <span className="mr-1">⚠</span>
                {errors.endDate}
              </p>
            )}
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Date when you left the office (leave empty if same as start date)
            </p>
          </div>

          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Time
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="time"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isLoading}
                className={`w-full pl-10 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.endTime
                    ? 'border-red-300 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-400'
                    : 'border-gray-200 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500'
                }`}
              />
            </div>
            {errors.endTime && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center">
                <span className="mr-1">⚠</span>
                {errors.endTime}
              </p>
            )}
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Time when you left the office (optional)
            </p>
          </div>

          <div>
            <label htmlFor="workDone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Work Done Today
            </label>
            <textarea
              id="workDone"
              value={workDone}
              onChange={(e) => setWorkDone(e.target.value)}
              disabled={isLoading}
              rows={4}
              placeholder="Describe what you worked on today..."
              className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Brief description of tasks completed (optional)
            </p>
          </div>


        </form>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Recording...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Record Hours</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordOOTOHModal;
