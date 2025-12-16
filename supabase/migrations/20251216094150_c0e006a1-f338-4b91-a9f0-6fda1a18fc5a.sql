-- Fix organizations table: Restrict contact info to admins and org members only
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone authenticated can view organizations" ON public.organizations;

-- Create a view for public organization data (without contact info)
CREATE OR REPLACE VIEW public.organizations_public AS
SELECT 
  id,
  name,
  description,
  is_active,
  created_at,
  updated_at
FROM public.organizations;

-- Grant access to the view
GRANT SELECT ON public.organizations_public TO authenticated;

-- Create policies for full organization data access
-- Admins can view all organization details
CREATE POLICY "Admins can view all organizations"
ON public.organizations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own organization's full details
CREATE POLICY "Users can view their own organization"
ON public.organizations
FOR SELECT
USING (id = get_user_organization_id(auth.uid()));