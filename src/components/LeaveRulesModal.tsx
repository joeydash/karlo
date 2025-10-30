import React from 'react';
import { X, FileText, Calendar, Clock, Info, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { LeaveType } from '../types/leaveType';

interface LeaveRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveTypes: LeaveType[];
  userJoiningDate: string | null;
}

const LeaveRulesModal: React.FC<LeaveRulesModalProps> = ({ isOpen, onClose, leaveTypes, userJoiningDate }) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateProratedAllowance = (annualAllowance: number) => {
    if (!userJoiningDate) {
      return annualAllowance;
    }
    
    const joiningDate = new Date(userJoiningDate);
    const currentDate = new Date();
    const millisecondsInDay = 1000 * 60 * 60 * 24;
    const currentYear = new Date().getFullYear();
    
    if (joiningDate.getFullYear() < currentYear) {
      const yearStart = new Date(currentYear, 0, 1);
      const daysFromYearStartToToday = Math.floor((currentDate.getTime() - yearStart.getTime()) / millisecondsInDay) + 1;
      const proratedAllowance = Math.floor((daysFromYearStartToToday / 365) * annualAllowance);
      return Math.max(0, proratedAllowance);
    }
    
    const daysFromJoiningToToday = Math.floor((currentDate.getTime() - joiningDate.getTime()) / millisecondsInDay) + 1;
    const proratedAllowance = Math.floor((daysFromJoiningToToday / 365) * annualAllowance);
    return Math.max(0, proratedAllowance);
  };

  const isCurrentYearJoiner = userJoiningDate && new Date(userJoiningDate).getFullYear() === new Date().getFullYear();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Leave Rules & Guidelines</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Essential leave policies and guidelines</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Leave Entitlements */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">Your Leave Entitlements</h3>
            </div>
            
            {userJoiningDate && (
              <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Joined:</strong> {formatDate(userJoiningDate)}
                  {isCurrentYearJoiner && (
                    <span className="ml-2 text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded-full">
                      Prorated allowances applied
                    </span>
                  )}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {leaveTypes.map((leaveType) => {
                const proratedAllowance = calculateProratedAllowance(leaveType.allowance_days);
                const isProrated = proratedAllowance !== leaveType.allowance_days;
                
                return (
                  <div key={leaveType.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-100 dark:border-blue-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">{leaveType.display_name}</h4>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{proratedAllowance}</span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {isProrated ? `Prorated (Annual: ${leaveType.allowance_days})` : 'Annual allowance'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* General Policies */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-green-900 dark:text-green-100">General Policies</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">Submit leave requests through the platform for approval and tracking</p>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">Provide at least 24 hours advance notice for planned leaves</p>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">Choose between full day, first half (morning), or second half (afternoon)</p>
              </div>
              
              <div className="flex items-start space-x-3">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">Leave allowances are calculated proportionally based on your joining date</p>
              </div>
            </div>
          </div>

          {/* Day Part Rules */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">Day Part Options</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-100 dark:border-purple-700">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-md flex items-center justify-center">
                    <Calendar className="h-3 w-3 text-blue-600" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Full Day</h4>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Complete day off from work</p>
                <div className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-md">
                  Counts as 1.0 day
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-100 dark:border-purple-700">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-md flex items-center justify-center">
                    <Clock className="h-3 w-3 text-green-600" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">First Half</h4>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Morning session (9 AM - 1 PM)</p>
                <div className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-md">
                  Counts as 0.5 day
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-100 dark:border-purple-700">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/30 rounded-md flex items-center justify-center">
                    <Clock className="h-3 w-3 text-orange-600" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Second Half</h4>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Afternoon session (2 PM - 6 PM)</p>
                <div className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-md">
                  Counts as 0.5 day
                </div>
              </div>
            </div>
          </div>

          {/* Important Guidelines */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">Important Guidelines</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">Leave requests can be submitted for past, current, or future dates</p>
              </div>
              
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">Leave balance is automatically updated when you submit requests</p>
              </div>
              
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">Leave balances reset at the beginning of each calendar year</p>
              </div>
              
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300">Only pending leave requests can be edited or cancelled</p>
              </div>
            </div>
          </div>

          {/* Prorated Calculation Info */}
          {isCurrentYearJoiner && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Info className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100">Prorated Calculation</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Info className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Your leave allowances are calculated proportionally based on your joining date: <strong>{userJoiningDate && formatDate(userJoiningDate)}</strong>
                  </p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Info className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Formula: (Days from joining to today ÷ 365) × Annual allowance
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-600 p-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveRulesModal;