import React, { useState } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { authService } from "@/services/authService";
import { MainHeader } from "@/components/MainHeader";

export default function AccessPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { user, error: signInError } = await authService.signIn(email, password);

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (user) {
        const profile = await authService.getUserProfile(user.id);
        
        if (!profile) {
          setError("Profile not found");
          setLoading(false);
          return;
        }

        // ONLY master_admin role can access through this page
        if (profile.role !== "master_admin") {
          setError("Access denied");
          await authService.signOut();
          setLoading(false);
          return;
        }

        // Master Admin successfully authenticated
        router.push("/admin");
      }
    } catch (err) {
      setError("Authentication failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SEO
        title="Access"
        description="System Access"
      />
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Authenticating..." : "Access"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}