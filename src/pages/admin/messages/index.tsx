import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { MainHeader } from "@/components/MainHeader";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Users, Globe, UserCheck, Mail } from "lucide-react";

type TargetType = "ALL_MEMBERS" | "ALL_AGENTS" | "COUNTRY_MEMBERS" | "COUNTRY_AGENTS" | "SELECTED_USERS";

interface BroadcastHistory {
  id: string;
  subject: string;
  target_group: string;
  target_country_code?: string;
  created_at: string;
  recipient_count?: number;
}

export default function AdminMessagesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sending, setSending] = useState(false);
  const [target, setTarget] = useState<TargetType>("ALL_MEMBERS");
  const [countryCode, setCountryCode] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [recentBroadcasts, setRecentBroadcasts] = useState<BroadcastHistory[]>([]);

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
      await loadRecentBroadcasts();
    } catch (error) {
      console.error("Error checking access:", error);
      router.push("/admin");
    }
  }

  async function loadRecentBroadcasts() {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("id, subject, target_group, target_country_code, created_at")
        .eq("message_type", "BROADCAST")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        const broadcastsWithCount = await Promise.all(
          data.map(async (broadcast) => {
            const { count } = await supabase
              .from("message_recipients")
              .select("*", { count: "exact", head: true })
              .eq("message_id", broadcast.id);

            return {
              ...broadcast,
              recipient_count: count || 0,
            };
          })
        );

        setRecentBroadcasts(broadcastsWithCount);
      }
    } catch (error) {
      console.error("Error loading broadcasts:", error);
    }
  }

  async function handleSendBroadcast(e: React.FormEvent) {
    e.preventDefault();

    if (!subject.trim() || !body.trim()) {
      setErrorMessage("Subject and message are required");
      return;
    }

    if ((target === "COUNTRY_MEMBERS" || target === "COUNTRY_AGENTS") && !countryCode.trim()) {
      setErrorMessage("Country code is required for country-specific broadcasts");
      return;
    }

    if (target === "SELECTED_USERS" && !selectedUserIds.trim()) {
      setErrorMessage("User IDs are required for selected users broadcast");
      return;
    }

    setSending(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload: any = {
        target,
        subject: subject.trim(),
        body: body.trim(),
      };

      if (target === "COUNTRY_MEMBERS" || target === "COUNTRY_AGENTS") {
        payload.countryCode = countryCode.trim();
      }

      if (target === "SELECTED_USERS") {
        const userIdsArray = selectedUserIds
          .split(",")
          .map((id) => id.trim())
          .filter((id) => id.length > 0);

        if (userIdsArray.length === 0) {
          setErrorMessage("Please provide valid user IDs");
          setSending(false);
          return;
        }

        payload.selectedUserIds = userIdsArray;
      }

      const response = await fetch("/api/admin/messages/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(
          `Broadcast sent successfully to ${data.recipientCount || 0} recipient${
            data.recipientCount !== 1 ? "s" : ""
          }!`
        );
        setSubject("");
        setBody("");
        setCountryCode("");
        setSelectedUserIds("");
        await loadRecentBroadcasts();
      } else {
        setErrorMessage(data.error || "Failed to send broadcast");
      }
    } catch (error) {
      console.error("Error sending broadcast:", error);
      setErrorMessage("Failed to send broadcast");
    } finally {
      setSending(false);
    }
  }

  function getTargetLabel(targetGroup: string): string {
    switch (targetGroup) {
      case "ALL_MEMBERS":
        return "All Members";
      case "ALL_AGENTS":
        return "All Agents";
      case "COUNTRY_MEMBERS":
        return "Country Members";
      case "COUNTRY_AGENTS":
        return "Country Agents";
      case "CUSTOM":
        return "Selected Users";
      default:
        return targetGroup;
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Admin Messages | Migrate Safely</title>
        <meta name="description" content="Send broadcast messages to users" />
      </Head>

      <div className="min-h-screen bg-background">
        <MainHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Messages</h1>
              <p className="text-muted-foreground mt-2">
                Send broadcast messages to targeted user groups
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

            {/* Broadcast Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Send Broadcast Message
                </CardTitle>
                <CardDescription>
                  Send targeted messages to specific user groups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendBroadcast} className="space-y-6">
                  {/* Target Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="target">Target Audience *</Label>
                    <Select value={target} onValueChange={(value) => setTarget(value as TargetType)}>
                      <SelectTrigger id="target">
                        <SelectValue placeholder="Select target audience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL_MEMBERS">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>All Members</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="ALL_AGENTS">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4" />
                            <span>All Agents</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="COUNTRY_MEMBERS">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <span>Members from Specific Country</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="COUNTRY_AGENTS">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <span>Agents from Specific Country</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="SELECTED_USERS">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>Selected Users (Custom)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Country Code Input */}
                  {(target === "COUNTRY_MEMBERS" || target === "COUNTRY_AGENTS") && (
                    <div className="space-y-2">
                      <Label htmlFor="countryCode">Country Code *</Label>
                      <Input
                        id="countryCode"
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                        placeholder="e.g., BD, CA, GB, US"
                        maxLength={2}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter 2-letter country code (ISO 3166-1 alpha-2)
                      </p>
                    </div>
                  )}

                  {/* User IDs Input */}
                  {target === "SELECTED_USERS" && (
                    <div className="space-y-2">
                      <Label htmlFor="selectedUserIds">User IDs *</Label>
                      <Textarea
                        id="selectedUserIds"
                        value={selectedUserIds}
                        onChange={(e) => setSelectedUserIds(e.target.value)}
                        placeholder="Enter user IDs separated by commas&#10;e.g., user-uuid-1, user-uuid-2, user-uuid-3"
                        rows={4}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter user UUIDs separated by commas
                      </p>
                    </div>
                  )}

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Enter message subject"
                      maxLength={200}
                      required
                    />
                  </div>

                  {/* Body */}
                  <div className="space-y-2">
                    <Label htmlFor="body">Message *</Label>
                    <Textarea
                      id="body"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Enter your message content"
                      rows={8}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Write a clear and informative message for your recipients
                    </p>
                  </div>

                  {/* Send Button */}
                  <div className="flex gap-3">
                    <Button type="submit" disabled={sending} className="flex-1">
                      {sending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Broadcast
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/dashboard")}
                      disabled={sending}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Recent Broadcasts */}
            {recentBroadcasts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Broadcasts</CardTitle>
                  <CardDescription>
                    Last 10 broadcast messages sent
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentBroadcasts.map((broadcast) => (
                      <div
                        key={broadcast.id}
                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="space-y-1 flex-1">
                          <p className="font-medium">{broadcast.subject}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline">
                              {getTargetLabel(broadcast.target_group)}
                            </Badge>
                            {broadcast.target_country_code && (
                              <Badge variant="secondary">{broadcast.target_country_code}</Badge>
                            )}
                            <span>•</span>
                            <span>{broadcast.recipient_count} recipients</span>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                          {formatDate(broadcast.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </>
  );
}