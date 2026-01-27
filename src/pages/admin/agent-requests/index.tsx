import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { AppHeader } from "@/components/AppHeader";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User, Mail, Globe, FileText, UserCheck, Clock, CheckCircle, XCircle, AlertTriangle, Calendar, MessageSquare } from "lucide-react";
import { agentRequestService } from "@/services/agentRequestService";

interface AgentRequest {
  id: string;
  member_user_id: string;
  member_country_code: string;
  destination_country_code: string;
  request_type: string;
  notes?: string;
  status: string;
  assigned_agent_id?: string;
  assigned_by_admin_id?: string;
  assigned_at?: string;
  admin_notes?: string;
  member_feedback?: string;
  outcome_status: string;
  created_at: string;
  member_profile?: {
    full_name: string;
    email: string;
    country_code: string;
  };
  assigned_agent?: {
    full_name: string;
    email: string;
  };
}

export default function AdminAgentRequestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requests, setRequests] = useState<AgentRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<AgentRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [agentId, setAgentId] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // Timeline states
  const [showTimelineDialog, setShowTimelineDialog] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const [currentUserRole, setCurrentUserRole] = useState<string>("");

  useEffect(() => {
    checkAdminAndLoadRequests();
  }, []);

  async function checkAdminAndLoadRequests() {
    try {
      const user = await authService.getCurrentUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || !["super_admin", "manager_admin", "worker_admin"].includes(profile.role)) {
        router.push("/admin/login");
        return;
      }

      setCurrentUserRole(profile.role);
      setLoading(false);
    } catch (error) {
      console.error("Error checking admin status:", error);
      router.push("/dashboard");
    }
  }

  async function loadRequests() {
    try {
      const response = await fetch("/api/admin/agent-requests/pending");
      const data = await response.json();

      if (data.success) {
        setRequests(data.requests || []);
      } else {
        setErrorMessage("Failed to load requests");
      }
    } catch (error) {
      console.error("Error loading requests:", error);
      setErrorMessage("Failed to load requests");
    } finally {
      setLoading(false);
    }
  }

  function viewDetails(request: AgentRequest) {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
  }

  function openAssignDialog(request: AgentRequest) {
    setSelectedRequest(request);
    setAgentId("");
    setAdminNotes("");
    setShowAssignDialog(true);
  }

  async function handleAssignAgent() {
    if (!selectedRequest || !agentId) {
      setErrorMessage("Agent ID is required");
      return;
    }

    setProcessing(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/agent-requests/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          agentId: agentId,
          adminNotes: adminNotes || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("Agent assigned successfully");
        setShowAssignDialog(false);
        await loadRequests();
      } else {
        setErrorMessage(data.error || "Failed to assign agent");
      }
    } catch (error) {
      console.error("Error assigning agent:", error);
      setErrorMessage("Failed to assign agent");
    } finally {
      setProcessing(false);
    }
  }

  async function handleUpdateStatus(requestId: string, status: string) {
    setProcessing(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/agent-requests/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(`Status updated to ${status}`);
        await loadRequests();
      } else {
        setErrorMessage(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setErrorMessage("Failed to update status");
    } finally {
      setProcessing(false);
    }
  }

  async function handleStatusUpdate(requestId: string, status: string) {
    setProcessing(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/agent-requests/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, newStatus: status })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(`Status updated to ${status}`);
        await loadRequests();
      } else {
        setErrorMessage(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setErrorMessage("Failed to update status");
    } finally {
      setProcessing(false);
    }
  }

  function getStatusBadgeVariant(status: string) {
    switch (status) {
      case "SUBMITTED":
        return "default";
      case "UNDER_REVIEW":
        return "secondary";
      case "ASSIGNED":
        return "outline";
      case "COMPLETED":
        return "default";
      case "REJECTED":
        return "destructive";
      default:
        return "default";
    }
  }

  function getRequestTypeLabel(type: string) {
    switch (type) {
      case "WORK":
        return "Work Permit / Employment";
      case "STUDENT":
        return "Student Visa / Education";
      case "FAMILY":
        return "Family Reunification";
      case "VISIT":
        return "Tourist / Visit Visa";
      case "OTHER":
        return "Other";
      default:
        return type;
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  const handleViewTimeline = async (requestId: string) => {
    setShowTimelineDialog(true);
    setTimelineLoading(true);

    try {
      const response = await fetch(`/api/admin/agent-requests/timeline?request_id=${requestId}`);
      const data = await response.json();

      if (data.success) {
        setTimelineEvents(data.timeline || []);
      } else {
        console.error("Failed to fetch timeline:", data.error);
        setErrorMessage("Failed to load timeline");
      }
    } catch (error) {
      console.error("Error fetching timeline:", error);
      setErrorMessage("Failed to load timeline");
    } finally {
      setTimelineLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "REQUEST_CREATED":
        return <FileText className="w-4 h-4 text-blue-600" />;
      case "AGENT_ASSIGNED":
        return <UserCheck className="w-4 h-4 text-green-600" />;
      case "STATUS_CHANGED":
        return <Clock className="w-4 h-4 text-orange-600" />;
      case "MESSAGE_SENT":
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      case "SYSTEM_MESSAGE":
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case "ADMIN_NOTE":
        return <FileText className="w-4 h-4 text-gray-600" />;
      case "ESCALATED":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatEventType = (eventType: string) => {
    return eventType.split("_").map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(" ");
  };

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

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Manage Agent Requests | Admin | Migrate Safely</title>
        <meta name="description" content="Admin panel for managing agent requests" />
      </Head>

      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Manage Agent Requests</h1>
              <p className="text-muted-foreground mt-2">
                Review and assign agents to member requests
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

            {requests.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending agent requests</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {requests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-xl">
                            {getRequestTypeLabel(request.request_type)}
                          </CardTitle>
                          <CardDescription>
                            {request.member_country_code} → {request.destination_country_code}
                          </CardDescription>
                        </div>
                        <Badge variant={getStatusBadgeVariant(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Member:</span>
                            <span>{request.member_profile?.full_name || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{request.member_profile?.email || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span>From: {request.member_profile?.country_code || request.member_country_code}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Submitted:</span>
                            <span>{formatDate(request.created_at)}</span>
                          </div>
                          {request.assigned_agent && (
                            <div className="flex items-center gap-2 text-sm">
                              <UserCheck className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">Agent:</span>
                              <span>{request.assigned_agent.full_name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {request.notes && (
                        <div className="pt-2 border-t">
                          <p className="text-sm font-medium mb-1">Member Notes:</p>
                          <p className="text-sm text-muted-foreground">{request.notes}</p>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => viewDetails(request)}>
                        View Details
                      </Button>
                      {request.status === "SUBMITTED" && (
                        <Button
                          variant="secondary"
                          onClick={() => handleUpdateStatus(request.id, "UNDER_REVIEW")}
                          disabled={processing}
                        >
                          Mark Under Review
                        </Button>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {(request.status === "SUBMITTED" || request.status === "UNDER_REVIEW") && (
                          <>
                            {currentUserRole === "worker_admin" ? (
                              <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
                                <AlertTriangle className="w-4 h-4 inline mr-1" />
                                Agent assignment restricted to Manager/Super Admins
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => openAssignDialog(request)}
                              >
                                <UserCheck className="w-4 h-4 mr-1" />
                                Assign Agent
                              </Button>
                            )}
                          </>
                        )}

                        {request.status === "ASSIGNED" && currentUserRole !== "worker_admin" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(request.id, "IN_PROGRESS")}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Mark In Progress
                          </Button>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewTimeline(request.id)}
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Timeline
                      </Button>
                      {request.status === "ASSIGNED" && (
                        <>
                          <Button
                            variant="default"
                            onClick={() => handleUpdateStatus(request.id, "COMPLETED")}
                            disabled={processing}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Completed
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleUpdateStatus(request.id, "REJECTED")}
                            disabled={processing}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Details Dialog */}
      {selectedRequest && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Request Details</DialogTitle>
              <DialogDescription>
                Complete information about this agent request
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Request Type</Label>
                <p className="text-sm text-muted-foreground">
                  {getRequestTypeLabel(selectedRequest.request_type)}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="mt-1">
                  <Badge variant={getStatusBadgeVariant(selectedRequest.status)}>
                    {selectedRequest.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Member Country</Label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.member_country_code}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Destination Country</Label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.destination_country_code}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Member Information</Label>
                <div className="space-y-1 mt-1">
                  <p className="text-sm text-muted-foreground">
                    Name: {selectedRequest.member_profile?.full_name || "N/A"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Email: {selectedRequest.member_profile?.email || "N/A"}
                  </p>
                </div>
              </div>
              {selectedRequest.notes && (
                <div>
                  <Label className="text-sm font-medium">Member Notes</Label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.notes}</p>
                </div>
              )}
              {selectedRequest.assigned_agent && (
                <div>
                  <Label className="text-sm font-medium">Assigned Agent</Label>
                  <div className="space-y-1 mt-1">
                    <p className="text-sm text-muted-foreground">
                      Name: {selectedRequest.assigned_agent.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Email: {selectedRequest.assigned_agent.email}
                    </p>
                    {selectedRequest.assigned_at && (
                      <p className="text-sm text-muted-foreground">
                        Assigned: {formatDate(selectedRequest.assigned_at)}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {selectedRequest.admin_notes && (
                <div>
                  <Label className="text-sm font-medium">Admin Notes</Label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.admin_notes}</p>
                </div>
              )}
              {selectedRequest.member_feedback && (
                <div>
                  <Label className="text-sm font-medium">Member Feedback</Label>
                  <p className="text-sm text-muted-foreground">{selectedRequest.member_feedback}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Outcome: <Badge>{selectedRequest.outcome_status}</Badge>
                  </p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium">Submitted</Label>
                <p className="text-sm text-muted-foreground">{formatDate(selectedRequest.created_at)}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Assign Agent Dialog */}
      {selectedRequest && (
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Agent</DialogTitle>
              <DialogDescription>
                Assign an agent to handle this request
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="agentId">Agent User ID *</Label>
                <Input
                  id="agentId"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  placeholder="Enter agent user ID"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the UUID of the agent from the profiles table
                </p>
              </div>
              <div>
                <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this assignment..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAssignDialog(false)} disabled={processing}>
                Cancel
              </Button>
              <Button onClick={handleAssignAgent} disabled={processing || !agentId}>
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  "Assign Agent"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Timeline Dialog */}
      <Dialog open={showTimelineDialog} onOpenChange={setShowTimelineDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agent Request Timeline</DialogTitle>
            <DialogDescription>
              Complete history of all events, messages, and status changes
            </DialogDescription>
          </DialogHeader>

          {timelineLoading ? (
            <div className="py-8 text-center text-gray-500">
              Loading timeline...
            </div>
          ) : timelineEvents.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No timeline events found
            </div>
          ) : (
            <div className="space-y-4">
              {timelineEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getEventIcon(event.event_type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    {/* Event Type */}
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">
                        {formatEventType(event.event_type)}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {new Date(event.event_timestamp).toLocaleString()}
                      </span>
                    </div>

                    {/* Actor Info */}
                    {event.actor_id && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">By:</span>{" "}
                        {event.actor?.email || event.actor_id}
                        {event.actor_role && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {event.actor_role}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Status Changes */}
                    {event.old_status && event.new_status && (
                      <div className="text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Status: </span>
                        <Badge variant="outline" className="text-xs">
                          {event.old_status}
                        </Badge>
                        <span className="mx-2">→</span>
                        <Badge variant="outline" className="text-xs">
                          {event.new_status}
                        </Badge>
                      </div>
                    )}

                    {/* Assigned Agent */}
                    {event.assigned_agent_id && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Agent Assigned:</span>{" "}
                        {event.assigned_agent?.email || event.assigned_agent_id}
                      </div>
                    )}

                    {/* Message Content */}
                    {event.message_content && (
                      <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {event.message_content}
                        </p>
                        {event.message_sender_type && (
                          <div className="mt-2 text-xs text-gray-500">
                            From: {event.message_sender_type}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    {event.notes && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Notes:</span> {event.notes}
                      </div>
                    )}

                    {/* Metadata */}
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <details className="text-xs text-gray-500">
                        <summary className="cursor-pointer hover:text-gray-700">
                          Additional Details
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTimelineDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}