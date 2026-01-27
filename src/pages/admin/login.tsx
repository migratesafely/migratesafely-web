import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertCircle, Lock, Mail } from "lucide-react";
import { authService } from "@/services/authService";
import Head from "next/head";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    // Check if already logged in as admin
    checkAdminSession();
  }, []);

  async function checkAdminSession() {
    try {
      const session = await authService.getCurrentSession();
      
      if (session) {
        const profile = await authService.getUserProfile(session.user.id);

        if (profile && authService.isAdmin(profile.role || "")) {
          router.push("/admin");
        }
      }
    } catch (error) {
      console.error("Error checking session:", error);
    }
  }

  async function logLoginAttempt(
    userId: string | null,
    email: string,
    success: boolean,
    reason?: string
  ) {
    try {
      const response = await fetch("/api/admin/auth/log-login-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          email,
          success,
          reason,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        console.error("Failed to log login attempt");
      }
    } catch (error) {
      console.error("Error logging login attempt:", error);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        await logLoginAttempt(null, email, false, authError.message);
        throw authError;
      }

      if (!authData.user) {
        await logLoginAttempt(null, email, false, "Login failed - no user returned");
        throw new Error("Login failed");
      }

      // Check if user has admin role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", authData.user.id)
        .single();

      if (profileError) {
        await logLoginAttempt(authData.user.id, email, false, "Profile fetch error");
        throw profileError;
      }

      // CRITICAL: Role validation - only admin roles allowed
      const isAdminRole = authService.isAdmin(profile.role || "");

      if (!isAdminRole) {
        // Log unauthorized access attempt
        await logLoginAttempt(
          authData.user.id,
          email,
          false,
          `Unauthorized role: ${profile.role || "unknown"} attempted admin portal access`
        );

        // Sign out non-admin user immediately
        await supabase.auth.signOut();

        // Show clear error message
        setError(
          "Access restricted. This portal is for authorized administrators only."
        );
        setLoading(false);
        return;
      }

      // Success - log successful login
      await logLoginAttempt(
        authData.user.id,
        email,
        true,
        `Successful admin login - Role: ${profile.role}`
      );

      // Redirect to admin dashboard
      router.push("/admin");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(
        err.message === "Invalid login credentials"
          ? "Invalid email or password. Please try again."
          : err.message || "Login failed. Please check your credentials."
      );
      setLoading(false);
    }
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setResetLoading(true);
    setError("");

    try {
      // Check if user exists and is an admin before sending reset email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("email", resetEmail)
        .single();

      if (profileError || !profile) {
        // Don't reveal if email exists - generic message
        setResetSuccess(true);
        setResetLoading(false);
        return;
      }

      // Verify user is an admin
      if (!authService.isAdmin(profile.role || "")) {
        // Don't reveal role - generic message
        setResetSuccess(true);
        setResetLoading(false);
        return;
      }

      // Send password reset email
      const { error } = await authService.resetPassword(resetEmail);

      if (error) {
        throw new Error(error.message);
      }

      setResetSuccess(true);
      setResetLoading(false);
    } catch (err: any) {
      console.error("Password reset error:", err);
      // Generic success message to prevent email enumeration
      setResetSuccess(true);
      setResetLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Admin Portal - bdeshagent.com</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              {showPasswordReset ? "Reset Password" : "Admin Portal"}
            </CardTitle>
            <CardDescription>
              {showPasswordReset
                ? "Enter your admin email to receive a password reset link"
                : "Sign in with your administrator credentials"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showPasswordReset ? (
              // Login Form
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Admin Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@bdeshagent.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    <Lock className="h-4 w-4 inline mr-2" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowPasswordReset(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>

                <Alert className="bg-amber-50 border-amber-200">
                  <Shield className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 text-sm">
                    <strong>Security Notice:</strong> This portal is for authorized
                    administrators only. All login attempts are monitored and logged.
                  </AlertDescription>
                </Alert>

                <div className="text-center text-sm text-muted-foreground mt-4">
                  <p className="font-semibold">bdeshagent.com</p>
                  <p className="text-xs mt-1">Administrator Access Portal</p>
                </div>
              </form>
            ) : (
              // Password Reset Form
              <form onSubmit={handlePasswordReset} className="space-y-4">
                {resetSuccess ? (
                  <Alert className="bg-green-50 border-green-200">
                    <Mail className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      If an admin account exists with this email, you will receive a
                      password reset link shortly. Please check your email.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="reset-email">
                        <Mail className="h-4 w-4 inline mr-2" />
                        Admin Email
                      </Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="admin@bdeshagent.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        disabled={resetLoading}
                        autoComplete="email"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={resetLoading}
                    >
                      {resetLoading ? "Sending..." : "Send Reset Link"}
                    </Button>
                  </>
                )}

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordReset(false);
                      setResetSuccess(false);
                      setResetEmail("");
                      setError("");
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    disabled={resetLoading}
                  >
                    ← Back to login
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}