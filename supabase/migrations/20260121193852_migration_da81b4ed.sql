ALTER TABLE prize_draw_winners
ADD COLUMN IF NOT EXISTS claim_status text NOT NULL DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS claim_deadline_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS claimed_at timestamp with time zone;

ALTER TABLE prize_draw_winners
DROP CONSTRAINT IF EXISTS prize_draw_winners_claim_status_check;

ALTER TABLE prize_draw_winners
ADD CONSTRAINT prize_draw_winners_claim_status_check
CHECK (claim_status IN ('PENDING', 'CLAIMED', 'EXPIRED'));

-- Allow winners to update their own claim status (needed for the claim API if it runs as user)
DROP POLICY IF EXISTS "Winners can claim their prize" ON prize_draw_winners;
CREATE POLICY "Winners can claim their prize"
ON prize_draw_winners
FOR UPDATE
USING (auth.uid() = winner_user_id)
WITH CHECK (auth.uid() = winner_user_id);