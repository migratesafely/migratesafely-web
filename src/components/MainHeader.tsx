import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, LogOut, FileText, Receipt } from "lucide-react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { NotificationBell } from "@/components/NotificationBell";
import { AdminNotificationBell } from "@/components/AdminNotificationBell";

type UserRole = Database["public"]["Enums"]["user_role"];

interface MenuItem {
  label: string;
  href: string;
  requiresAuth?: boolean;
  roles?: UserRole[];
  hideForRoles?: UserRole[];
}

export function MainHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profile) {
      setUserRole(profile.role as UserRole);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const isAdmin = userRole === "super_admin" || userRole === "manager_admin" || userRole === "worker_admin";

  const menuItems: MenuItem[] = [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about" },
    { label: "Services", href: "/services" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Membership", href: "/membership" },
    { label: "Agents", href: "/agents" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "/careers" },
    { 
      label: "Dashboard", 
      href: "/dashboard", 
      requiresAuth: true,
      hideForRoles: ["agent"]
    },
    {
      label: "Agent Dashboard",
      href: "/agents/dashboard",
      requiresAuth: true,
      roles: ["agent"]
    },
    {
      label: "Apply as Agent",
      href: "/agents/apply",
      requiresAuth: true,
      hideForRoles: ["agent"]
    },
    { 
      label: "Embassies", 
      href: "/embassy-directory",
      requiresAuth: true,
      hideForRoles: ["agent"]
    },
    { 
      label: "Report Scam", 
      href: "/report-scam",
      requiresAuth: true,
      hideForRoles: ["agent"]
    },
    { 
      label: "Scam Reports", 
      href: "/scam-reports",
      requiresAuth: true,
      hideForRoles: ["agent"]
    },
    { 
      label: "Prize Draw", 
      href: "/prize-draw",
      requiresAuth: true,
      hideForRoles: ["agent"]
    },
    { 
      label: "Request Agent", 
      href: "/request-agent",
      requiresAuth: true,
      hideForRoles: ["agent"]
    },
    { 
      label: "My Agent Requests", 
      href: "/my-agent-requests",
      requiresAuth: true,
      hideForRoles: ["agent"]
    },
    { 
      label: "Messages", 
      href: "/messages",
      requiresAuth: true,
      hideForRoles: ["agent"]
    },
    { 
      label: "Support", 
      href: "/support",
      requiresAuth: true,
      hideForRoles: ["agent"]
    },
    { 
      label: "Wallet", 
      href: "/wallet",
      requiresAuth: true,
      hideForRoles: ["agent"]
    },
    { 
      label: "Verify Identity", 
      href: "/verify-identity",
      requiresAuth: true,
      hideForRoles: ["agent"]
    },
    { 
      label: "Verify Agent", 
      href: "/verify-agent",
      requiresAuth: true,
      roles: ["agent"]
    },
    { 
      label: "Document Verification", 
      href: "/document-verification",
      requiresAuth: true
    },
    { 
      label: "Expense Submission", 
      href: "/admin/accounts/expenses/submit",
      requiresAuth: true,
      roles: ["agent"]
    },
    { 
      label: "My Expenses", 
      href: "/admin/accounts/expenses",
      requiresAuth: true,
      roles: ["agent"]
    }
  ];

  const visibleMenuItems = menuItems.filter((item) => {
    if (item.requiresAuth && !user) return false;
    if (item.roles && (!userRole || !item.roles.includes(userRole))) return false;
    if (item.hideForRoles && userRole && item.hideForRoles.includes(userRole)) return false;
    return true;
  });

  return (
    <div className="relative w-full z-50">
      <div className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/logo-v3.png"
                alt="MigrateSafely"
                className="h-8 w-auto"
              />
              <span className="text-xl font-semibold">migratesafely.com</span>
            </Link>

            <div className="flex items-center gap-4">
              {user && userRole !== "agent" && <NotificationBell />}
              {isAdmin && <AdminNotificationBell />}

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="absolute top-16 left-0 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex flex-col gap-1 max-h-[80vh] overflow-y-auto">
              {visibleMenuItems.map((item, index) => {
                const isLastBeforeAuth = index === visibleMenuItems.length - 1 && (user || !user);
                const isAgentSection = item.roles?.includes("agent");
                const prevItem = visibleMenuItems[index - 1];
                const showDivider = prevItem && 
                  ((prevItem.roles?.includes("agent") && !isAgentSection) ||
                   (!prevItem.roles?.includes("agent") && isAgentSection));

                return (
                  <React.Fragment key={item.href}>
                    {showDivider && (
                      <div className="h-px bg-gray-200 dark:bg-gray-800 my-1" />
                    )}
                    <Link
                      href={item.href}
                      className="text-sm px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-md transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </React.Fragment>
                );
              })}

              {isAdmin && (
                <>
                  <div className="h-px bg-gray-200 dark:bg-gray-800 my-1" />
                  <Link
                    href="/admin"
                    className="text-sm px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Panel
                  </Link>
                </>
              )}

              <div className="h-px bg-gray-200 dark:bg-gray-800 my-1" />

              {user ? (
                <>
                  {!userRole && (
                    <Link
                      href="/signup"
                      className="text-sm px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-md transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Complete Signup
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-sm px-4 py-2.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="text-sm px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}