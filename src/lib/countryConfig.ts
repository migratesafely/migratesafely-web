/**
 * PROMPT 0.9 — COUNTRY & CURRENCY LOCK (BANGLADESH ONLY)
 * 
 * This deployment is EXCLUSIVELY for Bangladesh.
 * 
 * Country: Bangladesh (BD)
 * Currency: BDT (Bangladeshi Taka)
 * Symbol: ৳
 * 
 * Multi-country features are DISABLED in this instance.
 * Future countries must be launched as SEPARATE INSTANCES.
 */

export const DEPLOYMENT_CONFIG = {
  // Country Lock
  COUNTRY_CODE: "BD" as const,
  COUNTRY_NAME: "Bangladesh" as const,
  IS_MULTI_COUNTRY: false as const,
  
  // Currency Lock
  CURRENCY_CODE: "BDT" as const,
  CURRENCY_SYMBOL: "৳" as const,
  CURRENCY_NAME: "Bangladeshi Taka" as const,
  
  // Supported Languages
  SUPPORTED_LANGUAGES: ["en", "bn"] as const,
  DEFAULT_LANGUAGE: "en" as const,
  
  // Feature Flags
  ALLOW_COUNTRY_SELECTION: false as const,
  ALLOW_CURRENCY_CONVERSION: false as const,
  SHOW_MULTI_COUNTRY_UI: false as const,
} as const;

/**
 * Format currency for Bangladesh deployment
 */
export function formatBDT(amount: number): string {
  return `৳${amount.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format currency with locale support
 */
export function formatCurrency(
  amount: number,
  locale: "en" | "bn" = "en"
): string {
  const localeCode = locale === "bn" ? "bn-BD" : "en-BD";
  return `৳${amount.toLocaleString(localeCode, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Parse BDT amount from string
 */
export function parseBDT(value: string): number {
  // Remove currency symbol and commas
  const cleaned = value.replace(/৳|,/g, "").trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Validate that currency is BDT
 */
export function isBDT(currencyCode: string): boolean {
  return currencyCode === "BDT";
}

/**
 * Get deployment info (for admin display)
 */
export function getDeploymentInfo() {
  return {
    country: DEPLOYMENT_CONFIG.COUNTRY_NAME,
    countryCode: DEPLOYMENT_CONFIG.COUNTRY_CODE,
    currency: DEPLOYMENT_CONFIG.CURRENCY_NAME,
    currencyCode: DEPLOYMENT_CONFIG.CURRENCY_CODE,
    currencySymbol: DEPLOYMENT_CONFIG.CURRENCY_SYMBOL,
    isMultiCountry: DEPLOYMENT_CONFIG.IS_MULTI_COUNTRY,
    supportedLanguages: DEPLOYMENT_CONFIG.SUPPORTED_LANGUAGES,
  };
}

/**
 * Governance: Only Super Admin can modify country/currency settings
 */
export const COUNTRY_GOVERNANCE = {
  CAN_CHANGE_COUNTRY: false, // Locked in this deployment
  CAN_ENABLE_MULTI_COUNTRY: false, // Requires separate instance
  CAN_CHANGE_CURRENCY: false, // Locked to BDT
  REQUIRES_SUPER_ADMIN: true,
} as const;