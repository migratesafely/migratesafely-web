import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Send, User, Shield, Clock, MessageSquare, AlertCircle } from "lucide-react";
import { authService } from "@/services/authService";

interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  partnerRole: string;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
  messages: Message[];
}

interface Message {
  id: string;
  subject: string | null;
  body: string;
  sender_user_id: string | null;
  sender_role: string;
  created_at: string;
  sender_profile?: {
    full_name: string;
    email: string;
  };
}

interface AgentMessagingProps {
  agentId: string;
}

export function AgentMessaging({ agentId }: AgentMessagingProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageThread, setMessageThread] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New message form
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    loadConversations();
  }, [agentId]);

  async function loadConversations() {
    try {
      setLoading(true);
      setError(null);

      const user = await authService.getCurrentUser();
      if (!user) {
        setError("Not authenticated");
        return;
      }

      const session = await authService.getCurrentSession();
      if (!session) {
        setError("No active session");
        return;
      }

      const response = await fetch("/api/agents/messages/conversations", {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load conversations");
      }

      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error("Error loading conversations:", err);
      setError(err instanceof Error ? err.message : "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }

  async function loadMessageThread(conversation: Conversation) {
    try {
      setLoadingThread(true);
      setError(null);
      setSelectedConversation(conversation);

      const user = await authService.getCurrentUser();
      if (!user) {
        setError("Not authenticated");
        return;
      }

      const session = await authService.getCurrentSession();
      if (!session) {
        setError("No active session");
        return;
      }

      const userType = conversation.partnerRole === "member" ? "member" : "admin";
      
      const response = await fetch(
        `/api/agents/messages/thread?userId=${conversation.partnerId}&userType=${userType}`,
        {
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load message thread");
      }

      const data = await response.json();
      setMessageThread(data.messages || []);
    } catch (err) {
      console.error("Error loading message thread:", err);
      setError(err instanceof Error ? err.message : "Failed to load message thread");
    } finally {
      setLoadingThread(false);
    }
  }

  async function sendMessage() {
    if (!selectedConversation) {
      setError("No conversation selected");
      return;
    }

    if (!subject.trim() || !body.trim()) {
      setError("Subject and message body are required");
      return;
    }

    try {
      setSending(true);
      setError(null);
      setSuccess(null);

      const user = await authService.getCurrentUser();
      if (!user) {
        setError("Not authenticated");
        return;
      }

      const session = await authService.getCurrentSession();
      if (!session) {
        setError("No active session");
        return;
      }

      const recipientType = selectedConversation.partnerRole === "member" ? "member" : "admin";

      const response = await fetch("/api/agents/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          recipientId: selectedConversation.partnerId,
          subject: subject.trim(),
          body: body.trim(),
          recipientType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      const data = await response.json();
      
      setSuccess("Message sent successfully");
      setSubject("");
      setBody("");

      // Reload the message thread
      await loadMessageThread(selectedConversation);
      
      // Reload conversations to update last message
      await loadConversations();
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  function getRoleIcon(role: string) {
    if (role === "member") {
      return <User className="h-4 w-4" />;
    }
    return <Shield className="h-4 w-4" />;
  }

  function getRoleBadgeColor(role: string) {
    if (role === "member") {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    }
    return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Internal Messaging
          </CardTitle>
          <CardDescription>Loading conversations...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Messaging Rules Alert */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-sm text-gray-700 dark:text-gray-300">
          <strong>Messaging Rules:</strong>
          <ul className="mt-2 ml-4 list-disc space-y-1">
            <li>You can message ONLY assigned members and admins</li>
            <li>All messages are permanent and cannot be edited or deleted</li>
            <li>Messages include timestamps and sender role for transparency</li>
            <li>No external messaging allowed - internal communication only</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Conversations
            </CardTitle>
            <CardDescription>
              {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Messages will appear here when you communicate with members or admins</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.partnerId}
                    onClick={() => loadMessageThread(conversation)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedConversation?.partnerId === conversation.partnerId
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(conversation.partnerRole)}
                        <span className="font-medium text-sm">{conversation.partnerName}</span>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <Badge className="bg-red-500 text-white text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <Badge className={`${getRoleBadgeColor(conversation.partnerRole)} text-xs mb-2`}>
                      {conversation.partnerRole}
                    </Badge>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {conversation.lastMessage}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatDate(conversation.lastMessageDate)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Thread & Compose */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {selectedConversation ? `Conversation with ${selectedConversation.partnerName}` : "Select a Conversation"}
            </CardTitle>
            {selectedConversation && (
              <CardDescription className="flex items-center gap-2">
                <Badge className={getRoleBadgeColor(selectedConversation.partnerRole)}>
                  {selectedConversation.partnerRole}
                </Badge>
                <span>{selectedConversation.partnerEmail}</span>
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {!selectedConversation ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to view messages</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Error/Success Messages */}
                {error && (
                  <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700 dark:text-red-400">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700 dark:text-green-400">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Message Thread */}
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                  {loadingThread ? (
                    <div className="space-y-3">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : messageThread.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs mt-1">Start the conversation by sending a message below</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messageThread.map((message) => {
                        const isOwnMessage = message.sender_user_id === agentId;
                        return (
                          <div
                            key={message.id}
                            className={`p-3 rounded-lg ${
                              isOwnMessage
                                ? "bg-blue-100 dark:bg-blue-900/30 ml-8"
                                : "bg-white dark:bg-gray-800 mr-8"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${
                                  isOwnMessage
                                    ? "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                                    : getRoleBadgeColor(message.sender_role)
                                }`}>
                                  {isOwnMessage ? "You (Agent)" : message.sender_role}
                                </Badge>
                                {message.sender_profile && (
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {message.sender_profile.full_name}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <Clock className="h-3 w-3" />
                                {formatDate(message.created_at)}
                              </div>
                            </div>
                            {message.subject && (
                              <p className="font-semibold text-sm mb-1">{message.subject}</p>
                            )}
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {message.body}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Compose Message */}
                <div className="space-y-3 border-t pt-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Send Message
                  </h3>
                  
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                      Subject *
                    </label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Message subject"
                      disabled={sending}
                      className="text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                      Message *
                    </label>
                    <Textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Type your message here..."
                      disabled={sending}
                      rows={4}
                      className="text-sm"
                    />
                  </div>

                  <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-xs text-gray-700 dark:text-gray-300">
                      <strong>Important:</strong> Messages are permanent and cannot be edited or deleted. 
                      All messages are logged with timestamps and sender information.
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={sendMessage}
                    disabled={sending || !subject.trim() || !body.trim()}
                    className="w-full"
                  >
                    {sending ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}