export const getAudioContext = () => {
  if (!(window as any).audioCtx) {
    try {
      (window as any).audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn("AudioContext not supported");
    }
  }
  return (window as any).audioCtx as AudioContext;
};

export const initAudio = () => {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
};

export const playTone = (freq: number, type: OscillatorType, duration: number, vol: number = 0.1) => {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
};

export const playBoot = () => {
  initAudio();
  playTone(300, 'square', 0.1, 0.05);
  setTimeout(() => playTone(400, 'square', 0.1, 0.05), 100);
  setTimeout(() => playTone(600, 'square', 0.2, 0.05), 200);
};

export const playAction = () => {
  initAudio();
  playTone(800, 'sine', 0.05, 0.02);
};

export const playGameOver = () => {
  initAudio();
  playTone(150, 'sawtooth', 1, 0.1);
  setTimeout(() => playTone(100, 'sawtooth', 1.5, 0.1), 200);
};

export const playType = () => {
  playTone(150 + Math.random() * 50, 'square', 0.05, 0.005);
};
