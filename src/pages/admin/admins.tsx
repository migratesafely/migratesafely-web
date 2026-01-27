import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Shield, UserPlus, Search, AlertCircle, CheckCircle2, UserX, UserCheck, Edit } from "lucide-react";

type AdminUser = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  country_code: string | null;
  created_at: string | null;
  created_by_admin_id: string | null;
  creator_name: string | null;
  creator_email: string | null;
};

export default function AdminManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [updatingRoles, setUpdatingRoles] = useState<Record<string, boolean>>({});
  const [suspendingAdmins, setSuspendingAdmins] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<"list" | "hierarchy">("list");
  const [hierarchy, setHierarchy] = useState<any>(null);
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);

  // CEO Test Accounts state
  const [isCeoModalOpen, setIsCeoModalOpen] = useState(false);
  const [creatingCeoAccounts, setCreatingCeoAccounts] = useState(false);
  const [ceoFormData, setCeoFormData] = useState({
    ceoEmail: "",
    password: "",
    fullName: "",
    countryCode: "BD",
  });
  const [ceoAccountsResult, setCeoAccountsResult] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    countryCode: "BD",
    roleToCreate: "worker_admin" as "manager_admin" | "worker_admin",
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    const view = router.query.view as string;
    if (view === "hierarchy" && userRole === "super_admin") {
      setViewMode("hierarchy");
      fetchHierarchy();
    } else {
      setViewMode("list");
    }
  }, [router.query.view, userRole]);

  useEffect(() => {
    filterAdmins();
  }, [searchQuery, admins]);

  async function checkAdminAccess() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/admin/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || !["super_admin", "manager_admin"].includes(profile.role || "")) {
      router.push("/dashboard");
      return;
    }

    setUserRole(profile.role);
    await fetchAdmins(session.access_token);
    setLoading(false);
  }

  async function fetchAdmins(token: string) {
    try {
      const response = await fetch("/api/admin/admins/list", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch admins");
      }

      const data = await response.json();
      setAdmins(data.admins || []);
      setFilteredAdmins(data.admins || []);
    } catch (error) {
      console.error("Error fetching admins:", error);
      showAlert("error", "Failed to load admin list");
    }
  }

  function filterAdmins() {
    if (!searchQuery.trim()) {
      setFilteredAdmins(admins);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = admins.filter(
      (admin) =>
        admin.email?.toLowerCase().includes(query) ||
        admin.full_name?.toLowerCase().includes(query) ||
        admin.role?.toLowerCase().includes(query)
    );
    setFilteredAdmins(filtered);
  }

  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    setCreatingAdmin(true);
    setAlertMessage(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        showAlert("error", "Session expired. Please login again.");
        return;
      }

      const response = await fetch("/api/admin/admins/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create admin");
      }

      showAlert("success", data.message || "Admin created successfully");
      setIsCreateModalOpen(false);
      resetForm();
      await fetchAdmins(session.access_token);
    } catch (error) {
      showAlert("error", error instanceof Error ? error.message : "Failed to create admin");
    } finally {
      setCreatingAdmin(false);
    }
  }

  function showAlert(type: "success" | "error", message: string) {
    setAlertMessage({ type, message });
    setTimeout(() => setAlertMessage(null), 5000);
  }

  function resetForm() {
    setFormData({
      fullName: "",
      email: "",
      password: "",
      countryCode: "BD",
      roleToCreate: "worker_admin",
    });
  }

  function getRoleBadgeColor(role: string | null) {
    switch (role) {
      case "super_admin":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "manager_admin":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "worker_admin":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  }

  function getRoleDisplayName(role: string | null) {
    if (!role) return "Unknown";
    return role.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }

  async function handleCreateCeoAccounts(e: React.FormEvent) {
    e.preventDefault();
    setCreatingCeoAccounts(true);
    setAlertMessage(null);
    setCeoAccountsResult(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        showAlert("error", "Session expired. Please login again.");
        return;
      }

      const response = await fetch("/api/admin/test/create-ceo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(ceoFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create CEO test accounts");
      }

      showAlert("success", "CEO test accounts created successfully!");
      setCeoAccountsResult(data);
    } catch (error) {
      showAlert("error", error instanceof Error ? error.message : "Failed to create CEO test accounts");
    } finally {
      setCreatingCeoAccounts(false);
    }
  }

  function resetCeoForm() {
    setCeoFormData({
      ceoEmail: "",
      password: "",
      fullName: "",
      countryCode: "BD",
    });
    setCeoAccountsResult(null);
  }

  async function fetchHierarchy() {
    setLoadingHierarchy(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/admin/admins/hierarchy", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch hierarchy");
      }

      const data = await response.json();
      setHierarchy(data.hierarchy);
    } catch (error) {
      console.error("Error fetching hierarchy:", error);
      showAlert("error", "Failed to load admin hierarchy");
    } finally {
      setLoadingHierarchy(false);
    }
  }

  function renderHierarchyAdmin(admin: any, level: number = 0) {
    const indent = level * 24;
    return (
      <div key={admin.id} className="mb-2">
        <div
          className="flex items-center gap-2 py-2 px-4 hover:bg-muted/50 rounded"
          style={{ marginLeft: `${indent}px` }}
        >
          <Badge variant="outline" className={getRoleBadgeColor(admin.role)}>
            {getRoleDisplayName(admin.role)}
          </Badge>
          <span className="font-medium">{admin.full_name || "Unnamed"}</span>
          <span className="text-sm text-muted-foreground">({admin.email})</span>
          {admin.is_suspended && (
            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
              Suspended
            </Badge>
          )}
        </div>
        {admin.children && admin.children.length > 0 && (
          <div>
            {admin.children.map((child: any) => renderHierarchyAdmin(child, level + 1))}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading admin management...</p>
      </div>
    );
  }

  const canCreateManager = userRole === "super_admin";
  const roleOptions = canCreateManager
    ? [
        { value: "manager_admin", label: "Manager Admin" },
        { value: "worker_admin", label: "Worker Admin" },
      ]
    : [{ value: "worker_admin", label: "Worker Admin" }];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold">Admin Management</h1>
                <p className="text-muted-foreground">
                  Manage admin accounts and hierarchy
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {userRole === "super_admin" && (
                <>
                  <Dialog open={isCeoModalOpen} onOpenChange={setIsCeoModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Create CEO Test Accounts
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Create CEO Test Accounts</DialogTitle>
                        <DialogDescription>
                          Creates 3 accounts: Super Admin (CEO), Member (with active membership), and Agent
                        </DialogDescription>
                      </DialogHeader>

                      {!ceoAccountsResult ? (
                        <form onSubmit={handleCreateCeoAccounts} className="space-y-4">
                          <div>
                            <Label htmlFor="ceoEmail">CEO Email *</Label>
                            <Input
                              id="ceoEmail"
                              type="email"
                              value={ceoFormData.ceoEmail}
                              onChange={(e) => setCeoFormData({ ...ceoFormData, ceoEmail: e.target.value })}
                              required
                              placeholder="ceo@bdeshagent.com"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Will create: ceo@..., ceo+member@..., ceo+agent@...
                            </p>
                          </div>

                          <div>
                            <Label htmlFor="ceoPassword">Password *</Label>
                            <Input
                              id="ceoPassword"
                              type="password"
                              value={ceoFormData.password}
                              onChange={(e) => setCeoFormData({ ...ceoFormData, password: e.target.value })}
                              required
                              minLength={8}
                              placeholder="Minimum 8 characters"
                            />
                          </div>

                          <div>
                            <Label htmlFor="ceoFullName">Full Name *</Label>
                            <Input
                              id="ceoFullName"
                              value={ceoFormData.fullName}
                              onChange={(e) => setCeoFormData({ ...ceoFormData, fullName: e.target.value })}
                              required
                              placeholder="John Doe"
                            />
                          </div>

                          <div>
                            <Label htmlFor="ceoCountryCode">Country Code *</Label>
                            <Input
                              id="ceoCountryCode"
                              value={ceoFormData.countryCode}
                              onChange={(e) => setCeoFormData({ ...ceoFormData, countryCode: e.target.value })}
                              required
                              maxLength={2}
                              placeholder="BD"
                            />
                          </div>

                          <div className="flex gap-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsCeoModalOpen(false);
                                resetCeoForm();
                              }}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={creatingCeoAccounts} className="flex-1">
                              {creatingCeoAccounts ? "Creating..." : "Create Accounts"}
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div className="space-y-4">
                          <Alert className="border-green-500 bg-green-50">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                              CEO test accounts created successfully!
                            </AlertDescription>
                          </Alert>

                          <div className="space-y-3">
                            <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                              <p className="font-semibold text-purple-900">Super Admin (CEO)</p>
                              <p className="text-sm text-purple-700">Email: {ceoAccountsResult.accounts?.superAdmin?.email}</p>
                              <p className="text-xs text-purple-600 mt-1">Login at: /admin/login</p>
                            </div>

                            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                              <p className="font-semibold text-blue-900">Member (Test)</p>
                              <p className="text-sm text-blue-700">Email: {ceoAccountsResult.accounts?.member?.email}</p>
                              <p className="text-sm text-blue-700">Membership: {ceoAccountsResult.accounts?.member?.membershipNumber}</p>
                              <p className="text-xs text-blue-600 mt-1">Login at: /login</p>
                            </div>

                            <div className="p-3 bg-green-50 border border-green-200 rounded">
                              <p className="font-semibold text-green-900">Agent (Test)</p>
                              <p className="text-sm text-green-700">Email: {ceoAccountsResult.accounts?.agent?.email}</p>
                              <p className="text-sm text-green-700">Agent #: {ceoAccountsResult.accounts?.agent?.agentNumber}</p>
                              <p className="text-xs text-green-600 mt-1">Login at: /login</p>
                            </div>

                            <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                              <p className="font-semibold text-gray-900">Shared Password</p>
                              <p className="text-sm text-gray-700 font-mono">{ceoAccountsResult.password}</p>
                              <p className="text-xs text-gray-600 mt-1">All accounts use the same password</p>
                            </div>
                          </div>

                          <Button
                            onClick={() => {
                              setIsCeoModalOpen(false);
                              resetCeoForm();
                            }}
                            className="w-full"
                          >
                            Close
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    onClick={() => {
                      if (viewMode === "hierarchy") {
                        router.push("/admin/admins");
                      } else {
                        router.push("/admin/admins?view=hierarchy");
                      }
                    }}
                  >
                    {viewMode === "hierarchy" ? "View List" : "View Hierarchy"}
                  </Button>
                </>
              )}

              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add Admin
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Admin</DialogTitle>
                    <DialogDescription>
                      Add a new {canCreateManager ? "manager or worker" : "worker"} admin to the
                      system
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateAdmin} className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        placeholder="admin@bdeshagent.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={8}
                        placeholder="Minimum 8 characters"
                      />
                    </div>

                    <div>
                      <Label htmlFor="countryCode">Country Code *</Label>
                      <Input
                        id="countryCode"
                        value={formData.countryCode}
                        onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                        required
                        maxLength={2}
                        placeholder="BD"
                      />
                    </div>

                    <div>
                      <Label htmlFor="roleToCreate">Role *</Label>
                      <Select
                        value={formData.roleToCreate}
                        onValueChange={(value: "manager_admin" | "worker_admin") =>
                          setFormData({ ...formData, roleToCreate: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsCreateModalOpen(false);
                          resetForm();
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={creatingAdmin} className="flex-1">
                        {creatingAdmin ? "Creating..." : "Create Admin"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {alertMessage && (
            <Alert
              className={
                alertMessage.type === "success"
                  ? "border-green-500 bg-green-50"
                  : "border-red-500 bg-red-50"
              }
            >
              {alertMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription
                className={alertMessage.type === "success" ? "text-green-800" : "text-red-800"}
              >
                {alertMessage.message}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{viewMode === "hierarchy" ? "Admin Hierarchy" : "Admin Accounts"}</CardTitle>
                <CardDescription>
                  {viewMode === "hierarchy"
                    ? "Organizational structure of admin accounts"
                    : `${filteredAdmins.length} of ${admins.length} admins`}
                </CardDescription>
              </div>
              {viewMode === "list" && (
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email, name, or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {viewMode === "hierarchy" ? (
              <div>
                {loadingHierarchy ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading hierarchy...
                  </div>
                ) : hierarchy ? (
                  <div className="space-y-6">
                    {hierarchy.super_admins && hierarchy.super_admins.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Super Admins</h3>
                        {hierarchy.super_admins.map((admin: any) => renderHierarchyAdmin(admin, 0))}
                      </div>
                    )}
                    {hierarchy.managers && hierarchy.managers.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Managers (Orphaned)</h3>
                        {hierarchy.managers.map((admin: any) => renderHierarchyAdmin(admin, 0))}
                      </div>
                    )}
                    {hierarchy.workers && hierarchy.workers.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Workers (Orphaned)</h3>
                        {hierarchy.workers.map((admin: any) => renderHierarchyAdmin(admin, 0))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No hierarchy data available
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Email</th>
                      <th className="text-left py-3 px-4 font-semibold">Role</th>
                      <th className="text-left py-3 px-4 font-semibold">Country</th>
                      <th className="text-left py-3 px-4 font-semibold">Created By</th>
                      <th className="text-left py-3 px-4 font-semibold">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdmins.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                          {searchQuery ? "No admins found matching your search" : "No admins found"}
                        </td>
                      </tr>
                    ) : (
                      filteredAdmins.map((admin) => (
                        <tr key={admin.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">{admin.full_name || "—"}</td>
                          <td className="py-3 px-4">{admin.email || "—"}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={getRoleBadgeColor(admin.role)}>
                              {getRoleDisplayName(admin.role)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">{admin.country_code || "—"}</td>
                          <td className="py-3 px-4">
                            {admin.creator_name || admin.creator_email || "System"}
                          </td>
                          <td className="py-3 px-4">
                            {admin.created_at
                              ? new Date(admin.created_at).toLocaleDateString()
                              : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}