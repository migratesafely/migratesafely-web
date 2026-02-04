import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { MainHeader } from "@/components/MainHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LanguageSelector } from "@/components/LanguageSelector";
import { 
  Users, Activity, CheckCircle, Mail, AlertTriangle, Shield, Eye 
} from "lucide-react";
import { authService } from "@/services/authService";
import { agentDashboardService, type AgentStats, type AssignedMember } from "@/services/agentDashboardService";
import { AgentMessaging } from "@/components/AgentMessaging";

export default function AgentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [assignedMembers, setAssignedMembers] = useState<AssignedMember[]>([]);
  const [agentId, setAgentId] = useState<string>("");

  useEffect(() => {
    checkAccessAndLoadData();
  }, []);

  async function checkAccessAndLoadData() {
    try {
      const user = await authService.getCurrentUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      setAgentId(user.id);

      // Check if user is an approved agent
      const approved = await agentDashboardService.isApprovedAgent(user.id);
      
      if (!approved) {
        // Get profile to determine redirect
        const profile = await agentDashboardService.getAgentProfile(user.id);
        
        if (profile?.role !== "agent") {
          // Not an agent at all
          router.push("/dashboard");
          return;
        }
        
        if (profile?.agent_status === "PENDING") {
          router.push("/agents/pending");
          return;
        }
        
        if (profile?.agent_status === "SUSPENDED") {
          router.push("/agents/suspended");
          return;
        }
        
        // Fallback
        router.push("/dashboard");
        return;
      }

      // Load dashboard data
      const [statsData, membersData] = await Promise.all([
        agentDashboardService.getAgentStats(user.id),
        agentDashboardService.getAssignedMembers(user.id),
      ]);

      setStats(statsData);
      setAssignedMembers(membersData);
    } catch (error) {
      console.error("Error loading agent dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadgeColor(status: string) {
    switch (status.toUpperCase()) {
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "ASSIGNED":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "IN_PROGRESS":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <MainHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-12 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>Agent Dashboard - MigrateSafely</title>
      </Head>

      <MainHeader />
      
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-end gap-4">
          <LanguageSelector variant="compact" showLabel={false} />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agent Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your assigned members and communications
            </p>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={
                  stats?.status === "ACTIVE" 
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                }>
                  {stats?.status || "Unknown"}
                </Badge>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Agent Status</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  Assigned Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.assignedMembersCount || 0}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total members assigned</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-gray-500" />
                  Active Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeRequestsCount || 0}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Currently in progress</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-gray-500" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.completedRequestsCount || 0}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Successfully completed</p>
              </CardContent>
            </Card>
          </div>

          {/* Assigned Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Assigned Members
              </CardTitle>
              <CardDescription>
                Members assigned to you by administrators
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignedMembers.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No members assigned yet</p>
                  <p className="text-sm mt-2">Administrators will assign members to you when appropriate</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedMembers.map((member) => (
                    <div
                      key={member.requestId}
                      className="border rounded-lg p-4 bg-white dark:bg-gray-800 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {member.memberName || "Unnamed Member"} #{member.membershipNumber}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{member.memberEmail}</p>
                        </div>
                        <Badge className={getStatusBadgeColor(member.status)}>
                          {member.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Request Type:</span>
                          <p className="font-medium">{member.requestType}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Destination:</span>
                          <p className="font-medium">{member.destinationCountry}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Assigned:</span>
                          <p className="font-medium">
                            {member.assignedAt ? new Date(member.assignedAt).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Outcome:</span>
                          <p className="font-medium">{member.outcomeStatus}</p>
                        </div>
                      </div>

                      {member.notes && (
                        <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 mb-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notes:</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{member.notes}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Eye className="h-3 w-3" />
                        <span>Read-Only Profile</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Internal Messaging */}
          {agentId && <AgentMessaging agentId={agentId} />}

          {/* Compliance Notice */}
          <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <AlertTitle className="text-yellow-900 dark:text-yellow-200">
              Compliance Notice
            </AlertTitle>
            <AlertDescription className="text-yellow-800 dark:text-yellow-300 mt-2">
              <p className="font-semibold mb-2">Important: Please read carefully</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Agents do NOT guarantee visa approvals or migration outcomes</li>
                <li>All actions and communications are monitored and permanently logged</li>
                <li>Any violations of guidelines or misconduct will lead to immediate suspension</li>
                <li>Maintain professional conduct at all times</li>
                <li>Do not make promises or guarantees to members</li>
                <li>All fees and charges must be transparent and documented</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </main>
    </div>
  );
}