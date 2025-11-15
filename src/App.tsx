import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
// import Attendance from './pages/Attendance';
import Pomodoro from './pages/Pomodoro';
import Timer from './pages/Timer';
import ScreenshotTime from './pages/ScreenshotTime';
// import Survey from './pages/Survey';
// import Upload from './pages/Upload';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Layout />}>
            <Route index element={<Dashboard />} />
            {/* <Route path="attendance" element={<Attendance />} /> */}
            <Route path='pomodoro' element={<Pomodoro />} />
            <Route path='timer' element={<Timer />} />
            <Route path='screenshot-time' element={<ScreenshotTime />} />
            {/* <Route path="survey" element={<Survey />} /> */}
            {/* <Route path="upload" element={<Upload />} /> */}
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
