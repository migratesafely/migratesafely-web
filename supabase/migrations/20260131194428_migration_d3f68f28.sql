-- ============================================================================
-- PROMPT A6 - PART 4: FIXED ASSETS & PETTY CASH TABLES
-- ============================================================================

-- Create fixed_assets table for CAPEX tracking
CREATE TABLE IF NOT EXISTS fixed_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_name TEXT NOT NULL,
  asset_category TEXT NOT NULL CHECK (asset_category IN (
    'office_property', 'office_renovation', 'vehicle', 'furniture', 
    'equipment', 'computer', 'software', 'other'
  )),
  purchase_date DATE NOT NULL,
  purchase_amount DECIMAL(15,2) NOT NULL,
  useful_life_years INTEGER NOT NULL DEFAULT 5,
  residual_value DECIMAL(15,2) NOT NULL DEFAULT 0,
  depreciation_method TEXT NOT NULL DEFAULT 'straight_line' CHECK (
    depreciation_method IN ('straight_line', 'declining_balance')
  ),
  account_code TEXT NOT NULL,
  expense_request_id UUID REFERENCES expense_requests(id),
  current_book_value DECIMAL(15,2) NOT NULL,
  accumulated_depreciation DECIMAL(15,2) NOT NULL DEFAULT 0,
  disposal_date DATE,
  disposal_amount DECIMAL(15,2),
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'disposed', 'written_off')
  ),
  notes TEXT,
  country_code TEXT NOT NULL DEFAULT 'BD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (account_code) REFERENCES chart_of_accounts(account_code),
  CONSTRAINT valid_book_value CHECK (current_book_value >= 0),
  CONSTRAINT valid_depreciation CHECK (accumulated_depreciation >= 0)
);

-- Create index for asset tracking
CREATE INDEX IF NOT EXISTS idx_fixed_assets_status ON fixed_assets(status);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_category ON fixed_assets(asset_category);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_expense ON fixed_assets(expense_request_id);

-- Create petty_cash_wallets table for office cash management
CREATE TABLE IF NOT EXISTS petty_cash_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_name TEXT NOT NULL,
  location TEXT NOT NULL, -- Office location
  current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  max_single_transaction DECIMAL(15,2) NOT NULL DEFAULT 5000, -- Max per transaction
  custodian_employee_id UUID REFERENCES employees(id),
  account_code TEXT NOT NULL DEFAULT '1015', -- Petty Cash account
  country_code TEXT NOT NULL DEFAULT 'BD',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (account_code) REFERENCES chart_of_accounts(account_code),
  CONSTRAINT positive_balance CHECK (current_balance >= 0)
);

-- Create petty_cash_transactions table
CREATE TABLE IF NOT EXISTS petty_cash_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES petty_cash_wallets(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('top_up', 'spend', 'reconciliation')),
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  receipt_url TEXT, -- Required for spends
  expense_category TEXT,
  recorded_by UUID NOT NULL REFERENCES employees(id),
  approved_by UUID REFERENCES employees(id),
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    approval_status IN ('pending', 'approved', 'rejected')
  ),
  journal_entry_id UUID, -- Link to accounting entry
  country_code TEXT NOT NULL DEFAULT 'BD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_amount CHECK (amount > 0),
  CONSTRAINT receipt_required_for_spend CHECK (
    transaction_type != 'spend' OR receipt_url IS NOT NULL
  )
);

-- Create index for petty cash tracking
CREATE INDEX IF NOT EXISTS idx_petty_cash_wallet ON petty_cash_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_petty_cash_status ON petty_cash_transactions(approval_status);

-- Add missing columns to expense_requests
ALTER TABLE expense_requests 
  ADD COLUMN IF NOT EXISTS expense_date DATE,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS is_capex BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS linked_asset_id UUID REFERENCES fixed_assets(id),
  ADD COLUMN IF NOT EXISTS receipt_urls TEXT[], -- Array for multiple receipts
  ADD COLUMN IF NOT EXISTS payment_date DATE,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS journal_entry_id UUID,
  ADD COLUMN IF NOT EXISTS requires_chairman_approval BOOLEAN DEFAULT FALSE;

-- Update existing expense_requests to set expense_date from created_at if null
UPDATE expense_requests 
SET expense_date = created_at::DATE 
WHERE expense_date IS NULL;

-- Make expense_date NOT NULL after backfill
ALTER TABLE expense_requests 
  ALTER COLUMN expense_date SET NOT NULL;

-- Add check constraint for receipt requirement
ALTER TABLE expense_requests
  ADD CONSTRAINT receipt_required_check CHECK (
    status = 'draft' OR receipt_urls IS NOT NULL
  );

-- Add trigger to auto-set chairman approval flag
CREATE OR REPLACE FUNCTION set_chairman_approval_flag()
RETURNS TRIGGER AS $$
BEGIN
  -- Expenses > 50,000 BDT require Chairman approval
  IF NEW.amount > 50000 THEN
    NEW.requires_chairman_approval := TRUE;
  ELSE
    NEW.requires_chairman_approval := FALSE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_chairman_approval
  BEFORE INSERT OR UPDATE OF amount ON expense_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_chairman_approval_flag();

-- Return confirmation
SELECT jsonb_build_object(
  'fixed_assets_table', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'fixed_assets'),
  'petty_cash_wallets_table', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'petty_cash_wallets'),
  'petty_cash_transactions_table', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'petty_cash_transactions'),
  'expense_requests_enhanced', TRUE,
  'columns_added', ARRAY[
    'expense_date', 'department', 'is_capex', 'linked_asset_id',
    'receipt_urls', 'payment_date', 'payment_reference', 
    'journal_entry_id', 'requires_chairman_approval'
  ],
  'constraints_added', ARRAY['receipt_required_check'],
  'triggers_added', ARRAY['trigger_set_chairman_approval']
) AS part4_complete;