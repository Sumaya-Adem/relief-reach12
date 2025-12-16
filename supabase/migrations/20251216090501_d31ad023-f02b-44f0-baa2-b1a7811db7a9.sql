-- Fix report_evidence: Restrict SELECT to same organization or admins
DROP POLICY IF EXISTS "Anyone authenticated can view evidence" ON public.report_evidence;

-- Only allow users to view evidence for reports from their own organization, or admins
CREATE POLICY "Users can view evidence for their org reports or admins" 
ON public.report_evidence 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR EXISTS (
    SELECT 1 FROM aid_records ar 
    WHERE ar.id = report_evidence.aid_record_id 
    AND ar.organization_id = get_user_organization_id(auth.uid())
  )
);

-- Fix duplicate_warnings: Restrict INSERT to own organization's aid records
DROP POLICY IF EXISTS "NGO users can insert warnings" ON public.duplicate_warnings;

CREATE POLICY "NGO users can insert warnings for their org records" 
ON public.duplicate_warnings 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM aid_records ar 
    WHERE ar.id = duplicate_warnings.aid_record_id 
    AND ar.organization_id = get_user_organization_id(auth.uid())
  )
);