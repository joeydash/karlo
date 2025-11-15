// passkeyApi.ts - Main passkey API implementation

import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { GraphQLClient } from "graphql-request";
import { API_CONFIG } from "./config";
import {
  GENERATE_AUTHENTICATION_OPTIONS,
  VERIFY_AUTHENTICATION,
  GENERATE_REGISTRATION_OPTIONS,
  VERIFY_REGISTRATION,
  DELETE_PASSKEY,
  LIST_PASSKEY_DEVICES,
  DELETE_PASSKEY_DEVICE,
  type PasskeyDevice,
} from "./queries/passkeyQueries";

// Re-export types for convenience
export type { PasskeyDevice };

import { getDeviceId } from "./utils/deviceId";

export interface AuthenticationOptions {
  challenge: string;
  rpId: string;
  allowCredentials: Array<{
    type: "public-key";
    id: string;
    transports?: ("ble" | "hybrid" | "internal" | "nfc" | "usb")[];
  }>;
  userVerification: "preferred" | "required" | "discouraged";
  timeout: number;
}

export interface RegistrationOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: unknown[];
  authenticatorSelection: unknown;
  excludeCredentials?: unknown[];
  attestation?: string;
  timeout?: number;
}

export interface PasskeyLoginResponse {
  status: string;
  auth_token: string;
  refresh_token: string;
  id: string;
  deviceInfoSaved: boolean;
}

export interface PasskeyDeleteResponse {
  status: string;
  deleted_count: number;
  message: string;
}

class PasskeyApi {
  private graphqlClient: GraphQLClient;
  private recaptchaReady: boolean = false;
  private recaptchaLoadPromise: Promise<void> | null = null;

  constructor() {
    this.graphqlClient = new GraphQLClient(API_CONFIG.PASSKEY_ENDPOINT, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(
      `[PasskeyApi] Using GraphQL endpoint: ${API_CONFIG.PASSKEY_ENDPOINT}`
    );
    this.initRecaptcha();
  }

  private initRecaptcha(): void {
    // Check if reCAPTCHA script is already loaded
    if (window.grecaptcha) {
      this.recaptchaLoadPromise = new Promise((resolve) => {
        window.grecaptcha.ready(() => {
          this.recaptchaReady = true;
          console.log("[PasskeyApi] reCAPTCHA is ready");
          resolve();
        });
      });
    } else {
      // Wait for script to load
      this.recaptchaLoadPromise = new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (window.grecaptcha) {
            clearInterval(checkInterval);
            window.grecaptcha.ready(() => {
              this.recaptchaReady = true;
              console.log("[PasskeyApi] reCAPTCHA loaded and ready");
              resolve();
            });
          }
        }, 100);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!this.recaptchaReady) {
            console.error(
              "[PasskeyApi] reCAPTCHA failed to load within 10 seconds"
            );
            reject(new Error("reCAPTCHA failed to load"));
          }
        }, API_CONFIG.RECAPTCHA_TIMEOUT);
      });
    }
  }

  private async ensureRecaptchaReady(): Promise<void> {
    if (this.recaptchaReady) return;

    if (this.recaptchaLoadPromise) {
      await this.recaptchaLoadPromise;
    } else {
      throw new Error("reCAPTCHA is not initialized");
    }
  }

  private createAuthenticatedClient(authToken: string): GraphQLClient {
    console.log(
      "[PasskeyApi] Creating authenticated client with token:",
      authToken.substring(0, 20) + "..."
    );
    console.log("[PasskeyApi] Endpoint:", API_CONFIG.PASSKEY_ENDPOINT);

    const client = new GraphQLClient(API_CONFIG.PASSKEY_ENDPOINT, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    return client;
  }

  private getCurrentOrigin(): string {
    return window.location.origin;
  }

  private getRpId(): string {
    // Return just the hostname without protocol for rp_id matching
    return window.location.hostname;
  }

  // ============================================================================
  // LOGIN: Check if passkeys exist for a phone number (unauthenticated)
  // ============================================================================

  private async getRecaptchaToken(action: string): Promise<string> {
    try {
      // Ensure reCAPTCHA is ready
      await this.ensureRecaptchaReady();

      if (!window.grecaptcha) {
        throw new Error("reCAPTCHA not loaded. Please refresh the page.");
      }

      console.log(`[PasskeyApi] Getting reCAPTCHA token for action: ${action}`);

      return new Promise((resolve, reject) => {
        window.grecaptcha.ready(() => {
          const siteKey = API_CONFIG.RECAPTCHA_SITE_KEY;

          if (!siteKey) {
            reject(new Error("reCAPTCHA site key not configured"));
            return;
          }

          console.log(
            `[PasskeyApi] Executing reCAPTCHA with site key: ${siteKey.substring(
              0,
              10
            )}...`
          );

          window.grecaptcha
            .execute(siteKey, { action })
            .then((token) => {
              console.log(
                `[PasskeyApi] reCAPTCHA token obtained (length: ${token.length})`
              );
              resolve(token);
            })
            .catch((error) => {
              console.error("[PasskeyApi] reCAPTCHA execution failed:", error);
              reject(
                new Error(
                  "Security verification failed. Please refresh and try again."
                )
              );
            });
        });
      });
    } catch (error) {
      console.error("[PasskeyApi] Error getting reCAPTCHA token:", error);
      throw new Error(
        "Security verification not ready. Please refresh the page."
      );
    }
  }

  // Check if passkeys exist for a phone number
  async checkPasskeyAvailability(
    phone: string
  ): Promise<{ hasPasskey: boolean; options?: AuthenticationOptions }> {
    const deviceId = getDeviceId();
    console.log(`[PasskeyApi] checkPasskeyAvailability for phone:`, phone);

    try {
      // Get reCAPTCHA token
      const recaptchaToken = await this.getRecaptchaToken("passkey_check");
      const origin = this.getCurrentOrigin();

      const data: {
        generateAuthenticationOptions: AuthenticationOptions;
      } = await this.graphqlClient.request(GENERATE_AUTHENTICATION_OPTIONS, {
        phone,
        recaptcha_token: recaptchaToken,
        device_id: deviceId,
        origin,
      });

      const authOptions: AuthenticationOptions =
        data.generateAuthenticationOptions;

      return {
        hasPasskey:
          authOptions.allowCredentials &&
          authOptions.allowCredentials.length > 0,
        options: authOptions,
      };
    } catch (error: unknown) {
      console.error("[PasskeyApi] Error checking passkey availability:", error);

      // Handle "No passkey found" gracefully (expected for users without passkeys)

      // Handle reCAPTCHA errors specifically
      if (error instanceof Error) {
        if (
          error.message?.includes("reCAPTCHA") ||
          error.message?.includes("Security verification")
        ) {
          throw error; // Re-throw with original message
        }
      }

      const errorResponse = error as {
        response?: {
          errors?: Array<{
            extensions?: { code?: string };
            message?: string;
          }>;
          status?: number;
        };
        message?: string;
      };

      if (
        errorResponse.response?.errors?.[0]?.extensions?.code ===
        "RECAPTCHA_FAILED"
      ) {
        throw new Error(
          "Security verification failed. Please refresh and try again."
        );
      }

      // Handle "No passkey found" gracefully
      if (
        errorResponse.response?.errors?.[0]?.message?.includes("No passkey") ||
        errorResponse.response?.errors?.[0]?.message?.includes("not found") ||
        errorResponse.response?.status === 404
      ) {
        console.log(`[PasskeyApi] No passkeys found for phone ${phone}`);
        return { hasPasskey: false };
      }

      // Handle Hasura Action not configured error
      if (errorResponse.message?.includes("not found in type")) {
        console.error(
          '[PasskeyApi] CRITICAL: Hasura Action "generateAuthenticationOptions" is not configured!'
        );
        console.error(
          "[PasskeyApi] Please configure the action in Hasura Console → Actions"
        );
        throw new Error(
          "Passkey feature is not properly configured. Please contact support."
        );
      }

      // Handle network errors
      if (
        errorResponse.message?.includes("fetch") ||
        errorResponse.message?.includes("network")
      ) {
        console.error("[PasskeyApi] Network error - cannot reach Hasura");
        throw new Error(
          "Cannot connect to authentication service. Please check your connection."
        );
      }

      throw new Error(
        errorResponse.response?.errors?.[0]?.message ||
          errorResponse.message ||
          "Failed to check passkey availability"
      );
    }
  }

  // ============================================================================
  // LOGIN: Perform passkey login (unauthenticated)
  // ============================================================================
  async loginWithPasskey(
    phone: string,
    authOptions: AuthenticationOptions,
    deviceData?: {
      device_id?: string;
      device_data?: unknown;
      lang?: string;
      version?: number;
    }
  ): Promise<PasskeyLoginResponse> {
    const deviceId = getDeviceId();
    console.log(`[PasskeyApi] loginWithPasskey for phone:`, phone);

    try {
      // Step 1: Get credential from browser
      console.log("[PasskeyApi] Starting browser authentication...");
      const authResult = await startAuthentication({
        optionsJSON: authOptions,
      });
      console.log("[PasskeyApi] Browser authentication complete");

      // Step 2: Verify with backend
      const recaptchaToken = await this.getRecaptchaToken("passkey_login");
      const origin = this.getCurrentOrigin();

      console.log("[PasskeyApi] Verifying with backend...");
      const data: { verifyAuthentication: PasskeyLoginResponse } =
        await this.graphqlClient.request(VERIFY_AUTHENTICATION, {
          phone,
          credential: authResult,
          recaptcha_token: recaptchaToken,
          device_id: deviceId,
          device_data: deviceData?.device_data,
          lang: deviceData?.lang || "en",
          version: deviceData?.version || 1,
          origin,
        });

      const verificationData: PasskeyLoginResponse = data.verifyAuthentication;

      if (verificationData.status !== "success") {
        throw new Error("Passkey verification failed");
      }

      console.log("[PasskeyApi] ✅ Passkey login successful");
      return verificationData;
    } catch (error: unknown) {
      console.error("[PasskeyApi] Error during passkey login:", error);

      // Handle reCAPTCHA errors
      if (error instanceof Error) {
        if (
          error.message?.includes("reCAPTCHA") ||
          error.message?.includes("Security verification")
        ) {
          throw error;
        }

        // Handle browser errors
        if (error.name === "NotAllowedError") {
          throw new Error("Passkey authentication was cancelled");
        }
        if (error.name === "InvalidStateError") {
          throw new Error("Passkey is not registered or invalid");
        }
        if (error.name === "SecurityError") {
          throw new Error(
            "Security error: Make sure you are on a secure connection (HTTPS)"
          );
        }
      }

      const errorResponse = error as {
        response?: {
          errors?: Array<{
            extensions?: { code?: string };
            message?: string;
          }>;
        };
      };

      if (
        errorResponse.response?.errors?.[0]?.extensions?.code ===
        "RECAPTCHA_FAILED"
      ) {
        throw new Error(
          "Security verification failed. Please refresh and try again."
        );
      }

      // Handle backend errors
      if (errorResponse.response?.errors) {
        const errorMessage = errorResponse.response.errors[0]?.message;
        if (errorMessage?.includes("Challenge not found")) {
          throw new Error("Session expired. Please try again.");
        }
        throw new Error(errorMessage || "Passkey verification failed");
      }

      throw error;
    }
  }

  // ============================================================================
  // REGISTER: Register a new passkey (authenticated)
  // ============================================================================
  async registerPasskey(
    userId: string,
    authToken: string,
    deviceName?: string
  ): Promise<boolean> {
    try {
      const deviceId = getDeviceId();
      console.log("[PasskeyApi] Starting registration for user:", userId);

      // Create authenticated client
      const authenticatedClient = this.createAuthenticatedClient(authToken);

      // Step 1: Get registration options from backend
      console.log("[PasskeyApi] Requesting registration options...");
      const origin = this.getCurrentOrigin();

      console.log("[PasskeyApi] Registration request payload:", {
        user_id: userId,
        device_id: deviceId,
        device_name: deviceName,
        origin,
      });

      console.log(
        "[PasskeyApi] Auth token being used:",
        authToken.substring(0, 30) + "..."
      );
      console.log(
        "[PasskeyApi] Making request to:",
        API_CONFIG.PASSKEY_ENDPOINT
      );

      // Decode JWT to check claims (for debugging only, not enforcing)
      try {
        const tokenParts = authToken.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log("[PasskeyApi] JWT Claims:", payload);

          const hasuraClaims = payload["https://hasura.io/jwt/claims"];
          const userRole = hasuraClaims?.["x-hasura-default-role"];

          console.log("[PasskeyApi] User role:", userRole);

          if (!hasuraClaims) {
            console.warn(
              "[PasskeyApi] ⚠️ JWT token does not have Hasura claims - this is expected for some authentication systems"
            );
          }
        }
      } catch (e) {
        console.warn("[PasskeyApi] Could not decode JWT:", e);
      }

      let optionsData: { generateRegistrationOptions: RegistrationOptions };

      try {
        optionsData = await authenticatedClient.request(
          GENERATE_REGISTRATION_OPTIONS,
          {
            user_id: userId,
            device_id: deviceId,
            device_name: deviceName,
            origin,
          }
        );
        console.log("[PasskeyApi] Registration options received");
      } catch (requestError: unknown) {
        console.error("[PasskeyApi] Request failed with error:", requestError);
        console.error(
          "[PasskeyApi] Error details:",
          JSON.stringify(requestError, null, 2)
        );

        const err = requestError as {
          response?: {
            errors?: Array<{
              message?: string;
              extensions?: { code?: string };
            }>;
          };
        };
        if (err.response?.errors?.[0]) {
          const error = err.response.errors[0];
          console.error("[PasskeyApi] GraphQL Error:", error.message);
          console.error("[PasskeyApi] Error Code:", error.extensions?.code);

          if (error.message?.includes("not found in type")) {
            console.error(
              "[PasskeyApi] ❌ CRITICAL: The Hasura Action 'generateRegistrationOptions' is not configured in this Hasura instance!"
            );
            console.error("[PasskeyApi] Please check:");
            console.error(
              "[PasskeyApi] 1. Is the Hasura Action configured in the console?"
            );
            console.error(
              "[PasskeyApi] 2. Does your JWT role have permission to execute this action?"
            );
            console.error(
              "[PasskeyApi] 3. Is the action enabled for your environment?"
            );
          }
        }

        throw requestError;
      }

      // FIX: assign registrationOptions from response
      const registrationOptions = optionsData.generateRegistrationOptions;

      console.log("[PasskeyApi] Starting browser registration...");
      const registrationResult = await startRegistration({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        optionsJSON: registrationOptions as any,
      });
      console.log("[PasskeyApi] Browser registration complete");

      // Step 3: Verify registration with backend
      console.log("[PasskeyApi] Sending verification request...");

      try {
        // When verifying registration, also send device_name if needed by backend
        const verificationData: {
          verifyRegistration: { verified: boolean; message?: string };
        } = await authenticatedClient.request(VERIFY_REGISTRATION, {
          user_id: userId,
          credential: registrationResult,
          device_id: deviceId,
          device_name: deviceName,
          origin,
        });

        console.log("[PasskeyApi] Verification response:", verificationData);

        const result = verificationData.verifyRegistration;

        if (result.verified === true) {
          console.log("[PasskeyApi] ✅ Passkey registration successful");
          return true;
        }

        throw new Error(result.message || "Verification failed");
      } catch (verificationError: unknown) {
        // Better handling for webhook errors
        const errorObj = verificationError as {
          message?: string;
          response?: unknown;
          request?: unknown;
        };

        console.error("[PasskeyApi] Verification error details:", {
          message: errorObj.message,
          response: errorObj.response,
          request: errorObj.request,
        });

        // Check if it's the specific webhook JSON error
        if (
          errorObj.message?.includes("not a valid json response from webhook")
        ) {
          throw new Error(
            "Backend service temporarily unavailable. Please try again later or contact support."
          );
        }

        const errorResponse = verificationError as {
          response?: {
            errors?: Array<{
              extensions?: { code?: string };
            }>;
          };
        };

        // Check for other webhook/Hasura errors
        if (
          errorResponse.response?.errors?.[0]?.extensions?.code === "unexpected"
        ) {
          throw new Error(
            "Server configuration error. Please contact support with error code: WEBHOOK_ERROR"
          );
        }

        // Re-throw with original message
        throw verificationError;
      }
    } catch (error: unknown) {
      console.error("[PasskeyApi] Error during passkey registration:", error);

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

      const errorResponse = error as {
        response?: {
          errors?: Array<{ message?: string }>;
        };
      };

      // Handle backend errors
      if (errorResponse.response?.errors) {
        const errorMessage = errorResponse.response.errors[0]?.message;
        if (errorMessage?.includes("Challenge not found")) {
          throw new Error("Session expired. Please try again.");
        }
        throw new Error(errorMessage || "Passkey registration failed");
      }

      throw error;
    }
  }

  // ============================================================================
  // DELETE: Delete a passkey (authenticated)
  // ============================================================================
  async deletePasskey(
    userId: string,
    authToken: string
  ): Promise<PasskeyDeleteResponse> {
    console.log("[PasskeyApi] Deleting ALL passkeys for user:", userId);
    try {
      const authenticatedClient = this.createAuthenticatedClient(authToken);
      const data: { deletePasskey: PasskeyDeleteResponse } =
        await authenticatedClient.request(
          DELETE_PASSKEY,
          { user_id: userId } // do NOT send device_id
        );
      const result: PasskeyDeleteResponse = data.deletePasskey;
      if (result.status !== "success") {
        throw new Error(result.message || "Failed to delete passkey");
      }
      return result;
    } catch (error: unknown) {
      console.error("[PasskeyApi] Error deleting passkey:", error);

      const errorResponse = error as {
        response?: {
          errors?: Array<{ message?: string }>;
        };
      };

      // Handle backend errors
      if (errorResponse.response?.errors) {
        const errorMessage = errorResponse.response.errors[0]?.message;
        if (errorMessage?.includes("not found")) {
          throw new Error("Passkey not found or already deleted");
        }
        throw new Error(errorMessage || "Failed to delete passkey");
      }

      throw error;
    }
  }

  // ============================================================================
  // LIST DEVICES: Get all passkey devices for a user (authenticated)
  // ============================================================================
  async listPasskeyDevices(
    userId: string,
    authToken: string
  ): Promise<PasskeyDevice[]> {
    console.log("[PasskeyApi] Listing passkey devices for user:", userId);

    try {
      const authenticatedClient = this.createAuthenticatedClient(authToken);
      const rpId = this.getRpId(); // Use hostname only (without https://)

      const data: { passkey_authenticators: PasskeyDevice[] } =
        await authenticatedClient.request(LIST_PASSKEY_DEVICES, {
          user_id: userId,
          rp_id: rpId,
        });

      return data.passkey_authenticators || [];
    } catch (error: unknown) {
      console.error("[PasskeyApi] Error listing passkey devices:", error);
      const errorResponse = error as {
        response?: {
          errors?: Array<{ message?: string }>;
        };
      };
      throw new Error(
        errorResponse.response?.errors?.[0]?.message ||
          "Failed to list passkey devices"
      );
    }
  }

  // ============================================================================
  // DELETE DEVICE: Delete a specific passkey device (authenticated)
  // ============================================================================
  async deletePasskeyDevice(
    userId: string,
    deviceId: string,
    authToken: string
  ): Promise<boolean> {
    console.log(
      "[PasskeyApi] Deleting passkey device:",
      deviceId,
      "for user:",
      userId
    );

    try {
      const authenticatedClient = this.createAuthenticatedClient(authToken);

      const data: { deletePasskey: PasskeyDeleteResponse } =
        await authenticatedClient.request(DELETE_PASSKEY_DEVICE, {
          user_id: userId,
          device_id: deviceId,
        });

      const result = data.deletePasskey;
      if (result.status !== "success" || result.deleted_count === 0) {
        throw new Error(
          result.message || "Device not found or already deleted"
        );
      }

      console.log("[PasskeyApi] ✅ Device deleted successfully");
      return true;
    } catch (error: unknown) {
      console.error("[PasskeyApi] Error deleting passkey device:", error);
      const errorResponse = error as {
        response?: {
          errors?: Array<{ message?: string }>;
        };
      };
      throw new Error(
        errorResponse.response?.errors?.[0]?.message ||
          "Failed to delete device"
      );
    }
  }
}

export default new PasskeyApi();
