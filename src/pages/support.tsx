import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { AppHeader } from "@/components/AppHeader";
import { authService } from "@/services/authService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, MessageSquare } from "lucide-react";

export default function SupportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const user = await authService.getCurrentUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error("Error checking auth:", error);
      router.push("/login");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!subject.trim() || !body.trim()) {
      setErrorMessage("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/messages/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          body: body.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("Your support request has been sent successfully! Our team will respond soon.");
        setSubject("");
        setBody("");
      } else {
        setErrorMessage(data.error || "Failed to send support request");
      }
    } catch (error) {
      console.error("Error sending support request:", error);
      setErrorMessage("Failed to send support request");
    } finally {
      setSubmitting(false);
    }
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

  return (
    <>
      <Head>
        <title>Contact Support | Migrate Safely</title>
        <meta name="description" content="Contact our support team for assistance" />
      </Head>

      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Contact Support</h1>
              <p className="text-muted-foreground mt-2">
                Need help? Send us a message and our team will respond as soon as possible.
              </p>
            </div>

            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <AlertDescription className="text-green-800 dark:text-green-200">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Support Request
                </CardTitle>
                <CardDescription>
                  Describe your issue or question and we'll get back to you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief description of your issue"
                      required
                      maxLength={200}
                    />
                  </div>

                  <div>
                    <Label htmlFor="body">Message *</Label>
                    <Textarea
                      id="body"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Provide detailed information about your issue or question..."
                      required
                      rows={8}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Please include as much detail as possible to help us assist you better
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Support Request"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/dashboard")}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Response Time
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Our support team typically responds within 24-48 hours. For urgent matters,
                  please include "URGENT" in your subject line.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}