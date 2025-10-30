import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Trash2, Shield, User as UserIcon } from 'lucide-react';
import { useTeam } from '../hooks/useTeam';
import { useMember } from '../hooks/useMember';
import { useOrganization } from '../hooks/useOrganization';
import ConfirmationModal from './ConfirmationModal';

interface MemberTeamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: {
    id: string;
    user_id: string;
    auth_fullname: {
      fullname: string;
      dp?: string;
      blurhash?: string;
    };
  } | null;
}

const MemberTeamsModal: React.FC<MemberTeamsModalProps> = ({ isOpen, onClose, member }) => {
  const { teams, addTeamMember, removeTeamMember, isLoading } = useTeam();
  const { currentOrganization } = useOrganization();
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);
  const [teamToRemove, setTeamToRemove] = useState<{ id: string; name: string } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowAddTeam(false);
      setSelectedTeamId('');
      setSelectedRole('');
    }
  }, [isOpen]);

  if (!isOpen || !member) return null;

  const memberTeams = teams.filter(team =>
    team.karlo_team_members?.some(tm => tm.user_id === member.user_id)
  );

  const availableTeams = teams.filter(team =>
    !team.karlo_team_members?.some(tm => tm.user_id === member.user_id)
  );

  const handleAddToTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId || isSubmitting) return;

    setIsSubmitting(true);
    const result = await addTeamMember(
      selectedTeamId,
      member.user_id,
      member.id,
      selectedRole.trim() || undefined
    );
    setIsSubmitting(false);

    if (result.success) {
      setShowAddTeam(false);
      setSelectedTeamId('');
      setSelectedRole('');
    } else {
      alert(result.message || 'Failed to add member to team');
    }
  };

  const handleRemoveClick = (teamMemberId: string, teamName: string) => {
    setTeamToRemove({ id: teamMemberId, name: teamName });
    setShowConfirmRemove(true);
  };

  const handleConfirmRemove = async () => {
    if (!teamToRemove) return;

    setIsRemoving(true);
    const result = await removeTeamMember(teamToRemove.id);
    setIsRemoving(false);

    if (result.success) {
      setShowConfirmRemove(false);
      setTeamToRemove(null);
    } else {
      alert(result.message || 'Failed to remove member from team');
    }
  };

  const handleCancelRemove = () => {
    setShowConfirmRemove(false);
    setTeamToRemove(null);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            {member.auth_fullname.dp ? (
              <img
                src={member.auth_fullname.dp}
                alt={member.auth_fullname.fullname}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-100 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-gray-100 flex-shrink-0">
                <span className="text-base sm:text-lg font-bold text-white">
                  {getInitials(member.auth_fullname.fullname)}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                {member.auth_fullname.fullname}'s Teams
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block truncate">
                {currentOrganization?.display_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 flex-shrink-0"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-20 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Current Teams ({memberTeams.length})
                  </h3>
                  {availableTeams.length > 0 && (
                    <button
                      onClick={() => setShowAddTeam(!showAddTeam)}
                      className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Add to Team</span>
                    </button>
                  )}
                </div>

                {showAddTeam && availableTeams.length > 0 && (
                  <form onSubmit={handleAddToTeam} className="mb-6 p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-700 shadow-lg">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <UserPlus className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                        Assign to Team
                      </h4>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Team <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={selectedTeamId}
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                            className="w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer hover:border-blue-300 dark:hover:border-blue-500"
                            required
                          >
                            <option value="">Select a team...</option>
                            {availableTeams.map((team) => (
                              <option key={team.id} value={team.id}>
                                {team.team_name} • {team.karlo_team_members_aggregate?.aggregate.count || 0} members
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Role <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          placeholder="e.g., Developer, Designer, Manager..."
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-500"
                        />
                      </div>

                      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddTeam(false);
                            setSelectedTeamId('');
                            setSelectedRole('');
                          }}
                          className="px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!selectedTeamId || isSubmitting}
                          className="flex-1 flex items-center justify-center space-x-2 px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
                        >
                          <UserPlus className="h-4 w-4" />
                          <span>{isSubmitting ? 'Adding...' : 'Add to Team'}</span>
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {memberTeams.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Not assigned to any teams yet
                    </p>
                    {availableTeams.length > 0 && (
                      <button
                        onClick={() => setShowAddTeam(true)}
                        className="mt-4 inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span>Add to Team</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {memberTeams.map((team) => {
                      const teamMembership = team.karlo_team_members?.find(
                        tm => tm.user_id === member.user_id
                      );
                      return (
                        <div
                          key={team.id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <Users className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                {team.team_name}
                              </h4>
                              <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                                <span>
                                  {team.karlo_team_members_aggregate?.aggregate.count || 0} members
                                </span>
                                {teamMembership?.role && (
                                  <>
                                    <span>•</span>
                                    <div className="flex items-center space-x-1">
                                      {teamMembership.role === 'admin' ? (
                                        <Shield className="h-3 w-3" />
                                      ) : teamMembership.role === 'lead' ? (
                                        <Shield className="h-3 w-3" />
                                      ) : (
                                        <UserIcon className="h-3 w-3" />
                                      )}
                                      <span className="capitalize">{teamMembership.role}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => teamMembership && handleRemoveClick(teamMembership.id, team.team_name)}
                            className="p-2 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                            title="Remove from team"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {availableTeams.length === 0 && memberTeams.length > 0 && (
                <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-300">
                    This member is assigned to all available teams
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmRemove}
        onClose={handleCancelRemove}
        onConfirm={handleConfirmRemove}
        title="Remove from Team"
        message={teamToRemove ? `Are you sure you want to remove ${member?.auth_fullname.fullname} from ${teamToRemove.name}? This action cannot be undone.` : ''}
        confirmText="Remove"
        cancelText="Cancel"
        type="danger"
        isLoading={isRemoving}
      />
    </div>
  );
};

export default MemberTeamsModal;
