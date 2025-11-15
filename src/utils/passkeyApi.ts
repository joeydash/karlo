import { GraphQLClient } from "graphql-request";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import {
  GENERATE_AUTHENTICATION_OPTIONS,
  VERIFY_AUTHENTICATION,
  GENERATE_REGISTRATION_OPTIONS,
  VERIFY_REGISTRATION,
  LIST_PASSKEY_DEVICES,
  DELETE_PASSKEY_DEVICE,
  type AuthCredentialInput,
  type RegCredentialInput,
  type PasskeyDevice,
} from "./passkeyQueries";
import { getRecaptchaToken } from "./recaptcha";
import { getDeviceId } from "./deviceInfo";

const GRAPHQL_ENDPOINT = "https://db.subspace.money/v1/graphql";

/**
 * Get the current origin for passkey validation
 */
function getCurrentOrigin(): string {
  return window.location.origin;
}

/**
 * Passkey API client for WebAuthn operations
 */
class PasskeyApi {
  private client: GraphQLClient;

  constructor() {
    this.client = new GraphQLClient(GRAPHQL_ENDPOINT);
  }

  /**
   * Set authentication token for authenticated requests
   */
  setAuthToken(token: string) {
    this.client.setHeader("Authorization", `Bearer ${token}`);
  }

  /**
   * Create authenticated client with token
   */
  private createAuthenticatedClient(token: string): GraphQLClient {
    return new GraphQLClient(GRAPHQL_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * Check if a user has registered passkeys
   */
  async checkPasskeyAvailability(
    phone: string
  ): Promise<{ hasPasskey: boolean }> {
    try {
      const recaptchaToken = await getRecaptchaToken("check_passkey");
      const deviceId = getDeviceId();
      const response = await this.client.request<{
        generateAuthenticationOptions: {
          challenge: string;
          allowCredentials: unknown[];
        };
      }>(GENERATE_AUTHENTICATION_OPTIONS, {
        phone,
        recaptcha_token: recaptchaToken,
        device_id: deviceId,
        origin: getCurrentOrigin(),
      });

      const hasPasskey =
        response.generateAuthenticationOptions.allowCredentials.length > 0;
      return { hasPasskey };
    } catch (error) {
      console.error("Error checking passkey availability:", error);
      return { hasPasskey: false };
    }
  }

  /**
   * Login with passkey
   */
  async loginWithPasskey(phone: string): Promise<{
    auth_token: string;
    refresh_token: string;
    id: string;
  }> {
    try {
      // Step 1: Generate authentication options
      const recaptchaToken = await getRecaptchaToken("passkey_login");
      const deviceId = getDeviceId();
      const optionsResponse = await this.client.request<{
        generateAuthenticationOptions: {
          challenge: string;
          rpId: string;
          allowCredentials: Array<{
            type: "public-key";
            id: string;
            transports: string[];
          }>;
          userVerification: string;
          timeout: number;
        };
      }>(GENERATE_AUTHENTICATION_OPTIONS, {
        phone,
        recaptcha_token: recaptchaToken,
        device_id: deviceId,
        device_data: null,
        origin: getCurrentOrigin(),
      });

      const options = optionsResponse.generateAuthenticationOptions;

      // Step 2: Start WebAuthn authentication
      const credential = await startAuthentication({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        optionsJSON: options as any,
      });

      // Step 3: Verify authentication
      const verifyResponse = await this.client.request<{
        verifyAuthentication: {
          status: string;
          auth_token: string;
          refresh_token: string;
          id: string;
        };
      }>(VERIFY_AUTHENTICATION, {
        phone,
        credential: credential as AuthCredentialInput,
        recaptcha_token: recaptchaToken,
        device_id: deviceId,
        device_data: null,
        lang: "en",
        version: 1,
        origin: getCurrentOrigin(),
      });

      return verifyResponse.verifyAuthentication;
    } catch (error) {
      console.error("Error during passkey login:", error);
      throw error;
    }
  }

  /**
   * Register a new passkey device
   */
  async registerPasskey(
    userId: string,
    deviceName: string,
    authToken?: string
  ): Promise<{ verified: boolean; message: string }> {
    try {
      const deviceId = getDeviceId();

      // Use authenticated client if token provided
      if (!authToken) {
        throw new Error(
          "Authentication token is required for passkey registration"
        );
      }

      const client = this.createAuthenticatedClient(authToken);

      // Step 1: Generate registration options
      console.log(
        "[PasskeyApi] Requesting registration options for user:",
        userId
      );
      const optionsResponse = await client.request<{
        generateRegistrationOptions: {
          challenge: string;
          rp: { name: string; id: string };
          user: { id: string; name: string; displayName: string };
          pubKeyCredParams: Array<{ type: string; alg: number }>;
          authenticatorSelection: {
            authenticatorAttachment?: string;
            requireResidentKey: boolean;
            residentKey: string;
            userVerification: string;
          };
          excludeCredentials: Array<{
            type: string;
            id: string;
            transports?: string[];
          }>;
          attestation: string;
          timeout: number;
        };
      }>(GENERATE_REGISTRATION_OPTIONS, {
        user_id: userId,
        device_id: deviceId,
        device_data: null,
        device_name: deviceName,
        origin: getCurrentOrigin(),
      });

      const options = optionsResponse.generateRegistrationOptions;

      // Step 2: Start WebAuthn registration
      const credential = await startRegistration({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        optionsJSON: options as any,
      });

      // Step 3: Verify registration
      const verifyResponse = await client.request<{
        verifyRegistration: {
          verified: boolean;
          message: string;
        };
      }>(VERIFY_REGISTRATION, {
        user_id: userId,
        credential: credential as RegCredentialInput,
        device_id: deviceId,
        device_data: null,
        device_name: deviceName,
        origin: getCurrentOrigin(),
      });

      return verifyResponse.verifyRegistration;
    } catch (error: any) {
      console.error("Error during passkey registration:", error);

      // Check if it's a GraphQL schema error (mutation not found)
      if (error.response?.errors?.[0]?.message?.includes("not found in type")) {
        throw new Error(
          "Passkey registration is not configured on the backend. " +
            "Please ensure the Hasura Actions 'generateRegistrationOptions' and 'verifyRegistration' are set up. " +
            "Contact your administrator."
        );
      }

      // Handle browser errors
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          throw new Error("Passkey registration was cancelled");
        }
        if (error.name === "InvalidStateError") {
          throw new Error("This passkey is already registered");
        }
        if (error.name === "SecurityError") {
          throw new Error(
            "Security error: Make sure you are on a secure connection (HTTPS)"
          );
        }
      }

      throw error;
    }
  }

  /**
   * List all passkey devices for a user
   */
  async listPasskeyDevices(userId: string): Promise<PasskeyDevice[]> {
    try {
      const response = await this.client.request<{
        passkey_authenticators: PasskeyDevice[];
      }>(LIST_PASSKEY_DEVICES, {
        user_id: userId,
      });

      return response.passkey_authenticators;
    } catch (error) {
      console.error("Error listing passkey devices:", error);
      throw error;
    }
  }

  /**
   * Delete a specific passkey device
   */
  async deletePasskeyDevice(
    userId: string,
    deviceId: string
  ): Promise<{ status: string; deleted_count: number; message: string }> {
    try {
      const response = await this.client.request<{
        deletePasskey: {
          status: string;
          deleted_count: number;
          message: string;
        };
      }>(DELETE_PASSKEY_DEVICE, {
        user_id: userId,
        device_id: deviceId,
      });

      return response.deletePasskey;
    } catch (error) {
      console.error("Error deleting passkey device:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const passkeyApi = new PasskeyApi();
