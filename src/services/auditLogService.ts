import { supabase } from "@/integrations/supabase/client";

/**
 * Audit Log Service
 * Logs all admin actions to the audit_logs table for compliance and tracking
 */

export interface LogAdminActionParams {
  actorId: string;
  action: string;
  targetUserId?: string | null;
  details?: Record<string, any> | null;
  tableName?: string | null;
  recordId?: string | null;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuditLogResponse {
  success: boolean;
  logId?: string;
  error?: string;
}

/**
 * Log an admin action to the audit_logs table
 */
export async function logAdminAction(
  params: LogAdminActionParams
): Promise<AuditLogResponse> {
  try {
    const {
      actorId,
      action,
      targetUserId = null,
      details = null,
      tableName = null,
      recordId = null,
      oldValues = null,
      newValues = null,
      ipAddress = null,
      userAgent = null,
    } = params;

    // Validate required fields
    if (!actorId || !action) {
      return {
        success: false,
        error: "Missing required fields: actorId and action",
      };
    }

    const { data, error } = await supabase
      .from("audit_logs")
      .insert({
        user_id: actorId,
        action: action,
        table_name: tableName,
        record_id: recordId || targetUserId,
        old_values: oldValues,
        new_values: newValues,
        ip_address: ipAddress,
        user_agent: userAgent,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error logging admin action:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      logId: data.id,
    };
  } catch (error) {
    console.error("Error in logAdminAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .or(`user_id.eq.${userId},record_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching user audit logs:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getUserAuditLogs:", error);
    return [];
  }
}

/**
 * Get recent audit logs
 */
export async function getRecentAuditLogs(limit: number = 100): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching recent audit logs:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getRecentAuditLogs:", error);
    return [];
  }
}

/**
 * Helper: Log admin role change
 */
export async function logRoleChange(
  actorId: string,
  targetUserId: string,
  oldRole: string,
  newRole: string,
  ipAddress?: string,
  userAgent?: string
): Promise<AuditLogResponse> {
  return logAdminAction({
    actorId,
    action: "ADMIN_ROLE_CHANGED",
    targetUserId,
    tableName: "profiles",
    recordId: targetUserId,
    oldValues: { role: oldRole },
    newValues: { role: newRole },
    ipAddress,
    userAgent,
  });
}

/**
 * Helper: Log admin suspension/unsuspension
 */
export async function logSuspension(
  actorId: string,
  targetUserId: string,
  suspended: boolean,
  reason?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<AuditLogResponse> {
  return logAdminAction({
    actorId,
    action: suspended ? "ADMIN_SUSPENDED" : "ADMIN_UNSUSPENDED",
    targetUserId,
    tableName: "profiles",
    recordId: targetUserId,
    newValues: { deleted_at: suspended ? new Date().toISOString() : null, reason },
    ipAddress,
    userAgent,
  });
}

/**
 * Helper: Log admin creation
 */
export async function logAdminCreation(
  actorId: string,
  targetUserId: string,
  targetRole: string,
  targetEmail: string,
  ipAddress?: string,
  userAgent?: string
): Promise<AuditLogResponse> {
  return logAdminAction({
    actorId,
    action: "ADMIN_CREATED",
    targetUserId,
    tableName: "profiles",
    recordId: targetUserId,
    newValues: { role: targetRole, email: targetEmail },
    ipAddress,
    userAgent,
  });
}