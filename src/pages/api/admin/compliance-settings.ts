import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { agentPermissionsService } from "@/services/agentPermissionsService";
import { logAdminAction } from "@/services/auditLogService";

/**
 * Compliance settings management
 * ADMIN ONLY - Agents cannot access admin settings
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET - Fetch current BD compliance settings (PUBLIC READ)
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("compliance_settings")
      .select("trade_license_no, trade_license_expiry, tin_no, company_registration_no, display_on_home")
      .eq("country_code", "BD")
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  }

  // POST requires admin authentication - blocks agents
  if (req.method === "POST") {
    // Require admin role - blocks agents and members
    const auth = await requireAdminRole(req, res);
    if (!auth) return; // Middleware handles rejection

    const isSuperAdmin = await agentPermissionsService.isSuperAdmin(auth.userId);
    if (!isSuperAdmin) {
      return res.status(403).json({ error: "Forbidden: Only Super Admin can modify compliance settings" });
    }

    const {
      tradeLicenseNo,
      tradeLicenseExpiry,
      tinNo,
      companyRegistrationNo,
      displayOnHome,
    } = req.body;

    // Validate required field
    if (!tradeLicenseNo || typeof tradeLicenseNo !== "string") {
      return res.status(400).json({ error: "tradeLicenseNo is required" });
    }

    if (typeof displayOnHome !== "boolean") {
      return res.status(400).json({ error: "displayOnHome must be a boolean" });
    }

    // Update the BD row
    const { data, error } = await supabase
      .from("compliance_settings")
      .update({
        trade_license_no: tradeLicenseNo,
        trade_license_expiry: tradeLicenseExpiry || null,
        tin_no: tinNo || null,
        company_registration_no: companyRegistrationNo || null,
        display_on_home: displayOnHome,
        updated_by: auth.userId,
        updated_at: new Date().toISOString(),
      })
      .eq("country_code", "BD")
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Log successful update
    await logAdminAction({
      actorId: auth.userId,
      action: "COMPLIANCE_SETTINGS_UPDATED",
      tableName: "compliance_settings",
      recordId: data.id,
      newValues: { trade_license_no: tradeLicenseNo, display_on_home: displayOnHome },
    });

    return res.status(200).json(data);
  }

  // Method not allowed
  return res.status(405).json({ error: "Method not allowed" });
}