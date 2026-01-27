import { supabase } from "@/integrations/supabase/client";
import type { CountrySettings } from "./countrySettings.types";

/**
 * COUNTRY SETTINGS REPOSITORY - DB ACCESS LAYER
 * Clean database operations for country-specific settings
 */

export const countrySettingsRepository = {
  /**
   * Get settings for a specific country
   */
  async getCountrySettings(countryCode: string): Promise<{
    success: boolean;
    settings: CountrySettings | null;
    message: string;
  }> {
    try {
      const { data, error } = await supabase
        .from("country_settings")
        .select("*")
        .eq("country_code", countryCode)
        .eq("is_active", true)
        .single();

      if (error && error.code !== "PGRST116") {
        return { success: false, settings: null, message: "Error fetching country settings" };
      }

      if (!data) {
        return { success: false, settings: null, message: "Country not found or inactive" };
      }

      return {
        success: true,
        settings: this.mapToCountrySettings(data),
        message: "Country settings retrieved successfully",
      };
    } catch (error) {
      console.error("Error getting country settings:", error);
      return { success: false, settings: null, message: "Error getting country settings" };
    }
  },

  /**
   * List all countries (active and inactive)
   */
  async listCountries(activeOnly = false): Promise<{
    success: boolean;
    countries: CountrySettings[];
    message: string;
  }> {
    try {
      let query = supabase
        .from("country_settings")
        .select("*")
        .order("country_name", { ascending: true });

      if (activeOnly) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, countries: [], message: "Error listing countries" };
      }

      return {
        success: true,
        countries: (data || []).map(this.mapToCountrySettings),
        message: "Countries retrieved successfully",
      };
    } catch (error) {
      console.error("Error listing countries:", error);
      return { success: false, countries: [], message: "Error listing countries" };
    }
  },

  /**
   * Update country settings (Super Admin only)
   * Currency fields are NOT editable (locked per country)
   */
  async updateCountrySettings(
    countryCode: string,
    updateData: {
      membershipFeeAmount?: number;
      isActive?: boolean;
      paymentGatewayProvider?: string;
      updatedByAdminId: string;
    }
  ): Promise<{
    success: boolean;
    settings: CountrySettings | null;
    message: string;
  }> {
    try {
      const { data, error } = await supabase
        .from("country_settings")
        .update({
          membership_fee_amount: updateData.membershipFeeAmount,
          is_active: updateData.isActive,
          payment_gateway_provider: updateData.paymentGatewayProvider,
          updated_by_admin_id: updateData.updatedByAdminId,
          updated_at: new Date().toISOString(),
        })
        .eq("country_code", countryCode)
        .select()
        .single();

      if (error || !data) {
        return { success: false, settings: null, message: "Failed to update country settings" };
      }

      return {
        success: true,
        settings: this.mapToCountrySettings(data),
        message: "Country settings updated successfully",
      };
    } catch (error) {
      console.error("Error updating country settings:", error);
      return { success: false, settings: null, message: "Error updating country settings" };
    }
  },

  /**
   * Seed default countries if table is empty
   * Called during initial setup
   */
  async seedDefaultCountriesIfEmpty(): Promise<{
    success: boolean;
    seeded: boolean;
    message: string;
  }> {
    try {
      const { data: existing, error: checkError } = await supabase
        .from("country_settings")
        .select("country_code")
        .limit(1);

      if (checkError) {
        return { success: false, seeded: false, message: "Error checking existing countries" };
      }

      if (existing && existing.length > 0) {
        return { success: true, seeded: false, message: "Countries already exist" };
      }

      const defaultCountries = [
        {
          country_code: "ZA",
          country_name: "South Africa",
          currency_code: "ZAR",
          currency_symbol: "R",
          membership_fee_amount: 500,
          is_active: true,
          payment_gateway_provider: "paystack",
        },
        {
          country_code: "NG",
          country_name: "Nigeria",
          currency_code: "NGN",
          currency_symbol: "₦",
          membership_fee_amount: 50000,
          is_active: true,
          payment_gateway_provider: "paystack",
        },
        {
          country_code: "US",
          country_name: "United States",
          currency_code: "USD",
          currency_symbol: "$",
          membership_fee_amount: 50,
          is_active: true,
          payment_gateway_provider: "stripe",
        },
      ];

      const { error: insertError } = await supabase
        .from("country_settings")
        .insert(defaultCountries);

      if (insertError) {
        return { success: false, seeded: false, message: "Failed to seed default countries" };
      }

      return { success: true, seeded: true, message: "Default countries seeded successfully" };
    } catch (error) {
      console.error("Error seeding countries:", error);
      return { success: false, seeded: false, message: "Error seeding countries" };
    }
  },

  /**
   * Map database row to CountrySettings type
   */
  mapToCountrySettings(data: any): CountrySettings {
    return {
      countryCode: data.country_code,
      countryName: data.country_name,
      currencyCode: data.currency_code,
      currencySymbol: data.currency_symbol,
      membershipFeeAmount: data.membership_fee_amount,
      isActive: data.is_active,
      paymentGatewayProvider: data.payment_gateway_provider,
      updatedByAdminId: data.updated_by_admin_id,
      updatedAt: data.updated_at,
    };
  },
};