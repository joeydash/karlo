import { create } from 'zustand';
import { OOTOHState, OOTOH, OOTOHResponse, RecordOOTOHResponse, UpdateOOTOHResponse, DeleteOOTOHResponse } from '../types/ootoh';
import { graphqlRequest } from '../utils/graphql';

const QUERIES = {
  GET_TODAY_RECORD: `
    query GetTodayOOTOH($orgId: uuid!, $userId: uuid!, $today: date!) {
      karlo_ootoh(
        where: {
          org_id: {_eq: $orgId},
          user_id: {_eq: $userId},
          start_date: {_eq: $today}
        }
        limit: 1
      ) {
        id
        member_id
        user_id
        org_id
        start_time
        end_time
        start_date
        end_date
        work_done
        status
        created_at
        updated_at
        auth_fullname {
          fullname
          dp
        }
      }
    }
  `,
  GET_OOTOH_RECORDS: `
    query GetOOTOHRecords($orgId: uuid!, $userId: uuid, $limit: Int!, $offset: Int!) {
      karlo_ootoh(
        where: {
          org_id: {_eq: $orgId},
          user_id: {_eq: $userId}
        }
        order_by: {start_date: desc}
        limit: $limit
        offset: $offset
      ) {
        id
        member_id
        user_id
        org_id
        start_time
        end_time
        start_date
        end_date
        work_done
        status
        created_at
        updated_at
        auth_fullname {
          fullname
          dp
        }
      }
      karlo_ootoh_aggregate(
        where: {
          org_id: {_eq: $orgId},
          user_id: {_eq: $userId}
        }
      ) {
        aggregate {
          count
        }
      }
    }
  `,
  GET_ALL_OOTOH_RECORDS: `
    query GetAllOOTOHRecords($orgId: uuid!, $limit: Int!, $offset: Int!) {
      karlo_ootoh(
        where: {
          org_id: {_eq: $orgId}
        }
        order_by: {start_date: desc}
        limit: $limit
        offset: $offset
      ) {
        id
        member_id
        user_id
        org_id
        start_time
        end_time
        start_date
        end_date
        work_done
        status
        created_at
        updated_at
        auth_fullname {
          fullname
          dp
        }
      }
      karlo_ootoh_aggregate(
        where: {
          org_id: {_eq: $orgId}
        }
      ) {
        aggregate {
          count
        }
      }
    }
  `,
  RECORD_OOTOH: `
    mutation RecordOOTOH($memberId: uuid!, $userId: uuid!, $orgId: uuid!, $startTime: timestamptz!, $startDate: date!, $endTime: timestamptz, $endDate: date, $workDone: String) {
      insert_karlo_ootoh_one(
        object: {
          member_id: $memberId,
          user_id: $userId,
          org_id: $orgId,
          start_time: $startTime,
          start_date: $startDate,
          end_time: $endTime,
          end_date: $endDate,
          work_done: $workDone
        }
      ) {
        id
        member_id
        user_id
        org_id
        start_time
        end_time
        start_date
        end_date
        work_done
        status
        created_at
        updated_at
        auth_fullname {
          fullname
          dp
        }
      }
    }
  `,
  UPDATE_OOTOH: `
    mutation UpdateOOTOH($id: uuid!, $endTime: timestamptz!, $endDate: date, $workDone: String) {
      update_karlo_ootoh_by_pk(
        pk_columns: {id: $id},
        _set: {end_time: $endTime, end_date: $endDate, work_done: $workDone}
      ) {
        id
        member_id
        user_id
        org_id
        start_time
        end_time
        start_date
        end_date
        work_done
        status
        created_at
        updated_at
        auth_fullname {
          fullname
          dp
        }
      }
    }
  `,
  DELETE_OOTOH: `
    mutation DeleteOOTOH($id: uuid!) {
      delete_karlo_ootoh_by_pk(id: $id) {
        id
      }
    }
  `,
  APPROVE_OOTOH: `
    mutation ApproveOOTOH($id: uuid!) {
      update_karlo_ootoh_by_pk(
        pk_columns: {id: $id},
        _set: {status: "approved"}
      ) {
        id
        status
      }
    }
  `,
  REJECT_OOTOH: `
    mutation RejectOOTOH($id: uuid!) {
      update_karlo_ootoh_by_pk(
        pk_columns: {id: $id},
        _set: {status: "rejected"}
      ) {
        id
        status
      }
    }
  `,
};

const useOOTOHStore = create<OOTOHState>((set, get) => ({
  ootohRecords: [],
  todayRecord: null,
  total: 0,
  isLoading: false,
  error: null,

  fetchTodayRecord: async (orgId: string, userId: string) => {
    set({ error: null });
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await graphqlRequest<OOTOHResponse>(
        QUERIES.GET_TODAY_RECORD,
        { orgId, userId, today }
      );

      if (result.error) {
        set({ error: result.error });
        return;
      }

      const todayRecord = result.data?.karlo_ootoh[0] || null;
      set({ todayRecord });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch today\'s OOTOH record',
      });
    }
  },

  fetchOOTOHRecords: async (orgId: string, page: number = 1, limit: number = 10, userId?: string) => {
    const currentState = get();

    if (currentState.isLoading) {
      return;
    }

    const offset = (page - 1) * limit;
    const currentRecords = currentState.ootohRecords;
    set({ isLoading: currentRecords.length === 0, error: null });
    try {
      const query = userId ? QUERIES.GET_OOTOH_RECORDS : QUERIES.GET_ALL_OOTOH_RECORDS;
      const variables = userId ? { orgId, userId, limit, offset } : { orgId, limit, offset };

      const result = await graphqlRequest<OOTOHResponse>(query, variables);

      if (result.error) {
        set({ error: result.error, isLoading: false });
        return;
      }

      set({
        ootohRecords: result.data?.karlo_ootoh || [],
        total: result.data?.karlo_ootoh_aggregate?.aggregate?.count || 0,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch OOTOH records',
        isLoading: false,
      });
    }
  },

  fetchAllOOTOHRecords: async (orgId: string, page: number = 1, limit: number = 10) => {
    const currentState = get();

    if (currentState.isLoading) {
      return;
    }

    const offset = (page - 1) * limit;
    const currentRecords = currentState.ootohRecords;
    set({ isLoading: currentRecords.length === 0, error: null });
    try {
      const result = await graphqlRequest<OOTOHResponse>(
        QUERIES.GET_ALL_OOTOH_RECORDS,
        { orgId, limit, offset }
      );

      if (result.error) {
        set({ error: result.error, isLoading: false });
        return;
      }

      set({
        ootohRecords: result.data?.karlo_ootoh || [],
        total: result.data?.karlo_ootoh_aggregate?.aggregate?.count || 0,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch OOTOH records',
        isLoading: false,
      });
    }
  },

  recordOOTOH: async (orgId: string, memberId: string, userId: string, startTime: string, startDate: string, endTime: string | null = null, endDate: string | null = null, workDone: string | null = null, userFullname?: string, userDp?: string) => {
    // Check if record already exists for this member on this date
    const existingRecord = get().ootohRecords.find(
      r => r.member_id === memberId && r.start_date === startDate
    );

    if (existingRecord) {
      const recordDate = new Date(startDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      return {
        success: false,
        message: `Office hours have already been recorded for ${recordDate}. You can only record once per day.`
      };
    }

    const optimisticRecord: OOTOH = {
      id: `temp-${Date.now()}`,
      member_id: memberId,
      user_id: userId,
      org_id: orgId,
      start_time: startTime,
      end_time: endTime,
      start_date: startDate,
      end_date: endDate,
      work_done: workDone,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      auth_fullname: userFullname ? {
        fullname: userFullname,
        dp: userDp
      } : undefined,
    };

    set((state) => ({
      ootohRecords: [optimisticRecord, ...state.ootohRecords],
      todayRecord: optimisticRecord,
      error: null,
    }));

    try {
      const variables: any = { memberId, userId, orgId, startTime, startDate };
      if (endTime) {
        variables.endTime = endTime;
      }
      if (endDate) {
        variables.endDate = endDate;
      }
      if (workDone) {
        variables.workDone = workDone;
      }

      const result = await graphqlRequest<RecordOOTOHResponse>(
        QUERIES.RECORD_OOTOH,
        variables
      );

      if (result.error) {
        set((state) => ({
          ootohRecords: state.ootohRecords.filter(r => r.id !== optimisticRecord.id),
          todayRecord: state.todayRecord?.id === optimisticRecord.id ? null : state.todayRecord,
          error: result.error,
        }));
        return { success: false, message: result.error };
      }

      const newRecord = result.data?.insert_karlo_ootoh_one;
      if (newRecord) {
        set((state) => ({
          ootohRecords: state.ootohRecords.map(r => r.id === optimisticRecord.id ? newRecord : r),
          todayRecord: newRecord,
        }));
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to record OOTOH';
      set((state) => ({
        ootohRecords: state.ootohRecords.filter(r => r.id !== optimisticRecord.id),
        todayRecord: state.todayRecord?.id === optimisticRecord.id ? null : state.todayRecord,
        error: message,
      }));
      return { success: false, message };
    }
  },

  updateOOTOH: async (id: string, endTime: string, endDate: string | null, workDone: string | null) => {
    const previousState = get();
    const recordToUpdate = previousState.ootohRecords.find(r => r.id === id);

    if (!recordToUpdate) {
      return { success: false, message: 'Record not found' };
    }

    const optimisticRecord = {
      ...recordToUpdate,
      end_time: endTime,
      end_date: endDate,
      work_done: workDone,
      updated_at: new Date().toISOString(),
    };

    set((state) => ({
      ootohRecords: state.ootohRecords.map(r => r.id === id ? optimisticRecord : r),
      todayRecord: state.todayRecord?.id === id ? optimisticRecord : state.todayRecord,
      error: null,
    }));

    try {
      const variables: any = { id, endTime, endDate };
      if (workDone !== null) {
        variables.workDone = workDone;
      }

      const result = await graphqlRequest<UpdateOOTOHResponse>(
        QUERIES.UPDATE_OOTOH,
        variables
      );

      if (result.error) {
        set((state) => ({
          ootohRecords: state.ootohRecords.map(r => r.id === id ? recordToUpdate : r),
          todayRecord: state.todayRecord?.id === id ? recordToUpdate : state.todayRecord,
          error: result.error,
        }));
        return { success: false, message: result.error };
      }

      const updatedRecord = result.data?.update_karlo_ootoh_by_pk;
      if (updatedRecord) {
        set((state) => ({
          ootohRecords: state.ootohRecords.map(r => r.id === id ? updatedRecord : r),
          todayRecord: state.todayRecord?.id === id ? updatedRecord : state.todayRecord,
        }));
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update OOTOH';
      set((state) => ({
        ootohRecords: state.ootohRecords.map(r => r.id === id ? recordToUpdate : r),
        todayRecord: state.todayRecord?.id === id ? recordToUpdate : state.todayRecord,
        error: message,
      }));
      return { success: false, message };
    }
  },

  deleteOOTOH: async (id: string) => {
    const previousState = get();
    const recordToDelete = previousState.ootohRecords.find(r => r.id === id);

    if (!recordToDelete) {
      return { success: false, message: 'Record not found' };
    }

    set((state) => ({
      ootohRecords: state.ootohRecords.filter(r => r.id !== id),
      todayRecord: state.todayRecord?.id === id ? null : state.todayRecord,
      error: null,
    }));

    try {
      const result = await graphqlRequest<DeleteOOTOHResponse>(
        QUERIES.DELETE_OOTOH,
        { id }
      );

      if (result.error) {
        set((state) => ({
          ootohRecords: [...state.ootohRecords, recordToDelete].sort((a, b) =>
            new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
          ),
          todayRecord: recordToDelete.start_date === new Date().toISOString().split('T')[0] ? recordToDelete : state.todayRecord,
          error: result.error,
        }));
        return { success: false, message: result.error };
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete OOTOH';
      set((state) => ({
        ootohRecords: [...state.ootohRecords, recordToDelete].sort((a, b) =>
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        ),
        todayRecord: recordToDelete.start_date === new Date().toISOString().split('T')[0] ? recordToDelete : state.todayRecord,
        error: message,
      }));
      return { success: false, message };
    }
  },

  approveOOTOH: async (id: string) => {
    const previousState = get();
    const recordToUpdate = previousState.ootohRecords.find(r => r.id === id);

    if (!recordToUpdate) {
      return { success: false, message: 'Record not found' };
    }

    const optimisticRecord = {
      ...recordToUpdate,
      status: 'approved' as const,
      updated_at: new Date().toISOString(),
    };

    set((state) => ({
      ootohRecords: state.ootohRecords.map(r => r.id === id ? optimisticRecord : r),
      error: null,
    }));

    try {
      const result = await graphqlRequest<any>(
        QUERIES.APPROVE_OOTOH,
        { id }
      );

      if (result.error) {
        set((state) => ({
          ootohRecords: state.ootohRecords.map(r => r.id === id ? recordToUpdate : r),
          error: result.error,
        }));
        return { success: false, message: result.error };
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to approve OOTOH';
      set((state) => ({
        ootohRecords: state.ootohRecords.map(r => r.id === id ? recordToUpdate : r),
        error: message,
      }));
      return { success: false, message };
    }
  },

  rejectOOTOH: async (id: string) => {
    const previousState = get();
    const recordToUpdate = previousState.ootohRecords.find(r => r.id === id);

    if (!recordToUpdate) {
      return { success: false, message: 'Record not found' };
    }

    const optimisticRecord = {
      ...recordToUpdate,
      status: 'rejected' as const,
      updated_at: new Date().toISOString(),
    };

    set((state) => ({
      ootohRecords: state.ootohRecords.map(r => r.id === id ? optimisticRecord : r),
      error: null,
    }));

    try {
      const result = await graphqlRequest<any>(
        QUERIES.REJECT_OOTOH,
        { id }
      );

      if (result.error) {
        set((state) => ({
          ootohRecords: state.ootohRecords.map(r => r.id === id ? recordToUpdate : r),
          error: result.error,
        }));
        return { success: false, message: result.error };
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reject OOTOH';
      set((state) => ({
        ootohRecords: state.ootohRecords.map(r => r.id === id ? recordToUpdate : r),
        error: message,
      }));
      return { success: false, message };
    }
  },
}));

export default useOOTOHStore;
