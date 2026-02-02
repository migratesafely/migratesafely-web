import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Menu, 
  X, 
  Home,
  Shield,
  MapPin,
  Gift,
  MessageSquare,
  HelpCircle,
  Users,
  Trophy,
  FileText,
  Briefcase,
  User,
  Settings,
  LogOut,
  CreditCard,
  UserCheck,
  PhoneCall,
  CheckCircle2,
  LayoutDashboard
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/router";
import { NotificationBell } from "./NotificationBell";
import { AdminNotificationBell } from "./AdminNotificationBell";

// Local translation dictionary to resolve context issues
const TEXT = {
  en: {
    welcome: "Welcome",
    home: "Home",
    about: "About Us",
    services: "Services",
    howItWorks: "How It Works",
    scamReports: "Scam Reports",
    embassyDirectory: "Embassy Directory",
    prizeDrawWinners: "Winners",
    careers: "Careers",
    faq: "FAQs",
    contact: "Contact",
    dashboard: "Dashboard",
    membership: "Membership",
    wallet: "Wallet",
    prizeDraw: "Prize Draw",
    messages: "Messages",
    requestAgent: "Request Agent",
    myAgentRequests: "My Agent Requests",
    reportScam: "Report Scam",
    verifyIdentity: "Verify Identity",
    support: "Support",
    agentDashboard: "Agent Dashboard",
    adminPanel: "Admin Panel",
    logout: "Logout",
    login: "Login",
    joinNow: "Join Now"
  },
  bn: {
    welcome: "স্বাগতম",
    home: "হোম",
    about: "আমাদের সম্পর্কে",
    services: "সেবাসমূহ",
    howItWorks: "কিভাবে কাজ করে",
    scamReports: "প্রতারণা রিপোর্ট",
    embassyDirectory: "দূতাবাস ডিরেক্টরি",
    prizeDrawWinners: "বিজয়ীরা",
    careers: "ক্যারিয়ার",
    faq: "প্রশ্নোত্তর",
    contact: "যোগাযোগ",
    dashboard: "ড্যাশবোর্ড",
    membership: "সদস্যপদ",
    wallet: "ওয়ালেট",
    prizeDraw: "পুরস্কার ড্র",
    messages: "বার্তা",
    requestAgent: "এজেন্ট অনোধ",
    myAgentRequests: "আমার এজেন্ট অনোধ",
    reportScam: "প্রতারণা রিপোর্ট করুন",
    verifyIdentity: "পরিচয় যাচাই",
    support: "সহায়তা",
    agentDashboard: "এজেন্ট ড্যাশবোর্ড",
    adminPanel: "অ্যাডমিন প্যানেল",
    logout: "লগআউট",
    login: "লগইন",
    joinNow: "যোগদান করুন"
  }
};

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  public?: boolean;
  member?: boolean;
  agent?: boolean;
  admin?: boolean;
}

export function AppHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { language } = useLanguage();
  const t = TEXT[language as keyof typeof TEXT] || TEXT.en;
  const router = useRouter();

  useEffect(() => {
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      setIsAuthenticated(true);
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
      
      setUserRole(profile?.role || null);
    } else {
      setIsAuthenticated(false);
      setUserRole(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const publicMenuItems: MenuItem[] = [
    { label: t.home, href: "/", icon: <Home className="h-5 w-5" />, public: true },
    { label: t.about, href: "/about", icon: <Users className="h-5 w-5" />, public: true },
    { label: t.services, href: "/services", icon: <Briefcase className="h-5 w-5" />, public: true },
    { label: t.howItWorks, href: "/how-it-works", icon: <HelpCircle className="h-5 w-5" />, public: true },
    { label: t.scamReports, href: "/scam-reports", icon: <Shield className="h-5 w-5" />, public: true },
    { label: t.embassyDirectory, href: "/embassy-directory", icon: <MapPin className="h-5 w-5" />, public: true },
    { label: t.prizeDrawWinners, href: "/winners", icon: <Trophy className="h-5 w-5" />, public: true },
    { label: t.careers, href: "/careers", icon: <Briefcase className="h-5 w-5" />, public: true },
    { label: t.faq, href: "/faq", icon: <HelpCircle className="h-5 w-5" />, public: true },
    { label: t.contact, href: "/contact", icon: <PhoneCall className="h-5 w-5" />, public: true },
  ];

  const memberMenuItems: MenuItem[] = [
    { label: t.dashboard, href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" />, member: true },
    { label: t.membership, href: "/membership", icon: <CreditCard className="h-5 w-5" />, member: true },
    { label: t.wallet, href: "/wallet", icon: <CreditCard className="h-5 w-5" />, member: true },
    { label: t.prizeDraw, href: "/prize-draw", icon: <Gift className="h-5 w-5" />, member: true },
    { label: t.messages, href: "/messages", icon: <MessageSquare className="h-5 w-5" />, member: true },
    { label: t.requestAgent, href: "/request-agent", icon: <UserCheck className="h-5 w-5" />, member: true },
    { label: t.myAgentRequests, href: "/my-agent-requests", icon: <FileText className="h-5 w-5" />, member: true },
    { label: t.reportScam, href: "/report-scam", icon: <Shield className="h-5 w-5" />, member: true },
    { label: t.verifyIdentity, href: "/verify-identity", icon: <CheckCircle2 className="h-5 w-5" />, member: true },
    { label: t.support, href: "/support", icon: <HelpCircle className="h-5 w-5" />, member: true },
  ];

  const agentMenuItems: MenuItem[] = [
    { label: t.agentDashboard, href: "/agents/dashboard", icon: <LayoutDashboard className="h-5 w-5" />, agent: true },
    { label: t.messages, href: "/messages", icon: <MessageSquare className="h-5 w-5" />, agent: true },
  ];

  const adminMenuItems: MenuItem[] = [
    { label: t.adminPanel, href: "/admin", icon: <Settings className="h-5 w-5" />, admin: true },
  ];

  const getVisibleMenuItems = () => {
    let items = [...publicMenuItems];

    if (isAuthenticated) {
      if (userRole === "member") {
        items = [...items, ...memberMenuItems];
      } else if (userRole === "agent") {
        items = [...items, ...agentMenuItems];
      } else if (["worker_admin", "manager_admin", "super_admin"].includes(userRole || "")) {
        items = [...items, ...adminMenuItems];
      }
    }

    return items;
  };

  const visibleMenuItems = getVisibleMenuItems();

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-6">
        {/* Header Container - Mobile: h-32 (128px), Desktop: h-26 (104px) */}
        <div className="flex justify-between items-center h-28 sm:h-26">
          
          {/* Logo + Welcome + Flag Group */}
          {/* Gap - Mobile: gap-4, Desktop: gap-3 */}
          <Link 
            href="/" 
            className="flex items-center gap-4 sm:gap-3 hover:opacity-80 transition-opacity"
          >
            {/* Logo - Mobile: h-[70px], Desktop: h-16 */}
            <img 
              src="/logo-v2.png" 
              alt="Welcome" 
              className="h-[70px] w-auto sm:h-16" 
            />
            {/* Text - Mobile: text-2xl, Desktop: text-2xl (maintained desktop size, mobile scaled up) */}
            <span className="text-2xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
              {t.welcome} 🇧🇩
            </span>
          </Link>

          {/* Desktop Navigation (Unchanged) */}
          <nav className="hidden lg:flex items-center gap-6">
            {visibleMenuItems.slice(0, 6).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
              >
                {item.label}
              </Link>
            ))}
            
            {isAuthenticated ? (
              <>
                {(userRole === "member" || userRole === "agent") && <NotificationBell />}
                {["worker_admin", "manager_admin", "super_admin"].includes(userRole || "") && <AdminNotificationBell />}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  {t.logout}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                >
                  {t.login}
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {t.joinNow}
                </Link>
              </>
            )}
          </nav>

          {/* Mobile: Notification + Menu */}
          <div className="flex lg:hidden items-center gap-3 sm:gap-2">
            {isAuthenticated && (
              <>
                {(userRole === "member" || userRole === "agent") && <NotificationBell />}
                {["worker_admin", "manager_admin", "super_admin"].includes(userRole || "") && <AdminNotificationBell />}
              </>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              aria-label="Toggle menu"
            >
              {/* Burger Menu - Mobile: h-10 w-10 (40px), Desktop/Tablet: h-8 w-8 */}
              {mobileMenuOpen ? (
                <X className="h-10 w-10 sm:h-8 sm:w-8" />
              ) : (
                <Menu className="h-10 w-10 sm:h-8 sm:w-8" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col gap-2">
              {visibleMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}

              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">{t.logout}</span>
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <User className="h-5 w-5" />
                    <span className="font-medium">{t.login}</span>
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <UserCheck className="h-5 w-5" />
                    <span className="font-medium">{t.joinNow}</span>
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}