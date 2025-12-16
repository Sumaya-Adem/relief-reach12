-- Fix the view to explicitly use SECURITY INVOKER (default, but explicit is better)
DROP VIEW IF EXISTS public.organizations_public;

CREATE VIEW public.organizations_public 
WITH (security_invoker = true)
AS
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