import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Shield, UserCheck, UserX, RefreshCw } from "lucide-react";

interface SuperAdmin {
  id: string;
  email: string;
  full_name: string;
  date_of_birth: string | null;
  government_id_number: string | null;
  created_at: string;
  is_active: boolean;
}

export default function MasterAdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<SuperAdmin | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    full_name: "",
    date_of_birth: "",
    government_id_number: "",
  });

  const [updateForm, setUpdateForm] = useState({
    full_name: "",
    date_of_birth: "",
    government_id_number: "",
    hr_notes: "",
  });

  useEffect(() => {
    checkMasterAdminAccess();
  }, []);

  const checkMasterAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.replace("/404");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "master_admin") {
        router.replace("/404");
        return;
      }

      setAuthorized(true);
      loadSuperAdmins();
    } catch (error) {
      router.replace("/404");
    } finally {
      setLoading(false);
    }
  };

  const loadSuperAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, date_of_birth, government_id_number, created_at")
        .eq("role", "super_admin")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const formattedAdmins: SuperAdmin[] = (data || []).map(admin => ({
        ...admin,
        is_active: true // Default to true for queried super admins
      }));
      
      setSuperAdmins(formattedAdmins);
    } catch (error) {
      console.error("Error loading super admins:", error);
    }
  };

  const handleCreateSuperAdmin = async () => {
    if (!createForm.email || !createForm.password || !createForm.full_name) {
      setMessage({ type: "error", text: "Email, password, and full name are required" });
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: createForm.email,
        password: createForm.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          role: "super_admin",
          full_name: createForm.full_name,
          date_of_birth: createForm.date_of_birth || null,
          government_id_number: createForm.government_id_number || null,
        })
        .eq("id", authData.user.id);

      if (profileError) throw profileError;

      setMessage({ type: "success", text: "Super Admin created successfully" });
      setCreateForm({
        email: "",
        password: "",
        full_name: "",
        date_of_birth: "",
        government_id_number: "",
      });
      loadSuperAdmins();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to create Super Admin" });
    }
  };

  const handleReplaceSuperAdmin = async (oldAdminId: string, newEmail: string, newPassword: string) => {
    if (!newEmail || !newPassword) {
      setMessage({ type: "error", text: "New admin email and password required" });
      return;
    }

    try {
      // Create new Super Admin
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      // Set new user as super_admin
      const { error: newProfileError } = await supabase
        .from("profiles")
        .update({ role: "super_admin" })
        .eq("id", authData.user.id);

      if (newProfileError) throw newProfileError;

      // Downgrade old Super Admin to manager_admin (retain record)
      const { error: oldProfileError } = await supabase
        .from("profiles")
        .update({ role: "manager_admin" })
        .eq("id", oldAdminId);

      if (oldProfileError) throw oldProfileError;

      setMessage({ type: "success", text: "Super Admin replaced successfully" });
      loadSuperAdmins();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to replace Super Admin" });
    }
  };

  const handleDisableSuperAdmin = async (adminId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "worker_admin" })
        .eq("id", adminId);

      if (error) throw error;

      setMessage({ type: "success", text: "Super Admin disabled" });
      loadSuperAdmins();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to disable Super Admin" });
    }
  };

  const handleRestoreSuperAdmin = async (adminId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "super_admin" })
        .eq("id", adminId);

      if (error) throw error;

      setMessage({ type: "success", text: "Super Admin restored" });
      loadSuperAdmins();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to restore Super Admin" });
    }
  };

  const handleUpdateIdentity = async () => {
    if (!selectedAdmin) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: updateForm.full_name,
          date_of_birth: updateForm.date_of_birth || null,
          government_id_number: updateForm.government_id_number || null,
        })
        .eq("id", selectedAdmin.id);

      if (error) throw error;

      setMessage({ type: "success", text: "Identity updated successfully" });
      loadSuperAdmins();
      setSelectedAdmin(null);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to update identity" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Master Admin Governance</h1>
            <p className="text-muted-foreground">System authority management</p>
          </div>
        </div>

        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="super-admins" className="space-y-6">
          <TabsList>
            <TabsTrigger value="super-admins">Super Admins</TabsTrigger>
            <TabsTrigger value="create">Create Super Admin</TabsTrigger>
            <TabsTrigger value="identity">Update Identity</TabsTrigger>
          </TabsList>

          <TabsContent value="super-admins" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Super Admins</CardTitle>
                <CardDescription>Manage Super Admin access and authority</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {superAdmins.length === 0 ? (
                    <p className="text-muted-foreground">No Super Admins found</p>
                  ) : (
                    superAdmins.map((admin) => (
                      <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{admin.full_name}</p>
                          <p className="text-sm text-muted-foreground">{admin.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(admin.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setUpdateForm({
                                full_name: admin.full_name || "",
                                date_of_birth: admin.date_of_birth || "",
                                government_id_number: admin.government_id_number || "",
                                hr_notes: "",
                              });
                            }}
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            Edit Identity
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDisableSuperAdmin(admin.id)}
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            Disable
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create Super Admin</CardTitle>
                <CardDescription>Add a new Super Admin to the system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-email">Email *</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-password">Password *</Label>
                  <Input
                    id="create-password"
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-name">Full Name *</Label>
                  <Input
                    id="create-name"
                    value={createForm.full_name}
                    onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-dob">Date of Birth</Label>
                  <Input
                    id="create-dob"
                    type="date"
                    value={createForm.date_of_birth}
                    onChange={(e) => setCreateForm({ ...createForm, date_of_birth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-gov-id">Government ID Reference</Label>
                  <Input
                    id="create-gov-id"
                    value={createForm.government_id_number}
                    onChange={(e) => setCreateForm({ ...createForm, government_id_number: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreateSuperAdmin} className="w-full">
                  Create Super Admin
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="identity" className="space-y-4">
            {selectedAdmin ? (
              <Card>
                <CardHeader>
                  <CardTitle>Update Super Admin Identity</CardTitle>
                  <CardDescription>Update HR information for {selectedAdmin.email}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="update-name">Full Name</Label>
                    <Input
                      id="update-name"
                      value={updateForm.full_name}
                      onChange={(e) => setUpdateForm({ ...updateForm, full_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="update-dob">Date of Birth</Label>
                    <Input
                      id="update-dob"
                      type="date"
                      value={updateForm.date_of_birth}
                      onChange={(e) => setUpdateForm({ ...updateForm, date_of_birth: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="update-gov-id">Government ID Reference</Label>
                    <Input
                      id="update-gov-id"
                      value={updateForm.government_id_number}
                      onChange={(e) => setUpdateForm({ ...updateForm, government_id_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="update-notes">Internal HR Notes</Label>
                    <Textarea
                      id="update-notes"
                      value={updateForm.hr_notes}
                      onChange={(e) => setUpdateForm({ ...updateForm, hr_notes: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleUpdateIdentity} className="flex-1">
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedAdmin(null)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Select a Super Admin from the list to edit their identity</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}