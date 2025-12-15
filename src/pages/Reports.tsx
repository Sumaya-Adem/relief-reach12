import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Header } from '@/components/Header';
import { BottomNavigation } from '@/components/BottomNavigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { MapPin, Calendar, Building2, Package } from 'lucide-react';
import { AidTypeBadge } from '@/components/AidTypeBadge';

export default function Reports() {
  const { profile, isAdmin } = useAuth();

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
                : 'View aid deliveries submitted by your organization'}
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : reports?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No reports found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports?.map((report) => (
                <Card key={report.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <AidTypeBadge type={report.aid_type} />
                          {report.is_duplicate_warning && (
                            <Badge variant="destructive" className="text-xs">
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
                            <span>{format(new Date(report.delivery_date), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-semibold text-foreground">
                          {report.quantity} {report.unit}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(report.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    
                    {report.notes && (
                      <p className="mt-3 text-sm text-muted-foreground border-t pt-3">
                        {report.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
        <BottomNavigation />
      </div>
    </>
  );
}
