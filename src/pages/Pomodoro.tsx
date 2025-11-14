import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

type TimerMode = 'focus' | 'break' | 'longBreak';

export default function Pomodoro() {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);

  const durations = {
    focus: 25 * 60,
    break: 5 * 60,
    longBreak: 15 * 60,
  };

  useEffect(() => {
    let interval: number | undefined;

    if (isRunning && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      if (mode === 'focus') {
        setPomodorosCompleted((count) => count + 1);
        const newMode = (pomodorosCompleted + 1) % 4 === 0 ? 'longBreak' : 'break';
        setMode(newMode);
        setTimeLeft(durations[newMode]);
      } else {
        setMode('focus');
        setTimeLeft(durations.focus);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode, pomodorosCompleted]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(durations[mode]);
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(durations[newMode]);
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((durations[mode] - timeLeft) / durations[mode]) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
          ← 대시보드로 돌아가기
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">뽀모도로 타이머 🍅</h1>

        <div className="flex justify-center gap-2 mb-8">
          <button
            onClick={() => switchMode('focus')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              mode === 'focus'
                ? 'bg-red-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            집중 (25분)
          </button>
          <button
            onClick={() => switchMode('break')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              mode === 'break'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            짧은 휴식 (5분)
          </button>
          <button
            onClick={() => switchMode('longBreak')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              mode === 'longBreak'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            긴 휴식 (15분)
          </button>
        </div>

        <div className="relative mb-8">
          <div className="w-full bg-gray-200 rounded-full h-4 mb-8">
            <div
              className={`h-4 rounded-full transition-all duration-1000 ${
                mode === 'focus' ? 'bg-red-500' : mode === 'break' ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="text-center">
            <div className="text-8xl font-bold text-gray-800 mb-8">{formatTime(timeLeft)}</div>

            <div className="flex justify-center gap-4">
              <button
                onClick={toggleTimer}
                className={`px-8 py-4 rounded-lg text-xl font-bold text-white transition-colors ${
                  isRunning
                    ? 'bg-yellow-500 hover:bg-yellow-600'
                    : mode === 'focus'
                    ? 'bg-red-500 hover:bg-red-600'
                    : mode === 'break'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isRunning ? '일시정지' : '시작'}
              </button>
              <button
                onClick={resetTimer}
                className="px-8 py-4 bg-gray-500 text-white rounded-lg text-xl font-bold hover:bg-gray-600 transition-colors"
              >
                초기화
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <div className="text-center">
            <p className="text-gray-600 mb-2">완료한 뽀모도로</p>
            <p className="text-4xl font-bold text-indigo-600">{pomodorosCompleted}</p>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p className="mb-2"><strong>뽀모도로 기법이란?</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>25분 집중 → 5분 휴식을 반복합니다</li>
              <li>4회 반복 후에는 15분의 긴 휴식을 취합니다</li>
              <li>집중력 향상과 피로 감소에 효과적입니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
