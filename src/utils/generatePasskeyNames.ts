import { UAParser } from "ua-parser-js";

/**
 * Generate a friendly passkey device name based on browser and OS
 * @returns A human-readable device name like "Chrome on Windows" or "Safari on iPhone"
 */
export function generatePasskeyName(): string {
  const parser = new UAParser();
  const result = parser.getResult();

  const browser = result.browser.name || "Unknown Browser";
  const os = result.os.name || "Unknown OS";

  return `${browser} on ${os}`;
}
