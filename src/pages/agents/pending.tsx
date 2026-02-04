import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { authService } from "@/services/authService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MainHeader } from "@/components/MainHeader";

export default function AgentPendingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const user = await authService.getCurrentUser();
      
      if (!user) {
        router.push("/login?redirect=/agents/pending");
        return;
      }

      const profile = await authService.getUserProfile(user.id);
      
      if (!profile) {
        router.push("/login");
        return;
      }

      // If user is no longer pending, redirect to appropriate dashboard
      if (profile.role !== "agent_pending") {
        const dashboardPath = profile.role === "agent" ? "/agents/dashboard" : 
                             profile.role === "agent_suspended" ? "/agents/suspended" : 
                             "/dashboard";
        router.push(dashboardPath);
        return;
      }

      setUserEmail(user.email);
      setLoading(false);
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/login");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Application Under Review | Migrate Safely</title>
        <meta name="description" content="Your agent application is being reviewed" />
      </Head>

      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-2xl md:text-3xl mb-2">
                Application Under Review
              </CardTitle>
              <CardDescription className="text-base">
                Thank you for applying to become a Migrate Safely agent
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-900 dark:text-blue-100">
                  Your application is currently being reviewed by our team. This process typically takes 3-5 business days.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Application Submitted</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      We have received your agent application and supporting documents.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Verification in Progress</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Our team is verifying your credentials, experience, and background.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-gray-400 dark:text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Decision Notification</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You will receive an email at <strong className="text-gray-900 dark:text-gray-100">{userEmail}</strong> once your application has been reviewed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm">What happens next?</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">1.</span>
                    <span>Background verification and credential checks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">2.</span>
                    <span>Review of experience and qualifications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">3.</span>
                    <span>Approval decision by management team</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">4.</span>
                    <span>Email notification with outcome and next steps</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/")}
                >
                  Return to Homepage
                </Button>
                
                <div className="text-center">
                  <Link
                    href="/support"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Need help? Contact support
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong>Note:</strong> You cannot access member features or the agent dashboard until your application is approved.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}