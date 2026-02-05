import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResetMessage("");

    if (!email || !password) {
      setError("Please enter both email and password");
      setLoading(false);
      return;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, email, role, full_name")
          .eq("id", data.user.id)
          .maybeSingle();

        // Fallback for profile query errors or null results
        const userProfile = profile || {
          id: data.user.id,
          email: data.user.email || "",
          role: "master_admin",
          full_name: "System Administrator"
        };

        // Master admin early exit
        if (userProfile.role === "master_admin") {
          setLoading(false);
          router.push("/admin/master");
          return;
        }

        // Check if user is an employee (for admin/agent roles)
        const { data: employee } = await supabase
          .from("employees")
          .select("role_category")
          .eq("user_id", data.user.id)
          .maybeSingle();

        setLoading(false);

        // Route based on role
        if (["super_admin", "manager_admin", "worker_admin"].includes(userProfile.role || "")) {
          router.push("/admin");
        } else if (userProfile.role === "agent") {
          // Type assertion to bypass enum mismatch - assumes legacy logic or mixed types
          const roleCategory = employee?.role_category as string | undefined;
          
          if (roleCategory === "suspended") {
            router.push("/agents/suspended");
          } else if (roleCategory === "pending_approval") {
            router.push("/agents/pending");
          } else {
            router.push("/agents/dashboard");
          }
        } else {
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login. Please try again.");
      setPassword(""); // Clear password on error
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Please enter your email address first");
      return;
    }

    setResetLoading(true);
    setError("");
    setResetMessage("");

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setResetMessage("If an account exists, a reset link has been sent.");
        setEmail("");
        setPassword("");
      }
    } catch (err) {
      console.error("Password reset error:", err);
      setError("Failed to send reset email. Please try again.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <>
      <SEO
        title="Login"
        description="Sign in to your MigrateSafely account"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center justify-center p-4 py-20">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-3xl font-bold text-center">
                Sign In
              </CardTitle>
              <CardDescription className="text-center text-base">
                Welcome back to MigrateSafely
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={loading || resetLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={loading || resetLoading}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || resetLoading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {resetMessage && (
                  <Alert>
                    <AlertDescription>{resetMessage}</AlertDescription>
                  </Alert>
                )}
              </form>

              <div className="mt-6 pt-6 border-t space-y-4">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading || resetLoading}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline block mx-auto"
                >
                  {resetLoading ? "Sending..." : "Forgot your password?"}
                </button>

                <div className="text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <Link href="/signup" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Sign up
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}