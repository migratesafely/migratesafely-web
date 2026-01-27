import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ScammerReport = Database["public"]["Tables"]["scammer_reports"]["Row"];
type ScammerReportInsert = Database["public"]["Tables"]["scammer_reports"]["Insert"];

interface SubmitScamReportPayload {
  scammerName: string;
  scammerCompany?: string;
  scammerContact?: string;
  description: string;
  amountLost?: number;
  currency?: string;
  incidentDate?: string;
  evidenceFileUrls: string[];
}

export const scamReportService = {
  /**
   * Submit a new scam report
   */
  async submitScamReport(
    userId: string,
    payload: SubmitScamReportPayload
  ): Promise<{ success: boolean; reportId?: string; error?: string }> {
    try {
      const reportData: ScammerReportInsert = {
        reported_by: userId,
        scammer_name: payload.scammerName,
        scammer_company: payload.scammerCompany || null,
        scammer_contact: payload.scammerContact || null,
        incident_description: payload.description,
        evidence_file_urls: payload.evidenceFileUrls,
        amount_lost: payload.amountLost || null,
        currency: payload.currency || null,
        incident_date: payload.incidentDate || null,
        status: "submitted",
      };

      const { data, error } = await supabase
        .from("scammer_reports")
        .insert(reportData)
        .select("id")
        .single();

      if (error) {
        console.error("Error submitting scam report:", error);
        return { success: false, error: error.message };
      }

      return { success: true, reportId: data.id };
    } catch (error) {
      console.error("Error in submitScamReport:", error);
      return { success: false, error: "Failed to submit scam report" };
    }
  },

  /**
   * Upload evidence files to Supabase Storage
   */
  async uploadEvidenceFiles(
    userId: string,
    files: File[]
  ): Promise<{ success: boolean; urls?: string[]; error?: string }> {
    try {
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from("scam-evidence")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          console.error("Error uploading file:", error);
          return { success: false, error: error.message };
        }

        const { data: publicUrlData } = supabase.storage
          .from("scam-evidence")
          .getPublicUrl(data.path);

        uploadedUrls.push(publicUrlData.publicUrl);
      }

      return { success: true, urls: uploadedUrls };
    } catch (error) {
      console.error("Error in uploadEvidenceFiles:", error);
      return { success: false, error: "Failed to upload evidence files" };
    }
  },

  /**
   * List current user's scam reports
   */
  async listMyReports(userId: string): Promise<{
    success: boolean;
    reports?: ScammerReport[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from("scammer_reports")
        .select("*")
        .eq("reported_by", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching reports:", error);
        return { success: false, error: error.message };
      }

      return { success: true, reports: data || [] };
    } catch (error) {
      console.error("Error in listMyReports:", error);
      return { success: false, error: "Failed to fetch reports" };
    }
  },

  /**
   * List all pending scam reports (submitted or under_review)
   * For admin/manager use only
   */
  async listPendingReports(): Promise<{
    success: boolean;
    reports?: any[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from("scammer_reports")
        .select(`
          *,
          profiles!scammer_reports_reported_by_fkey (
            full_name,
            email
          )
        `)
        .in("status", ["submitted", "under_review"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      return { success: true, reports: data || [] };
    } catch (error) {
      console.error("Error fetching pending reports:", error);
      return { success: false, error: "Failed to fetch pending reports" };
    }
  },

  /**
   * Get single scam report by ID with reporter details
   * For admin review
   */
  async getReportById(reportId: string): Promise<{
    success: boolean;
    report?: any;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from("scammer_reports")
        .select(`
          *,
          profiles!scammer_reports_reported_by_fkey (
            full_name,
            email,
            country_code
          )
        `)
        .eq("id", reportId)
        .single();

      if (error) throw error;

      return { success: true, report: data };
    } catch (error) {
      console.error("Error fetching report:", error);
      return { success: false, error: "Failed to fetch report" };
    }
  },

  /**
   * Verify a scam report (Manager/Super Admin only)
   */
  async verifyReport(
    reportId: string,
    adminId: string,
    reviewNotes?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // First check if evidence exists
      const { data: report } = await supabase
        .from("scammer_reports")
        .select("evidence_file_urls")
        .eq("id", reportId)
        .single();

      if (!report?.evidence_file_urls || report.evidence_file_urls.length === 0) {
        return {
          success: false,
          error: "Cannot verify report without evidence files",
        };
      }

      const { error } = await supabase
        .from("scammer_reports")
        .update({
          status: "verified",
          reviewed_by: adminId,
          review_notes: reviewNotes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Error verifying report:", error);
      return { success: false, error: "Failed to verify report" };
    }
  },

  /**
   * Reject a scam report (Manager/Super Admin only)
   */
  async rejectReport(
    reportId: string,
    adminId: string,
    reviewNotes: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!reviewNotes || reviewNotes.trim().length === 0) {
        return {
          success: false,
          error: "Review notes are required for rejection",
        };
      }

      const { error } = await supabase
        .from("scammer_reports")
        .update({
          status: "rejected",
          reviewed_by: adminId,
          review_notes: reviewNotes,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Error rejecting report:", error);
      return { success: false, error: "Failed to reject report" };
    }
  },

  /**
   * Mark report as under review (Manager/Super Admin only)
   */
  async markUnderReview(
    reportId: string,
    adminId: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from("scammer_reports")
        .update({
          status: "under_review",
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Error marking report under review:", error);
      return { success: false, error: "Failed to update report status" };
    }
  },
};