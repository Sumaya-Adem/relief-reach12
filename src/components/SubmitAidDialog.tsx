import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AidType, AID_TYPE_LABELS } from '@/types/aid';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle, Calendar, MapPin, Package, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { AidTypeBadge } from './AidTypeBadge';

interface SimpleDuplicateWarning {
  aidType: AidType;
  organizationName: string;
  deliveryDate: string;
  quantity: number;
  unit: string;
  daysSinceLastAid: number;
  restrictionDays: number;
}

interface SubmitAidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedArea?: { id: string } | null;
}

export function SubmitAidDialog({ open, onOpenChange, preselectedArea }: SubmitAidDialogProps) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedAreaId, setSelectedAreaId] = useState(preselectedArea?.id || '');
  const [selectedAidType, setSelectedAidType] = useState<AidType | ''>('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [beneficiaries, setBeneficiaries] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [fieldOfficerName, setFieldOfficerName] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<SimpleDuplicateWarning | null>(null);

  // Fetch areas from Supabase
  const { data: areas = [] } = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .order('village');
      if (error) throw error;
      return data;
    },
  });

  // Check for duplicate aid
  const checkForDuplicate = async (areaId: string, aidType: AidType) => {
    if (!areaId || !aidType) return;

    const { data: existingRecords } = await supabase
      .from('aid_records')
      .select(`
        *,
        organizations (name)
      `)
      .eq('area_id', areaId)
      .eq('aid_type', aidType)
      .eq('status', 'approved')
      .order('delivery_date', { ascending: false })
      .limit(1);

    if (existingRecords && existingRecords.length > 0) {
      const lastRecord = existingRecords[0];
      const daysSince = Math.floor(
        (Date.now() - new Date(lastRecord.delivery_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Get restriction days based on aid type
      const restrictionDays: Record<string, number> = {
        water: 14,
        food: 30,
        health: 60,
        cash: 90,
      };

      const restriction = restrictionDays[aidType] || 30;

      if (daysSince < restriction) {
        setDuplicateWarning({
          aidType: aidType as AidType,
          organizationName: lastRecord.organizations?.name || 'Unknown',
          deliveryDate: lastRecord.delivery_date,
          quantity: lastRecord.quantity,
          unit: lastRecord.unit,
          daysSinceLastAid: daysSince,
          restrictionDays: restriction,
        });
        return;
      }
    }
    setDuplicateWarning(null);
  };

  const handleAidTypeChange = (type: AidType) => {
    setSelectedAidType(type);
    checkForDuplicate(selectedAreaId, type);
  };

  const handleAreaChange = (areaId: string) => {
    setSelectedAreaId(areaId);
    if (selectedAidType) {
      checkForDuplicate(areaId, selectedAidType);
    }
  };

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.organizationId || !user?.id) {
        throw new Error('You must be logged in with an organization to submit reports');
      }

      const { data, error } = await supabase
        .from('aid_records')
        .insert({
          area_id: selectedAreaId,
          organization_id: profile.organizationId,
          created_by: user.id,
          aid_type: selectedAidType as AidType,
          quantity: parseInt(quantity),
          unit: unit,
          beneficiary_count: beneficiaries ? parseInt(beneficiaries) : null,
          delivery_date: deliveryDate,
          notes: notes || null,
          field_officer_name: fieldOfficerName || null,
          is_duplicate_warning: !!duplicateWarning,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Report submitted",
        description: "Your aid delivery report has been submitted for review.",
      });
      queryClient.invalidateQueries({ queryKey: ['aid-reports'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate();
  };

  const resetForm = () => {
    setSelectedAreaId('');
    setSelectedAidType('');
    setQuantity('');
    setUnit('');
    setBeneficiaries('');
    setDeliveryDate(format(new Date(), 'yyyy-MM-dd'));
    setNotes('');
    setFieldOfficerName('');
    setDuplicateWarning(null);
  };

  const selectedArea = areas.find(a => a.id === selectedAreaId);

  // Check if user has organization
  if (!profile?.organizationId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cannot Submit Report</DialogTitle>
            <DialogDescription>
              You must be associated with an organization to submit aid reports. Please contact an administrator.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Submit Aid Report
          </DialogTitle>
          <DialogDescription>
            Record a new aid delivery for {profile.organizationName}. The system will check for duplicates automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Location Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              Location
            </Label>
            <Select value={selectedAreaId} onValueChange={handleAreaChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent>
                {areas.map(area => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.village}, {area.district} - {area.region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedArea && (
              <p className="text-xs text-muted-foreground">
                Area ID: <span className="font-mono">{selectedArea.area_id}</span>
              </p>
            )}
          </div>

          {/* Aid Type */}
          <div className="space-y-2">
            <Label>Aid Type</Label>
            <Select value={selectedAidType} onValueChange={(v) => handleAidTypeChange(v as AidType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select aid type" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(AID_TYPE_LABELS) as AidType[]).map(type => (
                  <SelectItem key={type} value={type}>
                    {AID_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duplicate Warning */}
          {duplicateWarning && (
            <div className="bg-status-duplicate/10 border border-status-duplicate/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-status-duplicate flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    Duplicate Aid Warning
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    This area received <AidTypeBadge type={duplicateWarning.aidType} size="sm" /> aid{' '}
                    <strong>{duplicateWarning.daysSinceLastAid} days ago</strong> from{' '}
                    <strong>{duplicateWarning.organizationName}</strong>.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    The restriction period is <strong>{duplicateWarning.restrictionDays} days</strong>.
                    Consider redirecting to areas that need aid more urgently.
                  </p>
                  <div className="mt-3 p-2 bg-card rounded-md">
                    <p className="text-xs font-medium text-muted-foreground">Last delivery details:</p>
                    <p className="text-sm mt-1">
                      {duplicateWarning.quantity} {duplicateWarning.unit} •{' '}
                      {format(parseISO(duplicateWarning.deliveryDate), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                placeholder="e.g., 5000"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Input
                placeholder="e.g., kg, liters"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Beneficiaries */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              Number of Beneficiaries
            </Label>
            <Input
              type="number"
              placeholder="e.g., 500"
              value={beneficiaries}
              onChange={(e) => setBeneficiaries(e.target.value)}
            />
          </div>

          {/* Field Officer Name */}
          <div className="space-y-2">
            <Label>Field Officer Name</Label>
            <Input
              placeholder="Name of the field officer"
              value={fieldOfficerName}
              onChange={(e) => setFieldOfficerName(e.target.value)}
            />
          </div>

          {/* Delivery Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Delivery Date
            </Label>
            <Input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Any additional information..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={submitMutation.isPending || !selectedAreaId || !selectedAidType || !quantity || !unit}
              variant={duplicateWarning ? 'warning' : 'default'}
            >
              {submitMutation.isPending ? 'Submitting...' : duplicateWarning ? 'Submit Anyway' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
