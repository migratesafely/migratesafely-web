import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AppHeader } from "@/components/AppHeader";
import { authService } from "@/services/authService";
import { documentVerificationService, DocumentVerificationRequest } from "@/services/documentVerificationService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, FileText, AlertCircle, CheckCircle, Info, Mail, Copy, Check } from "lucide-react";
import Head from "next/head";

export default function DocumentVerificationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState<DocumentVerificationRequest[]>([]);
  
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState("");
  const [copiedTicket, setCopiedTicket] = useState(false);
  
  const [documentType, setDocumentType] = useState("");
  const [documentTypeOther, setDocumentTypeOther] = useState("");
  const [countryRelated, setCountryRelated] = useState("");
  const [explanation, setExplanation] = useState("");
  
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  async function checkAuthAndLoad() {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        router.push("/login?redirect=/document-verification");
        return;
      }

      await loadMyRequests();
      setLoading(false);
    } catch (error) {
      console.error("Error checking auth:", error);
      router.push("/login");
    }
  }

  async function loadMyRequests() {
    try {
      const requests = await documentVerificationService.getMemberRequests();
      setMyRequests(requests);
    } catch (error) {
      console.error("Error loading requests:", error);
    }
  }

  function handleNewRequest() {
    setShowForm(true);
    setDocumentType("");
    setDocumentTypeOther("");
    setCountryRelated("");
    setExplanation("");
    setErrorMessage("");
  }

  async function handleSubmit() {
    setErrorMessage("");

    // Validation
    if (!documentType) {
      setErrorMessage("Please select a document type");
      return;
    }

    if (documentType === "other" && !documentTypeOther.trim()) {
      setErrorMessage("Please specify the document type");
      return;
    }

    if (!countryRelated.trim()) {
      setErrorMessage("Please specify the country related to this document");
      return;
    }

    if (!explanation.trim() || explanation.trim().length < 20) {
      setErrorMessage("Please provide a detailed explanation (minimum 20 characters)");
      return;
    }

    setSubmitting(true);

    try {
      const result = await documentVerificationService.submitRequest(
        documentType,
        documentType === "other" ? documentTypeOther : null,
        countryRelated.trim(),
        explanation.trim()
      );

      if (result.success && result.ticketReference) {
        setGeneratedTicket(result.ticketReference);
        setShowForm(false);
        setShowSuccess(true);
        await loadMyRequests();
      } else {
        setErrorMessage(result.error || "Failed to submit request");
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      setErrorMessage("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  function copyTicketToClipboard() {
    navigator.clipboard.writeText(generatedTicket);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2000);
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
        <title>Document Verification | Migrate Safely</title>
      </Head>
      <div className="min-h-screen bg-background">
        <AppHeader />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Document Verification</h1>
                <p className="text-muted-foreground mt-2">
                  Request verification of sponsorship letters, invitations, and employment documents
                </p>
              </div>
              <Button onClick={handleNewRequest}>
                <FileText className="h-4 w-4 mr-2" />
                New Verification Request
              </Button>
            </div>

            {/* Important Notice */}
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-1">How Document Verification Works</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Submit a verification request to receive a unique ticket reference</li>
                  <li>Email your documents to <strong>verification@migratesafely.com</strong> with the ticket reference</li>
                  <li>Our team will review and provide advisory feedback via your member portal</li>
                  <li>Verification is advisory only and does not guarantee authenticity or outcome</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* My Requests */}
            <Card>
              <CardHeader>
                <CardTitle>My Verification Requests</CardTitle>
                <CardDescription>View status and responses for your document verification requests</CardDescription>
              </CardHeader>
              <CardContent>
                {myRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No verification requests yet</p>
                    <Button onClick={handleNewRequest} className="mt-4" variant="outline">
                      Submit Your First Request
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myRequests.map((request) => (
                      <Card key={request.requestId} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">Ticket Reference</p>
                                <p className="font-mono font-semibold text-lg">{request.ticketReference}</p>
                              </div>
                              <Badge className={documentVerificationService.getStatusColor(request.status)}>
                                {documentVerificationService.getStatusDisplay(request.status)}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Document Type</p>
                                <p className="font-medium">
                                  {documentVerificationService.getDocumentTypeDisplay(request.documentType, request.documentTypeOther)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Country</p>
                                <p className="font-medium">{request.countryRelated}</p>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm text-muted-foreground">Your Explanation</p>
                              <p className="text-sm">{request.explanation}</p>
                            </div>

                            {request.adminResponse && (
                              <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                                <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
                                  Admin Response:
                                </p>
                                <p className="text-sm text-green-800 dark:text-green-200">{request.adminResponse}</p>
                              </div>
                            )}

                            <div className="text-xs text-muted-foreground">
                              Submitted: {new Date(request.createdAt).toLocaleString()}
                              {request.reviewedAt && ` • Reviewed: ${new Date(request.reviewedAt).toLocaleString()}`}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        {/* New Request Form Dialog */}
        {showForm && (
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Request Document Verification</DialogTitle>
                <DialogDescription>
                  Submit a verification request. You'll receive a ticket reference to email your documents.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800 dark:text-yellow-200 text-sm">
                    <strong>Important:</strong> Do NOT upload documents here. You will receive a reference number and email instructions after submission.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="documentType">Document Type *</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger id="documentType">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sponsorship_letter">Sponsorship Letter</SelectItem>
                      <SelectItem value="invitation_letter">Invitation Letter</SelectItem>
                      <SelectItem value="student_confirmation">Student Confirmation</SelectItem>
                      <SelectItem value="employment_offer">Employment Offer</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {documentType === "other" && (
                  <div className="space-y-2">
                    <Label htmlFor="documentTypeOther">Specify Document Type *</Label>
                    <Input
                      id="documentTypeOther"
                      value={documentTypeOther}
                      onChange={(e) => setDocumentTypeOther(e.target.value)}
                      placeholder="Enter document type"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="countryRelated">Country Related to Document *</Label>
                  <Input
                    id="countryRelated"
                    value={countryRelated}
                    onChange={(e) => setCountryRelated(e.target.value)}
                    placeholder="e.g., Canada, Australia, United Kingdom"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="explanation">Explanation / Concern *</Label>
                  <Textarea
                    id="explanation"
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="Please explain what you need verified and any concerns you have (minimum 20 characters)"
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 20 characters • {explanation.length} characters
                  </p>
                </div>

                {errorMessage && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setShowForm(false)} disabled={submitting} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Request"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Success Dialog */}
        {showSuccess && (
          <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-6 w-6" />
                  Request Submitted Successfully
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="p-6 bg-green-50 dark:bg-green-950 border-2 border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200 mb-4">
                    Your ticket reference has been generated:
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-4 bg-white dark:bg-gray-900 border border-green-300 dark:border-green-700 rounded font-mono text-2xl font-bold text-center">
                      {generatedTicket}
                    </div>
                    <Button onClick={copyTicketToClipboard} variant="outline" size="icon">
                      {copiedTicket ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    <p className="font-semibold mb-2">Next Steps:</p>
                    <ol className="text-sm space-y-2 list-decimal list-inside">
                      <li>
                        Email your documents to{" "}
                        <strong className="font-mono">verification@migratesafely.com</strong>
                      </li>
                      <li>
                        Include your ticket reference <strong className="font-mono">{generatedTicket}</strong> in the email subject line
                      </li>
                      <li>Our team will review and respond via your member portal within 3-5 business days</li>
                      <li>Check the "Document Verification" page for status updates</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Disclaimer:</strong> Verification is advisory only and does not guarantee document authenticity or
                    immigration/visa outcome. Members are solely responsible for verifying documents with official authorities.
                  </p>
                </div>

                <Button onClick={() => setShowSuccess(false)} className="w-full">
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
}