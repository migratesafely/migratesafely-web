import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AppHeader } from "@/components/AppHeader";
import { authService } from "@/services/authService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe, DollarSign, Shield, Info, Lock } from "lucide-react";
import { getDeploymentInfo, DEPLOYMENT_CONFIG, COUNTRY_GOVERNANCE } from "@/lib/countryConfig";
import Head from "next/head";

export default function DeploymentInfoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

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
      if (!profile || !authService.isAdmin(profile.role)) {
        router.push("/");
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    } catch (error) {
      console.error("Error checking admin access:", error);
      router.push("/admin/login");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const deploymentInfo = getDeploymentInfo();

  return (
    <>
      <Head>
        <title>Deployment Info | Admin Portal</title>
      </Head>
      <div className="min-h-screen bg-background">
        <AppHeader />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Deployment Configuration</h1>
              <p className="text-muted-foreground mt-2">
                Country and currency settings for this instance
              </p>
            </div>

            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-1">Bangladesh-Only Deployment</p>
                <p className="text-sm">
                  This instance is exclusively configured for Bangladesh with BDT currency.
                  Multi-country features are disabled.
                </p>
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Country Configuration
                </CardTitle>
                <CardDescription>Operating country for this deployment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Country</p>
                    <p className="text-lg font-semibold text-foreground">{deploymentInfo.country}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Country Code</p>
                    <p className="text-lg font-semibold text-foreground">{deploymentInfo.countryCode}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="default" className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Locked
                  </Badge>
                  <span className="text-sm text-muted-foreground">Country selection disabled</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Currency Configuration
                </CardTitle>
                <CardDescription>Currency settings for all transactions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Currency</p>
                    <p className="text-lg font-semibold text-foreground">{deploymentInfo.currency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Currency Code</p>
                    <p className="text-lg font-semibold text-foreground">{deploymentInfo.currencyCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Symbol</p>
                    <p className="text-2xl font-bold text-foreground">{deploymentInfo.currencySymbol}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="default" className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Locked to BDT
                  </Badge>
                  <span className="text-sm text-muted-foreground">Currency conversion disabled</span>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    All monetary values (membership fees, referral bonuses, tier bonuses, wallet balances) 
                    are stored, calculated, and displayed in BDT only.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  Governance & Restrictions
                </CardTitle>
                <CardDescription>Configuration change permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">Change Country</span>
                    <Badge variant="destructive">Disabled</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">Enable Multi-Country</span>
                    <Badge variant="destructive">Disabled</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">Change Currency</span>
                    <Badge variant="destructive">Disabled</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">Required Role</span>
                    <Badge variant="secondary">Super Admin</Badge>
                  </div>
                </div>

                <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
                  <AlertDescription className="text-yellow-800 dark:text-yellow-200 text-sm">
                    <p className="font-semibold mb-1">Future Expansion Policy</p>
                    <p>
                      Additional countries must be launched as SEPARATE INSTANCES. 
                      Multi-country logic may exist internally but is disabled for this deployment.
                    </p>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-800">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-sm mb-2">Systems Using BDT</h3>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Membership fees</li>
                  <li>Referral bonuses (base)</li>
                  <li>Tier bonuses (percentage + lump-sum)</li>
                  <li>Wallet balances (available + pending)</li>
                  <li>Admin approval screens</li>
                  <li>Audit logs and reports</li>
                  <li>Member dashboards and displays</li>
                  <li>Payment processing</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}