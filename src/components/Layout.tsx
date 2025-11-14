import { Link, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className='flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
      <nav className='bg-white shadow-md'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            <div className='flex items-center'>
              <Link to='/' className='text-2xl font-bold text-indigo-600'>
                강의 유틸리티 킷
              </Link>
            </div>
            <div className='flex items-center space-x-4'>
              <Link
                to='/'
                className='text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors'
              >
                대시보드
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className='flex-1 flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 w-full'>
        <Outlet />
      </main>
      <footer className='bg-white border-t mt-12'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-gray-600 text-sm'>
          © 2025 강의 유틸리티 킷. 교육을 위한 도구 모음.
        </div>
      </footer>
    </div>
  );
}
