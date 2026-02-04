import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { formatBangladeshTimestamp } from "@/lib/timezone";

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

const getURL = () => {
  let url = process?.env?.NEXT_PUBLIC_VERCEL_URL ?? 
           process?.env?.NEXT_PUBLIC_SITE_URL ?? 
           'http://localhost:3000'
  
  if (!url) {
    url = 'http://localhost:3000';
  }
  
  url = url.startsWith('http') ? url : `https://${url}`
  url = url.endsWith('/') ? url : `${url}/`
  
  return url
}

export const authService = {
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user ? {
      id: user.id,
      email: user.email || "",
      user_metadata: user.user_metadata,
      created_at: user.created_at
    } : null;
  },

  async getCurrentSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

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

  async signUp(email: string, password: string): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const timestamp = formatBangladeshTimestamp();
      console.log(`[${timestamp}] Sign up attempt for: ${email}`);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${getURL()}auth/confirm-email`
        }
      });

      if (error) {
        console.error(`[${formatBangladeshTimestamp()}] Sign up failed:`, error.message);
        return { user: null, error: { message: error.message, code: error.status?.toString() } };
      }

      const authUser = data.user ? {
        id: data.user.id,
        email: data.user.email || "",
        user_metadata: data.user.user_metadata,
        created_at: data.user.created_at
      } : null;

      console.log(`[${formatBangladeshTimestamp()}] Sign up successful for: ${email}`);
      return { user: authUser, error: null };
    } catch (error) {
      console.error(`[${formatBangladeshTimestamp()}] Sign up error:`, error);
      return { 
        user: null, 
        error: { message: "An unexpected error occurred during sign up" } 
      };
    }
  },

  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const timestamp = formatBangladeshTimestamp();
      console.log(`[${timestamp}] Sign in attempt for: ${email}`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error(`[${formatBangladeshTimestamp()}] Sign in failed:`, error.message);
        return { user: null, error: { message: error.message, code: error.status?.toString() } };
      }

      const authUser = data.user ? {
        id: data.user.id,
        email: data.user.email || "",
        user_metadata: data.user.user_metadata,
        created_at: data.user.created_at
      } : null;

      console.log(`[${formatBangladeshTimestamp()}] Sign in successful for: ${email}`);
      return { user: authUser, error: null };
    } catch (error) {
      console.error(`[${formatBangladeshTimestamp()}] Sign in error:`, error);
      return { 
        user: null, 
        error: { message: "An unexpected error occurred during sign in" } 
      };
    }
  },

  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      console.log(`[${formatBangladeshTimestamp()}] Sign out initiated`);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error(`[${formatBangladeshTimestamp()}] Sign out failed:`, error.message);
        return { error: { message: error.message } };
      }

      console.log(`[${formatBangladeshTimestamp()}] Sign out successful`);
      return { error: null };
    } catch (error) {
      console.error(`[${formatBangladeshTimestamp()}] Sign out error:`, error);
      return { 
        error: { message: "An unexpected error occurred during sign out" } 
      };
    }
  },

  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      console.log(`[${formatBangladeshTimestamp()}] Password reset requested for: ${email}`);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getURL()}auth/reset-password`,
      });

      if (error) {
        console.error(`[${formatBangladeshTimestamp()}] Password reset failed:`, error.message);
        return { error: { message: error.message } };
      }

      console.log(`[${formatBangladeshTimestamp()}] Password reset email sent to: ${email}`);
      return { error: null };
    } catch (error) {
      console.error(`[${formatBangladeshTimestamp()}] Password reset error:`, error);
      return { 
        error: { message: "An unexpected error occurred during password reset" } 
      };
    }
  },

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[${formatBangladeshTimestamp()}] Auth state change: ${event}`);
      callback(event, session);
    });
  },
};