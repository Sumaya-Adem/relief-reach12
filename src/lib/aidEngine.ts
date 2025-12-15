import { Area, AidRecord, AidType, DuplicateWarning, AID_RESTRICTION_RULES, AreaStatus } from '@/types/aid';
import { differenceInDays, parseISO } from 'date-fns';

/**
 * Check if a new aid delivery would be a duplicate
 */
export function checkDuplicateAid(
  area: Area,
  aidType: AidType,
  proposedDate: Date = new Date()
): DuplicateWarning | null {
  const restrictionDays = AID_RESTRICTION_RULES[aidType];
  
  // Find the most recent aid record of the same type
  const existingRecords = area.aidRecords
    .filter(record => record.aidType === aidType)
    .sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime());
  
  if (existingRecords.length === 0) {
    return null;
  }
  
  const mostRecent = existingRecords[0];
  const lastDeliveryDate = parseISO(mostRecent.deliveryDate);
  const daysSinceLastAid = differenceInDays(proposedDate, lastDeliveryDate);
  
  if (daysSinceLastAid < restrictionDays) {
    return {
      areaId: area.id,
      aidType,
      existingRecord: mostRecent,
      daysSinceLastAid,
      restrictionDays,
    };
  }
  
  return null;
}

/**
 * Calculate the status of an area based on its aid records
 */
export function calculateAreaStatus(area: Area): AreaStatus {
  const now = new Date();
  const aidTypes: AidType[] = ['water', 'food', 'health', 'cash'];
  
  // Check for duplicates first
  const hasDuplicate = aidTypes.some(type => {
    const records = area.aidRecords.filter(r => r.aidType === type);
    if (records.length < 2) return false;
    
    const sorted = records.sort(
      (a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime()
    );
    
    const diff = differenceInDays(
      parseISO(sorted[0].deliveryDate),
      parseISO(sorted[1].deliveryDate)
    );
    
    return diff < AID_RESTRICTION_RULES[type];
  });
  
  if (hasDuplicate) {
    return 'duplicate-warning';
  }
  
  // Check aid coverage
  const coveredTypes = aidTypes.filter(type => {
    const records = area.aidRecords.filter(r => r.aidType === type);
    if (records.length === 0) return false;
    
    const mostRecent = records.sort(
      (a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime()
    )[0];
    
    const daysSince = differenceInDays(now, parseISO(mostRecent.deliveryDate));
    return daysSince <= AID_RESTRICTION_RULES[type];
  });
  
  if (coveredTypes.length === 0) {
    return 'not-aided';
  }
  
  if (coveredTypes.length < aidTypes.length) {
    return 'partially-aided';
  }
  
  return 'fully-aided';
}

/**
 * Get missing aid types for an area
 */
export function getMissingAidTypes(area: Area): AidType[] {
  const now = new Date();
  const aidTypes: AidType[] = ['water', 'food', 'health', 'cash'];
  
  return aidTypes.filter(type => {
    const records = area.aidRecords.filter(r => r.aidType === type);
    if (records.length === 0) return true;
    
    const mostRecent = records.sort(
      (a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime()
    )[0];
    
    const daysSince = differenceInDays(now, parseISO(mostRecent.deliveryDate));
    return daysSince > AID_RESTRICTION_RULES[type];
  });
}

/**
 * Get days until next aid is allowed for a specific type
 */
export function getDaysUntilNextAidAllowed(area: Area, aidType: AidType): number | null {
  const records = area.aidRecords.filter(r => r.aidType === aidType);
  if (records.length === 0) return null;
  
  const mostRecent = records.sort(
    (a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime()
  )[0];
  
  const daysSince = differenceInDays(new Date(), parseISO(mostRecent.deliveryDate));
  const remaining = AID_RESTRICTION_RULES[aidType] - daysSince;
  
  return remaining > 0 ? remaining : 0;
}

/**
 * Generate area ID from location components
 */
export function generateAreaId(
  country: string,
  region: string,
  district: string,
  village: string
): string {
  const countryCode = country.substring(0, 2).toUpperCase();
  const regionCode = region.substring(0, 3).toUpperCase();
  const districtCode = district.substring(0, 3).toUpperCase();
  const villageCode = village.substring(0, 3).toUpperCase();
  
  return `${countryCode}-${regionCode}-${districtCode}-${villageCode}`;
}
