import { useEffect } from 'react';
import { useTeamStore } from '../stores/teamStore';
import { useOrganization } from './useOrganization';
import { useAuth } from './useAuth';

export const useTeam = () => {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const {
    teams,
    isLoading,
    error,
    fetchTeams,
    createTeam: createTeamAction,
    updateTeam: updateTeamAction,
    deleteTeam: deleteTeamAction,
    addTeamMember: addTeamMemberAction,
    removeTeamMember: removeTeamMemberAction,
    updateMemberRole: updateMemberRoleAction,
    clearError,
  } = useTeamStore();

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchTeams(currentOrganization.id);
    }
  }, [currentOrganization?.id, fetchTeams]);

  const createTeam = async (team_name: string, description?: string) => {
    if (!currentOrganization?.id || !user?.id) {
      return { success: false, message: 'Organization or user not found' };
    }

    return await createTeamAction({
      team_name,
      description,
      organization_id: currentOrganization.id,
      created_by: user.id,
    });
  };

  const updateTeam = async (teamId: string, updates: { team_name?: string; description?: string }) => {
    return await updateTeamAction(teamId, updates);
  };

  const deleteTeam = async (teamId: string) => {
    return await deleteTeamAction(teamId);
  };

  const addTeamMember = async (teamId: string, userId: string, memberId: string, role?: string) => {
    return await addTeamMemberAction(teamId, userId, memberId, role);
  };

  const removeTeamMember = async (memberId: string) => {
    return await removeTeamMemberAction(memberId);
  };

  const updateMemberRole = async (memberId: string, role: string) => {
    return await updateMemberRoleAction(memberId, role);
  };

  return {
    teams,
    isLoading,
    error,
    createTeam,
    updateTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember,
    updateMemberRole,
    clearError,
  };
};
