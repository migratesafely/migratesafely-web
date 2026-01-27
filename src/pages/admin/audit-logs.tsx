import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, AlertCircle } from "lucide-react";

type AuditLog = {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  action: string | null;
  target_user_id: string | null;
  target_name: string | null;
  target_email: string | null;
  table_name: string | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
};

export default function AuditLogsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [limit, setLimit] = useState(100);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchLogs();
    }
  }, [limit]);

  useEffect(() => {
    filterLogs();
  }, [searchQuery, logs]);

  async function checkAdminAccess() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/admin/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || !["super_admin", "manager_admin"].includes(profile.role || "")) {
      router.push("/dashboard");
      return;
    }

    await fetchLogs(session.access_token);
    setLoading(false);
  }

  async function fetchLogs(token?: string) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const authToken = token || session?.access_token;

      if (!authToken) return;

      const response = await fetch(`/api/admin/audit-logs/list?limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setFilteredLogs(data.logs || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    }
  }

  function filterLogs() {
    if (!searchQuery.trim()) {
      setFilteredLogs(logs);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = logs.filter((log) => {
      const searchText = [
        log.actor_name,
        log.actor_email,
        log.action,
        log.target_name,
        log.target_email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchText.includes(query);
    });
    setFilteredLogs(filtered);
  }

  function getActionBadgeColor(action: string | null) {
    if (!action) return "bg-gray-100 text-gray-800 border-gray-300";

    if (action.includes("CREATED")) return "bg-green-100 text-green-800 border-green-300";
    if (action.includes("DELETED") || action.includes("SUSPENDED"))
      return "bg-red-100 text-red-800 border-red-300";
    if (action.includes("UPDATED") || action.includes("CHANGED"))
      return "bg-blue-100 text-blue-800 border-blue-300";
    if (action.includes("UNSUSPENDED")) return "bg-green-100 text-green-800 border-green-300";

    return "bg-gray-100 text-gray-800 border-gray-300";
  }

  function formatActionName(action: string | null) {
    if (!action) return "Unknown";
    return action
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  function formatDetails(log: AuditLog) {
    const details: string[] = [];

    if (log.old_values && Object.keys(log.old_values).length > 0) {
      details.push(`Old: ${JSON.stringify(log.old_values)}`);
    }

    if (log.new_values && Object.keys(log.new_values).length > 0) {
      details.push(`New: ${JSON.stringify(log.new_values)}`);
    }

    return details.length > 0 ? details.join(" → ") : "—";
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading audit logs...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold">Audit Logs</h1>
                <p className="text-muted-foreground">Track all admin actions and changes</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={limit === 100 ? "default" : "outline"}
                size="sm"
                onClick={() => setLimit(100)}
              >
                100
              </Button>
              <Button
                variant={limit === 200 ? "default" : "outline"}
                size="sm"
                onClick={() => setLimit(200)}
              >
                200
              </Button>
              <Button
                variant={limit === 300 ? "default" : "outline"}
                size="sm"
                onClick={() => setLimit(300)}
              >
                300
              </Button>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>
                  {filteredLogs.length} of {logs.length} logs
                </CardDescription>
              </div>
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by actor, action, or target..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Date</th>
                    <th className="text-left py-3 px-4 font-semibold">Actor</th>
                    <th className="text-left py-3 px-4 font-semibold">Action</th>
                    <th className="text-left py-3 px-4 font-semibold">Target</th>
                    <th className="text-left py-3 px-4 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? (
                          <div className="flex flex-col items-center gap-2">
                            <AlertCircle className="h-8 w-8 text-muted-foreground" />
                            <p>No logs found matching your search</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            <p>No audit logs available</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 text-sm">
                          {log.created_at
                            ? new Date(log.created_at).toLocaleString()
                            : "—"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div className="font-medium">{log.actor_name || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground">
                              {log.actor_email || "—"}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={getActionBadgeColor(log.action)}>
                            {formatActionName(log.action)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div className="font-medium">{log.target_name || "—"}</div>
                            <div className="text-xs text-muted-foreground">
                              {log.target_email || "—"}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm max-w-xs truncate">
                          {formatDetails(log)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}