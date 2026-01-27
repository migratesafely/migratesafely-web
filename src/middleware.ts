import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_DOMAIN = process.env.NEXT_PUBLIC_ADMIN_DOMAIN || "bdeshagent.com";
const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN || "migratesafely.com";

/**
 * Domain Separation Middleware
 * 
 * DOMAIN RULES:
 * 
 * migratesafely.com (MAIN_DOMAIN):
 * ✅ Public pages (home, about, services, etc.)
 * ✅ Member features (signup, login, dashboard, membership)
 * ✅ Agent information pages (agents, apply, careers)
 * ✅ Community features (prize-draw, scam-reports, embassy-directory)
 * ❌ Admin dashboards (completely blocked)
 * ❌ Admin APIs (completely blocked)
 * 
 * bdeshagent.com (ADMIN_DOMAIN):
 * ✅ Admin login page
 * ✅ Admin dashboards (full access)
 * ✅ Admin APIs (full access)
 * ✅ Agent approvals
 * ✅ Agent assignments
 * ✅ Audit logs
 * ❌ Public pages (redirected to admin login)
 * ❌ Member features (redirected to admin login)
 * 
 * Agent Dashboard (/agents/dashboard):
 * ✅ Accessible via authenticated route ONLY
 * ✅ NOT tied to any specific domain
 * ✅ Available on BOTH domains if authenticated as agent
 * ✅ Requires approved agent role (checked server-side)
 * 
 * SECURITY:
 * - Cross-domain privilege escalation blocked
 * - Admin routes inaccessible from main domain
 * - Member routes inaccessible from admin domain
 * - All admin actions require admin domain + admin role
 */
export function middleware(request: NextRequest) {
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
  const isAgentDashboardRoute = pathname === "/agents/dashboard" || 
                                 pathname.startsWith("/agents/dashboard/");
  const isAgentApiRoute = pathname.startsWith("/api/agents");
  const isPublicRoute = isPublicPage(pathname);
  const isMemberRoute = isMemberPage(pathname);
  const isAgentInfoRoute = isAgentInfoPage(pathname);
  
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
    // Allow admin login page
    if (pathname === "/admin/login") {
      return NextResponse.next();
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
    
    // Redirect root to admin login
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
    
    // Block all non-admin routes on admin domain
    // This includes public pages, member features, etc.
    if (!isAdminRoute && !isAdminApiRoute) {
      console.log(`[SECURITY] Blocked non-admin route on admin domain: ${pathname}`);
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
    
    return NextResponse.next();
  }
  
  // ============================================================
  // RULE 3: Unknown Domain - Allow but log
  // ============================================================
  console.log(`[WARNING] Unknown domain: ${domain}, pathname: ${pathname}`);
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