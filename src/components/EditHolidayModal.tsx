import React, { useState, useEffect } from 'react';
import { X, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { useHoliday } from '../hooks/useHoliday';
import { useToast } from '../contexts/ToastContext';
import { Holiday } from '../types/holiday';

interface EditHolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  holiday: Holiday | null;
}

const EditHolidayModal: React.FC<EditHolidayModalProps> = ({ isOpen, onClose, holiday }) => {
  const [formData, setFormData] = useState({
    date: '',
    reason: '',
    type: 'company' as 'national' | 'company' | 'religious' | 'regional' | 'optional'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { updateHoliday, isLoading } = useHoliday();
  const { showSuccess, showError } = useToast();

  const holidayTypes = [
    { value: 'national', label: 'National Holiday', color: 'bg-red-100 text-red-800' },
    { value: 'company', label: 'Company Holiday', color: 'bg-blue-100 text-blue-800' },
    { value: 'religious', label: 'Religious Holiday', color: 'bg-purple-100 text-purple-800' },
    { value: 'regional', label: 'Regional Holiday', color: 'bg-green-100 text-green-800' },
    { value: 'optional', label: 'Optional Holiday', color: 'bg-yellow-100 text-yellow-800' }
  ];

  // Initialize form data when holiday changes
  useEffect(() => {
    if (holiday && isOpen) {
      setFormData({
        date: holiday.date,
        reason: holiday.reason,
        type: holiday.type
      });
      setErrors({});
    }
  }, [holiday, isOpen]);

  if (!isOpen || !holiday) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    }

    if (!formData.type) {
      newErrors.type = 'Holiday type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const result = await updateHoliday(holiday.id, {
      date: formData.date,
      reason: formData.reason.trim(),
      type: formData.type
    });

    if (result.success) {
      showSuccess('Holiday updated successfully');
      setErrors({});
      onClose();
    } else {
      showError(result.message || 'Failed to update holiday');
      setErrors({ reason: result.message || 'Failed to update holiday' });
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">Edit Holiday</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">Update holiday information</p>
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
          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              Date *
            </label>
            <input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, date: e.target.value }));
                if (errors.date) setErrors(prev => ({ ...prev, date: '' }));
              }}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                errors.date ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
            />
            {errors.date && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.date}
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              Reason *
            </label>
            <input
              id="reason"
              type="text"
              value={formData.reason}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, reason: e.target.value }));
                if (errors.reason) setErrors(prev => ({ ...prev, reason: '' }));
              }}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                errors.reason ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder="e.g., Independence Day, Christmas, Diwali"
            />
            {errors.reason && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.reason}
              </div>
            )}
          </div>

          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              Holiday Type *
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, type: e.target.value as any }));
                if (errors.type) setErrors(prev => ({ ...prev, type: '' }));
              }}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                errors.type ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
            >
              {holidayTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.type}
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
                  <span className="hidden sm:inline">Update Holiday</span>
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

export default EditHolidayModal;