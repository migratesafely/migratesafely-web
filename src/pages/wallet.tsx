import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { MainHeader } from "@/components/MainHeader";
import { authService } from "@/services/authService";
import { paymentService, BankDetails } from "@/services/paymentService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Wallet, DollarSign, Building, AlertCircle, CheckCircle, Clock, Shield, Info } from "lucide-react";
import { formatBDT } from "@/lib/countryConfig";
import Head from "next/head";

export default function WalletPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState({ available: 0, pending: 0, currency: "USD" });
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [showBankForm, setShowBankForm] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    accountHolderName: "",
    bankName: "",
    branchName: "",
    accountNumber: "",
    countryCode: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        router.push("/login?redirect=/wallet");
        return;
      }

      const profile = await authService.getUserProfile(user.id);
      if (!profile) {
        router.push("/login");
        return;
      }

      setProfile(profile);
      await loadWalletData(user.id);
      await loadBankDetails(user.id);
      await loadPaymentHistory(user.id);
      setLoading(false);
    } catch (error) {
      console.error("Error checking auth:", error);
      router.push("/login");
    }
  }

  async function loadWalletData(userId: string) {
    // TODO: Implement wallet balance fetching from wallets table
    // For now, using placeholder
    setWalletBalance({ available: 0, pending: 0, currency: "USD" });
  }

  async function loadBankDetails(userId: string) {
    try {
      const details = await paymentService.getMemberBankDetails(userId);
      setBankDetails(details);
      
      if (details) {
        setFormData({
          accountHolderName: details.accountHolderName,
          bankName: details.bankName,
          branchName: details.branchName || "",
          accountNumber: details.accountNumber,
          countryCode: details.countryCode,
        });
      }
    } catch (error) {
      console.error("Error loading bank details:", error);
    }
  }

  async function loadPaymentHistory(userId: string) {
    try {
      const history = await paymentService.getMemberPaymentHistory(userId);
      setPaymentHistory(history);
    } catch (error) {
      console.error("Error loading payment history:", error);
    }
  }

  async function handleSaveBankDetails() {
    if (!profile) return;

    setErrorMessage("");
    setSuccessMessage("");

    // Validation
    if (!formData.accountHolderName.trim()) {
      setErrorMessage("Account holder name is required");
      return;
    }

    if (!formData.bankName.trim()) {
      setErrorMessage("Bank name is required");
      return;
    }

    if (!formData.accountNumber.trim()) {
      setErrorMessage("Account number is required");
      return;
    }

    if (!formData.countryCode.trim()) {
      setErrorMessage("Country is required");
      return;
    }

    // Validate account holder name matches profile name
    if (profile.full_name && formData.accountHolderName.toLowerCase() !== profile.full_name.toLowerCase()) {
      setErrorMessage("Account holder name must match your profile name");
      return;
    }

    setSaving(true);

    try {
      const result = await paymentService.saveBankDetails(profile.id, {
        accountHolderName: formData.accountHolderName,
        bankName: formData.bankName,
        branchName: formData.branchName,
        accountNumber: formData.accountNumber,
        countryCode: formData.countryCode,
      });

      if (result.success) {
        setSuccessMessage("Bank details saved successfully. Verification required before payouts.");
        setShowBankForm(false);
        await loadBankDetails(profile.id);
      } else {
        setErrorMessage(result.error || "Failed to save bank details");
      }
    } catch (error) {
      console.error("Error saving bank details:", error);
      setErrorMessage("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading wallet...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Wallet | Migrate Safely</title>
      </Head>
      <div className="min-h-screen bg-background">
        <MainHeader />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Wallet</h1>
              <p className="text-muted-foreground mt-2">
                Manage your referral bonuses, tier rewards, and payouts
              </p>
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

            {/* Legal & Tax Notice */}
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                      Legal & Tax Notice
                    </h3>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                      All referral bonuses, tier rewards, and payouts may be subject to tax and local laws.
                    </p>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                      Members are solely responsible for tax declarations and compliance with local regulations.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Balance */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-green-600" />
                    Available Balance
                  </CardTitle>
                  <CardDescription>Ready for withdrawal (BDT)</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {formatBDT(walletBalance.available)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    Pending Balance
                  </CardTitle>
                  <CardDescription>Awaiting admin approval (BDT)</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {formatBDT(walletBalance.pending)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Bank Details */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-blue-600" />
                      My Bank Details
                    </CardTitle>
                    <CardDescription>
                      Required for payout processing
                    </CardDescription>
                  </div>
                  {bankDetails && (
                    <Badge variant={bankDetails.isVerified ? "default" : "secondary"}>
                      {bankDetails.isVerified ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Pending Verification
                        </>
                      )}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {bankDetails ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Account Holder Name</p>
                        <p className="font-medium">{bankDetails.accountHolderName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Bank Name</p>
                        <p className="font-medium">{bankDetails.bankName}</p>
                      </div>
                      {bankDetails.branchName && (
                        <div>
                          <p className="text-sm text-muted-foreground">Branch Name</p>
                          <p className="font-medium">{bankDetails.branchName}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">Account Number</p>
                        <p className="font-medium">
                          {bankDetails.accountNumber.replace(/\d(?=\d{4})/g, "*")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Country</p>
                        <p className="font-medium">{bankDetails.countryCode}</p>
                      </div>
                    </div>

                    <Button onClick={() => setShowBankForm(true)} variant="outline">
                      Update Bank Details
                    </Button>

                    {!bankDetails.isVerified && (
                      <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                          Your bank details are pending verification. Payouts will be enabled once verified by our admin team.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : (
                  <>
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No bank details on file. You must add bank details before requesting payouts.
                      </AlertDescription>
                    </Alert>
                    <Button onClick={() => setShowBankForm(true)}>
                      <Building className="h-4 w-4 mr-2" />
                      Add Bank Details
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Payment History
                </CardTitle>
                <CardDescription>Your payout requests and transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No payment history yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {paymentHistory.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium capitalize">{payment.payment_type.replace(/_/g, " ")}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payment.requested_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {payment.currency_code} {payment.amount.toFixed(2)}
                          </p>
                          <Badge variant={
                            payment.status === "approved" ? "default" :
                            payment.status === "rejected" ? "destructive" :
                            "secondary"
                          }>
                            {payment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Bank Details Form Dialog */}
        {showBankForm && (
          <Dialog open={showBankForm} onOpenChange={setShowBankForm}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {bankDetails ? "Update Bank Details" : "Add Bank Details"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Bank details are securely stored and verified by our admin team before payouts are enabled.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="accountHolderName">
                    Account Holder Full Name (must match your profile name)
                  </Label>
                  <Input
                    id="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="Bank of America"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branchName">Branch Name (Optional)</Label>
                  <Input
                    id="branchName"
                    value={formData.branchName}
                    onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                    placeholder="Downtown Branch"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="1234567890"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="countryCode">Country</Label>
                  <Input
                    id="countryCode"
                    value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                    placeholder="US"
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
                <Button variant="outline" onClick={() => setShowBankForm(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSaveBankDetails} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Save Bank Details
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