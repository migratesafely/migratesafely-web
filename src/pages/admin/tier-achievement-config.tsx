import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { MainHeader } from "@/components/MainHeader";
import { authService } from "@/services/authService";
import {
  tierAchievementConfigService,
  TierAchievementBonusConfig,
  TierAchievementBonusAuditLog,
} from "@/services/tierAchievementConfigService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Settings, Shield, AlertCircle, CheckCircle, Edit, History, Info, Lock, DollarSign } from "lucide-react";
import Head from "next/head";
import { supabase } from "@/integrations/supabase/client";

export default function TierAchievementConfigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isManagerAdmin, setIsManagerAdmin] = useState(false);
  
  const [tierConfigs, setTierConfigs] = useState<TierAchievementBonusConfig[]>([]);
  const [auditLogs, setAuditLogs] = useState<TierAchievementBonusAuditLog[]>([]);
  const [selectedTier, setSelectedTier] = useState<TierAchievementBonusConfig | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const [newBonusAmount, setNewBonusAmount] = useState<string>("");
  const [changeReason, setChangeReason] = useState("");
  const [updating, setUpdating] = useState(false);
  
  const [successMessage, setSuccessMessage] = useState("");
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
      
      const isAdmin = profile && ["worker_admin", "manager_admin", "super_admin", "master_admin"].includes(profile.role);
      if (!isAdmin) {
        setErrorMessage("Access Denied: Admin privileges required");
        setLoading(false);
        setTimeout(() => router.push("/admin"), 2000);
        return;
      }

      // Only Chairman can access this page
      const { data: employee } = await supabase
        .from("employees")
        .select("role_category")
        .eq("user_id", user.id)
        .maybeSingle();

      const isChairman = employee?.role_category === "chairman";
      
      if (!isChairman) {
        router.push("/dashboard");
        return;
      }

      setIsSuperAdmin(true);
      await loadTierConfigs();
      await loadAuditLogs();
    } catch (error) {
      console.error("Error checking access:", error);
      router.push("/admin");
    }
  }

  async function loadTierConfigs() {
    try {
      const configs = await tierAchievementConfigService.getTierAchievementBonusConfig();
      setTierConfigs(configs);
      setLoading(false);
    } catch (error) {
      console.error("Error loading tier configs:", error);
      setErrorMessage("Failed to load tier configurations");
      setLoading(false);
    }
  }

  async function loadAuditLogs() {
    try {
      const logs = await tierAchievementConfigService.getTierAchievementBonusAuditLog();
      setAuditLogs(logs);
    } catch (error) {
      console.error("Error loading audit logs:", error);
    }
  }

  function openEditDialog(tier: TierAchievementBonusConfig) {
    if (!isSuperAdmin) {
      setErrorMessage("Only Super Admin can edit tier achievement bonus amounts");
      return;
    }

    setSelectedTier(tier);
    setNewBonusAmount(tier.achievementBonusAmount.toString());
    setChangeReason("");
    setShowEditDialog(true);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function closeEditDialog() {
    setSelectedTier(null);
    setShowEditDialog(false);
    setNewBonusAmount("");
    setChangeReason("");
  }

  async function handleUpdateBonusAmount() {
    if (!selectedTier) return;

    const amount = parseFloat(newBonusAmount);

    if (isNaN(amount) || amount < 0) {
      setErrorMessage("Please enter a valid bonus amount (0 or greater)");
      return;
    }

    setUpdating(true);
    setErrorMessage("");

    try {
      const result = await tierAchievementConfigService.updateTierAchievementBonusAmount(
        selectedTier.tierId,
        amount,
        changeReason.trim() || undefined
      );

      if (result.success) {
        setSuccessMessage(
          `Tier achievement bonus updated successfully. Changes apply to future achievements only.`
        );
        closeEditDialog();
        await loadTierConfigs();
        await loadAuditLogs();
      } else {
        setErrorMessage(result.error || "Failed to update tier achievement bonus");
      }
    } catch (error) {
      console.error("Error updating bonus amount:", error);
      setErrorMessage("An unexpected error occurred");
    } finally {
      setUpdating(false);
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
        <MainHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading configurations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Tier Achievement Bonus Config | Admin Portal</title>
      </Head>
      <div className="min-h-screen bg-background">
        <MainHeader />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Tier Achievement Bonus Configuration</h1>
                <p className="text-muted-foreground mt-2">
                  Manage one-time lump-sum bonuses for tier achievements
                </p>
              </div>
              <Badge variant={isSuperAdmin ? "default" : "secondary"} className="w-fit">
                <Shield className="h-3 w-3 mr-1" />
                {isSuperAdmin ? "Super Admin (Edit Access)" : "View Only"}
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

            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-1">Configuration Rules</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Only Super Admin can edit achievement bonus amounts</li>
                  <li>Changes apply ONLY to future tier achievements</li>
                  <li>Existing achieved bonuses remain unchanged</li>
                  <li>All changes are logged in immutable audit trail</li>
                  <li>Set to ৳0 to disable achievement bonus for a tier</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Tabs defaultValue="config" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="config">Tier Configuration</TabsTrigger>
                <TabsTrigger value="audit">Audit Log</TabsTrigger>
              </TabsList>

              {/* Configuration Tab */}
              <TabsContent value="config" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      Tier Achievement Bonus Amounts (BDT)
                    </CardTitle>
                    <CardDescription>
                      One-time lump-sum bonuses paid upon tier achievement (after admin approval)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tier</TableHead>
                            <TableHead>Level</TableHead>
                            <TableHead>Required Referrals</TableHead>
                            <TableHead>Bonus %</TableHead>
                            <TableHead>Achievement Bonus</TableHead>
                            <TableHead>Enhanced KYC</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tierConfigs.map((tier) => (
                            <TableRow key={tier.tierId}>
                              <TableCell>
                                <Badge className={getTierColorClass(tier.tierName)}>
                                  {tier.tierName}
                                </Badge>
                              </TableCell>
                              <TableCell>{tier.tierLevel}</TableCell>
                              <TableCell>{tier.requiredReferrals}</TableCell>
                              <TableCell>{tier.bonusPercentage}%</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-semibold">৳{tier.achievementBonusAmount.toLocaleString()}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {tier.requiresEnhancedKyc ? (
                                  <Badge variant="secondary">Required</Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">No</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={tier.isActive ? "default" : "secondary"}>
                                  {tier.isActive ? "Active" : "Disabled"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {isSuperAdmin ? (
                                  <Button
                                    onClick={() => openEditDialog(tier)}
                                    size="sm"
                                    variant="outline"
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                ) : (
                                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                                    <Lock className="h-3 w-3" />
                                    Locked
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Audit Log Tab */}
              <TabsContent value="audit" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5 text-primary" />
                      Configuration Change Audit Log
                    </CardTitle>
                    <CardDescription>
                      Immutable record of all tier achievement bonus configuration changes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {auditLogs.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">
                        No configuration changes recorded yet
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date/Time</TableHead>
                              <TableHead>Tier</TableHead>
                              <TableHead>Changed By</TableHead>
                              <TableHead>Old Amount</TableHead>
                              <TableHead>New Amount</TableHead>
                              <TableHead>Reason</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {auditLogs.map((log) => (
                              <TableRow key={log.auditId}>
                                <TableCell className="text-sm">
                                  {new Date(log.createdAt).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Badge className={getTierColorClass(log.tierName)}>
                                    {log.tierName}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm">
                                  <div>
                                    <p className="font-medium">{log.changedByName || "Unknown"}</p>
                                    <p className="text-muted-foreground">{log.changedByEmail}</p>
                                  </div>
                                </TableCell>
                                <TableCell>৳{log.oldBonusAmount?.toLocaleString() || "0"}</TableCell>
                                <TableCell className="font-semibold">
                                  ৳{log.newBonusAmount.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {log.changeReason || "—"}
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

            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                    Important Reminders
                  </h3>
                  <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 list-disc list-inside">
                    <li>Achievement bonuses are ONE-TIME rewards per tier</li>
                    <li>Bonuses require Manager Admin or Super Admin approval before payout</li>
                    <li>Changes to amounts do NOT affect pending or approved bonuses</li>
                    <li>Platinum tier bonuses require Enhanced KYC verification</li>
                    <li>All bonuses subject to tax and local laws (member responsibility)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Edit Dialog */}
        {showEditDialog && selectedTier && (
          <Dialog open={showEditDialog} onOpenChange={closeEditDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Edit Achievement Bonus: {selectedTier.tierName}
                </DialogTitle>
                <DialogDescription>
                  Changes apply only to future tier achievements. Existing bonuses remain unchanged.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Tier:</span> {selectedTier.tierName} (Level {selectedTier.tierLevel})
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Current Amount:</span> ৳{selectedTier.achievementBonusAmount.toLocaleString()} BDT
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newBonusAmount">
                    New Achievement Bonus Amount (BDT) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="newBonusAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newBonusAmount}
                    onChange={(e) => setNewBonusAmount(e.target.value)}
                    placeholder="Enter amount in BDT"
                  />
                  <p className="text-xs text-muted-foreground">
                    Set to 0 to disable achievement bonus for this tier
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="changeReason">
                    Change Reason (Optional)
                  </Label>
                  <Textarea
                    id="changeReason"
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    placeholder="Optional note explaining the change"
                    rows={3}
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
                <Button variant="outline" onClick={closeEditDialog} disabled={updating}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateBonusAmount}
                  disabled={updating || !newBonusAmount}
                >
                  {updating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Save Changes
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