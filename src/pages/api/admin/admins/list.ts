import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type AdminWithCreator = {
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
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

    // Verify session and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    // Get requester profile and role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: "Forbidden: Profile not found" });
    }

    // Only super_admin and manager_admin can list admins
    if (!["super_admin", "manager_admin"].includes(profile.role || "")) {
      return res.status(403).json({
        error: "Forbidden: Only super_admin and manager_admin can list admins",
      });
    }

    // Fetch all admin profiles
    const { data: admins, error: adminsError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, country_code, created_at, created_by_admin_id")
      .in("role", ["super_admin", "manager_admin", "worker_admin"])
      .order("created_at", { ascending: false })
      .limit(200);

    if (adminsError) {
      console.error("Error fetching admins:", adminsError);
      return res.status(500).json({
        error: "Failed to fetch admins",
        details: adminsError.message,
      });
    }

    // Get unique creator IDs
    const creatorIds = [
      ...new Set(
        admins
          .map((admin) => admin.created_by_admin_id)
          .filter((id): id is string => id !== null)
      ),
    ];

    // Fetch creator profiles
    let creatorsMap: Record<string, { full_name: string | null; email: string | null }> = {};
    if (creatorIds.length > 0) {
      const { data: creators } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", creatorIds);

      if (creators) {
        creatorsMap = creators.reduce((acc, creator) => {
          acc[creator.id] = {
            full_name: creator.full_name,
            email: creator.email,
          };
          return acc;
        }, {} as Record<string, { full_name: string | null; email: string | null }>);
      }
    }

    // Combine admins with creator info
    const adminsWithCreators: AdminWithCreator[] = admins.map((admin) => {
      const creator = admin.created_by_admin_id
        ? creatorsMap[admin.created_by_admin_id]
        : null;

      return {
        ...admin,
        creator_name: creator?.full_name || null,
        creator_email: creator?.email || null,
      };
    });

    return res.status(200).json({
      success: true,
      admins: adminsWithCreators,
      count: adminsWithCreators.length,
    });
  } catch (error) {
    console.error("Error in list admins API:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}