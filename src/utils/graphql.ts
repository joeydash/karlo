import { AUTH_CONFIG } from './config';
import useAuthStore from '../stores/authStore';

// Network retry configuration
const NETWORK_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  TIMEOUT: 15000, // 15 seconds
};

// Helper to create a timeout promise
const createTimeoutPromise = (timeout: number) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeout);
  });
};

// Helper to add retry logic to fetch requests
const fetchWithRetry = async (url: string, options: RequestInit, retries: number = NETWORK_CONFIG.MAX_RETRIES): Promise<Response> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      
      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(url, options),
        createTimeoutPromise(NETWORK_CONFIG.TIMEOUT)
      ]) as Response;
      
      // If we get a response, return it (even if it's an error status)
      return response;
    } catch (error) {
      console.error(`❌ GraphQL request attempt ${attempt} failed:`, error);
      
      // If this was the last attempt, throw the error
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = NETWORK_CONFIG.RETRY_DELAY * attempt;
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('All retry attempts failed');
};
interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    extensions?: any;
  }>;
}

export async function graphqlRequest<T = any>(
  query: string,
  variables: Record<string, any> = {},
  customToken?: string
): Promise<{ data: T | null; error: string | null }> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Use custom token if provided, otherwise get from auth store
    let token = customToken;
    if (!token) {
      const authState = useAuthStore.getState();
      token = authState.token;
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetchWithRetry(AUTH_CONFIG.GRAPHQL_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      // Handle 401 Unauthorized - token might be expired
      if (response.status === 401 && !customToken) {
       console.log('🔒 Received 401 Unauthorized - attempting token refresh');
        const authState = useAuthStore.getState();
        if (authState.authenticated && authState.user?.refresh_token) {
          // Try to refresh token
         console.log('🔄 Attempting to refresh token and retry request');
          await authState.refreshTokenWithRetry();
          // Retry the request with new token
          const newToken = useAuthStore.getState().token;
          if (newToken && newToken !== token) {
           console.log('✅ Token refreshed successfully, retrying original request');
            return graphqlRequest(query, variables, newToken);
         } else {
           console.log('❌ Token refresh failed or returned same token');
          }
       } else {
         console.log('❌ Cannot refresh token - user not authenticated or no refresh token');
        }
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: GraphQLResponse<T> = await response.json();

    if (result.errors && result.errors.length > 0) {
      return {
        data: null,
        error: result.errors[0].message,
      };
    }

    return {
      data: result.data || null,
      error: null,
    };
  } catch (error) {
    console.error('GraphQL request failed:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

// GraphQL Mutations
export const MUTATIONS = {
  REGISTER: `
    mutation Register($phone: String!) {
      registerWithoutPasswordV2(credentials: {phone: $phone}) {
        request_id
        status
      }
    }
  `,
  VERIFY_OTP: `
    mutation VerifyOTP($phone1: String!, $otp1: String!) {
      verifyOTPV2(request: {otp: $otp1, phone: $phone1}) {
        auth_token
        refresh_token
        id
        status
      }
    }
  `,
  REFRESH_TOKEN: `
    mutation RefreshToken($refresh_token: String!, $user_id: uuid!) {
      refreshToken(request: {refresh_token: $refresh_token, user_id: $user_id}) {
        auth_token
        refresh_token
      }
    }
  `,
  LOGOUT: `
    mutation Logout($refresh_token: String!, $user_id: uuid!) {
      logout(request: {refresh_token: $refresh_token, user_id: $user_id}) {
        message
      }
    }
  `,
  UPDATE_PROFILE: `
    mutation UpdateProfile($id: uuid!, $fullname: String, $email: String, $dp: String) {
      update_auth(where: {id: {_eq: $id}}, _set: {fullname: $fullname, email: $email, dp: $dp}) {
        affected_rows
        returning {
          id
          fullname
          email
          dp
        }
      }
    }
  `,
};