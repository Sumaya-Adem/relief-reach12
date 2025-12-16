-- Make report-evidence bucket private
UPDATE storage.buckets SET public = false WHERE id = 'report-evidence';

-- Drop overly permissive storage policies
DROP POLICY IF EXISTS "Anyone can view report evidence" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload evidence" ON storage.objects;

-- Create proper storage policies for report-evidence bucket
-- Allow authenticated users to view their own organization's evidence or admins
CREATE POLICY "Users can view own org evidence or admins"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'report-evidence' 
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM report_evidence re
      JOIN aid_records ar ON re.aid_record_id = ar.id
      WHERE re.file_url LIKE '%' || storage.objects.name || '%'
      AND ar.organization_id = get_user_organization_id(auth.uid())
    )
  )
);

-- Allow authenticated users to upload evidence for their own organization
CREATE POLICY "Users can upload evidence for their org"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'report-evidence'
  AND auth.role() = 'authenticated'
);

-- Allow admins to delete evidence
CREATE POLICY "Admins can delete evidence"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'report-evidence'
  AND has_role(auth.uid(), 'admin'::app_role)
);