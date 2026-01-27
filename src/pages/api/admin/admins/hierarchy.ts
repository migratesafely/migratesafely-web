import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type HierarchyAdmin = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  created_at: string | null;
  deleted_at: string | null;
  is_suspended: boolean;
  children?: HierarchyAdmin[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only GET allowed
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1. Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    // 2. Get requester profile and role
    const { data: requesterProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !requesterProfile) {
      return res
        .status(403)
        .json({ error: "Forbidden: Profile not found" });
    }

    // 3. Only super_admin can view hierarchy
    if (requesterProfile.role !== "super_admin") {
      return res.status(403).json({
        error: "Forbidden: Only super_admin can view admin hierarchy",
      });
    }

    // 4. Fetch all admin profiles
    const { data: admins, error: adminsError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at, deleted_at, created_by_admin_id")
      .in("role", ["super_admin", "manager_admin", "worker_admin"])
      .order("created_at", { ascending: true });

    if (adminsError) {
      console.error("Error fetching admins:", adminsError);
      return res.status(500).json({
        error: "Failed to fetch admins",
        details: adminsError.message,
      });
    }

    // 5. Build hierarchy structure
    const adminMap = new Map<string, HierarchyAdmin>();
    const hierarchy: {
      super_admins: HierarchyAdmin[];
      managers: HierarchyAdmin[];
      workers: HierarchyAdmin[];
    } = {
      super_admins: [],
      managers: [],
      workers: [],
    };

    // Create admin objects
    (admins || []).forEach((admin: any) => {
      const hierarchyAdmin: HierarchyAdmin = {
        id: admin.id,
        full_name: admin.full_name,
        email: admin.email,
        role: admin.role,
        created_at: admin.created_at,
        deleted_at: admin.deleted_at,
        is_suspended: !!admin.deleted_at,
        children: [],
      };
      adminMap.set(admin.id, hierarchyAdmin);
    });

    // Build parent-child relationships
    (admins || []).forEach((admin: any) => {
      const hierarchyAdmin = adminMap.get(admin.id);
      if (!hierarchyAdmin) return;

      if (admin.role === "super_admin") {
        hierarchy.super_admins.push(hierarchyAdmin);
      } else if (admin.role === "manager_admin") {
        // Find parent (creator)
        if (admin.created_by_admin_id) {
          const parent = adminMap.get(admin.created_by_admin_id);
          if (parent && parent.children) {
            parent.children.push(hierarchyAdmin);
          } else {
            // No parent found, add to top-level managers
            hierarchy.managers.push(hierarchyAdmin);
          }
        } else {
          hierarchy.managers.push(hierarchyAdmin);
        }
      } else if (admin.role === "worker_admin") {
        // Find parent (creator)
        if (admin.created_by_admin_id) {
          const parent = adminMap.get(admin.created_by_admin_id);
          if (parent && parent.children) {
            parent.children.push(hierarchyAdmin);
          } else {
            // No parent found, add to top-level workers
            hierarchy.workers.push(hierarchyAdmin);
          }
        } else {
          hierarchy.workers.push(hierarchyAdmin);
        }
      }
    });

    // 6. Return hierarchy
    return res.status(200).json({
      success: true,
      hierarchy,
      total_count: admins?.length || 0,
    });
  } catch (error) {
    console.error("Error in admins/hierarchy API:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}