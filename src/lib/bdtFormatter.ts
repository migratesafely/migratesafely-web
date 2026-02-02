/**
 * Bangladeshi Currency Formatter
 * Formats numbers in Lakhs/Crores format commonly used in Bangladesh
 */

export interface BDTFormatOptions {
  showCurrency?: boolean;
  decimalPlaces?: number;
  compact?: boolean;
}

/**
 * Formats a number in Bangladeshi Lakhs/Crores format
 * @param amount - The numeric amount to format
 * @param options - Formatting options
 * @returns Human-readable formatted string
 * 
 * Examples:
 * - 2000000 → "20 Lakhs BDT"
 * - 15000000 → "1 Crore 50 Lakhs BDT"
 * - 500000 → "5 Lakhs BDT"
 */
export function formatBDT(amount: number, options: BDTFormatOptions = {}): string {
  const {
    showCurrency = true,
    decimalPlaces = 0,
    compact = false
  } = options;

  // Handle zero and negative
  if (amount === 0) {
    return showCurrency ? "0 BDT" : "0";
  }

  if (amount < 0) {
    return "-" + formatBDT(Math.abs(amount), options);
  }

  const currency = showCurrency ? " BDT" : "";

  // Crores (10,000,000)
  if (amount >= 10000000) {
    const crores = Math.floor(amount / 10000000);
    const lakhs = Math.floor((amount - (crores * 10000000)) / 100000);

    if (compact) {
      return `${crores}${lakhs > 0 ? "." + Math.floor(lakhs / 10) : ""} Cr${currency}`;
    }

    if (lakhs > 0) {
      return `${crores} Crore ${lakhs} ${lakhs === 1 ? "Lakh" : "Lakhs"}${currency}`;
    }
    return `${crores} ${crores === 1 ? "Crore" : "Crores"}${currency}`;
  }

  // Lakhs (100,000)
  if (amount >= 100000) {
    const lakhs = Math.floor(amount / 100000);
    const thousands = Math.floor((amount - (lakhs * 100000)) / 1000);

    if (compact) {
      return `${lakhs}${thousands > 0 ? "." + Math.floor(thousands / 10) : ""} L${currency}`;
    }

    if (thousands > 0) {
      return `${lakhs} ${lakhs === 1 ? "Lakh" : "Lakhs"} ${thousands} Thousand${currency}`;
    }
    return `${lakhs} ${lakhs === 1 ? "Lakh" : "Lakhs"}${currency}`;
  }

  // Thousands (1,000)
  if (amount >= 1000) {
    const thousands = Math.floor(amount / 1000);
    const hundreds = Math.floor((amount - (thousands * 1000)) / 100);

    if (compact) {
      return `${thousands}${hundreds > 0 ? "." + hundreds : ""}K${currency}`;
    }

    return `${thousands} Thousand${currency}`;
  }

  // Less than 1000
  return `${amount.toFixed(decimalPlaces)}${currency}`;
}

/**
 * Parse BDT formatted string back to number
 * @param formatted - The formatted string (e.g., "20 Lakhs BDT")
 * @returns Numeric value
 */
export function parseBDT(formatted: string): number {
  // Remove currency suffix
  const cleaned = formatted.replace(/\s*BDT\s*$/i, "").trim();

  // Handle Crores
  if (/crore/i.test(cleaned)) {
    const match = cleaned.match(/([\d.]+)\s*crore/i);
    if (match) {
      const crores = parseFloat(match[1]);
      let total = crores * 10000000;

      // Check for additional Lakhs
      const lakhMatch = cleaned.match(/([\d.]+)\s*lakh/i);
      if (lakhMatch) {
        const lakhs = parseFloat(lakhMatch[1]);
        total += lakhs * 100000;
      }

      return total;
    }
  }

  // Handle Lakhs
  if (/lakh/i.test(cleaned)) {
    const match = cleaned.match(/([\d.]+)\s*lakh/i);
    if (match) {
      const lakhs = parseFloat(match[1]);
      let total = lakhs * 100000;

      // Check for additional Thousands
      const thousandMatch = cleaned.match(/([\d.]+)\s*thousand/i);
      if (thousandMatch) {
        const thousands = parseFloat(thousandMatch[1]);
        total += thousands * 1000;
      }

      return total;
    }
  }

  // Handle Thousands
  if (/thousand/i.test(cleaned)) {
    const match = cleaned.match(/([\d.]+)\s*thousand/i);
    if (match) {
      return parseFloat(match[1]) * 1000;
    }
  }

  // Handle compact notation (Cr, L, K)
  if (/cr$/i.test(cleaned)) {
    const match = cleaned.match(/([\d.]+)\s*cr$/i);
    if (match) return parseFloat(match[1]) * 10000000;
  }

  if (/L$/i.test(cleaned)) {
    const match = cleaned.match(/([\d.]+)\s*L$/i);
    if (match) return parseFloat(match[1]) * 100000;
  }

  if (/K$/i.test(cleaned)) {
    const match = cleaned.match(/([\d.]+)\s*K$/i);
    if (match) return parseFloat(match[1]) * 1000;
  }

  // Fallback: parse as regular number
  return parseFloat(cleaned.replace(/[^\d.]/g, "")) || 0;
}

/**
 * Get the appropriate unit for a given amount
 * @param amount - The numeric amount
 * @returns The unit name (Crores, Lakhs, Thousands, or empty string)
 */
export function getBDTUnit(amount: number): string {
  const absAmount = Math.abs(amount);

  if (absAmount >= 10000000) return "Crores";
  if (absAmount >= 100000) return "Lakhs";
  if (absAmount >= 1000) return "Thousands";
  return "";
}

/**
 * Format as Bengali numerals (optional, for localization)
 * @param amount - The numeric amount
 * @returns String with Bengali numerals
 */
export function formatBengaliNumerals(amount: number): string {
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  
  return amount.toString().split("").map(char => {
    const digit = parseInt(char);
    return isNaN(digit) ? char : bengaliDigits[digit];
  }).join("");
}

/**
 * Format for input field display (live preview)
 * @param value - Raw numeric value
 * @returns Formatted string for display next to input
 */
export function formatBDTPreview(value: number | string): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(numValue) || numValue === 0) {
    return "";
  }

  return formatBDT(numValue, { compact: false });
}

/**
 * Validate BDT amount
 * @param amount - Amount to validate
 * @param min - Minimum allowed value (default: 0)
 * @param max - Maximum allowed value (optional)
 * @returns Validation result with error message if invalid
 */
export function validateBDTAmount(
  amount: number,
  min: number = 0,
  max?: number
): { valid: boolean; error?: string } {
  if (isNaN(amount)) {
    return { valid: false, error: "Invalid amount" };
  }

  if (amount < min) {
    return { valid: false, error: `Amount must be at least ${formatBDT(min)}` };
  }

  if (max !== undefined && amount > max) {
    return { valid: false, error: `Amount cannot exceed ${formatBDT(max)}` };
  }

  return { valid: true };
}