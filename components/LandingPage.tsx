import React from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { WaterIcon } from './icons/WaterIcon';
import { MapIcon } from './icons/MapIcon';
import { CalculatorIcon } from './icons/CalculatorIcon';
import { FileTextIcon } from './icons/FileTextIcon';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="text-center">
      <div className="max-w-4xl mx-auto">
        <WaterIcon className="w-24 h-24 text-blue-500 mx-auto mb-4" />
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-4">
          Assess Your Rooftop Rainwater Harvesting Potential
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Get a quick, data-driven analysis of how much water you can save and how to recharge groundwater right from your rooftop. Our tool provides personalized recommendations, cost estimates, and feasibility scores.
        </p>
        <div className="flex justify-center">
            <Button onClick={onStart} size="lg">
              Start New Assessment
            </Button>
        </div>
      </div>

      <div className="mt-20 grid md:grid-cols-3 gap-8 text-left">
        <Card>
          <div className="p-6">
            <MapIcon className="w-12 h-12 text-blue-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Location-Based Data</h3>
            <p className="text-gray-600">
              Uses local rainfall, groundwater levels, and soil data to provide an accurate, on-the-spot assessment.
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <CalculatorIcon className="w-12 h-12 text-green-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Smart Calculations</h3>
            <p className="text-gray-600">
              Computes harvestable volumes, recommends optimal recharge structures, and estimates project costs.
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <FileTextIcon className="w-12 h-12 text-purple-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Downloadable Reports</h3>
            <p className="text-gray-600">
              Generate a comprehensive PDF report of your assessment, perfect for sharing and planning.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LandingPage;