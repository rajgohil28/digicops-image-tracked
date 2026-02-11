import React, { useEffect, useRef, useState } from 'react';
import '../App.css';
import { playClickSound } from '../utils/audio';

const ANIMALS = [
  { id: 1, name: 'Puma', file: './assets/models/puma.glb', scale: '1 1 1', position: '0 0 0' , rotation: '0 0 0', idleAnimation: 'Armature|idle pose', activeAnimation: 'Armature|aggressive_roar'},
  { id: 2, name: 'Elephant', file: './assets/models/Elephant.glb', scale: '0.5 0.5 0.5', position: '0 0 0' , rotation: '0 0 0', idleAnimation: 'Animation_01', activeAnimation: 'Animation_03'},
  { id: 3, name: 'Deer', file: './assets/models/Deer.glb', scale: '1 1 1', position: '0 0 0' , rotation: '0 0 0', idleAnimation: 'deer_ideal_call_01', activeAnimation: 'deer_hit_reaction_front_01'},
  { id: 4, name: 'Robin', file: './assets/models/robin_bird.glb', scale: '10 10 10', position: '0 0 0' , rotation: '0 0 0', idleAnimation: 'Robin_Bird_Idle', activeAnimation: 'Robin_Bird_Walk'},
  { id: 5, name: 'Alex', file: './assets/models/bird_alex.glb', scale: '0.5 0.5 0.5', position: '0 0 0' , rotation: '0 0 0', idleAnimation: 'idleB1', activeAnimation: 'fly1_bird'},
];

const MagicTshirt = ({ onBack }) => {
  const [targetFound, setTargetFound] = useState(false);
  const [selectedAnimalIndex, setSelectedAnimalIndex] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [isModelAnimated, setIsModelAnimated] = useState(false);
  
  const sceneRef = useRef(null);
  const targetRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const downloadBlob = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const takeScreenshot = async () => {
    playClickSound();
    if (!sceneRef.current) {
      console.error('[MagicTshirt] sceneRef.current is null');
      return;
    }
    console.log('[MagicTshirt] takeScreenshot started');
    
    try {
      const scene = sceneRef.current;
      const canvas = scene.canvas;
      const video = document.querySelector('video');

      if (!canvas) {
        console.error('[MagicTshirt] A-Frame canvas not found');
        return;
      }
      if (!video) {
        console.error('[MagicTshirt] MindAR video element not found');
        return;
      }

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const ctx = tempCanvas.getContext('2d');

      ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
      ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

      tempCanvas.toBlob(async (blob) => {
        if (!blob) {
          console.error('[MagicTshirt] failed to create blob from canvas');
          return;
        }
        const file = new File([blob], `screenshot-${Date.now()}.png`, { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'DigiCops AR Screenshot',
              text: 'Check out this cool AR experience!',
            });
          } catch (err) {
            if (err.name !== 'AbortError') {
              console.error('[MagicTshirt] navigator.share failed:', err);
            }
            downloadBlob(blob, file.name);
          }
        } else {
          downloadBlob(blob, file.name);
        }
      }, 'image/png');
    } catch (err) {
      console.error('[MagicTshirt] takeScreenshot catch block error:', err);
    }
  };

  const recordingLoopRef = useRef(null);
  const hiddenCanvasRef = useRef(null);

  const startRecording = () => {
    if (!sceneRef.current || isRecording) return;
    
    const canvas = sceneRef.current.canvas;
    const video = document.querySelector('video');
    if (!canvas || !video) {
      console.error('[MagicTshirt] canvas or video not found for recording');
      return;
    }

    try {
      const mergeCanvas = document.createElement('canvas');
      mergeCanvas.width = canvas.width;
      mergeCanvas.height = canvas.height;
      const mergeCtx = mergeCanvas.getContext('2d');
      hiddenCanvasRef.current = mergeCanvas;

      const stream = mergeCanvas.captureStream(30);

      let mimeType = 'video/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = '';
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];

      const drawFrame = () => {
        if (mediaRecorderRef.current?.state !== 'recording') return;
        
        if (mergeCanvas.width !== canvas.width || mergeCanvas.height !== canvas.height) {
          mergeCanvas.width = canvas.width;
          mergeCanvas.height = canvas.height;
        }

        mergeCtx.drawImage(video, 0, 0, mergeCanvas.width, mergeCanvas.height);
        mergeCtx.drawImage(canvas, 0, 0, mergeCanvas.width, mergeCanvas.height);
        
        recordingLoopRef.current = requestAnimationFrame(drawFrame);
      };

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        cancelAnimationFrame(recordingLoopRef.current);
        const blob = new Blob(recordedChunksRef.current, { type: mimeType || 'video/webm' });
        const fileName = `recording-${Date.now()}.${mimeType === 'video/mp4' ? 'mp4' : 'webm'}`;
        const file = new File([blob], fileName, { type: blob.type });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'DigiCops AR Recording',
            });
          } catch (err) {
            if (err.name !== 'AbortError') {
              console.error('[MagicTshirt] recording share failed:', err);
            }
            downloadBlob(blob, file.name);
          }
        } else {
          downloadBlob(blob, file.name);
        }
      };

      setIsRecording(true);
      recorder.start(1000);
      drawFrame();
    } catch (err) {
      console.error('[MagicTshirt] startRecording catch block error:', err);
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const toggleRecording = () => {
    playClickSound();
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleBack = () => {
    playClickSound();
    onBack();
  };

  const handleNextAnimal = () => {
    playClickSound();
    nextAnimal();
  };

  const handlePrevAnimal = () => {
    playClickSound();
    prevAnimal();
  };

  useEffect(() => {
    const target = targetRef.current;
    
    const handleTargetFound = () => {
      console.log('[MagicTshirt] targetFound event');
      setTargetFound(true);
      setSelectedAnimalIndex(current => {
        if (current === null) {
          console.log('[MagicTshirt] No animal selected yet -> opening menu');
          setMenuOpen(true);
        }
        return current;
      });
    };

    const handleTargetLost = () => {
      console.log('[MagicTshirt] targetLost event');
      setTargetFound(false);
      setSelectedAnimalIndex(null);
      setMenuOpen(false);
    };

    if (target) {
      target.addEventListener('targetFound', handleTargetFound);
      target.addEventListener('targetLost', handleTargetLost);
    }

    // Add click listener to scene for A-Frame events
    const scene = sceneRef.current;
    
    const handleInteraction = (e) => {
      // Toggle animation if an animal is visible and the click isn't on a UI button
      // We check if targetFound and selectedAnimalIndex !== null
      // We use current state via a ref-like pattern or just check the DOM if needed, 
      // but since it's inside useEffect with [] it will use initial values.
      // Wait, inside useEffect with [] state values will be stale.
      
      // Better to use a ref for these states or just handle it differently.
      // Actually, I'll use the 'click' event on the document and check if it's not a UI element.
    };

    const handleGlobalClick = (e) => {
      const clickedEl = e.target;
      const isUiClick = clickedEl.closest('button') || clickedEl.closest('.scale-slider-container') || clickedEl.closest('.animal-vertical-menu');
      
      if (!isUiClick) {
        console.log('[MagicTshirt] Global screen click detected');
        // Dispatch custom event to handle the toggle with fresh state
        window.dispatchEvent(new CustomEvent('toggle-animal-animation'));
      }
    };

    window.addEventListener('click', handleGlobalClick);
    // Also handle touchstart for faster response on mobile
    window.addEventListener('touchstart', (e) => {
      const clickedEl = e.target;
      const isUiClick = clickedEl.closest('button') || clickedEl.closest('.scale-slider-container') || clickedEl.closest('.animal-vertical-menu');
      if (!isUiClick) {
        // Prevent default might interfere with UI, so we just log or use it carefully
        // console.log('[MagicTshirt] Global touch detected');
      }
    }, {passive: true});

    const onToggleEvent = () => {
      // We only toggle if we are in a state where an animal can be animated
      // But since we can't easily check targetFound here without stale state,
      // we'll just toggle the boolean. The visible model will react.
      setIsModelAnimated(prev => !prev);
    };
    window.addEventListener('toggle-animal-animation', onToggleEvent);

    return () => {
      if (target) {
        target.removeEventListener('targetFound', handleTargetFound);
        target.removeEventListener('targetLost', handleTargetLost);
      }
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('toggle-animal-animation', onToggleEvent);
      if (scene && scene.systems['mindar-image-system']) {
        try {
          scene.systems['mindar-image-system'].stop();
        } catch (e) {
          console.warn('[MagicTshirt] Error stopping MindAR system during cleanup:', e);
        }
      }
    };
  }, []);

  const nextAnimal = () => {
    if (selectedAnimalIndex === null) return;
    setIsModelAnimated(false);
    setSelectedAnimalIndex((prev) => (prev + 1) % ANIMALS.length);
  };

  const prevAnimal = () => {
    if (selectedAnimalIndex === null) return;
    setIsModelAnimated(false);
    setSelectedAnimalIndex((prev) => (prev - 1 + ANIMALS.length) % ANIMALS.length);
  };

  return (
    <div className="ar-container">
      {/* Back Button - Top Left */}
      <button className="icon-btn-back" onClick={handleBack} aria-label="Go back">
        <img id="ui-back-icon" src="./assets/UI/Final Back Icon.png" alt="Back" />
      </button>

      {/* AR Scene */}
      <a-scene
        ref={sceneRef}
        mindar-image="imageTargetSrc: ./assets/targets.mind; autoStart: true; uiLoading: no; uiError: no; uiScanning: no; filterMinCF:0.0001; filterBeta: 0.001; warmupTolerance: 5; missTolerance: 5"
        color-space="sRGB"
        embedded
        renderer="colorManagement: true, physicallyCorrectLights, alpha: true"
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}
      >
        <a-assets>
          {ANIMALS.map((animal) => (
            <a-asset-item key={animal.id} id={`model-${animal.id}`} src={animal.file}></a-asset-item>
          ))}
        </a-assets>

        <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

        <a-light type="directional" position="1 4 3" intensity="1.5" target="#model-target"></a-light>
        <a-light type="ambient" intensity="0.5"></a-light>

        <a-entity ref={targetRef} mindar-image-target="targetIndex: 0" id="model-target">
          {ANIMALS.map((animal, index) => {
            const isVisible = targetFound && selectedAnimalIndex === index;
            const [sx, sy, sz] = animal.scale.split(' ').map(Number);
            const scaledScale = `${sx * scaleFactor} ${sy * scaleFactor} ${sz * scaleFactor}`;
            
            const currentClip = isModelAnimated ? animal.activeAnimation : animal.idleAnimation;
            const mixerString = `clip: ${currentClip}; loop: repeat; timeScale: 1`;
            
            if (isVisible) {
              console.log(`[MagicTshirt] Rendering visible model: ${animal.name}, clip: ${currentClip}, animated: ${isModelAnimated}`);
            }

            return (
              <a-gltf-model
                key={animal.id}
                id={`animal-model-${animal.id}`}
                src={`#model-${animal.id}`}
                rotation={animal.rotation}
                position={animal.position}
                scale={scaledScale}
                visible={isVisible ? 'true' : 'false'}
                animation-mixer={mixerString}
                force-opaque
              ></a-gltf-model>
            );
          })}
        </a-entity>
      </a-scene>

      {/* Scanning Overlay */}
      {!targetFound && (
        <div className="scanning-overlay">
          <div className="scan-guide"></div>
          <p>Scan your Magic T-shirt</p>
        </div>
      )}

      {/* Animal Menu Overlay (Visible when target found AND menu is open) */}
      {targetFound && menuOpen && (
        <div className="animal-vertical-menu">
          {ANIMALS.map((animal, index) => (
            <button 
              key={animal.id}
              className="animal-menu-item"
              onClick={() => {
                playClickSound();
                console.log('[MagicTshirt] animal selected via menu:', animal.name, 'index:', index);
                setIsModelAnimated(false);
                setSelectedAnimalIndex(index);
                setMenuOpen(false);
              }}
            >
              {animal.name}
            </button>
          ))}
        </div>
      )}

      {/* Navigation Arrows & Slider */}
      {targetFound && selectedAnimalIndex !== null && (
        <>
          <button className="nav-arrow left" onClick={handlePrevAnimal}>
            <img id="ui-nav-prev" src="./assets/UI/Forward.png" alt="Previous" style={{ transform: 'rotate(180deg)' }} />
          </button>
          <button className="nav-arrow right" onClick={handleNextAnimal}>
            <img id="ui-nav-next" src="./assets/UI/Forward.png" alt="Next" />
          </button>

          <div className="scale-slider-container">
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={scaleFactor}
              onChange={(e) => setScaleFactor(parseFloat(e.target.value))}
              className="scale-slider"
            />
            <div className="scale-label">Size</div>
          </div>
        </>
      )}

      {/* Bottom Action Bar */}
      <div className="bottom-action-bar">
        <button className="action-circle-btn" onClick={takeScreenshot}>
          <img id="ui-capture-icon" src="./assets/UI/Final Camera Icon.png" alt="Capture" />
        </button>
        <button className={`action-circle-btn ${isRecording ? 'recording' : ''}`} onClick={toggleRecording}>
          <img 
            id="ui-video-icon"
            src={isRecording ? './assets/UI/Final Video stop.png' : './assets/UI/Final Video start.png'} 
            alt={isRecording ? "Stop Video" : "Start Video"} 
          />
        </button>
      </div>
    </div>
  );
};

export default MagicTshirt;
