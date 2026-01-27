/**
 * MEMBERSHIP TYPES - TYPE DEFINITIONS ONLY
 * Used across the application for membership-related operations
 */

export type MembershipStatus = "PENDING" | "ACTIVE" | "EXPIRED" | "SUSPENDED";

export type MembershipPlan = "ANNUAL";

export interface Membership {
  userId: string;
  plan: MembershipPlan;
  status: MembershipStatus;
  startDate: string; // ISO 8601 format
  endDate: string; // ISO 8601 format
  paymentId?: string;
  lastPaymentConfirmedAt?: string; // ISO 8601 format
  createdAt: string;
  updatedAt: string;
}

/**
 * Utility function to check if a membership is currently active
 * @param endDateIso - ISO 8601 date string (e.g., "2025-01-21T00:00:00Z")
 * @returns true if the membership end date is in the future
 */
export function isMembershipActive(endDateIso: string): boolean {
  const endDate = new Date(endDateIso);
  const now = new Date();
  return endDate > now;
}