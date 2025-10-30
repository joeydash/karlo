export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  member_id: string;
  role?: string;
  created_at: string;
  updated_at: string;
  auth_fullname: {
    fullname: string;
    dp?: string;
    blurhash?: string;
  };
}

export interface Team {
  id: string;
  organization_id: string;
  team_name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  karlo_team_members?: TeamMember[];
  karlo_team_members_aggregate?: {
    aggregate: {
      count: number;
    };
  };
}

export interface TeamState {
  teams: Team[];
  isLoading: boolean;
  error: string | null;

  fetchTeams: (organizationId: string) => Promise<void>;
  createTeam: (teamData: { team_name: string; description?: string; organization_id: string }) => Promise<{ success: boolean; message?: string; team?: Team }>;
  updateTeam: (teamId: string, updates: { team_name?: string; description?: string }) => Promise<{ success: boolean; message?: string }>;
  deleteTeam: (teamId: string) => Promise<{ success: boolean; message?: string }>;
  addTeamMember: (teamId: string, userId: string, memberId: string, role?: string) => Promise<{ success: boolean; message?: string }>;
  removeTeamMember: (memberId: string) => Promise<{ success: boolean; message?: string }>;
  updateMemberRole: (memberId: string, role: string) => Promise<{ success: boolean; message?: string }>;
  clearError: () => void;
}

export interface TeamsResponse {
  karlo_teams: Team[];
}
