import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { MainHeader } from "@/components/MainHeader";
import { authService } from "@/services/authService";
import { systemSettingsService, SystemSetting } from "@/services/systemSettingsService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Settings, Shield, AlertCircle, CheckCircle, Lock, Unlock } from "lucide-react";
import Head from "next/head";
import { supabase } from "@/integrations/supabase/client";

export default function SystemSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [memberRegistrationEnabled, setMemberRegistrationEnabled] = useState(false);
  const [agentApplicationsEnabled, setAgentApplicationsEnabled] = useState(false);
  
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    checkSuperAdminAccess();
  }, []);

  async function checkSuperAdminAccess() {
    try {
      const user = await authService.getCurrentUser();
      
      if (!user) {
        router.push("/admin/login");
        return;
      }

      const profile = await authService.getUserProfile(user.id);
      
      if (!profile || profile.role !== "super_admin") {
        setErrorMessage("Access Denied: Super Admin privileges required");
        setLoading(false);
        setTimeout(() => router.push("/admin"), 2000);
        return;
      }

      const { data: employee } = await supabase
        .from("employees")
        .select("role_category")
        .eq("user_id", user.id)
        .maybeSingle();

      const isChairman = employee?.role_category === "chairman";

      if (!isChairman) {
        setErrorMessage("Access Denied: Chairman privileges required");
        setLoading(false);
        setTimeout(() => router.push("/admin"), 2000);
        return;
      }

      setIsSuperAdmin(true);
      await loadSettings();
    } catch (error) {
      console.error("Error checking admin access:", error);
      router.push("/admin/login");
    }
  }

  async function loadSettings() {
    try {
      setLoading(true);
      
      const allSettings = await systemSettingsService.getAllSettings();
      setSettings(allSettings);
      
      const memberReg = allSettings.find(s => s.settingKey === "member_registration_enabled");
      const agentApp = allSettings.find(s => s.settingKey === "agent_applications_enabled");
      
      setMemberRegistrationEnabled(memberReg?.settingValue === "true");
      setAgentApplicationsEnabled(agentApp?.settingValue === "true");
      
      setLoading(false);
    } catch (error) {
      console.error("Error loading settings:", error);
      setErrorMessage("Failed to load system settings");
      setLoading(false);
    }
  }

  async function handleToggleMemberRegistration() {
    setUpdating(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = memberRegistrationEnabled
        ? await systemSettingsService.disableMemberRegistration()
        : await systemSettingsService.enableMemberRegistration();

      if (result.success) {
        setMemberRegistrationEnabled(!memberRegistrationEnabled);
        setSuccessMessage(
          memberRegistrationEnabled
            ? "Member registration has been disabled"
            : "Member registration has been enabled"
        );
        await loadSettings();
      } else {
        setErrorMessage(result.error || "Failed to update setting");
      }
    } catch (error) {
      console.error("Error toggling member registration:", error);
      setErrorMessage("An unexpected error occurred");
    } finally {
      setUpdating(false);
    }
  }

  async function handleToggleAgentApplications() {
    setUpdating(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = agentApplicationsEnabled
        ? await systemSettingsService.disableAgentApplications()
        : await systemSettingsService.enableAgentApplications();

      if (result.success) {
        setAgentApplicationsEnabled(!agentApplicationsEnabled);
        setSuccessMessage(
          agentApplicationsEnabled
            ? "Agent applications have been disabled"
            : "Agent applications have been enabled"
        );
        await loadSettings();
      } else {
        setErrorMessage(result.error || "Failed to update setting");
      }
    } catch (error) {
      console.error("Error toggling agent applications:", error);
      setErrorMessage("An unexpected error occurred");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading system settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <MainHeader />
        <div className="flex items-center justify-center py-20">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>System Settings | Admin Portal</title>
      </Head>
      <div className="min-h-screen bg-background">
        <MainHeader />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
                <p className="text-muted-foreground mt-2">
                  Manage global system configuration and feature flags
                </p>
              </div>
              <Badge variant="outline" className="w-fit">
                <Shield className="h-3 w-3 mr-1" />
                SUPER ADMIN ONLY
              </Badge>
            </div>

            {successMessage && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <Settings className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-1">Pre-Launch Configuration</p>
                <p className="text-sm">
                  These settings control new registrations and applications. Existing users are never affected.
                  All changes are logged in the audit trail.
                </p>
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Registration & Application Controls
                </CardTitle>
                <CardDescription>
                  Enable or disable new member sign-ups and agent applications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Member Registration Toggle */}
                <div className="flex items-center justify-between space-x-4 p-4 border rounded-lg">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="member-registration" className="text-base font-semibold">
                        Member Registration
                      </Label>
                      <Badge variant={memberRegistrationEnabled ? "default" : "secondary"}>
                        {memberRegistrationEnabled ? (
                          <>
                            <Unlock className="h-3 w-3 mr-1" />
                            Enabled
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3 mr-1" />
                            Paused
                          </>
                        )}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {memberRegistrationEnabled
                        ? "New members can sign up and create accounts"
                        : "New member registrations are temporarily disabled"}
                    </p>
                  </div>
                  <Switch
                    id="member-registration"
                    checked={memberRegistrationEnabled}
                    onCheckedChange={handleToggleMemberRegistration}
                    disabled={updating}
                  />
                </div>

                {/* Agent Applications Toggle */}
                <div className="flex items-center justify-between space-x-4 p-4 border rounded-lg">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="agent-applications" className="text-base font-semibold">
                        Agent Applications
                      </Label>
                      <Badge variant={agentApplicationsEnabled ? "default" : "secondary"}>
                        {agentApplicationsEnabled ? (
                          <>
                            <Unlock className="h-3 w-3 mr-1" />
                            Open
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3 mr-1" />
                            Closed
                          </>
                        )}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {agentApplicationsEnabled
                        ? "New agent applications are being accepted"
                        : "New agent applications are temporarily closed"}
                    </p>
                  </div>
                  <Switch
                    id="agent-applications"
                    checked={agentApplicationsEnabled}
                    onCheckedChange={handleToggleAgentApplications}
                    disabled={updating}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                    Important Notes
                  </h3>
                  <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 list-disc list-inside">
                    <li>Existing members can always log in and access their accounts</li>
                    <li>Existing agents and applications are never affected</li>
                    <li>Admin access is never restricted by these settings</li>
                    <li>All setting changes are logged with admin ID and timestamp</li>
                    <li>Settings can be changed instantly at any time</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}