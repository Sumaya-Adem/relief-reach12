import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
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
  'fully-aided': '#2E8B57',
  'duplicate-warning': '#E9C46A',
};

// Component to handle map center changes
function MapController({ selectedArea }: { selectedArea: Area | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedArea) {
      map.setView([selectedArea.latitude, selectedArea.longitude], 10, { animate: true });
    }
  }, [selectedArea, map]);
  
  return null;
}

export function MapView({ areas, selectedArea, onAreaSelect, filters }: MapViewProps) {
  // Somalia center coordinates
  const center: [number, number] = [5.15, 46.2];

  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden">
      {/* Leaflet Map Container */}
      <MapContainer
        center={center}
        zoom={6}
        className="h-full w-full z-0"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController selectedArea={selectedArea} />
        
        {/* Area Markers */}
        {areas.map((area) => {
          const isSelected = selectedArea?.id === area.id;
          
          return (
            <CircleMarker
              key={area.id}
              center={[area.latitude, area.longitude]}
              radius={isSelected ? 12 : 8}
              pathOptions={{
                fillColor: statusColors[area.status],
                fillOpacity: 0.8,
                color: isSelected ? '#1E3A5F' : '#fff',
                weight: isSelected ? 3 : 2,
              }}
              eventHandlers={{
                click: () => onAreaSelect(isSelected ? null : area),
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{area.village}</p>
                  <p className="text-muted-foreground">{area.district}, {area.region}</p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

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
