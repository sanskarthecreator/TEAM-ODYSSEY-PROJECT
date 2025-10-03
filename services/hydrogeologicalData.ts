// This file contains simplified, mock data representing the major hydrogeological zones of India,
// inspired by classifications from the Central Ground Water Board (CGWB).
// This allows for a more realistic simulation of groundwater conditions based on location.

export interface HydrogeologicalZone {
  name: string;
  latRange: [number, number]; // Approximate latitude range for the zone
  depthToGroundwaterRangeM: [number, number]; // Typical depth range in meters
  aquiferType: string; // Description of the geology
  rechargeSuitability: string; // Notes on suitability for artificial recharge
}

const ZONES: HydrogeologicalZone[] = [
  {
    name: 'Northern Alluvial Plains (Indo-Gangetic)',
    latRange: [25, 32],
    depthToGroundwaterRangeM: [8, 25],
    aquiferType: 'Deep, multi-layered alluvial sand and gravel aquifers.',
    rechargeSuitability: 'Excellent for various recharge structures, particularly shafts and trenches due to high permeability.'
  },
  {
    name: 'Central Highlands (Bundelkhand, etc.)',
    latRange: [22, 25],
    depthToGroundwaterRangeM: [10, 35],
    aquiferType: 'Weathered and fractured hard rock (granite, gneiss).',
    rechargeSuitability: 'Moderate. Recharge is effective through existing fractures. Dug wells and pits are common.'
  },
  {
    name: 'Peninsular Hard Rock Zone (Deccan Plateau)',
    latRange: [12, 22],
    depthToGroundwaterRangeM: [5, 45],
    aquiferType: 'Complex fractured basalt (Deccan Traps) and crystalline rocks.',
    rechargeSuitability: 'Variable. Success depends on targeting fracture zones. Recharge pits and trenches along drainage lines are effective.'
  },
  {
    name: 'Coastal Sedimentary Zone',
    latRange: [8, 16], // Covers both east and west coasts in this simplification
    depthToGroundwaterRangeM: [2, 10],
    aquiferType: 'Shallow sand and clay layers, often with saline water intrusion risks.',
    rechargeSuitability: 'Good, but requires careful management to avoid contamination. Shallow recharge pits are preferred over deep shafts.'
  },
  {
    name: 'Western Arid Zone (Rajasthan/Gujarat)',
    latRange: [24, 30], // Overlaps with northern plains but represents a different climate
    depthToGroundwaterRangeM: [20, 100],
    aquiferType: 'Deep sandy aquifers with low and erratic rainfall.',
    rechargeSuitability: 'Critical but challenging. Large-scale structures are often needed, but rooftop harvesting is highly valuable for direct use.'
  },
];

// A fallback zone for any edge cases or locations outside the defined ranges.
const FALLBACK_ZONE: HydrogeologicalZone = {
    name: 'Mixed Geological Area',
    latRange: [0, 50],
    depthToGroundwaterRangeM: [5, 20],
    aquiferType: 'Variable local geology.',
    rechargeSuitability: 'Site-specific investigation recommended. Standard pits and trenches are generally applicable.'
};

/**
 * Finds the corresponding hydrogeological zone for a given latitude.
 * @param lat The latitude of the selected location.
 * @returns The HydrogeologicalZone object for that location.
 */
export const getHydrogeologicalZone = (lat: number): HydrogeologicalZone => {
  // A more realistic mapping would also use longitude, but this is a good approximation for a north-south gradient.
  const zone = ZONES.find(z => lat >= z.latRange[0] && lat < z.latRange[1]);
  return zone || FALLBACK_ZONE;
};
