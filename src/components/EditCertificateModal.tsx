import React, { useState, useEffect } from 'react';
import { X, Award, Loader2, AlertCircle } from 'lucide-react';
import { useCertificate } from '../hooks/useCertificate';
import { Certificate } from '../types/certificate';
import { useToast } from '../contexts/ToastContext';

interface EditCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: Certificate | null;
}

const EditCertificateModal: React.FC<EditCertificateModalProps> = ({ isOpen, onClose, certificate }) => {
  const [formData, setFormData] = useState({
    from_date: '',
    to_date: '',
    designation: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { updateCertificate, isLoading } = useCertificate(true);
  const { showSuccess, showError } = useToast();
  const modalRef = React.useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  useEffect(() => {
    if (isOpen && certificate) {
      setFormData({
        from_date: certificate.from_date,
        to_date: certificate.to_date,
        designation: certificate.designation || ''
      });
      setErrors({});
    }
  }, [isOpen, certificate]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!isOpen || !certificate) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.from_date) {
      newErrors.from_date = 'From date is required';
    }

    if (!formData.to_date) {
      newErrors.to_date = 'To date is required';
    }

    if (formData.from_date && formData.to_date) {
      if (new Date(formData.to_date) < new Date(formData.from_date)) {
        newErrors.to_date = 'To date cannot be before from date';
      }
    }

    if (!formData.designation.trim()) {
      newErrors.designation = 'Designation is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const result = await updateCertificate(certificate.id, {
      designation: formData.designation.trim(),
      from_date: formData.from_date,
      to_date: formData.to_date
    });

    if (result.success) {
      setErrors({});
      showSuccess('Certificate updated successfully');
      onClose();
    } else {
      showError(result.message || 'Failed to update certificate');
      setErrors({ designation: result.message || 'Failed to update certificate' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 backdrop-blur-sm">
      <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Award className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">Edit Certificate</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">Update certificate details</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200 flex-shrink-0"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          <div>
            <label htmlFor="org_name" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              Organization Name
            </label>
            <input
              id="org_name"
              type="text"
              value={certificate.org_name}
              disabled
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="designation" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              Designation *
            </label>
            <input
              id="designation"
              type="text"
              value={formData.designation}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, designation: e.target.value }));
                if (errors.designation) setErrors(prev => ({ ...prev, designation: '' }));
              }}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                errors.designation ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder="e.g., Software Engineer, Project Manager"
            />
            {errors.designation && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.designation}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="from_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              From Date *
            </label>
            <input
              id="from_date"
              type="date"
              value={formData.from_date}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, from_date: e.target.value }));
                if (errors.from_date) setErrors(prev => ({ ...prev, from_date: '' }));
              }}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                errors.from_date ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]`}
              style={{
                colorScheme: document.documentElement.classList.contains('dark') ? 'dark' : 'light'
              }}
            />
            {errors.from_date && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.from_date}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="to_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              To Date *
            </label>
            <input
              id="to_date"
              type="date"
              value={formData.to_date}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, to_date: e.target.value }));
                if (errors.to_date) setErrors(prev => ({ ...prev, to_date: '' }));
              }}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                errors.to_date ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]`}
              style={{
                colorScheme: document.documentElement.classList.contains('dark') ? 'dark' : 'light'
              }}
            />
            {errors.to_date && (
              <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.to_date}
              </div>
            )}
          </div>

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
                  <Award className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Update Certificate</span>
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

export default EditCertificateModal;
