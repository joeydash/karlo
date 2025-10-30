import React, { useState, useEffect } from 'react';
import { X, Users, Plus, Check, Loader2, User, Search } from 'lucide-react';
import { useTeam } from '../hooks/useTeam';
import { useMember } from '../hooks/useMember';
import { useToast } from '../contexts/ToastContext';
import ConfirmationModal from './ConfirmationModal';

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  currentMembers: string[];
  teamMembers?: Array<{ id: string; user_id: string; }>;
}

const AddTeamMemberModal: React.FC<AddTeamMemberModalProps> = ({
  isOpen,
  onClose,
  teamId,
  teamName,
  currentMembers,
  teamMembers = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [addedMembers, setAddedMembers] = useState<string[]>([]);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ userId: string; name: string; isExisting: boolean } | null>(null);
  const { addTeamMember, removeTeamMember } = useTeam();
  const { members } = useMember();
  const { showSuccess, showError } = useToast();
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setAddedMembers([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddMember = async (userId: string, memberId: string, memberName: string) => {
    setActionLoading(userId);

    const result = await addTeamMember(teamId, userId, memberId);

    if (result.success) {
      showSuccess('Member added', `${memberName} has been added to ${teamName}`);
      setAddedMembers(prev => [...prev, userId]);
    } else {
      showError('Add failed', result.message || 'Failed to add member');
    }

    setActionLoading(null);
  };

  const handleRemoveClick = (userId: string, memberName: string, isExisting: boolean) => {
    setMemberToRemove({ userId, name: memberName, isExisting });
    setShowRemoveConfirm(true);
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;

    if (memberToRemove.isExisting) {
      // Remove from actual team
      const teamMember = teamMembers.find(tm => tm.user_id === memberToRemove.userId);
      if (teamMember) {
        const result = await removeTeamMember(teamMember.id);
        if (result.success) {
          showSuccess('Member removed', `${memberToRemove.name} has been removed from ${teamName}`);
        } else {
          showError('Remove failed', result.message || 'Failed to remove member');
        }
      }
    } else {
      // Just remove from newly added list
      setAddedMembers(prev => prev.filter(id => id !== memberToRemove.userId));
    }

    setShowRemoveConfirm(false);
    setMemberToRemove(null);
  };

  const handleCancelRemove = () => {
    setShowRemoveConfirm(false);
    setMemberToRemove(null);
  };

  const handleOutsideClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getInitials = (fullname: string) => {
    return fullname
      .split(' ')
      .map((name) => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Filter members based on search term and exclude current team members and newly added members
  const allExcludedMembers = [...currentMembers, ...addedMembers];
  const availableMembers = members.filter(
    (member) =>
      !allExcludedMembers.includes(member.user_id) &&
      member.auth_fullname.fullname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get the members who were just added and existing current members
  const allTeamMemberIds = [...currentMembers, ...addedMembers];
  const displayAddedMembers = members.filter((member) => allTeamMemberIds.includes(member.user_id));

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50"
      onClick={handleOutsideClick}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">Add Members</h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{teamName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 flex-shrink-0"
              aria-label="Close modal"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {displayAddedMembers.length > 0 && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Team Members ({displayAddedMembers.length})
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {displayAddedMembers.map((member) => {
                const isNewlyAdded = addedMembers.includes(member.user_id);
                const isExisting = currentMembers.includes(member.user_id);
                return (
                  <div
                    key={member.user_id}
                    className="relative group"
                    title={member.auth_fullname.fullname}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-gray-200 dark:border-gray-600">
                      {member.auth_fullname.dp && member.auth_fullname.dp.trim() !== '' ? (
                        <img
                          src={member.auth_fullname.dp}
                          alt={member.auth_fullname.fullname}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold text-white">
                          {getInitials(member.auth_fullname.fullname)}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveClick(member.user_id, member.auth_fullname.fullname, isExisting)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors duration-200 shadow-sm"
                      title={isExisting ? "Remove from team" : "Remove from added list"}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {availableMembers.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? `No members found matching "${searchTerm}"` : 'All members are already in this team'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Available Members ({availableMembers.length})
              </p>
              {availableMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {member.auth_fullname.dp && member.auth_fullname.dp.trim() !== '' ? (
                      <img
                        src={member.auth_fullname.dp}
                        alt={member.auth_fullname.fullname}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-white">
                          {getInitials(member.auth_fullname.fullname)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {member.auth_fullname.fullname}
                      </p>
                      {member.designation && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {member.designation}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddMember(member.user_id, member.id, member.auth_fullname.fullname)}
                    disabled={actionLoading === member.user_id}
                    className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200 disabled:opacity-50 flex-shrink-0"
                  >
                    {actionLoading === member.user_id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                    <span>Add</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 rounded-xl transition-all duration-200 border border-gray-200 dark:border-gray-500"
          >
            Done
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showRemoveConfirm}
        onClose={handleCancelRemove}
        onConfirm={handleConfirmRemove}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToRemove?.name} from ${teamName}?`}
        confirmText="Remove"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
      />
    </div>
  );
};

export default AddTeamMemberModal;
