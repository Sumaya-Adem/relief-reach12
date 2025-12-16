import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Settings, Save } from 'lucide-react';
import { AID_TYPE_LABELS, AID_TYPE_ICONS } from '@/types/aid';

interface RestrictionRule {
  id: string;
  aid_type: 'water' | 'food' | 'health' | 'cash';
  restriction_days: number;
  description: string | null;
  is_active: boolean;
  updated_at: string;
}

export function RulesTab() {
  const [rules, setRules] = useState<RestrictionRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRules = async () => {
    const { data, error } = await supabase
      .from('aid_restriction_rules')
      .select('*')
      .order('restriction_days');

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      setRules(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleEdit = (rule: RestrictionRule) => {
    setEditingRule(rule.id);
    setEditValue(rule.restriction_days);
  };

  const handleSave = async (rule: RestrictionRule) => {
    if (editValue < 1 || editValue > 365) {
      toast({ variant: 'destructive', title: 'Error', description: 'Restriction days must be between 1 and 365' });
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from('aid_restriction_rules')
      .update({
        restriction_days: editValue,
        updated_by: user?.id,
      })
      .eq('id', rule.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Success', description: `${AID_TYPE_LABELS[rule.aid_type]} restriction updated to ${editValue} days` });
      setEditingRule(null);
      fetchRules();
    }
    setIsSaving(false);
  };

  const toggleActive = async (rule: RestrictionRule) => {
    const { error } = await supabase
      .from('aid_restriction_rules')
      .update({
        is_active: !rule.is_active,
        updated_by: user?.id,
      })
      .eq('id', rule.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      fetchRules();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="admin-card-yellow border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Aid Restriction Rules
        </CardTitle>
        <CardDescription>
          Configure the time period (in days) before the same aid type can be delivered to the same area.
          This prevents duplicate aid distribution.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aid Type</TableHead>
              <TableHead>Restriction Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{AID_TYPE_ICONS[rule.aid_type]}</span>
                    <div>
                      <p className="font-medium">{AID_TYPE_LABELS[rule.aid_type]}</p>
                      {rule.description && (
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {editingRule === rule.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        value={editValue}
                        onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">days</span>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-base">
                      {rule.restriction_days} days
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    className={rule.is_active 
                      ? 'bg-pastel-green text-green-800 border-0 cursor-pointer' 
                      : 'bg-muted text-muted-foreground cursor-pointer'}
                    onClick={() => toggleActive(rule)}
                  >
                    {rule.is_active ? 'Active' : 'Disabled'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {editingRule === rule.id ? (
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingRule(null)}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSave(rule)}
                        disabled={isSaving}
                      >
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleEdit(rule)}>
                      Edit
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">How Restriction Rules Work</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• When submitting aid, the system checks if the same aid type was delivered within the restriction period</li>
            <li>• If a recent delivery exists, a duplicate warning is shown with the previous delivery details</li>
            <li>• Disabled rules will not trigger duplicate warnings for that aid type</li>
            <li>• Adjust these values based on your organization's policies and regional needs</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
