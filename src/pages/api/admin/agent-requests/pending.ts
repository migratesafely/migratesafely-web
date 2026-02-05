import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { requireAuth } from "@/lib/apiMiddleware";
import { agentPermissionsService } from "@/services/agentPermissionsService";
import { agentRequestService } from "@/services/agentRequestService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { auth } = await requireAuth(req, res);
  if (!auth || !auth.userId) {
    return; // requireAuth handles response
  }

  // Check if role is allowed
  const allowedRoles = ["super_admin", "manager_admin", "worker_admin"];
  // We need to fetch the role if it's not in the auth object or check permissions service
  // For now assuming auth middleware might need adjustment or we check manually
  
  // Since requireAuth in this project might return { userId, role } or just handle response
  // I need to check apiMiddleware.ts signature. 
  // Based on error "Expected 2 arguments, but got 3", it takes (req, res).
  // Let's rely on agentPermissionsService for role checks which is safer.

  try {
    const { data: employee } = await supabase
      .from("employees") // Fixed table name
      .select("role_category")
      .eq("user_id", auth.userId)
      .single();

    // Super Admin override: Can view without chairman role
    // Only Chairman can view pending agent requests
    const isChairman = employee?.role_category === "chairman";
    const isSuperAdmin = await agentPermissionsService.isSuperAdmin(auth.userId);
    
    if (!isChairman && !isSuperAdmin) {
      return res.status(403).json({ error: "Forbidden: Chairman or Super Admin access required" });
    }

    const result = await agentRequestService.listPendingRequestsForAdmin();

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    return res.status(200).json({ success: true, requests: result.requests });
  } catch (error) {
    console.error("Error in pending agent requests API:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}