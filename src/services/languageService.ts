import { supabase } from "@/integrations/supabase/client";

export type Language = "en" | "bn" | "es" | "fr";

export interface LanguagePreference {
  userId: string;
  language: Language;
  updatedAt: string;
}

export interface EnabledLanguage {
  languageCode: Language;
  languageNameEnglish: string;
  languageNameNative: string;
}

export const languageService = {
  /**
   * Get enabled languages only (visible in member selector)
   */
  async getEnabledLanguages(): Promise<EnabledLanguage[]> {
    try {
      const { data, error } = await supabase.rpc("get_enabled_languages");

      if (error) {
        console.error("Error fetching enabled languages:", error);
        return [
          { languageCode: "en", languageNameEnglish: "English", languageNameNative: "English" }
        ];
      }

      return (data || []).map((lang: any) => ({
        languageCode: lang.language_code as Language,
        languageNameEnglish: lang.language_name_english,
        languageNameNative: lang.language_name_native
      }));
    } catch (error) {
      console.error("Error in getEnabledLanguages:", error);
      return [
        { languageCode: "en", languageNameEnglish: "English", languageNameNative: "English" }
      ];
    }
  },

  /**
   * Get member's language preference from database
   */
  async getMemberLanguagePreference(userId: string): Promise<Language | null> {
    try {
      const { data, error } = await supabase
        .rpc("get_member_language_preference", {
          p_member_id: userId
        });

      if (error) {
        console.error("Error fetching language preference:", error);
        return null;
      }

      return data as Language;
    } catch (error) {
      console.error("Error in getMemberLanguagePreference:", error);
      return null;
    }
  },

  /**
   * Update member's language preference in database
   */
  async updateMemberLanguagePreference(userId: string, language: Language): Promise<boolean> {
    try {
      const { error } = await supabase
        .rpc("update_member_language_preference", {
          p_member_id: userId,
          p_language_code: language
        });

      if (error) {
        console.error("Error updating language preference:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in updateMemberLanguagePreference:", error);
      return false;
    }
  },

  /**
   * Get browser language preference
   */
  getBrowserLanguage(): Language {
    const browserLang = navigator.language || navigator.languages?.[0];
    
    if (browserLang?.startsWith("bn")) return "bn";
    if (browserLang?.startsWith("es")) return "es";
    if (browserLang?.startsWith("fr")) return "fr";
    
    return "en"; // Default to English
  },

  /**
   * Validate language code
   */
  isValidLanguage(lang: string): lang is Language {
    return ["en", "bn", "es", "fr"].includes(lang);
  },

  /**
   * Toggle language availability (Super Admin only)
   */
  async toggleLanguageAvailability(languageCode: Language, isEnabled: boolean): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc("toggle_language_availability", {
          p_language_code: languageCode,
          p_is_enabled: isEnabled
        });

      if (error) {
        console.error("Error toggling language availability:", error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error("Error in toggleLanguageAvailability:", error);
      return false;
    }
  },

  /**
   * Get all languages with availability status (Super Admin only)
   */
  async getAllLanguagesAdmin(): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc("get_all_languages_admin");

      if (error) {
        console.error("Error fetching languages for admin:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getAllLanguagesAdmin:", error);
      return [];
    }
  }
};