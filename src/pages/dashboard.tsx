import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AppHeader } from "@/components/AppHeader";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import Head from "next/head";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Loader2,
  TrendingUp,
  Users,
  Award,
  AlertCircle,
  CheckCircle,
  FileText,
  AlertTriangle,
  MapPin,
  DollarSign,
  Plane,
  User,
  Mail,
  Globe,
  CreditCard,
  Trophy,
  UserCheck,
  MessageSquare,
  HelpCircle,
  MessageCircle,
  Shield,
  Gift,
  Calendar,
  Clock,
  XCircle,
  Ticket,
  Sparkles,
} from "lucide-react";

const TEXT = {
  en: {
    pageTitle: "Dashboard | Migrate Safely",
    metaDescription: "Manage your membership, referrals, and migration resources",
    welcome: "Welcome",
    loading: "Loading...",
    loginRequired: "Please log in to view your dashboard",
    membership: {
      title: "Membership Status",
      active: "Active",
      inactive: "Inactive",
      expired: "Expired",
      validUntil: "Valid Until:",
      getStarted: "Get Started"
    },
    referral: {
      title: "Your Referral Code",
      description: "Share your referral code and earn rewards",
      code: "Code:",
      copyCode: "Copy Code",
      copied: "Copied!",
      totalReferrals: "Total Referrals:",
      activeReferrals: "Active Referrals:",
      totalEarnings: "Total Earnings:"
    },
    wallet: {
      title: "Wallet Balance",
      balance: "Balance:",
      viewTransactions: "View Transactions"
    },
    quickActions: {
      title: "Quick Actions",
      prizeDraw: "Enter Prize Draw",
      reportScam: "Report a Scam",
      viewScamReports: "View Scam Reports",
      requestAgent: "Request an Approved Agent",
      myAgentRequests: "My Agent Requests",
      mailbox: "Mailbox",
      contactSupport: "Contact Support"
    }
  },
  bn: {
    pageTitle: "ড্যাশবোর্ড | নিরাপদে মাইগ্রেট করুন",
    metaDescription: "আপনার সদস্যপদ, রেফারেল এবং মাইগ্রেশন রিসোর্স পরিচালনা করুন",
    welcome: "স্বাগতম",
    loading: "লোড হচ্ছে...",
    loginRequired: "আপনার ড্যাশবোর্ড দেখতে দয়া করে লগইন করুন",
    membership: {
      title: "সদস্যপদের স্ট্যাটাস",
      active: "সক্রিয়",
      inactive: "নিষ্ক্রিয়",
      expired: "মেয়াদ উত্তীর্ণ",
      validUntil: "বৈধ থাকবে:",
      getStarted: "শুরু করুন"
    },
    referral: {
      title: "আপনার রেফারেল কোড",
      description: "আপনার রেফারেল কোড শেয়ার করুন এবং পুরস্কার অর্জন করুন",
      code: "কোড:",
      copyCode: "কোড কপি করুন",
      copied: "কপি করা হয়েছে!",
      totalReferrals: "মোট রেফারেল:",
      activeReferrals: "সক্রিয় রেফারেল:",
      totalEarnings: "মোট আয়:"
    },
    wallet: {
      title: "ওয়ালেট ব্যালেন্স",
      balance: "ব্যালেন্স:",
      viewTransactions: "লেনদেন দেখুন"
    },
    quickActions: {
      title: "দ্রুত কাজ",
      prizeDraw: "পুরস্কার ড্রতে প্রবেশ করুন",
      reportScam: "একটি প্রতারণা রিপোর্ট করুন",
      viewScamReports: "প্রতারণা রিপোর্ট দেখুন",
      requestAgent: "একটি অনোদিত এজেন্ট অনোধ করুন",
      myAgentRequests: "আমার এজেন্ট অনোধ",
      mailbox: "মেইলবক্স",
      contactSupport: "সাপোর্টে যোগাযোগ করুন"
    }
  }
};

interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
}

interface MembershipData {
  membershipNumber: number;
  status: string;
  membershipFeeAmount: number;
  currencyCode: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = TEXT[language];
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acceptedAgreement, setAcceptedAgreement] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [updatingAgreement, setUpdatingAgreement] = useState(false);
  const [membership, setMembership] = useState<MembershipData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await authService.getCurrentUser();
        if (!user) {
          router.push("/login?redirect=/dashboard");
          return;
        }

        const profile = await authService.getUserProfile(user.id);
        if (!profile) {
          router.push("/login");
          return;
        }

        // Redirect agents to their own dashboard
        if (["agent", "agent_pending", "agent_suspended"].includes(profile.role)) {
          router.push(authService.getDashboardPath(profile.role));
          return;
        }

        setProfile(profile);
        setLoading(false);
      } catch (error) {
        console.error("Error checking auth:", error);
        router.push("/login");
      }
    }

    checkAuth();
  }, [router]);

  async function loadUserData() {
    try {
      const user = await authService.getCurrentUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        setErrorMessage("Error loading profile");
        setLoading(false);
        return;
      }

      if (profileData) {
        setProfile(profileData);
        
        // Check if user needs to accept agreement
        if (!profileData.accepted_member_agreement) {
          setShowAgreementModal(true);
        }
      }

      const { data: membershipData, error: membershipError } = await supabase
        .from("memberships")
        .select("membership_number, status, fee_amount, fee_currency")
        .eq("user_id", user.id)
        .single();

      if (!membershipError && membershipData) {
        setMembership({
          membershipNumber: membershipData.membership_number,
          status: membershipData.status,
          membershipFeeAmount: membershipData.fee_amount,
          currencyCode: membershipData.fee_currency,
        });
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading user data:", error);
      setErrorMessage("Error loading dashboard data");
      setLoading(false);
    }
  }

  async function handleAcceptAgreement() {
    if (!acceptedAgreement) {
      return;
    }

    setUpdatingAgreement(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          accepted_member_agreement: true,
          accepted_member_agreement_at: new Date().toISOString(),
          accepted_member_agreement_version: "v1"
        })
        .eq("id", profile.id);

      if (error) {
        console.error("Error updating agreement:", error);
        alert("Failed to update agreement. Please try again.");
      } else {
        setShowAgreementModal(false);
        // Refresh profile data
        await loadUserData();
      }
    } catch (error) {
      console.error("Error accepting agreement:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setUpdatingAgreement(false);
    }
  }

  async function handleLogout() {
    try {
      await authService.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Failed to log out. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">{t.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{t.pageTitle}</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <AppHeader />

        {/* Agreement Acceptance Modal */}
        {showAgreementModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl shadow-2xl">
              <CardHeader className="border-b">
                <CardTitle className="text-2xl font-bold text-center">
                  Member User Agreement Required
                </CardTitle>
                <CardDescription className="text-center text-base mt-2">
                  You must accept the Member User Agreement to continue using the platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <Alert>
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription className="text-base">
                    You must accept the Member User Agreement to continue using MigrateSafely.com.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Our Member User Agreement outlines the terms and conditions of using our platform, 
                    including prize draws, referral programs, scam reporting, and liability disclaimers.
                  </p>

                  <Link href="/member-agreement" target="_blank">
                    <Button variant="outline" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Read Member User Agreement
                    </Button>
                  </Link>

                  <div className="flex items-start space-x-2 pt-4 border-t">
                    <Checkbox
                      id="acceptDashboardAgreement"
                      checked={acceptedAgreement}
                      onCheckedChange={(checked) => setAcceptedAgreement(checked === true)}
                    />
                    <label
                      htmlFor="acceptDashboardAgreement"
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I have read and agree to the{" "}
                      <Link
                        href="/member-agreement"
                        target="_blank"
                        className="text-blue-600 hover:underline"
                      >
                        Member User Agreement
                      </Link>
                      ,{" "}
                      <Link
                        href="/terms"
                        target="_blank"
                        className="text-blue-600 hover:underline"
                      >
                        Terms
                      </Link>
                      ,{" "}
                      <Link
                        href="/privacy"
                        target="_blank"
                        className="text-blue-600 hover:underline"
                      >
                        Privacy
                      </Link>
                      {" "}and{" "}
                      <Link
                        href="/disclaimer"
                        target="_blank"
                        className="text-blue-600 hover:underline"
                      >
                        Disclaimer
                      </Link>
                      .
                    </label>
                  </div>

                  <Button
                    onClick={handleAcceptAgreement}
                    disabled={!acceptedAgreement || updatingAgreement}
                    className="w-full"
                    size="lg"
                  >
                    {updatingAgreement ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept and Continue
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{t.pageTitle.split(" | ")[0]}</h1>
              <p className="text-muted-foreground mt-2">
                {t.welcome}, {profile?.fullName || profile?.email}
              </p>
            </div>

            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>Your account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile?.email}</span>
                  </div>
                  {profile?.fullName && (
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{profile.fullName}</span>
                    </div>
                  )}
                  {profile?.role && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm capitalize">{profile.role}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {membership && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      {t.membership.title}
                    </CardTitle>
                    <CardDescription>Your membership status</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Membership Number</p>
                      <p className="text-lg font-semibold">{membership.membershipNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="text-lg font-semibold capitalize">
                        {t.membership[membership.status as keyof typeof t.membership] || membership.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Membership Fee</p>
                      <p className="text-lg font-semibold">
                        {membership.membershipFeeAmount} {membership.currencyCode}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {membership?.status === "active" && (
              <section>
                <h2 className="text-xl font-semibold mb-4">{t.quickActions.title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  <Card
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => router.push("/embassy-directory")}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <img src="/images/embassy.svg" alt="Embassy" className="w-8 h-8" />
                        <MapPin className="h-5 w-5 text-blue-600" />
                        Embassy Directory
                      </CardTitle>
                      <CardDescription className="text-blue-50">
                        Official embassy contacts & websites
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <p className="text-gray-600">
                        Access comprehensive directory of official embassy contacts and information for your country
                      </p>
                    </CardContent>
                  </Card>

                  <Card
                    onClick={() => router.push("/report-scam")}
                    className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-red-500 to-red-600 text-white"
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <img src="/images/scam-report.svg" alt="Report Scam" className="w-8 h-8" />
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        Report Scam
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-red-50">
                        Submit evidence for admin verification
                      </p>
                      <p className="text-sm text-red-100 mt-2">
                        Help protect the community by reporting scam activities with evidence for verification
                      </p>
                    </CardContent>
                  </Card>

                  <Card
                    onClick={() => router.push("/prize-draw")}
                    className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-yellow-500 to-orange-500 text-white"
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <img src="/images/prize-draw.svg" alt="Prize Draw" className="w-8 h-8" />
                        <Award className="h-5 w-5 text-yellow-600" />
                        Prize Draw
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-yellow-50 font-semibold">
                        Free entry for active members
                      </p>
                      <p className="text-sm text-yellow-100 mt-2">
                        Win prizes automatically - no action required!
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/scam-reports")}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <CardTitle className="text-lg">{t.quickActions.viewScamReports}</CardTitle>
                      </div>
                    </CardHeader>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/request-agent")}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <UserCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <CardTitle className="text-lg">{t.quickActions.requestAgent}</CardTitle>
                      </div>
                    </CardHeader>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/my-agent-requests")}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                          <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <CardTitle className="text-lg">{t.quickActions.myAgentRequests}</CardTitle>
                      </div>
                    </CardHeader>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/messages")}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                          <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <CardTitle className="text-lg">{t.quickActions.mailbox}</CardTitle>
                      </div>
                    </CardHeader>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/support")}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                          <HelpCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <CardTitle className="text-lg">{t.quickActions.contactSupport}</CardTitle>
                      </div>
                    </CardHeader>
                  </Card>

                  <Card 
                    className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                    onClick={() => router.push("/community-hardship-request")}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <HelpCircle className="h-5 w-5" />
                        Community Hardship Draw Request
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-purple-50 font-semibold">
                        Submit a hardship request for consideration
                      </p>
                      <p className="text-sm text-purple-100 mt-2">
                        One submission per year - reviewed by our community support team
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <img src="/images/support.svg" alt="Messages" className="w-8 h-8" />
                        <MessageCircle className="h-5 w-5 text-green-600" />
                        Messages
                      </CardTitle>
                    </CardHeader>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        Monthly Prize Draws
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Automatic entry into monthly prize draws with cash rewards
                      </p>
                    </CardContent>
                  </Card>

                </div>
              </section>
            )}

            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Welcome to Migratesafely.com
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Your trusted partner for safe and secure migration services.
                  More features coming soon!
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}