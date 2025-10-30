import React, { useState, useEffect } from 'react';
import { X, Users, Loader2, AlertCircle, Save, UserPlus, Trash2, Edit, UserCog, Calendar, FileText, ArrowLeft } from 'lucide-react';
import { useTeam } from '../hooks/useTeam';
import { useToast } from '../contexts/ToastContext';
import { useOrganization } from '../hooks/useOrganization';
import { Team } from '../types/team';
import AddTeamMemberModal from './AddTeamMemberModal';
import ChangeMemberRoleModal from './ChangeMemberRoleModal';
import ConfirmationModal from './ConfirmationModal';

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  initialEditMode?: boolean;
}

const EditTeamModal: React.FC<EditTeamModalProps> = ({ isOpen, onClose, team, initialEditMode = false }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(initialEditMode);
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{ id: string; name: string; role: string } | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const { updateTeam, removeTeamMember } = useTeam();
  const { showSuccess, showError } = useToast();
  const { currentOrganization } = useOrganization();

  const isCurrentUserAdmin = currentOrganization?.user_role === 'admin';

  // Check if there are any changes
  const hasChanges = team ? (
    name.trim() !== team.team_name ||
    (description.trim() || '') !== (team.description || '')
  ) : false;

  useEffect(() => {
    if (isOpen && team) {
      setName(team.team_name);
      setDescription(team.description || '');
      setErrors({});
    }
  }, [isOpen, team]);

  useEffect(() => {
    if (isOpen) {
      setIsEditMode(initialEditMode);
      setIsFlipped(initialEditMode);
    }
  }, [isOpen, initialEditMode]);

  if (!isOpen || !team) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Team name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Team name must be at least 2 characters';
    } else if (name.trim().length > 100) {
      newErrors.name = 'Team name must not exceed 100 characters';
    } else if (!/^[a-zA-Z0-9\s\-_&.()]+$/.test(name.trim())) {
      newErrors.name = 'Team name can only contain letters, numbers, spaces, and basic punctuation';
    }

    if (description.trim().length > 500) {
      newErrors.description = 'Description must not exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsUpdating(true);

    const result = await updateTeam(team.id, {
      team_name: name.trim(),
      description: description.trim() || undefined,
    });

    setIsUpdating(false);

    if (result.success) {
      showSuccess('Team updated', `${name} has been updated successfully`);
      setIsFlipped(false);
      setTimeout(() => {
        setIsEditMode(false);
      }, 700);
    } else {
      showError('Update failed', result.message || 'Failed to update team');
    }
  };

  const handleRemoveClick = (memberId: string, memberName: string) => {
    setMemberToRemove({ id: memberId, name: memberName });
    setShowRemoveConfirm(true);
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;

    setRemovingMemberId(memberToRemove.id);

    const result = await removeTeamMember(memberToRemove.id);

    if (result.success) {
      showSuccess('Member removed', `${memberToRemove.name} has been removed from ${team.team_name}`);
    } else {
      showError('Remove failed', result.message || 'Failed to remove member');
    }

    setRemovingMemberId(null);
    setShowRemoveConfirm(false);
    setMemberToRemove(null);
  };

  const handleCancelRemove = () => {
    setShowRemoveConfirm(false);
    setMemberToRemove(null);
  };

  const handleChangeRole = (memberId: string, memberName: string, currentRole: string) => {
    setSelectedMember({ id: memberId, name: memberName, role: currentRole });
    setShowChangeRoleModal(true);
  };

  const handleEditClick = () => {
    setIsEditMode(true);
    setIsFlipped(true);
  };

  const handleBackToView = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setIsEditMode(false);
      setName(team.team_name);
      setDescription(team.description || '');
      setErrors({});
    }, 700);
  };

  const handleOutsideClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (!isUpdating) {
        onClose();
      }
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

  const currentMemberIds = team.karlo_team_members?.map((m) => m.user_id) || [];
  const visibleMembers = team.karlo_team_members || [];
  const totalMembers = team.karlo_team_members_aggregate?.aggregate?.count || 0;
  const remainingCount = totalMembers - visibleMembers.length;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50"
        onClick={handleOutsideClick}
      >
        <div className="relative max-w-4xl w-full h-[95vh] sm:h-[90vh] perspective-1000">
          <div
            className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
          >
            {/* Front Side - View Mode */}
            <div className={`absolute inset-0 w-full h-full backface-hidden ${isFlipped ? 'pointer-events-none' : 'pointer-events-auto'}`}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full h-full flex flex-col">
                <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">Team Details</h2>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">View team information</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {isCurrentUserAdmin && (
                      <button
                        onClick={handleEditClick}
                        className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg"
                      >
                        <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Edit Team</span>
                        <span className="sm:hidden">Edit</span>
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
                      aria-label="Close modal"
                    >
                      <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">{team.team_name}</h3>
                    {team.description && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed">{team.description}</p>
                    )}
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Created {new Date(team.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{totalMembers} member{totalMembers !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                  

                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        Team Members
                      </h3>
                      <div className="flex items-center space-x-3">
                        <span className="px-2 sm:px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs sm:text-sm font-semibold">
                          {totalMembers} Total
                        </span>
                        {isCurrentUserAdmin && (
                          <button
                            onClick={() => setShowAddMemberModal(true)}
                            className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-sm"
                          >
                            <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Add Members</span>
                            <span className="sm:hidden">Add</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {visibleMembers.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600">
                        <Users className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">No members in this team yet</p>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto filter-members-scroll pr-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          {visibleMembers.map((member) => (
                            <div
                              key={member.id}
                              className="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all duration-200"
                            >
                              <div className="flex items-start space-x-3 mb-3">
                                {member.auth_fullname.dp && member.auth_fullname.dp.trim() !== '' ? (
                                  <img
                                    src={member.auth_fullname.dp}
                                    alt={member.auth_fullname.fullname}
                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs sm:text-sm font-bold text-white">
                                      {getInitials(member.auth_fullname.fullname)}
                                    </span>
                                  </div>
                                )}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between min-w-0 w-full gap-1 sm:gap-0">
                                  <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                                    {member.auth_fullname.fullname}
                                  </p>

                                    <p className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold self-start sm:self-auto">
                                      {member.role || 'Member'}
                                    </p>
                                 
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <span className="truncate">Added {new Date(member.created_at).toLocaleDateString()}</span>
                                {isCurrentUserAdmin &&
                                  <button
                                    onClick={() => handleChangeRole(member.id, member.auth_fullname.fullname, member.role || 'Member')}
                                    className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium self-start sm:self-auto"
                                  >
                                    <UserCog className="h-3 w-3" />
                                    <span>Change Role</span>
                                  </button> 
                                }
                              </div>
                            </div>
                          ))}
                          {remainingCount > 0 && (
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-600">
                              <p className="text-gray-500 dark:text-gray-400 font-medium">
                                +{remainingCount} more member{remainingCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-b-2xl sm:rounded-b-3xl">
                  <button
                    onClick={onClose}
                    className="w-full px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 rounded-xl transition-all duration-200 border border-gray-200 dark:border-gray-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

            {/* Back Side - Edit Mode */}
            <div className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 ${isFlipped ? 'pointer-events-auto' : 'pointer-events-none'}`}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full h-full flex flex-col">
                <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <button
                        onClick={handleBackToView}
                        disabled={isUpdating}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 disabled:opacity-50 flex-shrink-0"
                      >
                        <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">Edit Team</h2>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">Update team details and members</p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      disabled={isUpdating}
                      className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 disabled:opacity-50 flex-shrink-0"
                      aria-label="Close modal"
                    >
                      <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div>
                    <label htmlFor="edit-team-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Team Name *
                    </label>
                    <input
                      id="edit-team-name"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                      }}
                      disabled={isUpdating}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                        errors.name
                          ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50`}
                      placeholder="Enter team name..."
                    />
                    {errors.name && (
                      <div className="mt-1 flex items-center text-sm text-red-600 dark:text-red-400">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.name}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="edit-team-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      id="edit-team-description"
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                      }}
                      disabled={isUpdating}
                      rows={4}
                      maxLength={500}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-none disabled:opacity-50 ${
                        errors.description
                          ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:ring-blue-400'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      placeholder="Enter team description..."
                    />
                    <div className="mt-1 flex items-center justify-between">
                      {errors.description && (
                        <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.description}
                        </div>
                      )}
                      <span className={`text-xs ml-auto ${
                        description.length > 450 ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {description.length}/500
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Team Members ({totalMembers})
                      </label>
                      <button
                        onClick={() => setShowAddMemberModal(true)}
                        className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                      >
                        <UserPlus className="h-3 w-3" />
                        <span>Add Members</span>
                      </button>
                    </div>

                    {visibleMembers.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600">
                        <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No members in this team yet</p>
                        <button
                          onClick={() => setShowAddMemberModal(true)}
                          className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-200"
                        >
                          <UserPlus className="h-4 w-4" />
                          <span>Add Members</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto filter-members-scroll pr-2">
                        {visibleMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 group"
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              {member.auth_fullname.dp && member.auth_fullname.dp.trim() !== '' ? (
                                <img
                                  src={member.auth_fullname.dp}
                                  alt={member.auth_fullname.fullname}
                                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs sm:text-sm font-bold text-white">
                                    {getInitials(member.auth_fullname.fullname)}
                                  </span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {member.auth_fullname.fullname}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-2">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Role: <span className="font-semibold">{member.role || 'Member'}</span>
                                  </p>
                                  <span className="text-gray-300 dark:text-gray-600">•</span>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Added {new Date(member.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 sm:gap-2 flex-shrink-0">
                              <button
                                onClick={() => handleChangeRole(member.id, member.auth_fullname.fullname, member.role || 'Member')}
                                className="flex items-center justify-center space-x-1 px-2 sm:px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                                title={`Change role for ${member.auth_fullname.fullname}`}
                              >
                                <UserCog className="h-3 w-3" />
                                <span className="hidden sm:inline">Change Role</span>
                                <span className="sm:hidden">Role</span>
                              </button>
                              <button
                                onClick={() => handleRemoveClick(member.id, member.auth_fullname.fullname)}
                                disabled={removingMemberId === member.id}
                                className="flex items-center justify-center space-x-1 px-2 sm:px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 disabled:opacity-50"
                                title={`Remove ${member.auth_fullname.fullname}`}
                              >
                                {removingMemberId === member.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>
                        ))}
                        {remainingCount > 0 && (
                          <p className="text-xs text-center text-gray-500 dark:text-gray-400 pt-2">
                            +{remainingCount} more member{remainingCount !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-b-2xl sm:rounded-b-3xl">
                  <div className="flex flex-col-reverse sm:flex-row gap-3">
                    <button
                      onClick={handleBackToView}
                      disabled={isUpdating}
                      className="flex-1 px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 rounded-xl transition-all duration-200 border border-gray-200 dark:border-gray-500 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isUpdating || !hasChanges}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddTeamMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        teamId={team.id}
        teamName={team.team_name}
        currentMembers={currentMemberIds}
        teamMembers={visibleMembers.map(m => ({ id: m.id, user_id: m.user_id }))}
      />

      {selectedMember && (
        <ChangeMemberRoleModal
          isOpen={showChangeRoleModal}
          onClose={() => {
            setShowChangeRoleModal(false);
            setSelectedMember(null);
          }}
          memberId={selectedMember.id}
          memberName={selectedMember.name}
          currentRole={selectedMember.role}
        />
      )}

      <ConfirmationModal
        isOpen={showRemoveConfirm}
        onClose={handleCancelRemove}
        onConfirm={handleConfirmRemove}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToRemove?.name} from ${team.team_name}?`}
        confirmText="Remove"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
      />
    </>
  );
};

export default EditTeamModal;
