import { Area } from '@/types/aid';
import { StatusBadge } from './StatusBadge';
import { AidTypeBadge } from './AidTypeBadge';
import { format, parseISO } from 'date-fns';
import { getMissingAidTypes } from '@/lib/aidEngine';
import { ChevronRight, Users } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TableViewProps {
  areas: Area[];
  onAreaSelect: (area: Area) => void;
}

export function TableView({ areas, onAreaSelect }: TableViewProps) {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[180px]">Location</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[100px]">Population</TableHead>
              <TableHead>Missing Aid</TableHead>
              <TableHead className="w-[120px]">Last Aid</TableHead>
              <TableHead className="w-[160px]">Last Organization</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {areas.map((area) => {
              const lastRecord = area.aidRecords[0];
              const missingTypes = getMissingAidTypes(area);
              
              return (
                <TableRow 
                  key={area.id} 
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => onAreaSelect(area)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{area.village}</p>
                      <p className="text-xs text-muted-foreground">
                        {area.district}, {area.region}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={area.status} size="sm" />
                  </TableCell>
                  <TableCell>
                    {area.population && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="w-3.5 h-3.5" />
                        {area.population.toLocaleString()}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {missingTypes.length > 0 ? (
                        missingTypes.map(type => (
                          <AidTypeBadge key={type} type={type} size="sm" showIcon={false} />
                        ))
                      ) : (
                        <span className="text-xs text-status-aided">All covered</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {area.lastAidDate ? (
                      <span className="text-sm">
                        {format(parseISO(area.lastAidDate), 'MMM d, yyyy')}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {lastRecord ? (
                      <span className="text-sm text-muted-foreground">
                        {lastRecord.organizationName}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
