import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { MainHeader } from "@/components/MainHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, FileText, Clock } from "lucide-react";

interface ScamReport {
  id: string;
  scammer_name: string;
  scammer_company: string | null;
  status: string;
  created_at: string;
  reported_by: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

export default function AdminScamReports() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [reports, setReports] = useState<ScamReport[]>([]);
  const [error, setError] = useState("");

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
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

      if (!isChairman && !["manager_admin", "worker_admin"].includes(profile?.role || "")) {
        router.push("/dashboard");
        return;
      }

      setAuthorized(true);

      // Load pending reports
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/admin/scam-reports/pending", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load reports");
      }

      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error("Error checking access:", err);
      router.push("/admin");
    }
  }

  function handleReviewClick(reportId: string) {
    router.push(`/admin/scam-reports/review?id=${reportId}`);
  }

  function getStatusBadge(status: string) {
    if (status === "submitted") {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Submitted</Badge>;
    }
    if (status === "under_review") {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Under Review</Badge>;
    }
    return <Badge>{status}</Badge>;
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

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <MainHeader />
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "Access denied"}</AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <MainHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Scam Report Review</h1>
          <p className="text-slate-600 mt-2">Review and verify submitted scam reports</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No pending reports to review</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-slate-900">
                          {report.scammer_name}
                        </h3>
                        {getStatusBadge(report.status)}
                      </div>
                      
                      {report.scammer_company && (
                        <p className="text-slate-600 mb-2">
                          <span className="font-medium">Company:</span> {report.scammer_company}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {new Date(report.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Reporter:</span>{" "}
                          {report.profiles?.full_name || report.profiles?.email || "Unknown"}
                        </div>
                      </div>
                    </div>

                    <Button onClick={() => handleReviewClick(report.id)}>
                      Review Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}