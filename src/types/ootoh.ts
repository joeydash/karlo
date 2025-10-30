export interface OOTOH {
  id: string;
  member_id: string;
  user_id: string;
  org_id: string;
  start_time: string;
  end_time: string | null;
  start_date: string;
  end_date: string | null;
  work_done: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  auth_fullname?: {
    fullname: string;
    dp?: string;
  };
}

export interface OOTOHState {
  ootohRecords: OOTOH[];
  todayRecord: OOTOH | null;
  total: number;
  isLoading: boolean;
  error: string | null;
  fetchTodayRecord: (orgId: string, userId: string) => Promise<void>;
  fetchOOTOHRecords: (orgId: string, page?: number, limit?: number, userId?: string) => Promise<void>;
  fetchAllOOTOHRecords: (orgId: string, page?: number, limit?: number) => Promise<void>;
  recordOOTOH: (orgId: string, memberId: string, userId: string, startTime: string, startDate: string, endTime: string | null, endDate: string | null, workDone: string | null, userFullname?: string, userDp?: string) => Promise<{ success: boolean; message?: string }>;
  updateOOTOH: (id: string, endTime: string, endDate: string | null, workDone: string | null) => Promise<{ success: boolean; message?: string }>;
  deleteOOTOH: (id: string) => Promise<{ success: boolean; message?: string }>;
  approveOOTOH: (id: string) => Promise<{ success: boolean; message?: string }>;
  rejectOOTOH: (id: string) => Promise<{ success: boolean; message?: string }>;
}

export interface OOTOHResponse {
  karlo_ootoh: OOTOH[];
  karlo_ootoh_aggregate?: {
    aggregate: {
      count: number;
    };
  };
}

export interface RecordOOTOHResponse {
  insert_karlo_ootoh_one: OOTOH;
}

export interface UpdateOOTOHResponse {
  update_karlo_ootoh_by_pk: OOTOH;
}

export interface DeleteOOTOHResponse {
  delete_karlo_ootoh_by_pk: {
    id: string;
  };
}
