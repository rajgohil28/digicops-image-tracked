import React from 'react';
import '../App.css';

const SelectionOption = ({ title, contentImage, onSelect, disabled }) => {
  return (
    <div className={`selection-option ${disabled ? 'disabled' : ''}`}>
      <div className="option-frame-container">
        {/* The frame asset */}
        <img src="/assets/UI/frame 1.png" alt="frame" className="option-frame" />
        
        {/* Content image inside the frame */}
        <div className="option-content">
          <img src={contentImage} alt={title} className="content-img" />
        </div>
        
        {/* Selection button overlaying the frame bottom */}
        <button 
          className="option-action-btn" 
          onClick={onSelect}
          disabled={disabled}
        >
          {title}
        </button>
      </div>
    </div>
  );
};

const Selection = ({ onSelect, onBack }) => {
  return (
    <div className="screen selection-screen">
      <h1 className="selection-title">
        Select <span className="highlight">Experience</span>
      </h1>

      <div className="options-grid">
        <SelectionOption 
          title="Magic T-Shirt"
          contentImage="/assets/UI/Screen 2 Tshirt.png" // Placeholder for T-shirt image
          onSelect={() => onSelect('magic-tshirt')}
        />
        
        <SelectionOption 
          title="Zoo Sticker"
          contentImage="/assets/UI/Screen 2 Sticker.png" // Placeholder for Lion image
          disabled={true}
          onSelect={() => {}}
        />
      </div>

      <button className="btn-back-selection" onClick={onBack}>
        Back
      </button>
    </div>
  );
};

export default Selection;
