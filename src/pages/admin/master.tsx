import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Shield, AlertTriangle, Users, Lock, Unlock } from "lucide-react";
import { MainHeader } from "@/components/MainHeader";

interface SystemSettings {
  admin_access_suspended: boolean;
}

interface Chairman {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

export default function MasterAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({
    admin_access_suspended: false,
  });
  const [chairman, setChairman] = useState<Chairman | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    checkMasterAdminAccess();
  }, []);

  const checkMasterAdminAccess = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile?.role !== "master_admin") {
        router.push("/dashboard");
        return;
      }

      setIsMasterAdmin(true);
      await loadSettings();
      await loadChairman();
    } catch (err) {
      console.error("Error checking access:", err);
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value")
        .eq("setting_key", "admin_access_suspended")
        .single();

      if (data) {
        setSettings({
          admin_access_suspended: data.setting_value === "true",
        });
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    }
  };

  const loadChairman = async () => {
    try {
      const { data } = await supabase
        .from("employees")
        .select("id, user_id, created_at")
        .eq("role_category", "chairman")
        .eq("status", "active")
        .single();

      if (data) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("id", data.user_id)
          .single();

        if (profile) {
          setChairman({
            id: data.id,
            full_name: profile.full_name || "Unknown",
            email: profile.email || "Unknown",
            created_at: data.created_at,
          });
        }
      }
    } catch (err) {
      console.error("Error loading chairman:", err);
    }
  };

  const toggleAdminSuspension = async () => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError("Session expired");
        return;
      }

      const newValue = !settings.admin_access_suspended;

      // Update system setting
      const { error: updateError } = await supabase
        .from("system_settings")
        .update({
          setting_value: String(newValue),
          updated_by: session.user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("setting_key", "admin_access_suspended");

      if (updateError) throw updateError;

      // Log action in audit_logs
      await supabase.from("audit_logs").insert({
        user_id: session.user.id,
        action: newValue
          ? "ADMIN_SUSPENSION_ENABLED"
          : "ADMIN_SUSPENSION_DISABLED",
        table_name: "system_settings",
        record_id: null,
        old_values: { admin_access_suspended: settings.admin_access_suspended },
        new_values: { admin_access_suspended: newValue },
      });

      setSettings({ admin_access_suspended: newValue });
      setSuccess(
        newValue
          ? "Admin access suspended - Only Master Admin can login"
          : "Admin access restored - All admins can login"
      );
    } catch (err: unknown) {
      console.error("Error toggling suspension:", err);
      setError(
        err instanceof Error ? err.message : "Failed to toggle suspension"
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Master Admin Panel...</p>
        </div>
      </div>
    );
  }

  if (!isMasterAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Master Admin Control Panel
            </h1>
          </div>
          <p className="text-gray-600">
            Emergency continuity controls - Founder access only
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-500 bg-green-50">
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Admin Suspension Control */}
        <Card className="p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {settings.admin_access_suspended ? (
                  <Lock className="h-5 w-5 text-red-600" />
                ) : (
                  <Unlock className="h-5 w-5 text-green-600" />
                )}
                <h2 className="text-xl font-semibold">
                  Global Admin Suspension
                </h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                When enabled, blocks ALL admin logins (Chairman, Manager Admin,
                Worker Admin). Only Master Admin can authenticate. This is an
                instant, reversible emergency lock.
              </p>
              <div className="flex items-center gap-4">
                <Switch
                  checked={settings.admin_access_suspended}
                  onCheckedChange={toggleAdminSuspension}
                  disabled={actionLoading}
                />
                <span
                  className={`font-medium ${
                    settings.admin_access_suspended
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {settings.admin_access_suspended
                    ? "SUSPENDED - Admins Locked Out"
                    : "ACTIVE - Normal Admin Access"}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Separator className="my-8" />

        {/* Chairman Management */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Chairman Management</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Only Master Admin can create, replace, or remove the Chairman. This
            control is hidden from all normal admin interfaces.
          </p>

          {chairman ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900">
                    Current Chairman
                  </p>
                  <p className="text-sm text-gray-600">{chairman.full_name}</p>
                  <p className="text-sm text-gray-500">{chairman.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Appointed: {new Date(chairman.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // TODO: Implement replace chairman
                    setError("Replace Chairman feature - Coming soon");
                  }}
                  disabled={actionLoading}
                >
                  Replace Chairman
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    // TODO: Implement remove chairman
                    setError("Remove Chairman feature - Coming soon");
                  }}
                  disabled={actionLoading}
                >
                  Remove Chairman
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600 mb-4">No Chairman currently appointed</p>
              <Button
                onClick={() => {
                  // TODO: Implement create chairman
                  setError("Create Chairman feature - Coming soon");
                }}
                disabled={actionLoading}
              >
                Appoint Chairman
              </Button>
            </div>
          )}
        </Card>

        {/* Warning Notice */}
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Master Admin Notice:</strong> All actions in this panel are
            logged internally for audit purposes. This interface is hidden from
            regulators and normal admin UIs. Use only for emergency continuity
            management.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}