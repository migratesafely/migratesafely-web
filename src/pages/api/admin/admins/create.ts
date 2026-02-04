import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { canCreateRole, createAdminWithAuth, createAdminProfile } from "@/services/adminManagementService";
import { supabase } from "@/integrations/supabase/client";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { logAdminAction } from "@/services/auditLogService";
import { agentPermissionsService } from "@/services/agentPermissionsService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Create Supabase client for auth verification
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Verify user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    // Get requester's profile and role
    const { data: requesterProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !requesterProfile) {
      return res.status(403).json({ error: "Forbidden: Profile not found" });
    }

    const requesterRole = requesterProfile.role;

    // Validate requester is an admin
    if (!["super_admin", "manager_admin", "worker_admin"].includes(requesterRole || "")) {
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }

    // Parse request body
    const { email, password, fullName, countryCode, roleToCreate } = req.body;

    // Validate required fields
    if (!email || !password || !fullName || !countryCode || !roleToCreate) {
      return res.status(400).json({ 
        error: "Missing required fields: email, password, fullName, countryCode, roleToCreate" 
      });
    }

    // Validate roleToCreate
    if (!["manager_admin", "worker_admin"].includes(roleToCreate)) {
      return res.status(400).json({ 
        error: "Invalid roleToCreate. Must be 'manager_admin' or 'worker_admin'" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    // Check if requester has permission to create this role
    if (!canCreateRole(requesterRole, roleToCreate)) {
      return res.status(403).json({ 
        error: `Forbidden: ${requesterRole} cannot create ${roleToCreate}` 
      });
    }

    // Attempt to create admin with auth (if service role available)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let result;
    if (serviceRoleKey) {
      // Try to create with full auth
      result = await createAdminWithAuth(
        {
          email,
          password,
          fullName,
          countryCode,
          roleToCreate,
          createdBy: user.id,
        },
        serviceRoleKey
      );
    } else {
      // Fallback to profile-only creation
      result = await createAdminProfile({
        email,
        password,
        fullName,
        countryCode,
        roleToCreate,
        createdBy: user.id,
      });
    }

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Return success response
    return res.status(201).json({
      success: true,
      admin: result.admin,
      authUserCreated: result.authUserCreated,
      message: result.authUserCreated 
        ? "Admin created successfully with authentication"
        : "Admin profile created. Auth user must be created manually in Supabase Dashboard with this email and a secure password.",
    });
  } catch (error) {
    console.error("Error in create admin API:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}