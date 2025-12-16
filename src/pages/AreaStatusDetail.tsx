import { useParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { areas } from '@/data/mockData';
import { Area, AID_TYPE_LABELS } from '@/types/aid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { ArrowLeft, MapPin, Users, Calendar, Building2 } from 'lucide-react';
import { format } from 'date-fns';

const statusConfig = {
  'not-aided': {
    title: 'Not Aided Areas',
    subtitle: 'Areas requiring urgent attention - no aid delivered yet',
    color: 'text-status-unaided',
    bgColor: 'bg-status-unaided/10',
  },
  'partially-aided': {
    title: 'Partially Aided Areas',
    subtitle: 'Areas missing some aid types - additional support needed',
    color: 'text-status-partial',
    bgColor: 'bg-status-partial/10',
  },
  'fully-aided': {
    title: 'Fully Aided Areas',
    subtitle: 'Areas with all essential aid types covered',
    color: 'text-status-aided',
    bgColor: 'bg-status-aided/10',
  },
  'duplicate-warning': {
    title: 'Duplicate Alert Areas',
    subtitle: 'Areas with potential duplicate aid distribution - requires review',
    color: 'text-status-duplicate',
    bgColor: 'bg-status-duplicate/10',
  },
};

export default function AreaStatusDetail() {
  const { status } = useParams<{ status: string }>();
  const navigate = useNavigate();

  const config = statusConfig[status as keyof typeof statusConfig];

  const filteredAreas = useMemo(() => {
    return areas.filter(area => area.status === status);
  }, [status]);

  if (!config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Status</h1>
          <Button onClick={() => navigate('/')}>Go Back Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className={`${config.bgColor} border-b`}>
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className={`text-3xl font-bold ${config.color} animate-fade-in`}>
            {config.title}
          </h1>
          <p className="text-muted-foreground mt-1">{config.subtitle}</p>
          <div className="mt-4">
            <Badge variant="secondary" className="text-lg px-4 py-1">
              {filteredAreas.length} {filteredAreas.length === 1 ? 'Area' : 'Areas'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Area List */}
      <div className="container mx-auto px-4 py-6">
        {filteredAreas.length === 0 ? (
          <Card className="animate-fade-in">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No areas found with this status.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAreas.map((area, index) => (
              <AreaCard key={area.id} area={area} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AreaCard({ area, index }: { area: Area; index: number }) {
  const latestRecord = area.aidRecords.length > 0
    ? area.aidRecords.reduce((latest, record) => 
        new Date(record.deliveryDate) > new Date(latest.deliveryDate) ? record : latest
      )
    : null;

  const aidTypesCovered = [...new Set(area.aidRecords.map(r => r.aidType))];

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-200 animate-fade-in cursor-pointer"
      style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'backwards' }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{area.village}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {area.district}, {area.region}
            </p>
          </div>
          <StatusBadge status={area.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{area.country}</span>
        </div>

        {area.population && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{area.population.toLocaleString()} population</span>
          </div>
        )}

        {aidTypesCovered.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {aidTypesCovered.map(type => (
              <Badge key={type} variant="outline" className="text-xs">
                {AID_TYPE_LABELS[type]}
              </Badge>
            ))}
          </div>
        )}

        {latestRecord && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>Last aid: {format(new Date(latestRecord.deliveryDate), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Building2 className="w-3 h-3" />
              <span>{latestRecord.organizationId}</span>
            </div>
          </div>
        )}

        {area.aidRecords.length === 0 && (
          <p className="text-sm text-status-unaided font-medium">
            No aid records - urgent attention needed
          </p>
        )}
      </CardContent>
    </Card>
  );
}
