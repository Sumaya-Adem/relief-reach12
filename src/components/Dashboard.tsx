import { useState, useMemo } from 'react';
import { areas } from '@/data/mockData';
import { Area } from '@/types/aid';
import { StatCard } from './StatCard';
import { FilterBar } from './FilterBar';
import { MapView } from './MapView';
import { TableView } from './TableView';
import { SubmitAidDialog } from './SubmitAidDialog';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { 
  AlertCircle, 
  CheckCircle, 
  AlertTriangle, 
  Circle,
  Plus,
  Download
} from 'lucide-react';

export function Dashboard() {
  const [viewMode, setViewMode] = useState<'map' | 'table'>('map');
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [filters, setFilters] = useState({
    aidType: 'all',
    organization: 'all',
    timePeriod: '30',
  });
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  // Export data as CSV
  const handleExportData = () => {
    const headers = ['Area ID', 'Village', 'District', 'Region', 'Country', 'Status', 'Population', 'Latitude', 'Longitude'];
    
    const csvRows = [
      headers.join(','),
      ...filteredAreas.map(area => [
        area.id,
        `"${area.village}"`,
        `"${area.district}"`,
        `"${area.region}"`,
        `"${area.country}"`,
        area.status,
        area.population || '',
        area.latitude || '',
        area.longitude || ''
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `aid-data-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Data exported successfully');
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const notAided = areas.filter(a => a.status === 'not-aided').length;
    const partiallyAided = areas.filter(a => a.status === 'partially-aided').length;
    const fullyAided = areas.filter(a => a.status === 'fully-aided').length;
    const duplicateWarnings = areas.filter(a => a.status === 'duplicate-warning').length;
    const totalPopulation = areas.reduce((sum, a) => sum + (a.population || 0), 0);
    const aidedPopulation = areas
      .filter(a => a.status !== 'not-aided')
      .reduce((sum, a) => sum + (a.population || 0), 0);

    return {
      notAided,
      partiallyAided,
      fullyAided,
      duplicateWarnings,
      totalAreas: areas.length,
      totalPopulation,
      aidedPopulation,
      coveragePercent: Math.round((aidedPopulation / totalPopulation) * 100),
    };
  }, []);

  // Filter areas
  const filteredAreas = useMemo(() => {
    return areas.filter(area => {
      if (filters.aidType !== 'all') {
        const hasAidType = area.aidRecords.some(r => r.aidType === filters.aidType);
        if (!hasAidType && area.status !== 'not-aided') return false;
      }
      
      if (filters.organization !== 'all') {
        const hasOrg = area.aidRecords.some(r => r.organizationId === filters.organization);
        if (!hasOrg) return false;
      }
      
      return true;
    });
  }, [filters]);

  return (
    <div className="min-h-screen bg-background">
      {/* Stats Bar */}
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatCard
            title="Not Aided"
            value={stats.notAided}
            subtitle="Urgent attention needed"
            icon={Circle}
            variant="unaided"
          />
          <StatCard
            title="Partially Aided"
            value={stats.partiallyAided}
            subtitle="Missing some aid types"
            icon={AlertCircle}
            variant="partial"
          />
          <StatCard
            title="Fully Aided"
            value={stats.fullyAided}
            subtitle="All aid types covered"
            icon={CheckCircle}
            variant="aided"
          />
          <StatCard
            title="Duplicate Alerts"
            value={stats.duplicateWarnings}
            subtitle="Requires review"
            icon={AlertTriangle}
            variant="duplicate"
          />
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Button 
            onClick={() => setIsSubmitDialogOpen(true)}
            className="flex-1 sm:flex-none bg-[#2E8B57] hover:bg-[#2E8B57]/90 text-white"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Submit Aid Report
          </Button>
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-1.5" />
            Export Data
          </Button>
          <div className="flex-1 hidden sm:block" />
          <div className="text-sm text-muted-foreground flex items-center gap-2 justify-center sm:justify-end">
            <span className="font-medium text-foreground">{stats.coveragePercent}%</span>
            <span>population coverage</span>
            <span className="text-xs">({stats.aidedPopulation.toLocaleString()} / {stats.totalPopulation.toLocaleString()})</span>
          </div>
        </div>

        {/* Filters */}
        <FilterBar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-6">
        <div className="h-[calc(100vh-360px)] min-h-[400px]">
          {viewMode === 'map' ? (
            <MapView
              areas={filteredAreas}
              selectedArea={selectedArea}
              onAreaSelect={setSelectedArea}
              filters={filters}
            />
          ) : (
            <TableView
              areas={filteredAreas}
              onAreaSelect={(area) => setSelectedArea(area)}
            />
          )}
        </div>
      </div>

      {/* Submit Aid Dialog */}
      <SubmitAidDialog
        open={isSubmitDialogOpen}
        onOpenChange={setIsSubmitDialogOpen}
        preselectedArea={selectedArea}
      />
    </div>
  );
}
