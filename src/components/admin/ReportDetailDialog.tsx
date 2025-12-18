import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  Check, X, Flag, Download, MapPin, Building2, Calendar, 
  Users, User, FileText, Clock, AlertTriangle, History
} from 'lucide-react';
import { format } from 'date-fns';
import { AidTypeBadge } from '@/components/AidTypeBadge';
import type { Database } from '@/integrations/supabase/types';

type AidType = Database['public']['Enums']['aid_type'];
type ReportStatus = Database['public']['Enums']['report_status'];

interface AidReport {
  id: string;
  aid_type: AidType;
  quantity: number;
  unit: string;
  delivery_date: string;
  status: ReportStatus;
  beneficiary_count: number | null;
  field_officer_name: string | null;
  is_duplicate_warning: boolean;
  created_at: string;
  notes: string | null;
  rejection_reason: string | null;
  flagged: boolean;
  flag_reason: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  organization: { id: string; name: string } | null;
  area: { id: string; village: string; district: string; region: string; latitude?: number; longitude?: number } | null;
}

interface ActionLog {
  id: string;
  action: string;
  previous_status: ReportStatus | null;
  new_status: ReportStatus | null;
  notes: string | null;
  created_at: string;
  admin_id: string;
}

interface ReportDetailDialogProps {
  report: AidReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReportUpdated: () => void;
}

const statusColors: Record<ReportStatus | 'duplicate', string> = {
  pending: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
  approved: 'bg-blue-500/20 text-blue-700 border-blue-500/30',
  rejected: 'bg-red-500/20 text-red-700 border-red-500/30',
  flagged: 'bg-purple-500/20 text-purple-700 border-purple-500/30',
  duplicate: 'bg-orange-500/20 text-orange-700 border-orange-500/30',
};

export function ReportDetailDialog({ report, open, onOpenChange, onReportUpdated }: ReportDetailDialogProps) {
  const { user } = useAuth();
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [flagReason, setFlagReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showFlagForm, setShowFlagForm] = useState(false);

  useEffect(() => {
    if (report && open) {
      fetchActionLogs();
      setNotes('');
      setRejectionReason('');
      setFlagReason('');
      setShowRejectForm(false);
      setShowFlagForm(false);
    }
  }, [report, open]);

  const fetchActionLogs = async () => {
    if (!report) return;
    const { data } = await supabase
      .from('admin_action_logs')
      .select('*')
      .eq('aid_record_id', report.id)
      .order('created_at', { ascending: false });
    if (data) setActionLogs(data);
  };

  const logAction = async (action: string, previousStatus: ReportStatus | null, newStatus: ReportStatus | null, actionNotes: string | null) => {
    if (!report || !user) return;
    await supabase.from('admin_action_logs').insert({
      aid_record_id: report.id,
      admin_id: user.id,
      action,
      previous_status: previousStatus,
      new_status: newStatus,
      notes: actionNotes,
    });
  };

  const handleApprove = async () => {
    if (!report || !user) return;
    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('aid_records')
      .update({
        status: 'approved' as ReportStatus,
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      })
      .eq('id', report.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to approve report', variant: 'destructive' });
    } else {
      await logAction('approved', report.status, 'approved', notes || null);
      toast({ title: 'Success', description: 'Report approved successfully' });
      onReportUpdated();
    }
    setIsSubmitting(false);
  };

  const handleReject = async () => {
    if (!report || !user || !rejectionReason.trim()) {
      toast({ title: 'Error', description: 'Rejection reason is required', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);

    const { error } = await supabase
      .from('aid_records')
      .update({
        status: 'rejected' as ReportStatus,
        rejection_reason: rejectionReason,
      })
      .eq('id', report.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to reject report', variant: 'destructive' });
    } else {
      await logAction('rejected', report.status, 'rejected', rejectionReason);
      toast({ title: 'Success', description: 'Report rejected' });
      onReportUpdated();
    }
    setIsSubmitting(false);
  };

  const handleFlag = async () => {
    if (!report || !user) return;
    setIsSubmitting(true);

    const { error } = await supabase
      .from('aid_records')
      .update({
        status: 'flagged' as ReportStatus,
        flagged: true,
        flag_reason: flagReason || null,
      })
      .eq('id', report.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to flag report', variant: 'destructive' });
    } else {
      await logAction('flagged', report.status, 'flagged', flagReason || null);
      toast({ title: 'Success', description: 'Report flagged for follow-up' });
      onReportUpdated();
    }
    setIsSubmitting(false);
  };

  const handleDownloadPDF = () => {
    // Simple text-based report generation
    if (!report) return;
    const content = `
AID REPORT
==========

Organization: ${report.organization?.name || 'Unknown'}
Aid Type: ${report.aid_type}
Quantity: ${report.quantity} ${report.unit}
Location: ${report.area?.village}, ${report.area?.district}, ${report.area?.region}
Delivery Date: ${format(new Date(report.delivery_date), 'MMMM d, yyyy')}
Beneficiaries: ${report.beneficiary_count || 'Not specified'}
Field Officer: ${report.field_officer_name || 'Not specified'}
Status: ${report.status}
Notes: ${report.notes || 'None'}

Generated on: ${format(new Date(), 'MMMM d, yyyy HH:mm')}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${report.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded', description: 'Report downloaded successfully' });
  };

  if (!report) return null;

  const getDisplayStatus = (): ReportStatus | 'duplicate' => {
    if (report.is_duplicate_warning) return 'duplicate';
    return report.status;
  };

  const isReadOnly = report.status === 'approved';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Report Details</span>
            <Badge variant="outline" className={statusColors[getDisplayStatus()]}>
              {getDisplayStatus().charAt(0).toUpperCase() + getDisplayStatus().slice(1)}
            </Badge>
            {isReadOnly && (
              <Badge variant="secondary" className="ml-2">Read Only</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Organization & Aid Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Organization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{report.organization?.name || 'Unknown'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Aid Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex items-center gap-2">
                  <AidTypeBadge type={report.aid_type} />
                  <span>{report.quantity} {report.unit}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Location & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{report.area?.village}</p>
                <p className="text-sm text-muted-foreground">{report.area?.district}, {report.area?.region}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-sm">
                  <span className="text-muted-foreground">Delivery:</span>{' '}
                  {format(new Date(report.delivery_date), 'MMM d, yyyy')}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Submitted:</span>{' '}
                  {format(new Date(report.created_at), 'MMM d, yyyy HH:mm')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Beneficiaries & Field Officer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Beneficiaries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{report.beneficiary_count || 'Not specified'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Field Officer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{report.field_officer_name || 'Not specified'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {report.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{report.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Duplicate Warning */}
          {report.is_duplicate_warning && (
            <Card className="border-orange-500/30 bg-orange-500/5">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Duplicate Aid Warning</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  This delivery may overlap with previous aid in this area.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Rejection Reason */}
          {report.rejection_reason && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="pt-4">
                <p className="text-sm font-medium text-red-700">Rejection Reason:</p>
                <p className="text-sm text-muted-foreground">{report.rejection_reason}</p>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Action Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="h-4 w-4" />
                Action History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {actionLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No actions recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {actionLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p>
                          <span className="font-medium capitalize">{log.action}</span>
                          {log.previous_status && log.new_status && (
                            <span className="text-muted-foreground">
                              {' '}({log.previous_status} → {log.new_status})
                            </span>
                          )}
                        </p>
                        {log.notes && <p className="text-muted-foreground">{log.notes}</p>}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin Actions */}
          {!isReadOnly && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium">Admin Actions</h4>
                
                {/* Quick notes for approval */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Notes (optional)</label>
                  <Textarea
                    placeholder="Add notes for this action..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Reject Form */}
                {showRejectForm && (
                  <div className="space-y-2 p-3 border border-red-500/30 rounded-lg bg-red-500/5">
                    <label className="text-sm font-medium text-red-700">Rejection Reason (required)</label>
                    <Textarea
                      placeholder="Explain why this report is being rejected..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button variant="destructive" size="sm" onClick={handleReject} disabled={isSubmitting}>
                        Confirm Rejection
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowRejectForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Flag Form */}
                {showFlagForm && (
                  <div className="space-y-2 p-3 border border-blue-500/30 rounded-lg bg-blue-500/5">
                    <label className="text-sm font-medium text-blue-700">Flag Reason (optional)</label>
                    <Textarea
                      placeholder="Explain why this report needs follow-up..."
                      value={flagReason}
                      onChange={(e) => setFlagReason(e.target.value)}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleFlag} disabled={isSubmitting} className="border-blue-500 text-blue-700">
                        Confirm Flag
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowFlagForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {!showRejectForm && !showFlagForm && (
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleApprove} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button variant="destructive" onClick={() => setShowRejectForm(true)} disabled={isSubmitting}>
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button variant="outline" onClick={() => setShowFlagForm(true)} disabled={isSubmitting}>
                      <Flag className="h-4 w-4 mr-2" />
                      Flag for Follow-up
                    </Button>
                    <Button variant="outline" onClick={handleDownloadPDF}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
