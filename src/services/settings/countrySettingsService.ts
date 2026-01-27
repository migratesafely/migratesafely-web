import { countrySettingsRepository } from "./countrySettings.repository";
import type { CountrySettings } from "./countrySettings.types";

/**
 * COUNTRY SETTINGS SERVICE - BUSINESS LOGIC LAYER
 * Handles country-specific settings and validation
 * Enforces rules: Super Admin only, currency fields locked
 */

export const countrySettingsService = {
  /**
   * Get active country settings
   * Returns null if country is inactive or not found
   */
  async getActiveCountrySettings(countryCode: string): Promise<{
    success: boolean;
    settings: CountrySettings | null;
    message: string;
  }> {
    try {
      const result = await countrySettingsRepository.getCountrySettings(countryCode);
      
      if (!result.success || !result.settings) {
        return {
          success: false,
          settings: null,
          message: "Country not found or inactive",
        };
      }

      return {
        success: true,
        settings: result.settings,
        message: "Country settings retrieved successfully",
      };
    } catch (error) {
      console.error("Error getting active country settings:", error);
      return {
        success: false,
        settings: null,
        message: "Error getting country settings",
      };
    }
  },

  /**
   * Update membership fee for a country
   * SUPER ADMIN ONLY - Currency fields are locked
   */
  async setMembershipFee(
    countryCode: string,
    membershipFeeAmount: number,
    adminId: string
  ): Promise<{
    success: boolean;
    settings: CountrySettings | null;
    message: string;
  }> {
    try {
      // Validate membership fee amount
      if (membershipFeeAmount <= 0) {
        return {
          success: false,
          settings: null,
          message: "Membership fee must be greater than 0",
        };
      }

      // Update only the membership fee (currency fields are locked)
      const result = await countrySettingsRepository.updateCountrySettings(
        countryCode,
        {
          membershipFeeAmount,
          updatedByAdminId: adminId,
        }
      );

      if (!result.success) {
        return {
          success: false,
          settings: null,
          message: result.message,
        };
      }

      return {
        success: true,
        settings: result.settings,
        message: "Membership fee updated successfully",
      };
    } catch (error) {
      console.error("Error setting membership fee:", error);
      return {
        success: false,
        settings: null,
        message: "Error updating membership fee",
      };
    }
  },

  /**
   * Activate a country for new registrations
   * SUPER ADMIN ONLY
   */
  async activateCountry(
    countryCode: string,
    adminId: string
  ): Promise<{
    success: boolean;
    settings: CountrySettings | null;
    message: string;
  }> {
    try {
      const result = await countrySettingsRepository.updateCountrySettings(
        countryCode,
        {
          isActive: true,
          updatedByAdminId: adminId,
        }
      );

      if (!result.success) {
        return {
          success: false,
          settings: null,
          message: result.message,
        };
      }

      return {
        success: true,
        settings: result.settings,
        message: "Country activated successfully",
      };
    } catch (error) {
      console.error("Error activating country:", error);
      return {
        success: false,
        settings: null,
        message: "Error activating country",
      };
    }
  },

  /**
   * Deactivate a country (prevent new registrations)
   * SUPER ADMIN ONLY
   */
  async deactivateCountry(
    countryCode: string,
    adminId: string
  ): Promise<{
    success: boolean;
    settings: CountrySettings | null;
    message: string;
  }> {
    try {
      const result = await countrySettingsRepository.updateCountrySettings(
        countryCode,
        {
          isActive: false,
          updatedByAdminId: adminId,
        }
      );

      if (!result.success) {
        return {
          success: false,
          settings: null,
          message: result.message,
        };
      }

      return {
        success: true,
        settings: result.settings,
        message: "Country deactivated successfully",
      };
    } catch (error) {
      console.error("Error deactivating country:", error);
      return {
        success: false,
        settings: null,
        message: "Error deactivating country",
      };
    }
  },
};