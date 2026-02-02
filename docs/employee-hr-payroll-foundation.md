# Employee Records, HR Governance & Payroll Foundation (A4.1)

## System Overview

This document describes the Employee Management, HR Governance, and Payroll Foundation system for MigrateSafely internal staff (non-agent employees). This is a **FOUNDATION ONLY** implementation - attendance tracking, login-time enforcement, and full payroll execution are **OUT OF SCOPE** for this version.

**Status:** ✅ Production-Ready Foundation  
**Last Updated:** 2026-01-31  
**Version:** A4.1

---

## 1️⃣ EMPLOYEE MASTER RECORD SYSTEM

### Database Table: `employees`

**Complete Schema:**
```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  role_category TEXT NOT NULL CHECK (role_category IN (
    'chairman', 'managing_director', 'general_manager', 
    'department_head', 'staff', 'support_staff'
  )),
  department TEXT NOT NULL CHECK (department IN (
    'executive', 'hr', 'accounts', 'pr', 
    'member_relations', 'operations', 'support'
  )),
  employment_type TEXT NOT NULL CHECK (employment_type IN (
    'full_time', 'contract', 'support'
  )),
  start_date DATE NOT NULL,
  probation_end_date DATE,
  notice_period_days INTEGER DEFAULT 60,
  monthly_salary_gross NUMERIC(12,2) NOT NULL,
  salary_currency TEXT DEFAULT 'BDT',
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active', 'resigned', 'terminated', 'suspended'
  )),
  reports_to_employee_id UUID REFERENCES employees(id),
  created_by_admin_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Employee Categories

| Category | Role Title Examples | Department | Authority Level |
|----------|-------------------|------------|----------------|
| Chairman | Chairman | Executive | 5 (Highest) |
| Managing Director | Managing Director (MD) | Executive | 4 |
| General Manager | General Manager (GM) | Executive | 3 |
| Department Head | HR Manager, Accounts Manager | HR, Accounts, etc. | 2 |
| Staff | HR Officer, Accountant, PR Officer | Any | 1 |
| Support Staff | Guard, Cleaner | Support | 0 |

### Employee Number Format

**Format:** `EMP-BD-XXXXXX`

**Examples:**
- `EMP-BD-000001` - First employee (likely Chairman)
- `EMP-BD-000123` - Employee #123

**Generation:**
```typescript
// Automatic sequential numbering
const lastNumber = parseInt(lastEmployee.employee_number.split('-')[2]);
const newNumber = (lastNumber + 1).toString().padStart(6, '0');
const employeeNumber = `EMP-BD-${newNumber}`;
```

---

## 2️⃣ ROLE & APPROVAL HIERARCHY

### Hierarchical Structure

```
Chairman (Country Level)
    ↓
Managing Director (MD)
    ↓
General Manager (GM)
    ↓
Department Head
    ↓
Staff
    ↓
Support Staff
```

### Approval Authority Matrix

| Action Type | Chairman | MD | GM | Dept Head |
|-------------|----------|----|----|-----------|
| Hire Employee | ✅ | ✅ | ✅ | ⚠️ (within dept) |
| Salary Changes | ✅ | ✅ | ⚠️ (< 50k BDT) | ❌ |
| Payments > 50k BDT | ✅ | ❌ | ❌ | ❌ |
| Terminations | ✅ | ✅ | ❌ | ❌ |
| Eid Bonus Config | ✅ | ❌ | ❌ | ❌ |
| Emergency Closures | ✅ | ✅ | ❌ | ❌ |
| Appeal Reviews | ✅ | ✅ | ❌ | ❌ |

**Chairman Exclusive Actions:**
- Payments over 50,000 BDT
- Eid bonus configuration
- Final salary disbursements
- Emergency overrides
- System-wide policy changes

**Service Function:**
```typescript
import { checkApprovalAuthority } from "@/services/employeeManagementService";

const result = await checkApprovalAuthority(
  approverId: "uuid",
  actionType: "salary_change",
  amount: 75000
);

// Returns:
// {
//   success: true,
//   can_approve: false,
//   reason: "Amount exceeds MD approval threshold (50,000 BDT)",
//   requires: "Chairman"
// }
```

---

## 3️⃣ PAYROLL STRUCTURE (FOUNDATION ONLY)

### Database Tables

#### `employee_salaries`
Tracks all salary changes with approval trail.

```sql
CREATE TABLE employee_salaries (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  monthly_gross_salary NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'BDT',
  effective_from DATE NOT NULL,
  approved_by_admin_id UUID REFERENCES employees(id),
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `payroll_runs`
Foundation for future payroll execution (NOT ACTIVE YET).

```sql
CREATE TABLE payroll_runs (
  id UUID PRIMARY KEY,
  payroll_month DATE NOT NULL,
  status TEXT DEFAULT 'draft',
  total_gross_amount NUMERIC(15,2),
  total_deductions NUMERIC(15,2),
  total_net_amount NUMERIC(15,2),
  created_by_admin_id UUID REFERENCES employees(id),
  approved_by_admin_id UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `payroll_items`
Individual employee payroll entries (foundation).

```sql
CREATE TABLE payroll_items (
  id UUID PRIMARY KEY,
  payroll_run_id UUID REFERENCES payroll_runs(id),
  employee_id UUID REFERENCES employees(id),
  gross_salary NUMERIC(12,2) NOT NULL,
  deductions NUMERIC(12,2) DEFAULT 0,
  net_salary NUMERIC(12,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### One-Month Salary-in-Hand System

**Rule:** First month's salary is retained and deducted evenly over 6 months.

**Calculation Logic:**
```typescript
import { calculateSalaryInHandDeduction } from "@/services/payrollFoundationService";

// Month 1: Full retention
const month1 = calculateSalaryInHandDeduction(50000, 1);
// Returns:
// {
//   month: 1,
//   gross_salary: 50000,
//   retention_amount: 50000,
//   monthly_deduction: 0,
//   net_payable: 0,
//   note: "First month salary retained (salary-in-hand policy)"
// }

// Months 2-7: 1/6 deduction
const month2 = calculateSalaryInHandDeduction(50000, 2);
// Returns:
// {
//   month: 2,
//   gross_salary: 50000,
//   retention_amount: 0,
//   monthly_deduction: 8333.33,
//   net_payable: 41666.67,
//   note: "Month 2: Deducting 16.67% of first month salary"
// }

// Month 8+: No deduction
const month8 = calculateSalaryInHandDeduction(50000, 8);
// Returns:
// {
//   month: 8,
//   gross_salary: 50000,
//   retention_amount: 0,
//   monthly_deduction: 0,
//   net_payable: 50000,
//   note: "Regular salary payment (retention period complete)"
// }
```

**Applies To:** ALL employees including Chairman and MD.

---

## 4️⃣ LEAVE & HOLIDAY MANAGEMENT

### Annual Leave System

**Rules:**
- **15 days PAID leave per calendar year**
- Leave balance tracked per employee
- Unused leave does NOT auto-cash (future configurable)
- Leave requests require approval

**Database Table: `employee_leave_requests`**
```sql
CREATE TABLE employee_leave_requests (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  leave_type TEXT NOT NULL CHECK (leave_type IN (
    'annual', 'sick', 'emergency', 'unpaid'
  )),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected'
  )),
  approved_by_admin_id UUID REFERENCES employees(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Service Functions:**
```typescript
import { 
  requestLeave, 
  processLeaveRequest, 
  getLeaveBalance 
} from "@/services/leaveManagementService";

// Request leave
const result = await requestLeave(
  employeeId: "uuid",
  leaveType: "annual",
  startDate: "2026-03-01",
  endDate: "2026-03-05",
  reason: "Family vacation"
);

// Check balance
const balance = await getLeaveBalance(employeeId, "2026-01-31");
// Returns: { total_annual_days: 15, used_days: 3, available_days: 12 }

// Approve/reject
await processLeaveRequest(
  leaveId: "uuid",
  decision: "approved",
  approvedBy: "admin-uuid",
  notes: "Approved by manager"
);
```

**Leave Balance Calculation (RPC):**
```sql
-- Automatically calculates:
-- 1. Total annual entitlement (15 days)
-- 2. Used days (approved leaves)
-- 3. Remaining balance
SELECT * FROM calculate_leave_balance('employee-uuid', 2026);
```

### Eid Bonus Configuration

**Rules:**
- **2 Eid bonuses per year:**
  - Eid-ul-Fitr
  - Eid-ul-Adha
- **Bonus Amount:** 50% of net salary (excluding tax)
- **Configurable by:** Chairman ONLY
- **Stored per year for audit**

**Database Table: `holiday_bonus_config`**
```sql
CREATE TABLE holiday_bonus_config (
  id UUID PRIMARY KEY,
  year INTEGER NOT NULL,
  bonus_name TEXT NOT NULL CHECK (bonus_name IN (
    'eid-ul-fitr', 'eid-ul-adha'
  )),
  bonus_date DATE NOT NULL,
  bonus_percentage NUMERIC(5,2) DEFAULT 50.00,
  approved_by_admin_id UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Bonus Calculation:**
```typescript
import { calculateEidBonus } from "@/services/payrollFoundationService";

const bonus = calculateEidBonus(
  grossSalary: 50000,
  taxAmount: 2500,
  bonusPercentage: 50
);

// Returns:
// {
//   gross_salary: 50000,
//   tax_deducted: 2500,
//   net_salary: 47500,
//   bonus_percentage: 50,
//   bonus_amount: 23750
// }
```

**Configuration (Chairman Only):**
```typescript
import { configureEidBonus } from "@/services/leaveManagementService";

await configureEidBonus(
  year: 2026,
  eidType: "eid-ul-fitr",
  bonusDate: "2026-04-01",
  bonusPercentage: 50,
  configuredBy: "chairman-uuid"
);
```

### Emergency Closures

**Types:**
- Emergency closure
- Strike days
- Force majeure

**Rules:**
- **Declared by:** Chairman OR MD only
- **Effect:** Days do NOT count as absence or lateness
- **Audit:** Full trail maintained

**Database Table: `emergency_closures`**
```sql
CREATE TABLE emergency_closures (
  id UUID PRIMARY KEY,
  closure_date DATE NOT NULL,
  closure_type TEXT NOT NULL CHECK (closure_type IN (
    'emergency', 'strike', 'force_majeure'
  )),
  reason TEXT NOT NULL,
  declared_by_admin_id UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Service Function:**
```typescript
import { declareEmergencyClosure } from "@/services/leaveManagementService";

await declareEmergencyClosure(
  closureDate: "2026-02-15",
  closureType: "emergency",
  reason: "Severe weather conditions",
  declaredBy: "md-uuid"
);
```

---

## 5️⃣ RESIGNATION & NOTICE PERIODS

### Resignation Rules

- **Minimum notice period:** 30 days
- **Preferred notice period:** 60 days
- **Notice period stored per employee contract**
- **Early exit requires MD or Chairman approval**
- **Final settlement calculated automatically**

**Database Table: `employee_resignations`**
```sql
CREATE TABLE employee_resignations (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  resignation_date DATE NOT NULL,
  last_working_day DATE NOT NULL,
  notice_period_days INTEGER NOT NULL,
  reason TEXT,
  early_exit_approved BOOLEAN DEFAULT FALSE,
  approved_by_admin_id UUID REFERENCES employees(id),
  final_settlement_amount NUMERIC(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Service Function:**
```typescript
import { processResignation } from "@/services/employeeManagementService";

await processResignation(
  employeeId: "uuid",
  resignationDate: "2026-02-01",
  lastWorkingDate: "2026-03-31", // 60 days notice
  reason: "Career advancement",
  processedBy: "manager-uuid"
);

// Automatically:
// 1. Creates resignation record
// 2. Updates employee status to 'resigned'
// 3. Logs audit trail
```

---

## 6️⃣ TERMINATION & FIRING GOVERNANCE

### Termination Types

| Type | Description | Redundancy Pay | Chairman Approval Required |
|------|-------------|----------------|----------------------------|
| **Resignation** | Voluntary exit | ✅ (Final settlement) | ❌ |
| **Redundancy** | Position eliminated | ✅ | ✅ |
| **Negligence** | Poor performance | ❌ | ✅ |
| **Fraud** | Financial misconduct | ❌ | ✅ (Mandatory) |
| **Misconduct** | Policy violations | ❌ | ✅ |
| **AWOL** | Abandonment (future-linked) | ❌ | ✅ |

### Termination Rules

**ALL terminations require:**
- MD approval OR
- Chairman approval

**Immediate termination allowed for:**
- Fraud
- Gross misconduct
- Rule violations

**NO redundancy pay for:**
- Negligence
- Fraud
- Policy breach
- Misconduct

**Database Table: `employee_terminations`**
```sql
CREATE TABLE employee_terminations (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  termination_type TEXT NOT NULL CHECK (termination_type IN (
    'redundancy', 'negligence', 'fraud', 'misconduct', 'awol'
  )),
  termination_date DATE NOT NULL,
  effective_date DATE NOT NULL,
  reason TEXT NOT NULL,
  approved_by_admin_id UUID REFERENCES employees(id),
  requires_immediate_effect BOOLEAN DEFAULT FALSE,
  eligible_for_redundancy_pay BOOLEAN DEFAULT FALSE,
  final_settlement_amount NUMERIC(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Service Function:**
```typescript
import { processTermination } from "@/services/employeeManagementService";

await processTermination(
  employeeId: "uuid",
  terminationType: "misconduct",
  terminationDate: "2026-02-15",
  reason: "Repeated policy violations",
  approvedBy: "chairman-uuid",
  immediateTermination: true
);

// Validates:
// 1. Approver is Chairman or MD
// 2. Creates termination record
// 3. Updates employee status to 'terminated'
// 4. Sets redundancy pay eligibility
// 5. Logs audit trail
```

### Appeal Process

**Rules:**
- Terminated employee may submit **ONE appeal**
- Appeal reviewed by MD or Chairman
- Decision is **FINAL**
- No second appeals allowed

**Database Table: `termination_appeals`**
```sql
CREATE TABLE termination_appeals (
  id UUID PRIMARY KEY,
  termination_id UUID REFERENCES employee_terminations(id),
  employee_id UUID REFERENCES employees(id),
  appeal_reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected'
  )),
  reviewed_by_admin_id UUID REFERENCES employees(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  decision TEXT,
  decision_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Service Functions:**
```typescript
import { 
  submitTerminationAppeal, 
  processAppealDecision 
} from "@/services/employeeManagementService";

// Employee submits appeal
await submitTerminationAppeal(
  terminationId: "uuid",
  appealReason: "Unfair termination process",
  employeeId: "uuid"
);

// Chairman/MD reviews appeal
await processAppealDecision(
  appealId: "uuid",
  decision: "approved",
  reviewedBy: "chairman-uuid",
  reviewNotes: "Appeal valid - reinstate employee"
);

// If approved: Employee status automatically changes to 'active'
// If rejected: Status remains 'terminated'
```

---

## 7️⃣ EMPLOYEE CONTRACT GENERATION

### Contract Structure

**Standard Contract Includes:**
- Employee details (name, employee number, role)
- Department and reporting structure
- Salary and payment terms
- Notice period requirements
- Leave entitlement (15 days annually)
- Eid bonus eligibility (2 per year at 50% net salary)
- Termination conditions
- Appeal rights
- No redundancy clause for misconduct/fraud
- Signature sections

**Database Table: `employee_contracts`**
```sql
CREATE TABLE employee_contracts (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  contract_type TEXT NOT NULL CHECK (contract_type IN (
    'full_time_permanent', 'contract_fixed_term', 
    'probation', 'support_staff'
  )),
  start_date DATE NOT NULL,
  end_date DATE,
  salary_terms TEXT NOT NULL,
  notice_period_days INTEGER NOT NULL,
  leave_entitlement_days INTEGER DEFAULT 15,
  bonus_eligible BOOLEAN DEFAULT TRUE,
  termination_conditions TEXT,
  contract_document_url TEXT,
  signed_by_employee BOOLEAN DEFAULT FALSE,
  signed_by_admin BOOLEAN DEFAULT FALSE,
  signed_at TIMESTAMP WITH TIME ZONE,
  version INTEGER DEFAULT 1,
  superseded_by_contract_id UUID REFERENCES employee_contracts(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Contract Versioning

**Rules:**
- Contracts are **immutable once signed**
- Updates create **new version**
- Previous version linked via `superseded_by_contract_id`
- Full audit trail maintained

**Example Flow:**
```typescript
// Version 1: Initial contract
Contract v1:
- start_date: 2026-01-01
- salary: 50,000 BDT
- notice_period: 60 days
- signed: true
- superseded_by: null

// Salary increase creates Version 2
Contract v2:
- start_date: 2026-01-01
- salary: 60,000 BDT
- notice_period: 60 days
- signed: true
- superseded_by: null

// Version 1 updated:
Contract v1:
- superseded_by: [v2_contract_id]
```

---

## 8️⃣ AUDIT & COMPLIANCE

### Audit Log Requirements

**All actions must be logged:**
- Hiring
- Salary changes
- Bonus configuration
- Leave approvals
- Terminations
- Appeals
- Payroll approvals
- Contract generation/updates

**Integration with Existing System:**
```typescript
// Automatic audit logging in all service functions
await supabase.from("audit_logs").insert({
  action: "employee_created",
  target_type: "employee",
  target_id: employee.id,
  performed_by: adminId,
  details: {
    employee_number: "EMP-BD-000123",
    full_name: "John Doe",
    role_title: "HR Officer",
    department: "hr"
  }
});
```

### Audit Log Examples

**Employee Creation:**
```json
{
  "action": "employee_created",
  "target_type": "employee",
  "target_id": "uuid",
  "performed_by": "admin-uuid",
  "details": {
    "employee_number": "EMP-BD-000123",
    "full_name": "Ahmed Khan",
    "role_title": "Accountant",
    "department": "accounts"
  }
}
```

**Salary Change:**
```json
{
  "action": "employee_salary_updated",
  "target_type": "employee",
  "target_id": "uuid",
  "performed_by": "chairman-uuid",
  "details": {
    "new_salary": 60000,
    "effective_from": "2026-03-01",
    "reason": "Annual increment"
  }
}
```

**Termination:**
```json
{
  "action": "employee_terminated",
  "target_type": "employee",
  "target_id": "uuid",
  "performed_by": "chairman-uuid",
  "details": {
    "termination_type": "misconduct",
    "termination_date": "2026-02-15",
    "immediate": true,
    "reason": "Policy violation"
  }
}
```

---

## 📁 SERVICE LAYER FILES

### Created Services

1. **`src/services/employeeManagementService.ts`** (646 lines)
   - Create employee
   - Get employee(s)
   - Update employee
   - Update salary
   - Process resignation
   - Process termination
   - Submit/process appeals
   - Get employee hierarchy
   - Check approval authority

2. **`src/services/leaveManagementService.ts`** (404 lines)
   - Request leave
   - Process leave request
   - Get leave balance
   - Get employee leaves
   - Configure Eid bonus
   - Get Eid bonus config
   - Declare emergency closure
   - Get emergency closures

3. **`src/services/payrollFoundationService.ts`** (250 lines)
   - Calculate net salary
   - Calculate salary-in-hand deduction
   - Get employee salary history
   - Get current salary
   - Calculate Eid bonus
   - Preview employee payroll
   - Get payroll runs (foundation)

---

## 🔒 SECURITY & COMPLIANCE

### RLS Policies

**All tables have appropriate RLS policies:**
- Employees: Admin-only access
- Leave requests: Employee can view own, admin can view all
- Salary records: Admin-only access
- Terminations: Admin-only access
- Appeals: Employee can submit, admin can review
- Contracts: Employee can view own, admin can manage

### Data Protection

- **Salary information:** Encrypted at rest, admin-only access
- **Termination records:** Permanent audit trail, immutable
- **Personal data:** GDPR-compliant storage and access controls
- **Audit logs:** Tamper-proof, permanent retention

---

## ✅ SCOPE CONFIRMATION

### ✅ IN SCOPE (Implemented)

- Employee master records system
- Role & approval hierarchy
- Payroll foundation tables (no execution)
- Leave & holiday management
- Eid bonus configuration
- Notice period & resignation logic
- Termination & appeal governance
- Employee contract system
- Audit logging

### ❌ OUT OF SCOPE (Not Implemented)

- Attendance tracking
- Lateness detection
- Login-time enforcement
- Biometric integration
- Shift management
- Payroll execution (automated disbursement)
- Tax calculation (placeholder only)
- Provident fund management
- Performance review system
- Training management

---

## 🎯 NEXT STEPS (Future Enhancements)

**Phase 2 (Not Required Now):**
- Attendance tracking system
- Biometric device integration
- Automated lateness penalties
- Login/logout time enforcement
- Shift scheduling

**Phase 3 (Not Required Now):**
- Full payroll execution
- Bank payment integration
- Tax compliance automation
- Provident fund calculation
- Performance management

---

## 📊 TECHNICAL SUMMARY

**Database Tables Created:** 12
- `employees`
- `employee_salaries`
- `employee_leave_requests`
- `employee_resignations`
- `employee_terminations`
- `termination_appeals`
- `employee_contracts`
- `holiday_bonus_config`
- `emergency_closures`
- `payroll_runs` (foundation)
- `payroll_items` (foundation)
- `payroll_approvals` (foundation)

**RPC Functions Created:** 2
- `calculate_leave_balance(p_employee_id, p_year)`
- `get_employee_hierarchy(p_employee_id)`

**Service Files Created:** 3
- `employeeManagementService.ts` (646 lines)
- `leaveManagementService.ts` (404 lines)
- `payrollFoundationService.ts` (250 lines)

**Total Lines of Code:** ~1,300 lines (services only)

---

**System Status:** ✅ PRODUCTION-READY FOUNDATION  
**Last Verified:** 2026-01-31  
**Document Version:** 1.0