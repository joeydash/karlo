import React, { useState } from 'react';
import { X, Search, User, Briefcase, UserCheck } from 'lucide-react';
import { Member } from '../types/member';

interface SelectMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mentorId: string) => void;
  members: Member[];
  currentMemberId?: string;
  selectedMentorId?: string;
}

const SelectMentorModal: React.FC<SelectMentorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  members,
  currentMemberId,
  selectedMentorId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSelectedMentorId, setTempSelectedMentorId] = useState<string | undefined>(selectedMentorId);

  if (!isOpen) return null;

  const filteredMembers = members.filter(member => {
    if (member.id === currentMemberId) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      member.auth_fullname.fullname.toLowerCase().includes(searchLower) ||
      member.designation?.toLowerCase().includes(searchLower) ||
      member.role.toLowerCase().includes(searchLower)
    );
  });

  const handleSelect = () => {
    if (tempSelectedMentorId) {
      onSelect(tempSelectedMentorId);
      onClose();
    }
  };

  const handleClearSelection = () => {
    setTempSelectedMentorId(undefined);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 gap-3">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">Select Mentor</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">Choose a mentor from your organization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, role, or designation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No members found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMembers.map((member) => {
                const isSelected = tempSelectedMentorId === member.id;
                return (
                  <div
                    key={member.id}
                    onClick={() => setTempSelectedMentorId(member.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">
                          {getInitials(member.auth_fullname.fullname)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {member.auth_fullname.fullname}
                          </h3>
                          {isSelected && (
                            <UserCheck className="h-5 w-5 text-blue-600 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          {member.designation && (
                            <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                              <Briefcase className="h-3 w-3" />
                              <span>{member.designation}</span>
                            </div>
                          )}
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            {member.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 gap-3">
          <button
            onClick={handleClearSelection}
            disabled={!tempSelectedMentorId}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
          >
            Clear Selection
          </button>
          <div className="flex flex-col-reverse sm:flex-row gap-3 order-1 sm:order-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              disabled={!tempSelectedMentorId}
              className="px-6 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select Mentor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectMentorModal;
