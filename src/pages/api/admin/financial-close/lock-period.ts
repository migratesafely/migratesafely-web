import type { NextApiRequest, NextApiResponse } from "next";
import { apiMiddleware, AuthenticatedRequest } from "@/lib/apiMiddleware";
import { lockAccountingPeriod } from "@/services/accounting/financialCloseService";
import { supabase } from "@/integrations/supabase/client";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { year, month } = req.body;
  const userId = req.userId;

  if (!year || !month) {
    return res.status(400).json({ error: "Year and month are required" });
  }

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // AUTHORITY CHECK: Only Chairman can lock financial periods
  const { data: employee } = await supabase
    .from("employees")
    .select("role_category")
    .eq("user_id", userId)
    .single();

  if (!employee || employee.role_category !== "chairman") {
    return res.status(403).json({ 
      error: "Forbidden - Only Chairman can lock financial periods" 
    });
  }

  const result = await lockAccountingPeriod({
    year: parseInt(year),
    month: parseInt(month),
    adminId: userId,
  });

  if (!result.success) {
    return res.status(500).json({ error: result.error });
  }

  return res.status(200).json(result.data);
}

export default apiMiddleware(handler, {
  requireAdmin: true,
  allowedRoles: ["super_admin", "manager_admin"], // UI access only, real auth is chairman check above
});