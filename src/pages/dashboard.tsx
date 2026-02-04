import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { MainHeader } from "@/components/MainHeader";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/LanguageContext";
import { VirtualMembershipCard } from "@/components/VirtualMembershipCard";
import { TierProgressBar } from "@/components/TierProgressBar";
import { TierBenefitsDisplay } from "@/components/TierBenefitsDisplay";
import { LoyaltyProgramInfo } from "@/components/LoyaltyProgramInfo";
import { PrizeClaimButton } from "@/components/PrizeClaimButton";
import { formatCurrency } from "@/lib/countryConfig";
import { LanguageSelector } from "@/components/LanguageSelector";
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
import { MemberWelcome } from "@/components/MemberWelcome";
import { PublicPageTeaser } from "@/components/PublicPageTeaser";

const TEXT = {
  en: {
    pageTitle: "Dashboard | Migrate Safely",
    metaDescription: "Manage your membership, referrals, and migration resources",
    welcome: "Welcome",
    loading: "Loading...",
    loginRequired: "Please log in to view your dashboard",
    languagePreference: "Language Preference",
    languageDescription: "Select your preferred language for the Members Portal",
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
    prizePool: {
      title: "Community Prize Pool",
      description: "All active members are automatically entered into monthly prize draws at no additional cost",
      loading: "Loading prize pool information..."
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
    languagePreference: "ভাষা পছন্দ",
    languageDescription: "সদস্য পোর্টালের জন্য আপনার পছন্দের ভাষা নির্বাচন করুন",
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
    prizePool: {
      title: "কমিউনিটি পুরস্কার পুল",
      description: "সকল সক্রিয় সদস্য স্বয় করুন এবং পুরস্কার ড্রতে প্রবেশ করে কোনো অতিরিক্ত খরচ ছাড়াই",
      loading: "পুরস্কার পুল তথ্য লোড হচ্ছে..."
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
  },
  es: {
    pageTitle: "Panel de Control | Migrar de Forma Segura",
    metaDescription: "Gestiona tu membresía, referencias y recursos de migración",
    welcome: "Bienvenido",
    loading: "Cargando...",
    loginRequired: "Por favor inicia sesión para ver tu panel de control",
    languagePreference: "Preferencia de Idioma",
    languageDescription: "Selecciona tu idioma preferido para el Portal de Miembros",
    membership: {
      title: "Estado de Membresía",
      active: "Activo",
      inactive: "Inactivo",
      expired: "Expirado",
      validUntil: "Válido Hasta:",
      getStarted: "Comenzar"
    },
    referral: {
      title: "Tu Código de Referencia",
      description: "Comparte tu código de referencia y gana recompensas",
      code: "Código:",
      copyCode: "Copiar Código",
      copied: "¡Copiado!",
      totalReferrals: "Referencias Totales:",
      activeReferrals: "Referencias Activas:",
      totalEarnings: "Ganancias Totales:"
    },
    wallet: {
      title: "Saldo de Billetera",
      balance: "Saldo:",
      viewTransactions: "Ver Transacciones"
    },
    prizePool: {
      title: "Fondo Comunitario de Premios",
      description: "Todos los miembros activos participan automáticamente en sorteos mensuales sin costo adicional",
      loading: "Cargando información del fondo de premios..."
    },
    quickActions: {
      title: "Acciones Rápidas",
      prizeDraw: "Participar en Sorteo",
      reportScam: "Reportar una Estafa",
      viewScamReports: "Ver Reportes de Estafas",
      requestAgent: "Solicitar un Agente Aprobado",
      myAgentRequests: "Mis Solicitudes de Agente",
      mailbox: "Buzón de Correo",
      contactSupport: "Contactar Soporte"
    }
  },
  fr: {
    pageTitle: "Tableau de Bord | Migrer en Toute Sécurité",
    metaDescription: "Gérez votre adhésion, vos parrainages et vos ressources de migration",
    welcome: "Bienvenue",
    loading: "Chargement...",
    loginRequired: "Veuillez vous connecter pour voir votre tableau de bord",
    languagePreference: "Préférence de Langue",
    languageDescription: "Sélectionnez votre langue préférée pour le Portail des Membres",
    membership: {
      title: "Statut d'Adhésion",
      active: "Actif",
      inactive: "Inactif",
      expired: "Expiré",
      validUntil: "Valide Jusqu'au:",
      getStarted: "Commencer"
    },
    referral: {
      title: "Votre Code de Parrainage",
      description: "Partagez votre code de parrainage et gagnez des récompenses",
      code: "Code:",
      copyCode: "Copier le Code",
      copied: "Copié!",
      totalReferrals: "Parrainages Totaux:",
      activeReferrals: "Parrainages Actifs:",
      totalEarnings: "Gains Totaux:"
    },
    wallet: {
      title: "Solde du Portefeuille",
      balance: "Solde:",
      viewTransactions: "Voir les Transactions"
    },
    prizePool: {
      title: "Cagnotte Communautaire",
      description: "Tous les membres actifs participent automatiquement aux tirages mensuels sans frais supplémentaires",
      loading: "Chargement des informations de la cagnotte..."
    },
    quickActions: {
      title: "Actions Rapides",
      prizeDraw: "Participer au Tirage au Sort",
      reportScam: "Signaler une Arnaque",
      viewScamReports: "Voir les Signalements d'Arnaques",
      requestAgent: "Demander un Agent Approuvé",
      myAgentRequests: "Mes Demandes d'Agent",
      mailbox: "Boîte aux Lettres",
      contactSupport: "Contacter le Support"
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
  
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [acceptedAgreement, setAcceptedAgreement] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [updatingAgreement, setUpdatingAgreement] = useState(false);
  const [membership, setMembership] = useState<MembershipData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [tierProgress, setTierProgress] = useState<any>(null);
  const [loadingTierProgress, setLoadingTierProgress] = useState(true);
  const [prizePoolBalance, setPrizePoolBalance] = useState<number>(0);
  const [loadingPrizePool, setLoadingPrizePool] = useState(true);

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
          const dashboardPath = profile.role === "agent" ? "/agents/dashboard" : 
                               profile.role === "agent_suspended" ? "/agents/suspended" : 
                               "/agents/pending";
          router.push(dashboardPath);
          return;
        }

        setProfile(profile);

        // Detect first login for welcome message
        if (profile && !profile.welcome_seen) {
          setIsFirstLogin(true);
        }

        await loadPrizePoolData();
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

      // Load tier progress data
      await loadTierProgress(user.id);

      // Load prize pool data
      await loadPrizePoolData();

      setLoading(false);
    } catch (error) {
      console.error("Error loading user data:", error);
      setErrorMessage("Error loading dashboard data");
      setLoading(false);
    }
  }

  async function loadTierProgress(userId: string) {
    try {
      setLoadingTierProgress(true);
      const { data, error } = await supabase.rpc("get_member_tier_progress", {
        p_member_id: userId,
      });

      if (error) {
        console.error("Error loading tier progress:", error);
      } else if (data && data.length > 0) {
        setTierProgress(data[0]);
      }
    } catch (error) {
      console.error("Error in loadTierProgress:", error);
    } finally {
      setLoadingTierProgress(false);
    }
  }

  async function loadPrizePoolData() {
    try {
      setLoadingPrizePool(true);

      // Get Prize Pool balance from member_prize_pool_view (member-safe, read-only)
      const { data: poolData, error: poolError } = await supabase
        .from("member_prize_pool_view")
        .select("total_prize_pool_balance")
        .single();

      if (!poolError && poolData) {
        setPrizePoolBalance((poolData as any).total_prize_pool_balance || 0);
      } else if (poolError) {
        console.error("Error loading prize pool:", poolError);
        // Fail silently - display will show 0 or "unavailable" state
      }
    } catch (error) {
      console.error("Error loading prize pool data:", error);
    } finally {
      setLoadingPrizePool(false);
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
        <MainHeader />
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
        <MainHeader />
        
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-end gap-4">
            <LanguageSelector variant="compact" showLabel={false} />
          </div>
        </div>

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
            {/* Member Welcome Message */}
            {profile && (
              <MemberWelcome
                firstName={profile.first_name || "Member"}
                memberNumber={profile.member_number || "N/A"}
                isFirstLogin={isFirstLogin}
              />
            )}

            {/* Prize Claim Section (Only visible if user has claimable prizes) */}
            <PrizeClaimButton />

            {/* Prize Pool Visibility Card */}
            {membership?.status === "active" && (
              <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-yellow-200 dark:border-yellow-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-900 dark:text-yellow-100">
                    <Trophy className="h-6 w-6" />
                    {t.prizePool.title}
                  </CardTitle>
                  <CardDescription className="text-yellow-800 dark:text-yellow-200">
                    {t.prizePool.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingPrizePool ? (
                    <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">{t.prizePool.loading}</span>
                    </div>
                  ) : (
                    <>
                      {/* Prize Pool Balance - READ-ONLY */}
                      <div className="p-6 bg-white dark:bg-gray-900 rounded-lg border border-yellow-200 dark:border-yellow-800 text-center">
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                          Community Prize Pool
                        </p>
                        <p className="text-4xl font-bold text-yellow-900 dark:text-yellow-100">
                          {prizePoolBalance.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          })} BDT
                        </p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                          Updated periodically
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
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
                        {formatCurrency(membership.membershipFeeAmount, language === 'bn' ? 'bn' : 'en')}
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

                  <Card 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push("/document-verification")}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-600" />
                        Document Verification
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Request verification of sponsorship letters, invitations, and employment documents
                      </p>
                    </CardContent>
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

            <LoyaltyProgramInfo />
          </div>
        </main>
      </div>
    </>
  );
}