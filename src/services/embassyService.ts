import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Embassy = Database["public"]["Tables"]["embassies"]["Row"];

export interface ListEmbassiesParams {
  countryCode?: string;
  search?: string;
}

export const embassyService = {
  /**
   * List embassies with optional filters
   */
  async listEmbassies(params?: ListEmbassiesParams): Promise<Embassy[]> {
    try {
      let query = supabase
        .from("embassies")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("country_name", { ascending: true });

      if (params?.countryCode) {
        query = query.eq("country_code", params.countryCode);
      }

      if (params?.search) {
        const searchTerm = `%${params.search}%`;
        query = query.or(
          `embassy_name.ilike.${searchTerm},country_name.ilike.${searchTerm},address.ilike.${searchTerm}`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error listing embassies:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in listEmbassies:", error);
      return [];
    }
  },

  /**
   * Get embassy by ID
   */
  async getEmbassyById(id: string): Promise<Embassy | null> {
    try {
      const { data, error } = await supabase
        .from("embassies")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching embassy:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in getEmbassyById:", error);
      return null;
    }
  },

  /**
   * Get unique country list from embassies
   */
  async getCountryList(): Promise<Array<{ code: string; name: string }>> {
    try {
      const { data, error } = await supabase
        .from("embassies")
        .select("country_code, country_name")
        .eq("is_active", true)
        .order("country_name", { ascending: true });

      if (error) {
        console.error("Error fetching countries:", error);
        return [];
      }

      const uniqueCountries = Array.from(
        new Map(
          data?.map((item) => [item.country_code, { code: item.country_code, name: item.country_name }])
        ).values()
      );

      return uniqueCountries;
    } catch (error) {
      console.error("Error in getCountryList:", error);
      return [];
    }
  },
};