-- Add executed_at column to prize_draws table
ALTER TABLE prize_draws 
ADD COLUMN IF NOT EXISTS executed_at TIMESTAMPTZ;

-- Add comment
COMMENT ON COLUMN prize_draws.executed_at IS 'Timestamp when draw was executed (automatically or manually)';

-- Add 'executing' to prize_draw_status enum (if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'executing' 
    AND enumtypid = 'prize_draw_status'::regtype
  ) THEN
    ALTER TYPE prize_draw_status ADD VALUE 'executing';
  END IF;
END$$;

SELECT 'Prize draw schema fix completed - added executed_at column and executing status' AS status;