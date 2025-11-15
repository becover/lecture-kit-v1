// 다양한 알림음 정의

export type SoundType =
  | 'beep'
  | 'camera'
  | 'double-beep'
  | 'ding'
  | 'soft-beep'
  | 'water-drop'
  | 'pop'
  | 'bell-chime'
  | 'woodblock'
  | 'tick';

export interface Sound {
  id: SoundType;
  name: string;
  generate: () => void;
}

// Web Audio API를 사용한 사운드 생성
const playTone = (frequency: number, duration: number, volume: number = 0.3) => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (error) {
    console.error('오디오 재생 실패:', error);
  }
};

const playDoubleBeep = () => {
  playTone(800, 0.1);
  setTimeout(() => playTone(800, 0.1), 150);
};

// 물방울 소리 (피치가 빠르게 내려가는 짧은 사운드)
const playWaterDrop = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(350, audioContext.currentTime + 0.18);

    gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.35, audioContext.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.2);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.22);
  } catch (e) {
    console.error('오디오 재생 실패:', e);
  }
};

// 팝 소리 (짧은 노이즈 + 하이패스)
const playPop = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const bufferSize = audioContext.sampleRate * 0.03;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    const filter = audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 800;
    const gain = audioContext.createGain();
    gain.gain.value = 0.3;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    source.start();
  } catch (e) {
    console.error('오디오 재생 실패:', e);
  }
};

// 종 소리(차임): 두 개의 사인/사각파를 빠르게 울림
const playBellChime = () => {
  playTone(1320, 0.12, 0.25);
  setTimeout(() => playTone(990, 0.18, 0.22), 60);
};

// 우드블럭: 짧은 사각파 + 빠른 감쇠
const playWoodblock = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'square';
    osc.frequency.value = 700;
    gain.gain.setValueAtTime(0.25, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + 0.08);
  } catch (e) {
    console.error('오디오 재생 실패:', e);
  }
};

// 짧은 틱: 매우 짧은 높은 톤
const playTick = () => playTone(2000, 0.04, 0.18);

const playCameraShutter = () => {
  // 찰칵 소리 시뮬레이션 (화이트 노이즈 + 빠른 감쇠)
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const bufferSize = audioContext.sampleRate * 0.05; // 50ms
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // 화이트 노이즈 생성
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }

    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();

    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

    source.start();
  } catch (error) {
    console.error('오디오 재생 실패:', error);
  }
};

const playDing = () => {
  // 띵동 소리 (높은음 -> 낮은음)
  playTone(1000, 0.15);
  setTimeout(() => playTone(800, 0.15), 100);
};

const playSoftBeep = () => {
  // 부드러운 삑 소리
  playTone(600, 0.2, 0.2);
};

export const SOUNDS: Record<SoundType, Sound> = {
  beep: {
    id: 'beep',
    name: '기본 삑',
    generate: () => playTone(800, 0.15),
  },
  camera: {
    id: 'camera',
    name: '찰칵',
    generate: playCameraShutter,
  },
  'double-beep': {
    id: 'double-beep',
    name: '삐빅',
    generate: playDoubleBeep,
  },
  ding: {
    id: 'ding',
    name: '띵동',
    generate: playDing,
  },
  'soft-beep': {
    id: 'soft-beep',
    name: '부드러운 삑',
    generate: playSoftBeep,
  },
  'water-drop': {
    id: 'water-drop',
    name: '물방울',
    generate: playWaterDrop,
  },
  pop: {
    id: 'pop',
    name: '팝',
    generate: playPop,
  },
  'bell-chime': {
    id: 'bell-chime',
    name: '벨 차임',
    generate: playBellChime,
  },
  woodblock: {
    id: 'woodblock',
    name: '우드블럭',
    generate: playWoodblock,
  },
  tick: {
    id: 'tick',
    name: '틱',
    generate: playTick,
  },
};

export const playSound = (soundType: SoundType) => {
  const sound = SOUNDS[soundType];
  if (sound) {
    sound.generate();
  }
};
