import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { AppHeader } from "@/components/AppHeader";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Play, AlertCircle } from "lucide-react";

interface TestResult {
  name: string;
  status: "PASS" | "FAIL" | "PENDING";
  message: string;
  data?: any;
  timestamp?: string;
}

export default function AdminQAPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testUserId, setTestUserId] = useState("");

  useEffect(() => {
    checkSuperAdmin();
  }, []);

  async function checkSuperAdmin() {
    try {
      const user = await authService.getCurrentUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || !profile || profile.role !== "super_admin") {
        router.push("/dashboard");
        return;
      }

      setIsSuperAdmin(true);
      setTestUserId(user.id);
    } catch (error) {
      console.error("Error checking super admin status:", error);
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  function addTestResult(result: TestResult) {
    setTestResults((prev) => [
      {
        ...result,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  }

  async function runTest1AuthSession() {
    setRunning("test1");
    try {
      const user = await authService.getCurrentUser();
      const session = await authService.getCurrentSession();

      if (user && session) {
        addTestResult({
          name: "Auth Session Test",
          status: "PASS",
          message: "User authenticated with valid session",
          data: {
            userId: user.id,
            email: user.email,
            sessionExpires: session.expires_at,
          },
        });
      } else {
        addTestResult({
          name: "Auth Session Test",
          status: "FAIL",
          message: "No user or session found",
          data: { user, session },
        });
      }
    } catch (error: any) {
      addTestResult({
        name: "Auth Session Test",
        status: "FAIL",
        message: error.message || "Error checking auth session",
        data: error,
      });
    } finally {
      setRunning(null);
    }
  }

  async function runTest2CountrySettings() {
    setRunning("test2");
    try {
      const response = await fetch("/api/settings/country?countryCode=BD");
      const data = await response.json();

      if (response.ok && data.countryName) {
        addTestResult({
          name: "Country Settings Test",
          status: "PASS",
          message: "Successfully fetched country settings",
          data,
        });
      } else {
        addTestResult({
          name: "Country Settings Test",
          status: "FAIL",
          message: "Failed to fetch country settings",
          data,
        });
      }
    } catch (error: any) {
      addTestResult({
        name: "Country Settings Test",
        status: "FAIL",
        message: error.message || "Error fetching country settings",
        data: error,
      });
    } finally {
      setRunning(null);
    }
  }

  async function runTest3MembershipStatus() {
    setRunning("test3");
    try {
      if (!testUserId) {
        addTestResult({
          name: "Membership Status Test",
          status: "FAIL",
          message: "No test user ID provided",
        });
        setRunning(null);
        return;
      }

      const { data, error } = await supabase
        .from("memberships")
        .select("*")
        .eq("user_id", testUserId)
        .single();

      if (error) throw error;

      if (data) {
        addTestResult({
          name: "Membership Status Test",
          status: "PASS",
          message: "Successfully fetched membership status",
          data,
        });
      } else {
        addTestResult({
          name: "Membership Status Test",
          status: "FAIL",
          message: "No membership found for user",
        });
      }
    } catch (error: any) {
      addTestResult({
        name: "Membership Status Test",
        status: "FAIL",
        message: error.message || "Error fetching membership status",
        data: error,
      });
    } finally {
      setRunning(null);
    }
  }

  async function runTest4PaymentConfirm() {
    setRunning("test4");
    try {
      if (!testUserId) {
        addTestResult({
          name: "Payment Confirm Test",
          status: "FAIL",
          message: "No test user ID provided",
        });
        setRunning(null);
        return;
      }

      const response = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: testUserId,
          paymentMethod: "QA_TEST",
          transactionId: `QA_${Date.now()}`,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        addTestResult({
          name: "Payment Confirm Test",
          status: "PASS",
          message: "Payment confirmed successfully",
          data,
        });
      } else {
        addTestResult({
          name: "Payment Confirm Test",
          status: "FAIL",
          message: data.error || "Failed to confirm payment",
          data,
        });
      }
    } catch (error: any) {
      addTestResult({
        name: "Payment Confirm Test",
        status: "FAIL",
        message: error.message || "Error confirming payment",
        data: error,
      });
    } finally {
      setRunning(null);
    }
  }

  async function runTest5EmbassyList() {
    setRunning("test5");
    try {
      const response = await fetch("/api/embassies/list");
      const data = await response.json();

      if (response.ok && Array.isArray(data)) {
        addTestResult({
          name: "Embassy List Test",
          status: "PASS",
          message: `Successfully fetched ${data.length} embassies`,
          data: { count: data.length, sample: data.slice(0, 3) },
        });
      } else {
        addTestResult({
          name: "Embassy List Test",
          status: "FAIL",
          message: "Failed to fetch embassy list",
          data,
        });
      }
    } catch (error: any) {
      addTestResult({
        name: "Embassy List Test",
        status: "FAIL",
        message: error.message || "Error fetching embassy list",
        data: error,
      });
    } finally {
      setRunning(null);
    }
  }

  async function runTest6ScamReportsPending() {
    setRunning("test6");
    try {
      const response = await fetch("/api/admin/scam-reports/pending");
      const data = await response.json();

      if (response.ok && data.success) {
        addTestResult({
          name: "Scam Reports Pending Test",
          status: "PASS",
          message: `Successfully fetched ${data.reports?.length || 0} pending reports`,
          data: { count: data.reports?.length || 0, sample: data.reports?.slice(0, 2) },
        });
      } else {
        addTestResult({
          name: "Scam Reports Pending Test",
          status: "FAIL",
          message: data.error || "Failed to fetch pending reports",
          data,
        });
      }
    } catch (error: any) {
      addTestResult({
        name: "Scam Reports Pending Test",
        status: "FAIL",
        message: error.message || "Error fetching pending reports",
        data: error,
      });
    } finally {
      setRunning(null);
    }
  }

  async function runTest7PrizeDrawStatus() {
    setRunning("test7");
    try {
      const response = await fetch("/api/prize-draw/status");
      const data = await response.json();

      if (response.ok && data.success) {
        addTestResult({
          name: "Prize Draw Status Test",
          status: "PASS",
          message: data.activeDraw ? "Active draw found" : "No active draw",
          data,
        });
      } else {
        addTestResult({
          name: "Prize Draw Status Test",
          status: "FAIL",
          message: data.error || "Failed to fetch prize draw status",
          data,
        });
      }
    } catch (error: any) {
      addTestResult({
        name: "Prize Draw Status Test",
        status: "FAIL",
        message: error.message || "Error fetching prize draw status",
        data: error,
      });
    } finally {
      setRunning(null);
    }
  }

  async function runTest8PrizeDrawEnter() {
    setRunning("test8");
    try {
      const response = await fetch("/api/prize-draw/enter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        addTestResult({
          name: "Prize Draw Enter Test",
          status: "PASS",
          message: data.message || "Successfully entered prize draw",
          data,
        });
      } else {
        addTestResult({
          name: "Prize Draw Enter Test",
          status: data.error?.includes("already entered") ? "PASS" : "FAIL",
          message: data.error || "Failed to enter prize draw",
          data,
        });
      }
    } catch (error: any) {
      addTestResult({
        name: "Prize Draw Enter Test",
        status: "FAIL",
        message: error.message || "Error entering prize draw",
        data: error,
      });
    } finally {
      setRunning(null);
    }
  }

  async function runTest9UnreadMessages() {
    setRunning("test9");
    try {
      const response = await fetch("/api/messages/unread-count");
      const data = await response.json();

      if (response.ok && data.success) {
        addTestResult({
          name: "Unread Messages Test",
          status: "PASS",
          message: `Unread count: ${data.unreadCount || 0}`,
          data,
        });
      } else {
        addTestResult({
          name: "Unread Messages Test",
          status: "FAIL",
          message: data.error || "Failed to fetch unread count",
          data,
        });
      }
    } catch (error: any) {
      addTestResult({
        name: "Unread Messages Test",
        status: "FAIL",
        message: error.message || "Error fetching unread count",
        data: error,
      });
    } finally {
      setRunning(null);
    }
  }

  async function runTest10SeedData() {
    setRunning("test10");
    try {
      const response = await fetch("/api/admin/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 404) {
        addTestResult({
          name: "Seed Test Data",
          status: "PENDING",
          message: "Seed endpoint not created yet (optional feature)",
        });
        setRunning(null);
        return;
      }

      const data = await response.json();

      if (response.ok && data.success) {
        addTestResult({
          name: "Seed Test Data",
          status: "PASS",
          message: "Test data seeded successfully",
          data,
        });
      } else {
        addTestResult({
          name: "Seed Test Data",
          status: "FAIL",
          message: data.error || "Failed to seed test data",
          data,
        });
      }
    } catch (error: any) {
      addTestResult({
        name: "Seed Test Data",
        status: "FAIL",
        message: error.message || "Error seeding test data",
        data: error,
      });
    } finally {
      setRunning(null);
    }
  }

  async function runAllTests() {
    setTestResults([]);
    await runTest1AuthSession();
    await runTest2CountrySettings();
    await runTest3MembershipStatus();
    await runTest5EmbassyList();
    await runTest6ScamReportsPending();
    await runTest7PrizeDrawStatus();
    await runTest8PrizeDrawEnter();
    await runTest9UnreadMessages();
  }

  function clearResults() {
    setTestResults([]);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <>
      <Head>
        <title>QA Dashboard | Admin</title>
        <meta name="description" content="Super Admin QA Testing Dashboard" />
      </Head>

      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">QA Testing Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                  Super Admin - System Testing & Verification
                </p>
              </div>
              <Badge variant="destructive" className="text-lg px-4 py-2">
                SUPER ADMIN ONLY
              </Badge>
            </div>

            {/* Test User ID Input */}
            <Card>
              <CardHeader>
                <CardTitle>Test Configuration</CardTitle>
                <CardDescription>Configure test parameters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="testUserId">Test User ID</Label>
                  <Input
                    id="testUserId"
                    value={testUserId}
                    onChange={(e) => setTestUserId(e.target.value)}
                    placeholder="User UUID for testing"
                  />
                  <p className="text-xs text-muted-foreground">
                    Default: Current logged-in user ID
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Test Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Test Controls</CardTitle>
                <CardDescription>Run individual tests or all tests at once</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button
                    onClick={runTest1AuthSession}
                    disabled={running === "test1"}
                    variant="outline"
                  >
                    {running === "test1" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    1. Auth Session
                  </Button>

                  <Button
                    onClick={runTest2CountrySettings}
                    disabled={running === "test2"}
                    variant="outline"
                  >
                    {running === "test2" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    2. Country Settings
                  </Button>

                  <Button
                    onClick={runTest3MembershipStatus}
                    disabled={running === "test3"}
                    variant="outline"
                  >
                    {running === "test3" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    3. Membership Status
                  </Button>

                  <Button
                    onClick={runTest4PaymentConfirm}
                    disabled={running === "test4"}
                    variant="outline"
                  >
                    {running === "test4" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    4. Payment Confirm
                  </Button>

                  <Button
                    onClick={runTest5EmbassyList}
                    disabled={running === "test5"}
                    variant="outline"
                  >
                    {running === "test5" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    5. Embassy List
                  </Button>

                  <Button
                    onClick={runTest6ScamReportsPending}
                    disabled={running === "test6"}
                    variant="outline"
                  >
                    {running === "test6" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    6. Scam Reports
                  </Button>

                  <Button
                    onClick={runTest7PrizeDrawStatus}
                    disabled={running === "test7"}
                    variant="outline"
                  >
                    {running === "test7" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    7. Prize Draw Status
                  </Button>

                  <Button
                    onClick={runTest8PrizeDrawEnter}
                    disabled={running === "test8"}
                    variant="outline"
                  >
                    {running === "test8" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    8. Prize Draw Enter
                  </Button>

                  <Button
                    onClick={runTest9UnreadMessages}
                    disabled={running === "test9"}
                    variant="outline"
                  >
                    {running === "test9" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    9. Unread Messages
                  </Button>

                  <Button
                    onClick={runTest10SeedData}
                    disabled={running === "test10"}
                    variant="outline"
                  >
                    {running === "test10" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    10. Seed Test Data
                  </Button>
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t">
                  <Button onClick={runAllTests} disabled={!!running} className="flex-1">
                    {running ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Run All Tests
                  </Button>
                  <Button onClick={clearResults} variant="outline" disabled={!!running}>
                    Clear Results
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Test Results */}
            {testResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Test Results</CardTitle>
                  <CardDescription>
                    {testResults.filter((r) => r.status === "PASS").length} passed,{" "}
                    {testResults.filter((r) => r.status === "FAIL").length} failed,{" "}
                    {testResults.filter((r) => r.status === "PENDING").length} pending
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {testResults.map((result, index) => (
                      <div
                        key={index}
                        className="p-4 border rounded-lg space-y-3 bg-muted/20"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {result.status === "PASS" && (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            )}
                            {result.status === "FAIL" && (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                            {result.status === "PENDING" && (
                              <AlertCircle className="h-5 w-5 text-yellow-600" />
                            )}
                            <div>
                              <p className="font-semibold text-foreground">{result.name}</p>
                              <p className="text-sm text-muted-foreground">{result.message}</p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              result.status === "PASS"
                                ? "default"
                                : result.status === "FAIL"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {result.status}
                          </Badge>
                        </div>

                        {result.timestamp && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(result.timestamp).toLocaleString()}
                          </p>
                        )}

                        {result.data && (
                          <details className="mt-2">
                            <summary className="text-sm font-medium cursor-pointer text-primary hover:underline">
                              View Data
                            </summary>
                            <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {testResults.length === 0 && (
              <Alert>
                <AlertCircle className="h-5 w-5" />
                <AlertDescription>
                  No tests run yet. Click a test button above to start testing.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </main>
      </div>
    </>
  );
}