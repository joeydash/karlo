import { UAParser } from "ua-parser-js";
import { v4 as uuidv4 } from "uuid";

/**
 * Generate a unique device ID for this browser/device
 * Uses localStorage to persist the ID across sessions
 */
export function getDeviceId(): string {
  const deviceId = localStorage.getItem("passkey_device_id");
  if (!deviceId) {
    const newDeviceId = uuidv4();
    localStorage.setItem("passkey_device_id", newDeviceId);
    return newDeviceId;
  }
  return deviceId;
}

/**
 * Get device information including browser, OS, and screen details
 */
export function getDeviceData(): Record<string, unknown> {
  const parser = new UAParser();
  const result = parser.getResult();

  return {
    browser: {
      name: result.browser.name || "Unknown",
      version: result.browser.version || "Unknown",
    },
    os: {
      name: result.os.name || "Unknown",
      version: result.os.version || "Unknown",
    },
    device: {
      type: result.device.type || "desktop",
      vendor: result.device.vendor || "Unknown",
      model: result.device.model || "Unknown",
    },
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      pixelRatio: window.devicePixelRatio,
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    userAgent: navigator.userAgent,
  };
}
