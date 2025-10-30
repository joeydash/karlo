import { create } from 'zustand';
import { MemberState, Member, MembersResponse } from '../types/member';
import { graphqlRequest } from '../utils/graphql';

const QUERIES = {
  GET_MEMBERS: `
query GetOrganizationMembers($orgId: uuid!) {
  karlo_organization_members(where: {organization_id: {_eq: $orgId}}, order_by: {joining_date: asc}) {
    id
    user_id
    role
    mentor_id
    joining_date
    designation
    compensation
    is_intern
    created_at
    updated_at
    auth_fullname {
      fullname
      dp
      blurhash
      last_active
    }
  }
}


  `,
  INVITE_MEMBER: `
    mutation InviteMember($joined_at: timestamp!, $organisation_id: uuid!, $phone: String!, $user_id: uuid!, $role: String!, $designation: String!, $compensation: String!, $is_intern: Boolean!, $mentor_id: uuid) {
      addKarloOrganisationMembers(request: {
        joining_date: $joined_at,
        organisation_id: $organisation_id,
        phone: $phone,
        user_id: $user_id,
        role: $role,
        designation: $designation,
        compensation: $compensation,
        is_intern: $is_intern,
        mentor_id: $mentor_id
      }) {
        affected_rows
      }
    }
  `,
  DELETE_MEMBER: `
    mutation DeleteOrganizationMember($id: uuid!) {
      delete_karlo_organization_members_by_pk(id: $id) {
        id
      }
    }
  `,
  UPDATE_MEMBER_JOINING_DATE: `
    mutation UpdateMemberJoiningDate($id: uuid!, $joining_date: timestamp!) {
      update_karlo_organization_members_by_pk(
        pk_columns: {id: $id},
        _set: {joining_date: $joining_date}
      ) {
        id
        joining_date
      }
    }
  `,
  UPDATE_MEMBER_ROLE: `
    mutation UpdateMemberRole($id: uuid!, $role: String!) {
      update_karlo_organization_members_by_pk(
        pk_columns: {id: $id},
        _set: {role: $role}
      ) {
        id
        role
      }
    }
  `,
  UPDATE_MEMBER_DESIGNATION: `
    mutation UpdateMemberDesignation($id: uuid!, $designation: String!) {
      update_karlo_organization_members_by_pk(
        pk_columns: {id: $id},
        _set: {designation: $designation}
      ) {
        id
        designation
      }
    }
  `,
  UPDATE_MEMBER_COMPENSATION: `
    mutation UpdateMemberCompensation($id: uuid!, $compensation: String!) {
      update_karlo_organization_members_by_pk(
        pk_columns: {id: $id},
        _set: {compensation: $compensation}
      ) {
        id
        compensation
      }
    }
  `,
  UPDATE_MEMBER_INTERN_STATUS: `
    mutation UpdateMemberInternStatus($id: uuid!, $is_intern: Boolean!) {
      update_karlo_organization_members_by_pk(
        pk_columns: {id: $id},
        _set: {is_intern: $is_intern}
      ) {
        id
        is_intern
      }
    }
  `,
  UPDATE_MEMBER_MENTOR: `
    mutation UpdateMemberMentor($id: uuid!, $mentor_id: uuid) {
      update_karlo_organization_members_by_pk(
        pk_columns: {id: $id},
        _set: {mentor_id: $mentor_id}
      ) {
        id
        mentor_id
      }
    }
  `
};

const useMemberStore = create<MemberState>((set, get) => ({
  members: [],
  isLoading: false,
  error: null,

  fetchMembers: async (organizationId: string) => {
    const currentState = get();
    
    // Prevent multiple simultaneous fetches
    if (currentState.isLoading) {
      return;
    }
    
    set({ isLoading: true, error: null });
    
    const { data, error } = await graphqlRequest<MembersResponse>(
      QUERIES.GET_MEMBERS,
      { orgId: organizationId }
    );

    set({ isLoading: false });

    if (error) {
      set({ error });
      return;
    }

    const members = data?.karlo_organization_members || [];
    set({ members });
  },

  inviteMember: async (inviteData: { phone: string; organisation_id: string; created_at: string; role: string }) => {
    set({ error: null });

    // Get the authenticated user's ID from the auth store
    const authStore = (window as any).__authStore;
    if (!authStore?.user?.id) {
      set({ error: 'User not authenticated' });
      return { success: false, message: 'User not authenticated' };
    }

    const { data, error } = await graphqlRequest<any>(
      QUERIES.INVITE_MEMBER,
      {
        joined_at: inviteData.created_at,
        organisation_id: inviteData.organisation_id,
        phone: inviteData.phone,
        user_id: authStore.user.id,
        role: inviteData.role,
        designation: inviteData.designation,
        compensation: inviteData.compensation,
        is_intern: inviteData.is_intern,
        mentor_id: inviteData.mentor_id || null
      }
    );

    if (error) {
      set({ error });
      return { success: false, message: error };
    }

    if (data?.addKarloOrganisationMembers?.affected_rows > 0) {
      // Refetch to get the complete member data with auth_fullname
      await get().fetchMembers(inviteData.organisation_id);
      return { success: true };
    }

    return { success: false, message: 'Failed to invite member' };
  },

  deleteMember: async (memberId: string) => {
    set({ error: null });

    // Optimistically update UI
    const currentState = get();
    const previousMembers = currentState.members;
    const updatedMembers = currentState.members.filter(member => member.id !== memberId);
    set({ members: updatedMembers });

    const { data, error } = await graphqlRequest<any>(
      QUERIES.DELETE_MEMBER,
      { id: memberId }
    );

    if (error) {
      // Revert on error
      set({ members: previousMembers, error });
      return { success: false, message: error };
    }

    if (data?.delete_karlo_organization_members_by_pk) {
      return { success: true };
    }

    // Revert on failure
    set({ members: previousMembers });
    return { success: false, message: 'Failed to remove member' };
  },

  updateMemberJoiningDate: async (memberId: string, newJoiningDate: string) => {
    set({ error: null });

    // Optimistically update UI
    const currentState = get();
    const previousMembers = currentState.members;
    const updatedMembers = currentState.members.map(member =>
      member.id === memberId
        ? { ...member, joining_date: newJoiningDate }
        : member
    );
    set({ members: updatedMembers });

    const { data, error } = await graphqlRequest<any>(
      QUERIES.UPDATE_MEMBER_JOINING_DATE,
      { id: memberId, joining_date: newJoiningDate }
    );

    if (error) {
      // Revert on error
      set({ members: previousMembers, error });
      return { success: false, message: error };
    }

    if (data?.update_karlo_organization_members_by_pk) {
      return { success: true };
    }

    // Revert on failure
    set({ members: previousMembers });
    return { success: false, message: 'Failed to update joining date' };
  },

  updateMemberRole: async (memberId: string, newRole: string) => {
    set({ error: null });

    // Optimistically update UI
    const currentState = get();
    const previousMembers = currentState.members;
    const updatedMembers = currentState.members.map(member =>
      member.id === memberId
        ? { ...member, role: newRole }
        : member
    );
    set({ members: updatedMembers });

    const { data, error } = await graphqlRequest<any>(
      QUERIES.UPDATE_MEMBER_ROLE,
      { id: memberId, role: newRole }
    );

    if (error) {
      // Revert on error
      set({ members: previousMembers, error });
      return { success: false, message: error };
    }

    if (data?.update_karlo_organization_members_by_pk) {
      return { success: true };
    }

    // Revert on failure
    set({ members: previousMembers });
    return { success: false, message: 'Failed to update role' };
  },

  updateMemberDesignation: async (memberId: string, newDesignation: string) => {
    set({ error: null });

    // Optimistically update UI
    const currentState = get();
    const previousMembers = currentState.members;
    const updatedMembers = currentState.members.map(member =>
      member.id === memberId
        ? { ...member, designation: newDesignation }
        : member
    );
    set({ members: updatedMembers });

    const { data, error } = await graphqlRequest<any>(
      QUERIES.UPDATE_MEMBER_DESIGNATION,
      { id: memberId, designation: newDesignation }
    );

    if (error) {
      // Revert on error
      set({ members: previousMembers, error });
      return { success: false, message: error };
    }

    if (data?.update_karlo_organization_members_by_pk) {
      return { success: true };
    }

    // Revert on failure
    set({ members: previousMembers });
    return { success: false, message: 'Failed to update designation' };
  },

  updateMemberCompensation: async (memberId: string, newCompensation: string) => {
    set({ error: null });

    // Optimistically update UI
    const currentState = get();
    const previousMembers = currentState.members;
    const updatedMembers = currentState.members.map(member =>
      member.id === memberId
        ? { ...member, compensation: newCompensation }
        : member
    );
    set({ members: updatedMembers });

    const { data, error } = await graphqlRequest<any>(
      QUERIES.UPDATE_MEMBER_COMPENSATION,
      { id: memberId, compensation: newCompensation }
    );

    if (error) {
      // Revert on error
      set({ members: previousMembers, error });
      return { success: false, message: error };
    }

    if (data?.update_karlo_organization_members_by_pk) {
      return { success: true };
    }

    // Revert on failure
    set({ members: previousMembers });
    return { success: false, message: 'Failed to update compensation' };
  },

  updateMemberInternStatus: async (memberId: string, isIntern: boolean) => {
    set({ error: null });

    // Optimistically update UI
    const currentState = get();
    const previousMembers = currentState.members;
    const updatedMembers = currentState.members.map(member =>
      member.id === memberId
        ? { ...member, is_intern: isIntern }
        : member
    );
    set({ members: updatedMembers });

    const { data, error } = await graphqlRequest<any>(
      QUERIES.UPDATE_MEMBER_INTERN_STATUS,
      { id: memberId, is_intern: isIntern }
    );

    if (error) {
      // Revert on error
      set({ members: previousMembers, error });
      return { success: false, message: error };
    }

    if (data?.update_karlo_organization_members_by_pk) {
      return { success: true };
    }

    // Revert on failure
    set({ members: previousMembers });
    return { success: false, message: 'Failed to update intern status' };
  },

  updateMemberMentor: async (memberId: string, mentorId?: string) => {
    set({ error: null });

    // Optimistically update UI
    const currentState = get();
    const previousMembers = currentState.members;
    const updatedMembers = currentState.members.map(member =>
      member.id === memberId
        ? { ...member, mentor_id: mentorId }
        : member
    );
    set({ members: updatedMembers });

    const { data, error } = await graphqlRequest<any>(
      QUERIES.UPDATE_MEMBER_MENTOR,
      { id: memberId, mentor_id: mentorId || null }
    );

    if (error) {
      // Revert on error
      set({ members: previousMembers, error });
      return { success: false, message: error };
    }

    if (data?.update_karlo_organization_members_by_pk) {
      return { success: true };
    }

    // Revert on failure
    set({ members: previousMembers });
    return { success: false, message: 'Failed to update mentor' };
  },

  clearError: () => set({ error: null }),
}));

export default useMemberStore;