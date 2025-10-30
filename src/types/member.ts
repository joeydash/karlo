export interface Member {
  id: string;
  user_id: string;
  role: string;
  mentor_id?: string;
  joining_date?: string;
  designation?: string;
  compensation?: string;
  is_intern?: boolean;
  created_at: string;
  updated_at: string;
  auth_fullname: {
    fullname: string;
    dp?: string;
    blurhash?: string;
    last_active?: string;
  };
  mentees?: Member[];
}

export interface MemberState {
  members: Member[];
  isLoading: boolean;
  error: string | null;

  fetchMembers: (organizationId: string) => Promise<void>;
  inviteMember: (inviteData: { phone: string; organisation_id: string; created_at: string; role: string; designation: string; compensation: string; is_intern: boolean; mentor_id?: string }) => Promise<{ success: boolean; message?: string }>;
  deleteMember: (memberId: string) => Promise<{ success: boolean; message?: string }>;
  updateMemberJoiningDate: (memberId: string, newJoiningDate: string) => Promise<{ success: boolean; message?: string }>;
  updateMemberRole: (memberId: string, newRole: string) => Promise<{ success: boolean; message?: string }>;
  updateMemberDesignation: (memberId: string, newDesignation: string) => Promise<{ success: boolean; message?: string }>;
  updateMemberCompensation: (memberId: string, newCompensation: string) => Promise<{ success: boolean; message?: string }>;
  updateMemberInternStatus: (memberId: string, isIntern: boolean) => Promise<{ success: boolean; message?: string }>;
  updateMemberMentor: (memberId: string, mentorId?: string) => Promise<{ success: boolean; message?: string }>;
  clearError: () => void;
}

export interface MembersResponse {
  karlo_organization_members: Member[];
}