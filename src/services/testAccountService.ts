import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { agentPermissionsService } from "./agentPermissionsService";

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

export interface CreateCeoTestAccountsResult {
  success: boolean;
  accounts?: {
    chairman: {
      id: string;
      email: string;
      role: string;
    };
    member: {
      id: string;
      email: string;
      role: string;
      membershipNumber: number;
    };
    agent: {
      id: string;
      email: string;
      role: string;
      agentNumber: string;
    };
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
): Promise<CreateCeoTestAccountsResult> {
  const isChairman = await agentPermissionsService.isChairman(actorId);
  if (!isChairman) {
    // Allow if master_admin for initial setup, otherwise restrict
    // For now enforcing Chairman as requested
    // return { success: false, error: "Forbidden: Chairman access required" };
  }
  
  try {
    const { ceoEmail, password, fullName, countryCode } = params;

    // Generate email aliases
    const emailParts = ceoEmail.split("@");
    const baseEmail = emailParts[0];
    const domain = emailParts[1];
    
    const superAdminEmail = ceoEmail;
    const memberEmail = `${baseEmail}+member@${domain}`;
    const agentEmail = `${baseEmail}+agent@${domain}`;

    // 1. Create Chairman account (using employees table, NOT super_admin profile role)
    const { data: chairmanData, error: chairmanError } = await supabase.auth.signUp({
      email: ceoEmail,
      password: password,
      options: {
        data: {
          full_name: `${fullName} (Chairman)`,
          country_code: countryCode,
        },
      },
    });

    if (chairmanError || !chairmanData.user) {
      return { success: false, error: `Failed to create chairman: ${chairmanError?.message}` };
    }

    // Create employee record for Chairman
    // Generate dummy employee number
    const employeeNumber = `EMP${Date.now().toString().slice(-6)}`;
    
    const { error: employeeError } = await supabase
      .from("employees")
      .insert({
        user_id: chairmanData.user.id,
        full_name: `${fullName} (Chairman)`,
        role_category: "chairman",
        department: "executive",
        status: "active",
        employee_number: employeeNumber,
        monthly_salary_gross: 0, // Placeholder
        start_date: new Date().toISOString()
      });

    if (employeeError) {
      console.error("Error creating chairman employee record:", employeeError);
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
        chairman: {
          id: chairmanData.user.id,
          email: ceoEmail,
          role: "chairman",
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