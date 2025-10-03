
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 text-gray-600 text-sm text-center py-4 mt-8">
      <div className="container mx-auto px-4">
        <p>
          Data sources include{' '}
          <a href="#" className="text-blue-600 hover:underline">OpenStreetMap</a>,{' '}
          <a href="#" className="text-blue-600 hover:underline">Open-Meteo</a>, and{' '}
          <a href="#" className="text-blue-600 hover:underline">CGWB</a>.
        </p>
        <p>&copy; {new Date().getFullYear()} Sawan RTRWH Planner. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;