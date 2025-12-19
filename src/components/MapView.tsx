import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Area, AreaStatus } from '@/types/aid';
import { cn } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import { AidTypeBadge } from './AidTypeBadge';
import { X, MapPin, Users, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { format, parseISO } from 'date-fns';
import { getMissingAidTypes } from '@/lib/aidEngine';
import 'leaflet/dist/leaflet.css';

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
  'fully-aided': '#22C55E',
  'duplicate-warning': '#E9C46A',
};

export function MapView({ areas, selectedArea, onAreaSelect, filters }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Somalia center coordinates
    const center: L.LatLngExpression = [5.15, 46.2];

    mapInstanceRef.current = L.map(mapRef.current).setView(center, 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when areas change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    areas.forEach((area) => {
      const isSelected = selectedArea?.id === area.id;
      
      const marker = L.circleMarker([area.latitude, area.longitude], {
        radius: isSelected ? 12 : 8,
        fillColor: statusColors[area.status],
        fillOpacity: 0.8,
        color: isSelected ? '#1E3A5F' : '#fff',
        weight: isSelected ? 3 : 2,
      }).addTo(mapInstanceRef.current!);

      marker.bindPopup(`
        <div style="font-size: 14px;">
          <p style="font-weight: 600; margin: 0;">${area.village}</p>
          <p style="color: #666; margin: 0;">${area.district}, ${area.region}</p>
        </div>
      `);

      marker.on('click', () => {
        onAreaSelect(isSelected ? null : area);
      });

      markersRef.current.push(marker);
    });
  }, [areas, selectedArea, onAreaSelect]);

  // Pan to selected area
  useEffect(() => {
    if (selectedArea && mapInstanceRef.current) {
      mapInstanceRef.current.setView([selectedArea.latitude, selectedArea.longitude], 10, { animate: true });
    }
  }, [selectedArea]);

  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden">
      {/* Leaflet Map Container */}
      <div ref={mapRef} className="h-full w-full z-0" />

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
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
        <div className="absolute top-4 right-4 w-80 max-w-[calc(100%-2rem)] bg-card rounded-lg shadow-xl animate-slide-in-right overflow-hidden z-[1000]">
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
