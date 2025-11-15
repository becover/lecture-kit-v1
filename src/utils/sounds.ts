// 다양한 알림음 정의

export type SoundType = 'beep' | 'camera' | 'double-beep' | 'ding' | 'soft-beep';

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
    name: '📷 찰칵',
    generate: playCameraShutter,
  },
  'double-beep': {
    id: 'double-beep',
    name: '삐빅',
    generate: playDoubleBeep,
  },
  ding: {
    id: 'ding',
    name: '🔔 띵동',
    generate: playDing,
  },
  'soft-beep': {
    id: 'soft-beep',
    name: '부드러운 삑',
    generate: playSoftBeep,
  },
};

export const playSound = (soundType: SoundType) => {
  const sound = SOUNDS[soundType];
  if (sound) {
    sound.generate();
  }
};
