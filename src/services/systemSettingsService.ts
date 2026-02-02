import { supabase } from "@/integrations/supabase/client";

export interface SystemSetting {
  id: string;
  settingKey: string;
  settingValue: string;
  description?: string;
  updatedBy?: string;
  updatedAt: string;
}

export const systemSettingsService = {
  /**
   * Get a system setting value
   */
  async getSetting(settingKey: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc("get_system_setting", {
        p_setting_key: settingKey,
      });

      if (error) {
        console.error("Error getting system setting:", error);
        return null;
      }

      return data as string;
    } catch (error) {
      console.error("Error in getSetting:", error);
      return null;
    }
  },

  /**
   * Check if member registration is enabled
   */
  async isMemberRegistrationEnabled(): Promise<boolean> {
    try {
      const value = await this.getSetting("member_registration_enabled");
      return value === "true";
    } catch (error) {
      console.error("Error checking member registration status:", error);
      return false; // Fail closed
    }
  },

  /**
   * Check if agent applications are enabled
   */
  async isAgentApplicationsEnabled(): Promise<boolean> {
    try {
      const value = await this.getSetting("agent_applications_enabled");
      return value === "true";
    } catch (error) {
      console.error("Error checking agent applications status:", error);
      return false; // Fail closed
    }
  },

  /**
   * Update a system setting (Super Admin only)
   */
  async updateSetting(
    settingKey: string,
    newValue: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("update_system_setting", {
        p_setting_key: settingKey,
        p_new_value: newValue,
      });

      if (error) {
        console.error("Error updating system setting:", error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: "Update failed - insufficient permissions" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error in updateSetting:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  },

  /**
   * Enable member registration (Super Admin only)
   */
  async enableMemberRegistration(): Promise<{ success: boolean; error?: string }> {
    return this.updateSetting("member_registration_enabled", "true");
  },

  /**
   * Disable member registration (Super Admin only)
   */
  async disableMemberRegistration(): Promise<{ success: boolean; error?: string }> {
    return this.updateSetting("member_registration_enabled", "false");
  },

  /**
   * Enable agent applications (Super Admin only)
   */
  async enableAgentApplications(): Promise<{ success: boolean; error?: string }> {
    return this.updateSetting("agent_applications_enabled", "true");
  },

  /**
   * Disable agent applications (Super Admin only)
   */
  async disableAgentApplications(): Promise<{ success: boolean; error?: string }> {
    return this.updateSetting("agent_applications_enabled", "false");
  },

  /**
   * Get all system settings (Super Admin only)
   */
  async getAllSettings(): Promise<SystemSetting[]> {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .order("setting_key");

      if (error) {
        console.error("Error fetching system settings:", error);
        return [];
      }

      return (data || []).map((setting: any) => ({
        id: setting.id,
        settingKey: setting.setting_key,
        settingValue: setting.setting_value,
        description: setting.description,
        updatedBy: setting.updated_by,
        updatedAt: setting.updated_at,
      }));
    } catch (error) {
      console.error("Error in getAllSettings:", error);
      return [];
    }
  },
};