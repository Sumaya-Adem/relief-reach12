import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { 
  MapPin, 
  Calendar, 
  Building2, 
  Package, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  FileText,
  History
} from 'lucide-react';
import { AidTypeBadge } from '@/components/AidTypeBadge';
import { cn } from '@/lib/utils';

interface ReportDetailDialogProps {
  report: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig = {
  pending: {
    label: 'Pending Review',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    description: 'Your report is awaiting admin review.',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 border-green-300',
    description: 'Your report has been verified and approved.',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 border-red-300',
    description: 'Your report was not approved. See reason below.',
  },
  flagged: {
    label: 'Flagged for Review',
    icon: AlertTriangle,
    className: 'bg-orange-100 text-orange-800 border-orange-300',
    description: 'Your report has been flagged and requires attention.',
  },
};

export function NgoReportDetailDialog({ report, open, onOpenChange }: ReportDetailDialogProps) {
  // Fetch action logs for this report
  const { data: actionLogs = [] } = useQuery({
    queryKey: ['report-action-logs', report?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_action_logs')
        .select('*')
        .eq('aid_record_id', report.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!report?.id && open,
  });

  if (!report) return null;

  const status = statusConfig[report.status as keyof typeof statusConfig];
  const StatusIcon = status?.icon || Clock;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Report Details
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="p-6 pt-4 space-y-6">
            {/* Status Section */}
            <div className={cn(
              'rounded-lg p-4 border',
              status?.className?.replace('bg-', 'bg-').replace('100', '50')
            )}>
              <div className="flex items-start gap-3">
                <StatusIcon className={cn('w-6 h-6', status?.className?.split(' ').find(c => c.startsWith('text-')))} />
                <div>
                  <Badge variant="outline" className={cn('mb-2', status?.className)}>
                    {status?.label}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{status?.description}</p>
                </div>
              </div>
            </div>

            {/* Rejection/Flag Reason */}
            {report.status === 'rejected' && report.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4" />
                  Rejection Reason
                </h4>
                <p className="text-sm text-red-700">{report.rejection_reason}</p>
              </div>
            )}

            {report.status === 'flagged' && report.flag_reason && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-medium text-orange-800 flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Flag Reason
                </h4>
                <p className="text-sm text-orange-700">{report.flag_reason}</p>
              </div>
            )}

            {/* Duplicate Warning */}
            {report.is_duplicate_warning && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-medium text-orange-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Duplicate Warning
                </h4>
                <p className="text-sm text-orange-700 mt-1">
                  This report was submitted with a duplicate aid warning.
                </p>
              </div>
            )}

            <Separator />

            {/* Aid Details */}
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Aid Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Aid Type</p>
                  <AidTypeBadge type={report.aid_type} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Quantity</p>
                  <p className="font-semibold">{report.quantity} {report.unit}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Beneficiaries</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    {report.beneficiary_count || 'Not specified'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Field Officer</p>
                  <p className="font-semibold flex items-center gap-1">
                    <User className="w-4 h-4 text-muted-foreground" />
                    {report.field_officer_name || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Location */}
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </h3>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="font-medium">
                  {report.areas?.village}, {report.areas?.district}
                </p>
                <p className="text-sm text-muted-foreground">
                  {report.areas?.region}, {report.areas?.country}
                </p>
              </div>
            </div>

            <Separator />

            {/* Dates */}
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Dates
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Delivery Date</p>
                  <p className="font-semibold">{format(new Date(report.delivery_date), 'MMMM d, yyyy')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Submitted</p>
                  <p className="font-semibold">{format(new Date(report.created_at), 'MMMM d, yyyy')}</p>
                </div>
                {report.approved_at && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Approved</p>
                    <p className="font-semibold">{format(new Date(report.approved_at), 'MMMM d, yyyy')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {report.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Notes</h3>
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                    {report.notes}
                  </p>
                </div>
              </>
            )}

            {/* Action History */}
            {actionLogs.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Admin Action History
                  </h3>
                  <div className="space-y-3">
                    {actionLogs.map((log: any) => (
                      <div key={log.id} className="bg-muted/50 rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium capitalize">{log.action}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        {log.notes && (
                          <p className="text-muted-foreground">{log.notes}</p>
                        )}
                        {log.previous_status && log.new_status && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Status: {log.previous_status} → {log.new_status}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Organization */}
            <Separator />
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Organization
              </h3>
              <p className="font-medium">{report.organizations?.name}</p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
