import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

/**
 * Test Account Service
 * Handles creation of CEO test accounts and free membership activation
 */

type UserRole = Database["public"]["Enums"]["user_role"];
type MembershipStatus = Database["public"]["Enums"]["membership_status"];

export interface CreateCeoTestAccountsParams {
  ceoEmail: string;
  password: string;
  fullName: string;
  countryCode: string;
}

export interface CreateCeoTestAccountsResponse {
  success: boolean;
  accounts?: {
    superAdmin: { id: string; email: string; role: string };
    member: { id: string; email: string; role: string; membershipNumber: number };
    agent: { id: string; email: string; role: string; agentNumber: string };
  };
  error?: string;
}

export interface ActivateFreeMembershipParams {
  userId: string;
}

export interface ActivateFreeMembershipResponse {
  success: boolean;
  membership?: any;
  created?: boolean;
  error?: string;
}

/**
 * Create CEO test accounts (super admin, member, agent)
 */
export async function createCeoTestAccounts(
  params: CreateCeoTestAccountsParams,
  actorId: string,
  authToken: string
): Promise<CreateCeoTestAccountsResponse> {
  try {
    const { ceoEmail, password, fullName, countryCode } = params;

    // Generate email aliases
    const emailParts = ceoEmail.split("@");
    const baseEmail = emailParts[0];
    const domain = emailParts[1];
    
    const superAdminEmail = ceoEmail;
    const memberEmail = `${baseEmail}+member@${domain}`;
    const agentEmail = `${baseEmail}+agent@${domain}`;

    // 1. Create Super Admin account
    const { data: superAdminData, error: superAdminError } = await supabase.auth.signUp({
      email: superAdminEmail,
      password: password,
      options: {
        data: {
          full_name: `${fullName} (CEO)`,
          country_code: countryCode,
        },
      },
    });

    if (superAdminError || !superAdminData.user) {
      return { success: false, error: `Failed to create super admin: ${superAdminError?.message}` };
    }

    // Update super admin profile
    const { error: updateSuperAdminError } = await supabase
      .from("profiles")
      .update({
        role: "super_admin" as UserRole,
        verification_notes: "TEST_ACCOUNT", // storing in verification_notes as notes not in profile schema? Wait, notes isn't in profile row type. Checking... schema says verification_notes.
        created_by_admin_id: actorId,
      })
      .eq("id", superAdminData.user.id);

    if (updateSuperAdminError) {
      console.error("Error updating super admin profile:", updateSuperAdminError);
    }

    // 2. Create Member account
    const { data: memberData, error: memberError } = await supabase.auth.signUp({
      email: memberEmail,
      password: password,
      options: {
        data: {
          full_name: `${fullName} (Member Test)`,
          country_code: countryCode,
        },
      },
    });

    if (memberError || !memberData.user) {
      return { success: false, error: `Failed to create member: ${memberError?.message}` };
    }

    // Generate referral code and membership number for member
    const referralCode = `CEO${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    // Membership number must be number
    const membershipNumber = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);

    // Update member profile
    const { error: updateMemberError } = await supabase
      .from("profiles")
      .update({
        role: "member" as UserRole,
        referral_code: referralCode,
        verification_notes: "TEST_ACCOUNT",
        created_by_admin_id: actorId,
      })
      .eq("id", memberData.user.id);

    if (updateMemberError) {
      console.error("Error updating member profile:", updateMemberError);
    }

    // Create active membership for member
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 365);

    const { error: membershipError } = await supabase
      .from("memberships")
      .insert({
        user_id: memberData.user.id,
        status: "active" as MembershipStatus,
        membership_number: membershipNumber,
        fee_amount: 0,
        fee_currency: "BDT",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (membershipError) {
      console.error("Error creating membership:", membershipError);
    }

    // 3. Create Agent account
    const { data: agentData, error: agentError } = await supabase.auth.signUp({
      email: agentEmail,
      password: password,
      options: {
        data: {
          full_name: `${fullName} (Agent Test)`,
          country_code: countryCode,
        },
      },
    });

    if (agentError || !agentData.user) {
      return { success: false, error: `Failed to create agent: ${agentError?.message}` };
    }

    // Generate agent number
    const agentNumber = `A${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Update agent profile
    const { error: updateAgentError } = await supabase
      .from("profiles")
      .update({
        role: "agent" as UserRole,
        agent_number: agentNumber,
        agent_status: "approved", // Using "approved" instead of "active" based on schema? Check schema: "pending_approval" | "approved" | "rejected" | "suspended"
        verification_notes: "TEST_ACCOUNT",
        created_by_admin_id: actorId,
      })
      .eq("id", agentData.user.id);

    if (updateAgentError) {
      console.error("Error updating agent profile:", updateAgentError);
    }

    return {
      success: true,
      accounts: {
        superAdmin: {
          id: superAdminData.user.id,
          email: superAdminEmail,
          role: "super_admin",
        },
        member: {
          id: memberData.user.id,
          email: memberEmail,
          role: "member",
          membershipNumber: membershipNumber,
        },
        agent: {
          id: agentData.user.id,
          email: agentEmail,
          role: "agent",
          agentNumber: agentNumber,
        },
      },
    };
  } catch (error) {
    console.error("Error in createCeoTestAccounts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Activate free membership for a user (test mode)
 */
export async function activateFreeMembership(
  params: ActivateFreeMembershipParams
): Promise<ActivateFreeMembershipResponse> {
  try {
    const { userId } = params;

    // Check if membership exists
    const { data: existingMembership, error: checkError } = await supabase
      .from("memberships")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 365);

    if (existingMembership) {
      // Update existing membership
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
        return { success: false, error: updateError.message };
      }

      return { success: true, membership: updatedMembership, created: false };
    } else {
      // Create new membership
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
        return { success: false, error: createError.message };
      }

      return { success: true, membership: newMembership, created: true };
    }
  } catch (error) {
    console.error("Error in activateFreeMembership:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}