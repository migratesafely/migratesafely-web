import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { AppHeader } from "@/components/AppHeader";
import { AdminNotificationBell } from "@/components/AdminNotificationBell";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, Unlock, FileText, Download, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { 
  getFinancialClosePeriods, 
  closeAccountingPeriod, 
  lockAccountingPeriod, 
  unlockAccountingPeriod, 
  getReportsForPeriod,
  getReportByType,
  exportReportToCSV,
  downloadCSV,
  getCurrentOpenPeriod
} from "@/services/accounting/financialCloseService";
import type { Database } from "@/integrations/supabase/types";

type ClosePeriod = Database["public"]["Tables"]["monthly_close_periods"]["Row"] & {
  period_name?: string;
  closed_by_name?: string;
  locked_by_name?: string;
  report_count?: number;
};

type Report = Database["public"]["Tables"]["monthly_financial_reports"]["Row"];

export default function FinancialClosePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [periods, setPeriods] = useState<ClosePeriod[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<{year: number, month: number} | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<ClosePeriod | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [closingPeriod, setClosingPeriod] = useState(false);
  const [lockingPeriod, setLockingPeriod] = useState(false);
  const [unlockingPeriod, setUnlockingPeriod] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");
  const [exportingReport, setExportingReport] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  async function checkAdminAndLoadData() {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // AUTHORITY CHECK: Only Chairman can access financial close
      const { data: employee } = await supabase
        .from("employees")
        .select("role_category")
        .eq("user_id", user.id)
        .single();

      if (!employee || employee.role_category !== "chairman") {
        router.push("/dashboard");
        return;
      }

      setIsAdmin(true);
      await loadPeriods();
      
      // Determine current period
      const now = new Date();
      // If today is day 1-5, we might be closing previous month
      // Otherwise we're in current month
      // For simplicity, we just offer to close the previous month if it's open
      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      setCurrentPeriod({
        year: prevMonthDate.getFullYear(),
        month: prevMonthDate.getMonth() + 1
      });

    } catch (error) {
      console.error("Error loading page:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load financial close data",
      });
      setLoading(false);
    }
  }

  async function loadPeriods() {
    try {
      // We need to fetch the summary view, but we can't directly type it properly yet 
      // as the view might not be in the types generation yet or types are complex
      // So we'll fetch via the service which calls the API or Supabase directly
      // For now, let's use the service function that fetches from the view
      const { data, error } = await getFinancialClosePeriods();
      
      if (error) throw new Error(error);
      
      // We might need to fetch the summary view instead to get the extra fields
      // But let's assume getFinancialClosePeriods returns the basic data for now
      // and we'll enhance it if needed. 
      // Actually, looking at the service, getFinancialClosePeriods queries the table directly.
      // We should use the periods API endpoint which calls getFinancialCloseSummary
      
      const session = await authService.getCurrentSession();
      const response = await fetch('/api/admin/financial-close/periods', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch periods');
      
      const periodsData = await response.json();
      setPeriods(periodsData);
      
    } catch (error) {
      console.error("Error loading periods:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load financial periods",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleClosePeriod() {
    if (!currentPeriod) return;
    
    setClosingPeriod(true);
    try {
      const session = await authService.getCurrentSession();
      const response = await fetch('/api/admin/financial-close/close-period', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          year: currentPeriod.year,
          month: currentPeriod.month
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to close period');
      }

      toast({
        title: "Success",
        description: `Financial period ${currentPeriod.year}-${currentPeriod.month} closed successfully. Reports generated.`,
      });
      
      await loadPeriods();
    } catch (error) {
      console.error("Error closing period:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to close period",
      });
    } finally {
      setClosingPeriod(false);
    }
  }

  async function handleLockPeriod(period: ClosePeriod) {
    setLockingPeriod(true);
    try {
      const session = await authService.getCurrentSession();
      const response = await fetch('/api/admin/financial-close/lock-period', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          year: period.period_year,
          month: period.period_month
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to lock period');
      }

      toast({
        title: "Success",
        description: "Period locked. Retroactive edits are now blocked.",
      });
      
      await loadPeriods();
    } catch (error) {
      console.error("Error locking period:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to lock period",
      });
    } finally {
      setLockingPeriod(false);
    }
  }

  async function handleUnlockPeriod(period: ClosePeriod) {
    if (!unlockReason.trim()) {
      toast({
        variant: "destructive",
        title: "Required",
        description: "Please provide a reason for unlocking the period",
      });
      return;
    }

    setUnlockingPeriod(true);
    try {
      const session = await authService.getCurrentSession();
      const response = await fetch('/api/admin/financial-close/unlock-period', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          year: period.period_year,
          month: period.period_month,
          reason: unlockReason
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unlock period');
      }

      toast({
        title: "Success",
        description: "Period unlocked. Audit log entry created.",
      });
      
      setUnlockReason("");
      await loadPeriods();
    } catch (error) {
      console.error("Error unlocking period:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to unlock period",
      });
    } finally {
      setUnlockingPeriod(false);
    }
  }

  async function viewReports(period: ClosePeriod) {
    setSelectedPeriod(period);
    setLoadingReports(true);
    
    try {
      const session = await authService.getCurrentSession();
      const response = await fetch(`/api/admin/financial-close/reports?periodId=${period.id}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch reports');
      
      const reportsData = await response.json();
      setReports(reportsData);
    } catch (error) {
      console.error("Error loading reports:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load reports details",
      });
    } finally {
      setLoadingReports(false);
    }
  }

  async function handleExportReport(report: Report) {
    setExportingReport(report.id);
    try {
      // In a real app, we might fetch a fresh copy or use the data we have
      // The report_data is JSONB, we need to convert to CSV
      const csvContent = exportReportToCSV(report.report_data as any, report.report_type);
      
      const filename = `${report.report_type}_${selectedPeriod?.period_year}_${selectedPeriod?.period_month}.csv`;
      downloadCSV(csvContent, filename);
      
      toast({
        title: "Export Started",
        description: "Your report download should begin shortly.",
      });
    } catch (error) {
      console.error("Error exporting report:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export report",
      });
    } finally {
      setExportingReport(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Financial Close | Admin</title>
      </Head>

      <AppHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Financial Close</h1>
            <p className="text-muted-foreground mt-1">
              Manage monthly accounting periods, lock ledgers, and generate financial reports
            </p>
          </div>
          <div className="flex items-center gap-3">
            <AdminNotificationBell />
            <ThemeSwitch />
          </div>
        </div>

        {/* Current Action Card */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Current Period Action
            </CardTitle>
            <CardDescription>
              {currentPeriod ? (
                `Ready to close period: ${new Date(currentPeriod.year, currentPeriod.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`
              ) : (
                "No pending periods to close"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentPeriod && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm">
                  <p><strong>Action:</strong> Close books and generate reports</p>
                  <p className="text-muted-foreground">This will generate P&L, Balance Sheet, and Reconciliation reports for {currentPeriod.month}/{currentPeriod.year}.</p>
                </div>
                <Button 
                  onClick={handleClosePeriod} 
                  disabled={closingPeriod}
                >
                  {closingPeriod ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Close Financial Period"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Periods List */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Periods History</CardTitle>
            <CardDescription>
              View past financial closes, reports, and lock status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Closed By</TableHead>
                  <TableHead>Reports</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No closed periods found.
                    </TableCell>
                  </TableRow>
                ) : (
                  periods.map((period) => (
                    <TableRow key={period.id}>
                      <TableCell className="font-medium">
                        {period.period_name || `${period.period_year}-${period.period_month}`}
                      </TableCell>
                      <TableCell>
                        {period.status === 'locked' ? (
                          <Badge variant="secondary" className="bg-slate-800 text-slate-100 hover:bg-slate-700">
                            <Lock className="mr-1 h-3 w-3" /> Locked
                          </Badge>
                        ) : period.status === 'closed' ? (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="mr-1 h-3 w-3" /> Closed
                          </Badge>
                        ) : (
                          <Badge variant="outline">{period.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{period.closed_by_name || 'System'}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(period.closed_at || '').toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {period.report_count || 0} Generated
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => viewReports(period)}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Reports
                          </Button>
                          
                          {period.status === 'closed' && (
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={() => handleLockPeriod(period)}
                              disabled={lockingPeriod}
                            >
                              {lockingPeriod ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                              <span className="sr-only">Lock</span>
                            </Button>
                          )}
                          
                          {period.status === 'locked' && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                  <Unlock className="h-4 w-4" />
                                  <span className="sr-only">Unlock</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Unlock Financial Period</DialogTitle>
                                  <DialogDescription>
                                    Unlocking a period allows retroactive edits. This action is audited.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label>Reason for Unlocking (Required)</Label>
                                    <Textarea 
                                      placeholder="Explain why this period needs to be unlocked..." 
                                      value={unlockReason}
                                      onChange={(e) => setUnlockReason(e.target.value)}
                                    />
                                  </div>
                                  <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Warning</AlertTitle>
                                    <AlertDescription>
                                      Modifying closed financial data may affect compliance and reporting integrity.
                                    </AlertDescription>
                                  </Alert>
                                </div>
                                <DialogFooter>
                                  <Button 
                                    onClick={() => handleUnlockPeriod(period)} 
                                    disabled={unlockingPeriod || !unlockReason.trim()}
                                  >
                                    {unlockingPeriod ? "Unlocking..." : "Confirm Unlock"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Reports Drawer/Dialog */}
        <Dialog open={!!selectedPeriod} onOpenChange={(open) => !open && setSelectedPeriod(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Financial Reports: {selectedPeriod?.period_name}
              </DialogTitle>
              <DialogDescription>
                Generated on {selectedPeriod?.closed_at && new Date(selectedPeriod.closed_at).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            
            {loadingReports ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-6">
                <Tabs defaultValue="profit_loss">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="profit_loss">Profit & Loss</TabsTrigger>
                    <TabsTrigger value="prize_pool">Prize Pool</TabsTrigger>
                    <TabsTrigger value="referrals">Referrals</TabsTrigger>
                    <TabsTrigger value="tiers">Tier Bonuses</TabsTrigger>
                  </TabsList>
                  
                  {/* Profit & Loss Tab */}
                  <TabsContent value="profit_loss" className="mt-4 space-y-4">
                    {reports.find(r => r.report_type === 'profit_loss') ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">Profit & Loss Statement</h3>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleExportReport(reports.find(r => r.report_type === 'profit_loss')!)}
                            disabled={!!exportingReport}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-sm font-medium text-muted-foreground">Total Revenue</div>
                              <div className="text-2xl font-bold text-green-600">
                                {(reports.find(r => r.report_type === 'profit_loss')?.report_data as any).total_revenue?.toLocaleString()} BDT
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-sm font-medium text-muted-foreground">Total Expenses</div>
                              <div className="text-2xl font-bold text-red-600">
                                {(reports.find(r => r.report_type === 'profit_loss')?.report_data as any).total_expenses?.toLocaleString()} BDT
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-sm font-medium text-muted-foreground">Net Income</div>
                              <div className={`text-2xl font-bold ${(reports.find(r => r.report_type === 'profit_loss')?.report_data as any).net_income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {(reports.find(r => r.report_type === 'profit_loss')?.report_data as any).net_income?.toLocaleString()} BDT
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">Report not available</div>
                    )}
                  </TabsContent>
                  
                  {/* Prize Pool Tab */}
                  <TabsContent value="prize_pool" className="mt-4 space-y-4">
                     {reports.find(r => r.report_type === 'prize_pool_reconciliation') ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">Prize Pool Reconciliation</h3>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleExportReport(reports.find(r => r.report_type === 'prize_pool_reconciliation')!)}
                            disabled={!!exportingReport}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">Reconciliation Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {(reports.find(r => r.report_type === 'prize_pool_reconciliation')?.report_data as any).reconciliation_check === 'BALANCED' ? (
                                <Badge className="bg-green-600">BALANCED</Badge>
                              ) : (
                                <Badge variant="destructive">UNBALANCED</Badge>
                              )}
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">Closing Balance</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-primary">
                                {(reports.find(r => r.report_type === 'prize_pool_reconciliation')?.report_data as any).closing_balance?.toLocaleString()} BDT
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell>Opening Balance</TableCell>
                              <TableCell className="text-right">
                                {(reports.find(r => r.report_type === 'prize_pool_reconciliation')?.report_data as any).opening_balance?.toLocaleString()} BDT
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>+ Contributions (30%)</TableCell>
                              <TableCell className="text-right text-green-600">
                                + {(reports.find(r => r.report_type === 'prize_pool_reconciliation')?.report_data as any).contributions?.toLocaleString()} BDT
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>- Disbursements (Prizes)</TableCell>
                              <TableCell className="text-right text-red-600">
                                - {(reports.find(r => r.report_type === 'prize_pool_reconciliation')?.report_data as any).disbursements?.toLocaleString()} BDT
                              </TableCell>
                            </TableRow>
                            <TableRow className="font-bold border-t-2">
                              <TableCell>Closing Balance</TableCell>
                              <TableCell className="text-right">
                                {(reports.find(r => r.report_type === 'prize_pool_reconciliation')?.report_data as any).closing_balance?.toLocaleString()} BDT
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">Report not available</div>
                    )}
                  </TabsContent>
                  
                  {/* Referrals Tab */}
                  <TabsContent value="referrals" className="mt-4">
                    {reports.find(r => r.report_type === 'referral_payouts') ? (
                      <div className="space-y-4">
                         <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">Referral Payouts</h3>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleExportReport(reports.find(r => r.report_type === 'referral_payouts')!)}
                            disabled={!!exportingReport}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                           <Card>
                            <CardContent className="pt-6">
                              <div className="text-sm font-medium text-muted-foreground">Total Payouts</div>
                              <div className="text-xl font-bold">
                                {(reports.find(r => r.report_type === 'referral_payouts')?.report_data as any).total_payouts?.toLocaleString()} BDT
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-sm font-medium text-muted-foreground">Transaction Count</div>
                              <div className="text-xl font-bold">
                                {(reports.find(r => r.report_type === 'referral_payouts')?.report_data as any).total_count?.toLocaleString()}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">Report not available</div>
                    )}
                  </TabsContent>
                  
                  {/* Tiers Tab */}
                  <TabsContent value="tiers" className="mt-4">
                    {reports.find(r => r.report_type === 'tier_payouts') ? (
                      <div className="space-y-4">
                         <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">Tier Bonus Payouts</h3>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleExportReport(reports.find(r => r.report_type === 'tier_payouts')!)}
                            disabled={!!exportingReport}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                           <Card>
                            <CardContent className="pt-6">
                              <div className="text-sm font-medium text-muted-foreground">Total Bonuses</div>
                              <div className="text-xl font-bold">
                                {(reports.find(r => r.report_type === 'tier_payouts')?.report_data as any).total_payouts?.toLocaleString()} BDT
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-sm font-medium text-muted-foreground">Transaction Count</div>
                              <div className="text-xl font-bold">
                                {(reports.find(r => r.report_type === 'tier_payouts')?.report_data as any).total_count?.toLocaleString()}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">Report not available</div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}