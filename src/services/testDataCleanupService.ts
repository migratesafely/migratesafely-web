import { supabase } from "@/integrations/supabase/client";

interface CleanupStats {
  profilesDeleted: number;
  membershipsDeleted: number;
  paymentsDeleted: number;
  walletsDeleted: number;
  referralsDeleted: number;
  prizeEntriesDeleted: number;
  agentsDeleted: number;
  agentRequestsDeleted: number;
  messagesDeleted: number;
  loyaltyStatusDeleted: number;
  identityVerificationsDeleted: number;
  documentVerificationsDeleted: number;
  auditLogsDeleted: number;
}

export class TestDataCleanupService {
  /**
   * Complete cleanup of all test data
   * CHAIRMAN ONLY - Removes all test accounts and related data
   */
  static async cleanupTestData(): Promise<{
    success: boolean;
    message: string;
    stats?: CleanupStats;
  }> {
    try {
      // Verify test mode is enabled via setting_key
      const { data: settings } = await supabase
        .from("system_settings")
        .select("setting_value, id")
        .eq("setting_key", "test_mode")
        .single();

      if (settings?.setting_value !== "true") {
        return {
          success: false,
          message: "Test mode must be enabled to perform cleanup",
        };
      }

      // Get all test account IDs
      const { data: testProfiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("is_test_account", true);

      if (profileError) {
        throw new Error(`Failed to fetch test profiles: ${profileError.message}`);
      }

      if (!testProfiles || testProfiles.length === 0) {
        return {
          success: true,
          message: "No test data found to cleanup",
          stats: this.getEmptyStats(),
        };
      }

      const testUserIds = testProfiles.map((p) => p.id);
      const stats: CleanupStats = this.getEmptyStats();

      // Delete in dependency order (children first, then parents)

      // 1. Delete agent request messages
      const { error: messagesError } = await supabase
        .from("agent_request_messages")
        .delete()
        .in("sender_user_id", testUserIds);

      if (!messagesError) {
        const { count } = await supabase
          .from("agent_request_messages")
          .select("id", { count: "exact", head: true })
          .in("sender_user_id", testUserIds);
        stats.messagesDeleted = count || 0;
      }

      // 2. Delete agent requests
      const { error: agentRequestsError } = await supabase
        .from("agent_requests")
        .delete()
        .or(`member_user_id.in.(${testUserIds.join(",")}),assigned_agent_id.in.(${testUserIds.join(",")})`);

      if (!agentRequestsError) {
        const { count } = await supabase
          .from("agent_requests")
          .select("id", { count: "exact", head: true })
          .or(`member_user_id.in.(${testUserIds.join(",")}),assigned_agent_id.in.(${testUserIds.join(",")})`);
        stats.agentRequestsDeleted = count || 0;
      }

      // 3. Delete messages (system messages sent by test users)
      await supabase
        .from("messages")
        .delete()
        .in("sender_user_id", testUserIds);

      // 4. Delete message recipients
      await supabase
        .from("message_recipients")
        .delete()
        .in("recipient_user_id", testUserIds);

      // 5. Delete prize draw entries
      const { error: prizeEntriesError } = await supabase
        .from("prize_draw_entries")
        .delete()
        .in("user_id", testUserIds);

      if (!prizeEntriesError) {
        const { count } = await supabase
          .from("prize_draw_entries")
          .select("id", { count: "exact", head: true })
          .in("user_id", testUserIds);
        stats.prizeEntriesDeleted = count || 0;
      }

      // 6. Delete loyalty status
      const { error: loyaltyError } = await supabase
        .from("member_loyalty_status")
        .delete()
        .in("user_id", testUserIds);

      if (!loyaltyError) {
        const { count } = await supabase
          .from("member_loyalty_status")
          .select("id", { count: "exact", head: true })
          .in("user_id", testUserIds);
        stats.loyaltyStatusDeleted = count || 0;
      }

      // 7. Delete referrals
      const { error: referralsError } = await supabase
        .from("referrals")
        .delete()
        .or(`referrer_id.in.(${testUserIds.join(",")}),referred_user_id.in.(${testUserIds.join(",")})`);

      if (!referralsError) {
        const { count } = await supabase
          .from("referrals")
          .select("id", { count: "exact", head: true })
          .or(`referrer_id.in.(${testUserIds.join(",")}),referred_user_id.in.(${testUserIds.join(",")})`);
        stats.referralsDeleted = count || 0;
      }

      // 8. Delete wallets
      const { error: walletsError } = await supabase
        .from("wallets")
        .delete()
        .in("user_id", testUserIds);

      if (!walletsError) {
        const { count } = await supabase
          .from("wallets")
          .select("id", { count: "exact", head: true })
          .in("user_id", testUserIds);
        stats.walletsDeleted = count || 0;
      }

      // 9. Delete payments
      const { error: paymentsError } = await supabase
        .from("payments")
        .delete()
        .in("user_id", testUserIds);

      if (!paymentsError) {
        const { count } = await supabase
          .from("payments")
          .select("id", { count: "exact", head: true })
          .in("user_id", testUserIds);
        stats.paymentsDeleted = count || 0;
      }

      // 10. Delete memberships
      const { error: membershipsError } = await supabase
        .from("memberships")
        .delete()
        .in("user_id", testUserIds);

      if (!membershipsError) {
        const { count } = await supabase
          .from("memberships")
          .select("id", { count: "exact", head: true })
          .in("user_id", testUserIds);
        stats.membershipsDeleted = count || 0;
      }

      // 11. Delete identity verifications
      const { error: identityError } = await supabase
        .from("identity_verifications")
        .delete()
        .in("user_id", testUserIds);

      if (!identityError) {
        const { count } = await supabase
          .from("identity_verifications")
          .select("id", { count: "exact", head: true })
          .in("user_id", testUserIds);
        stats.identityVerificationsDeleted = count || 0;
      }

      // 12. Delete document verifications
      const { error: docError } = await supabase
        .from("document_verification_requests")
        .delete()
        .in("member_id", testUserIds);

      if (!docError) {
        const { count } = await supabase
          .from("document_verification_requests")
          .select("id", { count: "exact", head: true })
          .in("member_id", testUserIds);
        stats.documentVerificationsDeleted = count || 0;
      }

      // 13. Delete agents (for test agent accounts)
      const { error: agentsError } = await supabase
        .from("agents")
        .delete()
        .in("user_id", testUserIds);

      if (!agentsError) {
        const { count } = await supabase
          .from("agents")
          .select("id", { count: "exact", head: true })
          .in("user_id", testUserIds);
        stats.agentsDeleted = count || 0;
      }

      // 14. Delete audit logs related to test users (careful not to delete the cleanup log itself)
      const { error: auditError } = await (supabase
        .from("audit_logs") as any)
        .delete()
        .in("performed_by", testUserIds)
        .neq("action", "test_data_cleanup");

      if (!auditError) {
        const { count } = await (supabase
          .from("audit_logs") as any)
          .select("id", { count: "exact", head: true })
          .in("performed_by", testUserIds)
          .neq("action", "test_data_cleanup");
        stats.auditLogsDeleted = count || 0;
      }

      // 15. Finally, delete profiles
      const { error: profileDeleteError } = await supabase
        .from("profiles")
        .delete()
        .eq("is_test_account", true);

      if (!profileDeleteError) {
        stats.profilesDeleted = testProfiles.length;
      }

      // 16. Disable test mode
      if (settings?.id) {
        await supabase
          .from("system_settings")
          .update({ setting_value: "false" })
          .eq("id", settings.id);
      }

      // Log cleanup action (careful not to delete this log in the next cleanup)
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      const auditRecord: any = {};
      auditRecord.action = "test_data_cleanup";
      auditRecord.entity_type = "system";
      auditRecord.performed_by = userId;
      auditRecord.details = "Test data cleanup completed";
      auditRecord.new_values = { test_mode: false, action: "test_data_cleanup", timestamp: new Date().toISOString() };
      
      await supabase.from("audit_logs").insert(auditRecord);

      console.log("Test data cleanup completed:", stats);

      return {
        success: true,
        message: "Test data cleanup completed successfully",
        stats,
      };
    } catch (error) {
      console.error("Test data cleanup failed:", error);
      return {
        success: false,
        message: "Test data cleanup failed",
      };
    }
  }

  /**
   * Verify cleanup completeness
   */
  static async verifyCleanup(): Promise<{
    clean: boolean;
    remainingCount: number;
    message: string;
  }> {
    try {
      const { data: testProfiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("is_test_account", true);

      const remainingCount = testProfiles?.length || 0;

      return {
        clean: remainingCount === 0,
        remainingCount,
        message:
          remainingCount === 0
            ? "Cleanup verified: No test accounts remain"
            : `Warning: ${remainingCount} test accounts still exist`,
      };
    } catch (error) {
      console.error("Cleanup verification failed:", error);
      return {
        clean: false,
        remainingCount: -1,
        message: "Verification failed",
      };
    }
  }

  private static getEmptyStats(): CleanupStats {
    return {
      profilesDeleted: 0,
      membershipsDeleted: 0,
      paymentsDeleted: 0,
      walletsDeleted: 0,
      referralsDeleted: 0,
      prizeEntriesDeleted: 0,
      agentsDeleted: 0,
      agentRequestsDeleted: 0,
      messagesDeleted: 0,
      loyaltyStatusDeleted: 0,
      identityVerificationsDeleted: 0,
      documentVerificationsDeleted: 0,
      auditLogsDeleted: 0,
    };
  }
}