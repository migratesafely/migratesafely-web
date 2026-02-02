-- ============================================================================
-- PROMPT A2.1 — PAYROLL & HR FINANCIAL CORE (ACCOUNTING FIRST)
-- COMPLETION: Add missing components to existing payroll infrastructure
-- SCOPE: Backend + Database ONLY | NO UI | ADDITIVE ONLY | Bangladesh (BDT)
-- ============================================================================

-- ============================================================================
-- 1. ENHANCE PAYROLL_RUNS TABLE WITH APPROVAL WORKFLOW
-- ============================================================================

-- Add MD and Chairman approval tracking columns (if not already present)
DO $$
BEGIN
    -- Add MD approval columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payroll_runs' AND column_name = 'md_approved') THEN
        ALTER TABLE payroll_runs 
        ADD COLUMN md_approved BOOLEAN DEFAULT false,
        ADD COLUMN md_approved_by UUID REFERENCES employees(id),
        ADD COLUMN md_approved_at TIMESTAMPTZ;
    END IF;

    -- Add Chairman approval columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payroll_runs' AND column_name = 'chairman_approved') THEN
        ALTER TABLE payroll_runs 
        ADD COLUMN chairman_approved BOOLEAN DEFAULT false,
        ADD COLUMN chairman_approved_by UUID REFERENCES employees(id),
        ADD COLUMN chairman_approved_at TIMESTAMPTZ,
        ADD COLUMN chairman_approval_required BOOLEAN DEFAULT false;
    END IF;

    -- Add journal entry tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payroll_runs' AND column_name = 'journal_entry_id') THEN
        ALTER TABLE payroll_runs 
        ADD COLUMN journal_entry_id UUID,
        ADD COLUMN posted_to_ledger BOOLEAN DEFAULT false,
        ADD COLUMN posted_to_ledger_at TIMESTAMPTZ;
    END IF;

    -- Add period tracking for integration with monthly close
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payroll_runs' AND column_name = 'period_year') THEN
        ALTER TABLE payroll_runs 
        ADD COLUMN period_year INTEGER,
        ADD COLUMN period_month INTEGER CHECK (period_month BETWEEN 1 AND 12);
    END IF;
END $$;

-- Update payroll_run_status enum to include 'finalized' status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'finalized' 
        AND enumtypid = 'payroll_run_status'::regtype
    ) THEN
        ALTER TYPE payroll_run_status ADD VALUE 'finalized';
    END IF;
END $$;

COMMENT ON COLUMN payroll_runs.chairman_approval_required IS 
'PROMPT A2.1: TRUE if total_gross > 50,000 BDT. Chairman approval is MANDATORY.';

COMMENT ON COLUMN payroll_runs.journal_entry_id IS 
'PROMPT A2.1: Links to general_ledger journal entry. Created when payroll is finalized.';

-- ============================================================================
-- 2. CHAIRMAN APPROVAL THRESHOLD TRIGGER (>50,000 BDT)
-- ============================================================================

CREATE OR REPLACE FUNCTION enforce_payroll_chairman_threshold()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark payroll runs > 50,000 BDT as requiring Chairman approval
    IF NEW.total_gross > 50000 THEN
        NEW.chairman_approval_required := true;
    ELSE
        NEW.chairman_approval_required := false;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_payroll_chairman_threshold_trigger ON payroll_runs;
CREATE TRIGGER enforce_payroll_chairman_threshold_trigger
BEFORE INSERT OR UPDATE OF total_gross ON payroll_runs
FOR EACH ROW EXECUTE FUNCTION enforce_payroll_chairman_threshold();

COMMENT ON FUNCTION enforce_payroll_chairman_threshold() IS 
'PROMPT A2.1: Auto-flags payroll runs > 50,000 BDT as requiring Chairman approval';

-- ============================================================================
-- 3. PAYROLL APPROVAL VALIDATION TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_payroll_approval_chain()
RETURNS TRIGGER AS $$
DECLARE
    v_approver_role TEXT;
BEGIN
    -- Get approver's role category
    SELECT role_category INTO v_approver_role
    FROM employees
    WHERE user_id = auth.uid();

    -- Validate MD approval
    IF NEW.status = 'approved' AND OLD.status = 'pending_approval' THEN
        IF v_approver_role != 'managing_director' THEN
            RAISE EXCEPTION 'Only Managing Director can approve payroll runs';
        END IF;
        
        NEW.md_approved := true;
        NEW.md_approved_by := (SELECT id FROM employees WHERE user_id = auth.uid());
        NEW.md_approved_at := NOW();
    END IF;

    -- Validate Chairman approval (MANDATORY if > 50,000 BDT)
    IF NEW.status = 'finalized' AND OLD.status = 'approved' THEN
        -- Check if Chairman approval is required but not provided
        IF NEW.chairman_approval_required = true AND NEW.chairman_approved != true THEN
            RAISE EXCEPTION 'Payroll run > 50,000 BDT requires Chairman approval before finalization';
        END IF;

        -- Validate Chairman role if approval is provided
        IF NEW.chairman_approved = true THEN
            IF v_approver_role != 'chairman' THEN
                RAISE EXCEPTION 'Only Chairman can give final approval for payroll runs';
            END IF;
            
            NEW.chairman_approved_by := (SELECT id FROM employees WHERE user_id = auth.uid());
            NEW.chairman_approved_at := NOW();
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_payroll_approval_trigger ON payroll_runs;
CREATE TRIGGER validate_payroll_approval_trigger
BEFORE UPDATE OF status, chairman_approved ON payroll_runs
FOR EACH ROW EXECUTE FUNCTION validate_payroll_approval_chain();

COMMENT ON FUNCTION validate_payroll_approval_chain() IS 
'PROMPT A2.1: Enforces approval chain: MD → Chairman (if > 50k BDT) → Finalize';

-- ============================================================================
-- 4. AUTOMATIC JOURNAL ENTRY GENERATION ON FINALIZATION
-- ============================================================================

CREATE OR REPLACE FUNCTION post_payroll_to_ledger()
RETURNS TRIGGER AS $$
DECLARE
    v_journal_id UUID;
    v_entry_date DATE;
BEGIN
    -- Only execute when status changes to 'finalized'
    IF NEW.status = 'finalized' AND OLD.status != 'finalized' AND NEW.posted_to_ledger = false THEN
        
        -- Generate unique journal entry ID
        v_journal_id := gen_random_uuid();
        v_entry_date := NEW.payment_date;

        -- DEBIT: Salary Expense (5040)
        INSERT INTO general_ledger (
            entry_date,
            transaction_id,
            transaction_type,
            account_code,
            debit_amount,
            credit_amount,
            currency,
            description,
            reference_number,
            created_by
        ) VALUES (
            v_entry_date,
            v_journal_id,
            'payroll_expense',
            '5040', -- Salaries and Wages
            NEW.total_gross,
            0,
            'BDT',
            'Payroll expense - ' || NEW.run_number || ' (' || 
            TO_CHAR(NEW.pay_period_start, 'YYYY-MM-DD') || ' to ' || 
            TO_CHAR(NEW.pay_period_end, 'YYYY-MM-DD') || ')',
            NEW.run_number,
            auth.uid()
        );

        -- CREDIT: Payroll Payable (2040)
        INSERT INTO general_ledger (
            entry_date,
            transaction_id,
            transaction_type,
            account_code,
            debit_amount,
            credit_amount,
            currency,
            description,
            reference_number,
            created_by
        ) VALUES (
            v_entry_date,
            v_journal_id,
            'payroll_liability',
            '2040', -- Payroll Payable
            0,
            NEW.total_gross,
            'BDT',
            'Payroll liability - ' || NEW.run_number || ' (' || 
            TO_CHAR(NEW.pay_period_start, 'YYYY-MM-DD') || ' to ' || 
            TO_CHAR(NEW.pay_period_end, 'YYYY-MM-DD') || ')',
            NEW.run_number,
            auth.uid()
        );

        -- Update payroll_runs with journal entry tracking
        NEW.journal_entry_id := v_journal_id;
        NEW.posted_to_ledger := true;
        NEW.posted_to_ledger_at := NOW();

        -- Log to audit_logs
        INSERT INTO audit_logs (
            action,
            user_id,
            table_name,
            record_id,
            new_values
        ) VALUES (
            'payroll_posted_to_ledger',
            auth.uid(),
            'payroll_runs',
            NEW.id,
            jsonb_build_object(
                'payroll_run_id', NEW.id,
                'run_number', NEW.run_number,
                'total_gross', NEW.total_gross,
                'journal_entry_id', v_journal_id,
                'debit_account', '5040',
                'credit_account', '2040',
                'period_year', NEW.period_year,
                'period_month', NEW.period_month
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS post_payroll_to_ledger_trigger ON payroll_runs;
CREATE TRIGGER post_payroll_to_ledger_trigger
BEFORE UPDATE OF status ON payroll_runs
FOR EACH ROW EXECUTE FUNCTION post_payroll_to_ledger();

COMMENT ON FUNCTION post_payroll_to_ledger() IS 
'PROMPT A2.1: Auto-generates journal entries when payroll is finalized. Debit: 5040 (Salary Expense), Credit: 2040 (Payroll Payable). NO cash/bank movement.';

-- ============================================================================
-- 5. PAYROLL AUDIT LOGGING
-- ============================================================================

CREATE OR REPLACE FUNCTION log_payroll_operations()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (
            action,
            user_id,
            table_name,
            record_id,
            new_values
        ) VALUES (
            'payroll_run_created',
            NEW.created_by_admin_id,
            'payroll_runs',
            NEW.id,
            jsonb_build_object(
                'run_number', NEW.run_number,
                'pay_period_start', NEW.pay_period_start,
                'pay_period_end', NEW.pay_period_end,
                'total_gross', NEW.total_gross,
                'employee_count', NEW.employee_count,
                'status', NEW.status
            )
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO audit_logs (
            action,
            user_id,
            table_name,
            record_id,
            old_values,
            new_values
        ) VALUES (
            'payroll_status_changed',
            auth.uid(),
            'payroll_runs',
            NEW.id,
            jsonb_build_object('old_status', OLD.status),
            jsonb_build_object(
                'new_status', NEW.status,
                'run_number', NEW.run_number,
                'md_approved', NEW.md_approved,
                'chairman_approved', NEW.chairman_approved,
                'chairman_approval_required', NEW.chairman_approval_required,
                'posted_to_ledger', NEW.posted_to_ledger
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_payroll_operations_trigger ON payroll_runs;
CREATE TRIGGER log_payroll_operations_trigger
AFTER INSERT OR UPDATE ON payroll_runs
FOR EACH ROW EXECUTE FUNCTION log_payroll_operations();

COMMENT ON FUNCTION log_payroll_operations() IS 
'PROMPT A2.1: Audit logging for all payroll operations (creation, approval, finalization)';

-- ============================================================================
-- 6. PAYROLL IMMUTABILITY AFTER FINALIZATION
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_finalized_payroll_modification()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent modification of finalized payroll runs
    IF OLD.status = 'finalized' AND (
        NEW.total_gross != OLD.total_gross OR
        NEW.total_net != OLD.total_net OR
        NEW.employee_count != OLD.employee_count
    ) THEN
        RAISE EXCEPTION 'Cannot modify finalized payroll run %. Use reversal process instead.', OLD.run_number;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_finalized_payroll_modification_trigger ON payroll_runs;
CREATE TRIGGER prevent_finalized_payroll_modification_trigger
BEFORE UPDATE ON payroll_runs
FOR EACH ROW EXECUTE FUNCTION prevent_finalized_payroll_modification();

COMMENT ON FUNCTION prevent_finalized_payroll_modification() IS 
'PROMPT A2.1: Enforces immutability of finalized payroll runs';

-- ============================================================================
-- 7. RPC FUNCTION: GENERATE MONTHLY PAYROLL RUN
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_monthly_payroll(
    p_pay_period_start DATE,
    p_pay_period_end DATE,
    p_payment_date DATE
)
RETURNS JSONB AS $$
DECLARE
    v_user_role TEXT;
    v_payroll_run_id UUID;
    v_run_number TEXT;
    v_total_gross NUMERIC(15, 2);
    v_employee_count INTEGER;
    v_period_year INTEGER;
    v_period_month INTEGER;
BEGIN
    -- Verify user is HR Manager or Super Admin
    SELECT role_category INTO v_user_role
    FROM employees
    WHERE user_id = auth.uid();

    IF v_user_role NOT IN ('hr_manager', 'chairman') THEN
        SELECT role INTO v_user_role
        FROM profiles
        WHERE id = auth.uid();

        IF v_user_role != 'super_admin' THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Only HR Manager, Chairman, or Super Admin can generate payroll runs'
            );
        END IF;
    END IF;

    -- Extract period year and month from pay_period_end
    v_period_year := EXTRACT(YEAR FROM p_pay_period_end);
    v_period_month := EXTRACT(MONTH FROM p_pay_period_end);

    -- Generate run number
    v_run_number := 'PAY-' || TO_CHAR(p_pay_period_end, 'YYYYMM') || '-' || 
                    LPAD(EXTRACT(DAY FROM p_payment_date)::TEXT, 2, '0');

    -- Calculate total gross salary for active employees
    SELECT 
        COALESCE(SUM(monthly_salary_gross), 0),
        COUNT(*)
    INTO v_total_gross, v_employee_count
    FROM employees
    WHERE status = 'active'
      AND start_date <= p_pay_period_end;

    -- Create payroll run
    INSERT INTO payroll_runs (
        run_number,
        pay_period_start,
        pay_period_end,
        payment_date,
        status,
        total_gross,
        total_net,
        employee_count,
        created_by_admin_id,
        period_year,
        period_month
    ) VALUES (
        v_run_number,
        p_pay_period_start,
        p_pay_period_end,
        p_payment_date,
        'draft',
        v_total_gross,
        v_total_gross, -- Simplified: no deductions in draft
        v_employee_count,
        auth.uid(),
        v_period_year,
        v_period_month
    ) RETURNING id INTO v_payroll_run_id;

    -- Create payroll items for each active employee
    INSERT INTO payroll_items (
        payroll_run_id,
        employee_id,
        gross_salary,
        net_salary
    )
    SELECT 
        v_payroll_run_id,
        id,
        monthly_salary_gross,
        monthly_salary_gross -- Simplified: no deductions
    FROM employees
    WHERE status = 'active'
      AND start_date <= p_pay_period_end;

    RETURN jsonb_build_object(
        'success', true,
        'payroll_run_id', v_payroll_run_id,
        'run_number', v_run_number,
        'total_gross', v_total_gross,
        'employee_count', v_employee_count,
        'period', v_period_year || '-' || LPAD(v_period_month::TEXT, 2, '0'),
        'chairman_approval_required', (v_total_gross > 50000)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_monthly_payroll(DATE, DATE, DATE) IS 
'PROMPT A2.1: Generates monthly payroll run. HR Manager/Super Admin only. Auto-flags if Chairman approval required (>50k BDT).';

-- ============================================================================
-- 8. RPC FUNCTION: APPROVE PAYROLL (MD)
-- ============================================================================

CREATE OR REPLACE FUNCTION approve_payroll_md(
    p_payroll_run_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_user_role TEXT;
    v_run_number TEXT;
    v_total_gross NUMERIC(15, 2);
BEGIN
    -- Verify user is Managing Director
    SELECT role_category INTO v_user_role
    FROM employees
    WHERE user_id = auth.uid();

    IF v_user_role != 'managing_director' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Only Managing Director can approve payroll runs'
        );
    END IF;

    -- Get payroll run details
    SELECT run_number, total_gross
    INTO v_run_number, v_total_gross
    FROM payroll_runs
    WHERE id = p_payroll_run_id;

    IF v_run_number IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Payroll run not found'
        );
    END IF;

    -- Update payroll run status
    UPDATE payroll_runs
    SET status = 'approved'
    WHERE id = p_payroll_run_id
      AND status = 'pending_approval';

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Payroll run must be in pending_approval status'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Payroll approved by MD',
        'run_number', v_run_number,
        'next_step', CASE 
            WHEN v_total_gross > 50000 
            THEN 'Chairman approval required (amount > 50,000 BDT)'
            ELSE 'Ready for finalization'
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION approve_payroll_md(UUID) IS 
'PROMPT A2.1: MD approves payroll run. Next: Chairman approval if > 50k BDT, else finalize.';

-- ============================================================================
-- 9. RPC FUNCTION: APPROVE PAYROLL (CHAIRMAN)
-- ============================================================================

CREATE OR REPLACE FUNCTION approve_payroll_chairman(
    p_payroll_run_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user_role TEXT;
    v_run_number TEXT;
    v_chairman_required BOOLEAN;
BEGIN
    -- Verify user is Chairman
    SELECT role_category INTO v_user_role
    FROM employees
    WHERE user_id = auth.uid();

    IF v_user_role != 'chairman' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Only Chairman can give final payroll approval'
        );
    END IF;

    -- Get payroll run details
    SELECT run_number, chairman_approval_required
    INTO v_run_number, v_chairman_required
    FROM payroll_runs
    WHERE id = p_payroll_run_id;

    IF v_run_number IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Payroll run not found'
        );
    END IF;

    -- Update Chairman approval
    UPDATE payroll_runs
    SET chairman_approved = true
    WHERE id = p_payroll_run_id
      AND status = 'approved';

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Payroll run must be approved by MD first'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Payroll approved by Chairman',
        'run_number', v_run_number,
        'next_step', 'Ready for finalization and posting to ledger'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION approve_payroll_chairman(UUID, TEXT) IS 
'PROMPT A2.1: Chairman approves payroll run > 50,000 BDT. MANDATORY threshold.';

-- ============================================================================
-- 10. RPC FUNCTION: FINALIZE PAYROLL
-- ============================================================================

CREATE OR REPLACE FUNCTION finalize_payroll(
    p_payroll_run_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_user_role TEXT;
    v_run_number TEXT;
    v_chairman_required BOOLEAN;
    v_chairman_approved BOOLEAN;
    v_total_gross NUMERIC(15, 2);
BEGIN
    -- Verify user is Super Admin or Chairman
    SELECT role_category INTO v_user_role
    FROM employees
    WHERE user_id = auth.uid();

    IF v_user_role NOT IN ('chairman') THEN
        SELECT role INTO v_user_role
        FROM profiles
        WHERE id = auth.uid();

        IF v_user_role != 'super_admin' THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Only Chairman or Super Admin can finalize payroll'
            );
        END IF;
    END IF;

    -- Get payroll run details
    SELECT 
        run_number, 
        chairman_approval_required, 
        chairman_approved,
        total_gross
    INTO 
        v_run_number, 
        v_chairman_required, 
        v_chairman_approved,
        v_total_gross
    FROM payroll_runs
    WHERE id = p_payroll_run_id;

    IF v_run_number IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Payroll run not found'
        );
    END IF;

    -- Verify Chairman approval if required
    IF v_chairman_required = true AND v_chairman_approved != true THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Chairman approval required for payroll runs > 50,000 BDT'
        );
    END IF;

    -- Finalize payroll run (will trigger journal entry creation)
    UPDATE payroll_runs
    SET status = 'finalized'
    WHERE id = p_payroll_run_id
      AND status = 'approved';

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Payroll run must be approved before finalization'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Payroll finalized and posted to general ledger',
        'run_number', v_run_number,
        'total_gross', v_total_gross,
        'journal_entry', jsonb_build_object(
            'debit', '5040 - Salaries and Wages',
            'credit', '2040 - Payroll Payable',
            'amount', v_total_gross,
            'currency', 'BDT'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION finalize_payroll(UUID) IS 
'PROMPT A2.1: Finalizes payroll run and posts to general ledger. Auto-creates journal entries: Debit 5040, Credit 2040. Chairman/Super Admin only.';

-- ============================================================================
-- 11. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_payroll_runs_period 
ON payroll_runs(period_year, period_month);

CREATE INDEX IF NOT EXISTS idx_payroll_runs_chairman_approval 
ON payroll_runs(chairman_approval_required, chairman_approved);

CREATE INDEX IF NOT EXISTS idx_payroll_runs_posted_to_ledger 
ON payroll_runs(posted_to_ledger, posted_to_ledger_at);

CREATE INDEX IF NOT EXISTS idx_general_ledger_payroll 
ON general_ledger(transaction_type, entry_date) 
WHERE transaction_type IN ('payroll_expense', 'payroll_liability');

-- ============================================================================
-- PROMPT A2.1 IMPLEMENTATION COMPLETE
-- ============================================================================

COMMENT ON TABLE payroll_runs IS 
'PROMPT A2.1: Monthly payroll runs with approval workflow (MD → Chairman if >50k BDT). Auto-posts to general ledger on finalization.';

-- Success confirmation
SELECT jsonb_build_object(
    'success', true,
    'prompt', 'A2.1',
    'message', 'Payroll & HR Financial Core (Accounting First) - Implementation Complete',
    'components', jsonb_build_object(
        'payroll_runs_enhanced', true,
        'chairman_threshold', '50,000 BDT',
        'approval_workflow', 'MD → Chairman (if >50k) → Finalize',
        'accounting_integration', 'Debit 5040, Credit 2040',
        'audit_logging', 'Complete',
        'immutability', 'Enforced after finalization'
    ),
    'rpc_functions', ARRAY[
        'generate_monthly_payroll(start_date, end_date, payment_date)',
        'approve_payroll_md(payroll_run_id)',
        'approve_payroll_chairman(payroll_run_id, notes)',
        'finalize_payroll(payroll_run_id)'
    ]
) AS implementation_status;