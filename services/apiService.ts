import type { AssessmentInput, AssessmentResult, Feasibility, RecommendedStructure, RoofType, CostBenefit } from '../types';
import { ROOF_COEFFICIENTS } from '../constants';
import { getHydrogeologicalZone } from './hydrogeologicalData';

// Mock API service to simulate backend calls.
// In a real app, this would use fetch() to call the FastAPI backend.

const SYSTEM_EFFICIENCY = 0.90; // Represents a 10% loss due to first flush, evaporation, and filter inefficiency.

const calculateHarvestableVolume = (rainfallMm: number, areaM2: number, coeff: number): number => {
  return (rainfallMm / 1000) * areaM2 * coeff * SYSTEM_EFFICIENCY;
};

/**
 * Recommends artificial recharge structures based on hydrological data and physical constraints.
 * This logic is inspired by the techniques and case studies in the CGWB "Rain Water Harvesting
 * and Artificial Recharge" manual. It prioritizes practical, cost-effective solutions for
 * residential-scale projects.
 */
const recommendStructure = (harvestVolumeM3: number, openSpaceM2: number, depthToGroundwaterM: number | null, dwellers: number): RecommendedStructure[] => {
    // Strict constraint check: if there's no practical space for a structure, don't recommend one.
    if (openSpaceM2 < 2) {
        return [];
    }

    // Adjust target recharge volume based on household size (demand).
    // Start at 70% for 2 dwellers, add 5% per person above that, capped at 90%.
    const targetRechargeFactor = Math.min(0.9, 0.7 + (Math.max(0, dwellers - 2) * 0.05));
    const targetRechargeVolumeM3 = harvestVolumeM3 * targetRechargeFactor;
    if (targetRechargeVolumeM3 <= 2) { // Negligible volume, no structures needed.
        return [];
    }

    // --- Heuristics based on field studies ---
    const percolationFactor = 5; 
    const filterMediaPorosity = 0.4; // Voids in gravel/sand filter media.

    // --- Standard Structure Unit Definitions & Costs ---
    const standardPit = {
        type: 'pit' as 'pit',
        maxWidth: 4, minWidth: 1.5, depth: 3,
        baseCost: 2500, costPerCubicMeter: 250,
    };
    const standardTrench = {
        type: 'trench' as 'trench',
        width: 1, depth: 1.5,
        baseCost: 2000, costPerMeterLength: 500,
    };
    const standardShaft = {
        type: 'shaft' as 'shaft',
        diameter: 1, minDepth: 8, maxDepth: 25,
        baseCost: 8000, costPerMeterDepth: 1000,
    };

    let recommendations: RecommendedStructure[] = [];
    let remainingVolumeToRecharge = targetRechargeVolumeM3;
    const isDeepWaterTable = depthToGroundwaterM && depthToGroundwaterM > 12;

    // --- Refined Decision Logic ---

    // 1. High Priority: Recharge Shaft. Best for deep water tables.
    if (isDeepWaterTable && openSpaceM2 >= 2 && remainingVolumeToRecharge > 20) {
        const shaftDepth = Math.max(standardShaft.minDepth, Math.min(standardShaft.maxDepth, (depthToGroundwaterM || 15) * 0.7));
        const physicalVolume = (Math.PI * (standardShaft.diameter/2)**2) * shaftDepth;
        const waterStorageVolume = physicalVolume * filterMediaPorosity;
        const rechargeCapacity = waterStorageVolume * percolationFactor;
        const cost = standardShaft.baseCost + standardShaft.costPerMeterDepth * shaftDepth;
        
        recommendations.push({
            type: 'shaft',
            dimensions: { depthM: parseFloat(shaftDepth.toFixed(1)), areaM2: parseFloat((Math.PI * (standardShaft.diameter/2)**2).toFixed(1)) },
            volumeM3: parseFloat(rechargeCapacity.toFixed(1)),
            costInr: Math.round(cost),
            count: 1,
        });
        remainingVolumeToRecharge -= rechargeCapacity;
    }
    
    // 2. Next Priority: Recharge Trench. Good for large volumes to distribute water.
    if (remainingVolumeToRecharge > 40 && openSpaceM2 >= 10) {
        const physicalVolumePerMeter = standardTrench.width * standardTrench.depth;
        const waterStoragePerMeter = physicalVolumePerMeter * filterMediaPorosity;
        const rechargeCapacityPerMeter = waterStoragePerMeter * percolationFactor;
        
        if (rechargeCapacityPerMeter > 0) {
            const requiredLength = remainingVolumeToRecharge / rechargeCapacityPerMeter;
            const maxLengthForSpace = openSpaceM2 / standardTrench.width;
            const finalLength = Math.min(requiredLength, maxLengthForSpace, 40);

            if (finalLength > 2) {
                const cost = standardTrench.baseCost + standardTrench.costPerMeterLength * finalLength;
                const totalRechargeCapacity = finalLength * rechargeCapacityPerMeter;
                recommendations.push({
                    type: 'trench',
                    dimensions: {
                        lengthM: parseFloat(finalLength.toFixed(1)),
                        widthM: standardTrench.width,
                        depthM: standardTrench.depth,
                    },
                    volumeM3: parseFloat(totalRechargeCapacity.toFixed(1)),
                    costInr: Math.round(cost),
                    count: 1,
                });
                remainingVolumeToRecharge -= totalRechargeCapacity;
            }
        }
    }

    // 3. Default/Workhorse: Recharge Pit(s). Handle remaining or standard volumes.
    if (remainingVolumeToRecharge > 5 && openSpaceM2 >= 4) {
        const maxPitArea = Math.min(standardPit.maxWidth**2, openSpaceM2 * 0.6);
        const pitArea = Math.max(standardPit.minWidth**2, maxPitArea);

        const physicalVolume = pitArea * standardPit.depth;
        const waterStorageVolume = physicalVolume * filterMediaPorosity;
        const rechargeCapacityPerPit = waterStorageVolume * percolationFactor;
        
        if (rechargeCapacityPerPit > 0) {
            const numPitsNeeded = Math.ceil(remainingVolumeToRecharge / rechargeCapacityPerPit);
            const numPitsToRecommend = Math.min(numPitsNeeded, 3);
            const costPerPit = standardPit.baseCost + standardPit.costPerCubicMeter * physicalVolume;

            recommendations.push({
                type: 'pit',
                dimensions: { areaM2: parseFloat(pitArea.toFixed(1)), depthM: standardPit.depth },
                volumeM3: parseFloat((rechargeCapacityPerPit * numPitsToRecommend).toFixed(1)),
                costInr: Math.round(costPerPit * numPitsToRecommend),
                count: numPitsToRecommend,
            });
        }
    }
    
    return recommendations;
};


const calculateCostBenefit = (cost: number, annualHarvestM3: number): CostBenefit => {
    const waterCostPerM3_INR = 20; // Assumed municipal water cost
    const annualSavingsInr = Math.round(annualHarvestM3 * waterCostPerM3_INR);
    
    let paybackPeriodYears: number | null = null;
    if (annualSavingsInr > 0) {
        paybackPeriodYears = parseFloat((cost / annualSavingsInr).toFixed(1));
    }

    return {
        paybackPeriodYears,
        annualSavingsInr,
    };
};

export const postAssess = (input: AssessmentInput): Promise<AssessmentResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // --- SIMULATION LOGIC OVERHAUL ---
      
      // 1. More realistic rainfall based on latitude.
      // India's latitude is approx 8°N to 37°N. Lower latitude (south) = more rain.
      const minLat = 8;
      const maxLat = 37;
      const maxRain = 2500; // e.g., Coastal Kerala/Goa
      const minRain = 300;  // e.g., Rajasthan
      // Normalize latitude within India's range
      const normalizedLat = Math.max(0, Math.min(1, (input.lat - minLat) / (maxLat - minLat)));
      // Interpolate rainfall, making south wetter than north. Add some randomness.
      const baseRain = maxRain - (normalizedLat * (maxRain - minRain));
      const annualRainMm = baseRain + (Math.random() - 0.5) * 200;

      // 2. More realistic groundwater depth and aquifer data based on CGWB-defined hydrogeological zones.
      const zone = getHydrogeologicalZone(input.lat);
      const [minDepth, maxDepth] = zone.depthToGroundwaterRangeM;
      const depthToGroundwaterM = minDepth + Math.random() * (maxDepth - minDepth);

      // --- End of Simulation Overhaul ---

      const monsoonRainMm = annualRainMm * 0.8;
      const runoffCoeff = ROOF_COEFFICIENTS[input.roofType as RoofType];
      
      const annualHarvestM3 = calculateHarvestableVolume(annualRainMm, input.roofAreaM2, runoffCoeff);
      const monsoonHarvestM3 = calculateHarvestableVolume(monsoonRainMm, input.roofAreaM2, runoffCoeff);

      const recommendedStructures = recommendStructure(monsoonHarvestM3, input.openSpaceM2, depthToGroundwaterM, input.dwellers);
      const totalCost = recommendedStructures.reduce((sum, s) => sum + s.costInr, 0);

      const feasibilityScore = (input.roofAreaM2 / 200) * 30 + (annualRainMm / 1200) * 30 + 25 + (input.openSpaceM2 / 50) * 15;
      let feasibility: Feasibility = 'Red';
      if (feasibilityScore >= 75) feasibility = 'Green';
      else if (feasibilityScore >= 40) feasibility = 'Yellow';
      
      const costBenefit = calculateCostBenefit(totalCost, annualHarvestM3);
      
      // Construct a detailed, zone-specific aquifer note.
      let aquiferNote = `This area is part of the ${zone.name}. Aquifer Type: ${zone.aquiferType} Recharge Suitability: ${zone.rechargeSuitability}`;
      
      // If no structure could be recommended despite harvestable volume, explain why.
      if (recommendedStructures.length === 0 && monsoonHarvestM3 > 2) {
          aquiferNote = `While there is harvestable water, the available open space (${input.openSpaceM2} m²) is too limited for a standard recharge structure. Consider redirecting runoff to a nearby existing well or a larger green space if possible.`
      }


      const result: AssessmentResult = {
        annualRainMm: parseFloat(annualRainMm.toFixed(1)),
        monsoonRainMm: parseFloat(monsoonRainMm.toFixed(1)),
        runoffCoeff,
        annualHarvestM3: parseFloat(annualHarvestM3.toFixed(1)),
        monsoonHarvestM3: parseFloat(monsoonHarvestM3.toFixed(1)),
        recommendedStructures,
        depthToGroundwaterM: parseFloat(depthToGroundwaterM.toFixed(1)),
        aquiferNote: aquiferNote,
        feasibility,
        costEstimateInr: totalCost,
        costBenefit,
        locationName: "your selected area",
        systemEfficiency: SYSTEM_EFFICIENCY,
      };

      resolve(result);
    }, 1500); // Simulate network latency
  });
};