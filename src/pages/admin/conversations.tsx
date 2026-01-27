import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Search, Send, AlertTriangle, UserX, RefreshCw, Eye, Clock } from "lucide-react";

export default function AdminConversationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Dialog states
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);
  
  // Form states
  const [messageBody, setMessageBody] = useState("");
  const [messageType, setMessageType] = useState("admin_message");
  const [newAgentId, setNewAgentId] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [escalateReason, setEscalateReason] = useState("");
  const [escalationNotes, setEscalationNotes] = useState("");
  
  const [processing, setProcessing] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");

  useEffect(() => {
    checkAdminAndLoadConversations();
  }, [statusFilter]);

  async function checkAdminAndLoadConversations() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push("/admin/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || !["super_admin", "manager_admin", "worker_admin"].includes(profile.role)) {
      router.push("/admin/login");
      return;
    }

    setCurrentUserRole(profile.role);
    await loadConversations();
    setLoading(false);
  }

  async function loadConversations() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let url = "/api/admin/conversations/list";
      if (statusFilter && statusFilter !== "all") {
        url += `?status=${statusFilter}`;
      }

      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  }

  async function viewConversation(requestId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/conversations/view?request_id=${requestId}`, {
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedConversation(data.request);
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error viewing conversation:", error);
    }
  }

  async function sendAdminMessage() {
    if (!selectedConversation || !messageBody.trim()) return;

    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const recipientIds = [
        selectedConversation.member_user_id,
        selectedConversation.assigned_agent_id,
      ].filter(Boolean);

      const response = await fetch("/api/admin/conversations/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          request_id: selectedConversation.id,
          message_body: messageBody,
          message_type: messageType,
          recipient_ids: recipientIds,
        }),
      });

      if (response.ok) {
        alert("Message sent successfully!");
        setMessageBody("");
        setShowMessageDialog(false);
        await viewConversation(selectedConversation.id);
      } else {
        const error = await response.json();
        alert(`Failed to send message: ${error.error}`);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setProcessing(false);
    }
  }

  async function reassignAgent() {
    if (!selectedConversation || !newAgentId || !reassignReason.trim()) return;

    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/admin/conversations/reassign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          request_id: selectedConversation.id,
          new_agent_id: newAgentId,
          reason: reassignReason,
        }),
      });

      if (response.ok) {
        alert("Agent reassigned successfully!");
        setNewAgentId("");
        setReassignReason("");
        setShowReassignDialog(false);
        setSelectedConversation(null);
        await loadConversations();
      } else {
        const error = await response.json();
        alert(`Failed to reassign agent: ${error.error}`);
      }
    } catch (error) {
      console.error("Error reassigning agent:", error);
      alert("Failed to reassign agent");
    } finally {
      setProcessing(false);
    }
  }

  async function escalateCase() {
    if (!selectedConversation || !escalateReason.trim()) return;

    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/admin/conversations/escalate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          request_id: selectedConversation.id,
          reason: escalateReason,
          escalation_notes: escalationNotes,
        }),
      });

      if (response.ok) {
        alert("Case escalated successfully!");
        setEscalateReason("");
        setEscalationNotes("");
        setShowEscalateDialog(false);
        setSelectedConversation(null);
        await loadConversations();
      } else {
        const error = await response.json();
        alert(`Failed to escalate case: ${error.error}`);
      }
    } catch (error) {
      console.error("Error escalating case:", error);
      alert("Failed to escalate case");
    } finally {
      setProcessing(false);
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      conv.member?.email?.toLowerCase().includes(searchLower) ||
      conv.member?.full_name?.toLowerCase().includes(searchLower) ||
      conv.agent?.email?.toLowerCase().includes(searchLower) ||
      conv.agent?.full_name?.toLowerCase().includes(searchLower) ||
      conv.id.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <>
        <SEO title="Admin - Conversations" />
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Admin - Agent-Member Conversations" />
      <AppHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Agent-Member Conversations</h1>
          <p className="text-muted-foreground">View and manage all agent-member conversations</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by member, agent, or request ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ASSIGNED">Assigned</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="ESCALATED">Escalated</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Conversations List */}
        <div className="grid gap-4">
          {filteredConversations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No conversations found
              </CardContent>
            </Card>
          ) : (
            filteredConversations.map((conv) => (
              <Card key={conv.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {conv.member?.full_name || conv.member?.email || "Unknown Member"}
                      </CardTitle>
                      <CardDescription>
                        Agent: {conv.agent?.full_name || conv.agent?.email || "Unassigned"}
                      </CardDescription>
                    </div>
                    <Badge variant={
                      conv.status === "COMPLETED" ? "default" :
                      conv.status === "ESCALATED" ? "destructive" :
                      conv.status === "IN_PROGRESS" ? "secondary" : "outline"
                    }>
                      {conv.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="w-4 h-4" />
                      <span>{conv.message_count || 0} messages</span>
                    </div>
                    {conv.last_message && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>Last activity: {new Date(conv.last_message.created_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => viewConversation(conv.id)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Conversation
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Conversation View Dialog */}
        <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Conversation Details</DialogTitle>
              <DialogDescription>
                View and manage this agent-member conversation
              </DialogDescription>
            </DialogHeader>

            {selectedConversation && (
              <div className="space-y-4">
                {/* Request Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-md">
                  <div>
                    <p className="text-sm font-semibold">Member</p>
                    <p className="text-sm">{selectedConversation.member?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedConversation.member?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Agent</p>
                    <p className="text-sm">{selectedConversation.agent?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedConversation.agent?.email}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto border rounded-md p-4">
                  {messages.length === 0 ? (
                    <p className="text-center text-muted-foreground">No messages yet</p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-md ${
                          msg.sender_role === "admin" || msg.message_type === "admin_message"
                            ? "bg-blue-50 border-l-4 border-blue-500"
                            : msg.message_type === "system_message"
                            ? "bg-amber-50 border-l-4 border-amber-500"
                            : "bg-muted"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold">
                            {msg.sender?.full_name || msg.sender?.email || "System"}
                            <Badge variant="outline" className="ml-2 text-xs">
                              {msg.sender_role || msg.message_type}
                            </Badge>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(msg.created_at).toLocaleString()}
                          </p>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => setShowMessageDialog(true)}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Send Message
                  </Button>

                  {currentUserRole !== "worker_admin" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowReassignDialog(true)}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Reassign Agent
                      </Button>
                    </>
                  )}

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setShowEscalateDialog(true)}
                  >
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Escalate Case
                  </Button>
                </div>

                {currentUserRole === "worker_admin" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                    <p className="text-xs text-amber-700">
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      Worker Admins cannot reassign agents. Please escalate to Manager or Super Admin.
                    </p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedConversation(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send Message Dialog */}
        <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Admin Message</DialogTitle>
              <DialogDescription>
                Send a message to both the member and agent in this conversation
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Message Type</Label>
                <Select value={messageType} onValueChange={setMessageType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin_message">Admin Message</SelectItem>
                    <SelectItem value="system_message">System Message</SelectItem>
                    <SelectItem value="admin_note">Admin Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Message</Label>
                <Textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Enter your message (min 10 characters)..."
                  rows={5}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={sendAdminMessage}
                disabled={processing || messageBody.trim().length < 10}
              >
                {processing ? "Sending..." : "Send Message"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reassign Dialog */}
        <Dialog open={showReassignDialog} onOpenChange={setShowReassignDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reassign Agent</DialogTitle>
              <DialogDescription>
                Assign this case to a different agent
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>New Agent ID</Label>
                <Input
                  value={newAgentId}
                  onChange={(e) => setNewAgentId(e.target.value)}
                  placeholder="Enter new agent user ID..."
                />
              </div>

              <div>
                <Label>Reason for Reassignment</Label>
                <Textarea
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="Enter reason (min 10 characters)..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReassignDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={reassignAgent}
                disabled={processing || !newAgentId || reassignReason.trim().length < 10}
              >
                {processing ? "Reassigning..." : "Reassign Agent"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Escalate Dialog */}
        <Dialog open={showEscalateDialog} onOpenChange={setShowEscalateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Escalate Case</DialogTitle>
              <DialogDescription>
                Escalate this case for senior review
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Reason for Escalation</Label>
                <Textarea
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder="Enter reason (min 10 characters)..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Additional Notes (Optional)</Label>
                <Textarea
                  value={escalationNotes}
                  onChange={(e) => setEscalationNotes(e.target.value)}
                  placeholder="Enter any additional context..."
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEscalateDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={escalateCase}
                disabled={processing || escalateReason.trim().length < 10}
                variant="destructive"
              >
                {processing ? "Escalating..." : "Escalate Case"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}