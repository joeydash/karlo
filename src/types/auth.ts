interface User {
  id: string;
  phone: string;
  refresh_token?: string;
  role?: string;
  fullname?: string;
  email?: string;
  organization_id?: string;
  member_id?: string;
  dp?: string;
}

export interface AuthState {
  initialized: boolean;
  authenticated: boolean;
  user: User | null;
  token: string | null;
  lastTokenRefresh: number;

  // Loading states
  isRequestingOTP: boolean;
  isVerifyingOTP: boolean;
  isLoggingOut: boolean;
  isRefreshing: boolean;
  isUpdatingProfile: boolean;

  // Error states
  error: string | null;

  // Methods
  initialize: () => void;
  requestOTP: (
    phone: string
  ) => Promise<{ success: boolean; message?: string }>;
  verifyOTP: (
    phone: string,
    otp: string
  ) => Promise<{ success: boolean; message?: string }>;
  completePasskeyLogin: (
    phone: string,
    authToken: string,
    refreshToken: string,
    userId: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  refreshTokenWithRetry: (attempt?: number) => Promise<void>;
  updateProfile: (data: {
    fullname?: string;
    email?: string;
    dp?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  clearError: () => void;
  fetchUserRole: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  startRefreshInterval: () => void;
  clearRefreshInterval: () => void;
}

export interface RegisterResponse {
  registerWithoutPasswordV2?: {
    request_id: string;
    status: string;
  };
  registerWithoutPasswordV3?: {
    request_id: string;
    status: string;
  };
}

export interface VerifyOTPResponse {
  verifyOTPV2?: {
    auth_token: string;
    refresh_token: string;
    id: string;
    status: string;
  };
  verifyOTPV3?: {
    auth_token: string;
    refresh_token: string;
    id: string;
    status: string;
    deviceInfoSaved: boolean;
  };
}

export interface RefreshTokenResponse {
  refreshToken: {
    auth_token: string;
    refresh_token: string;
  };
}

export interface UpdateProfileResponse {
  update_auth: {
    affected_rows: number;
    returning: Array<{
      id: string;
      fullname: string;
      email: string;
      dp?: string;
    }>;
  };
}

export interface LogoutResponse {
  logout: {
    message: string;
  };
}
