import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { MainHeader } from "@/components/MainHeader";
import { authService } from "@/services/authService";
import { documentVerificationService, AdminDocumentVerificationRequest } from "@/services/documentVerificationService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, CheckCircle, XCircle, AlertCircle, Clock, Shield, Search, User, Mail, MessageSquare } from "lucide-react";
import Head from "next/head";

export default function AdminDocumentVerificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<AdminDocumentVerificationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AdminDocumentVerificationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<AdminDocumentVerificationRequest | null>(null);
  
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [processing, setProcessing] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewStatus, setReviewStatus] = useState("");
  const [adminResponse, setAdminResponse] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [adminRole, setAdminRole] = useState("");

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, filterStatus, searchTerm]);

  async function checkAccess() {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        router.push("/admin/login");
        return;
      }

      const profile = await authService.getUserProfile(user.id);
      if (!profile || !["worker_admin", "manager_admin", "chairman"].includes(profile.role)) {
        router.push("/");
        return;
      }

      setAdminRole(profile.role);
      await loadRequests();
    } catch (error) {
      console.error("Error checking access:", error);
      router.push("/admin");
    }
  }

  async function loadRequests() {
    try {
      setLoading(true);
      const data = await documentVerificationService.getPendingRequests();
      setRequests(data);
    } catch (error) {
      console.error("Error loading requests:", error);
      setErrorMessage("Failed to load document verification requests");
    } finally {
      setLoading(false);
    }
  }

  function filterRequests() {
    let filtered = [...requests];

    if (filterStatus !== "all") {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.ticketReference.toLowerCase().includes(lowerSearch) ||
        r.memberEmail.toLowerCase().includes(lowerSearch) ||
        r.memberFullName?.toLowerCase().includes(lowerSearch)
      );
    }

    setFilteredRequests(filtered);
  }

  function openReviewDialog(request: AdminDocumentVerificationRequest) {
    setSelectedRequest(request);
    setReviewStatus(request.status === "submitted" ? "under_review" : request.status);
    setAdminResponse(request.adminResponse || "");
    setInternalNotes(request.internalNotes || "");
    setShowReviewDialog(true);
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleSubmitReview() {
    if (!selectedRequest) return;

    setProcessing(true);
    setErrorMessage("");

    try {
      const result = await documentVerificationService.updateStatus(
        selectedRequest.requestId,
        reviewStatus,
        adminResponse,
        internalNotes
      );

      if (result.success) {
        setSuccessMessage("Review updated successfully");
        setShowReviewDialog(false);
        await loadRequests();
      } else {
        setErrorMessage(result.error || "Failed to update review");
      }
    } catch (error) {
      console.error("Error updating review:", error);
      setErrorMessage("An unexpected error occurred");
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading verification requests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Document Verifications | Admin Portal</title>
      </Head>
      <div className="min-h-screen bg-background">
        <MainHeader />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Document Verification Queue</h1>
                <p className="text-muted-foreground mt-2">
                  Review ticket-based document verification requests (No uploads stored)
                </p>
              </div>
              <Badge variant="outline" className="w-fit">
                <Shield className="h-3 w-3 mr-1" />
                {adminRole.replace(/_/g, " ").toUpperCase()}
              </Badge>
            </div>

            {successMessage && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Review Protocol
                    </h3>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                      <li>Check email inbox for documents with Ticket Reference</li>
                      <li>Documents are NOT stored in this system</li>
                      <li>Verify documents against member explanation</li>
                      <li>Provide advisory feedback only (No guarantees)</li>
                      <li>All actions are logged in immutable audit trail</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search ticket, email, or name..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="inconclusive">Inconclusive</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              {filteredRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No requests found matching your criteria
                  </CardContent>
                </Card>
              ) : (
                filteredRequests.map((request) => (
                  <Card key={request.requestId} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="font-mono">
                              {request.ticketReference}
                            </Badge>
                            <Badge className={documentVerificationService.getStatusColor(request.status)}>
                              {documentVerificationService.getStatusDisplay(request.status)}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            {documentVerificationService.getDocumentTypeDisplay(request.documentType, request.documentTypeOther)}
                          </CardTitle>
                          <CardDescription>
                            Country: <span className="font-medium text-foreground">{request.countryRelated}</span>
                          </CardDescription>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p>Submitted: {new Date(request.createdAt).toLocaleDateString()}</p>
                          <p>{new Date(request.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="p-3 bg-muted rounded-lg space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <User className="h-4 w-4" />
                              Member Details
                            </div>
                            <div className="text-sm space-y-1">
                              <p>{request.memberFullName || "Unknown Name"}</p>
                              <p className="text-muted-foreground">{request.memberEmail}</p>
                              {request.membershipNumber && (
                                <p className="text-xs font-mono">#{request.membershipNumber}</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium mb-1">Member Explanation:</p>
                            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded border">
                              {request.explanation}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {request.adminResponse && (
                            <div>
                              <p className="text-sm font-medium mb-1">Admin Response:</p>
                              <p className="text-sm text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30 p-3 rounded border border-blue-100 dark:border-blue-800">
                                {request.adminResponse}
                              </p>
                            </div>
                          )}

                          {request.internalNotes && (
                            <div>
                              <p className="text-sm font-medium mb-1 flex items-center gap-1">
                                <Shield className="h-3 w-3" /> Internal Notes:
                              </p>
                              <p className="text-sm text-yellow-700 bg-yellow-50 dark:text-yellow-300 dark:bg-yellow-900/30 p-3 rounded border border-yellow-100 dark:border-yellow-800">
                                {request.internalNotes}
                              </p>
                            </div>
                          )}

                          <Button 
                            className="w-full mt-2" 
                            onClick={() => openReviewDialog(request)}
                          >
                            Review & Respond
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>

        {/* Review Dialog */}
        {selectedRequest && (
          <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Review Verification Request</DialogTitle>
                <DialogDescription>
                  Update status and provide feedback. No files are stored in this system.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center gap-2 p-2 bg-muted rounded font-mono text-sm">
                  <span className="font-bold">Ticket:</span> {selectedRequest.ticketReference}
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={reviewStatus} onValueChange={setReviewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="verified">Verified (Advisory)</SelectItem>
                      <SelectItem value="inconclusive">Inconclusive</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Response to Member (Visible in Portal)</Label>
                  <Textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Provide your advisory feedback here..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Shield className="h-3 w-3" /> Internal Notes (Admin Only)
                  </Label>
                  <Textarea
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Internal tracking notes..."
                    rows={2}
                    className="bg-yellow-50/50 dark:bg-yellow-900/10"
                  />
                </div>

                {errorMessage && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowReviewDialog(false)} disabled={processing}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitReview} disabled={processing}>
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Update Request"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
}