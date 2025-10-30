import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Plus, Search, X, Edit, Trash2, UserPlus, UserPlus as AddUserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTeam } from '../hooks/useTeam';
import { useOrganization } from '../hooks/useOrganization';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import CreateTeamModal from '../components/CreateTeamModal';
import EditTeamModal from '../components/EditTeamModal';
import ConfirmationModal from '../components/ConfirmationModal';
import AddTeamMemberModal from '../components/AddTeamMemberModal';
import SideNavigation from '../components/SideNavigation';
import { Team } from '../types/team';

const Teams: React.FC = () => {
  const navigate = useNavigate();
  const { teams, isLoading, error, deleteTeam } = useTeam();
  const { currentOrganization } = useOrganization();
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editModalInitialMode, setEditModalInitialMode] = useState(false);

  // Get the latest team data from the store
  const selectedTeam = selectedTeamId ? teams.find(t => t.id === selectedTeamId) || null : null;

  const handleDeleteTeamClick = (teamId: string, teamName: string) => {
    setTeamToDelete({ id: teamId, name: teamName });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!teamToDelete) return;

    setIsDeleting(true);
    const result = await deleteTeam(teamToDelete.id);
    setIsDeleting(false);

    if (result.success) {
      showSuccess('Team deleted', `${teamToDelete.name} has been deleted successfully`);
      setShowDeleteModal(false);
      setTeamToDelete(null);
    } else {
      showError('Delete failed', result.message || 'Failed to delete team');
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setTeamToDelete(null);
  };

  const handleViewTeam = (team: Team) => {
    setSelectedTeamId(team.id);
    setEditModalInitialMode(false);
    setShowEditModal(true);
  };

  const handleEditTeam = (team: Team) => {
    setSelectedTeamId(team.id);
    setEditModalInitialMode(true);
    setShowEditModal(true);
  };

  const handleAddMember = (team: Team) => {
    setSelectedTeamId(team.id);
    setShowAddMemberModal(true);
  };

  const getInitials = (fullname: string) => {
    return fullname
      .split(' ')
      .map((name) => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredTeams = teams.filter((team) =>
    team.team_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isCurrentUserAdmin = currentOrganization?.user_role === 'admin';

  const ShimmerCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-6 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-48 mb-2"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-64"></div>
        </div>
      </div>
      <div className="flex items-center -space-x-2 mb-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="w-8 h-8 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded-full border-2 border-white dark:border-gray-800"
          ></div>
        ))}
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex items-center py-3 sm:py-4">
              <button
                onClick={() => navigate('/members')}
                className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 mr-2 sm:mr-4 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">Teams</h1>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block truncate">{currentOrganization?.display_name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Failed to load teams</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <button
              onClick={() => navigate('/members')}
              className="inline-flex items-center space-x-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SideNavigation />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between py-3 sm:py-4 gap-2 sm:gap-0">
            <div className="flex items-center min-w-0 flex-1">
              <button
                onClick={() => navigate('/members')}
                className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 mr-2 sm:mr-4 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">Teams</h1>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block truncate">{currentOrganization?.display_name}</p>
                </div>
              </div>
            </div>

            {isCurrentUserAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg flex-shrink-0"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Create Team</span>
                <span className="sm:hidden">Create</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {isLoading ? (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-6 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-32 mb-2"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200 dark:from-gray-600 via-gray-300 dark:via-gray-500 to-gray-200 dark:to-gray-600 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded w-48"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <ShimmerCard key={index} />
              ))}
            </div>
          </div>
        ) : filteredTeams.length === 0 && !searchTerm ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No teams found</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Create teams to organize your workspace members</p>
            {isCurrentUserAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200 shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span>Create Your First Team</span>
              </button>
            )}
          </div>
        ) : filteredTeams.length === 0 && searchTerm ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No teams found</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">No teams match "{searchTerm}"</p>
            <button
              onClick={() => setSearchTerm('')}
              className="inline-flex items-center space-x-2 px-6 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-all duration-200"
            >
              <X className="h-4 w-4" />
              <span>Clear Search</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">All Teams</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {searchTerm ? (
                    <>
                      {filteredTeams.length} of {teams.length} team{teams.length !== 1 ? 's' : ''}
                      {filteredTeams.length > 0 && ` matching "${searchTerm}"`}
                    </>
                  ) : (
                    `${teams.length} team${teams.length !== 1 ? 's' : ''} in your workspace`
                  )}
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredTeams.map((team) => {
                const memberCount = team.karlo_team_members_aggregate?.aggregate?.count || 0;
                const visibleMembers = team.karlo_team_members || [];
                const remainingCount = memberCount - visibleMembers.length;

                return (
                  <div
                    key={team.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-200 p-6 group cursor-pointer"
                    onClick={() => handleViewTeam(team)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">{team.team_name}</h3>
                        {team.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{team.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Members
                        </span>
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{memberCount}</span>
                      </div>
                      {memberCount === 0 ? (
                        <div className="text-center py-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <UserPlus className="h-6 w-6 text-gray-300 mx-auto mb-1" />
                          <p className="text-xs text-gray-500 dark:text-gray-400">No members yet</p>
                        </div>
                      ) : (
                        <div className="flex items-center -space-x-2">
                          {visibleMembers.map((member, index) => (
                            <div
                              key={member.id}
                              className="relative"
                              style={{ zIndex: visibleMembers.length - index }}
                              title={member.auth_fullname.fullname}
                            >
                              {member.auth_fullname.dp && member.auth_fullname.dp.trim() !== '' ? (
                                <img
                                  src={member.auth_fullname.dp}
                                  alt={member.auth_fullname.fullname}
                                  className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-800"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                                  <span className="text-xs font-bold text-white">
                                    {getInitials(member.auth_fullname.fullname)}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                          {remainingCount > 0 && (
                            <div
                              className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800"
                              title={`+${remainingCount} more members`}
                            >
                              <span className="text-xs font-bold text-white">+{remainingCount}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {isCurrentUserAdmin && (
                      <div className="flex flex-col space-y-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddMember(team);
                          }}
                          className="w-full flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-all duration-200"
                        >
                          <AddUserIcon className="h-3 w-3" />
                          <span>Add Member</span>
                        </button>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTeam(team);
                            }}
                            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTeamClick(team.id, team.team_name);
                            }}
                            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <CreateTeamModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />

      <EditTeamModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTeamId(null);
        }}
        team={selectedTeam}
        initialEditMode={editModalInitialMode}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Team"
        message={`Are you sure you want to delete "${teamToDelete?.name}"? This action cannot be undone and all team data will be permanently removed.`}
        confirmText="Delete Team"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
      />

      {selectedTeam && (
        <AddTeamMemberModal
          isOpen={showAddMemberModal}
          onClose={() => {
            setShowAddMemberModal(false);
            setSelectedTeamId(null);
          }}
          teamId={selectedTeam.id}
          teamName={selectedTeam.team_name}
          currentMembers={(selectedTeam.karlo_team_members || []).map(m => m.user_id)}
        />
      )}
    </div>
    </>
  );
};

export default Teams;
