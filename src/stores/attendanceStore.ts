import { create } from 'zustand';
import { graphqlRequest } from '../utils/graphql';

export interface AttendanceRecord {
  id: string;
  member_id: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceState {
  attendanceRecords: AttendanceRecord[];
  isLoading: boolean;
  error: string | null;
  
  fetchAttendanceForDate: (memberIds: string[], date: string) => Promise<void>;
  markAttendance: (memberId: string, date: string) => Promise<{ success: boolean; message?: string }>;
  unmarkAttendance: (memberId: string, date: string) => Promise<{ success: boolean; message?: string }>;
  toggleAttendance: (memberId: string, date: string) => Promise<{ success: boolean; message?: string }>;
  isMarked: (memberId: string) => boolean;
  getMarkedMemberIds: () => Set<string>;
  clearAttendance: (memberIds: string[], date: string) => Promise<{ success: boolean; message?: string }>;
  clearError: () => void;
}

const QUERIES = {
  GET_TODAY_ATTENDANCE: `
    query GetTodayAttendance($member_ids: [uuid!]!, $date: date!) {
      karlo_attendance(
        where: {
          member_id: {_in: $member_ids},
          date: {_eq: $date}
        }
      ) {
        id
        member_id
        date
        created_at
        updated_at
      }
    }
  `,
  MARK_ATTENDANCE: `
    mutation MarkAttendance($member_id: uuid!, $date: date!) {
      insert_karlo_attendance_one(
        object: {
          member_id: $member_id,
          date: $date
        },
        on_conflict: {
          constraint: karlo_attendance_member_id_date_key,
          update_columns: []
        }
      ) {
        id
        member_id
        date
        created_at
        updated_at
      }
    }
  `,
  UNMARK_ATTENDANCE: `
    mutation UnmarkAttendance($member_id: uuid!, $date: date!) {
      delete_karlo_attendance(
        where: {
          member_id: {_eq: $member_id},
          date: {_eq: $date}
        }
      ) {
        affected_rows
      }
    }
  `,
  CLEAR_ALL_ATTENDANCE: `
    mutation ClearAllAttendance($member_ids: [uuid!]!, $date: date!) {
      delete_karlo_attendance(
        where: {
          member_id: {_in: $member_ids},
          date: {_eq: $date}
        }
      ) {
        affected_rows
      }
    }
  `
};

// Helper to format date in YYYY-MM-DD format
const formatDate = (date: Date | string) => {
  if (typeof date === 'string') {
    return date;
  }
  return date.toISOString().split('T')[0];
};

const useAttendanceStore = create<AttendanceState>((set, get) => ({
  attendanceRecords: [],
  isLoading: false,
  error: null,

  fetchAttendanceForDate: async (memberIds: string[], date: string) => {
    const currentState = get();
    
    if (currentState.isLoading) {
      return;
    }
    
    set({ isLoading: true, error: null });
    
    const formattedDate = formatDate(date);
    
    const { data, error } = await graphqlRequest<any>(
      QUERIES.GET_TODAY_ATTENDANCE,
      { 
        member_ids: memberIds,
        date: formattedDate
      }
    );

    set({ isLoading: false });

    if (error) {
      set({ error });
      return;
    }

    const records = data?.karlo_attendance || [];
    set({ attendanceRecords: records });
  },

  markAttendance: async (memberId: string, date: string) => {
    set({ error: null });
    
    const formattedDate = formatDate(date);
    
    const { data, error } = await graphqlRequest<any>(
      QUERIES.MARK_ATTENDANCE,
      { 
        member_id: memberId,
        date: formattedDate
      }
    );

    if (error) {
      set({ error });
      return { success: false, message: error };
    }

    const newRecord = data?.insert_karlo_attendance_one;
    if (newRecord) {
      const currentState = get();
      // Add or update the record in local state
      const existingIndex = currentState.attendanceRecords.findIndex(
        record => record.member_id === memberId
      );
      
      let updatedRecords;
      if (existingIndex >= 0) {
        updatedRecords = [...currentState.attendanceRecords];
        updatedRecords[existingIndex] = newRecord;
      } else {
        updatedRecords = [...currentState.attendanceRecords, newRecord];
      }
      
      set({ attendanceRecords: updatedRecords });
      return { success: true };
    }

    return { success: false, message: 'Failed to mark attendance' };
  },

  unmarkAttendance: async (memberId: string, date: string) => {
    set({ error: null });
    
    const formattedDate = formatDate(date);
    
    const { data, error } = await graphqlRequest<any>(
      QUERIES.UNMARK_ATTENDANCE,
      { 
        member_id: memberId,
        date: formattedDate
      }
    );

    if (error) {
      set({ error });
      return { success: false, message: error };
    }

    if (data?.delete_karlo_attendance?.affected_rows > 0) {
      const currentState = get();
      const updatedRecords = currentState.attendanceRecords.filter(
        record => record.member_id !== memberId
      );
      set({ attendanceRecords: updatedRecords });
      return { success: true };
    }

    return { success: false, message: 'Failed to unmark attendance' };
  },

  toggleAttendance: async (memberId: string, date: string) => {
    const currentState = get();
    const isCurrentlyMarked = currentState.attendanceRecords.some(
      record => record.member_id === memberId
    );
    
    if (isCurrentlyMarked) {
      return await currentState.unmarkAttendance(memberId, date);
    } else {
      return await currentState.markAttendance(memberId, date);
    }
  },

  isMarked: (memberId: string) => {
    const currentState = get();
    return currentState.attendanceRecords.some(
      record => record.member_id === memberId
    );
  },

  getMarkedMemberIds: () => {
    const currentState = get();
    return new Set(currentState.attendanceRecords.map(record => record.member_id));
  },

  clearAttendance: async (memberIds: string[], date: string) => {
    set({ error: null });
    
    try {
      const formattedDate = formatDate(date);
      
      if (memberIds.length === 0) {
        return { success: true, message: 'No members to clear attendance for' };
      }
      
      const { data, error } = await graphqlRequest<any>(
        QUERIES.CLEAR_ALL_ATTENDANCE,
        { 
          member_ids: memberIds,
          date: formattedDate
        }
      );

      if (error) {
        set({ error });
        return { success: false, message: error };
      }

      const affectedRows = data?.delete_karlo_attendance?.affected_rows || 0;
      
      // Clear local state
      set({ attendanceRecords: [] });
      
      return { success: true, message: `Cleared attendance for ${affectedRows} members` };
    } catch (error) {
      set({ error: 'Failed to clear attendance' });
      return { success: false, message: 'Failed to clear attendance' };
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAttendanceStore;