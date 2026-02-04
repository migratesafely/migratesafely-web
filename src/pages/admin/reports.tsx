import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { MainHeader } from "@/components/MainHeader";
import { authService } from "@/services/authService";
import {
  adminReportingService,
  TierOverviewReport,
  TierBonusFinancialSummary,
  ReferralBonusSummary,
  TopReferrer,
} from "@/services/adminReportingService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Shield,
  TrendingUp,
  DollarSign,
  Users,
  Download,
  FileText,
  AlertCircle,
  Info,
} from "lucide-react";
import Head from "next/head";

export default function AdminReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);
  const [adminRole, setAdminRole] = useState<string>("");

  const [tierOverview, setTierOverview] = useState<TierOverviewReport[]>([]);
  const [tierBonusFinancial, setTierBonusFinancial] = useState<TierBonusFinancialSummary[]>([]);
  const [referralBonusSummary, setReferralBonusSummary] = useState<ReferralBonusSummary[]>([]);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);

  const [loadingReports, setLoadingReports] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
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

      const canAccessReports = ["manager_admin", "chairman", "master_admin"].includes(profile.role);

      if (!canAccessReports) {
        setErrorMessage("Access Denied: Manager Admin or Chairman privileges required");
        setLoading(false);
        setTimeout(() => router.push("/admin"), 2000);
        return;
      }

      setCanAccess(true);
      setAdminRole(profile.role);
      await loadAllReports();
    } catch (error) {
      console.error("Error checking access:", error);
      router.push("/admin");
    }
  }

  async function loadAllReports() {
    try {
      setLoadingReports(true);

      const [tierData, financialData, referralData, topReferrerData] = await Promise.all([
        adminReportingService.getTierOverviewReport(),
        adminReportingService.getTierBonusFinancialSummary(),
        adminReportingService.getReferralBonusSummary(),
        adminReportingService.getTopReferrers(10),
      ]);

      setTierOverview(tierData);
      setTierBonusFinancial(financialData);
      setReferralBonusSummary(referralData);
      setTopReferrers(topReferrerData);

      await adminReportingService.logReportAccess("all_reports", "viewed");
    } catch (error) {
      console.error("Error loading reports:", error);
      setErrorMessage("Failed to load reports");
    } finally {
      setLoadingReports(false);
      setLoading(false);
    }
  }

  async function handleExportCSV(reportType: string, data: any[], filename: string) {
    try {
      adminReportingService.exportToCSV(data, filename);
      await adminReportingService.logReportAccess(reportType, "exported");
    } catch (error) {
      console.error("Error exporting report:", error);
      alert("Failed to export report");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-background">
        <MainHeader />
        <div className="flex items-center justify-center py-20">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Reports | Migrate Safely</title>
      </Head>
      <div className="min-h-screen bg-background">
        <MainHeader />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Admin Reports & Oversight</h1>
                <p className="text-muted-foreground mt-2">
                  Read-only reporting and monitoring tools
                </p>
              </div>
              <Badge variant="outline" className="w-fit">
                <Shield className="h-3 w-3 mr-1" />
                {adminRole.replace(/_/g, " ").toUpperCase()}
              </Badge>
            </div>

            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-1">Read-Only Reports</p>
                <p className="text-sm">
                  These reports are for monitoring and oversight only. No calculations, payments, or
                  approvals can be made from this section. All reports include watermark: "Internal
                  Use Only".
                </p>
              </AlertDescription>
            </Alert>

            <Tabs defaultValue="tier-overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="tier-overview">Tier Overview</TabsTrigger>
                <TabsTrigger value="tier-bonus-financial">Tier Bonus Financial</TabsTrigger>
                <TabsTrigger value="referral-bonus">Referral Bonus</TabsTrigger>
                <TabsTrigger value="top-referrers">Top Referrers</TabsTrigger>
              </TabsList>

              {/* Tier Overview Report */}
              <TabsContent value="tier-overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-primary" />
                          Tier Overview Report
                        </CardTitle>
                        <CardDescription>
                          Total members per tier and tier thresholds
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() =>
                          handleExportCSV("tier_overview", tierOverview, "tier_overview_report")
                        }
                        variant="outline"
                        size="sm"
                        disabled={tierOverview.length === 0}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingReports ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                      </div>
                    ) : tierOverview.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">No data available</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tier Name</TableHead>
                              <TableHead>Level</TableHead>
                              <TableHead>Total Members</TableHead>
                              <TableHead>Upgraded This Month</TableHead>
                              <TableHead>Pending Approvals</TableHead>
                              <TableHead>Required Referrals</TableHead>
                              <TableHead>Bonus %</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tierOverview.map((tier) => (
                              <TableRow key={tier.tierName}>
                                <TableCell className="font-medium">{tier.tierName}</TableCell>
                                <TableCell>{tier.tierLevel}</TableCell>
                                <TableCell>{tier.totalMembers}</TableCell>
                                <TableCell>{tier.upgradedThisMonth}</TableCell>
                                <TableCell>
                                  {tier.pendingApprovals > 0 ? (
                                    <Badge variant="destructive">{tier.pendingApprovals}</Badge>
                                  ) : (
                                    <span className="text-muted-foreground">0</span>
                                  )}
                                </TableCell>
                                <TableCell>{tier.requiredReferrals}</TableCell>
                                <TableCell>{tier.bonusPercentage}%</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tier Bonus Financial Summary */}
              <TabsContent value="tier-bonus-financial" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          Tier Bonus Financial Summary
                        </CardTitle>
                        <CardDescription>
                          Tier bonuses calculated from referral bonus (not membership fees)
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() =>
                          handleExportCSV(
                            "tier_bonus_financial",
                            tierBonusFinancial,
                            "tier_bonus_financial_summary"
                          )
                        }
                        variant="outline"
                        size="sm"
                        disabled={tierBonusFinancial.length === 0}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800 dark:text-yellow-200 text-sm">
                        <p className="font-semibold">Important:</p>
                        <p>
                          Tier bonuses are calculated as a percentage of the referral bonus amount.
                          Membership fees are NOT used in tier bonus calculations.
                        </p>
                      </AlertDescription>
                    </Alert>

                    {loadingReports ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                      </div>
                    ) : tierBonusFinancial.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">No data available</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Month</TableHead>
                              <TableHead>Country</TableHead>
                              <TableHead>Tier</TableHead>
                              <TableHead>Pending Approval</TableHead>
                              <TableHead>Approved (Unpaid)</TableHead>
                              <TableHead>Paid</TableHead>
                              <TableHead>Count</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tierBonusFinancial.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{item.month}</TableCell>
                                <TableCell>{item.countryCode}</TableCell>
                                <TableCell>{item.tierName}</TableCell>
                                <TableCell>
                                  {item.currencyCode} {item.pendingApprovalAmount.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  {item.currencyCode} {item.approvedUnpaidAmount.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  {item.currencyCode} {item.paidAmount.toFixed(2)}
                                </TableCell>
                                <TableCell>{item.count}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Referral Bonus Summary */}
              <TabsContent value="referral-bonus" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          Referral Bonus Summary
                        </CardTitle>
                        <CardDescription>
                          Total referral bonuses paid and successful referrals
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() =>
                          handleExportCSV(
                            "referral_bonus",
                            referralBonusSummary,
                            "referral_bonus_summary"
                          )
                        }
                        variant="outline"
                        size="sm"
                        disabled={referralBonusSummary.length === 0}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingReports ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                      </div>
                    ) : referralBonusSummary.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">No data available</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Month</TableHead>
                              <TableHead>Total Bonus Paid</TableHead>
                              <TableHead>Total Successful Referrals</TableHead>
                              <TableHead>Currency</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {referralBonusSummary.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{item.month}</TableCell>
                                <TableCell>
                                  {item.currencyCode} {item.totalBonusPaid.toFixed(2)}
                                </TableCell>
                                <TableCell>{item.totalReferrals}</TableCell>
                                <TableCell>{item.currencyCode}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Top Referrers */}
              <TabsContent value="top-referrers" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-purple-600" />
                          Top Referrers
                        </CardTitle>
                        <CardDescription>
                          Top performing members (anonymized IDs for privacy)
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() =>
                          handleExportCSV("top_referrers", topReferrers, "top_referrers_report")
                        }
                        variant="outline"
                        size="sm"
                        disabled={topReferrers.length === 0}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingReports ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                      </div>
                    ) : topReferrers.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">No data available</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Rank</TableHead>
                              <TableHead>Member ID (Anonymized)</TableHead>
                              <TableHead>Total Successful Referrals</TableHead>
                              <TableHead>Total Earned</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {topReferrers.map((referrer, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">#{index + 1}</TableCell>
                                <TableCell className="font-mono text-sm">
                                  {referrer.memberIdAnonymized}
                                </TableCell>
                                <TableCell>{referrer.totalSuccessfulReferrals}</TableCell>
                                <TableCell>
                                  {referrer.currencyCode} {referrer.totalEarned.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card className="border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm mb-2">Report Information</h3>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• All reports are read-only and for internal use only</li>
                      <li>• Exported reports include watermark: "Internal Use Only"</li>
                      <li>• Report access and exports are logged in audit trail</li>
                      <li>• No editing, recalculation, or payment overrides allowed</li>
                      <li>
                        • Generated: {new Date().toLocaleString()} | Admin Role: {adminRole}
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}