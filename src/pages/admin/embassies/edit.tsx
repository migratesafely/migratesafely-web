import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Embassy = Database["public"]["Tables"]["embassies"]["Row"];

export default function EditEmbassyPage() {
  const router = useRouter();
  const { id: queryId } = router.query;
  const id = Array.isArray(queryId) ? queryId[0] : queryId;

  const [embassy, setEmbassy] = useState<Embassy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [sourceUrl, setSourceUrl] = useState("");
  const [contactSummary, setContactSummary] = useState("");
  const [contactDetails, setContactDetails] = useState("");

  useEffect(() => {
    if (id) {
      loadEmbassy();
    }
  }, [id]);

  const loadEmbassy = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (!profile || !["worker_admin", "manager_admin", "super_admin"].includes(profile.role)) {
        router.push("/dashboard");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("embassies")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      setEmbassy(data);
      setSourceUrl(data.source_url || "");
      setContactSummary(data.contact_summary || "");
      setContactDetails(data.contact_details || "");
    } catch (err) {
      console.error("Error loading embassy:", err);
      setError("Failed to load embassy details");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("You must be logged in");
        return;
      }

      const response = await fetch("/api/admin/embassies/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          embassyId: id,
          sourceUrl: sourceUrl || undefined,
          contactSummary: contactSummary || undefined,
          contactDetails: contactDetails || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update embassy");
      }

      setSuccess("Embassy updated successfully!");
      setEmbassy(result.embassy);

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Error saving embassy:", err);
      setError(err instanceof Error ? err.message : "Failed to save embassy");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Loading embassy details...</div>
        </main>
      </div>
    );
  }

  if (!embassy) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Embassy not found</AlertDescription>
          </Alert>
          <Button onClick={() => router.push("/dashboard")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Edit Embassy</CardTitle>
            <CardDescription>
              Update embassy source and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 text-green-900 border-green-200">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="embassyName">Embassy Name</Label>
              <Input
                id="embassyName"
                value={embassy.embassy_name}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={embassy.website || "N/A"}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceUrl">Source URL</Label>
              <Input
                id="sourceUrl"
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://example.com/embassy-contact"
              />
              <p className="text-sm text-muted-foreground">
                Official source where this information was obtained
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactSummary">Contact Summary</Label>
              <Textarea
                id="contactSummary"
                value={contactSummary}
                onChange={(e) => setContactSummary(e.target.value)}
                placeholder="Short summary of contact information"
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                Brief summary of key contact details
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactDetails">Contact Details</Label>
              <Textarea
                id="contactDetails"
                value={contactDetails}
                onChange={(e) => setContactDetails(e.target.value)}
                placeholder="Paste complete contact information from official source"
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground">
                Large text block for complete contact information
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            {embassy.last_verified_at && (
              <div className="pt-4 border-t text-sm text-muted-foreground">
                Last verified: {new Date(embassy.last_verified_at).toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}