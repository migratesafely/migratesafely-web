import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * API endpoint to log admin login attempts
 * POST /api/admin/auth/log-login-attempt
 * 
 * This endpoint logs all login attempts to the admin portal
 * for security monitoring and audit purposes.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, email, success, reason, timestamp } = req.body;

    // Validate input
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required" });
    }

    if (typeof success !== "boolean") {
      return res.status(400).json({ error: "Success status is required" });
    }

    // Get IP address from request
    const forwarded = req.headers["x-forwarded-for"];
    const ipAddress = typeof forwarded === "string" 
      ? forwarded.split(",")[0] 
      : req.socket.remoteAddress || "unknown";

    // Get user agent
    const userAgent = req.headers["user-agent"] || "unknown";

    // Log to audit_logs table
    const { error: logError } = await supabase
      .from("audit_logs")
      .insert({
        user_id: userId || null,
        action: success ? "ADMIN_LOGIN_SUCCESS" : "ADMIN_LOGIN_FAILED",
        table_name: "profiles",
        record_id: userId || null,
        old_values: null,
        new_values: {
          email: email,
          success: success,
          reason: reason || null,
          timestamp: timestamp || new Date().toISOString(),
          portal: "admin",
        },
        ip_address: ipAddress,
        user_agent: userAgent,
        created_at: new Date().toISOString(),
      });

    if (logError) {
      console.error("Error logging login attempt:", logError);
      // Don't fail the request if logging fails
      return res.status(200).json({ 
        success: true, 
        warning: "Login attempt logged with errors" 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Login attempt logged successfully" 
    });
  } catch (error) {
    console.error("Error in log-login-attempt:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}