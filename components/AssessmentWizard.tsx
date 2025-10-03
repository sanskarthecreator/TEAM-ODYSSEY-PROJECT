
import React, { useState } from 'react';
import { postAssess } from '../services/apiService';
import type { AssessmentInput, AssessmentResult, RoofType } from '../types';
import { DEFAULT_INPUT_VALUES } from '../constants';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import MapSelector from './MapSelector';
import { ArrowLeftIcon, ArrowRightIcon } from './icons/ArrowIcons';

interface AssessmentWizardProps {
  onComplete: (data: AssessmentResult) => void;
}

const TOTAL_STEPS = 2;

const AssessmentWizard: React.FC<AssessmentWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>(DEFAULT_INPUT_VALUES);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLocationChange = (lat: number, lon: number) => {
    setFormData(prev => ({ ...prev, lat, lon }));
  };
  
  const handleAreaChange = (area: number) => {
    if (area > 0) {
      setFormData(prev => ({ ...prev, roofAreaM2: area.toFixed(2) }));
    } else {
      setFormData(prev => ({ ...prev, roofAreaM2: '' }));
    }
  };

  const validateStep = () => {
      if (step === 1) {
          return formData.lat && formData.lon && Number(formData.roofAreaM2) > 0 && formData.roofType;
      }
      if (step === 2) {
          return Number(formData.openSpaceM2) >= 0 && Number(formData.dwellers) > 0;
      }
      return false;
  }

  const handleNext = () => {
    if (validateStep()) {
        if (step < TOTAL_STEPS) {
            setStep(s => s + 1);
        } else {
            handleSubmit();
        }
    } else {
        alert("Please fill in all required fields for this step.");
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(s => s - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) {
        alert("Please ensure all fields are filled correctly.");
        return;
    }
    
    setIsLoading(true);
    setError(null);

    const input: AssessmentInput = {
        lat: Number(formData.lat),
        lon: Number(formData.lon),
        roofAreaM2: Number(formData.roofAreaM2),
        roofType: formData.roofType as RoofType,
        openSpaceM2: Number(formData.openSpaceM2),
        dwellers: Number(formData.dwellers),
        consentToStore: Boolean(formData.consentToStore),
    };

    try {
      const result = await postAssess(input);
      onComplete(result);
    } catch (err) {
      console.error("Assessment failed:", err);
      let userFriendlyMessage = 'An unexpected error occurred. Please check your internet connection and try again.';
      if (err instanceof Error) {
        userFriendlyMessage = `Failed to get assessment: ${err.message}. Please try again.`;
      }
      setError(userFriendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
        <div className="text-center">
            <Spinner />
            <p className="mt-4 text-lg text-gray-600">Analyzing your data...</p>
            <p className="text-sm text-gray-500">This may take a moment.</p>
        </div>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <div className="p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Assessment Details</h2>
        <p className="text-gray-600 mb-6">Step {step} of {TOTAL_STEPS}</p>
        
        {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}

        <div className="space-y-6">
            {step === 1 && (
                <div className="animate-fade-in space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">1. Select Property Location & Roof Area</h3>
                        <p className="text-sm text-gray-500">Use the map to find your property. Click "Start Drawing" then click the four corners of your roof to automatically calculate the area.</p>
                    </div>
                    <MapSelector 
                        latitude={Number(formData.lat)} 
                        longitude={Number(formData.lon)} 
                        onLocationChange={handleLocationChange}
                        onAreaChange={handleAreaChange}
                    />
                     <div>
                        <h3 className="text-lg font-semibold text-gray-800">2. Confirm Details</h3>
                     </div>
                    <Input 
                        label="Rooftop Area (in square meters)"
                        name="roofAreaM2"
                        type="number"
                        placeholder="Calculated from map, or enter manually"
                        value={formData.roofAreaM2}
                        onChange={handleInputChange}
                        required
                    />
                    <Select
                        label="Rooftop Material Type"
                        name="roofType"
                        value={formData.roofType}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="rcc">RCC (Concrete)</option>
                        <option value="metal">Metal Sheet</option>
                        <option value="tile">Tiles</option>
                        <option value="asphalt">Asphalt Shingles</option>
                        <option value="thatch">Thatch</option>
                    </Select>
                </div>
            )}

            {step === 2 && (
                <div className="animate-fade-in space-y-6">
                    <Input 
                        label="Open Ground Space Available (in square meters)"
                        name="openSpaceM2"
                        type="number"
                        placeholder="e.g., 50"
                        value={formData.openSpaceM2}
                        onChange={handleInputChange}
                        required
                        min="0"
                    />
                     <Input 
                        label="Number of People in Household"
                        name="dwellers"
                        type="number"
                        placeholder="e.g., 4"
                        value={formData.dwellers}
                        onChange={handleInputChange}
                        required
                        min="1"
                    />
                    <div className="flex items-start">
                        <div className="flex items-center h-5">
                            <input
                                id="consentToStore"
                                name="consentToStore"
                                type="checkbox"
                                checked={formData.consentToStore}
                                onChange={handleInputChange}
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="consentToStore" className="font-medium text-gray-700">Consent to store data</label>
                            <p className="text-gray-500">Allow us to anonymously store your data to improve our models.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="mt-8 flex justify-between items-center">
            <Button variant="secondary" onClick={handleBack} disabled={step === 1}>
                <ArrowLeftIcon className="w-5 h-5 mr-2"/>
                Back
            </Button>
            <Button onClick={handleNext} disabled={!validateStep()}>
                {step === TOTAL_STEPS ? 'Get Assessment' : 'Next'}
                <ArrowRightIcon className="w-5 h-5 ml-2"/>
            </Button>
        </div>
      </div>
    </Card>
  );
};

export default AssessmentWizard;