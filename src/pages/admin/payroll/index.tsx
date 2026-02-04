import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { MainHeader } from "@/components/MainHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, CheckCircle2, DollarSign, Calendar, User, Building, 
  Plus, Send, Lock, Eye, FileText 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PayrollPeriod {
  id: string;
  year: number;
  month: number;
  period_name: string;
  status: string;
  generated_at: string;
  approved_by: string | null;
  approved_at: string | null;
  approver?: {
    full_name: string;
    email: string;
  };
  run_count: number;
}

export default function PayrollManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createYear, setCreateYear] = useState(new Date().getFullYear());
  const [createMonth, setCreateMonth] = useState(new Date().getMonth() + 1);

  // Action modals
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showGeneratePayslipsModal, setShowGeneratePayslipsModal] = useState(false);
  const [approvalLevel, setApprovalLevel] = useState("gm");

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/payroll/list-periods");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load payroll periods");
      }

      setPeriods(data.periods || []);
    } catch (err: any) {
      console.error("Error loading periods:", err);
      setError(err.message || "Failed to load payroll periods");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePeriod = async () => {
    try {
      setActionLoading(true);
      setError("");

      const response = await fetch("/api/admin/payroll/create-period", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: createYear,
          month: createMonth
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create period");
      }

      setSuccess(data.message);
      setShowCreateModal(false);
      loadPeriods();
    } catch (err: any) {
      console.error("Error creating period:", err);
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateRuns = async () => {
    if (!selectedPeriod) return;

    try {
      setActionLoading(true);
      setError("");

      const response = await fetch("/api/admin/payroll/generate-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payroll_period_id: selectedPeriod.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate runs");
      }

      setSuccess(data.message);
      setShowGenerateModal(false);
      setSelectedPeriod(null);
      loadPeriods();
    } catch (err: any) {
      console.error("Error generating runs:", err);
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPeriod) return;

    try {
      setActionLoading(true);
      setError("");

      const response = await fetch("/api/admin/payroll/submit-period", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payroll_period_id: selectedPeriod.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit");
      }

      setSuccess(data.message);
      setShowSubmitModal(false);
      setSelectedPeriod(null);
      loadPeriods();
    } catch (err: any) {
      console.error("Error submitting:", err);
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedPeriod) return;

    try {
      setActionLoading(true);
      setError("");

      const response = await fetch("/api/admin/payroll/approve-period", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payroll_period_id: selectedPeriod.id,
          approval_level: approvalLevel
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to approve");
      }

      setSuccess(data.message);
      setShowApproveModal(false);
      setSelectedPeriod(null);
      loadPeriods();
    } catch (err: any) {
      console.error("Error approving:", err);
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLock = async () => {
    if (!selectedPeriod) return;

    try {
      setActionLoading(true);
      setError("");

      const response = await fetch("/api/admin/payroll/lock-period", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payroll_period_id: selectedPeriod.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to lock");
      }

      setSuccess(data.message);
      setShowLockModal(false);
      setSelectedPeriod(null);
      loadPeriods();
    } catch (err: any) {
      console.error("Error locking:", err);
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const lockPeriod = async (periodId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/admin/payroll/lock-period", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payroll_period_id: periodId })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to lock payroll period");
        return;
      }

      setSuccess(data.message);
      setShowLockModal(false);
      loadPeriods();
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const generatePayslips = async (periodId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/admin/payroll/generate-payslips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payroll_period_id: periodId })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to generate payslips");
        return;
      }

      setSuccess(data.message);
      setShowGeneratePayslipsModal(false);
      loadPeriods();
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      draft: { label: "Draft", variant: "outline" },
      submitted: { label: "Submitted", variant: "secondary" },
      gm_approved: { label: "GM Approved", variant: "default" },
      md_approved: { label: "MD Approved", variant: "default" },
      approved: { label: "Approved", variant: "default" },
      locked: { label: "Locked", variant: "destructive" }
    };

    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getAvailableActions = (period: PayrollPeriod) => {
    const actions = [];

    if (period.status === "draft") {
      if (period.run_count === 0) {
        actions.push(
          <Button
            key="generate"
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedPeriod(period);
              setShowGenerateModal(true);
            }}
          >
            <FileText className="h-4 w-4 mr-1" />
            Generate Runs
          </Button>
        );
      } else {
        actions.push(
          <Button
            key="submit"
            size="sm"
            onClick={() => {
              setSelectedPeriod(period);
              setShowSubmitModal(true);
            }}
          >
            <Send className="h-4 w-4 mr-1" />
            Submit for Approval
          </Button>
        );
      }
    }

    if (["submitted", "gm_approved", "md_approved"].includes(period.status)) {
      actions.push(
        <Button
          key="approve"
          size="sm"
          onClick={() => {
            setSelectedPeriod(period);
            setShowApproveModal(true);
          }}
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Approve
        </Button>
      );
    }

    if (period.status === "approved") {
      actions.push(
        <Button
          key="lock"
          size="sm"
          variant="destructive"
          onClick={() => {
            setSelectedPeriod(period);
            setShowLockModal(true);
          }}
        >
          <Lock className="h-4 w-4 mr-1" />
          Lock Period
        </Button>
      );
    }

    if (["approved", "locked"].includes(period.status)) {
      actions.push(
        <Button
          key="generate-payslips"
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedPeriod(period);
            setShowGeneratePayslipsModal(true);
          }}
        >
          <FileText className="h-4 w-4 mr-1" />
          Generate Payslips
        </Button>
      );
    }

    return actions;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading payroll periods...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MainHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Payroll Management</h1>
          <p className="text-muted-foreground">
            Manage monthly payroll periods, generate payroll runs, and process approvals
          </p>
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

        <div className="mb-6">
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Payroll Period
          </Button>
        </div>

        <div className="grid gap-6">
          {periods.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Payroll Periods</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first payroll period to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            periods.map((period) => (
              <Card key={period.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-3">
                        {period.period_name}
                        {getStatusBadge(period.status)}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {period.run_count} employee{period.run_count !== 1 ? "s" : ""} in this period
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getAvailableActions(period)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground mb-1">Created</div>
                      <div>{new Date(period.generated_at).toLocaleDateString()}</div>
                    </div>
                    {period.approved_at && (
                      <>
                        <div>
                          <div className="text-muted-foreground mb-1">Approved By</div>
                          <div>{period.approver?.full_name || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Approved At</div>
                          <div>{new Date(period.approved_at).toLocaleDateString()}</div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Create Period Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Payroll Period</DialogTitle>
            <DialogDescription>
              Create a new monthly payroll period
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={createYear}
                onChange={(e) => setCreateYear(parseInt(e.target.value))}
                min={2020}
                max={2050}
              />
            </div>
            
            <div>
              <Label htmlFor="month">Month</Label>
              <Select
                value={String(createMonth)}
                onValueChange={(value) => setCreateMonth(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                  ].map((month, index) => (
                    <SelectItem key={index + 1} value={String(index + 1)}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleCreatePeriod} disabled={actionLoading}>
              {actionLoading ? "Creating..." : "Create Period"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Runs Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Payroll Runs</DialogTitle>
            <DialogDescription>
              Generate payroll runs for all active employees in {selectedPeriod?.period_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                This will create payroll records for all employees with active payroll profiles.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowGenerateModal(false);
                setSelectedPeriod(null);
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerateRuns} disabled={actionLoading}>
              {actionLoading ? "Generating..." : "Generate Runs"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Modal */}
      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit for Approval</DialogTitle>
            <DialogDescription>
              Submit {selectedPeriod?.period_name} payroll for approval
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Alert>
              <Send className="h-4 w-4" />
              <AlertDescription>
                Once submitted, this payroll will enter the approval workflow: GM → MD → Chairman
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSubmitModal(false);
                setSelectedPeriod(null);
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={actionLoading}>
              {actionLoading ? "Submitting..." : "Submit for Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Payroll</DialogTitle>
            <DialogDescription>
              Approve {selectedPeriod?.period_name} payroll
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="approval-level">Approval Level</Label>
              <Select value={approvalLevel} onValueChange={setApprovalLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gm">General Manager</SelectItem>
                  <SelectItem value="md">Managing Director</SelectItem>
                  <SelectItem value="chairman">Chairman (Final)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Your approval will be recorded in the audit trail
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveModal(false);
                setSelectedPeriod(null);
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={actionLoading}>
              {actionLoading ? "Approving..." : "Approve Payroll"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lock Modal */}
      <Dialog open={showLockModal} onOpenChange={setShowLockModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lock Payroll Period</DialogTitle>
            <DialogDescription>
              Lock {selectedPeriod?.period_name} payroll permanently
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Alert variant="destructive">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> Once locked, this payroll period becomes immutable and cannot be modified.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowLockModal(false);
                setSelectedPeriod(null);
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleLock}
              disabled={actionLoading}
            >
              {actionLoading ? "Locking..." : "Lock Period"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Payslips Modal */}
      <Dialog open={showGeneratePayslipsModal} onOpenChange={setShowGeneratePayslipsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Payslips</DialogTitle>
            <DialogDescription>
              Generate payslip PDFs for all employees in {selectedPeriod?.period_name}
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This will create PDF payslips for all employees in this payroll period. Payslips will be stored securely and can be distributed to employees.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGeneratePayslipsModal(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => generatePayslips(selectedPeriod.id)}
              disabled={actionLoading}
            >
              {actionLoading ? "Generating..." : "Generate Payslips"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}