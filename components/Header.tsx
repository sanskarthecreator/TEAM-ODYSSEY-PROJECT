
import React from 'react';
import { WaterIcon } from './icons/WaterIcon';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <WaterIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">
            RTRWH Assess
          </h1>
        </div>
        {/* Language switcher can be added here */}
      </div>
    </header>
  );
};

export default Header;
