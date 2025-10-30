export interface LeaveType {
  id: string;
  organization_id: string;
  type_code: string;
  display_name: string;
  allowance_days: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeaveTypeState {
  leaveTypes: LeaveType[];
  isLoading: boolean;
  error: string | null;
  
  fetchLeaveTypes: (organizationId: string) => Promise<void>;
  createLeaveType: (data: CreateLeaveTypeData, organizationId: string) => Promise<{ success: boolean; message?: string }>;
  updateLeaveType: (leaveTypeId: string, data: Partial<CreateLeaveTypeData>) => Promise<{ success: boolean; message?: string }>;
  deleteLeaveType: (leaveTypeId: string) => Promise<{ success: boolean; message?: string }>;
  clearError: () => void;
}

export interface CreateLeaveTypeData {
  type_code: string;
  display_name: string;
  allowance_days: number;
  description?: string;
}

export interface LeaveTypesResponse {
  karlo_leave_types: LeaveType[];
}