import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LeaveTypeState, LeaveType, CreateLeaveTypeData, LeaveTypesResponse } from '../types/leaveType';
import { graphqlRequest } from '../utils/graphql';

const QUERIES = {
  GET_LEAVE_TYPES: `
    query GetOrganizationLeaveTypes($organization_id: uuid!) {
      karlo_leave_types(
        where: {organization_id: {_eq: $organization_id}, is_active: {_eq: true}},
        order_by: {created_at: asc}
      ) {
        id
        organization_id
        type_code
        display_name
        allowance_days
        description
        is_active
        created_at
        updated_at
      }
    }
  `,
  CREATE_LEAVE_TYPE: `
    mutation CreateLeaveType(
      $organization_id: uuid!,
      $type_code: String!,
      $display_name: String!,
      $allowance_days: Int!,
      $description: String
    ) {
      insert_karlo_leave_types_one(object: {
        organization_id: $organization_id,
        type_code: $type_code,
        display_name: $display_name,
        allowance_days: $allowance_days,
        description: $description,
        is_active: true
      }) {
        id
        organization_id
        type_code
        display_name
        allowance_days
        description
        is_active
        created_at
        updated_at
      }
    }
  `,
  UPDATE_LEAVE_TYPE: `
    mutation UpdateLeaveType(
      $id: uuid!,
      $type_code: String,
      $display_name: String,
      $allowance_days: Int,
      $description: String
    ) {
      update_karlo_leave_types_by_pk(
        pk_columns: {id: $id},
        _set: {
          type_code: $type_code,
          display_name: $display_name,
          allowance_days: $allowance_days,
          description: $description
        }
      ) {
        id
        type_code
        display_name
        allowance_days
        description
        updated_at
      }
    }
  `,
  DELETE_LEAVE_TYPE: `
    mutation DeleteLeaveType($id: uuid!) {
      update_karlo_leave_types_by_pk(
        pk_columns: {id: $id},
        _set: {is_active: false}
      ) {
        id
        is_active
      }
    }
  `
};

const useLeaveTypeStore = create<LeaveTypeState>()(
  persist(
    (set, get) => ({
      leaveTypes: [],
      isLoading: false,
      error: null,

      fetchLeaveTypes: async (organizationId: string) => {
        const currentState = get();
        
        if (currentState.isLoading) {
          return;
        }
        
        set({ isLoading: true, error: null });
        
        const { data, error } = await graphqlRequest<LeaveTypesResponse>(
          QUERIES.GET_LEAVE_TYPES,
          { organization_id: organizationId }
        );

        set({ isLoading: false });

        if (error) {
          set({ error });
          return;
        }

        const leaveTypes = data?.karlo_leave_types || [];
        set({ leaveTypes });
      },

      createLeaveType: async (data: CreateLeaveTypeData, organizationId: string) => {
        set({ isLoading: true, error: null });
        
        const { data: result, error } = await graphqlRequest<any>(
          QUERIES.CREATE_LEAVE_TYPE,
          {
            ...data,
            organization_id: organizationId
          }
        );

        set({ isLoading: false });

        if (error) {
          set({ error });
          return { success: false, message: error };
        }

        const newLeaveType = result?.insert_karlo_leave_types_one;
        if (newLeaveType) {
          const currentState = get();
          const updatedLeaveTypes = [...currentState.leaveTypes, newLeaveType];
          set({ leaveTypes: updatedLeaveTypes });
          return { success: true };
        }

        return { success: false, message: 'Failed to create leave type' };
      },

      updateLeaveType: async (leaveTypeId: string, data: Partial<CreateLeaveTypeData>) => {
        set({ isLoading: true, error: null });
        
        const { data: result, error } = await graphqlRequest<any>(
          QUERIES.UPDATE_LEAVE_TYPE,
          {
            id: leaveTypeId,
            ...data
          }
        );

        set({ isLoading: false });

        if (error) {
          set({ error });
          return { success: false, message: error };
        }

        const updatedLeaveType = result?.update_karlo_leave_types_by_pk;
        if (updatedLeaveType) {
          const currentState = get();
          const updatedLeaveTypes = currentState.leaveTypes.map(leaveType => 
            leaveType.id === leaveTypeId ? { ...leaveType, ...updatedLeaveType } : leaveType
          );
          set({ leaveTypes: updatedLeaveTypes });
          return { success: true };
        }

        return { success: false, message: 'Failed to update leave type' };
      },

      deleteLeaveType: async (leaveTypeId: string) => {
        set({ isLoading: true, error: null });
        
        const { data: result, error } = await graphqlRequest<any>(
          QUERIES.DELETE_LEAVE_TYPE,
          { id: leaveTypeId }
        );

        set({ isLoading: false });

        if (error) {
          set({ error });
          return { success: false, message: error };
        }

        if (result?.update_karlo_leave_types_by_pk) {
          const currentState = get();
          const updatedLeaveTypes = currentState.leaveTypes.filter(leaveType => leaveType.id !== leaveTypeId);
          set({ leaveTypes: updatedLeaveTypes });
          return { success: true };
        }

        return { success: false, message: 'Failed to delete leave type' };
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'leave-type-storage',
      partialize: (state) => ({
        leaveTypes: state.leaveTypes,
      }),
    }
  )
);

export default useLeaveTypeStore;