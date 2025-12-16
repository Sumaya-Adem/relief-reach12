import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Header } from '@/components/Header';
import { BottomNavigation } from '@/components/BottomNavigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { MapPin, Calendar, Building2, Package, Clock, CheckCircle, XCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import { AidTypeBadge } from '@/components/AidTypeBadge';
import { NgoReportDetailDialog } from '@/components/NgoReportDetailDialog';
import { cn } from '@/lib/utils';

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 border-green-300',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 border-red-300',
  },
  flagged: {
    label: 'Flagged',
    icon: AlertTriangle,
    className: 'bg-orange-100 text-orange-800 border-orange-300',
  },
};

export default function Reports() {
  const { profile, isAdmin } = useAuth();
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const { data: reports, isLoading } = useQuery({
    queryKey: ['aid-reports', isAdmin, profile?.organizationId],
    queryFn: async () => {
      let query = supabase
        .from('aid_records')
        .select(`
          *,
          areas (village, district, region, country),
          organizations (name)
        `)
        .order('created_at', { ascending: false });

      // NGO users only see their organization's reports
      if (!isAdmin && profile?.organizationId) {
        query = query.eq('organization_id', profile.organizationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!profile || isAdmin,
  });

  return (
    <>
      <Helmet>
        <title>Reports | Badbaado Aid Track</title>
        <meta name="description" content="View aid delivery reports and submissions." />
      </Helmet>
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">
              {isAdmin ? 'All Reports' : 'My Organization Reports'}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isAdmin 
                ? 'View all aid delivery reports from all organizations' 
                : 'View aid deliveries submitted by your organization. Tap a report to see details.'}
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : reports?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No reports found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {!isAdmin && "Submit your first aid report from the dashboard"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports?.map((report) => {
                const status = statusConfig[report.status as keyof typeof statusConfig];
                const StatusIcon = status?.icon || Clock;
                
                return (
                  <Card 
                    key={report.id} 
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedReport(report)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <AidTypeBadge type={report.aid_type} />
                            <Badge 
                              variant="outline" 
                              className={cn(
                                'text-xs flex items-center gap-1',
                                status?.className
                              )}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {status?.label || 'Unknown'}
                            </Badge>
                            {report.is_duplicate_warning && (
                              <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-300">
                                Duplicate Warning
                              </Badge>
                            )}
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate">
                                {report.areas?.village}, {report.areas?.district}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Building2 className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{report.organizations?.name}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4 flex-shrink-0" />
                              <span>Delivered: {format(new Date(report.delivery_date), 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-lg font-semibold text-foreground">
                              {report.quantity} {report.unit}
                            </p>
                            {report.beneficiary_count && (
                              <p className="text-xs text-muted-foreground">
                                {report.beneficiary_count} beneficiaries
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(report.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                      
                      {/* Show rejection/flag reason preview */}
                      {report.status === 'rejected' && report.rejection_reason && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-xs text-red-800 line-clamp-1">
                            <strong>Rejected:</strong> {report.rejection_reason}
                          </p>
                        </div>
                      )}
                      
                      {report.status === 'flagged' && report.flag_reason && (
                        <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-md">
                          <p className="text-xs text-orange-800 line-clamp-1">
                            <strong>Flagged:</strong> {report.flag_reason}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
        <BottomNavigation />
      </div>

      {/* Report Detail Dialog */}
      <NgoReportDetailDialog
        report={selectedReport}
        open={!!selectedReport}
        onOpenChange={(open) => !open && setSelectedReport(null)}
      />
    </>
  );
}
