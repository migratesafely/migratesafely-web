import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { agentPermissionsService } from "./agentPermissionsService";

type UserRole = Database["public"]["Enums"]["user_role"];

interface CreateAdminRequest {
  email: string;
  password: string;
  fullName: string;
  countryCode: string;
  roleToCreate: "manager_admin" | "worker_admin";
  createdBy: string;
}

interface CreateAdminResponse {
  success: boolean;
  admin?: {
    id: string;
    email: string;
    role: string;
    full_name: string;
    created_at: string;
  };
  error?: string;
  authUserCreated?: boolean;
}

export interface SuspendAdminRequest {
  adminId: string;
  reason: string;
  suspendedBy: string;
}

export interface SuspendAdminResponse {
  success: boolean;
  admin?: {
    id: string;
    email: string;
    role: string;
    full_name: string;
    created_at: string;
  };
  error?: string;
}

/**
 * Validates if the requester has permission to create the requested admin role
 */
export function canCreateRole(
  requesterRole: UserRole,
  roleToCreate: "manager_admin" | "worker_admin"
): boolean {
  // super_admin can create manager_admin AND worker_admin
  if (requesterRole === "super_admin") {
    return true;
  }

  // manager_admin can create worker_admin ONLY
  if (requesterRole === "manager_admin" && roleToCreate === "worker_admin") {
    return true;
  }

  // worker_admin cannot create any admins
  // member and agent cannot create admins
  return false;
}

/**
 * Checks if an email already exists in profiles
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("Error checking email existence:", error);
    return false;
  }

  return !!data;
}

/**
 * Creates an admin user profile and hierarchy record
 * NOTE: This creates the profile only. Auth user must be created via Supabase Dashboard
 * or service role API if available.
 */
export async function createAdminProfile(
  request: CreateAdminRequest
): Promise<CreateAdminResponse> {
  const { email, fullName, countryCode, roleToCreate, createdBy } = request;

  try {
    // Check if email already exists
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      return {
        success: false,
        error: "Email already exists in the system",
      };
    }

    // Prevent creating super_admin
    if (roleToCreate === "super_admin" as any) {
      return {
        success: false,
        error: "Cannot create super_admin via API",
      };
    }

    // NOTE: Creating auth user requires Supabase service role key
    // This is a security-sensitive operation and should be handled carefully
    // For now, we'll create the profile and return a note about manual auth setup
    
    // Generate a temporary ID for the profile
    // In production, this should be the actual auth user ID
    const tempAdminId = crypto.randomUUID();

    // Insert into profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: tempAdminId,
        email: email,
        full_name: fullName,
        country_code: countryCode,
        role: roleToCreate,
        created_by_admin_id: createdBy,
        created_at: new Date().toISOString(),
      })
      .select("id, email, role, full_name, created_at")
      .single();

    if (profileError) {
      console.error("Error creating admin profile:", profileError);
      return {
        success: false,
        error: `Failed to create profile: ${profileError.message}`,
      };
    }

    // Insert into admin_hierarchy table
    const { error: hierarchyError } = await supabase
      .from("admin_hierarchy")
      .insert({
        admin_id: profile.id,
        created_by: createdBy,
        created_at: new Date().toISOString(),
      });

    if (hierarchyError) {
      console.error("Error creating admin hierarchy record:", hierarchyError);
      // Don't fail the operation if hierarchy insert fails
      // Profile is already created
    }

    return {
      success: true,
      admin: {
        id: profile.id,
        email: profile.email,
        role: profile.role || roleToCreate,
        full_name: profile.full_name || fullName,
        created_at: profile.created_at || new Date().toISOString(),
      },
      authUserCreated: false,
    };
  } catch (error) {
    console.error("Unexpected error creating admin:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Creates an admin user with Supabase Auth (requires service role)
 * This function attempts to create the auth user and profile together
 */
export async function createAdminWithAuth(
  request: CreateAdminRequest,
  serviceRoleKey?: string
): Promise<CreateAdminResponse> {
  const { email, password, fullName, countryCode, roleToCreate, createdBy } = request;

  try {
    // Check if email already exists
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      return {
        success: false,
        error: "Email already exists in the system",
      };
    }

    // Prevent creating super_admin
    if (roleToCreate === "super_admin" as any) {
      return {
        success: false,
        error: "Cannot create super_admin via API",
      };
    }

    if (!serviceRoleKey) {
      // Fallback to profile-only creation
      return {
        success: false,
        error: "Service role key not available. Auth user must be created manually in Supabase Dashboard. Use createAdminProfile instead.",
      };
    }

    // Create Supabase client with service role
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError || !authData.user) {
      console.error("Error creating auth user:", authError);
      return {
        success: false,
        error: `Failed to create auth user: ${authError?.message || "Unknown error"}`,
      };
    }

    // Insert into profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: authData.user.id,
        email: email,
        full_name: fullName,
        country_code: countryCode,
        role: roleToCreate,
        created_by_admin_id: createdBy,
        created_at: new Date().toISOString(),
      })
      .select("id, email, role, full_name, created_at")
      .single();

    if (profileError) {
      console.error("Error creating admin profile:", profileError);
      // Auth user created but profile failed - should clean up auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return {
        success: false,
        error: `Failed to create profile: ${profileError.message}`,
      };
    }

    // Insert into admin_hierarchy table
    const { error: hierarchyError } = await supabase
      .from("admin_hierarchy")
      .insert({
        admin_id: profile.id,
        created_by: createdBy,
        created_at: new Date().toISOString(),
      });

    if (hierarchyError) {
      console.error("Error creating admin hierarchy record:", hierarchyError);
      // Don't fail the operation if hierarchy insert fails
    }

    return {
      success: true,
      admin: {
        id: profile.id,
        email: profile.email,
        role: profile.role || roleToCreate,
        full_name: profile.full_name || fullName,
        created_at: profile.created_at || new Date().toISOString(),
      },
      authUserCreated: true,
    };
  } catch (error) {
    console.error("Unexpected error creating admin with auth:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Creates an admin user with Supabase Auth (requires service role)
 * This function attempts to create the auth user and profile together
 */
export async function createAdmin({
  email,
  password,
  fullName,
  countryCode,
  roleToCreate,
  createdBy
}: CreateAdminRequest): Promise<CreateAdminResponse> {
  const isChairman = await agentPermissionsService.isChairman(createdBy);
  if (!isChairman) {
    return {
      success: false,
      error: "Forbidden: Chairman access required"
    };
  }

  // Validation
  if (!email || !password || !roleToCreate || !fullName) {
    return {
      success: false,
      error: "Invalid input: email, roleToCreate, and fullName are required"
    };
  }

  try {
    // Check if email already exists
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      return {
        success: false,
        error: "Email already exists in the system",
      };
    }

    // Prevent creating super_admin
    if (roleToCreate === "super_admin" as any) {
      return {
        success: false,
        error: "Cannot create super_admin via API",
      };
    }

    // Create Supabase client with service role
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError || !authData.user) {
      console.error("Error creating auth user:", authError);
      return {
        success: false,
        error: `Failed to create auth user: ${authError?.message || "Unknown error"}`,
      };
    }

    // Insert into profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: authData.user.id,
        email: email,
        full_name: fullName,
        country_code: countryCode,
        role: roleToCreate,
        created_by_admin_id: createdBy,
        created_at: new Date().toISOString(),
      })
      .select("id, email, role, full_name, created_at")
      .single();

    if (profileError) {
      console.error("Error creating admin profile:", profileError);
      // Auth user created but profile failed - should clean up auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return {
        success: false,
        error: `Failed to create profile: ${profileError.message}`,
      };
    }

    // Insert into admin_hierarchy table
    const { error: hierarchyError } = await supabase
      .from("admin_hierarchy")
      .insert({
        admin_id: profile.id,
        created_by: createdBy,
        created_at: new Date().toISOString(),
      });

    if (hierarchyError) {
      console.error("Error creating admin hierarchy record:", hierarchyError);
      // Don't fail the operation if hierarchy insert fails
    }

    return {
      success: true,
      admin: {
        id: profile.id,
        email: profile.email,
        role: profile.role || roleToCreate,
        full_name: profile.full_name || fullName,
        created_at: profile.created_at || new Date().toISOString(),
      },
      authUserCreated: true,
    };
  } catch (error) {
    console.error("Unexpected error creating admin with auth:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Suspends an admin user
 */
export async function suspendAdmin({
  adminId,
  reason,
  suspendedBy
}: SuspendAdminRequest): Promise<SuspendAdminResponse> {
  const isChairman = await agentPermissionsService.isChairman(suspendedBy);
  if (!isChairman) {
    return {
      success: false,
      error: "Forbidden: Chairman access required"
    };
  }

  // Validation
  if (!adminId || !reason) {
    return {
      success: false,
      error: "Invalid input: adminId and reason are required"
    };
  }

  try {
    // Update the profile to set the suspended status
    // Note: suspended columns must exist in profile table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .update({
        verification_notes: `SUSPENDED: ${reason}`
      })
      .eq("id", adminId)
      .select("id, email, role, full_name, created_at")
      .single();

    if (profileError) {
      console.error("Error suspending admin:", profileError);
      return {
        success: false,
        error: `Failed to suspend admin: ${profileError.message}`,
      };
    }

    return {
      success: true,
      admin: {
        id: profile.id,
        email: profile.email,
        role: profile.role || "suspended",
        full_name: profile.full_name || "Suspended User",
        created_at: profile.created_at || new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Unexpected error suspending admin:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function getAdminHierarchy(requesterId: string) {
  try {
    // Check if requester is Chairman
    const isChairman = await agentPermissionsService.isChairman(requesterId);
    if (!isChairman) {
      return {
        success: false,
        error: "Forbidden: Chairman access required",
        hierarchy: null
      };
    }
  } catch (error) {
    console.error("Unexpected error getting admin hierarchy:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      hierarchy: null
    };
  }
}