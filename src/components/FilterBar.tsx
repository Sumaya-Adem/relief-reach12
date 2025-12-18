import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Map, Table, Filter, RotateCcw } from 'lucide-react';
import { AidType, AID_TYPE_LABELS } from '@/types/aid';
import { organizations } from '@/data/mockData';

interface FilterBarProps {
  viewMode: 'map' | 'table';
  onViewModeChange: (mode: 'map' | 'table') => void;
  filters: {
    aidType: string;
    organization: string;
    timePeriod: string;
    status: string;
  };
  onFiltersChange: (filters: { aidType: string; organization: string; timePeriod: string; status: string }) => void;
}

export function FilterBar({ viewMode, onViewModeChange, filters, onFiltersChange }: FilterBarProps) {
  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    onFiltersChange({ aidType: 'all', organization: 'all', timePeriod: '30', status: 'all' });
  };

  return (
    <div className="bg-card rounded-lg border border-border p-3 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* View Toggle */}
        <div className="flex rounded-lg border border-secondary/30 overflow-hidden" style={{ backgroundColor: '#dbeafe' }}>
          <Button
            variant={viewMode === 'map' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-none flex-1 sm:flex-none"
            onClick={() => onViewModeChange('map')}
          >
            <Map className="w-4 h-4 mr-1.5" />
            Map
          </Button>
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-none flex-1 sm:flex-none"
            onClick={() => onViewModeChange('table')}
          >
            <Table className="w-4 h-4 mr-1.5" />
            Table
          </Button>
        </div>

        {/* Filters */}
        <div className="flex-1 flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters:</span>
          </div>

          <Select value={filters.aidType} onValueChange={(v) => handleFilterChange('aidType', v)}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Aid Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {(Object.keys(AID_TYPE_LABELS) as AidType[]).map(type => (
                <SelectItem key={type} value={type}>{AID_TYPE_LABELS[type]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.organization} onValueChange={(v) => handleFilterChange('organization', v)}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Organization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              {organizations.map(org => (
                <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.timePeriod} onValueChange={(v) => handleFilterChange('timePeriod', v)}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="ghost" size="sm" onClick={handleReset} className="h-9">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
