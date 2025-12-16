-- Create storage bucket for report evidence
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-evidence', 'report-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to the bucket
CREATE POLICY "Users can upload evidence files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'report-evidence');

-- Allow anyone to view evidence files (public bucket)
CREATE POLICY "Anyone can view evidence files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'report-evidence');