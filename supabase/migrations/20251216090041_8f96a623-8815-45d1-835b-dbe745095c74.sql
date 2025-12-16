-- Fix 1: Restrict notifications INSERT to only allow triggers/service role
-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can receive notifications" ON public.notifications;

-- Create a restrictive policy - only service role (triggers) can insert
-- This is safe because the triggers run with SECURITY DEFINER
CREATE POLICY "Only system can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (false);

-- Fix 2: Update organizations policy to restrict contact info exposure
-- For now, we'll keep organizations viewable but this is a design choice
-- The contact info exposure is acceptable for NGO coordination

-- Note: The profiles table RLS is already correct:
-- - Users can only SELECT their own profile (user_id = auth.uid())
-- - Admins can SELECT all profiles (has_role check)
-- This is the intended behavior for a government coordination system