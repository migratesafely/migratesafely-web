import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { MainHeader } from "@/components/MainHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Edit } from "lucide-react";

interface Embassy {
  id: string;
  embassy_name: string;
  address: string;
  website: string | null;
  last_verified_at: string | null;
}

export default function AdminEmbassiesPage() {
  const router = useRouter();
  const [embassies, setEmbassies] = useState<Embassy[]>([]);
  const [filteredEmbassies, setFilteredEmbassies] = useState<Embassy[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (userRole === "worker_admin" || userRole === "manager_admin" || userRole === "super_admin") {
      fetchEmbassies();
    }
  }, [userRole]);

  useEffect(() => {
    filterEmbassies();
  }, [searchTerm, embassies]);

  async function checkAccess() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/login");
      return;
    }

    // Check if user is chairman or admin
    const { data: employee } = await supabase
      .from("employees")
      .select("role_category")
      .eq("user_id", user.id)
      .maybeSingle();

    const isChairman = employee?.role_category === "chairman";

    // Get profile role
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const role = profile?.role || "";

    if (isChairman || role === "worker_admin" || role === "manager_admin") {
      setUserRole(isChairman ? "chairman" : role);
    } else {
      router.push("/");
    }
  }

  async function fetchEmbassies() {
    setLoading(true);
    const { data, error } = await supabase
      .from("embassies")
      .select("id, embassy_name, address, website, last_verified_at")
      .order("embassy_name", { ascending: true });

    if (error) {
      console.error("Error fetching embassies:", error);
    } else {
      setEmbassies(data || []);
    }
    setLoading(false);
  }

  function filterEmbassies() {
    if (!searchTerm.trim()) {
      setFilteredEmbassies(embassies);
      return;
    }

    const filtered = embassies.filter((embassy) =>
      embassy.embassy_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmbassies(filtered);
  }

  function handleEdit(id: string) {
    router.push(`/admin/embassies/edit?id=${id}`);
  }

  if (!userRole || (userRole !== "worker_admin" && userRole !== "manager_admin" && userRole !== "super_admin")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <MainHeader />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Embassy Directory Management</h1>
          <p className="text-muted-foreground">
            Manage embassy contact information for Bangladesh citizens
          </p>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by embassy name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading embassies...
          </div>
        ) : filteredEmbassies.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchTerm ? "No embassies found matching your search." : "No embassies available."}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Embassy Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Last Verified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmbassies.map((embassy) => (
                  <TableRow key={embassy.id}>
                    <TableCell className="font-medium">{embassy.embassy_name}</TableCell>
                    <TableCell className="max-w-[250px] truncate" title={embassy.address}>
                      {embassy.address}
                    </TableCell>
                    <TableCell>
                      {embassy.website ? (
                        <a
                          href={embassy.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          {embassy.website.length > 30
                            ? embassy.website.substring(0, 30) + "..."
                            : embassy.website}
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {embassy.last_verified_at ? (
                        <span className="text-sm">
                          {new Date(embassy.last_verified_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(embassy.id)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-6 text-sm text-muted-foreground">
          Showing {filteredEmbassies.length} of {embassies.length} embassies
        </div>
      </main>
    </div>
  );
}