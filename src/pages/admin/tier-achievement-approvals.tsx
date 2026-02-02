import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AppHeader } from "@/components/AppHeader";
import { authService } from "@/services/authService";
import { tierAchievementBonusService, TierAchievementBonus } from "@/services/tierAchievementBonusService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Loader2, CheckCircle, XCircle, Award, User, Calendar, AlertCircle, Shield, Clock, DollarSign } from "lucide-react";
import Head from "next/head";

export default function TierAchievementApprovalsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState<TierAchievementBonus[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<TierAchievementBonus | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [canApprove, setCanApprove] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

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
      setIsSuperAdmin(authService.isSuperAdmin(profile.role));

      await loadApprovals();
    } catch (error) {
      console.error("Error checking admin access:", error);
      router.push("/admin/login");
    }
  }

  async function loadApprovals() {
    try {
      setLoading(true);
      const data = await tierAchievementBonusService.getPendingApprovals();
      setApprovals(data);
    } catch (error) {
      console.error("Error loading approvals:", error);
      setErrorMessage("Failed to load tier achievement approvals");
    } finally {
      setLoading(false);
    }
  }

  function openApprovalDialog(approval: TierAchievementBonus, action: "approve" | "reject") {
    // Platinum tier requires Super Admin
    if (approval.tierName === "Platinum" && !isSuperAdmin) {
      setErrorMessage("Platinum tier achievement bonuses require Super Admin approval");
      return;
    }

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
        result = await tierAchievementBonusService.approveAchievementBonus(selectedApproval.id, adminNotes);
      } else {
        if (!rejectionReason.trim()) {
          setErrorMessage("Rejection reason is required");
          setProcessing(false);
          return;
        }
        result = await tierAchievementBonusService.rejectAchievementBonus(selectedApproval.id, rejectionReason, adminNotes);
      }

      if (result.success) {
        setSuccessMessage(
          actionType === "approve"
            ? "Tier achievement bonus approved and credited to member wallet"
            : "Tier achievement bonus request rejected"
        );
        closeDialog();
        await loadApprovals();
      } else {
        setErrorMessage(result.error || "Failed to process tier achievement bonus");
      }
    } catch (error) {
      console.error("Error processing tier achievement bonus:", error);
      setErrorMessage("An unexpected error occurred");
    } finally {
      setProcessing(false);
    }
  }

  function getTierColorClass(tierName: string): string {
    const colors: Record<string, string> = {
      Blue: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
      Bronze: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
      Silver: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      Gold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
      Platinum: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
    };
    return colors[tierName] || "bg-gray-100 text-gray-800";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading tier achievement approvals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Tier Achievement Approvals | Admin Portal</title>
      </Head>
      <div className="min-h-screen bg-background">
        <AppHeader />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Tier Achievement Approvals</h1>
                <p className="text-muted-foreground mt-2">
                  Review and approve one-time tier achievement bonus requests
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
                      Achievement Bonus Approval Rules
                    </h3>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                      <li>Bronze/Silver/Gold: Manager Admin or Super Admin approval</li>
                      <li>Platinum: Super Admin approval ONLY (mandatory manual review)</li>
                      <li>One-time lump-sum bonuses credited to member wallet</li>
                      <li>Completely separate from referral and tier percentage bonuses</li>
                      <li>All actions logged in immutable audit trail</li>
                    </ul>
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
                    All tier achievement bonus requests have been reviewed
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {approvals.map((approval) => (
                  <Card key={approval.id} className="border-l-4 border-l-purple-500">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            {approval.memberFullName || approval.memberEmail}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            Tier Achieved: <Badge className={getTierColorClass(approval.tierName)}>{approval.tierName}</Badge>
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
                          <p className="text-sm text-muted-foreground">Achievement Bonus</p>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                            <DollarSign className="h-5 w-5" />
                            ৳{approval.bonusAmount.toFixed(2)} BDT
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Tier Level</p>
                          <p className="text-lg font-semibold text-foreground">
                            Level {approval.tierLevel}
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

                      {approval.requiresEnhancedKyc && (
                        <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950">
                          <Shield className="h-4 w-4 text-purple-600" />
                          <AlertDescription className="text-purple-800 dark:text-purple-200">
                            <span className="font-semibold">Enhanced KYC Required</span> — Platinum tier achievement bonus requires enhanced verification.
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm font-medium text-foreground mb-2">Achievement Details</p>
                        <p className="text-sm text-muted-foreground">
                          Member: {approval.memberEmail}
                          <br />
                          Tier Achieved: {approval.tierName} (Level {approval.tierLevel})
                          <br />
                          One-time Achievement Bonus: ৳{approval.bonusAmount.toFixed(2)} BDT
                          <br />
                          <span className="font-semibold text-foreground">
                            Will be credited to member wallet upon approval
                          </span>
                        </p>
                      </div>

                      {canApprove ? (
                        <>
                          {approval.tierName === "Platinum" && !isSuperAdmin ? (
                            <Alert variant="destructive">
                              <Shield className="h-4 w-4" />
                              <AlertDescription>
                                Platinum tier achievement bonuses require Super Admin approval
                              </AlertDescription>
                            </Alert>
                          ) : (
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
                          )}
                        </>
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

        {selectedApproval && actionType && (
          <Dialog open={true} onOpenChange={closeDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {actionType === "approve" ? "Approve Tier Achievement Bonus" : "Reject Tier Achievement Bonus"}
                </DialogTitle>
                <DialogDescription>
                  {actionType === "approve"
                    ? "Approve this tier achievement bonus and credit to member wallet"
                    : "Reject this tier achievement bonus request"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Member:</span> {selectedApproval.memberFullName || selectedApproval.memberEmail}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Tier Achieved:</span> {selectedApproval.tierName} (Level {selectedApproval.tierLevel})
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Achievement Bonus:</span> ৳{selectedApproval.bonusAmount.toFixed(2)} BDT
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
                      placeholder="Explain why this tier achievement bonus is being rejected"
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