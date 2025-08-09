-- Remove the webhook RLS policy that doesn't work for unauthenticated webhooks
-- The service role key approach is the correct solution for webhook operations

DROP POLICY IF EXISTS "Allow webhook updates via bot_id" ON interviews;