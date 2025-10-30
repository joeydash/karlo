import React from 'react';
import { X, AlertTriangle, Trash2, Loader2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  isLoading = false
}) => {
  if (!isOpen) return null;

  const getIconAndColors = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <Trash2 className="h-6 w-6 text-white" />,
          iconBg: 'bg-gradient-to-br from-red-500 to-red-600',
          confirmButton: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-white" />,
          iconBg: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
          confirmButton: 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800'
        };
      case 'info':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-white" />,
          iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
          confirmButton: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
        };
      default:
        return {
          icon: <AlertTriangle className="h-6 w-6 text-white" />,
          iconBg: 'bg-gradient-to-br from-red-500 to-red-600',
          confirmButton: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
        };
    }
  };

  const { icon, iconBg, confirmButton } = getIconAndColors();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      onClose();
    } else if (e.key === 'Enter' && !isLoading) {
      onConfirm();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
      onClick={!isLoading ? onClose : undefined}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
      aria-describedby="confirmation-message"
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
              {icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white" id="confirmation-title">
                {title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label="Close confirmation dialog"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 mb-6" id="confirmation-message">
            {message}
          </p>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${confirmButton}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal