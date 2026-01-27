import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X, Bell } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const TEXT = {
  en: {
    home: "Home",
    about: "About Us",
    services: "Services",
    howItWorks: "How It Works",
    membership: "Membership",
    contact: "Contact",
    terms: "Terms & Conditions",
    privacy: "Privacy Policy",
    disclaimer: "Disclaimer",
    winners: "Winners",
    embassy: "Embassy Directory",
    dashboard: "Dashboard",
    prizeDraw: "Prize Draw",
    prizeDraws: "Prize Draws",
    reportScam: "Report Scam",
    scamReports: "Scam Reports",
    signup: "Sign Up",
    login: "Login",
    logout: "Logout",
    faq: "FAQs",
    careers: "Careers",
    agents: "Agents",
    verifyAgent: "Verify an Agent"
  },
  bn: {
    home: "হোম",
    about: "আমাদের সম্পর্কে",
    services: "সেবাসমূহ",
    howItWorks: "কিভাবে কাজ করে",
    membership: "সদস্যপদ",
    contact: "যোগাযোগ",
    terms: "শর্তাবলী",
    privacy: "গোপনীয়তা নীতি",
    disclaimer: "দাবিত্যাগ",
    winners: "বিজয়ীরা",
    embassy: "দূতাবাস ডিরেক্টরি",
    dashboard: "ড্যাশবোর্ড",
    prizeDraw: "পুরস্কার ড্র",
    prizeDraws: "পুরস্কার ড্র",
    reportScam: "প্রতারণা রিপোর্ট করুন",
    scamReports: "প্রতারণা রিপোর্ট",
    signup: "সাইন আপ",
    login: "লগইন",
    logout: "লগআউট",
    faq: "প্রশ্নোত্তর",
    careers: "ক্যারিয়ার",
    agents: "এজেন্ট",
    verifyAgent: "এজেন্ট যাচাই করুন"
  }
};

export function AppHeader() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = TEXT[language];
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const navConfig = {
    public: [
      { label: t.home, href: "/" },
      { label: t.about, href: "/about" },
      { label: t.services, href: "/services" },
      { label: t.howItWorks, href: "/how-it-works" },
      { label: t.agents, href: "/agents" },
      { label: t.winners, href: "/winners" },
      { label: t.faq, href: "/faq" },
      { label: t.contact, href: "/contact" },
      { label: t.careers, href: "/careers" },
      { label: t.terms, href: "/terms" },
      { label: t.privacy, href: "/privacy" },
      { label: t.disclaimer, href: "/disclaimer" },
    ],
    admin:
      userRole && ["super_admin", "manager_admin", "worker_admin"].includes(userRole)
        ? [
            { label: "Review Reports", href: "/admin/scam-reports" },
            { label: "Prize Draws", href: "/admin/prize-draws" },
            ...(["super_admin", "manager_admin"].includes(userRole)
              ? [
                  { label: "Agent Requests", href: "/admin/agent-requests" },
                  { label: "Admin Messages", href: "/admin/messages" },
                  { label: "Conversations", href: "/admin/conversations" },
                  { label: "Jobs", href: "/admin/jobs" },
                  { label: "Agent Approval Audit", href: "/admin/audit/agent-approvals" },
                ]
              : []),
          ]
        : [],
    member: !loading && isLoggedIn ? [
      { label: t.dashboard, href: "/dashboard" },
      { label: t.prizeDraw, href: "/prize-draw" },
    ] : [],
    auth: !loading && !isLoggedIn ? [
      { label: t.signup, href: "/signup" },
      { label: t.login, href: "/login" },
    ] : []
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchUnreadCount();
    }
  }, [isLoggedIn, router.pathname]);

  async function checkAuthStatus() {
    try {
      const user = await authService.getCurrentUser();
      setIsLoggedIn(!!user);
      
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
          
        if (profile) {
          setUserRole(profile.role);
        }
      } else {
        setUserRole(null);
      }
    } catch (error) {
      setIsLoggedIn(false);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await authService.signOut();
      setIsLoggedIn(false);
      setMobileMenuOpen(false);
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  async function fetchUnreadCount() {
    try {
      const response = await fetch("/api/messages/unread-count");
      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }

  async function fetchUnreadMessages() {
    setLoadingMessages(true);
    try {
      const response = await fetch("/api/messages/unread-preview");
      const data = await response.json();
      if (data.success) {
        setUnreadMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching unread messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  }

  function handleBellClick() {
    if (!showNotifications) {
      fetchUnreadMessages();
    }
    setShowNotifications(!showNotifications);
  }

  async function handleNotificationClick(recipientId: string, messageId: string) {
    try {
      await fetch("/api/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId })
      });
      
      await fetchUnreadCount();
      
      setShowNotifications(false);
      router.push("/messages");
    } catch (error) {
      console.error("Error marking message as read:", error);
      setShowNotifications(false);
      router.push("/messages");
    }
  }

  async function handleMarkAllAsRead() {
    setLoadingMessages(true);
    try {
      const response = await fetch("/api/messages/mark-all-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const data = await response.json();

      if (data.success) {
        await fetchUnreadCount();
        await fetchUnreadMessages();
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    } finally {
      setLoadingMessages(false);
    }
  }

  function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function getSenderRoleBadge(role: string): string {
    switch (role) {
      case "SYSTEM": return "🔔";
      case "ADMIN": return "👤";
      case "AGENT": return "🤝";
      case "MEMBER": return "👥";
      default: return "📧";
    }
  }

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo - Left Side */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="Migratesafely.com" className="h-10 w-auto sm:h-12" />
            <span className="text-base sm:text-xl font-bold text-blue-600 dark:text-blue-400">
              Migratesafely.com
            </span>
          </Link>

          {/* Right Side - Notification Bell (if logged in) + Burger Menu */}
          <div className="flex items-center gap-2">
            {/* Notification Bell - Only for logged in users */}
            {!loading && isLoggedIn && (
              <div className="relative">
                <button
                  onClick={handleBellClick}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 relative"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowNotifications(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-40 max-h-96 overflow-hidden flex flex-col">
                      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          Notifications
                        </h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            disabled={loadingMessages}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium disabled:opacity-50"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      
                      <div className="overflow-y-auto flex-1">
                        {loadingMessages ? (
                          <div className="p-4 text-center">
                            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                          </div>
                        ) : unreadMessages.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                            No unread messages
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {unreadMessages.map((msg) => (
                              <button
                                key={msg.recipientId}
                                onClick={() => handleNotificationClick(msg.recipientId, msg.messageId)}
                                className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                              >
                                <div className="flex items-start gap-2">
                                  <span className="text-lg">{getSenderRoleBadge(msg.senderRole)}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                                      {msg.subject}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                                      {msg.bodyPreview}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                      {formatRelativeTime(msg.createdAt)}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => {
                            setShowNotifications(false);
                            router.push("/messages");
                          }}
                          className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                        >
                          View all messages
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Burger Menu Button - All Screen Sizes */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Unified Burger Menu - Desktop + Mobile */}
        {mobileMenuOpen && (
          <nav className="py-4 space-y-4 border-t border-gray-200 dark:border-gray-800">
            {/* Public Navigation Links */}
            <div className="space-y-1">
              {navConfig.public.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Admin Section */}
            {navConfig.admin.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-500 mb-2 uppercase tracking-wider">
                  Admin
                </p>
                <div className="space-y-1">
                  {navConfig.admin.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-3 py-2 rounded-md text-sm font-medium ${
                        router.pathname.startsWith(item.href)
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Member Section */}
            {navConfig.member.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-500 mb-2 uppercase tracking-wider">
                  Member
                </p>
                <div className="space-y-1">
                  {navConfig.member.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Auth Section */}
            {!loading && (
              <div className="px-4 pt-3 border-t border-gray-200 dark:border-gray-800">
                {!isLoggedIn ? (
                  <div className="space-y-2">
                    {navConfig.auth.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button 
                          variant={item.label === t.login ? "default" : "outline"}
                          className="w-full"
                        >
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t.logout}
                  </Button>
                )}
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}