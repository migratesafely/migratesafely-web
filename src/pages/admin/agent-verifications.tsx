import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { MainHeader } from "@/components/MainHeader";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Search, CheckCircle, AlertTriangle, XCircle, Clock, FileText, Download, Send, Shield } from "lucide-react";

export default function AgentVerificationsAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  
  // Action states
  const [adminNote, setAdminNote] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [processing, setProcessing] = useState(false);
  const [outcome, setOutcome] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Check if user is chairman
      const { data: employee } = await supabase
        .from("employees")
        .select("role_category")
        .eq("user_id", user.id)
        .maybeSingle();

      const isChairman = employee?.role_category === "chairman";

      // Get profile role for fallback admin check
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

      if (!isChairman && !["manager_admin", "worker_admin"].includes(profile?.role || "")) {
        router.push("/dashboard");
        return;
      }

      setCurrentUserRole(profile.role);

      // Load verifications
      let query = supabase
        .from("agent_verification_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (activeTab === "pending") {
        query = query.eq("status", "pending");
      } else if (activeTab === "completed") {
        query = query.neq("status", "pending");
      }

      const { data, error } = await query;

      if (error) throw error;
      setVerifications(data || []);
    } catch (error) {
      console.error("Error checking access:", error);
      router.push("/admin");
    }
  };

  const handleUpdateOutcome = async () => {
    if (!outcome) return;
    
    // STRICT GOVERNANCE: Only super_admin and manager_admin can approve/reject
    if (!["super_admin", "manager_admin"].includes(currentUserRole)) {
      alert("Access Denied: Only Admin and Super Admin roles can approve or reject agent verifications. This restriction prevents conflicts of interest and corruption.");
      return;
    }

    setProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("agent_verification_requests")
        .update({
          status: "completed",
          outcome: outcome,
          admin_notes: adminNote || selectedVerification.admin_notes,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", selectedVerification.id);

      if (error) throw error;

      // Automatically send message to member based on outcome
      const messageSubject = `Verification Request Update - ${selectedVerification.agent_name}`;
      let messageTemplate = "";

      if (outcome === "appears_legitimate") {
        messageTemplate = `Dear Member,\n\nWe have reviewed your verification request for ${selectedVerification.agent_name}.\n\nBased on our checks, this agent appears to be legitimate. However, please always proceed with caution and ensure you have a written contract for any services.\n\nBest regards,\nMigrate Safely Team`;
      } else if (outcome === "high_risk") {
        messageTemplate = `Dear Member,\n\n⚠️ CAUTION ADVISED\n\nWe have reviewed your verification request for ${selectedVerification.agent_name} and identified potential risk indicators.\n\nWe advise exercising extreme caution before proceeding with any payments or sharing personal documents.\n\nBest regards,\nMigrate Safely Team`;
      } else {
        messageTemplate = `Dear Member,\n\nWe have reviewed your verification request for ${selectedVerification.agent_name}.\n\nAt this time, we were unable to definitively verify this agent's credentials. Please proceed with caution.\n\nBest regards,\nMigrate Safely Team`;
      }

      // Send the automated message
      await supabase.from("messages").insert({
        sender_user_id: user?.id,
        recipient_id: selectedVerification.member_id,
        sender_role: "ADMIN",
        recipient_role: "MEMBER",
        subject: messageSubject,
        body: messageTemplate,
        message_type: "verification_outcome"
      });

      // Refresh data
      checkAccess();
      setSelectedVerification(null);
      setOutcome("");
      setAdminNote("");
    } catch (error) {
      console.error("Error updating outcome:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageBody) return;
    setProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from("messages").insert({
        sender_user_id: user?.id,
        recipient_id: selectedVerification.member_id,
        sender_role: "ADMIN",
        recipient_role: "MEMBER",
        subject: `Regarding Agent Verification - ${selectedVerification.agent_name}`,
        body: messageBody,
        message_type: "support"
      });

      setMessageBody("");
      alert("Message sent successfully");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setProcessing(false);
    }
  };

  async function handleReject(agentId: string, reason: string) {
    setProcessing(true);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Check if user is Chairman
      const { data: employee } = await supabase
        .from("employees")
        .select("role_category")
        .eq("user_id", session.user.id)
        .maybeSingle();

      const isChairman = employee?.role_category === "chairman";
      if (!isChairman) {
        setError("Only Chairman can reject agents");
        setProcessing(false);
        return;
      }
    } catch (error) {
      console.error("Error rejecting agent:", error);
    } finally {
      setProcessing(false);
    }
  };

  const filteredVerifications = verifications.filter(v => 
    v.agent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.membership_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.agent_country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case "appears_legitimate":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Appears Legitimate</Badge>;
      case "high_risk":
        return <Badge className="bg-red-100 text-red-800 border-red-200">High Risk - Caution</Badge>;
      case "unable_to_verify":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Unable to Verify</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MainHeader />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Agent Verification Requests
            </h1>
          </div>
        </div>

        {/* GOVERNANCE NOTICE - Admin-facing only */}
        {currentUserRole === "worker_admin" && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-amber-800">Restricted Access - Governance Policy</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Agent approvals are restricted to <strong>Admin and Super Admin roles only</strong> to prevent conflicts of interest or corruption. 
                  Worker roles can view and investigate applications but cannot approve or reject agents.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="p-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
              <TabsList>
                <TabsTrigger value="pending">Pending Review</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search agent or member..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent text-sm"
                />
              </div>
            </div>

            <TabsContent value="pending" className="mt-0">
              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : filteredVerifications.length === 0 ? (
                <div className="text-center p-12 text-gray-500">
                  No pending verification requests found
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredVerifications.map((item) => (
                    <Card 
                      key={item.id} 
                      className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-yellow-500"
                      onClick={() => setSelectedVerification(item)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {item.agent_name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.agent_country} • {item.contact_method}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <span>Member: {item.membership_number}</span>
                            <span>•</span>
                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-yellow-50">Pending</Badge>
                      </div>
                      
                      {/* Risk flags preview */}
                      {(item.asked_upfront_payment || item.promised_guarantee || item.refused_license) && (
                        <div className="mt-3 flex gap-2">
                          {item.asked_upfront_payment && (
                            <Badge variant="destructive" className="text-xs">Asked Upfront Payment</Badge>
                          )}
                          {item.promised_guarantee && (
                            <Badge variant="destructive" className="text-xs">Guaranteed Visa</Badge>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-0">
              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : filteredVerifications.length === 0 ? (
                <div className="text-center p-12 text-gray-500">
                  No completed verifications found
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredVerifications.map((item) => (
                    <Card 
                      key={item.id} 
                      className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-gray-200"
                      onClick={() => setSelectedVerification(item)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {item.agent_name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.agent_country} • {item.contact_method}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <span>Member: {item.membership_number}</span>
                            <span>•</span>
                            <span>Reviewed: {new Date(item.reviewed_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {getOutcomeBadge(item.outcome)}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Details Dialog */}
        <Dialog open={!!selectedVerification} onOpenChange={(open) => !open && setSelectedVerification(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Verification Request Details</DialogTitle>
              <DialogDescription>
                Submitted by Member #{selectedVerification?.membership_number} on {new Date(selectedVerification?.created_at).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>

            {selectedVerification && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Left Column: Agent Details */}
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4" /> Agent Information
                    </h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Name:</dt>
                        <dd className="font-medium">{selectedVerification.agent_name}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Company:</dt>
                        <dd className="font-medium">{selectedVerification.company_name || "N/A"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Phone:</dt>
                        <dd className="font-medium">{selectedVerification.phone_number}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Country:</dt>
                        <dd className="font-medium">{selectedVerification.agent_country}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Contact Method:</dt>
                        <dd className="font-medium">{selectedVerification.contact_method}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-900">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-700 dark:text-red-400">
                      <AlertTriangle className="h-4 w-4" /> Risk Indicators
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        {selectedVerification.asked_upfront_payment ? <CheckCircle className="h-4 w-4 text-red-500" /> : <XCircle className="h-4 w-4 text-gray-400" />}
                        <span>Asked for upfront payment</span>
                      </li>
                      <li className="flex items-center gap-2">
                        {selectedVerification.promised_guarantee ? <CheckCircle className="h-4 w-4 text-red-500" /> : <XCircle className="h-4 w-4 text-gray-400" />}
                        <span>Promised guaranteed visa</span>
                      </li>
                      <li className="flex items-center gap-2">
                        {selectedVerification.refused_license ? <CheckCircle className="h-4 w-4 text-red-500" /> : <XCircle className="h-4 w-4 text-gray-400" />}
                        <span>Refused to provide license</span>
                      </li>
                      <li className="flex items-center gap-2">
                        {selectedVerification.private_comm_only ? <CheckCircle className="h-4 w-4 text-red-500" /> : <XCircle className="h-4 w-4 text-gray-400" />}
                        <span>Private communication only</span>
                      </li>
                    </ul>
                  </div>

                  {selectedVerification.evidence_files && selectedVerification.evidence_files.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Evidence Files
                      </h3>
                      <ul className="space-y-2">
                        {selectedVerification.evidence_files.map((file: any, idx: number) => (
                          <li key={idx} className="flex items-center justify-between text-sm bg-white dark:bg-gray-900 p-2 rounded border">
                            <span className="truncate max-w-[200px]">{file.name}</span>
                            <a 
                              href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/verification-evidence/${file.path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Right Column: Actions */}
                <div className="space-y-6">
                  {selectedVerification.additional_details && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Member Notes</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {selectedVerification.additional_details}
                      </p>
                    </div>
                  )}

                  {selectedVerification.status === "pending" ? (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">Review Outcome</h3>
                      
                      {!["super_admin", "manager_admin"].includes(currentUserRole) ? (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                          <div className="flex items-start">
                            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                            <div>
                              <h4 className="text-sm font-semibold text-red-800 mb-1">Access Denied - Governance Policy</h4>
                              <p className="text-sm text-red-700">
                                <strong>Agent approvals are restricted to Admin and Super Admin roles only</strong> to prevent conflicts of interest or corruption.
                              </p>
                              <p className="text-sm text-red-700 mt-2">
                                Your role (<strong>{currentUserRole}</strong>) can view and investigate applications but cannot approve or reject agents. 
                                Please escalate to an Admin or Super Admin for final approval.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-3">
                            <Button 
                              variant={outcome === "appears_legitimate" ? "default" : "outline"}
                              className={outcome === "appears_legitimate" ? "bg-green-600 hover:bg-green-700" : ""}
                              onClick={() => setOutcome("appears_legitimate")}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Appears Legitimate
                            </Button>
                            <Button 
                              variant={outcome === "high_risk" ? "default" : "outline"}
                              className={outcome === "high_risk" ? "bg-red-600 hover:bg-red-700" : ""}
                              onClick={() => setOutcome("high_risk")}
                            >
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              High Risk - Caution Advised
                            </Button>
                            <Button 
                              variant={outcome === "unable_to_verify" ? "default" : "outline"}
                              className={outcome === "unable_to_verify" ? "bg-gray-600 hover:bg-gray-700" : ""}
                              onClick={() => setOutcome("unable_to_verify")}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Unable to Verify
                            </Button>
                          </div>

                          <div>
                            <Label>Internal Admin Notes</Label>
                            <Textarea 
                              value={adminNote}
                              onChange={(e) => setAdminNote(e.target.value)}
                              placeholder="Add internal notes about your findings..."
                              className="mt-1"
                            />
                          </div>

                          <Button 
                            className="w-full" 
                            disabled={!outcome || processing}
                            onClick={handleUpdateOutcome}
                          >
                            {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                            Submit Outcome & Notify Member
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">Review Completed</h3>
                      <p className="text-sm mb-2">
                        <strong>Outcome:</strong> {getOutcomeBadge(selectedVerification.outcome)}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Admin Notes:</strong> {selectedVerification.admin_notes || "No notes"}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Reviewed on {new Date(selectedVerification.reviewed_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Send className="h-4 w-4" /> Send Message to Member
                    </h3>
                    <div className="space-y-3">
                      <Textarea 
                        value={messageBody}
                        onChange={(e) => setMessageBody(e.target.value)}
                        placeholder="Type a message to the member..."
                        rows={3}
                      />
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-full"
                        disabled={!messageBody || processing}
                        onClick={handleSendMessage}
                      >
                        Send Internal Message
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}