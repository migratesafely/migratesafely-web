import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { scamReportService } from "@/services/scamReportService";
import { MainHeader } from "@/components/MainHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, XCircle, Eye, ArrowLeft, ExternalLink } from "lucide-react";

interface ReportDetails {
  id: string;
  scammer_name: string;
  scammer_company: string | null;
  scammer_contact: string | null;
  scammer_photo_url: string | null;
  last_known_address: string | null;
  incident_description: string;
  amount_lost: number | null;
  currency: string | null;
  incident_date: string | null;
  evidence_file_urls: string[];
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
    country_code: string | null;
  };
}

export default function ReviewScamReport() {
  const router = useRouter();
  const { id } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [report, setReport] = useState<ReportDetails | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Check if user is chairman
      const { data: employee } = await supabase
        .from("employees")
        .select("role_category")
        .eq("user_id", user.id)
        .maybeSingle();

      const isChairman = employee?.role_category === "chairman";
      
      // Get profile role for fallback admin check
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!isChairman && !["manager_admin", "worker_admin"].includes(profile?.role || "")) {
        router.push("/dashboard");
        return;
      }

      setAuthorized(true);

      if (id) {
        // Load report details
        const result = await scamReportService.getReportById(id as string);
        if (result.success && result.report) {
          setReport(result.report);
        } else {
          setError("Report not found");
        }
      }
    } catch (err) {
      console.error("Error checking access:", err);
      router.push("/admin");
    }
  }

  async function handleMarkUnderReview() {
    if (!report) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const result = await scamReportService.markUnderReview(report.id, user.id);

      if (result.success) {
        setSuccess("Report marked as under review");
        setTimeout(() => router.push("/admin/scam-reports"), 2000);
      } else {
        setError(result.error || "Failed to update status");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify() {
    if (!report) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/admin/scam-reports/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          reportId: report.id,
          reviewNotes: reviewNotes || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to verify report");
      }

      setSuccess("Report verified successfully");
      setTimeout(() => router.push("/admin/scam-reports"), 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!report) return;

    if (!reviewNotes || reviewNotes.trim().length === 0) {
      setError("Review notes are required for rejection");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/admin/scam-reports/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          reportId: report.id,
          reviewNotes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reject report");
      }

      setSuccess("Report rejected successfully");
      setTimeout(() => router.push("/admin/scam-reports"), 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <MainHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!authorized || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <MainHeader />
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "Access denied or report not found"}</AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <MainHeader />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/scam-reports")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Button>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 text-green-900 border-green-200">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Scam Report Details</CardTitle>
              <Badge variant={report.status === "submitted" ? "outline" : "default"}>
                {report.status.replace("_", " ").toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-slate-700 mb-1">Scammer Name</h3>
                <p className="text-slate-900">{report.scammer_name}</p>
              </div>

              {report.scammer_company && (
                <div>
                  <h3 className="font-semibold text-slate-700 mb-1">Company</h3>
                  <p className="text-slate-900">{report.scammer_company}</p>
                </div>
              )}

              {report.scammer_contact && (
                <div>
                  <h3 className="font-semibold text-slate-700 mb-1">Contact Details</h3>
                  <p className="text-slate-900">{report.scammer_contact}</p>
                </div>
              )}

              {report.last_known_address && (
                <div>
                  <h3 className="font-semibold text-slate-700 mb-1">Last Known Address</h3>
                  <p className="text-slate-900 whitespace-pre-wrap">{report.last_known_address}</p>
                </div>
              )}

              {report.amount_lost && (
                <div>
                  <h3 className="font-semibold text-slate-700 mb-1">Amount Lost</h3>
                  <p className="text-slate-900">
                    {report.amount_lost} {report.currency || ""}
                  </p>
                </div>
              )}

              {report.incident_date && (
                <div>
                  <h3 className="font-semibold text-slate-700 mb-1">Incident Date</h3>
                  <p className="text-slate-900">
                    {new Date(report.incident_date).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-slate-700 mb-1">Reported By</h3>
                <p className="text-slate-900">{report.profiles?.full_name}</p>
                <p className="text-sm text-slate-600">{report.profiles?.email}</p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-700 mb-1">Submitted On</h3>
                <p className="text-slate-900">
                  {new Date(report.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-700 mb-2">Incident Description</h3>
              <p className="text-slate-900 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg">
                {report.incident_description}
              </p>
            </div>

            {report.scammer_photo_url && (
              <div>
                <h3 className="font-semibold text-slate-700 mb-2">Scammer Photo</h3>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <img
                    src={report.scammer_photo_url}
                    alt="Scammer"
                    className="max-w-md max-h-96 object-contain rounded-lg border border-slate-200"
                  />
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-slate-700 mb-2">
                Evidence Files ({report.evidence_file_urls?.length || 0})
              </h3>
              {report.evidence_file_urls && report.evidence_file_urls.length > 0 ? (
                <div className="space-y-2">
                  {report.evidence_file_urls.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <Eye className="h-4 w-4 text-slate-600" />
                      <span className="text-sm text-slate-700 flex-1">
                        Evidence File {index + 1}
                      </span>
                      <ExternalLink className="h-4 w-4 text-slate-400" />
                    </a>
                  ))}
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No evidence files uploaded</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Review Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Review Notes {report.status === "submitted" && "(Optional)"}
                {report.status !== "submitted" && <span className="text-red-500">*</span>}
              </label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add notes about your review decision..."
                rows={4}
                className="w-full"
              />
              {report.status === "submitted" && (
                <p className="text-xs text-slate-500 mt-1">
                  Required for rejection
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {report.status === "submitted" && (
                <Button
                  onClick={handleMarkUnderReview}
                  disabled={submitting}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Mark Under Review
                </Button>
              )}

              <Button
                onClick={handleVerify}
                disabled={submitting || !report.evidence_file_urls || report.evidence_file_urls.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {submitting ? "Verifying..." : "Verify Report"}
              </Button>

              <Button
                onClick={handleReject}
                disabled={submitting}
                variant="destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                {submitting ? "Rejecting..." : "Reject Report"}
              </Button>
            </div>

            {!report.evidence_file_urls || report.evidence_file_urls.length === 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Cannot verify report without evidence files
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}