import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { agentPermissionsService } from "@/services/agentPermissionsService";

type UserRole = Database["public"]["Enums"]["user_role"];
type MembershipStatus = Database["public"]["Enums"]["membership_status"];
type AgentStatus = Database["public"]["Enums"]["agent_status"];

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
    // Check permissions - only Chairman can create CEO test accounts
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

    // 3. Only super_admin can create CEO test accounts
    if (requesterProfile.role !== "super_admin") {
      return res.status(403).json({
        error: "Forbidden: Only super_admin can create CEO test accounts",
      });
    }

    // 4. Validate request body
    const { ceoEmail, password, fullName, countryCode } = req.body;

    if (!ceoEmail || !password || !fullName) {
      return res.status(400).json({
        error: "Missing required fields: ceoEmail, password, fullName",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ceoEmail)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // 5. Use service admin client to create accounts
    const adminClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Generate email aliases
    const emailParts = ceoEmail.split("@");
    const baseEmail = emailParts[0];
    const domain = emailParts[1];

    const superAdminEmail = ceoEmail;
    const memberEmail = `${baseEmail}+member@${domain}`;
    const agentEmail = `${baseEmail}+agent@${domain}`;

    // 6. Create Super Admin account
    const { data: superAdminData, error: superAdminError } =
      await adminClient.auth.admin.createUser({
        email: superAdminEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: `${fullName} (CEO)`,
          country_code: countryCode || "BD",
        },
      });

    if (superAdminError || !superAdminData.user) {
      return res.status(500).json({
        error: `Failed to create super admin: ${superAdminError?.message}`,
      });
    }

    // Update super admin profile
    await adminClient
      .from("profiles")
      .update({
        role: "super_admin" as UserRole,
        verification_notes: "TEST_ACCOUNT",
        created_by_admin_id: user.id,
      })
      .eq("id", superAdminData.user.id);

    // 7. Create Member account
    const { data: memberData, error: memberError } =
      await adminClient.auth.admin.createUser({
        email: memberEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: `${fullName} (Member Test)`,
          country_code: countryCode || "BD",
        },
      });

    if (memberError || !memberData.user) {
      return res.status(500).json({
        error: `Failed to create member: ${memberError?.message}`,
      });
    }

    // Generate referral code and membership number
    const referralCode = `CEO${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const membershipNumber = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);

    // Update member profile
    await adminClient
      .from("profiles")
      .update({
        role: "member" as UserRole,
        referral_code: referralCode,
        verification_notes: "TEST_ACCOUNT",
        created_by_admin_id: user.id,
      })
      .eq("id", memberData.user.id);

    // Create active membership
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 365);

    await adminClient.from("memberships").insert({
      user_id: memberData.user.id,
      status: "active" as MembershipStatus,
      membership_number: membershipNumber,
      fee_amount: 0,
      fee_currency: "BDT",
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    });

    // 8. Create Agent account
    const { data: agentData, error: agentError } =
      await adminClient.auth.admin.createUser({
        email: agentEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: `${fullName} (Agent Test)`,
          country_code: countryCode || "BD",
        },
      });

    if (agentError || !agentData.user) {
      return res.status(500).json({
        error: `Failed to create agent: ${agentError?.message}`,
      });
    }

    // Generate agent number
    const agentNumber = `A${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Update agent profile
    await adminClient
      .from("profiles")
      .update({
        role: "agent" as UserRole,
        agent_number: agentNumber,
        agent_status: "approved" as AgentStatus,
        verification_notes: "TEST_ACCOUNT",
        created_by_admin_id: user.id,
      })
      .eq("id", agentData.user.id);

    // 9. Return success
    return res.status(200).json({
      success: true,
      message: "CEO test accounts created successfully",
      accounts: {
        superAdmin: {
          id: superAdminData.user.id,
          email: superAdminEmail,
          role: "super_admin",
          loginHint: "Use this account to access admin panel at /admin/login",
        },
        member: {
          id: memberData.user.id,
          email: memberEmail,
          role: "member",
          membershipNumber: membershipNumber,
          referralCode: referralCode,
          loginHint: "Use this account to test member features at /login",
        },
        agent: {
          id: agentData.user.id,
          email: agentEmail,
          role: "agent",
          agentNumber: agentNumber,
          loginHint: "Use this account to test agent features at /login",
        },
      },
      password: password,
      note: "All accounts use the same password. Store securely.",
    });
  } catch (error) {
    console.error("Error in create-ceo API:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}