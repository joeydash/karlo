import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HolidayState, Holiday, CreateHolidayData, HolidaysResponse } from '../types/holiday';
import { graphqlRequest } from '../utils/graphql';

const QUERIES = {
  GET_HOLIDAYS: `
    query GetOrganizationHolidays($organization_id: uuid!) {
      karlo_holidays(
        where: {organization_id: {_eq: $organization_id}},
        order_by: {date: asc}
      ) {
        id
        date
        reason
        type
        created_at
        updated_at
      }
    }
  `,
  CREATE_HOLIDAY: `
    mutation CreateHoliday(
      $date: date!,
      $reason: String!,
      $type: String!,
      $organization_id: uuid!
    ) {
      insert_karlo_holidays_one(object: {
        date: $date,
        reason: $reason,
        type: $type,
        organization_id: $organization_id
      }) {
        id
        date
        reason
        type
        created_at
        updated_at
      }
    }
  `,
  UPDATE_HOLIDAY: `
    mutation UpdateHoliday(
      $id: uuid!,
      $date: date,
      $reason: String,
      $type: String
    ) {
      update_karlo_holidays_by_pk(
        pk_columns: {id: $id},
        _set: {
          date: $date,
          reason: $reason,
          type: $type
        }
      ) {
        id
        date
        reason
        type
        updated_at
      }
    }
  `,
  DELETE_HOLIDAY: `
    mutation DeleteHoliday($id: uuid!) {
      delete_karlo_holidays_by_pk(id: $id) {
        id
      }
    }
  `
};

const useHolidayStore = create<HolidayState>()(
  persist(
    (set, get) => ({
      holidays: [],
      isLoading: false,
      error: null,

      fetchHolidays: async (organizationId: string) => {
        const currentState = get();
        
        if (currentState.isLoading) {
          return;
        }
        
        set({ isLoading: true, error: null });
        
        const { data, error } = await graphqlRequest<HolidaysResponse>(
          QUERIES.GET_HOLIDAYS,
          { organization_id: organizationId }
        );

        set({ isLoading: false });

        if (error) {
          set({ error });
          return;
        }

        const holidays = data?.karlo_holidays || [];
        set({ holidays });
      },

      createHoliday: async (data: CreateHolidayData, organizationId: string) => {
        set({ isLoading: true, error: null });
        
        const { data: result, error } = await graphqlRequest<any>(
          QUERIES.CREATE_HOLIDAY,
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

        const newHoliday = result?.insert_karlo_holidays_one;
        if (newHoliday) {
          const currentState = get();
          const updatedHolidays = [...currentState.holidays, newHoliday].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          set({ holidays: updatedHolidays });
          return { success: true };
        }

        return { success: false, message: 'Failed to create holiday' };
      },

      updateHoliday: async (holidayId: string, data: Partial<CreateHolidayData>) => {
        set({ isLoading: true, error: null });
        
        const { data: result, error } = await graphqlRequest<any>(
          QUERIES.UPDATE_HOLIDAY,
          {
            id: holidayId,
            ...data
          }
        );

        set({ isLoading: false });

        if (error) {
          set({ error });
          return { success: false, message: error };
        }

        const updatedHoliday = result?.update_karlo_holidays_by_pk;
        if (updatedHoliday) {
          const currentState = get();
          const updatedHolidays = currentState.holidays.map(holiday => 
            holiday.id === holidayId ? { ...holiday, ...updatedHoliday } : holiday
          ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          set({ holidays: updatedHolidays });
          return { success: true };
        }

        return { success: false, message: 'Failed to update holiday' };
      },

      deleteHoliday: async (holidayId: string) => {
        set({ isLoading: true, error: null });
        
        const { data: result, error } = await graphqlRequest<any>(
          QUERIES.DELETE_HOLIDAY,
          { id: holidayId }
        );

        set({ isLoading: false });

        if (error) {
          set({ error });
          return { success: false, message: error };
        }

        if (result?.delete_karlo_holidays_by_pk) {
          const currentState = get();
          const updatedHolidays = currentState.holidays.filter(holiday => holiday.id !== holidayId);
          set({ holidays: updatedHolidays });
          return { success: true };
        }

        return { success: false, message: 'Failed to delete holiday' };
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'holiday-storage',
      partialize: (state) => ({
        holidays: state.holidays,
      }),
    }
  )
);

export default useHolidayStore;