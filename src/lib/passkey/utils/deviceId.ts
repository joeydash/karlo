// Device ID management using UUID
import { v4 as uuidv4 } from "uuid";

const DEVICE_ID_KEY = "passkey_device_id";

/**
 * Validate if a string is a valid UUID v4
 */
function isValidUUID(str: string): boolean {
  const uuidV4Regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(str);
}

/**
 * Get or create a unique device identifier
 * Persisted in localStorage
 */
export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  // If no device ID exists or it's not a valid UUID, generate a new one
  if (!deviceId || !isValidUUID(deviceId)) {
    if (deviceId) {
      console.log(
        "[DeviceId] Found invalid device ID (not UUID), regenerating:",
        deviceId
      );
    }
    deviceId = uuidv4();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    console.log("[DeviceId] Generated new device ID:", deviceId);
  }

  return deviceId;
}

/**
 * Clear the device ID (useful for testing)
 */
export function clearDeviceId(): void {
  localStorage.removeItem(DEVICE_ID_KEY);
}
