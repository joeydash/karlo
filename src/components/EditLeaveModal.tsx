import React, { useState, useEffect } from 'react';
import { X, Calendar, Loader2, AlertCircle, Clock } from 'lucide-react';
import { useLeave } from '../hooks/useLeave';
import { useLeaveType } from '../hooks/useLeaveType';
import { useOrganization } from '../hooks/useOrganization';
import { useToast } from '../contexts/ToastContext';
import { Leave } from '../types/leave';

interface EditLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  leave: Leave | null;
}

const EditLeaveModal: React.FC<EditLeaveModalProps> = ({ isOpen, onClose, leave }) => {
  const [formData, setFormData] = useState({
    leave_type_id: '',
    leave_date: '',
    day_part: 'full_day' as 'full_day' | 'first_half' | 'second_half'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { updateLeave, isLoading } = useLeave();
  const { leaveTypes } = useLeaveType();
  const { currentOrganization } = useOrganization();
  const { showSuccess, showError } = useToast();

  const dayPartOptions = [
    { value: 'full_day', label: 'Full Day', description: 'Complete day off' },
    { value: 'first_half', label: 'First Half', description: 'Morning session only' },
    { value: 'second_half', label: 'Second Half', description: 'Afternoon session only' }
  ];

  // Initialize form data when leave changes
  useEffect(() => {
    if (leave && isOpen) {
      setFormData({
        leave_type_id: leave.leave_type_id,
        leave_date: leave.leave_date,
        day_part: leave.day_part
      });
      setErrors({});
    }
  }, [leave, isOpen]);

  if (!isOpen || !leave) return null;

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

    const result = await updateLeave(leave.id, {
      leave_type_id: formData.leave_type_id,
      leave_date: formData.leave_date,
      day_part: formData.day_part
    });

    if (result.success) {
      showSuccess('Leave request updated successfully');
      setErrors({});
      onClose();
    } else {
      showError(result.message || 'Failed to update leave request');
      setErrors({ leave_type_id: result.message || 'Failed to update leave request' });
    }
  };

  const handleClose = () => {
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
              <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">Edit Leave Request</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">Update your leave request details</p>
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
                  <span className="hidden sm:inline">Updating...</span>
                  <span className="sm:hidden">Updating</span>
                </>
              ) : (
                <>
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Update Leave Request</span>
                  <span className="sm:hidden">Update</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLeaveModal;