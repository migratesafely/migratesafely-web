import type { NextApiRequest, NextApiResponse } from "next";
import { apiMiddleware, AuthenticatedRequest } from "@/lib/apiMiddleware";
import { getFinancialCloseSummary } from "@/services/accounting/financialCloseService";
import { supabase } from "@/integrations/supabase/client";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // AUTHORITY CHECK: Only Chairman can view financial close periods
  const { data: employee } = await supabase
    .from("employees")
    .select("role_category")
    .eq("user_id", userId)
    .single();

  if (!employee || employee.role_category !== "chairman") {
    return res.status(403).json({ 
      error: "Forbidden - Only Chairman can view financial close periods" 
    });
  }

  const result = await getFinancialCloseSummary();

  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  return res.status(200).json(result.data);
}

export default apiMiddleware(handler, {
  requireAdmin: true,
  allowedRoles: ["super_admin", "manager_admin"], // UI access only, real auth is chairman check above
});