import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { authService } from "@/services/authService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mail, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MainHeader } from "@/components/MainHeader";

export default function AgentSuspendedPage() {
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
        router.push("/login?redirect=/agents/suspended");
        return;
      }

      const profile = await authService.getUserProfile(user.id);
      
      if (!profile) {
        router.push("/login");
        return;
      }

      // If user is no longer suspended, redirect to appropriate dashboard
      if (profile.role !== "agent_suspended") {
        const dashboardPath = profile.role === "agent" ? "/agents/dashboard" : 
                             profile.role === "agent_pending" ? "/agents/pending" : 
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

  async function handleLogout() {
    await authService.signOut();
    router.push("/");
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
        <title>Account Suspended | Migrate Safely</title>
        <meta name="description" content="Your agent account has been suspended" />
      </Head>

      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-red-200 dark:border-red-800">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl md:text-3xl mb-2 text-red-900 dark:text-red-100">
                Account Suspended
              </CardTitle>
              <CardDescription className="text-base">
                Your agent account has been temporarily suspended
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <Alert className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
                <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-900 dark:text-red-100">
                  Your access to the agent dashboard and agent features has been temporarily suspended by our administration team.
                </AlertDescription>
              </Alert>

              <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm">Common reasons for suspension:</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-400">•</span>
                    <span>Violation of platform terms and conditions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-400">•</span>
                    <span>Unethical conduct or fraudulent activity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-400">•</span>
                    <span>Multiple client complaints or negative feedback</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-400">•</span>
                    <span>Failure to maintain required credentials or licenses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-400">•</span>
                    <span>Non-compliance with ethical migration practices</span>
                  </li>
                </ul>
              </div>

              <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Contact Administration</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    If you believe this suspension is in error or would like to appeal, please contact our administration team.
                  </p>
                  <p className="text-sm">
                    <strong>Email:</strong>{" "}
                    <a
                      href="mailto:admin@migratesafely.com"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      admin@migratesafely.com
                    </a>
                  </p>
                  <p className="text-sm mt-1">
                    <strong>Reference:</strong> {userEmail}
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-2">Important Notice</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  During the suspension period, you cannot:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1 ml-4">
                  <li>• Access the agent dashboard</li>
                  <li>• Receive agent request assignments</li>
                  <li>• Accept new clients</li>
                  <li>• Represent yourself as a Migrate Safely agent</li>
                </ul>
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
                
                <div className="text-center">
                  <Link
                    href="/support"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Contact Support
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong>Note:</strong> Account suspensions are reviewed on a case-by-case basis. Response time may vary depending on the severity of the issue.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}