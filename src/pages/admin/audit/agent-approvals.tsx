import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { MainHeader } from "@/components/MainHeader";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, CheckCircle, XCircle, AlertTriangle, Eye, Calendar, User } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  actor_id: string;
  target_user_id: string;
  details?: any;
  created_at: string;
  actor?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
  target?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    agent_status?: string;
  };
}

export default function AgentApprovalsAuditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [pagination, setPagination] = useState({ total: 0, limit: 50, offset: 0, has_more: false });

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: employee } = await supabase
        .from("employees")
        .select("role_category")
        .eq("user_id", user.id)
        .maybeSingle();

      const isChairman = employee?.role_category === "chairman";
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!isChairman && profile?.role !== "manager_admin") {
        router.push("/admin");
        return;
      }

      setCurrentUserRole(profile.role);

      // Fetch audit logs via API
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
      });

      const response = await fetch(`/api/admin/agent-approval/audit-logs?${params}`, {
        headers: {
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }

      const data = await response.json();
      setAuditLogs(data.audit_logs || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error checking access:", error);
      router.push("/admin");
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "AGENT_APPROVED":
        return <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Approved</Badge>;
      case "AGENT_REJECTED":
        return <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      case "AGENT_SUSPENDED":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Suspended</Badge>;
      case "AGENT_REINSTATED":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Reinstated</Badge>;
      case "AGENT_APPROVE_ATTEMPT_DENIED":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200 flex items-center gap-1"><XCircle className="h-3 w-3" /> Denied (Approve)</Badge>;
      case "AGENT_REJECT_ATTEMPT_DENIED":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200 flex items-center gap-1"><XCircle className="h-3 w-3" /> Denied (Reject)</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Super Admin</Badge>;
      case "manager_admin":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Manager Admin</Badge>;
      case "worker_admin":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Worker Admin</Badge>;
      case "agent":
        return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">Agent</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MainHeader />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Agent Approval Audit Log
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Read-only view of all agent approval and rejection actions
            </p>
          </div>
        </div>

        {/* Governance Notice */}
        <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-6">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-purple-800">Read-Only Accountability Log</h3>
              <p className="text-sm text-purple-700 mt-1">
                This audit log provides complete traceability of all agent approval actions for governance compliance. 
                All approval and rejection actions are permanently recorded with full context. This is a read-only view 
                for accountability purposes only.
              </p>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing <strong>{auditLogs.length}</strong> of <strong>{pagination.total}</strong> audit log entries
            </p>
            {pagination.has_more && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setPagination({ ...pagination, offset: pagination.offset + pagination.limit })}
              >
                Load More
              </Button>
            )}
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center p-12 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No audit log entries found</p>
              <p className="text-sm mt-2">Check back later for agent approval activity</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date/Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent Name / ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Approved/Rejected By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {auditLogs.map((log) => (
                    <tr 
                      key={log.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{new Date(log.created_at).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-500">{new Date(log.created_at).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {log.target?.full_name || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">{log.target_user_id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {log.actor?.full_name || "N/A"}
                          </div>
                          <div className="mt-1">{getRoleBadge(log.actor?.role || "")}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                          {log.details?.reason || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex items-center gap-2"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Details Dialog */}
        <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Audit Log Details
              </DialogTitle>
              <DialogDescription>
                Complete record of agent approval action (read-only)
              </DialogDescription>
            </DialogHeader>

            {selectedLog && (
              <div className="space-y-6 mt-4">
                {/* Action Summary */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Action</p>
                      {getActionBadge(selectedLog.action)}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Date & Time</p>
                      <p className="text-sm font-medium">
                        {new Date(selectedLog.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Agent Details */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" /> Agent Information
                  </h3>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-gray-500">Full Name:</dt>
                      <dd className="font-medium">{selectedLog.target?.full_name || "N/A"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Email:</dt>
                      <dd className="font-medium">{selectedLog.target?.email || "N/A"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Agent ID:</dt>
                      <dd className="font-mono text-xs">{selectedLog.target_user_id}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Current Status:</dt>
                      <dd className="font-medium">{selectedLog.target?.agent_status || "N/A"}</dd>
                    </div>
                  </dl>
                </div>

                {/* Admin Details */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Admin Information
                  </h3>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-gray-500">Admin Name:</dt>
                      <dd className="font-medium">{selectedLog.actor?.full_name || "N/A"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Admin Email:</dt>
                      <dd className="font-medium">{selectedLog.actor?.email || "N/A"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Admin Role:</dt>
                      <dd>{getRoleBadge(selectedLog.actor?.role || "")}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Admin ID:</dt>
                      <dd className="font-mono text-xs">{selectedLog.actor_id}</dd>
                    </div>
                  </dl>
                </div>

                {/* Reason & Details */}
                {selectedLog.details?.reason && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Reason & Outcome</h3>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
                      <p className="text-sm">{selectedLog.details.reason}</p>
                      {selectedLog.details.governance_policy && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-1">Governance Policy:</p>
                          <Badge variant="outline" className="font-mono text-xs">
                            {selectedLog.details.governance_policy}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}