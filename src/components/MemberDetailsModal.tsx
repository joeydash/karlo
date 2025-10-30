import React, { useState } from 'react';
import { X, User, Mail, Phone, Briefcase, Calendar, IndianRupee, Award, UserCheck, Users, UserMinus, RefreshCw } from 'lucide-react';
import { Member } from '../types/member';
import { useOrganization } from '../hooks/useOrganization';
import ConfirmationModal from './ConfirmationModal';

interface MemberDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  mentorInfo?: Member | null;
  onAssignMentor?: (memberId: string) => void;
  onRemoveMentor?: (memberId: string) => void;
}

const MemberDetailsModal: React.FC<MemberDetailsModalProps> = ({ isOpen, onClose, member, mentorInfo, onAssignMentor, onRemoveMentor }) => {
  const { currentOrganization } = useOrganization();
  const [showRemoveMentorConfirm, setShowRemoveMentorConfirm] = useState(false);

  if (!isOpen) return null;

  const hasMentor = !!member.mentor_id;
  const isAdmin = currentOrganization?.user_role === 'admin';

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6 rounded-t-2xl sm:rounded-t-3xl z-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {member.auth_fullname.fullname || 'Unknown Member'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">Member Details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors flex-shrink-0"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Award className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Role</span>
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {member.role || 'Not assigned'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Briefcase className="h-5 w-5 text-green-600" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Designation</span>
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {member.designation || 'Not assigned'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Calendar className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Joining Date</span>
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {formatDate(member.joining_date)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-2xl p-4">
              <div className="flex items-center space-x-3 mb-2">
                <IndianRupee className="h-5 w-5 text-pink-600" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Compensation</span>
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {isAdmin ? (member.compensation || 'Not set') : 'Non-Disclosable'}
              </p>
            </div>
            </div>

            {/* Intern Status and Mentor Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {member.is_intern && (
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 text-white">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="h-5 w-5" />
                    <span className="font-semibold">Intern Status</span>
                  </div>
                  <p className="text-sm mt-1 opacity-90">This member is currently an intern</p>
                </div>
              )}

              {/* Mentor Info or Assign Mentor Button */}
              <div className={member.is_intern ? '' : 'md:col-span-2'}>
                {hasMentor && mentorInfo ? (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4 border-2 border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <Users className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mentor</span>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center space-x-1">
                          {onAssignMentor && (
                            <button
                              onClick={() => onAssignMentor(member.id)}
                              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                              title="Change mentor"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          )}
                          {onRemoveMentor && (
                            <button
                              onClick={() => setShowRemoveMentorConfirm(true)}
                              className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                              title="Remove mentor"
                            >
                              <UserMinus className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-xs">
                          {mentorInfo.auth_fullname.fullname.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-gray-900 dark:text-white truncate">
                          {mentorInfo.auth_fullname.fullname}
                        </p>
                        {mentorInfo.designation && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                            <Briefcase className="h-3 w-3 mr-1" />
                            {mentorInfo.designation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : isAdmin && onAssignMentor ? (
                  <button
                    onClick={() => onAssignMentor(member.id)}
                    className="w-full h-full min-h-[100px] px-4 py-4 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-2xl transition-all duration-200 shadow-lg flex flex-col items-center justify-center space-y-2"
                  >
                    <Users className="h-6 w-6" />
                    <span>Assign Mentor</span>
                  </button>
                ) : (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 rounded-2xl p-4 border-2 border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3 mb-2">
                      <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mentor</span>
                    </div>
                    <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                      Unassigned
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Additional Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Member ID:</span>
                <span className="font-mono text-gray-900 dark:text-white text-xs">{member.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">User ID:</span>
                <span className="font-mono text-gray-900 dark:text-white text-xs">{member.user_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Created:</span>
                <span className="text-gray-900 dark:text-white">{formatDate(member.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Last Updated:</span>
                <span className="text-gray-900 dark:text-white">{formatDate(member.updated_at)}</span>
              </div>
              {member.auth_fullname.last_active && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Last Active:</span>
                  <span className="text-gray-900 dark:text-white">
                    {formatDate(member.auth_fullname.last_active)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg"
          >
            Close
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showRemoveMentorConfirm}
        onClose={() => setShowRemoveMentorConfirm(false)}
        onConfirm={() => {
          if (onRemoveMentor) {
            onRemoveMentor(member.id);
          }
          setShowRemoveMentorConfirm(false);
        }}
        title="Remove Mentor"
        message={`Are you sure you want to remove ${mentorInfo?.auth_fullname.fullname || 'the mentor'} as ${member.auth_fullname.fullname}'s mentor?`}
        confirmText="Remove"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
};

export default MemberDetailsModal;
