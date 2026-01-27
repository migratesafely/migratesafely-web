# Domain Separation Rules

## Overview

The MigrateSafely platform uses strict domain separation to ensure security and proper access control between public users, members, agents, and administrators.

## Domains

### Main Domain: `migratesafely.com`
**Purpose:** Public website and member features

**Allowed Features:**
- ✅ Public pages (home, about, services, contact, FAQ)
- ✅ Member authentication (signup, login)
- ✅ Member dashboard and features
- ✅ Agent information pages (agent directory, apply to be agent)
- ✅ Community features (prize draws, scam reports, embassy directory)
- ✅ Agent dashboard (authenticated agents only)
- ✅ Member API endpoints
- ✅ Agent API endpoints (authenticated)

**Blocked Features:**
- ❌ Admin login page
- ❌ Admin dashboards
- ❌ Admin API endpoints
- ❌ Agent approval tools
- ❌ Agent assignment tools
- ❌ Audit logs
- ❌ System administration

**Security Enforcement:**
- All `/admin` routes return 404 or redirect to home
- All `/api/admin/*` endpoints return 403 Forbidden
- Admin cookies/sessions not accepted
- Cross-domain privilege escalation blocked

---

### Admin Domain: `bdeshagent.com`
**Purpose:** Administrative portal for system management

**Allowed Features:**
- ✅ Admin login page
- ✅ Admin dashboards (all levels)
- ✅ Agent approval and verification
- ✅ Agent assignment to members
- ✅ Member management
- ✅ Prize draw management
- ✅ Scam report verification
- ✅ Identity verification
- ✅ Compliance settings
- ✅ Audit logs and monitoring
- ✅ Admin API endpoints
- ✅ System administration

**Blocked Features:**
- ❌ Public pages
- ❌ Member signup/login
- ❌ Member dashboards
- ❌ Community features
- ❌ Agent information pages

**Security Enforcement:**
- All non-admin routes redirect to `/admin/login`
- Root path (`/`) redirects to `/admin/login`
- Admin-only authentication required
- Agents and members cannot access (role validation)
- All actions logged in audit trail

---

## Agent Dashboard

### Access Rules

**Path:** `/agents/dashboard`

**Access Method:** Authenticated route only (not domain-specific)

**Requirements:**
- User must be logged in
- User role must be `agent`
- Agent status must be `ACTIVE`
- Server-side validation on every request

**Domain Availability:**
- ✅ Available on `migratesafely.com` (if authenticated as agent)
- ✅ Available on `bdeshagent.com` (if authenticated as agent)
- ✅ Available on localhost (development)

**Blocked Access:**
- ❌ Pending agents (role: `agent_pending`) → Redirected to `/agents/pending`
- ❌ Suspended agents (role: `agent_suspended`) → Redirected to `/agents/suspended`
- ❌ Members (role: `member`) → Redirected to `/dashboard`
- ❌ Unauthenticated users → Redirected to `/login`

**Why Not Domain-Specific:**
- Agents may need to access dashboard from either domain
- Authentication is the primary security control
- Server-side role validation prevents unauthorized access
- Flexibility for agent workflows

---

## Cross-Domain Privilege Escalation Prevention

### Threat Model

**Attack Scenario 1: Member tries to access admin features**
```
User: Member (role: member)
Attempt: Navigate to bdeshagent.com/admin
Result: ❌ Blocked
Reason: Admin domain redirects non-admin routes to login
Server: Admin login checks role, rejects member
```

**Attack Scenario 2: Agent tries to access admin features from main domain**
```
User: Agent (role: agent)
Attempt: Navigate to migratesafely.com/admin
Result: ❌ Blocked
Reason: Main domain blocks all /admin routes
Redirect: → migratesafely.com/
```

**Attack Scenario 3: Agent tries to call admin API from main domain**
```
User: Agent (role: agent)
Attempt: POST migratesafely.com/api/admin/agent-approval/approve
Result: ❌ Blocked
Reason: Main domain blocks all /api/admin/* routes
Response: 403 Forbidden with domain error
```

**Attack Scenario 4: Member tries to access agent dashboard**
```
User: Member (role: member)
Attempt: Navigate to /agents/dashboard
Result: ❌ Blocked
Reason: Server-side role check in dashboard component
Redirect: → /dashboard (member dashboard)
```

**Attack Scenario 5: Suspended agent tries to access dashboard**
```
User: Agent (role: agent, status: SUSPENDED)
Attempt: Navigate to /agents/dashboard
Result: ❌ Blocked
Reason: Server-side agent status check
Redirect: → /agents/suspended
```

### Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Edge Middleware (src/middleware.ts)              │
│  - Domain-based route blocking                              │
│  - Fast rejection at edge                                   │
│  - Logs security violations                                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: API Middleware (src/lib/apiMiddleware.ts)        │
│  - Authentication token validation                          │
│  - Role-based access control                                │
│  - Permission checks                                        │
│  - Violation logging                                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Component-Level Guards                            │
│  - useEffect authentication checks                          │
│  - Role verification on mount                               │
│  - Redirect to appropriate dashboard                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: Database RLS Policies                             │
│  - Row-level security enforcement                           │
│  - User can only see their own data                         │
│  - Agents only see assigned members                         │
│  - Admins have elevated access                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Route Access Matrix

| Route Path | Main Domain | Admin Domain | Requires Auth | Allowed Roles |
|------------|-------------|--------------|---------------|---------------|
| `/` | ✅ Public | → /admin/login | No | All |
| `/about` | ✅ Public | ❌ Blocked | No | All |
| `/signup` | ✅ Member | ❌ Blocked | No | All |
| `/login` | ✅ Member | ❌ Blocked | No | All |
| `/dashboard` | ✅ Member | ❌ Blocked | Yes | Member |
| `/agents` | ✅ Public | ❌ Blocked | No | All |
| `/agents/apply` | ✅ Public | ❌ Blocked | No | All |
| `/agents/dashboard` | ✅ Agent | ✅ Agent | Yes | Agent (ACTIVE) |
| `/agents/pending` | ✅ Agent | ✅ Agent | Yes | Agent (PENDING) |
| `/agents/suspended` | ✅ Agent | ✅ Agent | Yes | Agent (SUSPENDED) |
| `/admin` | ❌ Blocked | ✅ Admin | Yes | Admin |
| `/admin/login` | ❌ Blocked | ✅ Public | No | All |
| `/admin/*` | ❌ Blocked | ✅ Admin | Yes | Admin |
| `/api/admin/*` | ❌ Blocked | ✅ Admin | Yes | Admin |
| `/api/agents/*` | ✅ Agent | ✅ Agent | Yes | Agent |
| `/api/messages/*` | ✅ Member | ❌ Blocked | Yes | Member/Agent |

---

## API Endpoint Access

### Public Endpoints (No Auth Required)
- `GET /api/hello`
- `GET /api/public/winners`
- `GET /api/embassies/list`
- `GET /api/scam-reports/list-verified`
- `GET /api/prize-draw/status`
- `GET /api/prize-draw/prizes`
- `GET /api/admin/compliance-settings` (GET only)

### Member Endpoints (Member Auth Required)
- `POST /api/messages/*`
- `POST /api/agent-requests/submit`
- `POST /api/identity/submit`
- `POST /api/hardship-request/submit`
- `POST /api/prize-draw/enter`
- `POST /api/scam-reports/submit`
- `GET /api/settings/*`

### Agent Endpoints (Agent Auth Required)
- `POST /api/agents/messages/send`
- `GET /api/agents/messages/conversations`
- `GET /api/agents/messages/thread`
- `POST /api/agents/update-case-notes`

### Admin Endpoints (Admin Auth Required)
- `POST /api/admin/agent-approval/*`
- `POST /api/admin/agent-requests/assign`
- `POST /api/admin/prize-draw/*`
- `POST /api/admin/identity/*`
- `POST /api/admin/people/*`
- `POST /api/admin/compliance-settings`
- `GET /api/admin/audit-logs/*`
- `GET /api/admin/admins/*`

---

## Enforcement Mechanisms

### 1. Edge Middleware
**File:** `src/middleware.ts`

**Functions:**
- Domain detection from host header
- Route type classification (public/member/agent/admin)
- Immediate blocking of unauthorized routes
- Redirect to appropriate pages
- Security logging

**Key Rules:**
```typescript
// Main domain - block admin routes
if (isMainDomain && isAdminRoute) {
  return redirect("/");
}

// Main domain - block admin APIs
if (isMainDomain && isAdminApiRoute) {
  return 403 Forbidden;
}

// Admin domain - redirect non-admin routes
if (isAdminDomain && !isAdminRoute) {
  return redirect("/admin/login");
}
```

### 2. API Middleware
**File:** `src/lib/apiMiddleware.ts`

**Functions:**
- `requireAuth()` - Basic authentication
- `requireAdminRole()` - Admin-only endpoints
- `requireAgentRole()` - Agent-only endpoints
- `requireAdminOrAgent()` - Shared endpoints
- Violation logging for unauthorized attempts

### 3. Permission Service
**File:** `src/services/agentPermissionsService.ts`

**Functions:**
- Granular permission checks
- Database-backed role verification
- Specific action authorization
- Detailed violation logging

### 4. Component Guards
**Implementation:** Each protected page component

**Pattern:**
```typescript
useEffect(() => {
  async function checkAccess() {
    const user = await authService.getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }
    
    const profile = await authService.getUserProfile(user.id);
    
    // Role-based redirect
    if (profile.role !== "expected_role") {
      router.push(authService.getDashboardPath(profile.role));
      return;
    }
    
    // Additional checks (e.g., agent status)
    if (profile.agent_status !== "ACTIVE") {
      router.push("/agents/pending");
      return;
    }
    
    // Load data
    loadData();
  }
  
  checkAccess();
}, []);
```

---

## Testing Scenarios

### Test 1: Cross-Domain Admin Access Attempt
```bash
# Setup: Login as member on main domain
# Attempt: Navigate to admin features
curl https://migratesafely.com/admin
# Expected: Redirect to /
# Result: ✅ Blocked

curl -H "Authorization: Bearer <member-token>" \
  https://migratesafely.com/api/admin/agent-approval/approve
# Expected: 403 Forbidden
# Result: ✅ Blocked
```

### Test 2: Admin Domain Member Access
```bash
# Attempt: Access member features on admin domain
curl https://bdeshagent.com/dashboard
# Expected: Redirect to /admin/login
# Result: ✅ Blocked

curl https://bdeshagent.com/signup
# Expected: Redirect to /admin/login
# Result: ✅ Blocked
```

### Test 3: Agent Dashboard Access
```bash
# Test: Approved agent from main domain
curl -H "Authorization: Bearer <agent-token>" \
  https://migratesafely.com/agents/dashboard
# Expected: 200 OK, dashboard loads
# Result: ✅ Allowed

# Test: Approved agent from admin domain
curl -H "Authorization: Bearer <agent-token>" \
  https://bdeshagent.com/agents/dashboard
# Expected: 200 OK, dashboard loads
# Result: ✅ Allowed

# Test: Member attempts agent dashboard
curl -H "Authorization: Bearer <member-token>" \
  https://migratesafely.com/agents/dashboard
# Expected: Redirect to /dashboard
# Result: ✅ Blocked
```

### Test 4: Privilege Escalation Prevention
```bash
# Test: Agent attempts admin approval
curl -X POST \
  -H "Authorization: Bearer <agent-token>" \
  https://bdeshagent.com/api/admin/agent-approval/approve
# Expected: 403 Forbidden, violation logged
# Result: ✅ Blocked

# Test: Member attempts agent API
curl -X POST \
  -H "Authorization: Bearer <member-token>" \
  https://migratesafely.com/api/agents/messages/send
# Expected: 403 Forbidden, violation logged
# Result: ✅ Blocked
```

---

## Monitoring & Auditing

### Audit Log Entries

**Cross-Domain Violation:**
```json
{
  "action": "CROSS_DOMAIN_ADMIN_ACCESS_ATTEMPT",
  "user_id": "member-uuid",
  "details": {
    "domain": "migratesafely.com",
    "attempted_route": "/admin",
    "user_role": "member",
    "timestamp": "2026-01-26T19:00:00Z"
  },
  "ip_address": "192.168.1.100"
}
```

**Privilege Escalation Attempt:**
```json
{
  "action": "PERMISSION_VIOLATION_ADMIN_API_ACCESS",
  "user_id": "agent-uuid",
  "details": {
    "endpoint": "/api/admin/agent-approval/approve",
    "method": "POST",
    "role": "agent",
    "reason": "Non-admin attempted to access admin API endpoint"
  },
  "ip_address": "192.168.1.101"
}
```

### Security Alerts

**Trigger Conditions:**
1. Multiple failed access attempts (>3 in 5 minutes)
2. Admin route access from main domain
3. Admin API calls without admin session
4. Token reuse across domains
5. Role mismatch on protected routes

**Response Actions:**
1. Log to audit trail
2. Alert security team (if configured)
3. Rate limit user requests
4. Temporary account lock (optional)
5. Require re-authentication

---

## Development vs Production

### Local Development
```typescript
const isLocalhost = domain === "localhost" || 
                    domain.startsWith("127.0.0.1") || 
                    domain.includes("daytona");

if (isLocalhost) {
  return NextResponse.next(); // Allow all routes for testing
}
```

**Behavior:**
- All routes accessible on localhost
- All domains accessible
- Easier testing and debugging
- Full feature access
- Security rules still apply at API/component level

### Production
**Strict Enforcement:**
- Domain separation fully active
- Cross-domain access blocked
- All violations logged
- Performance monitoring
- Security alerts enabled

---

## Configuration

### Environment Variables
```bash
# Domain configuration
NEXT_PUBLIC_MAIN_DOMAIN=migratesafely.com
NEXT_PUBLIC_ADMIN_DOMAIN=bdeshagent.com

# Security settings
ENABLE_DOMAIN_SEPARATION=true
LOG_SECURITY_VIOLATIONS=true
```

### Vercel Configuration
**File:** `vercel.json`

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

## Summary

### Domain Separation Benefits
1. **Clear Separation of Concerns** - Public vs admin features isolated
2. **Reduced Attack Surface** - Admin features not exposed on public domain
3. **Easier Security Auditing** - Clear boundaries to monitor
4. **Better Performance** - Less code loaded on public site
5. **Compliance Ready** - Audit trail for all admin actions

### Security Guarantees
1. ✅ **No admin access from main domain** - Enforced at edge
2. ✅ **No member features on admin domain** - Enforced at edge
3. ✅ **Agent dashboard secure** - Authenticated route only
4. ✅ **Cross-domain escalation blocked** - Multi-layer protection
5. ✅ **All violations logged** - Complete audit trail

### Key Takeaways
- **Main domain** = Public + Member + Agent info
- **Admin domain** = Admin features only
- **Agent dashboard** = Authenticated route (domain-agnostic)
- **Privilege escalation** = Blocked by multiple layers
- **All security events** = Logged to audit trail