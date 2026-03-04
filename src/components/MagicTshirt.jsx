import React, { useEffect, useRef, useState } from 'react';
import '../App.css';
import { playClickSound, startBgSound, stopBgSound, getAudioStream, playAppearSound, stopAppearSound } from '../utils/audio';

/*const ANIMALS = [
  { id: 1, name: 'Bear', file: 'assets/models/bear.glb', scale: '1 1 1', position: '0 0 0' , rotation: '0 0 0', idleAnimation: 'bear_idle_static_pose_01', activeAnimation: 'bear_attack_01'},
  { id: 2, name: 'Elephant', file: 'assets/models/Elephant.glb', scale: '0.5 0.5 0.5', position: '0 0 0' , rotation: '0 0 0', idleAnimation: 'Animation_01', activeAnimation: 'Animation_03'},
  { id: 3, name: 'Deer', file: 'assets/models/Deer.glb', scale: '1 1 1', position: '0 0 0' , rotation: '0 0 0', idleAnimation: 'deer_ideal_call_01', activeAnimation: 'deer_hit_reaction_front_01'},
  { id: 4, name: 'Robin', file: 'assets/models/robin_bird.glb', scale: '10 10 10', position: '0 0 0' , rotation: '0 0 0', idleAnimation: 'Robin_Bird_Idle', activeAnimation: 'Robin_Bird_Walk'},
  { id: 5, name: 'Alex', file: 'assets/models/bird_alex.glb', scale: '0.5 0.5 0.5', position: '0 0 0' , rotation: '0 0 0', idleAnimation: 'idleB1', activeAnimation: 'fly1_bird'},
];*/
const ANIMALS = [
  { id: 1, name: 'Bear', file: 'assets/new_models/Bear.glb', scale: '1 1 1', position: '0 0 0' , rotation: '0 0 0', idleAnimation: 'bear_idle_stand_oneoff_02', activeAnimation: 'bear_attack_01', animationSpeed: 1, idleAnimationSpeed: 1, appearSound: 'assets/Sound/Animal-Sounds/Bear_new.mp3' },
  { id: 2, name: 'Elephant', file: 'assets/new_models/Elephant.glb', scale: '0.4 0.4 0.4', position: '0 0 0' , rotation: '0 0 0', idleAnimation: 'Animation_01', activeAnimation: 'Animation_03', animationSpeed: 2, idleAnimationSpeed: 1, appearSound: 'assets/Sound/Animal-Sounds/Elephant_new.mp3' },
  { id: 3, name: 'Deer', file: 'assets/new_models/Deer.glb', scale: '1 1 1', position: '0 0 0' , rotation: '0 0 0', idleAnimation: 'deer_idle_eat_look_around_01', activeAnimation: 'deer_sprint_fwd_01', animationSpeed: 1, idleAnimationSpeed: 1, appearSound: 'assets/Sound/Animal-Sounds/Deer-Sound.mp3' },
  { id: 4, name: 'Robin', file: 'assets/new_models/RobinBird.glb', scale: '10 10 10', position: '0 0 0' , rotation: '0 0 0', idleAnimation: 'Robin_Bird_Idle', activeAnimation: 'Robin_Bird_Walk', animationSpeed: 1, idleAnimationSpeed: 1, appearSound: 'assets/Sound/Animal-Sounds/Robin-Sound.mp3' },
  { id: 5, name: 'Alex', file: 'assets/new_models/AlexBird.glb', scale: '0.5 0.5 0.5', position: '0 0 0' , rotation: '0 0 0', idleAnimation: 'fly1_bird', activeAnimation: 'fly1_bird', animationSpeed: 1, idleAnimationSpeed: 0.1, activeDuration: 3000, customActiveLoop: 'repeat', appearSound: 'assets/Sound/Animal-Sounds/Humminfbird-Sound.mp3' },
];

const MagicTshirt = ({ onBack }) => {
  const [targetFound, setTargetFound] = useState(false);
  const [selectedAnimalIndex, setSelectedAnimalIndex] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [isModelAnimated, setIsModelAnimated] = useState(false);
  const [isResettingAnimation, setIsResettingAnimation] = useState(false);
  const [animTrigger, setAnimTrigger] = useState(0);
  
  const sceneRef = useRef(null);
  const targetRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const selectedAnimalIndexRef = useRef(null);
  const activeTimerRef = useRef(null);

  // Keep ref in sync for the event listeners
  useEffect(() => {
    selectedAnimalIndexRef.current = selectedAnimalIndex;
  }, [selectedAnimalIndex]);

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
    
    try {
      const scene = sceneRef.current;
      const video = document.querySelector('video');

      if (!video) {
        console.error('[MagicTshirt] video not found');
        return;
      }

      // Use A-Frame built-in screenshot component to get the AR overlay
      // This method is more reliable for capturing WebGL content
      const screenshotComponent = scene.components.screenshot;
      if (!screenshotComponent) {
        console.error('[MagicTshirt] screenshot component not found on scene');
        return;
      }

      const arCanvas = screenshotComponent.getCanvas('perspective');
      
      const tempCanvas = document.createElement('canvas');
      
      // Match dimensions to the actual device screen pixels
      const dpr = window.devicePixelRatio || 1;
      tempCanvas.width = window.innerWidth * dpr;
      tempCanvas.height = window.innerHeight * dpr;
      
      const ctx = tempCanvas.getContext('2d');

      // 1. Draw camera feed
      // Calculate object-fit: cover for the video feed to match how it looks on screen
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      const targetWidth = tempCanvas.width;
      const targetHeight = tempCanvas.height;
      
      const videoAspect = videoWidth / videoHeight;
      const screenAspect = targetWidth / targetHeight;
      
      let drawWidth, drawHeight, offsetX, offsetY;
      
      if (videoAspect > screenAspect) {
        // Video is wider than screen - crop sides
        drawHeight = targetHeight;
        drawWidth = targetHeight * videoAspect;
        offsetX = (targetWidth - drawWidth) / 2;
        offsetY = 0;
      } else {
        // Video is taller than screen - crop top/bottom
        drawWidth = targetWidth;
        drawHeight = targetWidth / videoAspect;
        offsetX = 0;
        offsetY = (targetHeight - drawHeight) / 2;
      }

      ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
      
      // 2. Draw AR overlay
      // A-Frame canvas usually already matches the window size via CSS/MindAR
      ctx.drawImage(arCanvas, 0, 0, tempCanvas.width, tempCanvas.height);

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
      // Use screen dimensions for recording
      mergeCanvas.width = window.innerWidth;
      mergeCanvas.height = window.innerHeight;
      const mergeCtx = mergeCanvas.getContext('2d');
      hiddenCanvasRef.current = mergeCanvas;

      const stream = mergeCanvas.captureStream(30);
      
      // Add audio track from our WebAudio system
      const audioStream = getAudioStream();
      if (audioStream) {
        const audioTracks = audioStream.getAudioTracks();
        if (audioTracks.length > 0) {
          stream.addTrack(audioTracks[0]);
          console.log('[MagicTshirt] Added system audio track to recording');
        }
      }

      // Prefer mp4 if supported (especially for iOS), fallback to webm
      let mimeType = 'video/mp4';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=h264';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];

      const drawFrame = () => {
        if (mediaRecorderRef.current?.state !== 'recording') return;
        
        // Ensure dimensions match current window (in case of orientation change)
        if (mergeCanvas.width !== window.innerWidth || mergeCanvas.height !== window.innerHeight) {
          mergeCanvas.width = window.innerWidth;
          mergeCanvas.height = window.innerHeight;
        }

        const targetWidth = mergeCanvas.width;
        const targetHeight = mergeCanvas.height;
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        
        const videoAspect = videoWidth / videoHeight;
        const screenAspect = targetWidth / targetHeight;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (videoAspect > screenAspect) {
          drawHeight = targetHeight;
          drawWidth = targetHeight * videoAspect;
          offsetX = (targetWidth - drawWidth) / 2;
          offsetY = 0;
        } else {
          drawWidth = targetWidth;
          drawHeight = targetWidth / videoAspect;
          offsetX = 0;
          offsetY = (targetHeight - drawHeight) / 2;
        }

        // 1. Draw camera feed
        mergeCtx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
        
        // 2. Draw AR overlay (A-Frame canvas)
        mergeCtx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
        
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
        
        // Use mp4 extension if mimeType is mp4, otherwise webm
        const isMp4 = mimeType.includes('mp4');
        const fileName = `recording-${Date.now()}.${isMp4 ? 'mp4' : 'webm'}`;
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
    stopBgSound();
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
      startBgSound();
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
      stopBgSound();
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
      // Logic to trigger or restart the active animation
      // We force a reset by briefly disabling the animation-mixer component.
      // This ensures that even if the clip is the same (like Alex), it restarts from frame 0.
      
      // Clear any existing timer for animation reset
      if (activeTimerRef.current) {
        clearTimeout(activeTimerRef.current);
        activeTimerRef.current = null;
      }

      // Stop any previous animal sound and play the current one
      stopAppearSound();
      const currentIndex = selectedAnimalIndexRef.current;
      if (currentIndex !== null) {
        const currentAnimal = ANIMALS[currentIndex];
        if (currentAnimal.appearSound) {
          playAppearSound(currentAnimal.appearSound);
        }
      }

      setIsResettingAnimation(true);
      setIsModelAnimated(true);
      
      // Small delay to allow React to unmount the mixer component
      setTimeout(() => {
        setIsResettingAnimation(false);
        setAnimTrigger(prev => prev + 1);
        console.log('[MagicTshirt] Active animation restarted');

        // Check if current animal has a specific duration for active state
        if (currentIndex !== null) {
          const currentAnimal = ANIMALS[currentIndex];
          if (currentAnimal.activeDuration) {
            console.log(`[MagicTshirt] Setting active duration timer: ${currentAnimal.activeDuration}ms`);
            activeTimerRef.current = setTimeout(() => {
              console.log('[MagicTshirt] Active duration ended, returning to idle');
              setIsModelAnimated(false);
              activeTimerRef.current = null;
            }, currentAnimal.activeDuration);
          }
        }
      }, 50); 
    };

    const onAnimationFinished = (e) => {
      // Only reset if the event came from the currently selected model
      const finishedElId = e.detail?.id;
      const currentIndex = selectedAnimalIndexRef.current;
      
      if (currentIndex !== null && finishedElId === `animal-model-${ANIMALS[currentIndex].id}`) {
        console.log('[MagicTshirt] Animation finished for current model:', finishedElId);
        setIsModelAnimated(false);
      }
    };

    window.addEventListener('toggle-animal-animation', onToggleEvent);
    window.addEventListener('animation-finished-event', onAnimationFinished);

    return () => {
      stopBgSound();
      if (target) {
        target.removeEventListener('targetFound', handleTargetFound);
        target.removeEventListener('targetLost', handleTargetLost);
      }
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('toggle-animal-animation', onToggleEvent);
      window.removeEventListener('animation-finished-event', onAnimationFinished);
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
    stopAppearSound();
    const nextIndex = (selectedAnimalIndex + 1) % ANIMALS.length;
    setIsModelAnimated(false);
    setAnimTrigger(0);
    setScaleFactor(1);
    setSelectedAnimalIndex(nextIndex);
  };

  const prevAnimal = () => {
    if (selectedAnimalIndex === null) return;
    stopAppearSound();
    const prevIndex = (selectedAnimalIndex - 1 + ANIMALS.length) % ANIMALS.length;
    setIsModelAnimated(false);
    setAnimTrigger(0);
    setScaleFactor(1);
    setSelectedAnimalIndex(prevIndex);
  };

  return (
    <div className="ar-container">
      {/* Back Button - Top Left */}
      <button className="icon-btn-back" onClick={handleBack} aria-label="Go back">
        <img id="ui-back-icon" src="assets/UI/New/Final Back Icon.webp" alt="Back" />
      </button>

      {/* AR Scene */}
      <a-scene
        ref={sceneRef}
        mindar-image="imageTargetSrc: assets/targets.mind; autoStart: true; uiLoading: no; uiError: no; uiScanning: no; filterMinCF:0.0001; filterBeta: 0.001; warmupTolerance: 10; missTolerance: 20"
        color-space="sRGB"
        embedded
        renderer="alpha: true; antialias: true; colorManagement: true; preserveDrawingBuffer: true"
        screenshot
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
            const currentSpeed = isModelAnimated ? (animal.animationSpeed || 1) : (animal.idleAnimationSpeed || 1);
            
            // When starting the active animation (once), we use a short crossFade (0.1s)
            // to ensure it starts from the beginning quickly. For idle (repeat), 
            // we use a smoother transition (0.4s).
            const crossFade = isModelAnimated ? 0.1 : 0.4;
            // Determine loop mode: 'once' for standard active animations, 'repeat' for specific models like Alex (with duration), or 'repeat' for idle
            let loopMode = 'repeat';
            if (isModelAnimated) {
              loopMode = animal.customActiveLoop || 'once';
            }
            
            const mixerString = `clip: ${currentClip}; loop: ${loopMode}; timeScale: ${currentSpeed}; crossFadeDuration: ${crossFade}`;
            
            // When resetting (user click), we temporarily remove the component (using null)
            // to force a full re-initialization of the animation-mixer.
            // Note: passing null to the attribute removes it from the DOM element.
            const mixerComponent = isResettingAnimation ? null : mixerString;
            
            if (isVisible) {
              console.log(`[MagicTshirt] Rendering visible model: ${animal.name}, clip: ${currentClip}, animated: ${isModelAnimated}, resetting: ${isResettingAnimation}`);
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
                animation-mixer={isVisible ? mixerComponent : null}
                animation-finished-listener
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
                stopAppearSound();
                setIsModelAnimated(false);
                setAnimTrigger(0);
                setScaleFactor(1);
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
            <img id="ui-nav-prev" src="assets/UI/Forward.png" alt="Previous" style={{ transform: 'rotate(180deg)' }} />
          </button>
          <button className="nav-arrow right" onClick={handleNextAnimal}>
            <img id="ui-nav-next" src="assets/UI/Forward.png" alt="Next" />
          </button>

          <div className="scale-slider-container">
            <input
              type="range"
              min="1"
              max="2"
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
        {!isRecording && (
          <button className="action-circle-btn" onClick={takeScreenshot}>
            <img id="ui-capture-icon" src="assets/UI/New/Final Camera Icon.webp" alt="Capture" />
          </button>
        )}
        <button className={`action-circle-btn ${isRecording ? 'recording' : ''}`} onClick={toggleRecording}>
          <img 
            id="ui-video-icon"
            src={isRecording ? 'assets/UI/New/Final Video stop.webp' : 'assets/UI/New/Final Video start.webp'} 
            alt={isRecording ? "Stop Video" : "Start Video"} 
          />
        </button>
      </div>
    </div>
  );
};

export default MagicTshirt;
