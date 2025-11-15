/**
 * Recent login entry structure
 */
export interface RecentLogin {
  phone: string;
  phoneCode: string;
  lastLogin: string; // ISO date string
  userName?: string; // User's full name (not phone)
}

const STORAGE_KEY = "recent_logins";
const MAX_RECENT_LOGINS = 3;

/**
 * Get all recent logins from localStorage
 */
export function getRecentLogins(): RecentLogin[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const logins: RecentLogin[] = JSON.parse(stored);
    // Sort by most recent first
    return logins.sort(
      (a, b) =>
        new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime()
    );
  } catch (error) {
    console.error("Error reading recent logins:", error);
    return [];
  }
}

/**
 * Add a new login to recent logins
 */
export function addRecentLogin(
  phone: string,
  phoneCode: string,
  userName?: string
): void {
  try {
    let logins = getRecentLogins();

    // Remove existing entry if present
    logins = logins.filter(
      (login) => !(login.phone === phone && login.phoneCode === phoneCode)
    );

    // Add new entry at the beginning
    logins.unshift({
      phone,
      phoneCode,
      lastLogin: new Date().toISOString(),
      userName,
    });

    // Keep only the most recent entries
    logins = logins.slice(0, MAX_RECENT_LOGINS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(logins));
  } catch (error) {
    console.error("Error adding recent login:", error);
  }
}

/**
 * Remove a specific login from recent logins
 */
export function removeRecentLogin(phone: string, phoneCode: string): void {
  try {
    let logins = getRecentLogins();
    logins = logins.filter(
      (login) => !(login.phone === phone && login.phoneCode === phoneCode)
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logins));
  } catch (error) {
    console.error("Error removing recent login:", error);
  }
}

/**
 * Clear all recent logins
 */
export function clearRecentLogins(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing recent logins:", error);
  }
}

/**
 * Check if a login is already saved
 */
export function isLoginSaved(phone: string, phoneCode: string): boolean {
  const logins = getRecentLogins();
  return logins.some(
    (login) => login.phone === phone && login.phoneCode === phoneCode
  );
}
