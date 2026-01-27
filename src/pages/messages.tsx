import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { AppHeader } from "@/components/AppHeader";
import { authService } from "@/services/authService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Mail, Inbox, Send, Trash2, Eye } from "lucide-react";

interface Message {
  id: string;
  sender_user_id: string | null;
  sender_role: string;
  subject: string | null;
  body: string;
  message_type: string;
  created_at: string;
  recipient_info?: {
    id: string;
    is_read: boolean;
    read_at: string | null;
    folder: string;
  };
  sender_profile?: {
    full_name: string;
    email: string;
  };
}

export default function MessagesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [inboxMessages, setInboxMessages] = useState<Message[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState("inbox");

  useEffect(() => {
    checkAuthAndLoadMessages();
  }, []);

  async function checkAuthAndLoadMessages() {
    try {
      const user = await authService.getCurrentUser();

      if (!user) {
        router.push("/login");
        return;
      }

      await loadInbox();
      await loadSent();
    } catch (error) {
      console.error("Error checking auth:", error);
      router.push("/login");
    }
  }

  async function loadInbox() {
    try {
      const response = await fetch("/api/messages/inbox");
      const data = await response.json();

      if (data.success) {
        setInboxMessages(data.messages || []);
      } else {
        setErrorMessage("Failed to load inbox");
      }
    } catch (error) {
      console.error("Error loading inbox:", error);
      setErrorMessage("Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }

  async function loadSent() {
    try {
      const response = await fetch("/api/messages/sent");
      const data = await response.json();

      if (data.success) {
        setSentMessages(data.messages || []);
      } else {
        setErrorMessage("Failed to load sent messages");
      }
    } catch (error) {
      console.error("Error loading sent messages:", error);
      setErrorMessage("Failed to load sent messages");
    }
  }

  async function openMessage(message: Message) {
    setSelectedMessage(message);
    setShowMessageDialog(true);

    if (activeTab === "inbox" && message.recipient_info && !message.recipient_info.is_read) {
      await markAsRead(message.recipient_info.id);
    }
  }

  async function markAsRead(recipientId: string) {
    try {
      const response = await fetch("/api/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId })
      });

      const data = await response.json();

      if (data.success) {
        await loadInbox();
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  }

  async function handleDelete(message: Message) {
    if (!message.recipient_info) return;

    setProcessing(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/messages/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: message.recipient_info.id })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("Message moved to trash");
        setShowMessageDialog(false);
        await loadInbox();
        await loadSent();
      } else {
        setErrorMessage(data.error || "Failed to delete message");
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      setErrorMessage("Failed to delete message");
    } finally {
      setProcessing(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
      });
    }
  }

  function getSenderDisplay(message: Message) {
    if (message.sender_role === "SYSTEM") {
      return "System";
    }
    if (message.sender_profile) {
      return message.sender_profile.full_name || message.sender_profile.email;
    }
    return message.sender_role;
  }

  function getMessagePreview(body: string, maxLength: number = 100) {
    if (body.length <= maxLength) return body;
    return body.substring(0, maxLength) + "...";
  }

  const unreadCount = inboxMessages.filter(m => m.recipient_info && !m.recipient_info.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Messages | Migrate Safely</title>
        <meta name="description" content="View your messages and notifications" />
      </Head>

      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Messages</h1>
              <p className="text-muted-foreground mt-2">
                View and manage your messages
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

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="inbox" className="flex items-center gap-2">
                  <Inbox className="h-4 w-4" />
                  Inbox
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="sent" className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Sent
                </TabsTrigger>
              </TabsList>

              <TabsContent value="inbox" className="mt-6">
                {inboxMessages.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-12">
                        <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No messages in your inbox</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {inboxMessages.map((message) => (
                      <Card
                        key={message.id}
                        className={`cursor-pointer hover:shadow-md transition-shadow ${
                          message.recipient_info && !message.recipient_info.is_read
                            ? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                            : ""
                        }`}
                        onClick={() => openMessage(message)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {message.recipient_info && !message.recipient_info.is_read && (
                                  <Badge variant="default" className="text-xs">
                                    Unread
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {message.sender_role}
                                </Badge>
                              </div>
                              <CardTitle className="text-lg truncate">
                                {message.subject || "(No subject)"}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                From: {getSenderDisplay(message)}
                              </CardDescription>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                              {formatDate(message.created_at)}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {getMessagePreview(message.body)}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="sent" className="mt-6">
                {sentMessages.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-12">
                        <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No sent messages</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {sentMessages.map((message) => (
                      <Card
                        key={message.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => openMessage(message)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {message.message_type}
                                </Badge>
                              </div>
                              <CardTitle className="text-lg truncate">
                                {message.subject || "(No subject)"}
                              </CardTitle>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                              {formatDate(message.created_at)}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {getMessagePreview(message.body)}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {selectedMessage && (
        <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedMessage.subject || "(No subject)"}</DialogTitle>
              <DialogDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{selectedMessage.sender_role}</Badge>
                  <span className="text-sm">
                    From: {getSenderDisplay(selectedMessage)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(selectedMessage.created_at).toLocaleString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="whitespace-pre-wrap text-sm">{selectedMessage.body}</div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              {selectedMessage.recipient_info && !selectedMessage.recipient_info.is_read && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedMessage.recipient_info) {
                      markAsRead(selectedMessage.recipient_info.id);
                    }
                  }}
                  disabled={processing}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Mark as Read
                </Button>
              )}
              {selectedMessage.recipient_info && (
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedMessage)}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}