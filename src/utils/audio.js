// Create a single AudioContext for the entire app
let audioCtx = null;
let bgSourceNode = null;
let destNode = null; // This will be the MediaStreamDestination for recording

// Helper to get or create context
const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
    
    // Create destination for recording
    destNode = audioCtx.createMediaStreamDestination();
  }
  
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  return audioCtx;
};

// --- NEW: Add Microphone support ---
let micSourceNode = null;

export const enableMicrophone = async () => {
  const ctx = getAudioContext();
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    micSourceNode = ctx.createMediaStreamSource(stream);
    
    // Connect microphone ONLY to the recording destination, NOT the speakers (to avoid feedback loop)
    if (destNode) {
      micSourceNode.connect(destNode);
      console.log('Microphone connected to recording stream');
    }
    return true;
  } catch (err) {
    console.warn('Microphone access denied or failed:', err);
    return false;
  }
};
// -----------------------------------

// Helper: load buffer
const loadBuffer = async (url) => {
  const ctx = getAudioContext();
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await ctx.decodeAudioData(arrayBuffer);
  } catch (err) {
    console.warn(`Failed to load audio buffer: ${url}`, err);
    return null;
  }
};

// Buffers cache
const buffers = {};

export const preloadAudio = async () => {
  const ctx = getAudioContext();
  buffers['click'] = await loadBuffer('assets/Sound/Click2.mp3');
  buffers['bg'] = await loadBuffer('assets/Sound/BGSound.mp3');
};

export const playClickSound = async () => {
  const ctx = getAudioContext();
  if (!buffers['click']) {
    // Fallback if not preloaded
    const audio = new Audio('assets/Sound/Click2.mp3');
    // Connect to destination if possible? HTML5 Audio element is hard to connect to WebAudio without CORS issues usually.
    // For recording, best to use WebAudio source.
    // Let's try to load buffer on the fly if needed.
    buffers['click'] = await loadBuffer('assets/Sound/Click2.mp3');
  }
  
  if (buffers['click']) {
    const source = ctx.createBufferSource();
    source.buffer = buffers['click'];
    
    // Connect to BOTH speakers (ctx.destination) AND recording stream (destNode)
    source.connect(ctx.destination);
    if (destNode) source.connect(destNode);
    
    source.start(0);
  }
};

let bgSource = null;

export const startBgSound = async () => {
  const ctx = getAudioContext();
  
  if (bgSource) return; // Already playing
  
  if (!buffers['bg']) {
    buffers['bg'] = await loadBuffer('assets/Sound/BGSound.mp3');
  }
  
  if (buffers['bg']) {
    bgSource = ctx.createBufferSource();
    bgSource.buffer = buffers['bg'];
    bgSource.loop = true;
    
    // Connect to BOTH speakers and recording
    bgSource.connect(ctx.destination);
    if (destNode) bgSource.connect(destNode);
    
    bgSource.start(0);
  }
};

export const stopBgSound = () => {
  if (bgSource) {
    try {
      bgSource.stop();
    } catch (e) {
      // ignore if already stopped
    }
    bgSource = null;
  }
};

// Export the stream for the recorder to use
export const getAudioStream = () => {
  // Ensure context exists
  getAudioContext();
  return destNode ? destNode.stream : null;
};

// Play animal appear sound (used when a model is shown)
export const playAppearSound = async (url) => {
  if (!url) return;
  const ctx = getAudioContext();
  try {
    const buffer = await loadBuffer(url);
    if (buffer) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      if (destNode) source.connect(destNode);
      source.start(0);
      return;
    }
  } catch (err) {
    console.warn('Appear sound failed via WebAudio, falling back to HTMLAudio:', url, err);
  }

  // Fallback: plain HTMLAudio in case fetch/decode fails (e.g. on some mobile/local setups)
  try {
    const audioEl = new Audio(url);
    audioEl.play().catch(() => {});
  } catch (e) {
    console.warn('Fallback HTMLAudio also failed for appear sound:', url, e);
  }
};
