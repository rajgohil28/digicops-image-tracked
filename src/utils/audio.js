export const playClickSound = () => {
  const audio = new Audio('/assets/Sound/Click2.mp3');
  audio.play().catch(err => console.warn('Sound play failed:', err));
};
