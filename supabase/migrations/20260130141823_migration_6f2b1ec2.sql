-- ====================================================================
-- FINANCIAL ACCOUNTING FOUNDATION - BANGLADESH ONLY
-- ====================================================================
-- RULE: ADDITIVE ONLY - Does not modify existing wallet/payment logic
-- SCOPE: Chart of Accounts + Ledger Tables
-- CURRENCY: BDT (Bangladesh Taka) only
-- ====================================================================

-- 1. CHART OF ACCOUNTS TABLE
-- ====================================================================
CREATE TABLE chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_code VARCHAR(20) NOT NULL UNIQUE,
  account_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL, -- 'asset', 'liability', 'income', 'expense', 'equity'
  parent_code VARCHAR(20), -- For hierarchical accounts
  is_restricted BOOLEAN DEFAULT false, -- TRUE for Prize Draw Pool (cannot be used for operations)
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_parent_account FOREIGN KEY (parent_code) REFERENCES chart_of_accounts(account_code) ON DELETE RESTRICT
);

-- Create index for performance
CREATE INDEX idx_chart_accounts_type ON chart_of_accounts(account_type);
CREATE INDEX idx_chart_accounts_code ON chart_of_accounts(account_code);
CREATE INDEX idx_chart_accounts_parent ON chart_of_accounts(parent_code);

-- ====================================================================
-- 2. GENERAL LEDGER TABLE (Double-Entry Bookkeeping)
-- ====================================================================
CREATE TABLE general_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transaction_id UUID NOT NULL, -- Links to source transaction (wallet_credit/debit, payment, etc.)
  transaction_type VARCHAR(100) NOT NULL, -- 'membership_payment', 'referral_bonus', 'prize_payout', etc.
  account_code VARCHAR(20) NOT NULL,
  debit_amount DECIMAL(15, 2) DEFAULT 0,
  credit_amount DECIMAL(15, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'BDT',
  description TEXT,
  reference_number VARCHAR(100), -- External reference (invoice, payment ID, etc.)
  user_id UUID, -- Related user (if applicable)
  created_by UUID, -- Admin who created manual entry
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_account_code FOREIGN KEY (account_code) REFERENCES chart_of_accounts(account_code) ON DELETE RESTRICT,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT check_debit_credit CHECK (
    (debit_amount > 0 AND credit_amount = 0) OR 
    (credit_amount > 0 AND debit_amount = 0) OR 
    (debit_amount = 0 AND credit_amount = 0)
  )
);

-- Create indexes for performance
CREATE INDEX idx_ledger_date ON general_ledger(entry_date DESC);
CREATE INDEX idx_ledger_transaction ON general_ledger(transaction_id);
CREATE INDEX idx_ledger_account ON general_ledger(account_code);
CREATE INDEX idx_ledger_type ON general_ledger(transaction_type);
CREATE INDEX idx_ledger_user ON general_ledger(user_id);

-- ====================================================================
-- 3. ACCOUNTING PERIODS TABLE
-- ====================================================================
CREATE TABLE accounting_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_name VARCHAR(50) NOT NULL, -- 'Q1 2026', 'January 2026', etc.
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  closed_at TIMESTAMPTZ,
  closed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_closed_by FOREIGN KEY (closed_by) REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT check_period_dates CHECK (end_date > start_date)
);

CREATE INDEX idx_periods_dates ON accounting_periods(start_date, end_date);

-- ====================================================================
-- 4. INSERT CHART OF ACCOUNTS (BANGLADESH / BDT ONLY)
-- ====================================================================

-- ASSETS (1000-1999)
-- ====================================================================
INSERT INTO chart_of_accounts (account_code, account_name, account_type, description) VALUES
('1000', 'Assets', 'asset', 'Total Assets'),
('1100', 'Current Assets', 'asset', 'Assets convertible to cash within one year'),
('1110', 'Cash and Cash Equivalents', 'asset', 'Bank accounts and cash on hand'),
('1111', 'Bank Account - Operating (BDT)', 'asset', 'Main operating bank account in Bangladesh Taka'),
('1112', 'Stripe Clearing Account (BDT)', 'asset', 'Temporary account for Stripe payment processing'),
('1120', 'Member Wallet Clearing', 'asset', 'Clearing account for member wallet balances (offset by liability)'),
('1130', 'Accounts Receivable', 'asset', 'Money owed to the company'),
('1131', 'Pending Membership Fees', 'asset', 'Membership fees not yet collected');

-- LIABILITIES (2000-2999)
-- ====================================================================
INSERT INTO chart_of_accounts (account_code, account_name, account_type, is_restricted, description) VALUES
('2000', 'Liabilities', 'liability', false, 'Total Liabilities'),
('2100', 'Current Liabilities', 'liability', false, 'Liabilities due within one year'),
('2110', 'Prize Draw Pool Payable (RESTRICTED)', 'liability', true, 'RESTRICTED FUNDS - 30% of membership fees. Can ONLY be used for prize payouts or community support reallocation. CANNOT be used for operational expenses.'),
('2120', 'Member Wallet Liability', 'liability', false, 'Total amount owed to members in wallet balances'),
('2130', 'Pending Withdrawals Payable', 'liability', false, 'Approved withdrawals awaiting payment'),
('2140', 'Referral Bonuses Payable', 'liability', false, 'Approved referral bonuses pending payout'),
('2150', 'Tier Bonuses Payable', 'liability', false, 'Approved tier bonuses pending payout'),
('2200', 'Long-term Liabilities', 'liability', false, 'Liabilities due after one year'),
('2210', 'Tax Payable (Future Use)', 'liability', false, 'Tax liabilities (placeholder for future tax system)');

-- INCOME (4000-4999)
-- ====================================================================
INSERT INTO chart_of_accounts (account_code, account_name, account_type, description) VALUES
('4000', 'Income', 'income', 'Total Income'),
('4100', 'Operating Income', 'income', 'Income from primary business operations'),
('4110', 'Membership Fees (Net of Prize Pool)', 'income', 'Membership fees after deducting 30% prize pool allocation. This is OPERATIONAL INCOME (70% of total fees).'),
('4120', 'Agent Service Fees', 'income', 'Fees collected from agent services'),
('4200', 'Other Income', 'income', 'Non-operating income'),
('4210', 'Other Service Income', 'income', 'Miscellaneous service income');

-- EXPENSES (5000-5999)
-- ====================================================================
INSERT INTO chart_of_accounts (account_code, account_name, account_type, description) VALUES
('5000', 'Expenses', 'expense', 'Total Expenses'),
('5100', 'Operating Expenses', 'expense', 'Regular business operating expenses'),
('5110', 'Referral Bonus Expenses', 'expense', 'Referral bonuses paid to members'),
('5120', 'Tier Bonus Expenses', 'expense', 'Tier achievement bonuses paid to members'),
('5130', 'Community Support Expenses', 'expense', 'Community hardship support payments (reallocated from Prize Pool)'),
('5200', 'Administrative Expenses', 'expense', 'General administrative costs'),
('5210', 'Salaries and Wages', 'expense', 'Employee salaries (future use)'),
('5220', 'Office Expenses', 'expense', 'General office and operational expenses'),
('5230', 'Marketing and Advertising', 'expense', 'Marketing and promotional costs'),
('5240', 'Technology and Software', 'expense', 'Software subscriptions and technology costs'),
('5300', 'Prize Draw Expenses', 'expense', 'Prize payouts to winners (funded from Prize Draw Pool liability)'),
('5310', 'Prize Payouts', 'expense', 'Actual prize payments to winners');

-- EQUITY (3000-3999)
-- ====================================================================
INSERT INTO chart_of_accounts (account_code, account_name, account_type, description) VALUES
('3000', 'Equity', 'equity', 'Total Equity'),
('3100', 'Retained Earnings', 'equity', 'Accumulated profits retained in the business'),
('3110', 'Current Year Earnings', 'equity', 'Net income for the current accounting period'),
('3120', 'Prior Years Earnings', 'equity', 'Accumulated earnings from previous years');

COMMENT ON TABLE chart_of_accounts IS 'Chart of Accounts for MigrateSafely (Bangladesh / BDT only)';
COMMENT ON TABLE general_ledger IS 'General Ledger - Double-entry bookkeeping system';
COMMENT ON TABLE accounting_periods IS 'Accounting period management for financial reporting';

COMMENT ON COLUMN chart_of_accounts.is_restricted IS 'TRUE = Account cannot be used for operations (e.g., Prize Draw Pool). Enforces that Prize Draw Pool is a LIABILITY that can only be reduced by prize payouts or community support.';
COMMENT ON COLUMN general_ledger.transaction_id IS 'Links to source transaction in wallet_credits, wallet_debits, payment_requests, etc.';
COMMENT ON COLUMN general_ledger.debit_amount IS 'Debit amount (increases Assets/Expenses, decreases Liabilities/Income/Equity)';
COMMENT ON COLUMN general_ledger.credit_amount IS 'Credit amount (increases Liabilities/Income/Equity, decreases Assets/Expenses)';