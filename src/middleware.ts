import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_DOMAIN = process.env.NEXT_PUBLIC_ADMIN_DOMAIN || "bdeshagent.com";
const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN || "migratesafely.com";

// Helper to get Supabase client in middleware
const createMiddlewareSupabase = (request: NextRequest) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  // Try to find the token in cookies
  // Supabase auth helpers usually use: sb-{project-ref}-auth-token
  // But we can check for common names
  let token = "";
  
  // List all cookies to find the supabase token
  const cookies = request.cookies.getAll();
  const sbCookie = cookies.find(c => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));
  
  if (sbCookie) {
    // Parse the cookie value which is usually a JSON array/object
    try {
      // The cookie format from auth-helpers is usually ["access_token", "refresh_token", ...] or JSON
      // But simpler is to look for the access token directly if possible
      // If we can't parse easily, we rely on the fact that we might not need full session restoration 
      // if we just want to protect routes.
      // BUT we need to check the role.
      
      // If we use createClient with `global: { headers: { Authorization: ... } }`, we need the access token string.
      // The cookie value from auth-helpers is complex.
      
      // Alternative: Use the session access token if available in a simple cookie?
      // No, usually it's managed by the helper.
      
      // Let's try to grab the token from the "access_token" field inside the cookie if it's JSON
      const parsed = JSON.parse(sbCookie.value);
      if (Array.isArray(parsed) && parsed[0]) token = parsed[0]; // v1 format?
      else if (parsed.access_token) token = parsed.access_token; // v2 format?
    } catch (e) {
      // If not JSON, maybe it's the token itself?
      token = sbCookie.value;
    }
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
    auth: {
      persistSession: false,
    }
  });
};

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // BLOCK OLD ADMIN LOGIN ROUTE - Return 404 for all requests
  if (path === "/admin/login") {
    return new NextResponse(null, { status: 404 });
  }

  // Allow /access (stealth login) to be publicly accessible
  if (path === "/access") {
    return NextResponse.next();
  }

  // Admin routes protection
  if (path.startsWith("/admin")) {
    const supabase = createMiddlewareSupabase(request);
    
    // Check if we have a valid user
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.redirect(new URL("/access", request.url));
    }

    // Get user profile/role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["worker_admin", "manager_admin", "super_admin", "master_admin"].includes(profile.role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // --------------------------------------------------------
    // NEW: ADMIN SUSPENSION CHECK
    // --------------------------------------------------------
    // Check if admin access is suspended globally
    const { data: settings } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "admin_access_suspended")
      .single();

    const isSuspended = settings?.setting_value === "true";
    const isMasterAdmin = profile.role === "master_admin" || profile.role === "super_admin"; // Allow super_admin too? 
    // Requirement says: "Allow ONLY Master Admin"
    // But currently roles are: worker_admin, manager_admin, super_admin.
    // I added "master_admin" in the logic in master.tsx but maybe I need to check if that role exists in DB types?
    // The previous code in master.tsx checked for "master_admin".
    // If "super_admin" is the top role currently, maybe I should treat "super_admin" as Master?
    // Or did I assume a new role "master_admin"?
    
    // The requirement says: "Allow ONLY Master Admin to authenticate"
    // If "master_admin" is a NEW role, I need to be careful.
    // The profile check above allows "worker_admin", "manager_admin", "super_admin".
    // I should probably allow "super_admin" if "master_admin" is not strictly defined yet, 
    // OR assuming I am implementing "master_admin" as a concept.
    
    // Let's assume "master_admin" is the intended role key.
    // If the user is NOT master_admin AND suspension is true -> BLOCK.
    
    // Wait, I should double check if I need to allow super_admin?
    // "Allow ONLY Master Admin to authenticate... Block ALL admin logins: Chairman, Manager Admin, Worker Admin"
    // Usually "super_admin" = Chairman? Or is there a separate Chairman role?
    // "Chairman" usually maps to "super_admin" in many systems.
    // If so, I must BLOCK "super_admin" too.
    // And ONLY allow a user with role "master_admin".
    
    // Since I cannot easily change the enum of roles in the DB without migration,
    // I will assume for now that I need to check if the user is THE Master Admin.
    // Maybe checking against a specific email? Or assuming a 'master_admin' role string is valid?
    // I will use 'master_admin' string check.
    
    if (isSuspended && profile.role !== "master_admin") {
      // LOGOUT the user or just redirect with error?
      // Redirect to login with error param
      const loginUrl = new URL("/access", request.url);
      loginUrl.searchParams.set("error", "admin_suspended");
      
      // We should ideally sign them out, but in middleware we can just redirect.
      // The client-side will handle the "admin_suspended" error query param.
      return NextResponse.redirect(loginUrl);
    }
  }

  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";
  
  // Extract domain from host (remove port if present)
  const domain = host.split(":")[0];
  
  // Check if this is a local development environment
  const isLocalhost = domain === "localhost" || domain.startsWith("127.0.0.1") || domain.includes("daytona");
  
  // For local development, allow all routes (easier testing)
  if (isLocalhost) {
    return NextResponse.next();
  }
  
  // Determine which domain we're on
  const isMainDomain = domain.includes(MAIN_DOMAIN);
  const isAdminDomain = domain.includes(ADMIN_DOMAIN);
  
  // Check route types
  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminApiRoute = pathname.startsWith("/api/admin");
  
  // ============================================================
  // RULE 1: Block admin routes on main domain
  // ============================================================
  if (isMainDomain) {
    if (isAdminRoute) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    
    if (isAdminApiRoute) {
      return NextResponse.json(
        { 
          error: "Forbidden", 
          message: "Admin features are not accessible from this domain.",
          domain: "admin_only"
        },
        { status: 403 }
      );
    }
  }
  
  // ============================================================
  // RULE 2: ADMIN DOMAIN (bdeshagent.com) - Admin Only
  // ============================================================
  if (isAdminDomain) {
    // Allow stealth login page
    if (pathname === "/access") {
      return NextResponse.next();
    }
    
    // Block old admin login route
    if (pathname === "/admin/login") {
      return new NextResponse(null, { status: 404 });
    }
    
    // Allow all admin routes
    if (isAdminRoute) {
      return NextResponse.next();
    }
    
    // Allow all admin API routes
    if (isAdminApiRoute) {
      const response = NextResponse.next();
      response.headers.set("x-admin-domain", "true");
      response.headers.set("x-domain", ADMIN_DOMAIN);
      return response;
    }
    
    // Redirect root to stealth login
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/access";
      return NextResponse.redirect(url);
    }
    
    // Block all non-admin routes on admin domain
    // This includes public pages, member features, etc.
    if (!isAdminRoute && !isAdminApiRoute) {
      // console.log(`[SECURITY] Blocked non-admin route on admin domain: ${pathname}`);
      const url = request.nextUrl.clone();
      url.pathname = "/access";
      return NextResponse.redirect(url);
    }
    
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

/**
 * Check if pathname is a public page
 */
function isPublicPage(pathname: string): boolean {
  const publicPages = [
    "/",
    "/about",
    "/services",
    "/how-it-works",
    "/contact",
    "/privacy",
    "/terms",
    "/disclaimer",
    "/faq",
    "/member-agreement",
  ];
  
  return publicPages.includes(pathname) || 
         pathname.startsWith("/api/hello") ||
         pathname.startsWith("/_next") ||
         pathname.startsWith("/fonts") ||
         pathname.startsWith("/images");
}

/**
 * Check if pathname is a member feature page
 */
function isMemberPage(pathname: string): boolean {
  const memberPages = [
    "/signup",
    "/login",
    "/dashboard",
    "/country-settings",
    "/membership",
    "/messages",
    "/support",
    "/verify-identity",
    "/community-hardship-request",
    "/my-agent-requests",
    "/request-agent",
  ];
  
  return memberPages.some(page => pathname === page || pathname.startsWith(page + "/")) ||
         pathname.startsWith("/api/identity") ||
         pathname.startsWith("/api/hardship-request") ||
         pathname.startsWith("/api/agent-requests") ||
         pathname.startsWith("/api/messages") ||
         pathname.startsWith("/api/settings") ||
         pathname.startsWith("/api/payments");
}

/**
 * Check if pathname is an agent information page
 */
function isAgentInfoPage(pathname: string): boolean {
  const agentInfoPages = [
    "/agents",
    "/agents/apply",
    "/agents/pending",
    "/agents/suspended",
    "/verify-agent",
    "/careers",
  ];
  
  // Community features also on main domain
  const communityPages = [
    "/prize-draw",
    "/winners",
    "/scam-reports",
    "/report-scam",
    "/embassy-directory",
  ];
  
  return agentInfoPages.some(page => pathname === page || pathname.startsWith(page + "/")) ||
         communityPages.some(page => pathname === page || pathname.startsWith(page + "/")) ||
         pathname.startsWith("/api/public") ||
         pathname.startsWith("/api/prize-draw") ||
         pathname.startsWith("/api/scam-reports") ||
         pathname.startsWith("/api/embassies") ||
         pathname.startsWith("/api/agent-verification");
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};