import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type JobListing = Database["public"]["Tables"]["job_listings"]["Row"];

export const jobListingsService = {
  /**
   * Get all open job listings (public access)
   */
  async getOpenJobListings(): Promise<JobListing[]> {
    const { data, error } = await supabase
      .from("job_listings")
      .select("*")
      .eq("status", "open")
      .eq("is_published", true)
      .is("archived_at", null)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Error fetching job listings:", error);
      throw error;
    }

    return data || [];
  },

  /**
   * Get single job listing by ID (public access if open)
   */
  async getJobListingById(id: string): Promise<JobListing | null> {
    const { data, error } = await supabase
      .from("job_listings")
      .select("*")
      .eq("id", id)
      .eq("status", "open")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("Error fetching job listing:", error);
      throw error;
    }

    return data;
  },

  /**
   * Admin: Get all job listings (including drafts and closed)
   */
  async getAllJobListings(): Promise<JobListing[]> {
    const { data, error } = await supabase
      .from("job_listings")
      .select("*")
      .is("archived_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching all job listings:", error);
      throw error;
    }

    return data || [];
  },

  /**
   * Admin: Get archived job listings only
   */
  async getArchivedJobListings(): Promise<JobListing[]> {
    const { data, error } = await supabase
      .from("job_listings")
      .select("*")
      .not("archived_at", "is", null)
      .order("archived_at", { ascending: false });

    if (error) {
      console.error("Error fetching archived job listings:", error);
      throw error;
    }

    return data || [];
  },

  /**
   * Admin: Create new job listing
   */
  async createJobListing(
    jobData: Database["public"]["Tables"]["job_listings"]["Insert"]
  ): Promise<JobListing> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      throw new Error("Not authenticated");
    }

    const { data, error } = await supabase
      .from("job_listings")
      .insert({
        ...jobData,
        created_by: user.data.user.id,
        updated_by: user.data.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating job listing:", error);
      throw error;
    }

    return data;
  },

  /**
   * Admin: Update job listing
   */
  async updateJobListing(
    id: string,
    updates: Database["public"]["Tables"]["job_listings"]["Update"]
  ): Promise<JobListing> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      throw new Error("Not authenticated");
    }

    const { data, error } = await supabase
      .from("job_listings")
      .update({
        ...updates,
        updated_by: user.data.user.id,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating job listing:", error);
      throw error;
    }

    return data;
  },

  /**
   * Admin: Delete job listing
   */
  async deleteJobListing(id: string): Promise<void> {
    const { error } = await supabase
      .from("job_listings")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting job listing:", error);
      throw error;
    }
  },

  /**
   * Admin: Publish job listing
   */
  async publishJobListing(id: string): Promise<JobListing> {
    return this.updateJobListing(id, {
      status: "open",
      published_at: new Date().toISOString(),
    });
  },

  /**
   * Admin: Close job listing
   */
  async closeJobListing(id: string): Promise<JobListing> {
    return this.updateJobListing(id, {
      status: "closed",
      closes_at: new Date().toISOString(),
    });
  },
};