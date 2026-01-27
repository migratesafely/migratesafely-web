import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Users, 
  MessageSquare, 
  AlertTriangle, 
  Award,
  Building2,
  UserCheck,
  Settings,
  FileText
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  pendingScamReports: number;
  pendingAgentRequests: number;
  pendingIdentityVerifications: number;
  unreadMessages: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    pendingScamReports: 0,
    pendingAgentRequests: 0,
    pendingIdentityVerifications: 0,
    unreadMessages: 0,
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push("/admin/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || !["worker_admin", "manager_admin", "super_admin"].includes(profile.role || "")) {
      router.push("/admin/login");
      return;
    }

    setUserRole(profile.role);
    await fetchDashboardStats();
    setLoading(false);
  }

  async function fetchDashboardStats() {
    try {
      // Fetch pending scam reports
      const { count: scamCount } = await supabase
        .from("scammer_reports")
        .select("*", { count: "exact", head: true })
        .eq("status", "submitted");

      // Fetch pending agent requests
      const { count: agentCount } = await supabase
        .from("agent_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Fetch pending identity verifications
      const { count: identityCount } = await supabase
        .from("identity_verifications")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      setStats({
        pendingScamReports: scamCount || 0,
        pendingAgentRequests: agentCount || 0,
        pendingIdentityVerifications: identityCount || 0,
        unreadMessages: 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  const adminModules = [
    {
      title: "Scam Reports",
      description: "Review and verify reported scams",
      icon: AlertTriangle,
      href: "/admin/scam-reports",
      badge: stats.pendingScamReports,
      roles: ["worker_admin", "manager_admin", "super_admin"],
    },
    {
      title: "Agent Requests",
      description: "Manage agent applications",
      icon: Users,
      href: "/admin/agent-requests",
      badge: stats.pendingAgentRequests,
      roles: ["worker_admin", "manager_admin", "super_admin"],
    },
    {
      title: "Identity Verifications",
      description: "Approve identity documents",
      icon: UserCheck,
      href: "/admin/identity-verifications",
      badge: stats.pendingIdentityVerifications,
      roles: ["worker_admin", "manager_admin", "super_admin"],
    },
    {
      title: "Prize Draws",
      description: "Manage prize draws and winners",
      icon: Award,
      href: "/admin/prize-draws",
      badge: 0,
      roles: ["worker_admin", "manager_admin", "super_admin"],
    },
    {
      title: "Messages",
      description: "Broadcast messages to members",
      icon: MessageSquare,
      href: "/admin/messages",
      badge: 0,
      roles: ["worker_admin", "manager_admin", "super_admin"],
    },
    {
      title: "Embassies",
      description: "Manage embassy directory",
      icon: Building2,
      href: "/admin/embassies",
      badge: 0,
      roles: ["worker_admin", "manager_admin", "super_admin"],
    },
    {
      title: "Q&A System",
      description: "Manage questions and answers",
      icon: FileText,
      href: "/admin/qa",
      badge: 0,
      roles: ["worker_admin", "manager_admin", "super_admin"],
    },
    {
      title: "People Search",
      description: "Search and manage users",
      icon: Users,
      href: "/admin/people",
      badge: 0,
      roles: ["worker_admin", "manager_admin", "super_admin"],
    },
    {
      title: "Compliance Settings",
      description: "Configure system settings",
      icon: Settings,
      href: "/admin/compliance-settings",
      badge: 0,
      roles: ["super_admin"],
    },
  ];

  const visibleModules = adminModules.filter((module) =>
    module.roles.includes(userRole || "")
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Role: <span className="font-semibold capitalize">{userRole?.replace("_", " ")}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleModules.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.href} href={module.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Icon className="h-6 w-6 text-blue-600" />
                      </div>
                      {module.badge > 0 && (
                        <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
                          {module.badge}
                        </span>
                      )}
                    </div>
                    <CardTitle className="mt-4">{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      Open Module
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}