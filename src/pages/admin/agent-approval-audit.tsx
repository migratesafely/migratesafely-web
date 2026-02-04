import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { MainHeader } from "@/components/MainHeader";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, CheckCircle, XCircle, AlertTriangle, Eye, Calendar, Filter, Download, User } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  actor_id: string;
  target_user_id: string;
  table_name?: string;
  record_id?: string;
  old_values?: any;
  new_values?: any;
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

export default function AgentApprovalAuditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  
  // Filters
  const [actionFilter, setActionFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [adminFilter, setAdminFilter] = useState<string>("");
  
  // Pagination
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

      // Check admin role
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
    } catch (error) {
      console.error("Error checking access:", error);
      router.push("/admin");
    }
  }

  useEffect(() => {
    checkAccessAndLoadData();
  }, [actionFilter, dateFrom, dateTo, adminFilter, pagination.offset]);

  const checkAccessAndLoadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Check admin role
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

      if (actionFilter) params.append("action_filter", actionFilter);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      if (adminFilter) params.append("admin_id", adminFilter);

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
      console.error("Error loading audit logs:", error);
    } finally {
      setLoading(false);
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

  const exportToCSV = () => {
    const headers = ["Date/Time", "Action", "Agent Name", "Agent Email", "Admin Name", "Admin Role", "Reason", "Previous Status", "New Status"];
    const rows = auditLogs.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.action,
      log.target?.full_name || "N/A",
      log.target?.email || "N/A",
      log.actor?.full_name || "N/A",
      log.actor?.role || "N/A",
      log.details?.reason || "N/A",
      log.old_values?.agent_status || log.old_values?.role || "N/A",
      log.new_values?.agent_status || log.new_values?.role || "N/A"
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agent-approval-audit-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const resetFilters = () => {
    setActionFilter("");
    setDateFrom("");
    setDateTo("");
    setAdminFilter("");
    setPagination({ ...pagination, offset: 0 });
  };

  async function handleStatusAction(agentId: string, action: "approve" | "reject" | "suspend" | "reinstate", reason: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Check if user is Chairman
      const { data: employee } = await supabase
        .from("employees")
        .select("role_category")
        .eq("user_id", session.user.id)
        .maybeSingle();

      const isChairman = employee?.role_category === "chairman";
      if (!isChairman) {
        alert("Only Chairman can perform this action");
        return;
      }
    } catch (error) {
      console.error("Error handling status action:", error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MainHeader />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Agent Approval Audit Log
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Complete traceability of all agent approvals and rejections
              </p>
            </div>
          </div>
          
          <Button onClick={exportToCSV} variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Governance Notice */}
        <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-6">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-purple-800">Governance & Accountability</h3>
              <p className="text-sm text-purple-700 mt-1">
                This audit log provides complete traceability of all agent approval actions to ensure governance compliance 
                and prevent conflicts of interest or corruption. All approval and rejection actions are permanently recorded 
                with full context including the admin who performed the action, timestamp, and reason.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="action-filter" className="text-sm font-medium mb-2 block">Action</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger id="action-filter">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Actions</SelectItem>
                  <SelectItem value="AGENT_APPROVED">Approved</SelectItem>
                  <SelectItem value="AGENT_REJECTED">Rejected</SelectItem>
                  <SelectItem value="AGENT_SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="AGENT_REINSTATED">Reinstated</SelectItem>
                  <SelectItem value="AGENT_APPROVE_ATTEMPT_DENIED">Denied (Approve)</SelectItem>
                  <SelectItem value="AGENT_REJECT_ATTEMPT_DENIED">Denied (Reject)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date-from" className="text-sm font-medium mb-2 block">Date From</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="date-to" className="text-sm font-medium mb-2 block">Date To</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={resetFilters} variant="outline" className="w-full">
                Reset Filters
              </Button>
            </div>
          </div>
        </Card>

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
              <p className="text-sm mt-2">Try adjusting your filters or check back later</p>
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
                      Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin
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
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={() => setSelectedLog(log)}
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
                            <div className="text-xs text-gray-500">{log.target?.email || "N/A"}</div>
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
                        <Button variant="ghost" size="sm" className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          View Details
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
                Complete record of agent approval action
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

                {/* Status Changes */}
                {(selectedLog.old_values || selectedLog.new_values) && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Status Changes</h3>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 mb-2">Previous Status:</p>
                          <div className="space-y-1">
                            {selectedLog.old_values?.agent_status && (
                              <p><span className="font-medium">Agent Status:</span> {selectedLog.old_values.agent_status}</p>
                            )}
                            {selectedLog.old_values?.role && (
                              <p><span className="font-medium">Role:</span> {selectedLog.old_values.role}</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-2">New Status:</p>
                          <div className="space-y-1">
                            {selectedLog.new_values?.agent_status && (
                              <p><span className="font-medium">Agent Status:</span> {selectedLog.new_values.agent_status}</p>
                            )}
                            {selectedLog.new_values?.role && (
                              <p><span className="font-medium">Role:</span> {selectedLog.new_values.role}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reason & Details */}
                {selectedLog.details && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Reason & Additional Details</h3>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
                      {selectedLog.details.reason && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Reason:</p>
                          <p className="text-sm">{selectedLog.details.reason}</p>
                        </div>
                      )}
                      {selectedLog.details.governance_policy && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Governance Policy:</p>
                          <Badge variant="outline" className="font-mono text-xs">
                            {selectedLog.details.governance_policy}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Raw Data (for debugging) */}
                <details className="border-t pt-4">
                  <summary className="cursor-pointer font-semibold text-sm text-gray-600 hover:text-gray-900">
                    View Raw Data (Technical)
                  </summary>
                  <pre className="mt-3 p-4 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}