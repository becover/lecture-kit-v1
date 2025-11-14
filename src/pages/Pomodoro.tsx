import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

interface TimeSlot {
  id: number;
  time: string;
  message: string;
  enabled: boolean;
  notified: boolean; // 오늘 이미 알림이 발송되었는지 추적
}

const DEFAULT_TIME_SLOTS: Omit<TimeSlot, 'id' | 'notified'>[] = [
  { time: '08:50', message: '수업 시간 10분 전입니다', enabled: true },
  { time: '09:50', message: '쉬는 시간입니다', enabled: true },
  { time: '10:50', message: '쉬는 시간입니다', enabled: true },
  { time: '11:50', message: '쉬는 시간입니다', enabled: true },
  { time: '12:50', message: '쉬는 시간입니다', enabled: true },
  { time: '14:50', message: '쉬는 시간입니다', enabled: true },
  { time: '15:50', message: '쉬는 시간입니다', enabled: true },
  { time: '16:50', message: '쉬는 시간입니다', enabled: true },
  { time: '17:50', message: '수업이 종료되었습니다', enabled: true },
];

export default function Pomodoro() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(() => {
    const saved = localStorage.getItem('lecture-time-slots');
    if (saved) {
      return JSON.parse(saved);
    }
    return DEFAULT_TIME_SLOTS.map((slot, idx) => ({
      ...slot,
      id: idx + 1,
      notified: false,
    }));
  });

  const [isActive, setIsActive] = useState(() => {
    const saved = localStorage.getItem('lecture-notifications-active');
    return saved === 'true';
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTime, setEditTime] = useState('');
  const [editMessage, setEditMessage] = useState('');

  // 현재 시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 시간대 저장
  useEffect(() => {
    localStorage.setItem('lecture-time-slots', JSON.stringify(timeSlots));
  }, [timeSlots]);

  // 알림 활성화 상태 저장
  useEffect(() => {
    localStorage.setItem('lecture-notifications-active', String(isActive));
  }, [isActive]);

  // 자정에 notified 상태 초기화
  useEffect(() => {
    const checkMidnight = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        setTimeSlots(slots =>
          slots.map(slot => ({ ...slot, notified: false }))
        );
      }
    }, 60000); // 1분마다 체크

    return () => clearInterval(checkMidnight);
  }, []);

  // 알림 발송 함수
  const sendNotification = useCallback((message: string) => {
    console.log('🔔 알림 시도:', {
      permission: notificationPermission,
      hasNotificationAPI: typeof Notification !== 'undefined',
      message,
      timestamp: new Date().toISOString(),
    });

    // 브라우저 시스템 알림
    if (notificationPermission === 'granted') {
      try {
        console.log('📢 시스템 알림 생성 시작...');
        const notification = new Notification('수업 알림 🔔', {
          body: message,
          tag: 'lecture-notification',
        });

        notification.onshow = () => {
          console.log('✅ 시스템 알림이 화면에 표시됨');
        };

        notification.onclick = () => {
          console.log('✅ 알림 클릭됨');
          window.focus();
          notification.close();
        };

        notification.onerror = (error) => {
          console.error('❌ 알림 표시 중 에러:', error);
        };

        console.log('✅ 시스템 알림 객체 생성 성공', notification);
      } catch (error) {
        console.error('❌ 시스템 알림 생성 실패:', error);
      }
    } else {
      console.warn('⚠️ 알림 권한이 없습니다:', notificationPermission);
    }

    // 소리 재생
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVanm7q1aFQ1Ln+Pxv3IeBi6Cz/PWhzYHImzB7+WaTg4NUqnl762cFAxKnuPvwnAhBSx/zvPYiDYHI3DB7uOaSQ4NUqbl761dFQ1Ln+PvwnAhBSyAz/PXhzUHIm/A7uKZSg0PVKjl7axdFQxLn+PvwnAhBSx/zvPYhzYHI3DB7uOZSQ4PVKjl7axdFQxLnuPvwnEhBSyBz/PWhzUHIm/A7uSZSw4PU6fk7axcFQxLn+PwwnEhBiyAzvPWhzYHI3DB7uOZSQ4PVKjl7axdFQxLnuPvwnAhBSyAzvPXiDUHIm/A7uOaSw4PU6fk7axdFQxLn+PvwnEhBSyAzvPWhzYHI2/A7uKZSw4PVKfl7qxdFQtLnt/vwm8hBSx/zu/YhzUHInDB7uOZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHInDB7uOZSg0PVKfl7qxdFQtLnt/vwm8hBSx/zu/YhzUHI3DB7uOZSQ0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxLnuPwwm8hBSx/zvPXhzUHI3DB7eKZSg0PVKfl7qxcFQxL');
    audio.play().catch((error) => {
      console.log('⚠️ 오디오 재생 실패 (사용자 상호작용 필요):', error);
    });
  }, [notificationPermission]);

  // 알림 체크
  useEffect(() => {
    if (!isActive) return;

    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    timeSlots.forEach((slot) => {
      if (slot.enabled && !slot.notified && slot.time === currentTimeStr) {
        sendNotification(slot.message);
        // notified 상태 업데이트
        setTimeSlots((prev) =>
          prev.map((s) =>
            s.id === slot.id ? { ...s, notified: true } : s
          )
        );
      }
    });
  }, [currentTime, isActive, timeSlots, sendNotification]);

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      alert('이 브라우저는 알림을 지원하지 않습니다.');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === 'granted') {
      sendNotification('알림이 활성화되었습니다! 설정된 시간에 알림을 받으실 수 있습니다.');
    }

    return permission;
  };

  const toggleActive = async () => {
    if (!isActive && notificationPermission !== 'granted') {
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        return;
      }
    }
    setIsActive(!isActive);
  };

  const toggleSlot = (id: number) => {
    setTimeSlots((prev) =>
      prev.map((slot) =>
        slot.id === id ? { ...slot, enabled: !slot.enabled } : slot
      )
    );
  };

  const deleteSlot = (id: number) => {
    setTimeSlots((prev) => prev.filter((slot) => slot.id !== id));
  };

  const startEdit = (slot: TimeSlot) => {
    setEditingId(slot.id);
    setEditTime(slot.time);
    setEditMessage(slot.message);
  };

  const saveEdit = () => {
    if (!editTime || !editMessage) return;

    setTimeSlots((prev) =>
      prev.map((slot) =>
        slot.id === editingId
          ? { ...slot, time: editTime, message: editMessage, notified: false }
          : slot
      )
    );
    setEditingId(null);
    setEditTime('');
    setEditMessage('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTime('');
    setEditMessage('');
  };

  const addNewSlot = () => {
    const newId = Math.max(...timeSlots.map((s) => s.id), 0) + 1;
    setTimeSlots((prev) => [
      ...prev,
      {
        id: newId,
        time: '09:00',
        message: '새 알림',
        enabled: true,
        notified: false,
      },
    ]);
  };

  const resetToDefault = () => {
    if (confirm('기본 시간표로 초기화하시겠습니까?')) {
      setTimeSlots(
        DEFAULT_TIME_SLOTS.map((slot, idx) => ({
          ...slot,
          id: idx + 1,
          notified: false,
        }))
      );
    }
  };

  const testNotification = () => {
    if (notificationPermission === 'granted') {
      sendNotification('테스트 알림입니다. 알림이 정상적으로 작동합니다!');
    } else {
      requestNotificationPermission();
    }
  };

  const sortedSlots = [...timeSlots].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
          ← 대시보드로 돌아가기
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">수업 시간표 알림 🔔</h1>
            <p className="text-gray-600 mt-2">설정된 시간에 자동으로 알림을 받으세요</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-1">
              {currentTime.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
            <div className="text-sm text-gray-500">
              {currentTime.toLocaleDateString('ko-KR', {
                month: 'long',
                day: 'numeric',
                weekday: 'short',
              })}
            </div>
          </div>
        </div>

        {notificationPermission !== 'granted' && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-yellow-800">
                  알림을 받으려면 브라우저 알림 권한이 필요합니다.
                </p>
              </div>
              <button
                onClick={requestNotificationPermission}
                className="ml-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
              >
                권한 허용
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3 mb-6">
          <button
            onClick={toggleActive}
            disabled={notificationPermission !== 'granted'}
            className={`flex-1 px-6 py-4 rounded-lg font-bold text-lg transition-colors ${
              isActive
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-green-500 text-white hover:bg-green-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isActive ? '🔔 알림 활성화됨 (클릭하여 중지)' : '▶️ 알림 시작'}
          </button>
          <button
            onClick={testNotification}
            className="px-6 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            테스트 알림
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={addNewSlot}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            + 시간대 추가
          </button>
          <button
            onClick={resetToDefault}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            기본값으로 초기화
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {sortedSlots.map((slot) => (
          <div
            key={slot.id}
            className={`bg-white rounded-lg shadow-md p-4 transition-all ${
              slot.enabled ? 'border-l-4 border-indigo-500' : 'opacity-60'
            } ${slot.notified ? 'bg-green-50' : ''}`}
          >
            {editingId === slot.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      시간
                    </label>
                    <input
                      type="time"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      메시지
                    </label>
                    <input
                      type="text"
                      value={editMessage}
                      onChange={(e) => setEditMessage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    저장
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <div className="text-3xl font-bold text-indigo-600 w-24">
                    {slot.time}
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-medium text-gray-800">{slot.message}</p>
                    {slot.notified && (
                      <p className="text-sm text-green-600">✓ 오늘 알림 발송됨</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
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
                  <button
                    onClick={() => startEdit(slot)}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => deleteSlot(slot.id)}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                  >
                    삭제
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="font-bold text-blue-900 mb-2">💡 사용 팁</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 알림 시작 버튼을 누르면 설정된 시간에 자동으로 시스템 알림이 발송됩니다</li>
          <li>• 브라우저가 최소화되어 있거나 다른 화면을 보고 있어도 알림이 표시됩니다</li>
          <li>• 시간대를 클릭하여 수정하거나 비활성화할 수 있습니다</li>
          <li>• 같은 시간의 알림은 하루에 한 번만 발송됩니다</li>
          <li>• 자정이 지나면 모든 알림 상태가 초기화됩니다</li>
        </ul>
      </div>
    </div>
  );
}
