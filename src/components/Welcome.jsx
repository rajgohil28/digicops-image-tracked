import React from 'react';
import '../App.css'; // We'll add shared styles here
import { playClickSound } from '../utils/audio';

const Welcome = ({ onStart }) => {
  const handleStart = () => {
    playClickSound();
    onStart();
  };

  return (
    <div className="screen welcome-screen">
      <img src="./assets/UI/Logo.png" alt="Magic AR World Logo" className="welcome-logo" />
      <button className="btn-start" onClick={handleStart}>
        Start Magic
      </button>
    </div>
  );
};

export default Welcome;
