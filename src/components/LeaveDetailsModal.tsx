import React from 'react';
import { X, Calendar, User, Clock, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Leave } from '../types/leave';

interface LeaveDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leave: Leave | null;
}

const LeaveDetailsModal: React.FC<LeaveDetailsModalProps> = ({ isOpen, onClose, leave }) => {
  if (!isOpen || !leave) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDayPartLabel = (dayPart: string) => {
    switch (dayPart) {
      case 'full_day':
        return 'Full Day';
      case 'first_half':
        return 'First Half';
      case 'second_half':
        return 'Second Half';
      default:
        return dayPart;
    }
  };

  const getDayPartColor = (dayPart: string) => {
    switch (dayPart) {
      case 'full_day':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'first_half':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'second_half':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5" />;
      case 'rejected':
        return <XCircle className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'from-green-500 to-emerald-600 text-white';
      case 'rejected':
        return 'from-red-500 to-red-600 text-white';
      default:
        return 'from-yellow-500 to-orange-600 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending Review';
    }
  };

  const getInitials = (fullname: string) => {
    return fullname
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">Leave Details</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">Leave request information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200 flex-shrink-0"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-8">
          {/* Leave Details */}
          <div className="space-y-4 sm:space-y-6">
            {/* Leave Type Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-100 dark:border-blue-800">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Leave Type</h3>
              </div>
              <div>
                <p className="text-base sm:text-xl font-bold text-blue-800 dark:text-blue-300 mb-2">{leave.karlo_leave_type?.display_name || 'Unknown Leave Type'}</p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex items-center space-x-1">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">Code:</span>
                    <span className="text-blue-700 dark:text-blue-300 font-mono bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded-md">{leave.karlo_leave_type?.type_code || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">Allowance:</span>
                    <span className="text-blue-700 dark:text-blue-300 font-semibold">{leave.karlo_leave_type?.allowance_days || 0} days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Date and Day Part Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
              {/* Leave Date Card */}
              <div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-purple-100 dark:border-purple-800">
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <h3 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">Leave Date</h3>
                  </div>
                  <p className="text-sm sm:text-xl font-bold text-purple-800 dark:text-purple-300">
                    {formatDate(leave.leave_date)}
                  </p>
                </div>
              </div>

              {/* Day Part Card */}
              <div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-green-100 dark:border-green-800">
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <h3 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">Day Part</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold ${getDayPartColor(leave.day_part)}`}>
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      {getDayPartLabel(leave.day_part)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Card */}
              <div>
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-indigo-100 dark:border-indigo-800">
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br ${getStatusColor(leave.status || 'pending')} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      {getStatusIcon(leave.status || 'pending')}
                    </div>
                    <h3 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">Status</h3>
                  </div>
                  <p className="text-sm sm:text-xl font-bold text-indigo-800 dark:text-indigo-300">
                    {getStatusLabel(leave.status || 'pending')}
                  </p>
                </div>
              </div>
            </div>

            {/* Applied On Card */}
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-gray-500 to-slate-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Applied On</h3>
              </div>
              <div>
                <p className="text-sm sm:text-xl font-bold text-gray-800 dark:text-gray-200">{formatDateTime(leave.created_at)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Request submitted</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-600 p-4 sm:p-6">
          <button
            onClick={onClose}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveDetailsModal;