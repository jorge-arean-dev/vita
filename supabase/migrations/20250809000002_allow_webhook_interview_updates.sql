-- Allow webhook updates to interviews table
-- This policy allows updates when recall_bot_id is provided (webhook scenario)

CREATE POLICY "Allow webhook updates via bot_id"
ON interviews
FOR UPDATE
USING (recall_bot_id IS NOT NULL)
WITH CHECK (recall_bot_id IS NOT NULL);