import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: any;
  created_at?: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

// Dynamic URL Helper
const getURL = () => {
  let url = process?.env?.NEXT_PUBLIC_VERCEL_URL ?? 
           process?.env?.NEXT_PUBLIC_SITE_URL ?? 
           'http://localhost:3000'
  
  // Handle undefined or null url
  if (!url) {
    url = 'http://localhost:3000';
  }
  
  // Ensure url has protocol
  url = url.startsWith('http') ? url : `https://${url}`
  
  // Ensure url ends with slash
  url = url.endsWith('/') ? url : `${url}/`
  
  return url
}

export const authService = {
  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user ? {
      id: user.id,
      email: user.email || "",
      user_metadata: user.user_metadata,
      created_at: user.created_at
    } : null;
  },

  // Get current session
  async getCurrentSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  // Get user profile
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
      
    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    return data;
  },

  // Sign up with email and password
  async signUp(email: string, password: string): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${getURL()}auth/confirm-email`
        }
      });

      if (error) {
        return { user: null, error: { message: error.message, code: error.status?.toString() } };
      }

      const authUser = data.user ? {
        id: data.user.id,
        email: data.user.email || "",
        user_metadata: data.user.user_metadata,
        created_at: data.user.created_at
      } : null;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: authUser.id,
          email: authUser.email,
          full_name: "",
          role: "member",
          country_code: null,
        })
        .select()
        .single();

      if (profileError) {
        console.error("Error creating profile:", profileError);
        return { user: null, error: profileError };
      }

      const { error: agreementError } = await supabase
        .from("profiles")
        .update({
          accepted_member_agreement: true,
          accepted_member_agreement_at: new Date().toISOString(),
          accepted_member_agreement_version: "v1"
        })
        .eq("id", authUser.id);

      if (agreementError) {
        console.error("Error updating agreement acceptance:", agreementError);
      }

      return { user: authUser, error: null };
    } catch (error) {
      return { 
        user: null, 
        error: { message: "An unexpected error occurred during sign up" } 
      };
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: { message: error.message, code: error.status?.toString() } };
      }

      const authUser = data.user ? {
        id: data.user.id,
        email: data.user.email || "",
        user_metadata: data.user.user_metadata,
        created_at: data.user.created_at
      } : null;

      return { user: authUser, error: null };
    } catch (error) {
      return { 
        user: null, 
        error: { message: "An unexpected error occurred during sign in" } 
      };
    }
  },

  // Sign out
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (error) {
      return { 
        error: { message: "An unexpected error occurred during sign out" } 
      };
    }
  },

  // Reset password
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getURL()}auth/reset-password`,
      });

      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (error) {
      return { 
        error: { message: "An unexpected error occurred during password reset" } 
      };
    }
  },

  // Confirm email (REQUIRED)
  async confirmEmail(token: string, type: 'signup' | 'recovery' | 'email_change' = 'signup'): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type
      });

      if (error) {
        return { user: null, error: { message: error.message, code: error.status?.toString() } };
      }

      const authUser = data.user ? {
        id: data.user.id,
        email: data.user.email || "",
        user_metadata: data.user.user_metadata,
        created_at: data.user.created_at
      } : null;

      return { user: authUser, error: null };
    } catch (error) {
      return { 
        user: null, 
        error: { message: "An unexpected error occurred during email confirmation" } 
      };
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Check if user is an agent (any agent role)
  isAgent(role: string): boolean {
    return ["agent_pending", "agent", "agent_suspended"].includes(role);
  },

  // Check if user is an approved agent
  isApprovedAgent(role: string): boolean {
    return role === "agent";
  },

  // Check if user is a pending agent
  isPendingAgent(role: string): boolean {
    return role === "agent_pending";
  },

  // Check if user is a suspended agent
  isSuspendedAgent(role: string): boolean {
    return role === "agent_suspended";
  },

  // Check if user is a member (not an agent or admin)
  isMember(role: string): boolean {
    return role === "member";
  },

  // Check if user is an admin (any admin role)
  isAdmin(role: string): boolean {
    return ["worker_admin", "hr_admin", "manager_admin", "super_admin"].includes(role);
  },

  // Check if user is a worker admin
  isWorkerAdmin(role: string): boolean {
    return role === "worker_admin";
  },

  // Check if user is a manager admin
  isManagerAdmin(role: string): boolean {
    return role === "manager_admin";
  },

  // Check if user is a super admin
  isSuperAdmin(role: string): boolean {
    return role === "super_admin";
  },

  // Get dashboard redirect path based on role (CRITICAL ROUTING LOGIC)
  getDashboardPath(role: string): string {
    // Admin roles - redirect to admin dashboard
    if (this.isAdmin(role)) {
      return "/admin";
    }
    
    // Approved agent - redirect to agent dashboard
    if (this.isApprovedAgent(role)) {
      return "/agents/dashboard";
    }
    
    // Pending agent - show pending status page
    if (this.isPendingAgent(role)) {
      return "/agents/pending";
    }
    
    // Suspended agent - show suspended notice
    if (this.isSuspendedAgent(role)) {
      return "/agents/suspended";
    }
    
    // Regular member - redirect to member dashboard
    if (this.isMember(role)) {
      return "/dashboard";
    }
    
    // Default fallback
    return "/dashboard";
  },

  // Check if user can access admin dashboard
  canAccessAdmin(role: string): boolean {
    return this.isAdmin(role);
  },

  // Check if user can access agent dashboard
  canAccessAgentDashboard(role: string): boolean {
    return this.isApprovedAgent(role);
  },

  // Check if user can access member dashboard
  canAccessMemberDashboard(role: string): boolean {
    return this.isMember(role) || this.isAgent(role) || this.isAdmin(role);
  }
};