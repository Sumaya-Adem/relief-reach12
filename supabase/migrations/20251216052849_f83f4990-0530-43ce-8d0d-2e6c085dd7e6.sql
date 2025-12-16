
-- Create enum for report status
CREATE TYPE public.report_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');

-- Add new columns to aid_records for report management
ALTER TABLE public.aid_records 
ADD COLUMN status public.report_status NOT NULL DEFAULT 'pending',
ADD COLUMN beneficiary_count integer,
ADD COLUMN field_officer_name text,
ADD COLUMN rejection_reason text,
ADD COLUMN approved_at timestamp with time zone,
ADD COLUMN approved_by uuid,
ADD COLUMN flagged boolean DEFAULT false,
ADD COLUMN flag_reason text;

-- Create admin action logs table for audit trail
CREATE TABLE public.admin_action_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aid_record_id uuid NOT NULL REFERENCES public.aid_records(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL,
  action text NOT NULL,
  previous_status public.report_status,
  new_status public.report_status,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create report evidence table for attachments
CREATE TABLE public.report_evidence (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aid_record_id uuid NOT NULL REFERENCES public.aid_records(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text,
  uploaded_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_evidence ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_action_logs
CREATE POLICY "Admins can view all action logs"
ON public.admin_action_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert action logs"
ON public.admin_action_logs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for report_evidence
CREATE POLICY "Anyone authenticated can view evidence"
ON public.report_evidence
FOR SELECT
USING (true);

CREATE POLICY "NGO users can insert evidence for their org reports"
ON public.report_evidence
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.aid_records ar
    WHERE ar.id = aid_record_id
    AND ar.organization_id = get_user_organization_id(auth.uid())
  )
);

CREATE POLICY "Admins can insert any evidence"
ON public.report_evidence
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for report evidence
INSERT INTO storage.buckets (id, name, public) VALUES ('report-evidence', 'report-evidence', true);

-- Storage policies for report evidence
CREATE POLICY "Anyone can view report evidence"
ON storage.objects FOR SELECT
USING (bucket_id = 'report-evidence');

CREATE POLICY "Authenticated users can upload evidence"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'report-evidence' AND auth.role() = 'authenticated');
