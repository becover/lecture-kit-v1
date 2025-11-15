import { Link, Outlet } from 'react-router-dom';
import { useTheme, THEME_PRESETS } from '../context/ThemeContext';
import type { ThemeType } from '../context/ThemeContext';

export default function Layout() {
  const { theme, setTheme, colors } = useTheme();

  return (
    <div className={`flex flex-col min-h-screen ${colors.bg} transition-colors duration-300`}>
      <nav className={`${colors.card} shadow-md`}>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            <div className='flex items-center'>
              <Link to='/' className={`text-2xl font-bold ${colors.link} transition-colors`}>
                강의 유틸리티 킷
              </Link>
            </div>
            <div className='flex items-center space-x-4'>
              <Link
                to='/'
                className={`${colors.textSecondary} ${colors.linkHover} px-3 py-2 rounded-md text-sm font-medium transition-colors`}
              >
                대시보드
              </Link>

              <div className='flex items-center gap-2 ml-4'>
                <label className={`text-xs font-medium ${colors.text}`}>🎨</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as ThemeType)}
                  className={`px-2 py-1 text-sm ${colors.card} ${colors.text} ${colors.border} border rounded-md focus:outline-none focus:ring-2 transition-all`}
                >
                  {(Object.keys(THEME_PRESETS) as ThemeType[]).map((key) => (
                    <option key={key} value={key}>
                      {THEME_PRESETS[key].name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className='flex-1 flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 w-full'>
        <Outlet />
      </main>
      <footer className={`${colors.card} ${colors.border} border-t mt-12`}>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center ${colors.textSecondary} text-sm`}>
          © 2025 강의 유틸리티 킷. 교육을 위한 도구 모음.
        </div>
      </footer>
    </div>
  );
}
