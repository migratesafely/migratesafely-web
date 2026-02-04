import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { MainHeader } from "@/components/MainHeader";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";

interface IdentityVerification {
  id: string;
  user_id: string;
  title: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  date_of_birth: string;
  nationality: string;
  id_number: string;
  id_type: string;
  id_front_url: string;
  id_back_url: string | null;
  selfie_url: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  profiles?: {
    email: string;
  };
}

export default function AdminIdentityVerificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [verifications, setVerifications] = useState<IdentityVerification[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<IdentityVerification | null>(null);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const user = await authService.getCurrentUser();
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

      if (!isChairman && !["manager_admin", "worker_admin"].includes(profile?.role || "")) {
        router.push("/admin");
        return;
      }

      setIsAdmin(true);
      await loadVerifications();
    } catch (error) {
      console.error("Error checking access:", error);
      router.push("/admin");
    }
  }

  async function loadVerifications() {
    try {
      const { data, error } = await supabase
        .from("identity_verifications")
        .select(`
          *,
          profiles!identity_verifications_user_id_fkey (email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVerifications(data || []);
    } catch (error) {
      console.error("Error loading verifications:", error);
      setErrorMessage("Failed to load verifications");
    }
  }

  async function handleApprove(verificationId: string) {
    setProcessing(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/admin/identity/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationId }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("Identity verification approved");
        setSelectedVerification(null);
        await loadVerifications();
      } else {
        setErrorMessage(data.error || "Failed to approve verification");
      }
    } catch (error) {
      console.error("Approve error:", error);
      setErrorMessage("Failed to approve verification");
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject(verificationId: string) {
    if (!rejectionReason.trim()) {
      setErrorMessage("Please provide a rejection reason");
      return;
    }

    setProcessing(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/admin/identity/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationId, rejectionReason: rejectionReason.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("Identity verification rejected");
        setSelectedVerification(null);
        setRejectionReason("");
        await loadVerifications();
      } else {
        setErrorMessage(data.error || "Failed to reject verification");
      }
    } catch (error) {
      console.error("Reject error:", error);
      setErrorMessage("Failed to reject verification");
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const pendingCount = verifications.filter((v) => v.status === "PENDING").length;
  const approvedCount = verifications.filter((v) => v.status === "APPROVED").length;
  const rejectedCount = verifications.filter((v) => v.status === "REJECTED").length;

  return (
    <>
      <Head>
        <title>Identity Verifications | Admin</title>
      </Head>

      <div className="min-h-screen bg-background">
        <MainHeader />
        <main className="max-w-7xl mx-auto px-4 py-12">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Identity Verifications</h1>
              <p className="text-muted-foreground mt-2">Review and approve member identity verifications</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Approved</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Rejected</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
                </CardContent>
              </Card>
            </div>

            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
              </Alert>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Verification Requests</CardTitle>
                  <CardDescription>{verifications.length} total submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {verifications.map((verification) => (
                      <div
                        key={verification.id}
                        className={`p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition ${
                          selectedVerification?.id === verification.id ? "border-primary bg-muted/50" : ""
                        }`}
                        onClick={() => setSelectedVerification(verification)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">
                              {verification.title} {verification.first_name} {verification.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">{verification.profiles?.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {verification.id_type.replace("_", " ").toUpperCase()} • {verification.nationality}
                            </p>
                          </div>
                          <Badge
                            variant={
                              verification.status === "APPROVED"
                                ? "default"
                                : verification.status === "REJECTED"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {verification.status}
                          </Badge>
                        </div>
                      </div>
                    ))}

                    {verifications.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No verifications submitted yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {selectedVerification && (
                <Card>
                  <CardHeader>
                    <CardTitle>Review Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Full Name:</p>
                      <p>
                        {selectedVerification.title} {selectedVerification.first_name}{" "}
                        {selectedVerification.middle_name} {selectedVerification.last_name}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Date of Birth:</p>
                      <p>{new Date(selectedVerification.date_of_birth).toLocaleDateString()}</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Nationality:</p>
                      <p>{selectedVerification.nationality}</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold">ID Type:</p>
                      <p>{selectedVerification.id_type.replace("_", " ").toUpperCase()}</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold">ID Number:</p>
                      <p className="font-mono">{selectedVerification.id_number}</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Documents:</p>
                      <div className="flex flex-col gap-2">
                        <a
                          href={selectedVerification.id_front_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View ID Front
                        </a>
                        {selectedVerification.id_back_url && (
                          <a
                            href={selectedVerification.id_back_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View ID Back
                          </a>
                        )}
                        {selectedVerification.selfie_url && (
                          <a
                            href={selectedVerification.selfie_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Selfie
                          </a>
                        )}
                      </div>
                    </div>

                    {selectedVerification.status === "REJECTED" && selectedVerification.rejection_reason && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          <strong>Rejection Reason:</strong> {selectedVerification.rejection_reason}
                        </AlertDescription>
                      </Alert>
                    )}

                    {selectedVerification.status === "PENDING" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="rejectionReason">Rejection Reason (if rejecting)</Label>
                          <Textarea
                            id="rejectionReason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Provide detailed reason for rejection"
                            rows={3}
                          />
                        </div>

                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleApprove(selectedVerification.id)}
                            disabled={processing}
                            className="flex-1"
                          >
                            {processing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => handleReject(selectedVerification.id)}
                            disabled={processing}
                            variant="destructive"
                            className="flex-1"
                          >
                            {processing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}