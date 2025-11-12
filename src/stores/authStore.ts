import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  AuthState,
  RegisterResponse,
  VerifyOTPResponse,
  RefreshTokenResponse,
  LogoutResponse,
  UpdateProfileResponse,
} from "../types/auth";
import { graphqlRequest, MUTATIONS } from "../utils/graphql";
import { AUTH_CONFIG } from "../utils/config";
import { getRecaptchaToken } from "../utils/recaptcha";

// Role fetching query
const ROLE_QUERY = `
  query GetUserRole($user_id: uuid!) {
    karlo_organization_members(where: {user_id: {_eq: $user_id}}, limit: 1) {
      id
      role
      organization_id
    }
  }
`;

// Bank details query
const BANK_DETAILS_QUERY = `
  query GetBankDetails($user_id: uuid!) {
    whatsub_bank_account_details(where: {user_id: {_eq: $user_id}}, limit: 1) {
      bank_account_number
      ifsc
      account_name
    }
  }
`;

// Bank details upsert mutation
const UPSERT_BANK_DETAILS = `
  mutation UpsertBankDetails($user_id: uuid!, $bank_account_number: String!, $ifsc: String!, $account_name: String!) {
    insert_whatsub_bank_account_details_one(
      object: {
        user_id: $user_id,
        bank_account_number: $bank_account_number,
        ifsc: $ifsc,
        account_name: $account_name
      },
      on_conflict: {
        constraint: whatsub_bank_account_details_user_id_key,  # Assuming unique constraint on user_id
        update_columns: [bank_account_number, ifsc, account_name]
      }
    ) {
      user_id
      bank_account_number
      ifsc
      account_name
    }
  }
`;

// Token refresh configuration
const TOKEN_REFRESH_CONFIG = {
  INTERVAL: AUTH_CONFIG.TOKEN_REFRESH_INTERVAL,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000, // 2 seconds
  VISIBILITY_CHECK_INTERVAL: 30000, // 30 seconds
  TOKEN_EXPIRY_BUFFER: AUTH_CONFIG.TOKEN_EXPIRY_BUFFER, // 1 hour before actual expiry
};

// Helper to check if token needs refresh based on timestamp
const shouldRefreshToken = (lastRefresh: number) => {
  const now = Date.now();
  const timeSinceRefresh = now - lastRefresh;
  return (
    timeSinceRefresh >=
    TOKEN_REFRESH_CONFIG.INTERVAL - TOKEN_REFRESH_CONFIG.TOKEN_EXPIRY_BUFFER
  );
};

// Helper to detect if app is in background/foreground
const isAppVisible = () => {
  return !document.hidden && document.visibilityState === "visible";
};
const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      initialized: false,
      authenticated: false,
      user: null,
      token: null,
      isRequestingOTP: false,
      isVerifyingOTP: false,
      isLoggingOut: false,
      isRefreshing: false,
      isUpdatingProfile: false,
      error: null,

      // Add last refresh timestamp to track when token was last refreshed
      lastTokenRefresh: 0,

      // Helper function to start refresh interval
      startRefreshInterval: () => {
        // Clear any existing interval first
        if ((window as any).tokenRefreshInterval) {
          console.log("🛑 Clearing existing token refresh interval");
          clearInterval((window as any).tokenRefreshInterval);
          delete (window as any).tokenRefreshInterval;
        }

        // Clear any existing visibility interval
        if ((window as any).visibilityCheckInterval) {
          clearInterval((window as any).visibilityCheckInterval);
          delete (window as any).visibilityCheckInterval;
        }

        const CHECK_INTERVAL = 10 * 60 * 1000;

        // Main refresh interval - more frequent checks
        const refreshInterval = setInterval(() => {
          console.log("🔄 Token refresh interval triggered");
          const currentState = get();

          if (
            !currentState.authenticated ||
            !currentState.user ||
            currentState.isRefreshing
          ) {
            console.log(
              "❌ Skipping refresh - not authenticated, no user, or already refreshing"
            );
            return;
          }

          // Check if token needs refresh based on time
          if (shouldRefreshToken(currentState.lastTokenRefresh || 0)) {
            console.log(
              "✅ Token needs refresh based on time, calling refreshToken()"
            );
            currentState.refreshTokenWithRetry();
          } else {
            console.log("⏭️ Token refresh not needed yet");
          }
        }, CHECK_INTERVAL); // Check twice as often as refresh interval

        (window as any).tokenRefreshInterval = refreshInterval;
        console.log(
          "🚀 Token refresh interval started with ID:",
          refreshInterval,
          "Check interval:",
          TOKEN_REFRESH_CONFIG.INTERVAL / 2 / 1000 / 60,
          "minutes"
        );
        console.log(
          `🚀 Token refresh check running every ${
            CHECK_INTERVAL / 1000 / 60
          } minutes`
        );

        // Visibility change handler - refresh when app becomes visible
        const handleVisibilityChange = () => {
          console.log(
            "👁️ Visibility changed, document.hidden:",
            document.hidden
          );

          if (isAppVisible()) {
            console.log(
              "🌟 App became visible - checking if token refresh needed"
            );
            const currentState = get();

            if (
              currentState.authenticated &&
              currentState.user &&
              !currentState.isRefreshing
            ) {
              // Check if we need to refresh based on time since last refresh
              if (shouldRefreshToken(currentState.lastTokenRefresh || 0)) {
                console.log(
                  "🔄 App visible and token needs refresh - refreshing now"
                );
                currentState.refreshTokenWithRetry();
              } else {
                console.log("✅ App visible but token is still fresh");
              }
            }
          }
        };

        // Add visibility change listener
        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Add focus/blur listeners for additional reliability
        const handleFocus = () => {
          console.log("🎯 Window focused - checking token freshness");
          const currentState = get();
          if (
            currentState.authenticated &&
            currentState.user &&
            !currentState.isRefreshing
          ) {
            if (shouldRefreshToken(currentState.lastTokenRefresh || 0)) {
              console.log("🔄 Window focused and token needs refresh");
              currentState.refreshTokenWithRetry();
            }
          }
        };

        window.addEventListener("focus", handleFocus);

        // Store cleanup function
        (window as any).cleanupTokenRefresh = () => {
          document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange
          );
          window.removeEventListener("focus", handleFocus);
        };
      },

      // Helper function to clear refresh interval
      clearRefreshInterval: () => {
        if ((window as any).tokenRefreshInterval) {
          console.log(
            "🛑 Clearing token refresh interval with ID:",
            (window as any).tokenRefreshInterval
          );
          clearInterval((window as any).tokenRefreshInterval);
          delete (window as any).tokenRefreshInterval;
        } else {
          console.log("⚠️ No token refresh interval found to clear");
        }

        if ((window as any).visibilityCheckInterval) {
          clearInterval((window as any).visibilityCheckInterval);
          delete (window as any).visibilityCheckInterval;
        }

        // Clean up event listeners
        if ((window as any).cleanupTokenRefresh) {
          (window as any).cleanupTokenRefresh();
          delete (window as any).cleanupTokenRefresh;
        }
      },

      initialize: () => {
        const state = get();
        if (state.token && state.user) {
          set({ authenticated: true, initialized: true });

          // Make auth store available globally for organization store
          (window as any).__authStore = get();

          // Set initial refresh timestamp if not set
          if (!state.lastTokenRefresh) {
            set({ lastTokenRefresh: Date.now() });
          }

          // 🔥 NEW: Force refresh on init if token is stale/expired
          if (shouldRefreshToken(state.lastTokenRefresh || 0)) {
            console.log(
              "⏳ Token may be stale - refreshing immediately on initialize()"
            );
            get().refreshTokenWithRetry();
          } else {
            console.log("✅ Token still fresh on initialize()");
          }

          // Always fetch user role and profile data to ensure they're up to date
          const fetchData = async () => {
            await get().fetchUserRole();
            await get().fetchUserProfile();
          };
          fetchData();

          // Start token refresh interval using helper function
          get().startRefreshInterval();
        } else {
          set({ initialized: true });
          console.log("⚠️ No token or user found during initialization");
        }
      },

      requestOTP: async (phone: string) => {
        set({ isRequestingOTP: true, error: null });

        try {
          // Get reCAPTCHA token
          const recaptchaToken = await getRecaptchaToken("register");

          const { data, error } = await graphqlRequest<RegisterResponse>(
            MUTATIONS.REGISTER,
            { phone, recaptcha_token: recaptchaToken },
            undefined,
            true // Use auth URL
          );

          set({ isRequestingOTP: false });

          if (error) {
            set({ error });
            return { success: false, message: error };
          }

          if (data?.registerWithoutPasswordV3?.status === "success") {
            return { success: true };
          }

          const errorMsg = "Failed to send OTP. Please try again.";
          set({ error: errorMsg });
          return { success: false, message: errorMsg };
        } catch (recaptchaError) {
          set({ isRequestingOTP: false });
          const errorMsg =
            recaptchaError instanceof Error
              ? `reCAPTCHA error: ${recaptchaError.message}`
              : "Failed to verify reCAPTCHA. Please try again.";
          set({ error: errorMsg });
          return { success: false, message: errorMsg };
        }
      },

      verifyOTP: async (phone: string, otp: string) => {
        set({ isVerifyingOTP: true, error: null });

        const { data, error } = await graphqlRequest<VerifyOTPResponse>(
          MUTATIONS.VERIFY_OTP,
          { phone1: phone, otp1: otp },
          undefined,
          true // Use auth URL
        );

        set({ isVerifyingOTP: false });

        if (error) {
          set({ error });
          return { success: false, message: error };
        }

        const verifyData = data?.verifyOTPV3 || data?.verifyOTPV2;

        // Check if we have valid response data
        if (
          verifyData?.status === "success" &&
          verifyData?.auth_token &&
          verifyData?.id
        ) {
          const user = {
            id: verifyData.id,
            phone,
            refresh_token: verifyData.refresh_token,
            fullname: undefined,
            email: undefined,
          };

          set({
            authenticated: true,
            user,
            token: verifyData.auth_token,
            lastTokenRefresh: Date.now(),
            error: null,
          });

          // Make auth store available globally
          (window as any).__authStore = get();

          // Start token refresh interval using helper function
          get().startRefreshInterval();

          // Fetch user role after successful login
          await get().fetchUserRole();
          await get().fetchUserProfile();

          return { success: true };
        }

        const errorMsg = "Invalid OTP. Please try again.";
        set({ error: errorMsg });
        return { success: false, message: errorMsg };
      },

      // Enhanced refresh token function with retry logic
      refreshTokenWithRetry: async (attempt: number = 1) => {
        console.log(
          `🔄 refreshTokenWithRetry() called - attempt ${attempt}/${TOKEN_REFRESH_CONFIG.RETRY_ATTEMPTS}`
        );
        const state = get();

        // Prevent multiple simultaneous refresh requests
        if (state.isRefreshing) {
          console.log("⏳ Token refresh already in progress, skipping");
          return;
        }

        if (
          !state.user?.refresh_token ||
          !state.user?.id ||
          !state.authenticated
        ) {
          console.log("❌ Cannot refresh token - missing data:", {
            hasRefreshToken: !!state.user?.refresh_token,
            hasUserId: !!state.user?.id,
            isAuthenticated: state.authenticated,
          });
          return;
        }

        console.log("📡 Making refresh token request to GraphQL endpoint");
        set({ isRefreshing: true });

        try {
          const { data, error } = await graphqlRequest<RefreshTokenResponse>(
            MUTATIONS.REFRESH_TOKEN,
            {
              refresh_token: state.user.refresh_token,
              user_id: state.user.id,
            },
            undefined, // Don't use the old token for refresh
            false // Use regular GraphQL URL
          );

          set({ isRefreshing: false });

          if (error) {
            console.error(`Token refresh failed on attempt ${attempt}:`, error);

            // Retry logic
            if (attempt < TOKEN_REFRESH_CONFIG.RETRY_ATTEMPTS) {
              console.log(
                `🔄 Retrying token refresh in ${
                  TOKEN_REFRESH_CONFIG.RETRY_DELAY
                }ms (attempt ${attempt + 1})`
              );
              setTimeout(() => {
                get().refreshTokenWithRetry(attempt + 1);
              }, TOKEN_REFRESH_CONFIG.RETRY_DELAY * attempt); // Exponential backoff
              return;
            }

            // If all retries failed, logout user
            console.error(
              "❌ All token refresh attempts failed, logging out user"
            );
            const currentState = get();
            currentState.logout();
            return;
          }

          const refreshData = data?.refreshToken;
          if (refreshData?.auth_token) {
            console.log("✅ Token refresh successful - updating auth state");
            set({
              token: refreshData.auth_token,
              lastTokenRefresh: Date.now(),
              user: {
                ...state.user,
                refresh_token:
                  refreshData.refresh_token || state.user.refresh_token,
              },
            });

            // Update the global auth store reference
            (window as any).__authStore = get();
          } else {
            console.log("❌ Token refresh failed - no auth_token in response");

            // Retry logic for invalid response
            if (attempt < TOKEN_REFRESH_CONFIG.RETRY_ATTEMPTS) {
              console.log(
                `🔄 Retrying token refresh due to invalid response (attempt ${
                  attempt + 1
                })`
              );
              setTimeout(() => {
                get().refreshTokenWithRetry(attempt + 1);
              }, TOKEN_REFRESH_CONFIG.RETRY_DELAY * attempt);
              return;
            }

            // If all retries failed, logout user
            console.error(
              "❌ All token refresh attempts failed due to invalid response, logging out user"
            );
            const currentState = get();
            currentState.logout();
          }
        } catch (networkError) {
          console.error(
            `Network error during token refresh attempt ${attempt}:`,
            networkError
          );
          set({ isRefreshing: false });

          // Retry on network errors
          if (attempt < TOKEN_REFRESH_CONFIG.RETRY_ATTEMPTS) {
            console.log(
              `🔄 Retrying token refresh due to network error (attempt ${
                attempt + 1
              })`
            );
            setTimeout(() => {
              get().refreshTokenWithRetry(attempt + 1);
            }, TOKEN_REFRESH_CONFIG.RETRY_DELAY * attempt);
            return;
          }

          // If all retries failed due to network issues, don't logout immediately
          // The user might be temporarily offline
          console.error(
            "❌ All token refresh attempts failed due to network issues"
          );
        }
      },
      refreshToken: async () => {
        // Delegate to the retry-enabled version
        return get().refreshTokenWithRetry();
      },

      fetchUserRole: async () => {
        const state = get();
        if (!state.user?.id || !state.token) {
          console.log("❌ Cannot fetch user role - missing user ID or token");
          return;
        }

        try {
          const { data, error } = await graphqlRequest(
            ROLE_QUERY,
            { user_id: state.user.id },
            state.token
          );

          if (error) {
            console.error("❌ Failed to fetch user role:", error);
            return;
          }

          const members = data?.karlo_organization_members;
          if (members && members.length > 0) {
            const memberId = members[0].id;
            const role = members[0].role || "member";
            const organizationId = members[0].organization_id;

            set({
              user: {
                ...state.user,
                member_id: memberId,
                role,
                organization_id: organizationId,
              },
            });
          } else {
            console.log(
              "ℹ️ No organization membership found, defaulting to member role"
            );
            set({
              user: {
                ...state.user,
                role: "member",
              },
            });
          }
        } catch (error) {
          console.error("❌ Error fetching user role:", error);
        }
      },

      fetchUserProfile: async () => {
        const state = get();
        if (!state.user?.id || !state.token) {
          console.log(
            "❌ Cannot fetch user profile - missing user ID or token"
          );
          return;
        }

        try {
          const { data, error } = await graphqlRequest(
            `query GetUserProfile($user_id: uuid!) {
              auth(where: {id: {_eq: $user_id}}) {
                fullname
                email
                dp
              }
            }`,
            { user_id: state.user.id },
            state.token
          );

          if (error) {
            console.error("❌ Failed to fetch user profile:", error);
            return;
          }

          const profile = data?.auth?.[0];

          // Always update user object with profile data (including null values)
          set({
            user: {
              ...state.user,
              fullname: profile?.fullname || null,
              email: profile?.email || null,
              dp: profile?.dp || null,
            },
          });
        } catch (error) {
          console.error("❌ Error fetching user profile:", error);
        }
      },

      updateProfile: async (data: {
        fullname?: string;
        email?: string;
        dp?: string;
      }) => {
        const state = get();
        if (!state.user?.id || !state.token) {
          const errorMsg = "Cannot update profile - user not authenticated";
          set({ error: errorMsg });
          return { success: false, message: errorMsg };
        }

        set({ isUpdatingProfile: true, error: null });

        try {
          // Always send all fields with current values
          // If a field is not provided in data, use the existing user value
          const variables = {
            id: state.user.id,
            fullname:
              data.fullname !== undefined ? data.fullname : state.user.fullname,
            email: data.email !== undefined ? data.email : state.user.email,
            dp: data.dp !== undefined ? data.dp : (state.user as any).dp || "",
          };

          const { data: responseData, error } =
            await graphqlRequest<UpdateProfileResponse>(
              MUTATIONS.UPDATE_PROFILE,
              variables,
              state.token
            );

          set({ isUpdatingProfile: false });

          if (error) {
            set({ error });
            return { success: false, message: error };
          }

          if (responseData?.update_auth?.affected_rows > 0) {
            const updatedUser = responseData.update_auth.returning[0];
            set({
              user: {
                ...state.user,
                fullname: updatedUser.fullname,
                email: updatedUser.email,
                dp: updatedUser.dp,
              },
            });
            return { success: true };
          }

          const errorMsg = "Failed to update profile";
          set({ error: errorMsg });
          return { success: false, message: errorMsg };
        } catch (error) {
          set({ isUpdatingProfile: false });
          const errorMsg = "Network error occurred while updating profile";
          set({ error: errorMsg });
          return { success: false, message: errorMsg };
        }
      },

      logout: async () => {
        set({ isLoggingOut: true });

        // Clear refresh interval using helper function
        get().clearRefreshInterval();

        // Clear global auth store reference
        delete (window as any).__authStore;

        console.log("🚪 User logged out - clearing auth state");
        set({
          authenticated: false,
          user: null,
          token: null,
          lastTokenRefresh: 0,
          isLoggingOut: false,
          error: null,
        });
      },

      // New: Fetch bank details
      fetchBankDetails: async () => {
        const state = get();
        if (!state.user?.id || !state.token) {
          console.log(
            "❌ Cannot fetch bank details - missing user ID or token"
          );
          return { success: false, message: "Not authenticated" };
        }

        try {
          console.log("📡 Fetching bank details for user:", state.user.id);
          const { data, error } = await graphqlRequest(
            BANK_DETAILS_QUERY,
            { user_id: state.user.id },
            state.token
          );

          if (error) {
            console.error("❌ Failed to fetch bank details:", error);
            return { success: false, message: error };
          }

          const bankDetails = data?.whatsub_bank_account_details?.[0] || null;
          console.log(
            "✅ Bank details fetched:",
            bankDetails ? "Exists" : "Not found"
          );
          return { success: true, data: bankDetails };
        } catch (error) {
          console.error("❌ Error fetching bank details:", error);
          return { success: false, message: "Network error" };
        }
      },

      // New: Update bank details (upsert)
      updateBankDetails: async (details: {
        bank_account_number: string;
        ifsc: string;
        account_name: string;
      }) => {
        const state = get();
        if (!state.user?.id || !state.token) {
          console.log(
            "❌ Cannot update bank details - missing user ID or token"
          );
          return { success: false, message: "Not authenticated" };
        }

        try {
          console.log("📡 Updating bank details for user:", state.user.id);
          const { data, error } = await graphqlRequest(
            UPSERT_BANK_DETAILS,
            {
              user_id: state.user.id,
              bank_account_number: details.bank_account_number,
              ifsc: details.ifsc,
              account_name: details.account_name,
            },
            state.token
          );

          if (error) {
            console.error("❌ Failed to update bank details:", error);
            return { success: false, message: error };
          }

          console.log("✅ Bank details updated successfully");
          return {
            success: true,
            data: data?.insert_whatsub_bank_account_details_one,
          };
        } catch (error) {
          console.error("❌ Error updating bank details:", error);
          return { success: false, message: "Network error" };
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        authenticated: state.authenticated,
        lastTokenRefresh: state.lastTokenRefresh,
      }),
    }
  )
);

export default useAuthStore;
