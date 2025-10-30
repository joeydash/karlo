import React, { useState, useEffect } from 'react';
import { X, Settings, Loader2, AlertCircle, Calendar, FileText } from 'lucide-react';
import { useLeaveType } from '../hooks/useLeaveType';
import { useToast } from '../contexts/ToastContext';
import { LeaveType } from '../types/leaveType';

interface EditLeaveTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveType: LeaveType | null;
}

const EditLeaveTypeModal: React.FC<EditLeaveTypeModalProps> = ({ isOpen, onClose, leaveType }) => {
  const [formData, setFormData] = useState({
    type_code: '',
    display_name: '',
    allowance_days: 0,
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { updateLeaveType, isLoading } = useLeaveType();
  const { showSuccess, showError } = useToast();

  // Initialize form data when leaveType changes
  useEffect(() => {
    if (leaveType && isOpen) {
      setFormData({
        type_code: leaveType.type_code,
        display_name: leaveType.display_name,
        allowance_days: leaveType.allowance_days,
        description: leaveType.description || ''
      });
      setErrors({});
    }
  }, [leaveType, isOpen]);

  if (!isOpen || !leaveType) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.type_code.trim()) {
      newErrors.type_code = 'Type code is required';
    } else if (!/^[a-z_]+$/.test(formData.type_code)) {
      newErrors.type_code = 'Type code can only contain lowercase letters and underscores';
    }

    if (!formData.display_name.trim()) {
      newErrors.display_name = 'Display name is required';
    }

    if (formData.allowance_days < 0) {
      newErrors.allowance_days = 'Allowance days cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const result = await updateLeaveType(leaveType.id, {
      type_code: formData.type_code.trim(),
      display_name: formData.display_name.trim(),
      allowance_days: formData.allowance_days,
      description: formData.description.trim() || undefined
    });

    if (result.success) {
      showSuccess('Leave type updated successfully');
      setErrors({});
      onClose();
    } else {
      showError(result.message || 'Failed to update leave type');
      setErrors({ type_code: result.message || 'Failed to update leave type' });
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">Edit Leave Type</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">Update leave type settings</p>
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Display Name */}
          <div>
            <label htmlFor="display_name" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              Display Name *
            </label>
            <input
              id="display_name"
              type="text"
              value={formData.display_name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, display_name: e.target.value }));
                if (errors.display_name) setErrors(prev => ({ ...prev, display_name: '' }));
              }}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                errors.display_name ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder="e.g., Casual Leave, Sick Leave"
            />
            {errors.display_name && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.display_name}
              </div>
            )}
          </div>

          {/* Type Code */}
          <div>
            <label htmlFor="type_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type Code *
            </label>
            <input
              id="type_code"
              type="text"
              value={formData.type_code}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, type_code: e.target.value }));
                if (errors.type_code) setErrors(prev => ({ ...prev, type_code: '' }));
              }}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                errors.type_code ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder="e.g., casual, sick, annual"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Used internally. Only lowercase letters and underscores.</p>
            {errors.type_code && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.type_code}
              </div>
            )}
          </div>

          {/* Allowance Days */}
          <div>
            <label htmlFor="allowance_days" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Allowance Days *
            </label>
            <input
              id="allowance_days"
              type="number"
              min="0"
              value={formData.allowance_days}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, allowance_days: parseInt(e.target.value) || 0 }));
                if (errors.allowance_days) setErrors(prev => ({ ...prev, allowance_days: '' }));
              }}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                errors.allowance_days ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder="12"
            />
            {errors.allowance_days && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.allowance_days}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Optional description or rules for this leave type..."
            />
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
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Update Leave Type</span>
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

export default EditLeaveTypeModal;