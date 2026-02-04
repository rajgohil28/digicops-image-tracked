import React, { useState } from 'react';
import Welcome from './components/Welcome';
import Selection from './components/Selection';
import MagicTshirt from './components/MagicTshirt';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome');

  const handleStart = () => {
    setCurrentScreen('selection');
  };

  const handleSelect = (option) => {
    setCurrentScreen(option);
  };

  const handleBack = () => {
    // If coming from an AR experience, we might want to reload or carefully cleanup
    // For now, we'll just switch state, but in AR re-rendering can be tricky with A-Frame
    // A full reload might be safer for clearing AR session, but let's try state first.
    setCurrentScreen('selection');
  };

  return (
    <div className="App">
      {currentScreen === 'welcome' && (
        <Welcome onStart={handleStart} />
      )}
      
      {currentScreen === 'selection' && (
        <Selection onSelect={handleSelect} onBack={() => setCurrentScreen('welcome')} />
      )}
      
      {currentScreen === 'magic-tshirt' && (
        <MagicTshirt onBack={handleBack} />
      )}
    </div>
  );
}

export default App;
