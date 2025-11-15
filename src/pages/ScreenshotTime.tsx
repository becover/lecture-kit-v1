import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as faceapi from '@vladmandic/face-api';
import Tesseract from 'tesseract.js';
import { useTheme } from '../context/ThemeContext';

interface TimeSlot {
  id: number;
  time: string;
  enabled: boolean;
  triggered: boolean;
}

interface FaceDetectionResult {
  faceCount: number;
  warnings: string[];
  hasSmallFaces: boolean;
  hasCroppedFaces: boolean;
}

// FileSystemDirectoryHandle 타입 확장
interface ExtendedFileSystemDirectoryHandle extends FileSystemDirectoryHandle {
  queryPermission(descriptor: {
    mode: 'read' | 'readwrite';
  }): Promise<PermissionState>;
  requestPermission(descriptor: {
    mode: 'read' | 'readwrite';
  }): Promise<PermissionState>;
}

// Window 타입 확장
declare global {
  interface Window {
    showDirectoryPicker(options?: {
      mode?: 'read' | 'readwrite';
    }): Promise<FileSystemDirectoryHandle>;
  }
}

const DEFAULT_TIME_SLOTS: Omit<TimeSlot, 'id' | 'triggered'>[] = [
  { time: '09:10', enabled: true },
  { time: '10:00', enabled: true },
  { time: '11:00', enabled: true },
  { time: '12:00', enabled: true },
  { time: '14:00', enabled: true },
  { time: '15:00', enabled: true },
  { time: '16:00', enabled: true },
  { time: '17:00', enabled: true },
  { time: '17:50', enabled: true },
];

export default function ScreenshotTime() {
  const { colors } = useTheme();

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(() => {
    const saved = localStorage.getItem('screenshot-time-slots');
    if (saved) {
      return JSON.parse(saved);
    }
    return DEFAULT_TIME_SLOTS.map((slot, idx) => ({
      ...slot,
      id: idx + 1,
      triggered: false,
    }));
  });

  const [isActive, setIsActive] = useState(() => {
    const saved = localStorage.getItem('screenshot-time-active');
    return saved === 'true';
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [timeOffset, setTimeOffset] = useState(0); // 서버 시간과의 차이 (ms)
  const [isCapturing, setIsCapturing] = useState(false);
  const [saveDirectory, setSaveDirectory] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [savePath, setSavePath] = useState<string>('브라우저 다운로드 폴더');
  const [usePrefixEnabled, setUsePrefixEnabled] = useState(() => {
    const saved = localStorage.getItem('screenshot-use-prefix');
    return saved === 'true';
  });
  const [filenamePrefix, setFilenamePrefix] = useState(() => {
    return localStorage.getItem('screenshot-filename-prefix') || '';
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [faceDetectionEnabled, setFaceDetectionEnabled] = useState(() => {
    const saved = localStorage.getItem('screenshot-face-detection-enabled');
    return saved === 'true';
  });
  const [ocrEnabled, setOcrEnabled] = useState(() => {
    const saved = localStorage.getItem('screenshot-ocr-enabled');
    return saved === 'false'; // 기본값: 비활성화 (OCR이 느려서)
  });
  const [captureDelayEnabled, setCaptureDelayEnabled] = useState(() => {
    const saved = localStorage.getItem('screenshot-capture-delay');
    return saved === 'true'; // 기본값: 활성화 (1초 딜레이)
  });
  const modelRef = useRef<boolean>(false);
  const lastCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [testImage, setTestImage] = useState<File | null>(null);
  const [testResult, setTestResult] = useState<FaceDetectionResult | null>(
    null
  );
  const [testCanvasUrl, setTestCanvasUrl] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  // 미리보기 상태
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [previewResult, setPreviewResult] = useState<FaceDetectionResult | null>(null);

  // @vladmandic/face-api 모델 로드
  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log('🤖 얼굴 인식 모델 로딩 중...');

        // @vladmandic/face-api 모델 로드 (CDN에서)
        // SSD MobileNet: 정확도 높음 (TinyFaceDetector보다 느리지만 더 정확)
        const MODEL_URL =
          'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);

        modelRef.current = true;
        console.log('✅ 얼굴 인식 모델 로드 완료 (SSD MobileNet)');
      } catch (error) {
        console.error('❌ 얼굴 인식 모델 로드 실패:', error);
      }
    };
    loadModel();
  }, []);

  // 서버 시간 동기화
  useEffect(() => {
    const syncTime = async () => {
      try {
        // timeapi.io 사용 (worldtimeapi.org 대체)
        const response = await fetch(
          'https://timeapi.io/api/time/current/zone?timeZone=Asia/Seoul'
        );
        if (!response.ok) throw new Error('Time sync failed');

        const data = await response.json();
        const serverTime = new Date(data.dateTime).getTime();
        const clientTime = new Date().getTime();
        const offset = serverTime - clientTime;

        setTimeOffset(offset);
        console.log('⏰ 시간 동기화 완료:', {
          serverTime: new Date(serverTime).toISOString(),
          clientTime: new Date(clientTime).toISOString(),
          offset: `${offset}ms`,
        });
      } catch {
        console.warn('⚠️ 서버 시간 동기화 실패, 클라이언트 시간 사용');
        // 클라이언트 시간 사용 (offset = 0)
        setTimeOffset(0);
      }
    };

    syncTime();
  }, []);

  // 보정된 현재 시간 가져오기
  const getAccurateTime = useCallback(() => {
    return new Date(new Date().getTime() + timeOffset);
  }, [timeOffset]);

  // 현재 시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getAccurateTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [getAccurateTime]);

  // 시간대 저장
  useEffect(() => {
    localStorage.setItem('screenshot-time-slots', JSON.stringify(timeSlots));
  }, [timeSlots]);

  // 활성화 상태 저장
  useEffect(() => {
    localStorage.setItem('screenshot-time-active', String(isActive));
  }, [isActive]);

  // 프리픽스 설정 저장
  useEffect(() => {
    localStorage.setItem('screenshot-use-prefix', String(usePrefixEnabled));
  }, [usePrefixEnabled]);

  useEffect(() => {
    localStorage.setItem('screenshot-filename-prefix', filenamePrefix);
  }, [filenamePrefix]);

  useEffect(() => {
    localStorage.setItem(
      'screenshot-face-detection-enabled',
      String(faceDetectionEnabled)
    );
  }, [faceDetectionEnabled]);

  useEffect(() => {
    localStorage.setItem('screenshot-ocr-enabled', String(ocrEnabled));
  }, [ocrEnabled]);

  useEffect(() => {
    localStorage.setItem('screenshot-capture-delay', String(captureDelayEnabled));
  }, [captureDelayEnabled]);

  // 자정에 triggered 상태 초기화
  useEffect(() => {
    const checkMidnight = setInterval(() => {
      const now = getAccurateTime();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        setTimeSlots((slots) =>
          slots.map((slot) => ({ ...slot, triggered: false }))
        );
        setIsCountingDown(false);
        setCountdown(null);
      }
    }, 60000);

    return () => clearInterval(checkMidnight);
  }, [getAccurateTime]);

  // 알림음 재생
  const playBeep = useCallback(() => {
    const audio = new Audio(
      'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVanm7q1aFQ1Ln+Pxv3IeBi6Cz/PWhzYHImzB7+WaTg4NUqnl762cFAxKnuPvwnAhBSx/zvPYiDYHI3DB7uOaSQ4NUqbl761dFQ1Ln+PvwnAhBSyAz/PXhzUHIm/A7uKZSg0PVKjl7axdFQxLn+PvwnAhBSx/zvPYhzYHI3DB7uOZSQ4PVKjl7axdFQxLnuPvwnEhBSyBz/PWhzUHIm/A7uSZSw4PU6fk7axcFQxLn+PwwnEhBiyAzvPWhzYHI3DB7uOZSQ4PVKjl7axdFQxLnuPvwnAhBSyAzvPXiDUHIm/A7uOaSw4PU6fk7axdFQxLn+PvwnEhBSyAzvPWhzYHI2/A7uKZSw4PVKfl7qxdFQtLnt/vwm8hBSx/zu/YhzUHInDB7uOZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHInDB7uOZSg0PVKfl7qxdFQtLnt/vwm8hBSx/zu/YhzUHI3DB7uOZSQ0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxL'
    );
    audio.play().catch(() => {
      console.log('⚠️ 오디오 재생 실패');
    });
  }, []);

  // 30초 알림
  const notify30Seconds = useCallback(() => {
    playBeep();
    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted'
    ) {
      new Notification('스크린샷 타임 ⏰', {
        body: '30초 후 스크린샷 시간입니다!',
        tag: 'screenshot-30s',
      });
    }
  }, [playBeep]);

  // 카운트다운 체크
  useEffect(() => {
    if (!isActive || !isCountingDown || countdown === null) return;

    if (countdown === 30) {
      notify30Seconds();
    } else if (countdown <= 10 && countdown > 0) {
      playBeep();
    } else if (countdown === 0) {
      playBeep();
      // 비동기로 상태 업데이트하여 cascading renders 방지
      setTimeout(() => {
        setIsCountingDown(false);
        setCountdown(null);
      }, 0);
    }
  }, [countdown, isActive, isCountingDown, notify30Seconds, playBeep]);

  // 카운트다운 타이머
  useEffect(() => {
    if (!isCountingDown || countdown === null) return;

    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, isCountingDown]);

  // 시간대 체크 및 카운트다운 시작
  useEffect(() => {
    if (!isActive || isCountingDown) return;

    const now = getAccurateTime();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();

    timeSlots.forEach((slot) => {
      if (!slot.enabled || slot.triggered) return;

      // 목표 시간 파싱
      const [targetHour, targetMinute] = slot.time.split(':').map(Number);

      // 목표 시간을 초 단위로 변환
      const targetTimeInSeconds = targetHour * 3600 + targetMinute * 60;
      // 현재 시간을 초 단위로 변환
      const currentTimeInSeconds =
        currentHour * 3600 + currentMinute * 60 + currentSecond;

      // 목표 시간 60초 전에 카운트다운 시작
      const startTimeInSeconds = targetTimeInSeconds - 60;

      // 정확히 60초 전일 때만 시작 (±2초 오차 허용)
      if (Math.abs(currentTimeInSeconds - startTimeInSeconds) <= 2) {
        console.log(`🎯 카운트다운 시작: ${slot.time}에 맞춰 정확히 실행`);

        // 정확한 남은 시간 계산
        const exactCountdown = targetTimeInSeconds - currentTimeInSeconds;
        setCountdown(exactCountdown > 0 ? exactCountdown : 60);
        setIsCountingDown(true);

        // 트리거 상태 업데이트
        setTimeSlots((prev) =>
          prev.map((s) => (s.id === slot.id ? { ...s, triggered: true } : s))
        );
      }
    });
  }, [currentTime, isActive, timeSlots, isCountingDown, getAccurateTime]);

  const toggleActive = () => {
    setIsActive(!isActive);
  };

  const toggleSlot = (id: number) => {
    setTimeSlots((prev) =>
      prev.map((slot) =>
        slot.id === id ? { ...slot, enabled: !slot.enabled } : slot
      )
    );
  };

  const resetToDefault = () => {
    if (confirm('기본 시간표로 초기화하시겠습니까?')) {
      setTimeSlots(
        DEFAULT_TIME_SLOTS.map((slot, idx) => ({
          ...slot,
          id: idx + 1,
          triggered: false,
        }))
      );
    }
  };

  const resetTriggers = () => {
    setTimeSlots((prev) => prev.map((slot) => ({ ...slot, triggered: false })));
    setIsCountingDown(false);
    setCountdown(null);
  };

  const testCountdown = () => {
    setCountdown(60);
    setIsCountingDown(true);
  };

  // 저장 폴더 선택
  const selectSaveDirectory = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        const dirHandle = await window.showDirectoryPicker({
          mode: 'readwrite',
        });
        setSaveDirectory(dirHandle);
        setSavePath(dirHandle.name);
        console.log('✅ 저장 폴더 선택:', dirHandle.name);
      } else {
        alert(
          '이 브라우저는 폴더 선택을 지원하지 않습니다. 브라우저 다운로드 폴더에 저장됩니다.'
        );
      }
    } catch (error) {
      console.error('❌ 폴더 선택 실패:', error);
    }
  };

  // 텍스트 감지 (운영진/운영/KDT/오르미 감지)
  const detectExcludedText = async (
    canvas: HTMLCanvasElement
  ): Promise<boolean> => {
    try {
      console.log('📝 텍스트 감지 중...');
      const dataUrl = canvas.toDataURL('image/png');

      const {
        data: { text },
      } = await Tesseract.recognize(dataUrl, 'kor+eng', {
        logger: () => {}, // 로그 비활성화
      });

      const excludedKeywords = ['운영진', '운영', 'KDT', '오르미'];
      const foundKeywords = excludedKeywords.filter((keyword) =>
        text.includes(keyword)
      );

      if (foundKeywords.length > 0) {
        console.log('✅ 제외 키워드 감지:', foundKeywords.join(', '));
        return true;
      }

      console.log('❌ 제외 키워드 없음');
      return false;
    } catch (error) {
      console.error('텍스트 감지 실패:', error);
      return false; // 실패 시 얼굴 인식 진행
    }
  };

  // OCR로 이름 텍스트 추출 (위치 정보 포함)
  const extractNamesWithPosition = async (canvas: HTMLCanvasElement) => {
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const result = await Tesseract.recognize(dataUrl, 'kor+eng', {
        logger: () => {},
      });

      // words에서 위치 정보와 텍스트 추출
      interface TesseractWord {
        text: string;
        bbox: { x0: number; y0: number; x1: number; y1: number };
      }
      const words = (result.data as unknown as { words: TesseractWord[] })
        .words;
      const namesWithPosition = words.map((word) => ({
        text: word.text,
        bbox: word.bbox, // { x0, y0, x1, y1 }
      }));

      return namesWithPosition;
    } catch (error) {
      console.error('이름 추출 실패:', error);
      return [];
    }
  };

  // 얼굴 박스와 가장 가까운 이름 찾기
  const findClosestName = (
    faceBox: { x: number; y: number; width: number; height: number },
    names: Array<{
      text: string;
      bbox: { x0: number; y0: number; x1: number; y1: number };
    }>
  ) => {
    if (names.length === 0) return null;

    const faceCenterX = faceBox.x + faceBox.width / 2;
    const faceCenterY = faceBox.y + faceBox.height / 2;
    const faceBottom = faceBox.y + faceBox.height;

    let closestName = null;
    let minDistance = Infinity;

    names.forEach((nameObj) => {
      const nameCenterX = (nameObj.bbox.x0 + nameObj.bbox.x1) / 2;
      const nameCenterY = (nameObj.bbox.y0 + nameObj.bbox.y1) / 2;

      // 얼굴 박스 아래쪽에 있는 텍스트 우선 (줌은 이름이 아래 표시됨)
      const isBelow = nameCenterY > faceBottom;
      const verticalDistance = Math.abs(nameCenterY - faceCenterY);
      const horizontalDistance = Math.abs(nameCenterX - faceCenterX);

      // 수직 거리에 가중치 (아래쪽이면 가중치 낮춤)
      const weightedDistance = isBelow
        ? verticalDistance * 0.3 + horizontalDistance
        : verticalDistance * 2 + horizontalDistance;

      if (weightedDistance < minDistance && nameObj.text.trim().length > 0) {
        minDistance = weightedDistance;
        closestName = nameObj.text.trim();
      }
    });

    // 너무 멀리 있으면 null 반환 (얼굴 박스 크기의 3배 이상)
    const maxDistance = Math.max(faceBox.width, faceBox.height) * 3;
    return minDistance < maxDistance ? closestName : null;
  };

  // 얼굴 인식 분석
  const analyzeFaces = async (
    canvas: HTMLCanvasElement
  ): Promise<FaceDetectionResult> => {
    if (!modelRef.current) {
      return {
        faceCount: 0,
        warnings: ['얼굴 인식 모델이 로드되지 않았습니다'],
        hasSmallFaces: false,
        hasCroppedFaces: false,
      };
    }

    // 먼저 제외 키워드 체크 (OCR 활성화된 경우에만)
    if (ocrEnabled) {
      const shouldSkip = await detectExcludedText(canvas);
      if (shouldSkip) {
        return {
          faceCount: -1, // 특수값: 스킵됨
          warnings: [
            '운영진/운영/KDT/오르미 화면이므로 얼굴 인식을 건너뜁니다',
          ],
          hasSmallFaces: false,
          hasCroppedFaces: false,
        };
      }
    }

    try {
      // SSD MobileNet으로 얼굴 감지 (정확도 높음)
      const detections = await faceapi.detectAllFaces(
        canvas,
        new faceapi.SsdMobilenetv1Options({
          minConfidence: 0.3, // 신뢰도 임계값 낮춤 (기본 0.5)
          maxResults: 100, // 최대 100개 얼굴까지 감지
        })
      );

      // OCR로 이름 추출 (옵션 활성화된 경우에만)
      const namesWithPosition = ocrEnabled
        ? await extractNamesWithPosition(canvas)
        : [];

      const faceCount = detections.length;
      const warnings: string[] = [];
      let hasSmallFaces = false;
      let hasCroppedFaces = false;

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const canvasArea = canvasWidth * canvasHeight;

      // 각 얼굴 분석
      detections.forEach((detection, index: number) => {
        const box = detection.box;
        const x1 = box.x;
        const y1 = box.y;
        const x2 = box.x + box.width;
        const y2 = box.y + box.height;

        const faceWidth = box.width;
        const faceHeight = box.height;
        const faceArea = faceWidth * faceHeight;

        // 얼굴과 가장 가까운 이름 찾기 (OCR 활성화된 경우에만)
        const name =
          ocrEnabled && namesWithPosition.length > 0
            ? findClosestName(box, namesWithPosition) || `얼굴 ${index + 1}`
            : `얼굴 ${index + 1}`;

        // 얼굴 크기 비율 (전체 화면 대비)
        const faceRatio = faceArea / canvasArea;

        // 얼굴이 너무 작은지 체크 (화면의 0.5% 미만으로 낮춤)
        if (faceRatio < 0.005) {
          warnings.push(
            `${name}: 얼굴이 너무 작습니다 (화면 비율: ${(
              faceRatio * 100
            ).toFixed(2)}%)`
          );
          hasSmallFaces = true;
        }

        // 가장자리 여백 (5%)
        const edgeMargin = 0.05;
        const leftEdge = canvasWidth * edgeMargin;
        const rightEdge = canvasWidth * (1 - edgeMargin);
        const topEdge = canvasHeight * edgeMargin;
        const bottomEdge = canvasHeight * (1 - edgeMargin);

        // 얼굴이 화면 가장자리에서 잘리는지 체크
        if (
          x1 < leftEdge ||
          x2 > rightEdge ||
          y1 < topEdge ||
          y2 > bottomEdge
        ) {
          warnings.push(
            `${name}: 얼굴이 화면 가장자리에 위치하여 잘릴 수 있습니다`
          );
          hasCroppedFaces = true;
        }
      });

      // 얼굴 개수에 따른 메시지
      if (faceCount === 0) {
        warnings.unshift('⚠️ 감지된 얼굴이 없습니다');
      }

      return {
        faceCount,
        warnings,
        hasSmallFaces,
        hasCroppedFaces,
      };
    } catch (error) {
      console.error('❌ 얼굴 분석 실패:', error);
      return {
        faceCount: 0,
        warnings: ['얼굴 분석 중 오류가 발생했습니다'],
        hasSmallFaces: false,
        hasCroppedFaces: false,
      };
    }
  };

  // 파일명 생성 (YY-MM-DD-HH-MM 형식 + 중복 처리)
  const generateFilename = (now: Date): string => {
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');

    // 파일명에는 콜론 사용 불가 - 하이픈으로 대체
    const baseFilename = `${yy}-${mm}-${dd}-${hh}-${min}`;

    // localStorage에서 해당 시간대의 카운터 가져오기
    const counterKey = `screenshot-counter-${baseFilename}`;
    const counter = parseInt(localStorage.getItem(counterKey) || '0', 10);

    // 새 카운터 값 저장
    const newCounter = counter + 1;
    localStorage.setItem(counterKey, String(newCounter));

    // 프리픽스 적용
    const prefix =
      usePrefixEnabled && filenamePrefix ? `${filenamePrefix}_` : '';

    // 파일명 생성
    if (newCounter === 1) {
      return `${prefix}${baseFilename}.png`;
    } else {
      return `${prefix}${baseFilename}(${newCounter - 1}).png`;
    }
  };

  // 스크린샷 캡처
  const captureScreenshot = async () => {
    try {
      setIsCapturing(true);
      console.log('📸 스크린샷 캡처 시작...');

      // 화면 선택 (멀티 모니터 지원)
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor', // 모니터 전체 화면
        } as MediaTrackConstraints,
        audio: false,
      });

      console.log('✅ 화면 스트림 획득 성공');

      // 화면 선택 후 딜레이 (옵션 활성화된 경우)
      if (captureDelayEnabled) {
        console.log('⏳ 1초 대기 중... (화면 전환 시간)');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // video 엘리먼트 생성
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // video 로드 대기
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
      });

      // canvas에 video 프레임 그리기
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context를 생성할 수 없습니다');
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 스트림 중지
      stream.getTracks().forEach((track) => track.stop());

      // 캔버스 저장 (재촬영용)
      lastCanvasRef.current = canvas;

      // 이미지로 변환
      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error('이미지 변환 실패');
        }

        const now = getAccurateTime();
        const filename = generateFilename(now);

        // File System Access API로 저장 (지원하는 브라우저만)
        if (saveDirectory && 'showDirectoryPicker' in window) {
          try {
            // 폴더 권한 확인
            const extendedDir =
              saveDirectory as ExtendedFileSystemDirectoryHandle;
            const permission = await extendedDir.queryPermission({
              mode: 'readwrite',
            });

            if (permission === 'granted') {
              // 권한 있음 - 바로 저장
              const fileHandle = await saveDirectory.getFileHandle(filename, {
                create: true,
              });
              const writable = await fileHandle.createWritable();
              await writable.write(blob);
              await writable.close();
              console.log('✅ 스크린샷 저장 완료 (폴더):', filename);
              console.log('저장 위치:', savePath);
            } else if (permission === 'prompt') {
              // 권한 요청 필요
              const newPermission = await extendedDir.requestPermission({
                mode: 'readwrite',
              });
              if (newPermission === 'granted') {
                const fileHandle = await saveDirectory.getFileHandle(filename, {
                  create: true,
                });
                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();
                console.log('✅ 스크린샷 저장 완료 (폴더):', filename);
                console.log('저장 위치:', savePath);
              } else {
                throw new Error('폴더 쓰기 권한이 거부되었습니다');
              }
            } else {
              throw new Error('폴더 쓰기 권한이 없습니다');
            }
          } catch (err) {
            console.error('폴더 저장 실패, 다운로드로 전환:', err);
            // 폴더 저장 실패 시 기본 다운로드
            downloadBlob(blob, filename);
          }
        } else {
          // 기본 다운로드
          downloadBlob(blob, filename);
        }

        setIsCapturing(false);

        // 미리보기 이미지 URL 생성
        const previewUrl = URL.createObjectURL(blob);
        setPreviewImageUrl(previewUrl);
        setShowPreview(true);
        setPreviewResult(null); // 초기화

        // 얼굴 인식이 활성화된 경우 분석 실행
        if (faceDetectionEnabled) {
          setIsAnalyzing(true);
          console.log('🔍 얼굴 분석 시작...');
          const result = await analyzeFaces(canvas);
          setIsAnalyzing(false);
          setPreviewResult(result); // 미리보기에 저장
        }

        // 5초 후 미리보기 자동 숨김
        setTimeout(() => {
          setShowPreview(false);
        }, 5000);
      }, 'image/png');
    } catch (error) {
      console.error('❌ 스크린샷 캡처 실패:', error);
      alert('스크린샷 캡처에 실패했습니다. 권한을 확인해주세요.');
      setIsCapturing(false);
    }
  };

  // 블롭 다운로드 헬퍼
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    console.log('✅ 스크린샷 다운로드 완료:', filename);
  };

  // 재촬영 (마지막 캔버스 재사용)
  const retakeScreenshot = async () => {
    if (!lastCanvasRef.current) {
      alert('재촬영할 이미지가 없습니다. 먼저 스크린샷을 찍어주세요.');
      return;
    }

    try {
      setIsCapturing(true);
      console.log('🔄 스크린샷 재촬영 (새로 캡처)...');

      // 새로운 화면 캡처
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
        } as MediaTrackConstraints,
        audio: false,
      });

      console.log('✅ 화면 스트림 획득 성공');

      // 화면 선택 후 딜레이 (옵션 활성화된 경우)
      if (captureDelayEnabled) {
        console.log('⏳ 1초 대기 중... (화면 전환 시간)');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
      });

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context를 생성할 수 없습니다');
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      stream.getTracks().forEach((track) => track.stop());

      // 캔버스 저장
      lastCanvasRef.current = canvas;

      // 이미지로 변환 및 저장
      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error('이미지 변환 실패');
        }

        const now = getAccurateTime();
        const filename = generateFilename(now);

        // 저장
        if (saveDirectory && 'showDirectoryPicker' in window) {
          try {
            const extendedDir =
              saveDirectory as ExtendedFileSystemDirectoryHandle;
            const permission = await extendedDir.queryPermission({
              mode: 'readwrite',
            });
            if (permission === 'granted') {
              const fileHandle = await saveDirectory.getFileHandle(filename, {
                create: true,
              });
              const writable = await fileHandle.createWritable();
              await writable.write(blob);
              await writable.close();
              console.log('✅ 스크린샷 재저장 완료 (폴더):', filename);
            } else if (permission === 'prompt') {
              const newPermission = await extendedDir.requestPermission({
                mode: 'readwrite',
              });
              if (newPermission === 'granted') {
                const fileHandle = await saveDirectory.getFileHandle(filename, {
                  create: true,
                });
                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();
                console.log('✅ 스크린샷 재저장 완료 (폴더):', filename);
              } else {
                throw new Error('폴더 쓰기 권한이 거부되었습니다');
              }
            } else {
              throw new Error('폴더 쓰기 권한이 없습니다');
            }
          } catch (err) {
            console.error('폴더 저장 실패, 다운로드로 전환:', err);
            downloadBlob(blob, filename);
          }
        } else {
          downloadBlob(blob, filename);
        }

        setIsCapturing(false);

        // 미리보기 이미지 URL 생성
        const previewUrl = URL.createObjectURL(blob);
        setPreviewImageUrl(previewUrl);
        setShowPreview(true);
        setPreviewResult(null); // 초기화

        // 얼굴 인식이 활성화된 경우 분석 실행
        if (faceDetectionEnabled) {
          setIsAnalyzing(true);
          console.log('🔍 얼굴 분석 시작...');
          const result = await analyzeFaces(canvas);
          setIsAnalyzing(false);
          setPreviewResult(result); // 미리보기에 저장
        }

        // 5초 후 미리보기 자동 숨김
        setTimeout(() => {
          setShowPreview(false);
        }, 5000);
      }, 'image/png');
    } catch (error) {
      console.error('❌ 스크린샷 재촬영 실패:', error);
      alert('스크린샷 재촬영에 실패했습니다. 권한을 확인해주세요.');
      setIsCapturing(false);
    }
  };

  // 테스트 이미지 업로드 핸들러
  const handleTestImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setTestImage(file);
      setTestResult(null);
      setTestCanvasUrl(null);
    } else {
      alert('이미지 파일만 업로드할 수 있습니다.');
    }
  };

  // 업로드된 이미지로 얼굴 인식 테스트
  const testFaceDetection = async () => {
    if (!testImage) {
      alert('먼저 테스트할 이미지를 업로드해주세요.');
      return;
    }

    if (!modelRef.current) {
      alert(
        '얼굴 인식 모델이 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.'
      );
      return;
    }

    try {
      setIsTesting(true);
      setTestResult(null);
      setTestCanvasUrl(null);

      console.log('🧪 테스트 이미지 분석 시작...');

      // 이미지를 canvas에 로드
      const img = new Image();
      const imageUrl = URL.createObjectURL(testImage);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('이미지 로드 실패'));
        img.src = imageUrl;
      });

      // canvas 생성
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context를 생성할 수 없습니다');
      }

      ctx.drawImage(img, 0, 0);

      // 얼굴 인식
      const result = await analyzeFaces(canvas);
      setTestResult(result);

      // 얼굴에 박스 그리기
      const detections = await faceapi.detectAllFaces(
        canvas,
        new faceapi.SsdMobilenetv1Options({
          minConfidence: 0.3,
          maxResults: 100,
        })
      );

      detections.forEach((detection, index) => {
        const box = detection.box;

        // 박스 그리기
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 4;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // 얼굴 번호 표시
        ctx.fillStyle = '#00ff00';
        ctx.font = '20px Arial';
        ctx.fillText(`Face ${index + 1}`, box.x, box.y - 10);

        // 신뢰도 표시
        ctx.font = '16px Arial';
        ctx.fillText(
          `${(detection.score * 100).toFixed(1)}%`,
          box.x,
          box.y + box.height + 20
        );
      });

      // canvas를 이미지 URL로 변환
      const resultUrl = canvas.toDataURL('image/png');
      setTestCanvasUrl(resultUrl);

      URL.revokeObjectURL(imageUrl);
      setIsTesting(false);

      console.log('✅ 테스트 완료:', result);
    } catch (error) {
      console.error('❌ 테스트 실패:', error);
      alert('테스트 중 오류가 발생했습니다.');
      setIsTesting(false);
    }
  };

  const sortedSlots = [...timeSlots].sort((a, b) =>
    a.time.localeCompare(b.time)
  );

  return (
    <div className={`min-h-screen ${colors.bg} transition-colors duration-300`}>
      <div className='max-w-7xl mx-auto py-6 flex flex-col min-h-[calc(100vh-8rem)]'>
        <div className='mb-6 flex justify-between items-center'>
          <Link
            to='/'
            className={`${colors.link} ${colors.linkHover} font-medium transition-colors`}
          >
            ← 대시보드로 돌아가기
          </Link>
        </div>

        <div className='flex-1 flex flex-col justify-between'>
          <div>
            <div
              className={`${colors.card} rounded-lg shadow-md p-6 mb-6 transition-colors duration-300`}
            >
              <div className='flex justify-between items-center mb-6'>
                <div>
                  <h1 className={`text-3xl font-bold ${colors.text}`}>
                    스크린샷 타임 📸
                  </h1>
                  <p className={`${colors.textSecondary} mt-2`}>
                    설정된 시간에 카운트다운을 시작합니다
                  </p>
                </div>
                <div className='text-center'>
                  <div className={`text-3xl font-bold ${colors.link} mb-1`}>
                    {currentTime.toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </div>
                  <div className={`text-sm ${colors.textSecondary}`}>
                    {currentTime.toLocaleDateString('ko-KR', {
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short',
                    })}
                  </div>
                </div>
              </div>

              {isCountingDown && countdown !== null && (
                <div className='bg-red-50 border-4 border-red-500 rounded-xl p-8 mb-6 text-center animate-pulse'>
                  <div className='text-6xl font-bold text-red-600 mb-2'>
                    {countdown}초
                  </div>
                  <p className='text-xl text-red-700 font-semibold'>
                    {countdown > 30
                      ? '준비하세요!'
                      : countdown > 10
                      ? '곧 스크린샷 시간입니다!'
                      : '카운트다운!'}
                  </p>
                </div>
              )}

              <div className='flex gap-3 mb-6'>
                <button
                  onClick={toggleActive}
                  className={`flex-1 px-6 py-4 rounded-lg font-bold text-lg transition-colors text-white ${
                    isActive
                      ? 'bg-red-500 hover:bg-red-600'
                      : `${colors.primary} ${colors.primaryHover}`
                  }`}
                >
                  {isActive
                    ? '📸 타이머 활성화됨 (클릭하여 중지)'
                    : '▶️ 타이머 시작'}
                </button>
                <button
                  onClick={captureScreenshot}
                  disabled={isCapturing || isAnalyzing}
                  className={`px-6 py-4 ${colors.secondary} ${colors.secondaryHover} text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isCapturing
                    ? '📸 캡처 중...'
                    : isAnalyzing
                    ? '🔍 분석 중...'
                    : '📸 스크린샷'}
                </button>
                <button
                  onClick={retakeScreenshot}
                  disabled={
                    isCapturing || isAnalyzing || !lastCanvasRef.current
                  }
                  className={`px-6 py-4 ${colors.accent} ${colors.accentHover} text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isCapturing
                    ? '📸 캡처 중...'
                    : isAnalyzing
                    ? '🔍 분석 중...'
                    : '🔄 재촬영'}
                </button>
                <button
                  onClick={testCountdown}
                  className={`px-6 py-4 ${colors.primary} ${colors.primaryHover} text-white rounded-lg transition-colors font-medium`}
                >
                  테스트 (60초)
                </button>
              </div>

              <div className='mb-6'>
                <div className='bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-gray-700 mb-1'>
                        저장 폴더
                      </p>
                      <p className='text-sm text-gray-600'>📁 {savePath}</p>
                    </div>
                    <button
                      onClick={selectSaveDirectory}
                      className='px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium'
                    >
                      폴더 선택
                    </button>
                  </div>
                  <p className='text-xs text-gray-500 mt-2'>
                    ※ Chrome/Edge에서만 폴더 선택 가능. 다른 브라우저는 다운로드
                    폴더에 자동 저장됩니다.
                  </p>
                </div>

                <div className='bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3'>
                  <div className='flex items-center justify-between mb-3'>
                    <label className='flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={usePrefixEnabled}
                        onChange={(e) => setUsePrefixEnabled(e.target.checked)}
                        className='w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500'
                      />
                      <span className='ml-2 text-sm font-medium text-gray-700'>
                        파일명 프리픽스 사용
                      </span>
                    </label>
                  </div>
                  {usePrefixEnabled && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        프리픽스
                      </label>
                      <input
                        type='text'
                        value={filenamePrefix}
                        onChange={(e) => setFilenamePrefix(e.target.value)}
                        placeholder='예: lecture, class'
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500'
                      />
                      <p className='text-xs text-gray-500 mt-2'>
                        {filenamePrefix
                          ? `파일명 예시: ${filenamePrefix}_25-11-14-09-00.png`
                          : '프리픽스를 입력하세요'}
                      </p>
                    </div>
                  )}
                </div>

                <div
                  className={`${colors.card} ${colors.border} border rounded-lg p-4 mb-3`}
                >
                  <label className='flex items-center cursor-pointer mb-3'>
                    <input
                      type='checkbox'
                      checked={captureDelayEnabled}
                      onChange={(e) => setCaptureDelayEnabled(e.target.checked)}
                      className='w-4 h-4 border-gray-300 rounded focus:ring-2'
                    />
                    <span className={`ml-2 text-sm font-medium ${colors.text}`}>
                      ⏱ 화면 선택 후 1초 대기 (모니터 1대용)
                    </span>
                  </label>
                  <p className={`text-xs ${colors.textSecondary} ml-6 mb-3`}>
                    화면 선택 창에서 화면을 선택한 후 1초 뒤에 캡처됩니다. 줌으로 전환할 시간을 확보할 수 있습니다.
                  </p>

                  <label className='flex items-center cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={faceDetectionEnabled}
                      onChange={(e) =>
                        setFaceDetectionEnabled(e.target.checked)
                      }
                      className='w-4 h-4 border-gray-300 rounded focus:ring-2'
                    />
                    <span className={`ml-2 text-sm font-medium ${colors.text}`}>
                      🤖 얼굴 인식 활성화
                    </span>
                  </label>
                  <p className={`text-xs ${colors.textSecondary} mt-2 ml-6`}>
                    스크린샷 촬영 후 얼굴을 자동으로 감지하여 결과를
                    알려드립니다. SSD MobileNet 모델을 사용하여 높은 정확도로
                    얼굴을 감지합니다. "운영진/운영/KDT/오르미" 텍스트가 있는
                    화면은 자동으로 건너뜁니다. 얼굴이 너무 작거나 화면
                    가장자리에서 잘리는 경우 경고합니다.
                  </p>

                  <label className='flex items-center cursor-pointer mt-3'>
                    <input
                      type='checkbox'
                      checked={ocrEnabled}
                      onChange={(e) => setOcrEnabled(e.target.checked)}
                      disabled={!faceDetectionEnabled}
                      className='w-4 h-4 border-gray-300 rounded focus:ring-2 disabled:opacity-50'
                    />
                    <span className={`ml-2 text-sm font-medium ${colors.text}`}>
                      📝 이름 인식 (OCR)
                    </span>
                  </label>
                  <p className={`text-xs ${colors.textSecondary} mt-2 ml-6`}>
                    OCR로 화면에서 이름을 감지하여 경고 메시지에 표시합니다.
                    분석 시간이 10-15초 추가될 수 있습니다. 비활성화하면 "얼굴
                    1", "얼굴 2"로 표시됩니다.
                  </p>
                </div>

                <div
                  className={`${colors.card} ${colors.border} border rounded-lg p-4 mb-3`}
                >
                  <h3 className={`font-bold ${colors.text} mb-3`}>
                    🧪 얼굴 인식 테스트
                  </h3>
                  <p className={`text-xs ${colors.textSecondary} mb-3`}>
                    이미 촬영한 줌 갤러리 화면을 업로드하여 얼굴 인식 정확도를
                    테스트할 수 있습니다.
                  </p>
                  <div className='flex gap-2 mb-3'>
                    <input
                      type='file'
                      accept='image/*'
                      onChange={handleTestImageUpload}
                      className={`flex-1 px-3 py-2 text-sm ${colors.card} ${colors.text} ${colors.border} border rounded-lg focus:outline-none focus:ring-2 transition-all`}
                    />
                    <button
                      onClick={testFaceDetection}
                      disabled={!testImage || isTesting}
                      className={`px-4 py-2 ${colors.primary} ${colors.primaryHover} text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isTesting ? '🔍 분석 중...' : '🧪 테스트 실행'}
                    </button>
                  </div>

                  {testResult && (
                    <div
                      className={`mt-4 p-4 ${colors.card} rounded-lg ${colors.border} border-2`}
                    >
                      <h4 className={`font-bold ${colors.text} mb-3 text-lg`}>
                        📊 테스트 결과
                      </h4>
                      <div className='text-sm space-y-2'>
                        {testResult.faceCount === -1 ? (
                          <p className={`font-medium ${colors.link} text-base`}>
                            ✅ {testResult.warnings[0]}
                          </p>
                        ) : (
                          <>
                            <p
                              className={`font-medium ${colors.text} text-base`}
                            >
                              감지된 얼굴:{' '}
                              <span
                                className={`${colors.link} font-bold text-xl`}
                              >
                                {testResult.faceCount}개
                              </span>
                            </p>
                            {testResult.warnings.length > 0 && (
                              <div className='mt-3'>
                                <p className='font-medium text-orange-600 mb-2 text-base'>
                                  ⚠️ 경고:
                                </p>
                                <ul
                                  className={`list-disc list-inside ${colors.textSecondary} space-y-1 ml-2`}
                                >
                                  {testResult.warnings.map((warning, idx) => (
                                    <li key={idx} className='text-sm'>
                                      {warning}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {testResult.warnings.length === 0 &&
                              testResult.faceCount > 0 && (
                                <p className='text-green-600 font-medium mt-3 text-base'>
                                  ✅ 모든 얼굴이 정상적으로 감지되었습니다!
                                </p>
                              )}
                          </>
                        )}
                      </div>

                      {testCanvasUrl && (
                        <div className='mt-4'>
                          <p className={`text-xs ${colors.textSecondary} mb-2`}>
                            감지된 얼굴에 녹색 박스가 표시됩니다:
                          </p>
                          <img
                            src={testCanvasUrl}
                            alt='Face detection result'
                            className={`w-full ${colors.border} border-2 rounded`}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className='flex gap-2'>
                  <button
                    onClick={resetToDefault}
                    className='px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium'
                  >
                    기본값으로 초기화
                  </button>
                  <button
                    onClick={resetTriggers}
                    className='px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium'
                  >
                    트리거 초기화
                  </button>
                </div>
              </div>
            </div>

            <div className='space-y-3'>
              {sortedSlots.map((slot) => (
                <div
                  key={slot.id}
                  className={`bg-white rounded-lg shadow-md p-4 transition-all ${
                    slot.enabled ? 'border-l-4 border-purple-500' : 'opacity-60'
                  } ${slot.triggered ? 'bg-green-50' : ''}`}
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center flex-1'>
                      <div className='text-3xl font-bold text-purple-600 w-24'>
                        {slot.time}
                      </div>
                      <div className='flex-1'>
                        <p className='text-lg font-medium text-gray-800'>
                          스크린샷 타임
                        </p>
                        {slot.triggered && (
                          <p className='text-sm text-green-600'>
                            ✓ 오늘 실행됨
                          </p>
                        )}
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      <button
                        onClick={() => toggleSlot(slot.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          slot.enabled
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {slot.enabled ? '활성화' : '비활성화'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='bg-purple-50 rounded-lg p-4'>
            <h3 className='font-bold text-purple-900 mb-2'>💡 사용 방법</h3>
            <ul className='text-sm text-purple-800 space-y-1'>
              <li>
                • 타이머 시작 버튼을 누르면 설정된 시간에 자동으로 60초
                카운트다운이 시작됩니다
              </li>
              <li>• 30초 남았을 때 알림음과 함께 알림이 표시됩니다</li>
              <li>• 10초부터는 매초마다 삐 소리가 납니다</li>
              <li>
                • <strong>폴더 선택</strong>으로 스크린샷 저장 위치 지정
                (Chrome/Edge만)
              </li>
              <li>
                • <strong>프리픽스 사용</strong>으로 파일명 앞에 원하는 텍스트
                추가 가능 (예: lecture_25-11-14-09-00.png)
              </li>
              <li>
                • <strong>얼굴 인식</strong>을 활성화하면 스크린샷 촬영 후
                자동으로 얼굴을 감지하여 결과를 알려드립니다
              </li>
              <li>
                • <strong>얼굴 인식 테스트</strong>로 이미 찍은 줌 갤러리 화면을
                업로드하여 감지 정확도를 확인할 수 있습니다
              </li>
              <li>
                • <strong>스크린샷 버튼</strong>을 누르면 전체 화면을 캡처합니다
                (멀티 모니터 선택 가능)
              </li>
              <li>
                • <strong>재촬영 버튼</strong>으로 문제가 있을 때 다시 촬영할 수
                있습니다
              </li>
              <li>
                • 파일명 형식: YY-MM-DD-HH-MM.png (예: 25-11-14-09-00.png)
              </li>
              <li>
                • 같은 시간대에 여러 장 촬영 시 자동으로 (1), (2), (3)... 번호가
                붙습니다
              </li>
              <li>• 같은 시간의 카운트다운은 하루에 한 번만 실행됩니다</li>
              <li>• 자정이 지나면 모든 트리거 상태가 초기화됩니다</li>
            </ul>

            <div className='mt-4 pt-4 border-t border-purple-200'>
              <h4 className='font-bold text-purple-900 mb-2'>
                🎯 줌 갤러리 화면 촬영 팁
              </h4>
              <ul className='text-sm text-purple-800 space-y-1'>
                <li>
                  • 줌 갤러리 뷰에서 여러 사람의 얼굴을 한 번에 촬영할 수
                  있습니다
                </li>
                <li>
                  • 얼굴 인식 기능이 각 참가자의 얼굴 크기와 위치를 자동으로
                  분석합니다
                </li>
                <li>
                  • 얼굴이 화면 1% 미만으로 작거나, 화면 가장자리 5% 이내에
                  있으면 경고합니다
                </li>
                <li>
                  • 테스트 기능으로 미리 촬영된 이미지의 감지 정확도를
                  확인하세요
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 미리보기 (우하단) */}
      {showPreview && previewImageUrl && (
        <div className="fixed bottom-4 right-4 z-40 bg-white rounded-lg shadow-2xl border-4 border-indigo-500 overflow-hidden">
          <div className="relative">
            {/* 미리보기 이미지 */}
            <img
              src={previewImageUrl}
              alt="Screenshot preview"
              className="w-64 h-48 object-contain cursor-pointer"
              onClick={() => setShowModal(true)}
            />

            {/* 분석 중 오버레이 */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-sm font-medium">
                  🔍 분석 중...
                </div>
              </div>
            )}

            {/* 닫기 버튼 */}
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              ×
            </button>

            {/* 분석 결과 간략 표시 */}
            {!isAnalyzing && previewResult && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 text-xs">
                {previewResult.faceCount === -1 ? (
                  <span>✅ 스킵됨</span>
                ) : (
                  <span>👤 {previewResult.faceCount}명 인식</span>
                )}
              </div>
            )}
          </div>

          {/* 클릭하여 확대 안내 */}
          <div className="bg-indigo-50 px-3 py-1 text-xs text-indigo-700 text-center">
            클릭하여 확대 👆
          </div>
        </div>
      )}

      {/* 확대 모달 */}
      {showModal && previewImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className={`${colors.card} rounded-lg shadow-2xl max-w-6xl max-h-[90vh] overflow-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className={`flex justify-between items-center p-4 border-b ${colors.border}`}>
              <h3 className={`text-xl font-bold ${colors.text}`}>📸 스크린샷 미리보기</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* 모달 본문 */}
            <div className="p-4">
              <img
                src={previewImageUrl}
                alt="Screenshot full view"
                className="w-full h-auto"
              />

              {/* 분석 결과 표시 */}
              {previewResult && (
                <div className={`mt-4 p-4 ${colors.card} rounded-lg ${colors.border} border-2`}>
                  <h4 className={`font-bold ${colors.text} mb-3 text-lg`}>
                    📊 분석 결과
                  </h4>
                  <div className='text-sm space-y-2'>
                    {previewResult.faceCount === -1 ? (
                      <p className={`font-medium ${colors.link} text-base`}>
                        ✅ {previewResult.warnings[0]}
                      </p>
                    ) : (
                      <>
                        <p className={`font-medium ${colors.text} text-base`}>
                          감지된 얼굴:{' '}
                          <span className={`${colors.link} font-bold text-xl`}>
                            {previewResult.faceCount}개
                          </span>
                        </p>
                        {previewResult.warnings.length > 0 && (
                          <div className='mt-3'>
                            <p className='font-medium text-orange-600 mb-2 text-base'>
                              ⚠️ 경고:
                            </p>
                            <ul className={`list-disc list-inside ${colors.textSecondary} space-y-1 ml-2`}>
                              {previewResult.warnings.map((warning, idx) => (
                                <li key={idx} className='text-sm'>
                                  {warning}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {previewResult.warnings.length === 0 && previewResult.faceCount > 0 && (
                          <p className='text-green-600 font-medium mt-3 text-base'>
                            ✅ 모든 얼굴이 정상적으로 감지되었습니다!
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div className={`flex justify-end gap-2 p-4 border-t ${colors.border}`}>
              <button
                onClick={() => setShowModal(false)}
                className={`px-4 py-2 ${colors.primary} ${colors.primaryHover} text-white rounded-lg transition-colors font-medium`}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
