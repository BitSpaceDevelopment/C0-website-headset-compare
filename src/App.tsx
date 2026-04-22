import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './lib/theme'
import ComparePage from './pages/ComparePage'
import LoginPage from './pages/LoginPage'
import AdminLayout from './pages/admin/AdminLayout'
import DevicesPage from './pages/admin/DevicesPage'
import SpecsPage from './pages/admin/SpecsPage'

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<ComparePage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="devices" replace />} />
          <Route path="devices" element={<DevicesPage />} />
          <Route path="specs" element={<SpecsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  )
}
