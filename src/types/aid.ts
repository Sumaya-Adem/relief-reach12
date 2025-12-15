export type AidType = 'water' | 'food' | 'health' | 'cash';

export type AreaStatus = 'not-aided' | 'partially-aided' | 'fully-aided' | 'duplicate-warning';

export interface Area {
  id: string;
  country: string;
  region: string;
  district: string;
  village: string;
  latitude: number;
  longitude: number;
  population?: number;
  status: AreaStatus;
  lastAidDate?: string;
  aidRecords: AidRecord[];
}

export interface AidRecord {
  id: string;
  areaId: string;
  organizationId: string;
  organizationName: string;
  aidType: AidType;
  quantity: number;
  unit: string;
  deliveryDate: string;
  beneficiaries: number;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface Organization {
  id: string;
  name: string;
  type: 'ngo' | 'government' | 'un-agency' | 'partner';
  logo?: string;
}

export interface DuplicateWarning {
  areaId: string;
  aidType: AidType;
  existingRecord: AidRecord;
  daysSinceLastAid: number;
  restrictionDays: number;
}

// Time-based rules for duplicate detection (in days)
export const AID_RESTRICTION_RULES: Record<AidType, number> = {
  water: 14,
  food: 30,
  health: 60,
  cash: 90,
};

export const AID_TYPE_LABELS: Record<AidType, string> = {
  water: 'Water',
  food: 'Food',
  health: 'Health',
  cash: 'Cash',
};

export const AID_TYPE_ICONS: Record<AidType, string> = {
  water: '💧',
  food: '🍞',
  health: '🏥',
  cash: '💵',
};
