import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AppHeader } from "@/components/AppHeader";
import { authService } from "@/services/authService";
import { tierBonusApprovalService, TierBonusApproval } from "@/services/tierBonusApprovalService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Loader2, CheckCircle, XCircle, Clock, Award, User, DollarSign, Calendar, AlertCircle, Shield, AlertTriangle } from "lucide-react";
import Head from "next/head";

export default function TierBonusApprovalsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState<TierBonusApproval[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<TierBonusApproval | null>(null);
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

      // Check if user is admin
      if (!authService.isAdmin(profile.role)) {
        router.push("/");
        return;
      }

      // Check if user can approve (Manager Admin or Super Admin)
      const canApproveFlag = authService.isManagerAdmin(profile.role) || authService.isSuperAdmin(profile.role);
      setCanApprove(canApproveFlag);

      await loadApprovals();
    } catch (error) {
      console.error("Error checking admin access:", error);
      router.push("/admin/login");
    }
  }

  async function loadApprovals() {
    try {
      setLoading(true);
      const data = await tierBonusApprovalService.getPendingApprovals();
      setApprovals(data);
    } catch (error) {
      console.error("Error loading approvals:", error);
      setErrorMessage("Failed to load tier bonus approvals");
    } finally {
      setLoading(false);
    }
  }

  function openApprovalDialog(approval: TierBonusApproval, action: "approve" | "reject") {
    setSelectedApproval(approval);
    setActionType(action);
    setAdminNotes("");
    setRejectionReason("");
    setErrorMessage("");
    setSuccessMessage("");
  }

  function closeDialog() {
    setSelectedApproval(null);
    setActionType(null);
    setAdminNotes("");
    setRejectionReason("");
  }

  async function handleApprovalAction() {
    if (!selectedApproval || !actionType) return;

    setProcessing(true);
    setErrorMessage("");

    try {
      let result;
      if (actionType === "approve") {
        result = await tierBonusApprovalService.approveTierBonus(selectedApproval.id, adminNotes);
      } else {
        if (!rejectionReason.trim()) {
          setErrorMessage("Rejection reason is required");
          setProcessing(false);
          return;
        }
        result = await tierBonusApprovalService.rejectTierBonus(selectedApproval.id, rejectionReason, adminNotes);
      }

      if (result.success) {
        setSuccessMessage(
          actionType === "approve"
            ? "Tier bonus approved and credited to member wallet"
            : "Tier bonus request rejected"
        );
        closeDialog();
        await loadApprovals();
      } else {
        setErrorMessage(result.error || "Failed to process tier bonus");
      }
    } catch (error) {
      console.error("Error processing tier bonus:", error);
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
            <p className="text-muted-foreground">Loading tier bonus approvals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Tier Bonus Approvals | Admin Portal</title>
      </Head>
      <div className="min-h-screen bg-background">
        <AppHeader />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Tier Bonus Approvals</h1>
                <p className="text-muted-foreground mt-2">
                  Review and approve loyalty tier bonus requests
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
                      System Separation Rules
                    </h3>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                      <li>Tier bonuses are SEPARATE from Prize Draw system</li>
                      <li>Tier bonuses are SEPARATE from Referral base bonus system</li>
                      <li>Tier bonuses credit to internal wallet only (no automatic withdrawals)</li>
                      <li>Manager Admin or Super Admin approval required before wallet credit</li>
                      <li>All actions are logged in immutable audit trail</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                      Tax & Compliance Notice
                    </h3>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Tier bonuses are taxable income. Members are solely responsible for tax declarations and compliance with local regulations.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {approvals.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground">No Pending Approvals</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    All tier bonus requests have been reviewed
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {approvals.map((approval) => (
                  <Card key={approval.id} className="border-l-4 border-l-yellow-500">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            {approval.memberFullName || approval.memberEmail}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            Tier Achieved: <span className="font-semibold">{approval.tierName}</span> (Level {approval.tierLevel})
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Pending
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Base Referral Bonus</p>
                          <p className="text-lg font-semibold text-foreground">
                            ৳{approval.baseReferralBonus.toFixed(2)} BDT
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Tier Bonus ({approval.bonusPercentage}%)</p>
                          <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                            + ৳{approval.calculatedBonusAmount.toFixed(2)} BDT
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Requested</p>
                          <p className="text-sm font-medium text-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(approval.requestedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm font-medium text-foreground mb-2">Calculation Details</p>
                        <p className="text-sm text-muted-foreground">
                          Base Referral Bonus: ৳{approval.baseReferralBonus.toFixed(2)} BDT
                          <br />
                          Tier Bonus Percentage: {approval.bonusPercentage}%
                          <br />
                          <span className="font-semibold text-foreground">
                            Calculated Tier Bonus: ৳{approval.calculatedBonusAmount.toFixed(2)} BDT
                          </span>
                        </p>
                      </div>

                      {canApprove ? (
                        <div className="flex gap-3 pt-4">
                          <Button
                            onClick={() => openApprovalDialog(approval, "approve")}
                            className="flex-1"
                            variant="default"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve & Credit Wallet
                          </Button>
                          <Button
                            onClick={() => openApprovalDialog(approval, "reject")}
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

        {/* Approval/Rejection Dialog */}
        {selectedApproval && actionType && (
          <Dialog open={true} onOpenChange={closeDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {actionType === "approve" ? "Approve Tier Bonus" : "Reject Tier Bonus"}
                </DialogTitle>
                <DialogDescription>
                  {actionType === "approve"
                    ? "Approve this tier bonus and credit to member wallet"
                    : "Reject this tier bonus request"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Member:</span> {selectedApproval.memberFullName || selectedApproval.memberEmail}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Tier:</span> {selectedApproval.tierName} (Level {selectedApproval.tierLevel})
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Bonus Amount:</span> ৳{selectedApproval.calculatedBonusAmount.toFixed(2)} BDT
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
                      placeholder="Explain why this tier bonus is being rejected"
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
                    placeholder={actionType === "approve" ? "Optional notes about approval" : "Optional internal notes"}
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
                  onClick={handleApprovalAction}
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