import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useLanguage } from "@/contexts/LanguageContext";
import { MainHeader } from "@/components/MainHeader";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, FileText, CheckCircle, XCircle, Clock, UserCheck, Mail, Phone } from "lucide-react";

const TEXT = {
  en: {
    pageTitle: "My Agent Requests | Migrate Safely",
    metaDescription: "View and manage your agent requests",
    title: "My Agent Requests",
    subtitle: "Track the status of your agent assistance requests",
    newRequest: "Request New Agent",
    noRequests: "No agent requests yet",
    noRequestsDesc: "Submit your first agent request to get personalized migration assistance",
    status: {
      SUBMITTED: "Submitted",
      UNDER_REVIEW: "Under Review",
      ASSIGNED: "Agent Assigned",
      COMPLETED: "Completed",
      REJECTED: "Rejected"
    },
    requestType: "Request Type:",
    destination: "Destination:",
    submittedOn: "Submitted:",
    assignedAgent: "Assigned Agent:",
    agentContact: "Contact:",
    notes: "Your Notes:",
    adminNotes: "Admin Notes:",
    provideFeedback: "Provide Feedback",
    feedback: {
      title: "Provide Feedback",
      description: "Share your experience with the agent assistance",
      outcome: "Outcome:",
      outcomeSuccess: "Success",
      outcomeFailed: "Failed",
      outcomeUnknown: "Unknown",
      feedbackLabel: "Your Feedback:",
      feedbackPlaceholder: "Share your experience, what worked well, what could be improved...",
      submit: "Submit Feedback",
      submitting: "Submitting...",
      success: "Feedback submitted successfully!",
      error: "Failed to submit feedback"
    },
    loading: "Loading requests...",
    loginRequired: "Please log in to view your requests"
  },
  bn: {
    pageTitle: "আমার এজেন্ট অনোধ | নিরাপদে মাইগ্রেট করুন",
    metaDescription: "আপনার এজেন্ট অনোধ দেখুন এবং পরিচালনা করুন",
    title: "আমার এজেন্ট অনোধ",
    subtitle: "আপনার এজেন্ট সহায়তা অনোধের স্ট্যাটাস ট্র্যাক করুন",
    newRequest: "নতুন এজেন্ট অনোধ করুন",
    noRequests: "এখনও কোন এজেন্ট অনোধ নেই",
    noRequestsDesc: "ব্যক্তিগত মাইগ্রেশন সহায়তা পেতে আপনার প্রথম এজেন্ট অনোধ জমা দিন",
    status: {
      SUBMITTED: "জমা দেওয়া হয়েছে",
      UNDER_REVIEW: "পর্যালোচনাধীন",
      ASSIGNED: "এজেন্ট নিয়োগ করা হয়েছে",
      COMPLETED: "সম্পন্ন",
      REJECTED: "প্রত্যাখ্যাত"
    },
    requestType: "অনুরোধের ধরন:",
    destination: "গন্তব্য:",
    submittedOn: "জমা দেওয়া হয়েছে:",
    assignedAgent: "নিয়োগকৃত এজেন্ট:",
    agentContact: "যোগাযোগ:",
    notes: "আপনার নোট:",
    adminNotes: "অ্যাডমিন নোট:",
    provideFeedback: "মতামত প্রদান করুন",
    feedback: {
      title: "মতামত প্রদান করুন",
      description: "এজেন্ট সহায়তার সাথে আপনার অভিজ্ঞতা শেয়ার করুন",
      outcome: "ফলাফল:",
      outcomeSuccess: "সফল",
      outcomeFailed: "ব্যর্থ",
      outcomeUnknown: "অজানা",
      feedbackLabel: "আপনার মতামত:",
      feedbackPlaceholder: "আপনার অভিজ্ঞতা শেয়ার করুন, কী ভাল কাজ করেছে, কী উন্নত করা যেতে পারে...",
      submit: "মতামত জমা দিন",
      submitting: "জমা দেওয়া হচ্ছে...",
      success: "মতামত সফলভাবে জমা দেওয়া হয়েছে!",
      error: "মতামত জমা দিতে ব্যর্থ"
    },
    loading: "অনুরোধ লোড হচ্ছে...",
    loginRequired: "আপনার অনোধ দেখতে দয়া করে লগইন করুন"
  }
};

const REQUEST_TYPE_LABELS = {
  WORK: { en: "Work Visa/Permit", bn: "ওয়ার্ক ভিসা/পারমিট" },
  STUDENT: { en: "Student Visa", bn: "স্টুডেন্ট ভিসা" },
  FAMILY: { en: "Family Reunification", bn: "পরিবার পুনর্মিলন" },
  VISIT: { en: "Visit/Tourist Visa", bn: "ভিজিট/ট্যুরিস্ট ভিসা" },
  OTHER: { en: "Other", bn: "অন্যান্য" }
};

interface AgentRequest {
  id: string;
  member_country_code: string;
  destination_country_code: string;
  request_type: string;
  notes: string | null;
  status: string;
  assigned_agent?: {
    full_name: string;
    email: string;
  };
  admin_notes: string | null;
  member_feedback: string | null;
  outcome_status: string;
  created_at: string;
}

export default function MyAgentRequestsPage() {
  const { language } = useLanguage();
  const t = TEXT[language];
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<AgentRequest[]>([]);
  const [authError, setAuthError] = useState("");

  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AgentRequest | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [outcomeStatus, setOutcomeStatus] = useState<"SUCCESS" | "FAILED" | "UNKNOWN">("SUCCESS");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        setAuthError(t.loginRequired);
        setLoading(false);
        return;
      }
      setIsAuthenticated(true);
      loadRequests();
    } catch (error) {
      setAuthError(t.loginRequired);
      setLoading(false);
    }
  }

  async function loadRequests() {
    setLoading(true);
    try {
      const response = await fetch("/api/agent-requests/my");
      const data = await response.json();

      if (response.ok && data.success) {
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Error loading requests:", error);
    } finally {
      setLoading(false);
    }
  }

  function openFeedbackDialog(request: AgentRequest) {
    setSelectedRequest(request);
    setFeedbackText(request.member_feedback || "");
    setOutcomeStatus(request.outcome_status as any || "SUCCESS");
    setFeedbackError("");
    setFeedbackSuccess(false);
    setFeedbackDialog(true);
  }

  async function submitFeedback() {
    if (!selectedRequest || !feedbackText.trim()) {
      setFeedbackError(language === "en" ? "Please provide feedback" : "দয়া করে মতামত প্রদান করুন");
      return;
    }

    setSubmittingFeedback(true);
    setFeedbackError("");

    try {
      const response = await fetch("/api/agent-requests/update-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          feedback: feedbackText.trim(),
          outcomeStatus,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setFeedbackSuccess(true);
        setTimeout(() => {
          setFeedbackDialog(false);
          loadRequests();
        }, 1500);
      } else {
        setFeedbackError(data.error || t.feedback.error);
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setFeedbackError(t.feedback.error);
    } finally {
      setSubmittingFeedback(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "UNDER_REVIEW":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "ASSIGNED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "SUBMITTED":
        return <FileText className="h-4 w-4" />;
      case "UNDER_REVIEW":
        return <Clock className="h-4 w-4" />;
      case "ASSIGNED":
        return <UserCheck className="h-4 w-4" />;
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>{t.pageTitle}</title>
          <meta name="description" content={t.metaDescription} />
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <MainHeader />
          <main className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          </main>
        </div>
      </>
    );
  }

  if (authError) {
    return (
      <>
        <Head>
          <title>{t.pageTitle}</title>
          <meta name="description" content={t.metaDescription} />
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <MainHeader />
          <main className="container mx-auto px-4 py-8 max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">{authError}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push("/login")}>
                  {language === "en" ? "Login" : "লগইন"}
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{t.pageTitle}</title>
        <meta name="description" content={t.metaDescription} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <MainHeader />

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {t.title}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {t.subtitle}
              </p>
            </div>
            <Button onClick={() => router.push("/request-agent")}>
              {t.newRequest}
            </Button>
          </div>

          {requests.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{t.noRequests}</CardTitle>
                <CardDescription>{t.noRequestsDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push("/request-agent")}>
                  {t.newRequest}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {requests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle>
                            {REQUEST_TYPE_LABELS[request.request_type as keyof typeof REQUEST_TYPE_LABELS]?.[language] || request.request_type}
                          </CardTitle>
                          <Badge className={getStatusColor(request.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(request.status)}
                              {t.status[request.status as keyof typeof t.status] || request.status}
                            </span>
                          </Badge>
                        </div>
                        <CardDescription>
                          {t.destination} {request.destination_country_code}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">{t.submittedOn}</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(request.created_at).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}
                        </p>
                      </div>
                    </div>

                    {request.notes && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t.notes}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {request.notes}
                        </p>
                      </div>
                    )}

                    {request.assigned_agent && (
                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                          {t.assignedAgent}
                        </p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <UserCheck className="h-4 w-4 text-blue-600" />
                            <span className="text-blue-900 dark:text-blue-100">
                              {request.assigned_agent.full_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-blue-600" />
                            <a
                              href={`mailto:${request.assigned_agent.email}`}
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {request.assigned_agent.email}
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {request.admin_notes && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t.adminNotes}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                          {request.admin_notes}
                        </p>
                      </div>
                    )}

                    {request.status === "COMPLETED" && !request.member_feedback && (
                      <Button
                        onClick={() => openFeedbackDialog(request)}
                        variant="outline"
                        className="w-full"
                      >
                        {t.provideFeedback}
                      </Button>
                    )}

                    {request.member_feedback && (
                      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                          {language === "en" ? "Your Feedback" : "আপনার মতামত"}
                        </p>
                        <p className="text-sm text-green-900 dark:text-green-100 whitespace-pre-wrap">
                          {request.member_feedback}
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                          {language === "en" ? "Outcome" : "ফলাফল"}: {request.outcome_status}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      <Dialog open={feedbackDialog} onOpenChange={setFeedbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.feedback.title}</DialogTitle>
          </DialogHeader>

          {feedbackSuccess ? (
            <div className="py-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-green-600 font-medium">{t.feedback.success}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t.feedback.description}
              </p>

              <div className="space-y-2">
                <Label htmlFor="outcomeStatus">{t.feedback.outcome}</Label>
                <select
                  id="outcomeStatus"
                  value={outcomeStatus}
                  onChange={(e) => setOutcomeStatus(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SUCCESS">{t.feedback.outcomeSuccess}</option>
                  <option value="FAILED">{t.feedback.outcomeFailed}</option>
                  <option value="UNKNOWN">{t.feedback.outcomeUnknown}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedbackText">{t.feedback.feedbackLabel}</Label>
                <Textarea
                  id="feedbackText"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={t.feedback.feedbackPlaceholder}
                  rows={6}
                  className="resize-none"
                />
              </div>

              {feedbackError && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-900 dark:text-red-100 text-sm">{feedbackError}</p>
                </div>
              )}
            </div>
          )}

          {!feedbackSuccess && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setFeedbackDialog(false)}
                disabled={submittingFeedback}
              >
                {language === "en" ? "Cancel" : "বাতিল"}
              </Button>
              <Button onClick={submitFeedback} disabled={submittingFeedback}>
                {submittingFeedback ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.feedback.submitting}
                  </>
                ) : (
                  t.feedback.submit
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}