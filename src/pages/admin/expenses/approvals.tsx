import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { MainHeader } from "@/components/MainHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { agentPermissionsService } from "@/services/agentPermissionsService";
import { AlertCircle, CheckCircle2, XCircle, FileText, Calendar, DollarSign, User, Building, Eye, Download } from "lucide-react";
import { formatBDT } from "@/lib/bdtFormatter";
import { useToast } from "@/hooks/use-toast";

interface ExpenseRequest {
  id: string;
  created_at: string;
  created_by: string;
  expense_category: string;
  description: string;
  amount: number;
  expense_date: string;
  department: string;
  status: string;
  receipt_urls: string[] | null;
  business_purpose: string;
  cost_centre?: string;
  chairman_approval_required: boolean;
  rejection_reason?: string;
  created_by_profile?: {
    id: string;
    full_name: string;
    email: string;
  };
  created_by_employee?: {
    department: string;
    role_category: string;
  };
}

export default function ExpenseApprovalsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expenses, setExpenses] = useState<ExpenseRequest[]>([]);
  const [userRole, setUserRole] = useState("");
  const [userDepartment, setUserDepartment] = useState("");
  const [userAuthorized, setUserAuthorized] = useState(false);

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    checkAuthorizationAndLoad();
  }, []);

  const checkAuthorizationAndLoad = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      // Check if user is an authorized employee
      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .select("id, department, role_category")
        .eq("user_id", user.id)
        .single();

      if (employeeError || !employee) {
        setError("Access denied. Only authorized employees can view expense approvals.");
        setLoading(false);
        return;
      }

      const role = employee.role_category;
      const dept = employee.department;

      // Check if user has approval authority (Super Admin replaces Chairman)
      const isSuperAdmin = await agentPermissionsService.isSuperAdmin(user.id);
      const approvalRoles = ["department_head", "general_manager", "managing_director"];
      
      const hasAuthority = approvalRoles.includes(role) || isSuperAdmin;

      if (!hasAuthority) {
        setError("You do not have approval authority.");
        setLoading(false);
        return;
      }

      setUserRole(isSuperAdmin ? "super_admin" : role);
      setUserDepartment(dept);
      setUserAuthorized(true);
      await loadPendingApprovals();

    } catch (err) {
      console.error("Authorization error:", err);
      setError("Failed to verify authorization");
      setLoading(false);
    }
  };

  const loadPendingApprovals = async () => {
    try {
      const response = await fetch("/api/admin/expenses/pending-approvals");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load pending approvals");
      }

      setExpenses(data.expenses || []);
      setUserRole(data.userRole);
      setUserDepartment(data.userDepartment);
    } catch (err: any) {
      console.error("Error loading approvals:", err);
      setError(err.message || "Failed to load pending approvals");
    } finally {
      setLoading(false);
    }
  };

  const getApprovalLevel = (role: string): string => {
    // Map Chairman to highest authority (formerly chairman)
    if (role === "super_admin") return "chairman";
    
    const mapping: Record<string, string> = {
      department_head: "dept_head",
      general_manager: "gm",
      managing_director: "md"
    };
    return mapping[role] || "";
  };

  const handleApprove = async () => {
    if (!selectedExpense) return;

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const approvalLevel = getApprovalLevel(userRole);

      const response = await fetch("/api/admin/expenses/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expense_request_id: selectedExpense.id,
          approval_level: approvalLevel
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to approve expense");
      }

      setSuccess(`Expense approved successfully at ${approvalLevel.replace("_", " ").toUpperCase()} level`);
      setApproveModalOpen(false);
      setSelectedExpense(null);
      
      // Reload approvals
      await loadPendingApprovals();

    } catch (err: any) {
      console.error("Approval error:", err);
      setError(err.message || "Failed to approve expense");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedExpense || !rejectionReason.trim()) {
      setError("Rejection reason is required");
      return;
    }

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/expenses/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expense_request_id: selectedExpense.id,
          rejection_reason: rejectionReason.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reject expense");
      }

      setSuccess("Expense rejected successfully");
      setRejectModalOpen(false);
      setSelectedExpense(null);
      setRejectionReason("");
      
      // Reload approvals
      await loadPendingApprovals();

    } catch (err: any) {
      console.error("Rejection error:", err);
      setError(err.message || "Failed to reject expense");
    } finally {
      setActionLoading(false);
    }
  };

  const openViewModal = (expense: ExpenseRequest) => {
    setSelectedExpense(expense);
    setViewModalOpen(true);
  };

  const openApproveModal = (expense: ExpenseRequest) => {
    setSelectedExpense(expense);
    setApproveModalOpen(true);
  };

  const openRejectModal = (expense: ExpenseRequest) => {
    setSelectedExpense(expense);
    setRejectModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      submitted: "bg-blue-500",
      dept_head_approved: "bg-indigo-500",
      gm_approved: "bg-purple-500",
      md_approved: "bg-pink-500",
      approved: "bg-green-500",
      rejected: "bg-red-500"
    };

    const statusLabels: Record<string, string> = {
      submitted: "Pending Dept Head",
      dept_head_approved: "Pending GM",
      gm_approved: "Pending MD",
      md_approved: "Pending Chairman",
      approved: "Approved",
      rejected: "Rejected"
    };

    return (
      <Badge className={`${statusColors[status] || "bg-gray-500"} text-white`}>
        {statusLabels[status] || status}
      </Badge>
    );
  };

  const getRoleLabel = (role: string): string => {
    const labels: Record<string, string> = {
      department_head: "Department Head",
      general_manager: "General Manager",
      managing_director: "Managing Director",
      super_admin: "Super Admin (Final Authority)",
      chairman: "Chairman (Final Authority)"
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <>
        <MainHeader />
        <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
          <div className="container max-w-7xl mx-auto px-4 py-8">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      </>
    );
  }

  if (!userAuthorized) {
    return (
      <>
        <MainHeader />
        <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
          <div className="container max-w-7xl mx-auto px-4 py-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MainHeader />
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Expense Approvals</h1>
                <p className="text-muted-foreground">
                  Review and approve expense requests • Your role: <span className="font-semibold">{getRoleLabel(userRole)}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
                <p className="text-3xl font-bold">{expenses.length}</p>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200 mb-6">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Pending Approvals List */}
          <div className="space-y-4">
            {expenses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="text-muted-foreground mb-2">No pending approvals</p>
                  <p className="text-sm text-muted-foreground">
                    All expense requests in your approval queue have been processed
                  </p>
                </CardContent>
              </Card>
            ) : (
              expenses.map((expense) => (
                <Card key={expense.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {expense.description}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {expense.expense_category?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </CardDescription>
                        {expense.created_by_profile && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{expense.created_by_profile.full_name}</span>
                            {expense.created_by_employee && (
                              <>
                                <span>•</span>
                                <Building className="h-4 w-4" />
                                <span>{expense.created_by_employee.department?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      {getStatusBadge(expense.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Amount</p>
                        <p className="font-semibold flex items-center text-lg">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {formatBDT(expense.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Expense Date</p>
                        <p className="font-semibold flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Department</p>
                        <p className="font-semibold">
                          {expense.department?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Submitted</p>
                        <p className="font-semibold">
                          {new Date(expense.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {expense.chairman_approval_required && (
                      <Alert className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <span className="font-semibold">Chairman Approval Required</span> (amount exceeds ৳50,000)
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openViewModal(expense)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => openApproveModal(expense)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openRejectModal(expense)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* View Details Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Expense Request Details</DialogTitle>
            <DialogDescription>
              Complete information for expense request
            </DialogDescription>
          </DialogHeader>

          {selectedExpense && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-semibold">
                    {selectedExpense.expense_category?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-semibold text-lg">{formatBDT(selectedExpense.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expense Date</p>
                  <p className="font-semibold">
                    {selectedExpense.expense_date ? new Date(selectedExpense.expense_date).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-semibold">
                    {selectedExpense.department?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </div>
                {selectedExpense.cost_centre && (
                  <div>
                    <p className="text-sm text-muted-foreground">Cost Centre</p>
                    <p className="font-semibold">{selectedExpense.cost_centre}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="font-semibold">{selectedExpense.description}</p>
              </div>

              {/* Business Purpose */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Business Purpose</p>
                <div className="p-3 bg-secondary rounded">
                  <p className="text-sm">{selectedExpense.business_purpose}</p>
                </div>
              </div>

              {/* Receipts */}
              {selectedExpense.receipt_urls && selectedExpense.receipt_urls.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Receipts ({selectedExpense.receipt_urls.length} file(s))
                  </p>
                  <div className="space-y-2">
                    {selectedExpense.receipt_urls.map((url, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-secondary rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">Receipt {index + 1}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(url, "_blank")}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          View/Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Info */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Approval Status</p>
                <div className="p-3 bg-secondary rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Current Status:</span>
                    {getStatusBadge(selectedExpense.status)}
                  </div>
                  {selectedExpense.chairman_approval_required && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Chairman approval required (amount exceeds ৳50,000)
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Modal */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Expense Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this expense request?
            </DialogDescription>
          </DialogHeader>

          {selectedExpense && (
            <div className="space-y-4">
              <div className="p-4 bg-secondary rounded">
                <p className="font-semibold mb-2">{selectedExpense.description}</p>
                <p className="text-2xl font-bold">{formatBDT(selectedExpense.amount)}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Category: {selectedExpense.expense_category?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              </div>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  This expense will be approved at the <span className="font-semibold">{getRoleLabel(userRole)}</span> level
                  and moved to the next stage in the approval workflow.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveModalOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? "Approving..." : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Expense Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this expense request
            </DialogDescription>
          </DialogHeader>

          {selectedExpense && (
            <div className="space-y-4">
              <div className="p-4 bg-secondary rounded">
                <p className="font-semibold mb-2">{selectedExpense.description}</p>
                <p className="text-2xl font-bold">{formatBDT(selectedExpense.amount)}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejection_reason">
                  Rejection Reason <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="rejection_reason"
                  placeholder="Explain why this expense is being rejected"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {rejectionReason.length}/500 characters
                </p>
              </div>

              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  This action will reject the expense request and notify the submitter with your reason.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectModalOpen(false);
                setRejectionReason("");
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectionReason.trim()}
            >
              {actionLoading ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}