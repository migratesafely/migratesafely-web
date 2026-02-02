import { supabase } from "@/integrations/supabase/client";

export interface DocumentVerificationRequest {
  requestId: string;
  ticketReference: string;
  documentType: "sponsorship_letter" | "invitation_letter" | "student_confirmation" | "employment_offer" | "other";
  documentTypeOther?: string;
  countryRelated: string;
  explanation: string;
  status: "submitted" | "under_review" | "verified" | "inconclusive" | "rejected";
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
}

export interface AdminDocumentVerificationRequest extends DocumentVerificationRequest {
  memberId: string;
  memberEmail: string;
  memberFullName: string;
  membershipNumber?: number;
  internalNotes?: string;
  reviewedBy?: string;
  reviewedByEmail?: string;
}

export const documentVerificationService = {
  /**
   * Submit a new document verification request (Member)
   * Returns ticket reference for email submission
   */
  async submitRequest(
    documentType: string,
    documentTypeOther: string | null,
    countryRelated: string,
    explanation: string
  ): Promise<{ success: boolean; ticketReference?: string; requestId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("submit_document_verification_request", {
        p_document_type: documentType,
        p_country_related: countryRelated,
        p_explanation: explanation,
        p_document_type_other: documentTypeOther,
      });

      if (error) {
        console.error("Error submitting document verification request:", error);
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        return { success: false, error: "Failed to create request" };
      }

      return {
        success: true,
        ticketReference: data[0].ticket_reference,
        requestId: data[0].request_id,
      };
    } catch (error) {
      console.error("Error in submitRequest:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  },

  /**
   * Get member's document verification requests
   */
  async getMemberRequests(): Promise<DocumentVerificationRequest[]> {
    try {
      const { data, error } = await supabase.rpc("get_member_document_verification_requests");

      if (error) {
        console.error("Error fetching member requests:", error);
        return [];
      }

      return (data || []).map((req: any) => ({
        requestId: req.request_id,
        ticketReference: req.ticket_reference,
        documentType: req.document_type,
        documentTypeOther: req.document_type_other,
        countryRelated: req.country_related,
        explanation: req.explanation,
        status: req.status,
        adminResponse: req.admin_response,
        createdAt: req.created_at,
        updatedAt: req.updated_at,
        reviewedAt: req.reviewed_at,
      }));
    } catch (error) {
      console.error("Error in getMemberRequests:", error);
      return [];
    }
  },

  /**
   * Get pending document verification requests (Admin)
   */
  async getPendingRequests(): Promise<AdminDocumentVerificationRequest[]> {
    try {
      const { data, error } = await supabase.rpc("get_pending_document_verification_requests");

      if (error) {
        console.error("Error fetching pending requests:", error);
        return [];
      }

      return (data || []).map((req: any) => ({
        requestId: req.request_id,
        memberId: req.member_id,
        memberEmail: req.member_email,
        memberFullName: req.member_full_name,
        membershipNumber: req.membership_number,
        ticketReference: req.ticket_reference,
        documentType: req.document_type,
        documentTypeOther: req.document_type_other,
        countryRelated: req.country_related,
        explanation: req.explanation,
        status: req.status,
        adminResponse: req.admin_response,
        internalNotes: req.internal_notes,
        reviewedBy: req.reviewed_by,
        reviewedByEmail: req.reviewed_by_email,
        reviewedAt: req.reviewed_at,
        createdAt: req.created_at,
        updatedAt: req.updated_at,
      }));
    } catch (error) {
      console.error("Error in getPendingRequests:", error);
      return [];
    }
  },

  /**
   * Update document verification status (Admin)
   */
  async updateStatus(
    requestId: string,
    newStatus: string,
    adminResponse?: string,
    internalNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("update_document_verification_status", {
        p_request_id: requestId,
        p_new_status: newStatus,
        p_admin_response: adminResponse || null,
        p_internal_notes: internalNotes || null,
      });

      if (error) {
        console.error("Error updating document verification status:", error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: "Update failed - insufficient permissions or invalid request" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error in updateStatus:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  },

  /**
   * Get document type display name
   */
  getDocumentTypeDisplay(type: string, other?: string): string {
    const types: Record<string, string> = {
      sponsorship_letter: "Sponsorship Letter",
      invitation_letter: "Invitation Letter",
      student_confirmation: "Student Confirmation",
      employment_offer: "Employment Offer",
      other: other || "Other Document",
    };
    return types[type] || type;
  },

  /**
   * Get status display name
   */
  getStatusDisplay(status: string): string {
    const statuses: Record<string, string> = {
      submitted: "Submitted",
      under_review: "Under Review",
      verified: "Verified",
      inconclusive: "Inconclusive",
      rejected: "Rejected",
    };
    return statuses[status] || status;
  },

  /**
   * Get status badge color
   */
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      submitted: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
      under_review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
      verified: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
      inconclusive: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
      rejected: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  },
};