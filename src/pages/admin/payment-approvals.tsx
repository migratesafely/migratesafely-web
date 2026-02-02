import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AppHeader } from "@/components/AppHeader";
import { authService } from "@/services/authService";
import { paymentService, PaymentRequest } from "@/services/paymentService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Loader2, CheckCircle, XCircle, DollarSign, User, Building, Shield, AlertCircle, Wallet } from "lucide-react";
import Head from "next/head";

export default function PaymentApprovalsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [canApprove, setCanApprove] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        router.push("/admin/login");
        return;
      }

      const profile = await authService.getUserProfile(user.id);
      if (!profile) {
        router.push("/admin/login");
        return;
      }

      if (!authService.isAdmin(profile.role)) {
        router.push("/");
        return;
      }

      const canApproveFlag = authService.isManagerAdmin(profile.role) || authService.isSuperAdmin(profile.role);
      setCanApprove(canApproveFlag);

      await loadPaymentRequests();
    } catch (error) {
      console.error("Error checking admin access:", error);
      router.push("/admin/login");
    }
  }

  async function loadPaymentRequests() {
    try {
      setLoading(true);
      const data = await paymentService.getPendingPaymentRequests();
      setRequests(data);
    } catch (error) {
      console.error("Error loading payment requests:", error);
      setErrorMessage("Failed to load payment requests");
    } finally {
      setLoading(false);
    }
  }

  function openApprovalDialog(request: PaymentRequest, action: "approve" | "reject") {
    setSelectedRequest(request);
    setActionType(action);
    setAdminNotes("");
    setRejectionReason("");
    setErrorMessage("");
    setSuccessMessage("");
  }

  function closeDialog() {
    setSelectedRequest(null);
    setActionType(null);
    setAdminNotes("");
    setRejectionReason("");
  }

  async function handlePaymentAction() {
    if (!selectedRequest || !actionType) return;

    setProcessing(true);
    setErrorMessage("");

    try {
      let result;
      if (actionType === "approve") {
        result = await paymentService.approvePaymentRequest(selectedRequest.id, adminNotes);
      } else {
        if (!rejectionReason.trim()) {
          setErrorMessage("Rejection reason is required");
          setProcessing(false);
          return;
        }
        result = await paymentService.rejectPaymentRequest(selectedRequest.id, rejectionReason, adminNotes);
      }

      if (result.success) {
        setSuccessMessage(
          actionType === "approve"
            ? "Payment approved and funds moved to available balance"
            : "Payment request rejected"
        );
        closeDialog();
        await loadPaymentRequests();
      } else {
        setErrorMessage(result.error || "Failed to process payment");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      setErrorMessage("An unexpected error occurred");
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading payment requests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Payment Approvals | Admin Portal</title>
      </Head>
      <div className="min-h-screen bg-background">
        <AppHeader />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Payment Approvals</h1>
                <p className="text-muted-foreground mt-2">
                  Review and approve member payout requests
                </p>
              </div>
              {!canApprove && (
                <Badge variant="secondary" className="w-fit">
                  <Shield className="h-3 w-3 mr-1" />
                  View Only (Worker Admin)
                </Badge>
              )}
            </div>

            {successMessage && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Payment Governance Rules
                    </h3>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                      <li>All bonuses credited as pending wallet balance</li>
                      <li>Payments require verified bank details</li>
                      <li>Manager Admin or Super Admin approval required</li>
                      <li>All actions logged in immutable audit trail</li>
                      <li>NO automatic bank transfers allowed</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {requests.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground">No Pending Requests</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    All payment requests have been reviewed
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {requests.map((request) => (
                  <Card key={request.id} className="border-l-4 border-l-yellow-500">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            {request.memberFullName || request.memberEmail}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Payment Type: <span className="font-semibold capitalize">{request.paymentType.replace(/_/g, " ")}</span>
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Pending
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Payment Amount</p>
                          <p className="text-2xl font-bold text-foreground">
                            ৳{request.amount.toFixed(2)} BDT
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Wallet Balance</p>
                          <p className="text-lg font-semibold text-foreground">
                            ৳{request.walletBalance.toFixed(2)} BDT
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Pending Balance</p>
                          <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                            ৳{request.walletPendingBalance.toFixed(2)} BDT
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-muted rounded-lg space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium text-foreground">Bank Details (Read-Only)</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Account Holder:</span>
                            <p className="font-medium">{request.bankDetails.account_holder_name}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Bank:</span>
                            <p className="font-medium">{request.bankDetails.bank_name}</p>
                          </div>
                          {request.bankDetails.branch_name && (
                            <div>
                              <span className="text-muted-foreground">Branch:</span>
                              <p className="font-medium">{request.bankDetails.branch_name}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Account Number:</span>
                            <p className="font-medium">
                              {request.bankDetails.account_number.replace(/\d(?=\d{4})/g, "*")}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Country:</span>
                            <p className="font-medium">{request.bankDetails.country_code}</p>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Requested: {new Date(request.requestedAt).toLocaleString()}
                      </div>

                      {canApprove ? (
                        <div className="flex gap-3 pt-4">
                          <Button
                            onClick={() => openApprovalDialog(request, "approve")}
                            className="flex-1"
                            variant="default"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve & Move to Available
                          </Button>
                          <Button
                            onClick={() => openApprovalDialog(request, "reject")}
                            className="flex-1"
                            variant="destructive"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject Request
                          </Button>
                        </div>
                      ) : (
                        <Alert>
                          <Shield className="h-4 w-4" />
                          <AlertDescription>
                            Worker Admin can view only. Manager Admin or Super Admin approval required.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>

        {selectedRequest && actionType && (
          <Dialog open={true} onOpenChange={closeDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {actionType === "approve" ? "Approve Payment" : "Reject Payment"}
                </DialogTitle>
                <DialogDescription>
                  {actionType === "approve"
                    ? "Approve this payment and move funds to available balance"
                    : "Reject this payment request"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Member:</span> {selectedRequest.memberFullName || selectedRequest.memberEmail}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Payment Type:</span> {selectedRequest.paymentType.replace(/_/g, " ")}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Amount:</span> ৳{selectedRequest.amount.toFixed(2)} BDT
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Bank:</span> {selectedRequest.bankDetails.bank_name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Account:</span> {selectedRequest.bankDetails.account_number.replace(/\d(?=\d{4})/g, "*")}
                  </p>
                </div>

                {actionType === "reject" && (
                  <div className="space-y-2">
                    <label htmlFor="rejectionReason" className="text-sm font-medium">
                      Rejection Reason (Required)
                    </label>
                    <Textarea
                      id="rejectionReason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why this payment is being rejected"
                      rows={3}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="adminNotes" className="text-sm font-medium">
                    Admin Notes (Optional)
                  </label>
                  <Textarea
                    id="adminNotes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Optional internal notes"
                    rows={2}
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
                <Button variant="outline" onClick={closeDialog} disabled={processing}>
                  Cancel
                </Button>
                <Button
                  onClick={handlePaymentAction}
                  disabled={processing || (actionType === "reject" && !rejectionReason.trim())}
                  variant={actionType === "approve" ? "default" : "destructive"}
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {actionType === "approve" ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirm Approval
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Confirm Rejection
                        </>
                      )}
                    </>
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