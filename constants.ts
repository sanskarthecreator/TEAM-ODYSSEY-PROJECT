
import type { RoofType } from './types';

export const ROOF_COEFFICIENTS: Record<RoofType, number> = {
  metal: 0.95,
  tile: 0.90,
  rcc: 0.90,
  asphalt: 0.85,
  thatch: 0.60,
};

// Use empty strings for numbers to avoid pre-filling inputs with '0'
export const DEFAULT_INPUT_VALUES = {
    lat: 20.5937, // Center of India
    lon: 78.9629,
    roofAreaM2: '',
    roofType: 'rcc' as RoofType,
    openSpaceM2: '',
    dwellers: '',
    consentToStore: false,
};