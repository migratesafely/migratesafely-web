import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { agentPermissionsService } from "@/services/agentPermissionsService";

type MembershipStatus = Database["public"]["Enums"]["membership_status"];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only POST allowed
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireAdminRole(req, res);
  if (!auth) return;

  try {
    // Only Chairman can activate free memberships
    const isChairman = await agentPermissionsService.isChairman(auth.userId);
    
    if (!isChairman) {
      return res.status(403).json({ success: false, error: "Forbidden: Chairman access required" });
    }

    // 1. Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    // 2. Get requester profile and role
    const { data: requesterProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !requesterProfile) {
      return res.status(403).json({ error: "Forbidden: Profile not found" });
    }

    // 3. Only super_admin or manager_admin can activate free membership
    if (!["super_admin", "manager_admin"].includes(requesterProfile.role || "")) {
      return res.status(403).json({
        error: "Forbidden: Only super_admin or manager_admin can activate free membership",
      });
    }

    // 4. Validate request body
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "Missing required field: userId",
      });
    }

    // 5. Check if user exists
    const { data: targetUser, error: userError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("id", userId)
      .single();

    if (userError || !targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // 6. Check if membership exists
    const { data: existingMembership, error: checkError } = await supabase
      .from("memberships")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 365);

    let membership;
    let created = false;

    if (existingMembership) {
      // 7. Update existing membership
      const { data: updatedMembership, error: updateError } = await supabase
        .from("memberships")
        .update({
          status: "active" as MembershipStatus,
          end_date: endDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({
          error: "Failed to update membership",
          details: updateError.message,
        });
      }

      membership = updatedMembership;
    } else {
      // 8. Create new membership
      const membershipNumber = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);

      const { data: newMembership, error: createError } = await supabase
        .from("memberships")
        .insert({
          user_id: userId,
          status: "active" as MembershipStatus,
          membership_number: membershipNumber,
          fee_amount: 0,
          fee_currency: "BDT",
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        return res.status(500).json({
          error: "Failed to create membership",
          details: createError.message,
        });
      }

      membership = newMembership;
      created = true;
    }

    // 9. Return success
    return res.status(200).json({
      success: true,
      message: created
        ? "Free membership created and activated"
        : "Membership updated to active status",
      membership: {
        id: membership.id,
        user_id: membership.user_id,
        status: membership.status,
        membership_number: membership.membership_number,
        end_date: membership.end_date,
      },
      user: {
        id: targetUser.id,
        email: targetUser.email,
        full_name: targetUser.full_name,
        role: targetUser.role,
      },
      created: created,
    });
  } catch (error) {
    console.error("Error in activate-free-membership API:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}