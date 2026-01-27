/**
 * COUNTRY SETTINGS TYPES
 * Type definitions for country-specific configuration
 */

/**
 * ISO 3166-1 alpha-2 country code
 * Examples: "US", "GB", "ZA", "NG"
 */
export type CountryCode = string;

/**
 * ISO 4217 currency code
 * Examples: "USD", "GBP", "ZAR", "NGN"
 */
export type CurrencyCode = string;

/**
 * Country-specific settings for membership and payments
 */
export interface CountrySettings {
  /** ISO 3166-1 alpha-2 country code */
  countryCode: string;
  
  /** Full country name */
  countryName: string;
  
  /** ISO 4217 currency code */
  currencyCode: string;
  
  /** Currency symbol for display */
  currencySymbol: string;
  
  /** Membership fee amount in local currency */
  membershipFeeAmount: number;
  
  /** Whether this country is active for new registrations */
  isActive: boolean;
  
  /** Payment gateway provider for this country (e.g., "paystack", "stripe") */
  paymentGatewayProvider?: string;
  
  /** Admin user ID who last updated these settings */
  updatedByAdminId?: string;
  
  /** Timestamp of last update */
  updatedAt?: string;
}