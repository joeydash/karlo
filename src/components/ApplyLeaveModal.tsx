import React, { useState } from 'react';
import { X, Calendar, Loader2, AlertCircle, Clock, User } from 'lucide-react';
import { useLeave } from '../hooks/useLeave';
import { useLeaveType } from '../hooks/useLeaveType';
import { useOrganization } from '../hooks/useOrganization';
import { useAuth } from '../hooks/useAuth';
import { useHoliday } from '../hooks/useHoliday';
import { useToast } from '../contexts/ToastContext';
import { useMember } from '../hooks/useMember';

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMemberId?: string;
}

const ApplyLeaveModal: React.FC<ApplyLeaveModalProps> = ({ isOpen, onClose, selectedMemberId }) => {
  const [formData, setFormData] = useState({
    leave_type_id: '',
    leave_date: '',
    leave_end_date: '',
    day_part: 'full_day' as 'full_day' | 'first_half' | 'second_half'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { applyLeave, isLoading } = useLeave();
  const { leaveTypes } = useLeaveType();
  const { currentOrganization } = useOrganization();
  const { user: currentUser } = useAuth();
  const { holidays } = useHoliday();
  const { showSuccess, showError } = useToast();
  const { members } = useMember();

  // Get the member we're applying leave for
  const targetMember = members.find(m => m.user_id === (selectedMemberId || currentUser?.id));
  const isApplyingForOther = selectedMemberId && selectedMemberId !== currentUser?.id;

  const dayPartOptions = [
    { value: 'full_day', label: 'Full Day', description: 'Complete day off' },
    { value: 'first_half', label: 'First Half', description: 'Morning session only' },
    { value: 'second_half', label: 'Second Half', description: 'Afternoon session only' }
  ];

  if (!isOpen) return null;


  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.leave_type_id) {
      newErrors.leave_type_id = 'Leave type is required';
    }

    if (!formData.leave_date) {
      newErrors.leave_date = 'Leave date is required';
    }

    if (!formData.day_part) {
      newErrors.day_part = 'Day part is required';
    }

    if (formData.leave_end_date && formData.leave_date) {
      if (new Date(formData.leave_end_date) < new Date(formData.leave_date)) {
        newErrors.leave_end_date = 'End date cannot be before start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!currentOrganization?.id) {
      setErrors({ leave_type_id: 'No organization selected' });
      return;
    }

    // If end date is provided, create multiple leave requests for the date range
    if (formData.leave_end_date) {
      // Get all dates in the range
      const dates: string[] = [];
      const start = new Date(formData.leave_date);
      const end = new Date(formData.leave_end_date);

      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateString = new Date(date).toISOString().split('T')[0];
        dates.push(dateString);
      }

      // Apply leave for each date
      let successCount = 0;
      let lastError = '';

      for (const date of dates) {
        const result = await applyLeave({
          leave_type_id: formData.leave_type_id,
          leave_date: date,
          day_part: formData.day_part
        }, currentOrganization.id, selectedMemberId);

        if (result.success) {
          successCount++;
        } else {
          lastError = result.message || 'Failed to apply for leave';
          break;
        }
      }

      if (successCount === dates.length) {
        showSuccess(`Leave applied successfully for ${dates.length} day${dates.length !== 1 ? 's' : ''}`);
        setFormData({ leave_type_id: '', leave_date: '', leave_end_date: '', day_part: 'full_day' });
        setErrors({});
        onClose();
      } else {
        showError(`Applied for ${successCount}/${dates.length} days. Error: ${lastError}`);
        setErrors({ leave_type_id: `Applied for ${successCount}/${dates.length} days. Error: ${lastError}` });
      }
    } else {
      // Single date leave request
      const result = await applyLeave({
        leave_type_id: formData.leave_type_id,
        leave_date: formData.leave_date,
        day_part: formData.day_part
      }, currentOrganization.id, selectedMemberId);

      if (result.success) {
        showSuccess('Leave applied successfully');
        setFormData({ leave_type_id: '', leave_date: '', leave_end_date: '', day_part: 'full_day' });
        setErrors({});
        onClose();
      } else {
        showError(result.message || 'Failed to apply for leave');
        setErrors({ leave_type_id: result.message || 'Failed to apply for leave' });
      }
    }
  };

  const handleClose = () => {
    setFormData({ leave_type_id: '', leave_date: '', leave_end_date: '', day_part: 'full_day' });
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">Apply for Leave</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">Submit a new leave request</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200 flex-shrink-0"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          {isApplyingForOther && targetMember && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-green-700 dark:text-green-300 flex-shrink-0" />
                <p className="text-sm text-green-800 dark:text-green-300">
                  Applying leave for <span className="font-semibold">{targetMember.auth_fullname?.fullname}</span>
                </p>
              </div>
            </div>
          )}

          {/* Leave Type */}
          <div>
            <label htmlFor="leave_type_id" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              Leave Type *
            </label>
            <select
              id="leave_type_id"
              value={formData.leave_type_id}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, leave_type_id: e.target.value }));
                if (errors.leave_type_id) setErrors(prev => ({ ...prev, leave_type_id: '' }));
              }}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                errors.leave_type_id ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
            >
              <option value="">Select leave type</option>
              {leaveTypes.map((leaveType) => (
                <option key={leaveType.id} value={leaveType.id}>
                  {leaveType.display_name} ({leaveType.allowance_days} days)
                </option>
              ))}
            </select>
            {errors.leave_type_id && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.leave_type_id}
              </div>
            )}
          </div>

          {/* Leave Date */}
          <div>
            <label htmlFor="leave_date" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              Leave Date *
            </label>
            <input
              id="leave_date"
              type="date"
              value={formData.leave_date}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, leave_date: e.target.value }));
                if (errors.leave_date) setErrors(prev => ({ ...prev, leave_date: '' }));
              }}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                errors.leave_date ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]`}
              style={{
                colorScheme: document.documentElement.classList.contains('dark') ? 'dark' : 'light'
              }}
            />
            {errors.leave_date && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.leave_date}
              </div>
            )}
          </div>

          {/* Leave End Date */}
          <div>
            <label htmlFor="leave_end_date" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              Leave End Date (Optional)
            </label>
            <input
              id="leave_end_date"
              type="date"
              value={formData.leave_end_date}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, leave_end_date: e.target.value }));
                if (errors.leave_end_date) setErrors(prev => ({ ...prev, leave_end_date: '' }));
              }}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                errors.leave_end_date ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]`}
              style={{
                colorScheme: document.documentElement.classList.contains('dark') ? 'dark' : 'light'
              }}
            />
            {formData.leave_end_date && formData.leave_date && !errors.leave_date && !errors.leave_end_date && (
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                {(() => {
                  const totalDays = Math.ceil((new Date(formData.leave_end_date).getTime() - new Date(formData.leave_date).getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  return `${totalDays} day${totalDays !== 1 ? 's' : ''} of leave will be applied`;
                })()}
              </p>
            )}
            {errors.leave_end_date && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.leave_end_date}
              </div>
            )}
          </div>

          {/* Day Part */}
          <div>
            <label htmlFor="day_part" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
              Day Part *
            </label>
            <div className="space-y-1.5 sm:space-y-2">
              {dayPartOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, day_part: option.value }));
                    if (errors.day_part) setErrors(prev => ({ ...prev, day_part: '' }));
                  }}
                  className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.day_part === option.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                  }`}
                >
                  <div className="text-left">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{option.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{option.description}</p>
                  </div>
                  {formData.day_part === option.value && (
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
            {errors.day_part && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.day_part}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-2 sm:space-x-3 pt-2 sm:pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Applying...</span>
                  <span className="sm:hidden">Applying</span>
                </>
              ) : (
                <>
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Apply for Leave</span>
                  <span className="sm:hidden">Apply</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyLeaveModal;