import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

interface TimeSlot {
  id: number;
  time: string;
  enabled: boolean;
  triggered: boolean;
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

  // 서버 시간 동기화
  useEffect(() => {
    fetch('https://worldtimeapi.org/api/timezone/Asia/Seoul')
      .then(res => res.json())
      .then(data => {
        const serverTime = new Date(data.datetime).getTime();
        const clientTime = new Date().getTime();
        const offset = serverTime - clientTime;
        setTimeOffset(offset);
        console.log('⏰ 시간 동기화 완료:', {
          serverTime: new Date(serverTime).toISOString(),
          clientTime: new Date(clientTime).toISOString(),
          offset: `${offset}ms`,
        });
      })
      .catch(err => {
        console.warn('⚠️ 서버 시간 동기화 실패, 클라이언트 시간 사용:', err);
      });
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

  // 자정에 triggered 상태 초기화
  useEffect(() => {
    const checkMidnight = setInterval(() => {
      const now = getAccurateTime();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        setTimeSlots(slots =>
          slots.map(slot => ({ ...slot, triggered: false }))
        );
        setIsCountingDown(false);
        setCountdown(null);
      }
    }, 60000);

    return () => clearInterval(checkMidnight);
  }, [getAccurateTime]);

  // 알림음 재생
  const playBeep = useCallback(() => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVanm7q1aFQ1Ln+Pxv3IeBi6Cz/PWhzYHImzB7+WaTg4NUqnl762cFAxKnuPvwnAhBSx/zvPYiDYHI3DB7uOaSQ4NUqbl761dFQ1Ln+PvwnAhBSyAz/PXhzUHIm/A7uKZSg0PVKjl7axdFQxLn+PvwnAhBSx/zvPYhzYHI3DB7uOZSQ4PVKjl7axdFQxLnuPvwnEhBSyBz/PWhzUHIm/A7uSZSw4PU6fk7axcFQxLn+PwwnEhBiyAzvPWhzYHI3DB7uOZSQ4PVKjl7axdFQxLnuPvwnAhBSyAzvPXiDUHIm/A7uOaSw4PU6fk7axdFQxLn+PvwnEhBSyAzvPWhzYHI2/A7uKZSw4PVKfl7qxdFQtLnt/vwm8hBSx/zu/YhzUHInDB7uOZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHInDB7uOZSg0PVKfl7qxdFQtLnt/vwm8hBSx/zu/YhzUHI3DB7uOZSQ0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxL');
    audio.play().catch(() => {
      console.log('⚠️ 오디오 재생 실패');
    });
  }, []);

  // 30초 알림
  const notify30Seconds = useCallback(() => {
    playBeep();
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
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
      setCountdown(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
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
      const currentTimeInSeconds = currentHour * 3600 + currentMinute * 60 + currentSecond;

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
          prev.map((s) =>
            s.id === slot.id ? { ...s, triggered: true } : s
          )
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
    setTimeSlots(prev => prev.map(slot => ({ ...slot, triggered: false })));
    setIsCountingDown(false);
    setCountdown(null);
  };

  const testCountdown = () => {
    setCountdown(60);
    setIsCountingDown(true);
  };

  const sortedSlots = [...timeSlots].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className='max-w-4x'>
      <div className='mb-6'>
        <Link
          to='/'
          className='text-indigo-600 hover:text-indigo-800 font-medium'
        >
          ← 대시보드로 돌아가기
        </Link>
      </div>

      <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
        <div className='flex justify-between items-center mb-6'>
          <div>
            <h1 className='text-3xl font-bold text-gray-800'>
              스크린샷 타임 📸
            </h1>
            <p className='text-gray-600 mt-2'>
              설정된 시간에 카운트다운을 시작합니다
            </p>
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-indigo-600 mb-1'>
              {currentTime.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
            <div className='text-sm text-gray-500'>
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
            className={`flex-1 px-6 py-4 rounded-lg font-bold text-lg transition-colors ${
              isActive
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isActive ? '📸 타이머 활성화됨 (클릭하여 중지)' : '▶️ 타이머 시작'}
          </button>
          <button
            onClick={testCountdown}
            className='px-6 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium'
          >
            테스트 (60초)
          </button>
        </div>

        <div className='flex gap-2 mb-6'>
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
                    <p className='text-sm text-green-600'>✓ 오늘 실행됨</p>
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

      <div className='mt-6 bg-purple-50 rounded-lg p-4'>
        <h3 className='font-bold text-purple-900 mb-2'>💡 사용 방법</h3>
        <ul className='text-sm text-purple-800 space-y-1'>
          <li>
            • 타이머 시작 버튼을 누르면 설정된 시간에 자동으로 60초 카운트다운이
            시작됩니다
          </li>
          <li>• 30초 남았을 때 알림음과 함께 알림이 표시됩니다</li>
          <li>• 10초부터는 매초마다 삐 소리가 납니다</li>
          <li>• 같은 시간의 카운트다운은 하루에 한 번만 실행됩니다</li>
          <li>• 자정이 지나면 모든 트리거 상태가 초기화됩니다</li>
        </ul>
      </div>
    </div>
  );
}
