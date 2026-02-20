import React, { useState, useEffect } from 'react';
import Welcome from './components/Welcome';
import Selection from './components/Selection';
import MagicTshirt from './components/MagicTshirt';
import './App.css';

// List of critical assets to preload
const ASSETS_TO_PRELOAD = [
  'assets/UI/new background.png',
  'assets/UI/bg.jpeg',
  'assets/UI/button option 2.png',
  'assets/UI/New/Final Back Icon.webp',
  'assets/UI/New/Final Camera Icon.webp',
  'assets/UI/New/Final Video start.webp',
  'assets/UI/New/Final Video stop.webp',
  'assets/UI/New/BG.webp',
  'assets/UI/New/Dust.png',
  'assets/UI/Forward.png',
  'assets/targets.mind',
  // Add other critical UI assets here
];

const Preloader = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let loadedCount = 0;
    const totalAssets = ASSETS_TO_PRELOAD.length;

    const loadAsset = (src) => {
      return new Promise((resolve, reject) => {
        if (src.endsWith('.mind')) {
          fetch(src)
            .then(response => {
              if (!response.ok) throw new Error('Network response was not ok');
              return response.blob();
            })
            .then(() => resolve(src))
            .catch(err => {
              console.warn(`Failed to preload asset: ${src}`, err);
              resolve(src); // Resolve anyway to not block the app
            });
        } else {
          const img = new Image();
          img.src = src;
          img.onload = () => resolve(src);
          img.onerror = () => {
            console.warn(`Failed to preload image: ${src}`);
            resolve(src); // Resolve anyway to not block the app
          };
        }
      });
    };

    Promise.all(ASSETS_TO_PRELOAD.map(async (src) => {
      await loadAsset(src);
      loadedCount++;
      setProgress(Math.round((loadedCount / totalAssets) * 100));
    })).then(() => {
      // Small delay to ensure the progress bar reaches 100% visually
      setTimeout(onComplete, 500);
    });
  }, [onComplete]);

  return (
    <div className="preloader">
      <div className="loader-content">
        <div className="spinner"></div>
        <p>Loading... {progress}%</p>
      </div>
    </div>
  );
};

function App() {
  const [isLoading, setIsLoading] = useState(true);
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

  if (isLoading) {
    return <Preloader onComplete={() => setIsLoading(false)} />;
  }

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
