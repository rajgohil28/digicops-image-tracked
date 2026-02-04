import React from 'react';
import '../App.css'; // We'll add shared styles here

const Welcome = ({ onStart }) => {
  return (
    <div className="screen welcome-screen">
      <img src="/assets/UI/Logo.png" alt="Magic AR World Logo" className="welcome-logo" />
      <button className="btn-start" onClick={onStart}>
        Start Magic
      </button>
    </div>
  );
};

export default Welcome;
