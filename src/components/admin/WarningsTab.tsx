import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Check, Eye } from 'lucide-react';
import { AID_TYPE_LABELS, AID_TYPE_ICONS } from '@/types/aid';
import { format } from 'date-fns';

interface DuplicateWarning {
  id: string;
  warning_reason: string;
  acknowledged: boolean;
  acknowledged_at: string | null;
  created_at: string;
  aid_record: {
    id: string;
    aid_type: 'water' | 'food' | 'health' | 'cash';
    quantity: number;
    unit: string;
    delivery_date: string;
    organizations: { name: string } | null;
    areas: { village: string; district: string; region: string } | null;
  } | null;
  previous_record: {
    id: string;
    aid_type: 'water' | 'food' | 'health' | 'cash';
    quantity: number;
    unit: string;
    delivery_date: string;
    organizations: { name: string } | null;
  } | null;
}

export function WarningsTab() {
  const [warnings, setWarnings] = useState<DuplicateWarning[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'acknowledged'>('pending');
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchWarnings = async () => {
    let query = supabase
      .from('duplicate_warnings')
      .select(`
        *,
        aid_record:aid_records!duplicate_warnings_aid_record_id_fkey (
          id, aid_type, quantity, unit, delivery_date,
          organizations (name),
          areas (village, district, region)
        ),
        previous_record:aid_records!duplicate_warnings_previous_record_id_fkey (
          id, aid_type, quantity, unit, delivery_date,
          organizations (name)
        )
      `)
      .order('created_at', { ascending: false });

    if (filter === 'pending') {
      query = query.eq('acknowledged', false);
    } else if (filter === 'acknowledged') {
      query = query.eq('acknowledged', true);
    }

    const { data, error } = await query;

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      setWarnings(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchWarnings();
  }, [filter]);

  const acknowledgeWarning = async (warningId: string) => {
    const { error } = await supabase
      .from('duplicate_warnings')
      .update({
        acknowledged: true,
        acknowledged_by: user?.id,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', warningId);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Success', description: 'Warning acknowledged' });
      fetchWarnings();
    }
  };

  const pendingCount = warnings.filter(w => !w.acknowledged).length;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="admin-card-orange border-2">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-status-duplicate" />
              Duplicate Warnings
              {pendingCount > 0 && (
                <Badge className="bg-pastel-orange text-orange-800 border-0">{pendingCount} pending</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Review and acknowledge duplicate aid delivery warnings
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              Pending
            </Button>
            <Button
              variant={filter === 'acknowledged' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('acknowledged')}
            >
              Acknowledged
            </Button>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {warnings.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {filter === 'pending' 
                ? 'No pending warnings. Great work!' 
                : 'No warnings found.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Duplicate Delivery</TableHead>
                <TableHead>Previous Delivery</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warnings.map((warning) => (
                <TableRow key={warning.id}>
                  <TableCell>
                    {warning.aid_record?.areas ? (
                      <div>
                        <p className="font-medium">{warning.aid_record.areas.village}</p>
                        <p className="text-sm text-muted-foreground">
                          {warning.aid_record.areas.district}, {warning.aid_record.areas.region}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unknown</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {warning.aid_record && (
                      <div>
                        <div className="flex items-center gap-1">
                          <span>{AID_TYPE_ICONS[warning.aid_record.aid_type]}</span>
                          <span className="font-medium">{AID_TYPE_LABELS[warning.aid_record.aid_type]}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {warning.aid_record.quantity} {warning.aid_record.unit}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {warning.aid_record.organizations?.name} • {format(new Date(warning.aid_record.delivery_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {warning.previous_record && (
                      <div>
                        <p className="text-sm">
                          {warning.previous_record.quantity} {warning.previous_record.unit}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {warning.previous_record.organizations?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(warning.previous_record.delivery_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {warning.acknowledged ? (
                      <Badge className="bg-pastel-blue text-blue-800 border-0">
                        <Check className="h-3 w-3 mr-1" />
                        Acknowledged
                      </Badge>
                    ) : (
                      <Badge className="bg-pastel-orange text-orange-800 border-0">
                        <Eye className="h-3 w-3 mr-1" />
                        Pending Review
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!warning.acknowledged && (
                      <Button
                        size="sm"
                        onClick={() => acknowledgeWarning(warning.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Acknowledge
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
