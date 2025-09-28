import React, { useRef, useState } from 'react';
import type { AssessmentResult, Feasibility, RecommendedStructure } from '../types';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { WaterIcon } from './icons/WaterIcon';
import { MapIcon } from './icons/MapIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { RulerIcon } from './icons/RulerIcon';
import { Spinner } from './ui/Spinner';

// The jspdf and html2canvas libraries are loaded from a CDN in index.html
declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

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
    const { type, dimensions } = structure;
    if (!dimensions) return null;
    
    let details = [];
    if (type === 'pit') {
        if (dimensions.areaM2) details.push(`Area: ${dimensions.areaM2} m²`);
        if (dimensions.depthM) details.push(`Depth: ${dimensions.depthM} m`);
    } else if (type === 'trench') {
        if (dimensions.lengthM) details.push(`Length: ${dimensions.lengthM} m`);
        if (dimensions.widthM) details.push(`Width: ${dimensions.widthM} m`);
        if (dimensions.depthM) details.push(`Depth: ${dimensions.depthM} m`);
    }
    
    if (details.length === 0) return null;

    return (
        <div className="text-sm text-gray-500 border-t pt-2 mt-2">
            <p className="font-semibold">Recommended Dimensions:</p>
            <ul className="list-disc list-inside">
                {details.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
        </div>
    );
}


const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, onReset }) => {
  const feasibilityStyle = feasibilityStyles[results.feasibility];
  const resultsRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    const resultsElement = resultsRef.current;
    if (!resultsElement) return;

    setIsDownloading(true);

    try {
        if (!window.jspdf || !window.html2canvas) {
          throw new Error('PDF generation libraries not loaded.');
        }

        const { jsPDF } = window.jspdf;
        const html2canvas = window.html2canvas;

        if (typeof html2canvas !== 'function') {
          throw new Error('html2canvas is not loaded or not a function. Check the CDN script tag in index.html.');
        }

        const canvas = await html2canvas(resultsElement, {
            scale: 2, // Improve resolution
            useCORS: true,
            logging: false,
            // Exclude buttons from the capture
            ignoreElements: (element) => element.classList.contains('pdf-ignore'),
        });

        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        
        const imgWidth = pdfWidth;
        const imgHeight = imgWidth / ratio;
        
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();

        while (heightLeft > 0) {
            position = -heightLeft;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();
        }
        
        pdf.save('RTRWH-Assessment-Report.pdf');

    } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("Sorry, there was an error creating the PDF. Please try again.");
    } finally {
        setIsDownloading(false);
    }
  };


  return (
    <>
    <div ref={resultsRef} className="max-w-6xl mx-auto animate-fade-in bg-gray-50 p-4 md:p-8">
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
                    <h3 className="text-xl font-bold">Total Harvestable Water</h3>
                </div>
                <p className="text-6xl font-extrabold text-gray-800">{results.annualHarvestM3}<span className="text-2xl font-medium ml-2">m³/year</span></p>
                <p className="text-gray-600 mt-2 text-lg">Equal to <strong>{(results.annualHarvestM3 * 1000).toLocaleString()} liters</strong> annually.</p>
                <div className="mt-4 text-sm text-gray-500 border-t pt-2">
                    <p>Monsoon Season Harvest: <strong>{results.monsoonHarvestM3} m³</strong></p>
                    <p>Based on <strong>{results.annualRainMm} mm</strong> average annual rainfall in <strong>{results.locationName}</strong>.</p>
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
                    <h3 className="text-xl font-bold">Recommended Unit</h3>
                </div>
                {results.recommendedStructures.length > 0 ? results.recommendedStructures.map((s, i) => (
                    <div key={i} className="space-y-1">
                        <p className="text-3xl font-bold text-gray-800 capitalize">{s.type}</p>
                        <p className="text-md text-gray-600">Required Volume: <strong>{s.volumeM3} m³</strong></p>
                        <StructureDetails structure={s} />
                    </div>
                )) : <p className="text-gray-600">No recharge structure needed based on volume.</p>}
            </div>
        </Card>
        
        {/* Estimated Cost */}
        <Card>
            <div className="p-6">
                 <div className="flex items-center text-green-600 mb-4">
                    <DollarSignIcon className="w-8 h-8 mr-3"/>
                    <h3 className="text-xl font-bold">Estimated Cost</h3>
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