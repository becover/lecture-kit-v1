import Card from '../components/Card';
import { useTheme } from '../context/ThemeContext';

export default function Dashboard() {
  const { colors } = useTheme();

  const tools = [
    // {
    //   title: '출석 체크',
    //   description: '학생들의 출석을 확인하고 관리합니다',
    //   icon: '✓',
    //   to: '/attendance',
    //   color: 'border-green-500',
    // },
    {
      title: '수업 시간표 알림',
      description: '설정한 시간에 자동으로 알림을 받습니다',
      icon: '🔔',
      to: '/pomodoro',
      color: 'border-red-500',
    },
    {
      title: '수업 타이머',
      description: '수업 시간 및 활동 시간 타이머',
      icon: '⏱',
      to: '/timer',
      color: 'border-blue-500',
    },
    {
      title: '스크린샷 타임',
      description: '설정된 시간에 카운트다운 타이머 실행',
      icon: '📸',
      to: '/screenshot-time',
      color: 'border-purple-500',
    },
    // {
    //   title: '설문 조사',
    //   description: '실시간 설문 및 퀴즈',
    //   icon: '📊',
    //   to: '/survey',
    //   color: 'border-purple-500',
    // },
    // {
    //   title: '자료 업로드',
    //   description: '강의 자료 및 파일 공유',
    //   icon: '📁',
    //   to: '/upload',
    //   color: 'border-yellow-500',
    // },
  ];

  return (
    <div className='flex flex-col flex-1 justify-between'>
      <div>
        <div className='mb-8'>
          <h1 className={`text-4xl font-bold ${colors.text} mb-2`}>대시보드</h1>
          <p className={colors.textSecondary}>
            강의에 필요한 다양한 도구들을 한 곳에서 관리하세요
          </p>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {tools.map((tool) => (
            <Card key={tool.to} {...tool} />
          ))}
        </div>
      </div>

      <div className={`p-6 ${colors.card} rounded-lg shadow-md ${colors.border} border transition-colors duration-300`}>
        <h2 className={`text-2xl font-bold ${colors.text} mb-4`}>사용 가이드</h2>
        <ul className={`space-y-2 ${colors.textSecondary}`}>
          {/* <li>• <strong>출석 체크:</strong> 수업 시작 시 학생들의 출석을 빠르게 확인하세요</li> */}
          <li>
            • <strong>수업 시간표 알림:</strong> 쉬는 시간, 수업 시작/종료
            시간에 자동 알림
          </li>
          <li>
            • <strong>타이머:</strong> 발표, 토론, 시험 등 다양한 활동의 시간
            관리
          </li>
          <li>
            • <strong>스크린샷 타임:</strong> 설정된 시간에 60초 카운트다운,
            30초 및 10초부터 알림
          </li>
          {/* <li>• <strong>설문:</strong> 실시간으로 학생들의 이해도와 피드백 확인</li> */}
          {/* <li>• <strong>자료 업로드:</strong> 강의 자료를 쉽게 공유하고 관리</li> */}
        </ul>
      </div>
    </div>
  );
}
