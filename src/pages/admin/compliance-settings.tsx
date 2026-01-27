import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface ComplianceSettings {
  id: string;
  country_code: string;
  trade_license_no: string;
  trade_license_expiry: string | null;
  tin_no: string | null;
  company_registration_no: string | null;
  display_on_home: boolean;
  updated_at: string;
}

export default function AdminComplianceSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [tradeLicenseNo, setTradeLicenseNo] = useState("");
  const [tradeLicenseExpiry, setTradeLicenseExpiry] = useState("");
  const [tinNo, setTinNo] = useState("");
  const [companyRegistrationNo, setCompanyRegistrationNo] = useState("");
  const [displayOnHome, setDisplayOnHome] = useState(true);

  useEffect(() => {
    checkAuthAndLoadSettings();
  }, []);

  async function checkAuthAndLoadSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "super_admin") {
        router.push("/dashboard");
        return;
      }

      await loadSettings();
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/dashboard");
    }
  }

  async function loadSettings() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/admin/compliance-settings", {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load settings");
      }

      const settings: ComplianceSettings = await response.json();

      setTradeLicenseNo(settings.trade_license_no);
      setTradeLicenseExpiry(settings.trade_license_expiry || "");
      setTinNo(settings.tin_no || "");
      setCompanyRegistrationNo(settings.company_registration_no || "");
      setDisplayOnHome(settings.display_on_home);
    } catch (error) {
      console.error("Load settings error:", error);
      setMessage({ type: "error", text: "Failed to load compliance settings" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setMessage(null);

      if (!tradeLicenseNo.trim()) {
        setMessage({ type: "error", text: "Trade License No is required" });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/admin/compliance-settings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tradeLicenseNo: tradeLicenseNo.trim(),
          tradeLicenseExpiry: tradeLicenseExpiry.trim() || null,
          tinNo: tinNo.trim() || null,
          companyRegistrationNo: companyRegistrationNo.trim() || null,
          displayOnHome,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save settings");
      }

      setMessage({ type: "success", text: "Compliance settings updated successfully" });
    } catch (error) {
      console.error("Save error:", error);
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Failed to save settings" 
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Compliance Settings - Admin"
        description="Manage Bangladesh business registration and compliance information"
      />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Compliance Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage Bangladesh business registration and compliance information
            </p>
          </div>

          {message && (
            <Alert className={`mb-6 ${message.type === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              {message.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Bangladesh Business Registration</CardTitle>
              <CardDescription>
                Update business registration details displayed on the homepage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tradeLicenseNo">
                  Trade License No <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tradeLicenseNo"
                  value={tradeLicenseNo}
                  onChange={(e) => setTradeLicenseNo(e.target.value)}
                  placeholder="e.g., TRAD/DHAKA-12345/2026"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tradeLicenseExpiry">Trade License Expiry Date</Label>
                <Input
                  id="tradeLicenseExpiry"
                  type="date"
                  value={tradeLicenseExpiry}
                  onChange={(e) => setTradeLicenseExpiry(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tinNo">TIN (Tax Identification Number)</Label>
                <Input
                  id="tinNo"
                  value={tinNo}
                  onChange={(e) => setTinNo(e.target.value)}
                  placeholder="e.g., 123456789012"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyRegistrationNo">Company Registration No</Label>
                <Input
                  id="companyRegistrationNo"
                  value={companyRegistrationNo}
                  onChange={(e) => setCompanyRegistrationNo(e.target.value)}
                  placeholder="e.g., C-987654321"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="displayOnHome" className="text-base">
                    Display on Homepage
                  </Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Show compliance information on the public homepage
                  </p>
                </div>
                <Switch
                  id="displayOnHome"
                  checked={displayOnHome}
                  onCheckedChange={setDisplayOnHome}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Settings"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> These details will be displayed in the compliance section on the homepage 
              when "Display on Homepage" is enabled. Use "PENDING" for fields that are awaiting approval.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}