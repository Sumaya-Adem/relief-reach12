import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Filter, Eye, MapPin, Building2, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { AidTypeBadge } from '@/components/AidTypeBadge';
import { ReportDetailDialog } from './ReportDetailDialog';
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
  organization: { id: string; name: string } | null;
  area: { id: string; village: string; district: string; region: string } | null;
}

const statusColors: Record<ReportStatus | 'duplicate', string> = {
  pending: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
  approved: 'bg-green-500/20 text-green-700 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-700 border-red-500/30',
  flagged: 'bg-blue-500/20 text-blue-700 border-blue-500/30',
  duplicate: 'bg-orange-500/20 text-orange-700 border-orange-500/30',
};

export function ReportsTab() {
  const [reports, setReports] = useState<AidReport[]>([]);
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<AidReport | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [aidTypeFilter, setAidTypeFilter] = useState<string>('all');

  const fetchReports = async () => {
    setIsLoading(true);
    let query = supabase
      .from('aid_records')
      .select(`
        *,
        organization:organizations(id, name),
        area:areas(id, village, district, region)
      `)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      if (statusFilter === 'duplicate') {
        query = query.eq('is_duplicate_warning', true);
      } else {
        query = query.eq('status', statusFilter as ReportStatus);
      }
    }

    if (orgFilter !== 'all') {
      query = query.eq('organization_id', orgFilter);
    }

    if (aidTypeFilter !== 'all') {
      query = query.eq('aid_type', aidTypeFilter as AidType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching reports:', error);
    } else {
      let filtered = data as AidReport[];
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (r) =>
            r.organization?.name.toLowerCase().includes(search) ||
            r.area?.village.toLowerCase().includes(search) ||
            r.area?.district.toLowerCase().includes(search) ||
            r.area?.region.toLowerCase().includes(search)
        );
      }
      setReports(filtered);
    }
    setIsLoading(false);
  };

  const fetchOrganizations = async () => {
    const { data } = await supabase.from('organizations').select('id, name').eq('is_active', true);
    if (data) setOrganizations(data);
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [statusFilter, orgFilter, aidTypeFilter, searchQuery]);

  const getDisplayStatus = (report: AidReport): ReportStatus | 'duplicate' => {
    if (report.is_duplicate_warning) return 'duplicate';
    return report.status;
  };

  const handleViewReport = (report: AidReport) => {
    setSelectedReport(report);
    setDialogOpen(true);
  };

  const handleReportUpdated = () => {
    fetchReports();
    setDialogOpen(false);
    setSelectedReport(null);
  };

  if (isLoading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="admin-card-purple border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search NGO or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="duplicate">Duplicate</SelectItem>
              </SelectContent>
            </Select>
            <Select value={orgFilter} onValueChange={setOrgFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={aidTypeFilter} onValueChange={setAidTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Aid Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="water">Water</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card className="admin-card-pink border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            NGO Aid Reports ({reports.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {reports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No reports found matching your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NGO</TableHead>
                    <TableHead>Aid Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Beneficiaries</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{report.organization?.name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <AidTypeBadge type={report.aid_type} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {report.area?.village}, {report.area?.district}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{report.beneficiary_count || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{format(new Date(report.delivery_date), 'MMM d, yyyy')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[getDisplayStatus(report)]}>
                          {getDisplayStatus(report).charAt(0).toUpperCase() + getDisplayStatus(report).slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewReport(report)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Detail Dialog */}
      <ReportDetailDialog
        report={selectedReport}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onReportUpdated={handleReportUpdated}
      />
    </div>
  );
}
