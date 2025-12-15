import { useEffect, useRef, useState } from 'react';
import { Area, AreaStatus } from '@/types/aid';
import { cn } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import { AidTypeBadge } from './AidTypeBadge';
import { X, MapPin, Users, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { format, parseISO } from 'date-fns';
import { getMissingAidTypes } from '@/lib/aidEngine';

interface MapViewProps {
  areas: Area[];
  selectedArea: Area | null;
  onAreaSelect: (area: Area | null) => void;
  filters: {
    aidType: string;
    organization: string;
    timePeriod: string;
  };
}

const statusColors: Record<AreaStatus, string> = {
  'not-aided': '#E63946',
  'partially-aided': '#F4A261',
  'fully-aided': '#2E8B57',
  'duplicate-warning': '#E9C46A',
};

export function MapView({ areas, selectedArea, onAreaSelect, filters }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Calculate bounds for Somalia region
  const bounds = {
    minLat: 1.5,
    maxLat: 9,
    minLng: 41,
    maxLng: 49,
  };

  const projectPoint = (lat: number, lng: number) => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * dimensions.width;
    const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * dimensions.height;
    return { x, y };
  };

  return (
    <div className="relative h-full w-full bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg overflow-hidden">
      {/* Map Container */}
      <div 
        ref={containerRef} 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, hsl(var(--primary) / 0.05) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, hsl(var(--secondary) / 0.05) 0%, transparent 50%)
          `,
        }}
      >
        {/* Grid lines for visual reference */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Area Markers */}
        {dimensions.width > 0 && areas.map((area) => {
          const point = projectPoint(area.latitude, area.longitude);
          const isSelected = selectedArea?.id === area.id;
          
          return (
            <button
              key={area.id}
              className={cn(
                'absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full',
                isSelected && 'scale-125 z-10'
              )}
              style={{ left: point.x, top: point.y }}
              onClick={() => onAreaSelect(isSelected ? null : area)}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-full border-2 border-card shadow-lg',
                  'flex items-center justify-center',
                  isSelected && 'ring-4 ring-ring/30'
                )}
                style={{ backgroundColor: statusColors[area.status] }}
              >
                {area.status === 'duplicate-warning' && (
                  <span className="text-xs">!</span>
                )}
              </div>
              <div className={cn(
                'absolute -bottom-6 left-1/2 transform -translate-x-1/2',
                'text-xs font-medium text-foreground whitespace-nowrap',
                'bg-card/90 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-sm',
                !isSelected && 'hidden'
              )}>
                {area.village}
              </div>
            </button>
          );
        })}
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <p className="text-xs font-medium text-muted-foreground mb-2">Legend</p>
        <div className="space-y-1.5">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full border border-card"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-foreground capitalize">
                {status.replace('-', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Area Panel */}
      {selectedArea && (
        <div className="absolute top-4 right-4 w-80 max-w-[calc(100%-2rem)] bg-card rounded-lg shadow-xl animate-slide-in-right overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{selectedArea.village}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedArea.district}, {selectedArea.region}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => onAreaSelect(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="mt-2">
              <StatusBadge status={selectedArea.status} />
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Area Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">ID:</span>
                <span className="font-mono text-xs">{selectedArea.id}</span>
              </div>
              {selectedArea.population && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedArea.population.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Missing Aid Types */}
            {selectedArea.status !== 'fully-aided' && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Missing Aid Types</p>
                <div className="flex flex-wrap gap-1.5">
                  {getMissingAidTypes(selectedArea).map(type => (
                    <AidTypeBadge key={type} type={type} size="sm" />
                  ))}
                </div>
              </div>
            )}

            {/* Recent Aid Records */}
            {selectedArea.aidRecords.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Recent Aid Deliveries</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedArea.aidRecords.slice(0, 3).map(record => (
                    <div key={record.id} className="bg-muted/50 rounded-md p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <AidTypeBadge type={record.aidType} size="sm" />
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(parseISO(record.deliveryDate), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <p className="text-xs text-foreground">{record.organizationName}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.quantity} {record.unit} • {record.beneficiaries} beneficiaries
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedArea.aidRecords.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No aid records found</p>
                <p className="text-xs text-destructive mt-1">This area needs immediate attention</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
