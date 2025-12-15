import { useState } from 'react';
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
import { Area, AidType, AID_TYPE_LABELS, DuplicateWarning } from '@/types/aid';
import { areas, organizations } from '@/data/mockData';
import { checkDuplicateAid } from '@/lib/aidEngine';
import { AlertTriangle, Calendar, MapPin, Building2, Package, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { AidTypeBadge } from './AidTypeBadge';

interface SubmitAidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedArea?: Area | null;
}

export function SubmitAidDialog({ open, onOpenChange, preselectedArea }: SubmitAidDialogProps) {
  const [selectedAreaId, setSelectedAreaId] = useState(preselectedArea?.id || '');
  const [selectedAidType, setSelectedAidType] = useState<AidType | ''>('');
  const [organizationId, setOrganizationId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [beneficiaries, setBeneficiaries] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateWarning | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAidTypeChange = (type: AidType) => {
    setSelectedAidType(type);
    
    // Check for duplicates
    if (selectedAreaId && type) {
      const area = areas.find(a => a.id === selectedAreaId);
      if (area) {
        const warning = checkDuplicateAid(area, type, new Date(deliveryDate));
        setDuplicateWarning(warning);
      }
    }
  };

  const handleAreaChange = (areaId: string) => {
    setSelectedAreaId(areaId);
    
    // Re-check duplicates if aid type is selected
    if (selectedAidType) {
      const area = areas.find(a => a.id === areaId);
      if (area) {
        const warning = checkDuplicateAid(area, selectedAidType, new Date(deliveryDate));
        setDuplicateWarning(warning);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Aid report submitted",
        description: "Your aid delivery has been recorded successfully.",
      });
      setIsSubmitting(false);
      onOpenChange(false);
      resetForm();
    }, 1000);
  };

  const resetForm = () => {
    setSelectedAreaId('');
    setSelectedAidType('');
    setOrganizationId('');
    setQuantity('');
    setUnit('');
    setBeneficiaries('');
    setDeliveryDate(format(new Date(), 'yyyy-MM-dd'));
    setNotes('');
    setDuplicateWarning(null);
  };

  const selectedArea = areas.find(a => a.id === selectedAreaId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Submit Aid Report
          </DialogTitle>
          <DialogDescription>
            Record a new aid delivery. The system will check for duplicates automatically.
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
                Area ID: <span className="font-mono">{selectedArea.id}</span>
              </p>
            )}
          </div>

          {/* Organization */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4" />
              Organization
            </Label>
            <Select value={organizationId} onValueChange={setOrganizationId}>
              <SelectTrigger>
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map(org => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                    <strong>{duplicateWarning.existingRecord.organizationName}</strong>.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    The restriction period is <strong>{duplicateWarning.restrictionDays} days</strong>.
                    Consider redirecting to areas that need aid more urgently.
                  </p>
                  <div className="mt-3 p-2 bg-card rounded-md">
                    <p className="text-xs font-medium text-muted-foreground">Last delivery details:</p>
                    <p className="text-sm mt-1">
                      {duplicateWarning.existingRecord.quantity} {duplicateWarning.existingRecord.unit} •{' '}
                      {format(parseISO(duplicateWarning.existingRecord.deliveryDate), 'MMMM d, yyyy')}
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
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Input
                placeholder="e.g., kg, liters"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
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
              disabled={isSubmitting || !selectedAreaId || !selectedAidType || !organizationId}
              variant={duplicateWarning ? 'warning' : 'default'}
            >
              {isSubmitting ? 'Submitting...' : duplicateWarning ? 'Submit Anyway' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
