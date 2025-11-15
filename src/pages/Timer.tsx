import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function Timer() {
  const { colors } = useTheme();

  const [minutes, setMinutes] = useState(10);
  const [seconds, setSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [title, setTitle] = useState('');

  const presets = [
    { name: '발표 시간', duration: 5 },
    { name: '토론 시간', duration: 10 },
    { name: '퀴즈 시간', duration: 15 },
    { name: '과제 시간', duration: 30 },
    { name: '시험 시간', duration: 60 },
  ];

  useEffect(() => {
    let interval: number | undefined;

    if (isRunning && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsRunning(false);
      // 타이머 종료 알림
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('타이머 종료!', {
          body: title || '설정한 시간이 종료되었습니다.',
        });
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, title]);

  const startTimer = () => {
    const totalSeconds = minutes * 60 + seconds;
    if (totalSeconds > 0) {
      setTimeLeft(totalSeconds);
      setIsRunning(true);

      // 알림 권한 요청
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(0);
  };

  const setPreset = (duration: number, name: string) => {
    setMinutes(duration);
    setSeconds(0);
    setTitle(name);
    setTimeLeft(0);
    setIsRunning(false);
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const initialTotal = minutes * 60 + seconds;
  const progress = initialTotal > 0 ? ((initialTotal - timeLeft) / initialTotal) * 100 : 0;

  return (
    <div className='max-w-full'>
      <div className='mb-6'>
        <Link
          to='/'
          className={`${colors.link} ${colors.linkHover} font-medium transition-colors`}
        >
          ← 대시보드로 돌아가기
        </Link>
      </div>

      <div className={`${colors.card} rounded-lg shadow-md p-8 ${colors.border} border transition-colors duration-300`}>
        <h1 className={`text-3xl font-bold ${colors.text} mb-6 text-center`}>
          수업 타이머 ⏱
        </h1>

        <div className='mb-6'>
          <label className={`block text-sm font-medium ${colors.text} mb-2`}>
            타이머 이름 (선택)
          </label>
          <input
            type='text'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='예: 발표 시간, 시험 시간'
            disabled={isRunning}
            className={`w-full px-4 py-2 ${colors.card} ${colors.text} ${colors.border} border rounded-lg focus:outline-none focus:ring-2 transition-all disabled:opacity-50`}
          />
        </div>

        <div className='grid grid-cols-5 gap-2 mb-6'>
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setPreset(preset.duration, preset.name)}
              disabled={isRunning}
              className={`px-4 py-2 ${colors.card} ${colors.link} ${colors.border} border rounded-lg hover:opacity-80 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {preset.name}
              <br />
              <span className='text-xs'>({preset.duration}분)</span>
            </button>
          ))}
        </div>

        {!isRunning && timeLeft === 0 && (
          <div className='grid grid-cols-2 gap-4 mb-6'>
            <div>
              <label className={`block text-sm font-medium ${colors.text} mb-2`}>
                분
              </label>
              <input
                type='number'
                min='0'
                max='999'
                value={minutes}
                onChange={(e) =>
                  setMinutes(Math.max(0, parseInt(e.target.value) || 0))
                }
                className={`w-full px-4 py-2 ${colors.card} ${colors.text} ${colors.border} border rounded-lg focus:outline-none focus:ring-2 transition-all`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${colors.text} mb-2`}>
                초
              </label>
              <input
                type='number'
                min='0'
                max='59'
                value={seconds}
                onChange={(e) =>
                  setSeconds(
                    Math.min(59, Math.max(0, parseInt(e.target.value) || 0))
                  )
                }
                className={`w-full px-4 py-2 ${colors.card} ${colors.text} ${colors.border} border rounded-lg focus:outline-none focus:ring-2 transition-all`}
              />
            </div>
          </div>
        )}

        {timeLeft > 0 && (
          <>
            {title && (
              <div className='text-center mb-4'>
                <h2 className={`text-2xl font-semibold ${colors.text}`}>
                  {title}
                </h2>
              </div>
            )}

            <div className={`w-full ${colors.border} border rounded-full h-4 mb-8 overflow-hidden`}>
              <div
                className={`h-4 ${colors.primary} rounded-full transition-all duration-1000`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <div className='text-center mb-8'>
              <div className={`text-8xl font-bold ${colors.text}`}>
                {formatTime(timeLeft)}
              </div>
            </div>
          </>
        )}

        <div className='flex justify-center gap-4'>
          {timeLeft === 0 ? (
            <button
              onClick={startTimer}
              disabled={minutes === 0 && seconds === 0}
              className={`px-8 py-4 ${colors.primary} ${colors.primaryHover} text-white rounded-lg text-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              시작
            </button>
          ) : (
            <>
              <button
                onClick={toggleTimer}
                className={`px-8 py-4 rounded-lg text-xl font-bold text-white transition-colors ${
                  isRunning
                    ? 'bg-yellow-500 hover:bg-yellow-600'
                    : `${colors.primary} ${colors.primaryHover}`
                }`}
              >
                {isRunning ? '일시정지' : '재개'}
              </button>
              <button
                onClick={resetTimer}
                className={`px-8 py-4 ${colors.accent} ${colors.accentHover} text-white rounded-lg text-xl font-bold transition-colors`}
              >
                초기화
              </button>
            </>
          )}
        </div>

        <div className='mt-8 bg-blue-50 rounded-lg p-4'>
          <p className='text-sm text-blue-800'>
            💡 <strong>팁:</strong> 브라우저 알림을 허용하면 타이머 종료 시
            알림을 받을 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
