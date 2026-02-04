/**
 * BANGLADESH TIME AUTHORITY
 * Single source of truth for all system time operations
 * 
 * CRITICAL: All time operations MUST use these utilities
 * Raw new Date() is DEPRECATED and FORBIDDEN
 * 
 * Timezone: Asia/Dhaka (UTC+06:00)
 * Applies to: Server, Client, Database, Logs, Automation
 */

const BD_TIMEZONE = "Asia/Dhaka";

/**
 * Get current time (no manual offset)
 * MANDATORY: Use this instead of new Date()
 * 
 * @returns Date object (actual current time)
 */
export function nowBD(): Date {
  return new Date();
}

/**
 * Get current Bangladesh time as ISO string
 * MANDATORY: Use this for database storage and API responses
 * 
 * @returns ISO 8601 string in Bangladesh timezone
 */
export function nowBDISO(): string {
  return nowBD().toISOString();
}

/**
 * Get current Bangladesh time as Unix timestamp (milliseconds)
 * MANDATORY: Use this for countdowns and time calculations
 * 
 * @returns Unix timestamp in milliseconds
 */
export function nowBDTimestamp(): number {
  return nowBD().getTime();
}

/**
 * Format Bangladesh time for display
 * Uses Asia/Dhaka timezone conversion exactly once
 */
export function formatBDTime(date: Date = nowBD()): string {
  return date.toLocaleString("en-US", {
    timeZone: BD_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
}

/**
 * Get current hour in Bangladesh timezone (0-23)
 * Used for theme automation
 */
export function getCurrentBDHour(): number {
  const bdTimeString = new Date().toLocaleString("en-US", {
    timeZone: BD_TIMEZONE,
    hour: "2-digit",
    hour12: false
  });
  return parseInt(bdTimeString, 10);
}

/**
 * Determine if it's daytime in Bangladesh (6 AM - 6 PM)
 * Used for theme automation
 */
export function isDaytimeBD(): boolean {
  const hour = getCurrentBDHour();
  return hour >= 6 && hour < 18;
}

/**
 * Get theme based on Bangladesh time
 * Day: 6 AM - 6 PM → light
 * Night: 6 PM - 6 AM → dark
 */
export function getThemeByBDTime(): "light" | "dark" {
  return isDaytimeBD() ? "light" : "dark";
}