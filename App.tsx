
import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import AssessmentWizard from './components/AssessmentWizard';
import ResultsDisplay from './components/ResultsDisplay';
import type { AssessmentResult } from './types';
import LandingPage from './components/LandingPage';

enum AppState {
  LANDING,
  ASSESSING,
  SHOWING_RESULTS,
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  const [results, setResults] = useState<AssessmentResult | null>(null);

  const handleStartAssessment = () => {
    setAppState(AppState.ASSESSING);
    setResults(null);
  };

  const handleAssessmentComplete = (data: AssessmentResult) => {
    setResults(data);
    setAppState(AppState.SHOWING_RESULTS);
  };

  const renderContent = () => {
    switch (appState) {
      case AppState.LANDING:
        return <LandingPage onStart={handleStartAssessment} />;
      case AppState.ASSESSING:
        return <AssessmentWizard onComplete={handleAssessmentComplete} />;
      case AppState.SHOWING_RESULTS:
        return results ? <ResultsDisplay results={results} onReset={handleStartAssessment} /> : null;
      default:
        return <LandingPage onStart={handleStartAssessment} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-800">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

export default App;
