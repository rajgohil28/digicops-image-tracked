export const playClickSound = () => {
  const audio = new Audio('assets/Sound/Click2.mp3');
  audio.play().catch(err => console.warn('Sound play failed:', err));
};

let bgAudio = null;

export const startBgSound = () => {
  if (!bgAudio) {
    bgAudio = new Audio('assets/Sound/BGSound.mp3');
    bgAudio.loop = true;
  }
  bgAudio.play().catch(err => console.warn('BG Sound play failed:', err));
};

export const stopBgSound = () => {
  if (bgAudio) {
    bgAudio.pause();
    bgAudio.currentTime = 0;
  }
};
