import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Membership = Database["public"]["Tables"]["memberships"]["Row"];
type Payment = Database["public"]["Tables"]["payments"]["Row"];
type Agent = Database["public"]["Tables"]["agents"]["Row"];
type AgentRequest = Database["public"]["Tables"]["agent_requests"]["Row"];

interface GenerationResult {
  success: boolean;
  message: string;
  stats?: {
    membersCreated: number;
    agentsCreated: number;
    paymentsCreated: number;
    walletsCredited: number;
    prizeEntriesCreated: number;
    agentRequestsCreated: number;
  };
  error?: string;
}

export class TestDataGeneratorService {
  /**
   * Generate comprehensive test data for platform validation
   * CHAIRMAN ONLY - Creates 10 test members + 10 test agents
   */
  static async generateTestData(): Promise<GenerationResult> {
    try {
      // Verify test mode is enabled via setting_key
      const { data: settings } = await supabase
        .from("system_settings")
        .select("setting_value")
        .eq("setting_key", "test_mode")
        .single();

      if (settings?.setting_value !== "true") {
        return {
          success: false,
          message: "Test mode must be enabled before generating test data",
        };
      }

      const stats = {
        membersCreated: 0,
        agentsCreated: 0,
        paymentsCreated: 0,
        walletsCredited: 0,
        prizeEntriesCreated: 0,
        agentRequestsCreated: 0,
      };

      // Get current prize draw
      const { data: currentDraw } = await supabase
        .from("prize_draws")
        .select("id")
        .eq("status", "active")
        .single();

      // Generate 10 test members
      for (let i = 1; i <= 10; i++) {
        const memberResult = await this.createTestMember(i, currentDraw?.id);
        if (memberResult.success) {
          stats.membersCreated++;
          stats.paymentsCreated++;
          stats.walletsCredited++;
          if (currentDraw?.id) stats.prizeEntriesCreated++;
        }
      }

      // Generate 10 test agents
      for (let i = 1; i <= 10; i++) {
        const agentResult = await this.createTestAgent(i);
        if (agentResult.success) {
          stats.agentsCreated++;
        }
      }

      // Create agent-member relationships (link first 5 members to first 5 agents)
      for (let i = 1; i <= 5; i++) {
        const requestResult = await this.createTestAgentRequest(i, i);
        if (requestResult.success) {
          stats.agentRequestsCreated++;
        }
      }

      // Log generation in audit trail
      await supabase.from("audit_logs").insert({
        action: "test_data_generated",
        entity_type: "system",
        performed_by: (await supabase.auth.getUser()).data.user?.id,
        details: "Test data generation completed",
        new_values: { test_mode: true, action: "test_data_generated", timestamp: new Date().toISOString() } as any
      } as any);

      return {
        success: true,
        message: "Test data generated successfully",
        stats,
      };
    } catch (error) {
      console.error("Test data generation failed:", error);
      return {
        success: false,
        message: "Test data generation failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create a single test member with full profile
   */
  private static async createTestMember(
    index: number,
    prizeDrawId?: string
  ): Promise<{ success: boolean; userId?: string }> {
    try {
      const email = `test_member_${index}@testing.local`;

      // Create auth user via Supabase Admin API (requires service role key)
      // Note: This requires the backend to handle user creation
      // For now, we'll create profile directly (assumes auth trigger handles profile creation)
      
      // Insert profile directly with test flag
      // Using as any to bypass strict type checks for confirmed columns
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: crypto.randomUUID(), // Generate UUID since we bypass auth
          email,
          full_name: `Test Member ${index}`,
          phone_number: `+88017${String(index).padStart(8, "0")}`,
          role: "member",
          is_test_account: true,
          is_verified: true, // changed from email_verified
          accepted_member_agreement: true,
          welcome_seen: true,
          membership_number: 99000 + index, // integer
        } as any)
        .select()
        .single();

      if (profileError) {
        console.error(`Failed to create test member ${index}:`, profileError);
        return { success: false };
      }

      const userId = profile.id;

      // Create active membership
      await supabase.from("memberships").insert({
        user_id: userId,
        status: "active",
        fee_amount: 1000,
        fee_currency: "BDT",
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        membership_number: 99000 + index,
      });

      // Create simulated payment record
      await supabase.from("payments").insert({
        user_id: userId,
        membership_id: (await supabase.from("memberships").select("id").eq("user_id", userId).single()).data!.id,
        amount: 1000,
        currency: "BDT",
        status: "confirmed", // payment_status enum
        transaction_id: `TEST-PAY-${userId.slice(0, 8)}`,
        payment_method: "test",
        payment_gateway: "test_mode",
      } as any);

      // Credit wallet balance
      await supabase.from("wallets").insert({
        user_id: userId,
        balance: index * 100, // Varying balances
        currency: "BDT",
      });

      // Create referral records (member 1 refers member 2, etc.)
      if (index > 1) {
        const { data: referrerProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", `test_member_${index - 1}@testing.local`)
          .single();

        if (referrerProfile) {
          await supabase.from("referrals").insert({
            referrer_id: referrerProfile.id,
            referred_user_id: userId,
            referral_code: `REF-${index}`,
            bonus_amount: 50,
            bonus_currency: "BDT",
            is_paid: true,
          });
        }
      }

      // Simulate tier progression
      const tierMap = ["blue", "bronze", "silver", "gold", "platinum"];
      const tierIndex = Math.min(Math.floor((index - 1) / 2), 4); // Distribute across tiers

      const { data: tier } = await supabase
        .from("loyalty_tiers")
        .select("id")
        .eq("tier_name", tierMap[tierIndex])
        .single();

      if (tier) {
        await supabase.from("member_loyalty_status").insert({
          user_id: userId,
          current_tier_id: tier.id,
          points_balance: index * 50,
          lifetime_points: index * 50,
        });
      }

      // Enroll in prize draw if active
      if (prizeDrawId) {
        await supabase.from("prize_draw_entries").insert({
          prize_draw_id: prizeDrawId,
          user_id: userId,
          membership_id: (await supabase.from("memberships").select("id").eq("user_id", userId).single()).data!.id,
          // entry_count not in schema, removing
        } as any);
      }

      return { success: true, userId };
    } catch (error) {
      console.error(`Error creating test member ${index}:`, error);
      return { success: false };
    }
  }

  /**
   * Create a single test agent with verification
   */
  private static async createTestAgent(
    index: number
  ): Promise<{ success: boolean; userId?: string }> {
    try {
      const email = `test_agent_${index}@testing.local`;

      // Insert profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: crypto.randomUUID(),
          email,
          full_name: `Test Agent ${index}`,
          phone_number: `+88018${String(index).padStart(8, "0")}`,
          role: "agent",
          is_test_account: true,
          is_verified: true,
          accepted_member_agreement: true,
          welcome_seen: true,
        } as any)
        .select()
        .single();

      if (profileError) {
        console.error(`Failed to create test agent ${index}:`, profileError);
        return { success: false };
      }

      const userId = profile.id;

      // Create agent record
      await supabase.from("agents").insert({
        user_id: userId,
        license_number: `TEST-LIC-${String(index).padStart(5, "0")}`,
        status: "approved",
        countries_covered: ["BD"],
      });

      return { success: true, userId };
    } catch (error) {
      console.error(`Error creating test agent ${index}:`, error);
      return { success: false };
    }
  }

  /**
   * Create test agent request linking member to agent
   */
  private static async createTestAgentRequest(
    memberIndex: number,
    agentIndex: number
  ): Promise<{ success: boolean }> {
    try {
      // Get member and agent user IDs
      const { data: memberProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", `test_member_${memberIndex}@testing.local`)
        .single();

      const { data: agentProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", `test_agent_${agentIndex}@testing.local`)
        .single();

      if (!memberProfile || !agentProfile) {
        return { success: false };
      }

      // Create agent request
      const { data: request, error: requestError } = await supabase
        .from("agent_requests")
        .insert({
          member_user_id: memberProfile.id,
          assigned_agent_id: agentProfile.id,
          request_type: "WORK", // Enum: WORK, STUDENT, FAMILY, VISIT, OTHER
          status: "ASSIGNED", // Enum: SUBMITTED, UNDER_REVIEW, ASSIGNED, COMPLETED, REJECTED
          member_country_code: "BD",
          destination_country_code: "MY",
          notes: `Test request from member ${memberIndex} to agent ${agentIndex}`,
        } as any)
        .select()
        .single();

      if (requestError || !request) {
        return { success: false };
      }

      // Create test messages in the request thread
      await supabase.from("agent_request_messages").insert([
        {
          request_id: request.id,
          sender_user_id: memberProfile.id,
          sender_role: "MEMBER",
          message: "Hello, I need assistance with my membership.",
        },
        {
          request_id: request.id,
          sender_user_id: agentProfile.id,
          sender_role: "ADMIN", // Schema says MEMBER or ADMIN. Agent acts as admin/staff here? Or missing AGENT role in enum?
          // Schema check: agent_request_messages_sender_role_check ALLOWED VALUES: 'MEMBER', 'ADMIN'
          // If agent sends, they might be considered 'ADMIN' role context or I should check if 'AGENT' is allowed.
          // Schema said: ALLOWED VALUES: 'MEMBER', 'ADMIN'. 
          // So Agents must use ADMIN role? Or maybe I should skip agent message if enum restricts.
          // Let's assume ADMIN for now or skip.
          message: "Hello! I'm here to help.",
        },
      ]);

      return { success: true };
    } catch (error) {
      console.error(
        `Error creating agent request ${memberIndex}-${agentIndex}:`,
        error
      );
      return { success: false };
    }
  }

  /**
   * Verify test data exists
   */
  static async verifyTestData(): Promise<{
    exists: boolean;
    count: number;
    details?: {
      members: number;
      agents: number;
      payments: number;
    };
  }> {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("is_test_account", true);

      if (error) {
        return { exists: false, count: 0 };
      }

      const members = profiles?.filter((p) => p.role === "member").length || 0;
      const agents = profiles?.filter((p) => p.role === "agent").length || 0;

      const { data: payments } = await supabase
        .from("payments")
        .select("id")
        .in(
          "user_id",
          profiles?.map((p) => p.id) || []
        );

      return {
        exists: (profiles?.length || 0) > 0,
        count: profiles?.length || 0,
        details: {
          members,
          agents,
          payments: payments?.length || 0,
        },
      };
    } catch (error) {
      console.error("Error verifying test data:", error);
      return { exists: false, count: 0 };
    }
  }
}