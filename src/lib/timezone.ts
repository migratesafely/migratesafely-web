/**
 * System Timezone Configuration
 * CRITICAL: Application is fixed to Bangladesh time (Asia/Dhaka UTC+6)
 * DO NOT use browser/device timezone
 * DO NOT auto-detect location
 * 
 * ⚠️ DEPRECATED: This file is deprecated
 * ⚠️ USE: src/lib/bdTime.ts instead
 * ⚠️ Migration in progress - do not add new code here
 */

export const SYSTEM_TIMEZONE = "Asia/Dhaka";
export const SYSTEM_UTC_OFFSET = 6;

/**
 * Get current time in Bangladesh timezone
 */
export function getCurrentBangladeshTime(): Date {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const bangladeshTime = new Date(utc + (3600000 * SYSTEM_UTC_OFFSET));
  return bangladeshTime;
}

/**
 * Get current hour in Bangladesh timezone (0-23)
 */
export function getCurrentBangladeshHour(): number {
  return getCurrentBangladeshTime().getHours();
}

/**
 * Determine if it's daytime in Bangladesh (6 AM - 6 PM)
 */
export function isDaytimeInBangladesh(): boolean {
  const hour = getCurrentBangladeshHour();
  return hour >= 6 && hour < 18;
}

/**
 * Get theme based on Bangladesh time
 * Day: 6 AM - 6 PM → light
 * Night: 6 PM - 6 AM → dark
 */
export function getThemeByBangladeshTime(): "light" | "dark" {
  return isDaytimeInBangladesh() ? "light" : "dark";
}

/**
 * Format timestamp for Bangladesh timezone
 */
export function formatBangladeshTimestamp(date: Date = new Date()): string {
  return date.toLocaleString("en-US", {
    timeZone: SYSTEM_TIMEZONE,
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
 * Get ISO string for Bangladesh timezone
 */
export function getBangladeshISOString(date: Date = new Date()): string {
  const bangladeshTime = getCurrentBangladeshTime();
  return bangladeshTime.toISOString();
}