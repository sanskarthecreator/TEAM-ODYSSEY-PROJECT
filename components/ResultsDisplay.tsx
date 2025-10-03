import React, { useState } from 'react';
import type { AssessmentResult, Feasibility, RecommendedStructure } from '../types';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { WaterIcon } from './icons/WaterIcon';
import { MapIcon } from './icons/MapIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { RulerIcon } from './icons/RulerIcon';
import { QuestionMarkCircleIcon } from './icons/QuestionMarkCircleIcon';
import { generateReportPdf } from '../services/pdfGenerator';

// The jspdf library is now loaded dynamically. html2canvas is no longer needed.
declare global {
  interface Window {
    jspdf: any;
  }
}

// Helper function to dynamically load a script and return a promise.
const loadScript = (id: string, src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // If the script already exists in the DOM, resolve immediately.
    if (document.getElementById(id)) {
      return resolve();
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      console.error(`Failed to load script: ${src}`);
      reject(new Error(`Could not load required script: ${src}`));
    };
    document.head.appendChild(script);
  });
};

// Ensures that the jspdf library is loaded before proceeding.
const ensurePdfLib = async () => {
  if (window.jspdf?.jsPDF) {
    return;
  }
  
  await loadScript(
      'jspdf-lib', 
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
  );
  
  // Final check after attempting to load to ensure it initialized correctly.
  if (!window.jspdf?.jsPDF) {
    throw new Error('PDF library loaded but failed to initialize. This may be due to a network issue or an ad-blocker.');
  }
};


interface ResultsDisplayProps {
  results: AssessmentResult;
  onReset: () => void;
}

const feasibilityStyles: Record<Feasibility, { bg: string; text: string; border: string; }> = {
  Green: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500',},
  Yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-500' },
  Red: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500' },
};

const StructureDetails: React.FC<{ structure: RecommendedStructure }> = ({ structure }) => {
    const { type, dimensions, count, volumeM3 } = structure;
    if (!dimensions) return null;

    const dimensionDetails = [];
    if (type === 'pit') {
        if (dimensions.areaM2) dimensionDetails.push(`Area: ${dimensions.areaM2} m²`);
        if (dimensions.depthM) dimensionDetails.push(`Depth: ${dimensions.depthM} m`);
    } else if (type === 'trench') {
        if (dimensions.lengthM) dimensionDetails.push(`Length: ${dimensions.lengthM} m`);
        if (dimensions.widthM) dimensionDetails.push(`Width: ${dimensions.widthM} m`);
        if (dimensions.depthM) dimensionDetails.push(`Depth: ${dimensions.depthM} m`);
    } else if (type === 'shaft') {
        if (dimensions.areaM2) dimensionDetails.push(`Top Pit Area: ${dimensions.areaM2} m²`);
        if (dimensions.depthM) dimensionDetails.push(`Shaft Depth: ${dimensions.depthM} m`);
    }

    const hasDetailsToShow = dimensionDetails.length > 0 || (count && count > 1);
    if (!hasDetailsToShow) return null;

    return (
        <div className="text-sm text-gray-500 border-t pt-2 mt-2">
            {dimensionDetails.length > 0 && (
                <>
                    <p className="font-semibold">Recommended Dimensions{count && count > 1 ? ' (per unit)' : ''}:</p>
                    <ul className="list-disc list-inside">
                        {dimensionDetails.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                </>
            )}
             {count && count > 1 && (
                <p className={dimensionDetails.length > 0 ? 'mt-1' : ''}>
                    <span className="font-semibold">Recharge Capacity (per unit):</span>
                    {' '}{(volumeM3 / count).toFixed(1)} m³
                </p>
            )}
        </div>
    );
};


const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, onReset }) => {
  const feasibilityStyle = feasibilityStyles[results.feasibility];
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);

    try {
        await ensurePdfLib();
        await generateReportPdf(results);
    } catch (error) {
        console.error("Failed to generate PDF:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        alert(`Sorry, there was an error creating the PDF. Please check your internet connection and disable any ad-blockers that might be preventing scripts from loading.\n\nDetails: ${errorMessage}`);
    } finally {
        setIsDownloading(false);
    }
  };


  return (
    <>
    {/* This container is no longer captured, but kept for consistent web layout */}
    <div className="max-w-6xl mx-auto animate-fade-in bg-gray-50 p-4 md:p-8">
        <Card className={`p-6 mb-8 border-l-4 ${feasibilityStyle.border} ${feasibilityStyle.bg}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="mb-4 sm:mb-0">
                    <p className={`text-sm font-bold uppercase ${feasibilityStyle.text}`}>Feasibility Score</p>
                    <h2 className={`text-4xl font-extrabold ${feasibilityStyle.text}`}>{results.feasibility}</h2>
                </div>
                <p className={`text-lg max-w-2xl ${feasibilityStyle.text} sm:text-right`}>Based on your inputs, your property shows a <strong>{results.feasibility.toLowerCase()} potential</strong> for rainwater harvesting and groundwater recharge.</p>
            </div>
        </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Harvestable Volume */}
        <Card className="lg:col-span-2">
            <div className="p-6">
                <div className="flex items-center text-blue-600 mb-4">
                    <WaterIcon className="w-8 h-8 mr-3"/>
                    <h3 className="text-xl font-bold">Net RWH Potential</h3>
                </div>
                <p className="text-6xl font-extrabold text-gray-800">{results.annualHarvestM3}<span className="text-2xl font-medium ml-2">m³/year</span></p>
                <p className="text-gray-600 mt-2 text-lg">Equal to <strong>{(results.annualHarvestM3 * 1000).toLocaleString()} liters</strong> annually.</p>
                <div className="mt-4 text-sm text-gray-500 border-t pt-3">
                    <div className="space-y-1">
                      <p>Monsoon Season Harvest: <strong>{results.monsoonHarvestM3} m³</strong></p>
                      <p>Based on <strong>{results.annualRainMm} mm</strong> average annual rainfall in <strong>{results.locationName}</strong>.</p>
                    </div>
                    <div className="mt-3 bg-gray-100 p-2 rounded-md flex items-start space-x-2">
                        <QuestionMarkCircleIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5"/>
                        <p>
                            This is a net estimate. The calculation accounts for your roof type and includes a standard <strong>{((1 - results.systemEfficiency) * 100).toFixed(0)}% system loss factor</strong> for first flush, evaporation, and filter inefficiency to be more realistic.
                        </p>
                    </div>
                </div>
            </div>
        </Card>

        {/* Cost-Benefit Analysis */}
        <Card>
            <div className="p-6">
                <div className="flex items-center text-yellow-600 mb-4">
                    <TrendingUpIcon className="w-8 h-8 mr-3"/>
                    <h3 className="text-xl font-bold">Financial Snapshot</h3>
                </div>
                <div className="space-y-4">
                    <div>
                        <p className="text-gray-600 text-sm">Estimated Annual Savings</p>
                        <p className="text-3xl font-bold text-gray-800">~₹{results.costBenefit.annualSavingsInr.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                        <p className="text-gray-600 text-sm">Payback Period</p>
                        <p className="text-3xl font-bold text-gray-800">
                            {results.costBenefit.paybackPeriodYears !== null ? `${results.costBenefit.paybackPeriodYears} years` : 'N/A'}
                        </p>
                    </div>
                </div>
            </div>
        </Card>

        {/* Recommended Structure */}
        <Card>
            <div className="p-6">
                 <div className="flex items-center text-purple-600 mb-4">
                    <RulerIcon className="w-8 h-8 mr-3"/>
                    <h3 className="text-xl font-bold">Recommended Unit(s)</h3>
                </div>
                {results.recommendedStructures.length > 0 ? (
                    <div className="space-y-4">
                        {results.recommendedStructures.map((s, i) => (
                             <div key={i} className={i > 0 ? "border-t pt-4" : ""}>
                                <p className="text-2xl font-bold text-gray-800 capitalize">
                                    {s.count && s.count > 1 ? `${s.count} x ` : ''}{s.type}
                                </p>
                                <p className="text-md text-gray-600">Total Recharge Capacity: <strong>{s.volumeM3} m³</strong></p>
                                <StructureDetails structure={s} />
                            </div>
                        ))}
                    </div>
                ): <p className="text-gray-600">No recharge structure needed based on volume.</p>}
            </div>
        </Card>
        
        {/* Estimated Cost */}
        <Card>
            <div className="p-6">
                 <div className="flex items-center text-green-600 mb-4">
                    <DollarSignIcon className="w-8 h-8 mr-3"/>
                    <h3 className="text-xl font-bold">Total Estimated Cost</h3>
                </div>
                 <p className="text-4xl font-bold text-gray-800">₹{results.costEstimateInr.toLocaleString('en-IN')}</p>
                 <p className="text-gray-600">One-time investment</p>
            </div>
        </Card>

        {/* Groundwater Info */}
        <Card>
             <div className="p-6">
                 <div className="flex items-center text-indigo-600 mb-4">
                    <MapIcon className="w-8 h-8 mr-3"/>
                    <h3 className="text-xl font-bold">Local Aquifer Data</h3>
                </div>
                <div className="space-y-2">
                    <div>
                        <p className="text-gray-600 text-sm">Avg. Depth to Water</p>
                        <p className="text-3xl font-bold text-gray-800 mb-2">{results.depthToGroundwaterM?.toFixed(1) ?? 'N/A'} m</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-700 pt-2 border-t">{results.aquiferNote}</p>
                </div>
            </div>
        </Card>

      </div>
    </div>
    <div className="mt-8 text-center flex flex-col sm:flex-row justify-center gap-4 pdf-ignore">
        <Button size="lg" onClick={handleDownloadPdf} disabled={isDownloading}>
            {isDownloading ? (
                <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                    Generating...
                </>
            ) : (
                'Download PDF Report'
            )}
        </Button>
        <Button size="lg" variant="secondary" onClick={onReset}>Start New Assessment</Button>
    </div>
    </>
  );
};

export default ResultsDisplay;