import type { AssessmentInput, AssessmentResult, Feasibility, RecommendedStructure, RoofType, CostBenefit } from '../types';
import { ROOF_COEFFICIENTS } from '../constants';

// Mock API service to simulate backend calls.
// In a real app, this would use fetch() to call the FastAPI backend.

const calculateHarvestableVolume = (rainfallMm: number, areaM2: number, coeff: number): number => {
  return (rainfallMm / 1000) * areaM2 * coeff;
};

const recommendStructure = (harvestVolumeM3: number, openSpaceM2: number): RecommendedStructure[] => {
    const targetRechargeFraction = 0.8;
    const vTarget = harvestVolumeM3 * targetRechargeFraction;
    const safetyFactor = 1.25;
    const porosity = 0.35;
    const pitDepthM = 2.0;

    const requiredPitArea = vTarget / (pitDepthM * porosity) * safetyFactor;

    if (requiredPitArea <= openSpaceM2 && requiredPitArea > 0) {
        const pitVolumeM3 = requiredPitArea * pitDepthM * porosity;
        return [{
            type: 'pit',
            dimensions: {
                depthM: pitDepthM,
                areaM2: parseFloat(requiredPitArea.toFixed(2)),
            },
            volumeM3: parseFloat(pitVolumeM3.toFixed(2)),
            costInr: Math.round(requiredPitArea * 500), // Adjusted mock cost
        }];
    }
    
    // Fallback to trench if pit is too large or not needed
    if (vTarget > 0) {
        const trenchWidthM = 1.0;
        const trenchDepthM = 1.5;
        const requiredTrenchLength = vTarget / (trenchWidthM * trenchDepthM * porosity) * safetyFactor;
        const trenchVolumeM3 = requiredTrenchLength * trenchWidthM * trenchDepthM * porosity;
        return [{
            type: 'trench',
            dimensions: {
                lengthM: parseFloat(requiredTrenchLength.toFixed(2)),
                widthM: trenchWidthM,
                depthM: trenchDepthM
            },
            volumeM3: parseFloat(trenchVolumeM3.toFixed(2)),
            costInr: Math.round(requiredTrenchLength * 750), // Adjusted mock cost
        }];
    }
    
    return []; // No structure if harvestable volume is zero
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
      // Simulate backend calculations based on the prompt's logic
      const annualRainMm = 650 + (Math.random() - 0.5) * 100; // Randomize slightly
      const monsoonRainMm = annualRainMm * 0.8;
      const runoffCoeff = ROOF_COEFFICIENTS[input.roofType as RoofType];
      
      const annualHarvestM3 = calculateHarvestableVolume(annualRainMm, input.roofAreaM2, runoffCoeff);
      const monsoonHarvestM3 = calculateHarvestableVolume(monsoonRainMm, input.roofAreaM2, runoffCoeff);

      const recommendedStructures = recommendStructure(monsoonHarvestM3, input.openSpaceM2);
      const totalCost = recommendedStructures.reduce((sum, s) => sum + s.costInr, 0);

      const feasibilityScore = (input.roofAreaM2 / 200) * 30 + (annualRainMm / 800) * 30 + 25 + (input.openSpaceM2 / 50) * 15;
      let feasibility: Feasibility = 'Red';
      if (feasibilityScore >= 75) feasibility = 'Green';
      else if (feasibilityScore >= 40) feasibility = 'Yellow';
      
      const costBenefit = calculateCostBenefit(totalCost, annualHarvestM3);

      const result: AssessmentResult = {
        annualRainMm: parseFloat(annualRainMm.toFixed(2)),
        monsoonRainMm: parseFloat(monsoonRainMm.toFixed(2)),
        runoffCoeff,
        annualHarvestM3: parseFloat(annualHarvestM3.toFixed(2)),
        monsoonHarvestM3: parseFloat(monsoonHarvestM3.toFixed(2)),
        recommendedStructures,
        depthToGroundwaterM: 6.3 + (Math.random() - 0.5),
        aquiferNote: "Weathered and fractured basalt; moderate permeability",
        feasibility,
        costEstimateInr: totalCost,
        costBenefit,
        locationName: "your selected area",
      };

      resolve(result);
    }, 1500); // Simulate network latency
  });
};