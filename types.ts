// FIX: Removed self-import of `RoofType` which was causing a conflict with its own declaration.

export enum RoofType {
  METAL = 'metal',
  TILE = 'tile',
  ASPHALT = 'asphalt',
  THATCH = 'thatch',
  RCC = 'rcc',
}

export interface AssessmentInput {
  lat: number;
  lon: number;
  roofAreaM2: number;
  roofType: RoofType;
  openSpaceM2: number;
  dwellers: number;
  consentToStore: boolean;
}

export interface RecommendedStructure {
  type: 'pit' | 'trench' | 'shaft';
  dimensions: {
    depthM?: number;
    areaM2?: number;
    lengthM?: number;
    widthM?: number;
  };
  volumeM3: number; // For multiple units, this is the TOTAL volume
  costInr: number; // For multiple units, this is the TOTAL cost
  count?: number;
}

export type Feasibility = 'Green' | 'Yellow' | 'Red';

export interface CostBenefit {
    paybackPeriodYears: number | null;
    annualSavingsInr: number;
}

export interface AssessmentResult {
  annualRainMm: number;
  monsoonRainMm: number;
  runoffCoeff: number;
  annualHarvestM3: number;
  monsoonHarvestM3: number;
  recommendedStructures: RecommendedStructure[];
  depthToGroundwaterM: number | null;
  aquiferNote: string;
  feasibility: Feasibility;
  costEstimateInr: number;
  costBenefit: CostBenefit;
  locationName: string;
  systemEfficiency: number;
}
