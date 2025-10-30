import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LeaveState, Leave, ApplyLeaveData, LeavesResponse } from '../types/leave';
import { graphqlRequest } from '../utils/graphql';

const QUERIES = {
  GET_MEMBER_JOINING_DATE: `
    query GetMemberJoiningDate($organization_id: uuid!, $user_id: uuid!) {
      karlo_organization_members(
        where: {organization_id: {_eq: $organization_id}, user_id: {_eq: $user_id}}
        limit: 1
      ) {
        joining_date
        created_at
      }
    }
  `,
  GET_USER_JOINING_DATE: `
    query GetUserJoiningDate($organization_id: uuid!, $user_id: uuid!) {
      karlo_organization_members(
        where: {organization_id: {_eq: $organization_id}, user_id: {_eq: $user_id}}
        limit: 1
      ) {
        joining_date
        created_at
      }
    }
  `,
  GET_MEMBER_LEAVES: `
    query GetMemberLeaves($organization_id: uuid!, $user_id: uuid!, $limit: Int!, $offset: Int!) {
      karlo_leave_requests(
        where: {organization_id: {_eq: $organization_id}, user_id: {_eq: $user_id}},
        order_by: {created_at: desc},
        limit: $limit,
        offset: $offset
      ) {
        id
        organization_id
        user_id
        leave_type_id
        leave_date
        day_part
        status
        created_at
        updated_at
        karlo_leave_type {
          display_name
          type_code
          allowance_days
        }
        auth_fullname {
          fullname
          dp
        }
      }
      karlo_leave_requests_aggregate(
        where: {organization_id: {_eq: $organization_id}, user_id: {_eq: $user_id}}
      ) {
        aggregate {
          count
        }
      }
    }
  `,
  GET_ALL_LEAVES: `
    query GetAllLeaves($organization_id: uuid!, $limit: Int!, $offset: Int!) {
      karlo_leave_requests(
        where: {organization_id: {_eq: $organization_id}},
        order_by: {created_at: desc},
        limit: $limit,
        offset: $offset
      ) {
        id
        organization_id
        user_id
        leave_type_id
        leave_date
        day_part
        status
        created_at
        updated_at
        karlo_leave_type {
          display_name
          type_code
          allowance_days
        }
        auth_fullname {
          fullname
          dp
        }
      }
      karlo_leave_requests_aggregate(
        where: {organization_id: {_eq: $organization_id}}
      ) {
        aggregate {
          count
        }
      }
    }
  `,
  GET_LEAVES: `
    query GetUserLeaves($organization_id: uuid!, $user_id: uuid!, $limit: Int!, $offset: Int!) {
      karlo_leave_requests(
        where: {organization_id: {_eq: $organization_id}, user_id: {_eq: $user_id}},
        order_by: {created_at: desc},
        limit: $limit,
        offset: $offset
      ) {
        id
        organization_id
        user_id
        leave_type_id
        leave_date
        day_part
        status
        created_at
        updated_at
        karlo_leave_type {
          display_name
          type_code
          allowance_days
        }
      }
      karlo_leave_requests_aggregate(
        where: {organization_id: {_eq: $organization_id}, user_id: {_eq: $user_id}}
      ) {
        aggregate {
          count
        }
      }
    }
  `,
  APPLY_LEAVE: `
    mutation ApplyLeave(
      $organization_id: uuid!,
      $user_id: uuid!,
      $leave_type_id: uuid!,
      $leave_date: date!,
      $day_part: String!
    ) {
      insert_karlo_leave_requests_one(object: {
        organization_id: $organization_id,
        user_id: $user_id,
        leave_type_id: $leave_type_id,
        leave_date: $leave_date,
        day_part: $day_part
      }) {
        id
        organization_id
        user_id
        leave_type_id
        leave_date
        day_part
        status
        created_at
        updated_at
        karlo_leave_type {
          display_name
          type_code
          allowance_days
        }
      }
    }
  `,
  APPROVE_LEAVE: `
    mutation MyMutation($_eq: uuid = "") {
      update_karlo_leave_requests(where: {id: {_eq: $_eq}}, _set: {status: "approved"}) {
        affected_rows
      }
    }
  `,
  REJECT_LEAVE: `
    mutation RejectLeave($_eq: uuid = "") {
      update_karlo_leave_requests(where: {id: {_eq: $_eq}}, _set: {status: "rejected"}) {
        affected_rows
      }
    }
  `,
  DELETE_LEAVE: `
    mutation DeleteLeave($id: uuid!) {
      delete_karlo_leave_requests_by_pk(id: $id) {
        id
      }
    }
  `,
  UPDATE_LEAVE: `
    mutation UpdateLeave(
      $id: uuid!,
      $leave_type_id: uuid,
      $leave_date: date,
      $day_part: String
    ) {
      update_karlo_leave_requests_by_pk(
        pk_columns: {id: $id},
        _set: {
          leave_type_id: $leave_type_id,
          leave_date: $leave_date,
          day_part: $day_part
        }
      ) {
        id
        leave_type_id
        leave_date
        day_part
        updated_at
        karlo_leave_type {
          display_name
          type_code
          allowance_days
        }
      }
    }
  `
};

const useLeaveStore = create<LeaveState>()(
  persist(
    (set, get) => ({
      leaves: [],
      selectedMemberJoiningDate: null,
      isLoading: false,
      error: null,
      totalCount: 0,
      currentPage: 1,
      itemsPerPage: 10,

      fetchLeaves: async (organizationId: string, limit: number = 10, offset: number = 0) => {
        const currentState = get();
        
        if (currentState.isLoading) {
          return;
        }
        
        // Get current user from auth store
        const authStore = (window as any).__authStore;
        if (!authStore?.user?.id) {
          set({ error: 'User not authenticated' });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        // Fetch both leaves and joining date
        const [leavesResult, joiningDateResult] = await Promise.all([
          graphqlRequest<LeavesResponse>(
            QUERIES.GET_LEAVES,
            { organization_id: organizationId, user_id: authStore.user.id, limit, offset }
          ),
          graphqlRequest<any>(
            QUERIES.GET_USER_JOINING_DATE,
            { organization_id: organizationId, user_id: authStore.user.id }
          )
        ]);

        set({ isLoading: false });

        if (leavesResult.error) {
          set({ error: leavesResult.error });
          return;
        }

        const leaves = leavesResult.data?.karlo_leave_requests || [];
        const totalCount = leavesResult.data?.karlo_leave_requests_aggregate?.aggregate?.count || 0;

        // Get joining date from members table
        let joiningDate = null;
        if (joiningDateResult.data?.karlo_organization_members?.[0]) {
          const memberData = joiningDateResult.data.karlo_organization_members[0];
          joiningDate = memberData.joining_date || memberData.created_at;
        }

        set({ leaves, userJoiningDate: joiningDate, selectedMemberJoiningDate: null, totalCount });
      },

      fetchMemberLeaves: async (organizationId: string, memberId: string, limit: number = 10, offset: number = 0) => {
        const currentState = get();
        
        if (currentState.isLoading) {
          return;
        }
        
        set({ isLoading: true, error: null });
        
        // Fetch both leaves and joining date for the specific member
        const [leavesResult, joiningDateResult] = await Promise.all([
          graphqlRequest<LeavesResponse>(
            QUERIES.GET_MEMBER_LEAVES,
            { organization_id: organizationId, user_id: memberId, limit, offset }
          ),
          graphqlRequest<any>(
            QUERIES.GET_MEMBER_JOINING_DATE,
            { organization_id: organizationId, user_id: memberId }
          )
        ]);

        set({ isLoading: false });

        if (leavesResult.error) {
          set({ error: leavesResult.error });
          return;
        }

        const leaves = leavesResult.data?.karlo_leave_requests || [];
        const totalCount = leavesResult.data?.karlo_leave_requests_aggregate?.aggregate?.count || 0;

        // Get joining date from members table
        let joiningDate = null;
        if (joiningDateResult.data?.karlo_organization_members?.[0]) {
          const memberData = joiningDateResult.data.karlo_organization_members[0];
          joiningDate = memberData.joining_date || memberData.created_at;
        }

        set({ leaves, selectedMemberJoiningDate: joiningDate, totalCount });
      },

      fetchAllLeaves: async (organizationId: string, limit: number = 10, offset: number = 0) => {
        const currentState = get();
        
        if (currentState.isLoading) {
          return;
        }
        
        set({ isLoading: true, error: null });
        
        const { data, error } = await graphqlRequest<LeavesResponse>(
          QUERIES.GET_ALL_LEAVES,
          { organization_id: organizationId, limit, offset }
        );

        set({ isLoading: false });

        if (error) {
          set({ error });
          return;
        }

        const leaves = data?.karlo_leave_requests || [];
        const totalCount = data?.karlo_leave_requests_aggregate?.aggregate?.count || 0;
        set({ leaves, userJoiningDate: null, selectedMemberJoiningDate: null, totalCount });
      },

      applyLeave: async (data: ApplyLeaveData, organizationId: string, targetUserId?: string) => {
        set({ error: null });

        // Get current user from auth store
        const authStore = (window as any).__authStore;
        if (!authStore?.user?.id) {
          set({ error: 'User not authenticated' });
          return { success: false, message: 'User not authenticated' };
        }

        // Use targetUserId if provided (for admin applying on behalf of others), otherwise use current user
        const applicantUserId = targetUserId || authStore.user.id;

        const { data: result, error } = await graphqlRequest<any>(
          QUERIES.APPLY_LEAVE,
          {
            organization_id: organizationId,
            user_id: applicantUserId,
            leave_type_id: data.leave_type_id,
            leave_date: data.leave_date,
            day_part: data.day_part
          }
        );

        if (error) {
          set({ error });
          return { success: false, message: error };
        }

        const newLeave = result?.insert_karlo_leave_requests_one;
        if (newLeave) {
          const currentState = get();
          const updatedLeaves = [newLeave, ...currentState.leaves];
          set({ leaves: updatedLeaves });
          return { success: true };
        }

        return { success: false, message: 'Failed to apply for leave' };
      },

      deleteLeave: async (leaveId: string) => {
        set({ error: null });

        // Optimistically update UI
        const currentState = get();
        const previousLeaves = currentState.leaves;
        const updatedLeaves = currentState.leaves.filter(leave => leave.id !== leaveId);
        set({ leaves: updatedLeaves });

        const { data: result, error } = await graphqlRequest<any>(
          QUERIES.DELETE_LEAVE,
          { id: leaveId }
        );

        if (error) {
          // Revert on error
          set({ leaves: previousLeaves, error });
          return { success: false, message: error };
        }

        if (result?.delete_karlo_leave_requests_by_pk) {
          return { success: true };
        }

        // Revert on failure
        set({ leaves: previousLeaves });
        return { success: false, message: 'Failed to delete leave' };
      },

      updateLeave: async (leaveId: string, data: Partial<ApplyLeaveData>) => {
        set({ error: null });

        // Optimistically update UI
        const currentState = get();
        const previousLeaves = currentState.leaves;
        const optimisticLeaves = currentState.leaves.map(leave =>
          leave.id === leaveId ? { ...leave, ...data } : leave
        );
        set({ leaves: optimisticLeaves });

        const { data: result, error } = await graphqlRequest<any>(
          QUERIES.UPDATE_LEAVE,
          {
            id: leaveId,
            leave_type_id: data.leave_type_id,
            leave_date: data.leave_date,
            day_part: data.day_part
          }
        );

        if (error) {
          // Revert on error
          set({ leaves: previousLeaves, error });
          return { success: false, message: error };
        }

        const updatedLeave = result?.update_karlo_leave_requests_by_pk;
        if (updatedLeave) {
          const updatedLeaves = currentState.leaves.map(leave =>
            leave.id === leaveId ? { ...leave, ...updatedLeave } : leave
          );
          set({ leaves: updatedLeaves });
          return { success: true };
        }

        // Revert on failure
        set({ leaves: previousLeaves });
        return { success: false, message: 'Failed to update leave request' };
      },

      approveLeave: async (leaveId: string) => {
        set({ error: null });

        // Optimistically update UI
        const currentState = get();
        const previousLeaves = currentState.leaves;
        const updatedLeaves = currentState.leaves.map(leave =>
          leave.id === leaveId ? { ...leave, status: 'approved' } : leave
        );
        set({ leaves: updatedLeaves });

        const { data: result, error } = await graphqlRequest<any>(
          QUERIES.APPROVE_LEAVE,
          { _eq: leaveId }
        );

        if (error) {
          // Revert on error
          set({ leaves: previousLeaves, error });
          return { success: false, message: error };
        }

        if (result?.update_karlo_leave_requests?.affected_rows > 0) {
          return { success: true };
        }

        // Revert on failure
        set({ leaves: previousLeaves });
        return { success: false, message: 'Failed to approve leave request' };
      },

      rejectLeave: async (leaveId: string) => {
        set({ error: null });

        // Optimistically update UI
        const currentState = get();
        const previousLeaves = currentState.leaves;
        const updatedLeaves = currentState.leaves.map(leave =>
          leave.id === leaveId ? { ...leave, status: 'rejected' } : leave
        );
        set({ leaves: updatedLeaves });

        const { data: result, error } = await graphqlRequest<any>(
          QUERIES.REJECT_LEAVE,
          { _eq: leaveId }
        );

        if (error) {
          // Revert on error
          set({ leaves: previousLeaves, error });
          return { success: false, message: error };
        }

        if (result?.update_karlo_leave_requests?.affected_rows > 0) {
          return { success: true };
        }

        // Revert on failure
        set({ leaves: previousLeaves });
        return { success: false, message: 'Failed to reject leave request' };
      },

      setPage: (page: number) => set({ currentPage: page }),

      setItemsPerPage: (items: number) => set({ itemsPerPage: items, currentPage: 1 }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'leave-storage',
      partialize: (state) => ({
        leaves: state.leaves,
        currentPage: state.currentPage,
        itemsPerPage: state.itemsPerPage,
      }),
    }
  )
);

export default useLeaveStore;