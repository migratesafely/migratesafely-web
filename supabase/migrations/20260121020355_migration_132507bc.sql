-- =====================================================
-- PHASE 1: ENUMS AND CORE TYPES
-- =====================================================

-- User roles enum
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'manager_admin', 
  'worker_admin',
  'member',
  'agent'
);

-- Membership status
CREATE TYPE membership_status AS ENUM (
  'pending_payment',
  'active',
  'expired',
  'suspended'
);

-- Payment status
CREATE TYPE payment_status AS ENUM (
  'pending',
  'confirmed',
  'failed',
  'refunded'
);

-- Agent status
CREATE TYPE agent_status AS ENUM (
  'pending_approval',
  'approved',
  'rejected',
  'suspended'
);

-- Service request status
CREATE TYPE service_request_status AS ENUM (
  'submitted',
  'agent_assigned',
  'in_progress',
  'completed',
  'cancelled'
);

-- Withdrawal status
CREATE TYPE withdrawal_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'paid'
);

-- Report status
CREATE TYPE report_status AS ENUM (
  'submitted',
  'under_review',
  'verified',
  'rejected'
);

-- Prize draw status
CREATE TYPE prize_draw_status AS ENUM (
  'upcoming',
  'active',
  'completed',
  'cancelled'
);