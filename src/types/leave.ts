export interface Leave {
  id: string;
  organization_id: string;
  user_id: string;
  leave_type_id: string;
  leave_date: string;
  day_part: 'full_day' | 'first_half' | 'second_half';
  status?: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  karlo_leave_type?: {
    display_name: string;
    type_code: string;
    allowance_days: number;
  };
  auth_fullname?: {
    fullname: string;
    dp?: string;
  };
}

export interface LeaveState {
  leaves: Leave[];
  userJoiningDate: string | null;
  selectedMemberJoiningDate?: string | null;
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;

  fetchLeaves: (organizationId: string, limit?: number, offset?: number) => Promise<void>;
  fetchMemberLeaves: (organizationId: string, memberId: string, limit?: number, offset?: number) => Promise<void>;
  fetchAllLeaves: (organizationId: string, limit?: number, offset?: number) => Promise<void>;
  applyLeave: (data: ApplyLeaveData, organizationId: string) => Promise<{ success: boolean; message?: string }>;
  deleteLeave: (leaveId: string) => Promise<{ success: boolean; message?: string }>;
  updateLeave: (leaveId: string, data: Partial<ApplyLeaveData>) => Promise<{ success: boolean; message?: string }>;
  approveLeave: (leaveId: string) => Promise<{ success: boolean; message?: string }>;
  rejectLeave: (leaveId: string) => Promise<{ success: boolean; message?: string }>;
  setPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  clearError: () => void;
}

export interface ApplyLeaveData {
  leave_type_id: string;
  leave_date: string;
  day_part: 'full_day' | 'first_half' | 'second_half';
}

export interface LeavesResponse {
  karlo_leave_requests: Leave[];
  karlo_leave_requests_aggregate?: {
    aggregate: {
      count: number;
    };
  };
}

interface LeaveBalance {
  leave_type_id: string;
  type_code: string;
  display_name: string;
  allowance_days: number;
  annual_allowance: number;
  used_days: number;
  available_days: number;
  is_prorated: boolean;
}