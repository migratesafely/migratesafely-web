import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { requireAdminRole } from "@/lib/apiMiddleware";
import { agentPermissionsService } from "@/services/agentPermissionsService";

interface SearchResult {
  userId: string;
  accountType: "member" | "agent";
  fullName: string | null;
  email: string;
  countryCode: string | null;
  role: string;
  referralCode: string | null;
  memberNumber?: number | null;
  agentNumber?: string | null;
  membershipStatus?: string | null;
  membershipEnd?: string | null;
  agentStatus?: string | null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || !["super_admin", "manager_admin", "worker_admin"].includes(profile.role)) {
      return res.status(403).json({ success: false, error: "Admin access required" });
    }

    const query = req.query.q as string;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Search query required" });
    }

    const searchPattern = `%${query.trim()}%`;
    const results: SearchResult[] = [];

    // Search profiles by email, full_name, referral_code, agent_number
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name, country_code, role, referral_code, agent_number, agent_status")
      .or(`email.ilike.${searchPattern},full_name.ilike.${searchPattern},referral_code.ilike.${searchPattern},agent_number.ilike.${searchPattern}`)
      .limit(25);

    if (profilesError) {
      console.error("Error searching profiles:", profilesError);
      return res.status(500).json({ success: false, error: "Failed to search profiles" });
    }

    // For each profile found, get membership info if it's a member
    for (const p of profiles || []) {
      const isAgent = p.role === "agent";
      const isMember = p.role === "member";

      if (isMember) {
        const { data: membership } = await supabase
          .from("memberships")
          .select("membership_number, status, end_date")
          .eq("user_id", p.id)
          .single();

        results.push({
          userId: p.id,
          accountType: "member",
          fullName: p.full_name,
          email: p.email,
          countryCode: p.country_code,
          role: p.role,
          referralCode: p.referral_code,
          memberNumber: membership?.membership_number || null,
          membershipStatus: membership?.status || null,
          membershipEnd: membership?.end_date || null,
        });
      } else if (isAgent) {
        results.push({
          userId: p.id,
          accountType: "agent",
          fullName: p.full_name,
          email: p.email,
          countryCode: p.country_code,
          role: p.role,
          referralCode: p.referral_code,
          agentNumber: p.agent_number,
          agentStatus: p.agent_status,
        });
      } else {
        // Other roles (admins, etc.)
        results.push({
          userId: p.id,
          accountType: p.role === "agent" ? "agent" : "member",
          fullName: p.full_name,
          email: p.email,
          countryCode: p.country_code,
          role: p.role,
          referralCode: p.referral_code,
        });
      }
    }

    // Also search memberships by membership_number
    if (!isNaN(Number(query.trim()))) {
      const { data: memberships, error: membershipsError } = await supabase
        .from("memberships")
        .select("user_id, membership_number, status, end_date")
        .eq("membership_number", Number(query.trim()))
        .limit(25);

      if (!membershipsError && memberships) {
        for (const m of memberships) {
          // Check if this user is already in results
          if (results.some(r => r.userId === m.user_id)) {
            continue;
          }

          const { data: memberProfile } = await supabase
            .from("profiles")
            .select("id, email, full_name, country_code, role, referral_code")
            .eq("id", m.user_id)
            .single();

          if (memberProfile) {
            results.push({
              userId: memberProfile.id,
              accountType: "member",
              fullName: memberProfile.full_name,
              email: memberProfile.email,
              countryCode: memberProfile.country_code,
              role: memberProfile.role,
              referralCode: memberProfile.referral_code,
              memberNumber: m.membership_number,
              membershipStatus: m.status,
              membershipEnd: m.end_date,
            });
          }
        }
      }
    }

    // Remove duplicates and limit to 25
    const uniqueResults = Array.from(
      new Map(results.map(item => [item.userId, item])).values()
    ).slice(0, 25);

    return res.status(200).json({
      success: true,
      results: uniqueResults,
      count: uniqueResults.length,
    });
  } catch (error) {
    console.error("Error in people search:", error);
    return res.status(500).json({ success: false, error: "Search failed" });
  }
}