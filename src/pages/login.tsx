import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { AlertTriangle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for admin suspension error
    if (router.query.error === "admin_suspended") {
      setError(
        "Admin access is currently suspended. Please contact support if this is unexpected."
      );
    }
  }, [router.query]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const redirect = router.query.redirect as string;
    setLoading(true);
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both email and password");
      setLoading(false);
      return;
    }

    try {
      const { user, error } = await authService.signIn(email, password);

      if (error || !user) {
        setErrorMessage(error?.message || "Login failed");
        setLoading(false);
        return;
      }

      const profile = await authService.getUserProfile(user.id);
      
      if (profile) {
        // Redirect based on role
        if (["super_admin", "manager_admin", "hr_admin"].includes(profile.role)) {
          router.push("/admin");
        } else {
          router.push(redirect || authService.getDashboardPath(profile.role) || "/dashboard");
        }
      } else {
        router.push(redirect || "/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <AppHeader />
      <div className="flex items-center justify-center p-4 py-20">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-center">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center text-base">
              Sign in to your Migratesafely.com account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
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
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
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

              {errorMessage && (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
            </form>

            <div className="mt-6 pt-6 border-t text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/signup" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Sign up here
                </Link>
              </p>
              <p className="text-xs text-muted-foreground">
                <Link href="/forgot-password" className="hover:underline">
                  Forgot your password?
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}