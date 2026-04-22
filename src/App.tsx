import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './lib/theme'
import ComparePage from './pages/ComparePage'
import DevicePage from './pages/DevicePage'

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<ComparePage />} />
        <Route path="/device/:id" element={<DevicePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  )
}
