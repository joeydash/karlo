import { create } from 'zustand';
import { TeamState, Team, TeamsResponse } from '../types/team';
import { graphqlRequest } from '../utils/graphql';

const QUERIES = {
  GET_TEAMS: `
    query GetTeams($orgId: uuid!) {
      karlo_teams(where: {organization_id: {_eq: $orgId}}, order_by: {created_at: desc}) {
        id
        organization_id
        team_name
        description
        created_at
        updated_at
        created_by
        karlo_team_members {
          id
          team_id
          user_id
          member_id
          role
          created_at
          updated_at
          auth_fullname {
            fullname
            dp
            blurhash
          }
        }
        karlo_team_members_aggregate {
          aggregate {
            count
          }
        }
      }
    }
  `,
  CREATE_TEAM: `
    mutation CreateTeam($team_name: String!, $description: String, $organization_id: uuid!, $created_by: uuid!) {
      insert_karlo_teams_one(object: {
        team_name: $team_name,
        description: $description,
        organization_id: $organization_id,
        created_by: $created_by
      }) {
        id
        organization_id
        team_name
        description
        created_at
        updated_at
        created_by
      }
    }
  `,
  UPDATE_TEAM: `
    mutation UpdateTeam($id: uuid!, $team_name: String, $description: String) {
      update_karlo_teams_by_pk(
        pk_columns: {id: $id},
        _set: {team_name: $team_name, description: $description}
      ) {
        id
        team_name
        description
        updated_at
      }
    }
  `,
  DELETE_TEAM: `
    mutation DeleteTeam($id: uuid!) {
      delete_karlo_teams_by_pk(id: $id) {
        id
      }
    }
  `,
  ADD_TEAM_MEMBER: `
    mutation AddTeamMember($team_id: uuid!, $user_id: uuid!, $member_id: uuid!, $role: String) {
      insert_karlo_team_members_one(object: {
        team_id: $team_id,
        user_id: $user_id,
        member_id: $member_id,
        role: $role
      }) {
        id
        team_id
        user_id
        member_id
        role
        created_at
        updated_at
        auth_fullname {
          fullname
          dp
          blurhash
        }
      }
    }
  `,
  REMOVE_TEAM_MEMBER: `
    mutation RemoveTeamMember($id: uuid!) {
      delete_karlo_team_members_by_pk(id: $id) {
        id
      }
    }
  `,
  UPDATE_MEMBER_ROLE: `
    mutation UpdateMemberRole($id: uuid!, $role: String!) {
      update_karlo_team_members_by_pk(
        pk_columns: {id: $id},
        _set: {role: $role}
      ) {
        id
        role
        updated_at
      }
    }
  `,
};

export const useTeamStore = create<TeamState>((set, get) => ({
  teams: [],
  isLoading: false,
  error: null,

  fetchTeams: async (organizationId: string) => {
    const currentState = get();

    // Prevent fetching if already loading or if we already have data for this organization
    if (currentState.isLoading) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await graphqlRequest<TeamsResponse>(QUERIES.GET_TEAMS, {
        orgId: organizationId,
      });

      if (response.data?.karlo_teams) {
        set({ teams: response.data.karlo_teams, isLoading: false });
      } else {
        set({ error: 'Failed to fetch teams', isLoading: false });
      }
    } catch (error) {
      set({ error: 'Failed to fetch teams', isLoading: false });
    }
  },

  createTeam: async (teamData) => {
    try {
      const response = await graphqlRequest<{ insert_karlo_teams_one: Team }>(
        QUERIES.CREATE_TEAM,
        teamData
      );

      if (response.data?.insert_karlo_teams_one) {
        set((state) => ({
          teams: [response.data.insert_karlo_teams_one, ...state.teams],
        }));
        return { success: true, team: response.data.insert_karlo_teams_one };
      }
      return { success: false, message: 'Failed to create team' };
    } catch (error) {
      return { success: false, message: 'Failed to create team' };
    }
  },

  updateTeam: async (teamId, updates) => {
    try {
      const response = await graphqlRequest<{ update_karlo_teams_by_pk: Team }>(
        QUERIES.UPDATE_TEAM,
        { id: teamId, ...updates }
      );

      if (response.data?.update_karlo_teams_by_pk) {
        set((state) => ({
          teams: state.teams.map((team) =>
            team.id === teamId
              ? { ...team, ...response.data.update_karlo_teams_by_pk }
              : team
          ),
        }));
        return { success: true };
      }
      return { success: false, message: 'Failed to update team' };
    } catch (error) {
      return { success: false, message: 'Failed to update team' };
    }
  },

  deleteTeam: async (teamId) => {
    try {
      const response = await graphqlRequest<{ delete_karlo_teams_by_pk: { id: string } }>(
        QUERIES.DELETE_TEAM,
        { id: teamId }
      );

      if (response.data?.delete_karlo_teams_by_pk) {
        set((state) => ({
          teams: state.teams.filter((team) => team.id !== teamId),
        }));
        return { success: true };
      }
      return { success: false, message: 'Failed to delete team' };
    } catch (error) {
      return { success: false, message: 'Failed to delete team' };
    }
  },

  addTeamMember: async (teamId, userId, memberId, role = 'member') => {
    try {
      const response = await graphqlRequest<{ insert_karlo_team_members_one: any }>(
        QUERIES.ADD_TEAM_MEMBER,
        { team_id: teamId, user_id: userId, member_id: memberId, role }
      );

      if (response.data?.insert_karlo_team_members_one) {
        // Refetch teams to update member counts and lists
        const currentState = get();
        if (currentState.teams.length > 0) {
          const orgId = currentState.teams[0].organization_id;
          await get().fetchTeams(orgId);
        }
        return { success: true };
      }
      return { success: false, message: 'Failed to add team member' };
    } catch (error) {
      return { success: false, message: 'Failed to add team member' };
    }
  },

  removeTeamMember: async (memberId) => {
    try {
      const response = await graphqlRequest<{ delete_karlo_team_members_by_pk: { id: string } }>(
        QUERIES.REMOVE_TEAM_MEMBER,
        { id: memberId }
      );

      if (response.data?.delete_karlo_team_members_by_pk) {
        // Refetch teams to update member counts and lists
        const currentState = get();
        if (currentState.teams.length > 0) {
          const orgId = currentState.teams[0].organization_id;
          await get().fetchTeams(orgId);
        }
        return { success: true };
      }
      return { success: false, message: 'Failed to remove team member' };
    } catch (error) {
      return { success: false, message: 'Failed to remove team member' };
    }
  },

  updateMemberRole: async (memberId, role) => {
    try {
      const response = await graphqlRequest<{ update_karlo_team_members_by_pk: { id: string; role: string } }>(
        QUERIES.UPDATE_MEMBER_ROLE,
        { id: memberId, role }
      );

      if (response.data?.update_karlo_team_members_by_pk) {
        // Refetch teams to update member data
        const currentState = get();
        if (currentState.teams.length > 0) {
          const orgId = currentState.teams[0].organization_id;
          await get().fetchTeams(orgId);
        }
        return { success: true };
      }
      return { success: false, message: 'Failed to update member role' };
    } catch (error) {
      return { success: false, message: 'Failed to update member role' };
    }
  },

  clearError: () => set({ error: null }),
}));
