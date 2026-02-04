import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { MainHeader } from "@/components/MainHeader";
import { authService } from "@/services/authService";
import { tierBonusApprovalService } from "@/services/tierBonusApprovalService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Users, FileText, AlertCircle, Award, AlertTriangle, TrendingUp, Globe } from "lucide-react";
import Head from "next/head";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [pendingTierBonusCount, setPendingTierBonusCount] = useState(0);
  const [canApprove, setCanApprove] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        router.push("/admin/login");
        return;
      }

      const profile = await authService.getUserProfile(user.id);
      if (!profile) {
        router.push("/admin/login");
        return;
      }

      const isAdmin = ["worker_admin", "manager_admin", "super_admin", "master_admin"].includes(profile.role);
      if (!isAdmin) {
        router.push("/");
        return;
      }

      setProfile(profile);
      setUserRole(profile.role);
      
      // Check if user can approve tier bonuses (Manager Admin or Super Admin)
      const canApproveFlag = ["manager_admin", "super_admin"].includes(profile.role);
      setCanApprove(canApproveFlag);

      // Load pending tier bonus approvals count (only for Manager/Super Admin)
      if (canApproveFlag) {
        await loadPendingTierBonusCount();
      }

      setLoading(false);
    } catch (error) {
      console.error("Error checking admin access:", error);
      router.push("/admin/login");
    }
  }

  async function loadPendingTierBonusCount() {
    try {
      const approvals = await tierBonusApprovalService.getPendingApprovals();
      setPendingTierBonusCount(approvals.length);
    } catch (error) {
      console.error("Error loading pending tier bonus count:", error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard | Migrate Safely</title>
      </Head>
      <div className="min-h-screen bg-background">
        <MainHeader />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Welcome back, {profile?.full_name || profile?.email}
              </p>
              <Badge variant="outline" className="mt-2">
                <Shield className="h-3 w-3 mr-1" />
                {profile?.role.replace(/_/g, " ").toUpperCase()}
              </Badge>
            </div>

            {/* URGENT: Pending Tier Bonus Approvals Notification */}
            {canApprove && pendingTierBonusCount > 0 && (
              <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <AlertDescription className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-orange-900 dark:text-orange-100 text-lg">
                      URGENT: Pending Tier Bonus Approvals
                    </p>
                    <p className="text-orange-800 dark:text-orange-200 mt-1">
                      {pendingTierBonusCount} tier bonus approval{pendingTierBonusCount !== 1 ? "s" : ""} waiting for review. 
                      Members are waiting for their loyalty tier rewards to be processed.
                    </p>
                  </div>
                  <Link href="/admin/tier-bonus-approvals">
                    <Button className="ml-4 bg-orange-600 hover:bg-orange-700 text-white">
                      <Award className="h-4 w-4 mr-2" />
                      Review Now ({pendingTierBonusCount})
                    </Button>
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Link href="/admin/scam-reports">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-red-600" />
                      Scam Report Review
                    </CardTitle>
                    <CardDescription>Review and verify reported scams</CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              {/* Tier Bonus Approvals - Manager Admin & Super Admin Only */}
              {canApprove && (
                <Link href="/admin/tier-bonus-approvals">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-orange-600" />
                            Tier Bonus Approvals
                          </CardTitle>
                          <CardDescription>Review loyalty tier bonus requests</CardDescription>
                        </div>
                        {pendingTierBonusCount > 0 && (
                          <Badge variant="destructive" className="ml-2">
                            {pendingTierBonusCount}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {pendingTierBonusCount > 0 ? (
                        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-semibold">
                            {pendingTierBonusCount} pending approval{pendingTierBonusCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No pending approvals</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )}

              {/* Tier Achievement Config - Super Admin Only */}
              {profile?.role === "super_admin" && (
                <Link href="/admin/tier-achievement-config">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                        Tier Achievement Config
                      </CardTitle>
                      <CardDescription>Manage tier achievement bonus amounts</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Configure one-time lump-sum bonuses per tier
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )}

              {/* Tier Achievement Approvals - Manager Admin & Super Admin */}
              {canApprove && (
                <Link href="/admin/tier-achievement-approvals">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-green-600" />
                        Tier Achievement Approvals
                      </CardTitle>
                      <CardDescription>Review one-time tier achievement bonuses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Approve lump-sum bonuses for tier achievements
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )}

              <Link href="/admin/prize-draws">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Prize Draws
                    </CardTitle>
                    <CardDescription>Manage and schedule prize draws</CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/admin/reports">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Admin Reports
                    </CardTitle>
                    <CardDescription>Generate and view admin reports</CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              {/* System Settings - Super Admin Only */}
              {profile?.role === "super_admin" && (
                <Link href="/admin/system-settings">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-purple-600" />
                        System Settings
                      </CardTitle>
                      <CardDescription>Configure global system settings</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              )}

              <Link href="/admin/deployment-info">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-blue-600" />
                      Deployment Info
                    </CardTitle>
                    <CardDescription>View country and currency configuration</CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/admin/document-verifications">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      Document Verifications
                    </CardTitle>
                    <CardDescription>Review ticket-based document requests</CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              {/* System Management - Chairman Only */}
              {userRole === "chairman" && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-purple-600" />
                        System Management
                      </CardTitle>
                      <CardDescription>Manage system-wide settings and configurations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Configure system-wide settings and manage user roles
                      </p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}