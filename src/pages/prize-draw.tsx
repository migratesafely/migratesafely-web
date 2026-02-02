import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AppHeader } from "@/components/AppHeader";
import { PrizeDrawCountdown } from "@/components/PrizeDrawCountdown";
import { PublicPageTeaser } from "@/components/PublicPageTeaser";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, Trophy, Gift, Info, Sparkles, Heart, LogIn, Shield, Globe, FileCheck, CreditCard, Users, TrendingUp, Calendar, Award } from "lucide-react";
import Head from "next/head";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";

type DrawStatus = "COMING_SOON" | "ANNOUNCED" | "NONE";

interface DrawData {
  id: string;
  countryCode: string;
  drawDate: string;
  announcementStatus: string;
  estimatedPrizePoolAmount: number;
  estimatedPrizePoolCurrency: string;
  estimatedPrizePoolPercentage: number;
  forecastMemberCount: number;
  disclaimerText: string | null;
}

const TRANSLATIONS = {
  en: {
    pageTitle: "Prize Draw | Migrate Safely",
    exclusiveTitle: "Exclusive prize draw for active members",
    purposeTitle: "Purpose of Prize Draws",
    purposeText1: "All prize draws on MigrateSafely are designed exclusively for registered members.",
    purposeText2: "These prizes are intended to help members use the funds towards legitimate migration-related costs, including documentation, applications, travel, and settlement expenses.",
    purposeText3: "Prizes are not cash giveaways and are never paid in physical cash.",
    purposeText4: "All approved prizes are issued via verified bank transfer only, in line with compliance, transparency, and anti-fraud standards.",
    noDrawTitle: "No Prize Draw Available",
    noDrawDesc: "No prize draw available in your country yet.",
    checkBack: "Check back soon for upcoming draws!",
    comingSoonTitle: "Prize Draw Coming Soon!",
    comingSoonDesc: "Get ready for an exciting opportunity",
    estimatedPool: "Estimated Prize Pool",
    disclaimer: "Disclaimer:",
    disclaimerText1: "Estimated prize pool is not guaranteed and is based",
    disclaimerText2: "approximately {percentage}% of membership",
    disclaimerText3: "Final amount may vary based on actual membership at draw time.",
    announcementSoon: "Draw announcement coming soon...",
    activeDrawTitle: "Prize Draw Active!",
    freeEntry: "Free entry for all active members",
    prizePool: "Prize Pool",
    checkingEntry: "Checking your entry...",
    entered: "✓ You are entered into this draw",
    enteredOn: "Entered on",
    notEntered: "You are not entered yet",
    enterDraw: "Enter Draw",
    entering: "Entering...",
    drawDate: "Draw Date",
    randomPrizes: "Random Draw Prizes",
    randomPrizesDesc: "Prize Draw prizes are randomly selected.",
    communityAwards: "Community Support Awards",
    communityAwardsDesc1: "Community Support Awards are selected by Migratesafely.com to support",
    communityAwardsDesc2: "members facing hardship.",
    winnerTitle: "Congratulations! You Are a Winner!",
    youWon: "You have won the following prize(s)",
    claimDeadline: "Claim Deadline:",
    claimSubmitted: "✓ Claim Submitted",
    claimedOn: "Claimed on",
    contactSoon: "We will contact you soon regarding prize fulfillment.",
    claimPrize: "🎁 Claim Prize Now",
    expired: "⚠️ Claim Period Expired",
    deadlinePassed: "The deadline to claim this prize has passed.",
    howItWorks: "How It Works",
    howItWorks1: "All active members are automatically entered",
    howItWorks2: "No additional action required from you",
    howItWorks3: "Winners will be randomly selected on the draw date",
    howItWorks4: "Winners will be notified via email and displayed here",
    loading: "Loading...",
    complianceNotice: "Prize draws are a member benefit and are not a gambling product. Participation is free for registered members.",
    loginRequired: "Login Required to Participate",
    loginToEnter: "You must be logged in as a member to enter prize draws and view your entries.",
    loginButton: "Login to Participate",
    signupPrompt: "Not a member yet?",
    signupButton: "Sign Up Now"
  },
  bn: {
    pageTitle: "পুরস্কার ড্র | নিরাপদে মাইগ্রেট করুন",
    exclusiveTitle: "সক্রিয় সদস্যদের জন্য একচেটিয়া পুরস্কার ড্র",
    purposeTitle: "পুরস্কার ড্রয়ের উদ্দেশ্য",
    purposeText1: "MigrateSafely-তে সমস্ত পুরস্কার ড্র শুধুমাত্র নিবন্ধিত সদস্যদের জন্য ডিজাইন করা হয়েছে।",
    purposeText2: "এই পুরস্কারগুলি সদস্যদের বৈধ মাইগ্রেশন-সম্পর্কিত খরচ, যেমন ডকুমেন্টেশন, আবেদন, ভ্রমণ এবং বসতি স্থাপনের খরচের জন্য তহবিল ব্যবহার করতে সাহায্য করার উদ্দেশ্যে।",
    purposeText3: "পুরস্কারগুলি নগদ উপহার নয় এবং কখনই ভৌত নগদে প্রদান করা হয় না।",
    purposeText4: "সমস্ত অনুমোদিত পুরস্কার শুধুমাত্র যাচাইকৃত ব্যাংক স্থানান্তরের মাধ্যমে প্রদান করা হয়, সম্মতি, স্বচ্ছতা এবং জালিয়াতি-বিরোধী মান অনুসারে।",
    noDrawTitle: "কোন পুরস্কার ড্র উপলব্ধ নেই",
    noDrawDesc: "আপনার দেশে এখনও কোন পুরস্কার ড্র উপলব্ধ নেই।",
    checkBack: "আসন্ন ড্রয়ের জন্য শীঘ্রই ফিরে দেখুন!",
    comingSoonTitle: "পুরস্কার ড্র শীঘ্রই আসছে!",
    comingSoonDesc: "একটি উত্তেজনাপূর্ণ সুযোগের জন্য প্রস্তুত হন",
    estimatedPool: "আনুমানিক পুরস্কার তহবিল",
    disclaimer: "দাবিত্যাগ:",
    disclaimerText1: "আনুমানিক পুরস্কার তহবিল নিশ্চিত নয় এবং এর উপর ভিত্তি করে",
    disclaimerText2: "সদস্যপদের প্রায় {percentage}%",
    disclaimerText3: "ড্রয়ের সময় প্রকৃত সদস্যপদের উপর ভিত্তি করে চূড়ান্ত পরিমাণ পরিবর্তিত হতে পারে।",
    announcementSoon: "ড্র ঘোষণা শীঘ্রই আসছে...",
    activeDrawTitle: "পুরস্কার ড্র সক্রিয়!",
    freeEntry: "সকল সক্রিয় সদস্যদের জন্য বিনামূল্যে প্রবেশ",
    prizePool: "পুরস্কার তহবিল",
    checkingEntry: "আপনার এন্ট্রি চেক করা হচ্ছে...",
    entered: "✓ আপনি এই ড্রতে প্রবেশ করেছেন",
    enteredOn: "প্রবেশ করেছেন",
    notEntered: "আপনি এখনও প্রবেশ করেননি",
    enterDraw: "ড্রতে প্রবেশ করুন",
    entering: "প্রবেশ করা হচ্ছে...",
    drawDate: "ড্র তারিখ",
    randomPrizes: "র‍্যান্ডম ড্র পুরস্কার",
    randomPrizesDesc: "পুরস্কার ড্র পুরস্কারগুলি এলোমেলোভাবে নির্বাচিত হয়।",
    communityAwards: "কমিউনিটি সাপোর্ট পুরস্কার",
    communityAwardsDesc1: "কমিউনিটি সাপোর্ট পুরস্কারগুলি Migratesafely.com দ্বারা নির্বাচিত হয়",
    communityAwardsDesc2: "কষ্টের সম্মুখীন সদস্যদের সমর্থন করতে।",
    winnerTitle: "অভিনন্দন! আপনি একজন বিজয়ী!",
    youWon: "আপনি নিম্নলিখিত পুরস্কার(গুলি) জিতেছেন",
    claimDeadline: "দাবি করার সময়সীমা:",
    claimSubmitted: "✓ দাবি জমা দেওয়া হয়েছে",
    claimedOn: "দাবি করা হয়েছে",
    contactSoon: "পুরস্কার পূরণের বিষয়ে আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।",
    claimPrize: "🎁 পুরস্কার দাবি করুন",
    expired: "⚠️ দাবির মেয়াদ শেষ",
    deadlinePassed: "এই পুরস্কার দাবি করার সময়সীমা পার হয়ে গেছে।",
    howItWorks: "কিভাবে কাজ করে",
    howItWorks1: "সকল সক্রিয় সদস্য স্বয়ংক্রিয়ভাবে প্রবেশ করে",
    howItWorks2: "আপনার পক্ষ থেকে কোন অতিরিক্ত পদক্ষেপের প্রয়োজন নেই",
    howItWorks3: "ড্র তারিখের দিন বিজয়ীদের এলোমেলোভাবে নির্বাচন করা হবে",
    howItWorks4: "বিজয়ীদের ইমেইলের মাধ্যমে অবহিত করা হবে এবং এখানে প্রদর্শিত হবে",
    loading: "লোড হচ্ছে...",
    complianceNotice: "পুরস্কার ড্র একটি সদস্য সুবিধা এবং এটি একটি জুয়া পণ্য নয়। নিবন্ধিত সদস্যদের জন্য অংশগ্রহণ বিনামূল্যে।",
    loginRequired: "অংশগ্রহণের জন্য লগইন প্রয়োজন",
    loginToEnter: "পুরস্কার ড্রয়ে প্রবেশ করতে এবং আপনার এন্ট্রি দেখতে আপনাকে সদস্য হিসাবে লগইন করতে হবে।",
    loginButton: "অংশগ্রহণের জন্য লগইন করুন",
    signupPrompt: "এখনও সদস্য নন?",
    signupButton: "এখনই সাইন আপ করুন"
  }
};

export default function PrizeDrawPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = TRANSLATIONS[language];
  
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [drawStatus, setDrawStatus] = useState<DrawStatus>("NONE");
  const [activeDraw, setActiveDraw] = useState<DrawData | null>(null);
  const [prizes, setPrizes] = useState<any[]>([]);
  const [entryStatus, setEntryStatus] = useState<any>(null);
  const [checkingEntry, setCheckingEntry] = useState(false);
  const [entering, setEntering] = useState(false);
  const [myWinners, setMyWinners] = useState<any[]>([]);
  const [selectedWinner, setSelectedWinner] = useState<any>(null);
  const [claimLoading, setClaimLoading] = useState(false);

  useEffect(() => {
    loadPageData();
  }, []);

  async function loadPageData() {
    try {
      const user = await authService.getCurrentUser();
      setIsLoggedIn(!!user);

      if (user) {
        const winnersRes = await fetch("/api/prize-draw/winners");
        const winnersData = await winnersRes.json();
        if (winnersData.success && winnersData.winners?.length > 0) {
          setMyWinners(winnersData.winners);
        }
      }

      const statusRes = await fetch("/api/prize-draw/status");
      const statusData = await statusRes.json();
      
      setDrawStatus(statusData.status);
      
      if (statusData.draw) {
        setActiveDraw(statusData.draw);
        
        if (statusData.status === "ANNOUNCED") {
          const prizesRes = await fetch(`/api/prize-draw/prizes?drawId=${statusData.draw.id}`);
          const prizesData = await prizesRes.json();
          if (prizesData.success) {
            setPrizes(prizesData.prizes);
          }
          
          if (user) {
            checkEntryStatus(statusData.draw.id);
          }
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error loading draw data:", error);
      setLoading(false);
    }
  }

  async function checkEntryStatus(drawId: string) {
    setCheckingEntry(true);
    try {
      const res = await fetch(`/api/prize-draw/my-entry?drawId=${drawId}`);
      const data = await res.json();
      if (data) {
        setEntryStatus(data);
      }
    } catch (error) {
      console.error("Error checking entry:", error);
    } finally {
      setCheckingEntry(false);
    }
  }

  async function handleEnterDraw() {
    if (!activeDraw) return;
    
    setEntering(true);
    try {
      const res = await fetch("/api/prize-draw/enter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drawId: activeDraw.id })
      });
      
      const data = await res.json();
      if (data.success) {
        setEntryStatus({ hasEntry: true, enteredAt: new Date().toISOString() });
      } else {
        alert(data.error || "Failed to enter draw");
      }
    } catch (error) {
      console.error("Error entering draw:", error);
      alert("An error occurred");
    } finally {
      setEntering(false);
    }
  }

  async function handleClaimPrize() {
    if (!selectedWinner) return;

    setClaimLoading(true);
    try {
      const res = await fetch("/api/prize-draw/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId: selectedWinner.id })
      });

      const data = await res.json();
      if (data.success) {
        const winnersRes = await fetch("/api/prize-draw/winners");
        const winnersData = await winnersRes.json();
        if (winnersData.success) {
          setMyWinners(winnersData.winners);
        }
        setSelectedWinner(null);
      } else {
        alert(data.error || "Failed to claim prize");
      }
    } catch (error) {
      console.error("Error claiming prize:", error);
      alert("An error occurred");
    } finally {
      setClaimLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>{t.pageTitle}</title>
      </Head>
      <AppHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">{t.loading}</span>
          </div>
        ) : (
          <>
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Trophy className="h-12 w-12 text-yellow-500" />
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                  {t.pageTitle}
                </h1>
              </div>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                {t.exclusiveTitle}
              </p>
            </div>

            {/* Purpose of Community Prize Draws Section - Always visible to public */}
            <section id="purpose-section" className="mb-12 max-w-4xl mx-auto scroll-mt-20">
              <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                  <Heart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  Purpose of Community Prize Draws
                </h2>
                
                {/* Main Purpose */}
                <div className="space-y-4 mb-8">
                  <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                      </div>
                      <span>Prize draws are designed exclusively to support existing registered members of Migratesafely.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                      </div>
                      <span>Prize funds are intended to help members with legitimate migration-related costs, including documentation, applications, travel, and settlement expenses.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                      </div>
                      <span className="font-semibold">Prize draws are a community benefit program and are NOT a gambling activity or lottery product.</span>
                    </li>
                  </ul>
                </div>

                {/* Eligibility & Compliance Rules */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Eligibility & Compliance Rules
                  </h3>
                  <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>Prize draws are open to eligible Bangladeshi members worldwide, including Non-Resident Bangladeshis (NRBs).</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <span>Members may reside in any country but must be Bangladeshi citizens.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <FileCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span>Identity verification requires either:</span>
                        <ul className="mt-2 ml-6 space-y-1 text-sm">
                          <li>• A valid Bangladeshi Passport OR</li>
                          <li>• A Bangladeshi National ID (NID)</li>
                        </ul>
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Payment & Verification Rules */}
                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                    Payment & Verification Rules
                  </h3>
                  <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-2 w-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
                      </div>
                      <span className="font-semibold">Prize winnings are NOT paid in physical cash.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-2 w-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
                      </div>
                      <span className="font-semibold">All approved prizes are paid ONLY via verified bank transfer.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-2 w-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
                      </div>
                      <span>The bank account must be a Bangladeshi bank account held in the member's own name.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-2 w-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
                      </div>
                      <span className="font-semibold">No third-party accounts are permitted.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {isLoggedIn && myWinners.length > 0 && (
              <div className="mb-12">
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950 mb-6">
                  <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-lg font-medium text-green-900 dark:text-green-100">
                    {t.winnerTitle}
                  </AlertDescription>
                </Alert>
                
                <div className="grid gap-6 md:grid-cols-2">
                  {myWinners.map((winner) => (
                    <Card key={winner.id} className="border-green-200 dark:border-green-800 shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Trophy className="h-32 w-32" />
                      </div>
                      <CardHeader>
                        <CardTitle className="text-green-700 dark:text-green-400">
                          {winner.prizeTitle}
                        </CardTitle>
                        <CardDescription>
                          {t.youWon}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-2xl font-bold">
                            {winner.currencyCode} {winner.prizeValueAmount}
                          </div>
                          
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <p>{t.claimDeadline} {new Date(winner.claimDeadlineAt).toLocaleDateString()}</p>
                          </div>

                          {winner.claimStatus === "CLAIMED" ? (
                            <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg">
                              <p className="flex items-center gap-2 font-medium text-green-800 dark:text-green-200">
                                {t.claimSubmitted}
                              </p>
                              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                {t.claimedOn} {new Date(winner.claimedAt).toLocaleDateString()}
                              </p>
                              <p className="text-xs mt-2 text-green-600 dark:text-green-400">
                                {t.contactSoon}
                              </p>
                            </div>
                          ) : new Date(winner.claimDeadlineAt) < new Date() ? (
                            <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg text-red-800 dark:text-red-200">
                              <p className="font-bold flex items-center gap-2">
                                {t.expired}
                              </p>
                              <p className="text-sm mt-1">
                                {t.deadlinePassed}
                              </p>
                            </div>
                          ) : (
                            <Button 
                              onClick={() => setSelectedWinner(winner)}
                              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-lg animate-pulse"
                            >
                              {t.claimPrize}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {drawStatus === "NONE" ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {t.noDrawTitle}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {t.noDrawDesc}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {t.checkBack}
                  </p>
                </CardContent>
              </Card>
            ) : drawStatus === "COMING_SOON" ? (
              <div className="max-w-3xl mx-auto">
                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl text-blue-800 dark:text-blue-200">
                      {t.comingSoonTitle}
                    </CardTitle>
                    <CardDescription className="text-blue-600 dark:text-blue-300">
                      {t.comingSoonDesc}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {activeDraw && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-sm">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          {t.estimatedPool}
                        </p>
                        <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                          {activeDraw.estimatedPrizePoolCurrency} {activeDraw.estimatedPrizePoolAmount.toLocaleString()}
                        </p>
                        <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                          <p className="font-semibold">{t.disclaimer}</p>
                          <p>{t.disclaimerText1} {t.disclaimerText2.replace('{percentage}', activeDraw.estimatedPrizePoolPercentage.toString())}.</p>
                          <p>{t.disclaimerText3}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-center p-8">
                      <PrizeDrawCountdown drawDate={activeDraw?.drawDate || new Date().toISOString()} />
                      <p className="mt-4 text-blue-700 dark:text-blue-300 font-medium animate-pulse">
                        {t.announcementSoon}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-2xl text-purple-800 dark:text-purple-200">
                            {t.activeDrawTitle}
                          </CardTitle>
                          <CardDescription className="text-purple-600 dark:text-purple-300">
                            {t.freeEntry}
                          </CardDescription>
                        </div>
                        {activeDraw && (
                          <div className="text-right">
                            <p className="text-sm text-purple-600 dark:text-purple-300">{t.prizePool}</p>
                            <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                              {activeDraw.estimatedPrizePoolCurrency} {activeDraw.estimatedPrizePoolAmount.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-lg">{t.drawDate}</h3>
                          <p className="text-xl font-bold">
                            {activeDraw && new Date(activeDraw.drawDate).toLocaleDateString()}
                          </p>
                        </div>
                        <PrizeDrawCountdown drawDate={activeDraw?.drawDate || new Date().toISOString()} />
                      </div>

                      {!isLoggedIn ? (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-6 text-center">
                          <LogIn className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            {t.loginRequired}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {t.loginToEnter}
                          </p>
                          <div className="space-y-3">
                            <Button 
                              size="lg" 
                              onClick={() => router.push("/login?redirect=/prize-draw")}
                              className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                              {t.loginButton}
                            </Button>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {t.signupPrompt}{" "}
                              <button
                                onClick={() => router.push("/signup")}
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold underline"
                              >
                                {t.signupButton}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          {checkingEntry ? (
                            <div className="py-4 flex items-center justify-center text-purple-600">
                              <Loader2 className="h-5 w-5 animate-spin mr-2" />
                              {t.checkingEntry}
                            </div>
                          ) : entryStatus?.hasEntry ? (
                            <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 p-4 rounded-lg">
                              <p className="font-bold flex items-center justify-center gap-2 text-lg">
                                {t.entered}
                              </p>
                              <p className="text-sm mt-1">
                                {t.enteredOn} {new Date(entryStatus.enteredAt).toLocaleDateString()}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <p className="text-gray-600 dark:text-gray-300">
                                {t.notEntered}
                              </p>
                              <Button 
                                size="lg" 
                                onClick={handleEnterDraw}
                                disabled={entering}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-6"
                              >
                                {entering ? (
                                  <>
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    {t.entering}
                                  </>
                                ) : (
                                  t.enterDraw
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Gift className="h-6 w-6 text-purple-500" />
                      {t.randomPrizes}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {t.randomPrizesDesc}
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {prizes.filter(p => p.awardType === 'RANDOM_DRAW').map((prize) => (
                        <Card key={prize.id} className="border-l-4 border-l-purple-500">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{prize.title}</CardTitle>
                            <CardDescription>
                              {prize.numberOfWinners} winner{prize.numberOfWinners > 1 ? 's' : ''}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                              {prize.currencyCode} {prize.prizeValueAmount.toLocaleString()}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Heart className="h-6 w-6 text-pink-500" />
                      {t.communityAwards}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {t.communityAwardsDesc1} {t.communityAwardsDesc2}
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {prizes.filter(p => p.awardType === 'COMMUNITY_SUPPORT').map((prize) => (
                        <Card key={prize.id} className="border-l-4 border-l-pink-500">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{prize.title}</CardTitle>
                            <CardDescription>
                              {prize.numberOfWinners} recipient{prize.numberOfWinners > 1 ? 's' : ''}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                              {prize.currencyCode} {prize.prizeValueAmount.toLocaleString()}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-blue-500" />
                        {t.howItWorks}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-4">
                        <li className="flex gap-3">
                          <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-sm font-bold text-blue-600 dark:text-blue-400">1</div>
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {t.howItWorks1}
                          </span>
                        </li>
                        <li className="flex gap-3">
                          <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-sm font-bold text-blue-600 dark:text-blue-400">2</div>
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {t.howItWorks2}
                          </span>
                        </li>
                        <li className="flex gap-3">
                          <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-sm font-bold text-blue-600 dark:text-blue-400">3</div>
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {t.howItWorks3}
                          </span>
                        </li>
                        <li className="flex gap-3">
                          <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-sm font-bold text-blue-600 dark:text-blue-400">4</div>
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {t.howItWorks4}
                          </span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 py-4 border-t border-gray-200 dark:border-gray-700">
              <p>{t.complianceNotice}</p>
            </div>
          </>
        )}
      </div>

      <Dialog open={!!selectedWinner} onOpenChange={() => setSelectedWinner(null)}>
        <DialogContent>
          <DialogTitle>{t.claimPrize}</DialogTitle>
          <DialogDescription>
            {selectedWinner && (
              <div className="space-y-4 pt-4">
                <p>
                  You are claiming: <strong>{selectedWinner.prizeTitle}</strong>
                </p>
                <p>
                  Value: <strong>{selectedWinner.currencyCode} {selectedWinner.prizeValueAmount}</strong>
                </p>
                <p className="text-sm text-gray-500">
                  By clicking confirm, you acknowledge that our team will contact you to verify your identity and arrange prize delivery.
                </p>
                <div className="flex gap-3 justify-end pt-2">
                  <Button variant="outline" onClick={() => setSelectedWinner(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleClaimPrize} disabled={claimLoading}>
                    {claimLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Claiming...
                      </>
                    ) : (
                      "Confirm Claim"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}