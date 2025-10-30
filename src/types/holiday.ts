export interface Holiday {
  id: string;
  date: string;
  reason: string;
  type: 'national' | 'company' | 'religious' | 'regional' | 'optional';
  created_at: string;
  updated_at: string;
}

export interface HolidayState {
  holidays: Holiday[];
  isLoading: boolean;
  error: string | null;
  
  fetchHolidays: (organizationId: string) => Promise<void>;
  createHoliday: (data: CreateHolidayData, organizationId: string) => Promise<{ success: boolean; message?: string }>;
  updateHoliday: (holidayId: string, data: Partial<CreateHolidayData>) => Promise<{ success: boolean; message?: string }>;
  deleteHoliday: (holidayId: string) => Promise<{ success: boolean; message?: string }>;
  clearError: () => void;
}

export interface CreateHolidayData {
  date: string;
  reason: string;
  type: 'national' | 'company' | 'religious' | 'regional' | 'optional';
}

export interface HolidaysResponse {
  karlo_holidays: Holiday[];
}