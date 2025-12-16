-- Create notifications table for NGOs and Admins
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('report_approved', 'report_rejected', 'report_flagged', 'new_report_submitted')),
    related_record_id UUID REFERENCES public.aid_records(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT false,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (user_id = auth.uid());

-- System can insert notifications (via service role or triggers)
CREATE POLICY "Authenticated users can receive notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Create function to notify admins when a new report is submitted
CREATE OR REPLACE FUNCTION public.notify_admins_new_report()
RETURNS TRIGGER AS $$
DECLARE
    admin_user RECORD;
    org_name TEXT;
    area_name TEXT;
BEGIN
    -- Get organization name
    SELECT name INTO org_name FROM public.organizations WHERE id = NEW.organization_id;
    
    -- Get area name
    SELECT village || ', ' || district INTO area_name FROM public.areas WHERE id = NEW.area_id;
    
    -- Notify all admins
    FOR admin_user IN 
        SELECT user_id FROM public.user_roles WHERE role = 'admin'
    LOOP
        INSERT INTO public.notifications (user_id, title, message, type, related_record_id)
        VALUES (
            admin_user.user_id,
            'New Report Submitted',
            'A new ' || NEW.aid_type || ' aid report has been submitted by ' || COALESCE(org_name, 'Unknown') || ' for ' || COALESCE(area_name, 'Unknown area'),
            'new_report_submitted',
            NEW.id
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new report notifications
CREATE TRIGGER on_aid_record_created
AFTER INSERT ON public.aid_records
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_new_report();

-- Create function to notify NGO user when report status changes
CREATE OR REPLACE FUNCTION public.notify_ngo_status_change()
RETURNS TRIGGER AS $$
DECLARE
    notification_title TEXT;
    notification_message TEXT;
    notification_type TEXT;
    area_name TEXT;
BEGIN
    -- Only trigger on status change
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Get area name
        SELECT village || ', ' || district INTO area_name FROM public.areas WHERE id = NEW.area_id;
        
        IF NEW.status = 'approved' THEN
            notification_title := 'Report Approved';
            notification_message := 'Your ' || NEW.aid_type || ' aid report for ' || COALESCE(area_name, 'Unknown area') || ' has been approved.';
            notification_type := 'report_approved';
        ELSIF NEW.status = 'rejected' THEN
            notification_title := 'Report Rejected';
            notification_message := 'Your ' || NEW.aid_type || ' aid report for ' || COALESCE(area_name, 'Unknown area') || ' has been rejected. Reason: ' || COALESCE(NEW.rejection_reason, 'No reason provided');
            notification_type := 'report_rejected';
        ELSIF NEW.status = 'flagged' THEN
            notification_title := 'Report Flagged';
            notification_message := 'Your ' || NEW.aid_type || ' aid report for ' || COALESCE(area_name, 'Unknown area') || ' has been flagged for review. Reason: ' || COALESCE(NEW.flag_reason, 'No reason provided');
            notification_type := 'report_flagged';
        ELSE
            RETURN NEW;
        END IF;
        
        -- Notify the report creator
        IF NEW.created_by IS NOT NULL THEN
            INSERT INTO public.notifications (user_id, title, message, type, related_record_id, admin_notes)
            VALUES (
                NEW.created_by,
                notification_title,
                notification_message,
                notification_type,
                NEW.id,
                CASE 
                    WHEN NEW.status = 'rejected' THEN NEW.rejection_reason
                    WHEN NEW.status = 'flagged' THEN NEW.flag_reason
                    ELSE NULL
                END
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for status change notifications
CREATE TRIGGER on_aid_record_status_change
AFTER UPDATE ON public.aid_records
FOR EACH ROW
EXECUTE FUNCTION public.notify_ngo_status_change();