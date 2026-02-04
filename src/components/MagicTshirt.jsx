import React, { useEffect, useRef, useState } from 'react';
import '../App.css';

const ANIMALS = [
  { id: 1, name: 'Lion', file: '/assets/Lion.glb', scale: '1 1 1', position: '0 0 0' , rotation: '0 0 0'},
  { id: 2, name: 'Tiger', file: '/assets/TigerLP.glb', scale: '1 1 1', position: '0 0 0' , rotation: '0 0 0'},
  { id: 3, name: 'Hippopotamus', file: '/assets/Hippo.glb', scale: '1 1 1', position: '0 0 0' , rotation: '0 0 0'},
  { id: 4, name: 'Goldfinch', file: '/assets/Goldfinch.glb', scale: '30 30 30', position: '0 0 0' , rotation: '0 180 0'},
  { id: 5, name: 'Eagle', file: '/assets/Eagle.glb', scale: '2 2 2', position: '0 0 0' , rotation: '0 0 0'},
];

const MagicTshirt = ({ onBack }) => {
  const [targetFound, setTargetFound] = useState(false);
  const [selectedAnimalIndex, setSelectedAnimalIndex] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  
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

      console.log('[MagicTshirt] canvas dims:', canvas.width, 'x', canvas.height);
      console.log('[MagicTshirt] video dims:', video.videoWidth, 'x', video.videoHeight);

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const ctx = tempCanvas.getContext('2d');

      console.log('[MagicTshirt] drawing video and canvas to tempCanvas');
      ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
      ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

      console.log('[MagicTshirt] converting tempCanvas to blob');
      tempCanvas.toBlob(async (blob) => {
        if (!blob) {
          console.error('[MagicTshirt] failed to create blob from canvas');
          return;
        }
        console.log('[MagicTshirt] blob created, size:', blob.size);
        const file = new File([blob], `screenshot-${Date.now()}.png`, { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          console.log('[MagicTshirt] using navigator.share');
          try {
            await navigator.share({
              files: [file],
              title: 'DigiCops AR Screenshot',
              text: 'Check out this cool AR experience!',
            });
            console.log('[MagicTshirt] share successful');
          } catch (err) {
            if (err.name !== 'AbortError') {
              console.error('[MagicTshirt] navigator.share failed:', err);
            } else {
              console.log('[MagicTshirt] share aborted by user');
            }
            downloadBlob(blob, file.name);
          }
        } else {
          console.log('[MagicTshirt] navigator.share not supported or cannot share this file, falling back to download');
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
    if (!sceneRef.current) {
      console.error('[MagicTshirt] sceneRef.current is null, cannot start recording');
      return;
    }
    if (isRecording) {
      console.warn('[MagicTshirt] already recording');
      return;
    }
    
    const canvas = sceneRef.current.canvas;
    const video = document.querySelector('video');
    if (!canvas || !video) {
      console.error('[MagicTshirt] canvas or video not found for recording', { canvas: !!canvas, video: !!video });
      return;
    }

    console.log('[MagicTshirt] starting recording combined, canvas size:', canvas.width, 'x', canvas.height);

    try {
      const mergeCanvas = document.createElement('canvas');
      mergeCanvas.width = canvas.width;
      mergeCanvas.height = canvas.height;
      const mergeCtx = mergeCanvas.getContext('2d');
      hiddenCanvasRef.current = mergeCanvas;

      const stream = mergeCanvas.captureStream(30);
      console.log('[MagicTshirt] stream captured from mergeCanvas');

      let mimeType = 'video/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4'; // Fallback for iOS
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = ''; // Let browser decide
        }
      }
      console.log('[MagicTshirt] using mimeType:', mimeType || 'browser default');

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];

      const drawFrame = () => {
        if (mediaRecorderRef.current?.state !== 'recording') {
          console.log('[MagicTshirt] recording loop stopped, recorder state:', mediaRecorderRef.current?.state);
          return;
        }
        
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
          // console.log('[MagicTshirt] data available, size:', e.data.size);
        }
      };

      recorder.onstop = async () => {
        console.log('[MagicTshirt] recorder stopped, total chunks:', recordedChunksRef.current.length);
        cancelAnimationFrame(recordingLoopRef.current);
        const blob = new Blob(recordedChunksRef.current, { type: mimeType || 'video/webm' });
        console.log('[MagicTshirt] recording blob created, size:', blob.size);
        const fileName = `recording-${Date.now()}.${mimeType === 'video/mp4' ? 'mp4' : 'webm'}`;
        const file = new File([blob], fileName, { type: blob.type });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          console.log('[MagicTshirt] sharing recording via navigator.share');
          try {
            await navigator.share({
              files: [file],
              title: 'DigiCops AR Recording',
            });
            console.log('[MagicTshirt] recording share successful');
          } catch (err) {
            if (err.name !== 'AbortError') {
              console.error('[MagicTshirt] recording share failed:', err);
            } else {
              console.log('[MagicTshirt] recording share aborted by user');
            }
            downloadBlob(blob, file.name);
          }
        } else {
          console.log('[MagicTshirt] navigator.share not supported for recording, downloading');
          downloadBlob(blob, file.name);
        }
      };

      setIsRecording(true);
      recorder.start(1000); // chunk every second
      console.log('[MagicTshirt] recorder started');
      drawFrame();
    } catch (err) {
      console.error('[MagicTshirt] startRecording catch block error:', err);
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    console.log('[MagicTshirt] Stopping recording');
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  useEffect(() => {
    const target = targetRef.current;
    
    const handleTargetFound = () => {
      console.log('[MagicTshirt] targetFound event');
      setTargetFound(true);
      // We use a functional update to check the latest state of selectedAnimalIndex
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

    return () => {
      if (target) {
        target.removeEventListener('targetFound', handleTargetFound);
        target.removeEventListener('targetLost', handleTargetLost);
      }
      const scene = sceneRef.current;
      if (scene && scene.systems['mindar-image-system']) {
        try {
          console.log('[MagicTshirt] Cleanup on unmount -> stopping mindar-image-system');
          scene.systems['mindar-image-system'].stop();
        } catch (e) {
          console.warn('[MagicTshirt] Error stopping MindAR system during cleanup:', e);
        }
      }
    };
  }, []);

  const nextAnimal = () => {
    if (selectedAnimalIndex === null) return;
    console.log('[MagicTshirt] nextAnimal from', selectedAnimalIndex);
    setSelectedAnimalIndex((prev) => (prev + 1) % ANIMALS.length);
  };

  const prevAnimal = () => {
    if (selectedAnimalIndex === null) return;
    console.log('[MagicTshirt] prevAnimal from', selectedAnimalIndex);
    setSelectedAnimalIndex((prev) => (prev - 1 + ANIMALS.length) % ANIMALS.length);
  };

  return (
    <div className="ar-container">
      {/* Back Button - Top Left */}
      <button className="icon-btn-back" onClick={onBack} aria-label="Go back">
        <img src="/assets/UI/Final Back Icon.png" alt="Back" />
      </button>

      {/* AR Scene */}
      <a-scene
        ref={sceneRef}
        mindar-image="imageTargetSrc: /assets/targets.mind; autoStart: true; uiLoading: no; uiError: no; uiScanning: no; filterMinCF:0.0001; filterBeta: 0.001; warmupTolerance: 5; missTolerance: 5"
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
            return (
              <a-gltf-model
                key={animal.id}
                src={`#model-${animal.id}`}
                rotation={animal.rotation}
                position={animal.position}
                scale={scaledScale}
                visible={isVisible ? 'true' : 'false'}
                animation-mixer
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
                console.log('[MagicTshirt] animal selected via menu:', animal.name, 'index:', index);
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
          <button className="nav-arrow left" onClick={prevAnimal}>
            <img src="/assets/UI/Forward.png" alt="Previous" style={{ transform: 'rotate(180deg)' }} />
          </button>
          <button className="nav-arrow right" onClick={nextAnimal}>
            <img src="/assets/UI/Forward.png" alt="Next" />
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
          <img src="/assets/UI/Final Camera Icon.png" alt="Capture" />
        </button>
        <button className={`action-circle-btn ${isRecording ? 'recording' : ''}`} onClick={toggleRecording}>
          <img 
            src={isRecording ? '/assets/UI/Final Video stop.png' : '/assets/UI/Final Video start.png'} 
            alt={isRecording ? "Stop Video" : "Start Video"} 
          />
        </button>
      </div>
    </div>
  );
};

export default MagicTshirt;
