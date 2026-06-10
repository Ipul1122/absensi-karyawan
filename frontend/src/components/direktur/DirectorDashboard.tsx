import { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import DirectorSidebar from '../layout/DirectorSidebar'
import DirectorNavbar, { DirectorMobileNavbar } from '../layout/DirectorNavbar'
import DirekturOverview from './DirekturOverview'
import PersetujuanKaryawan from './PersetujuanKaryawan'
import PersetujuanGaji from './PersetujuanGaji'
import PersetujuanPayroll from './PersetujuanPayroll'
import PersetujuanOperational from './PersetujuanOperational'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'employee' | 'director'
  photo?: string | null
}

interface DirectorDashboardProps {
  user: User
  token: string
  onLogout: () => void
}

export default function DirectorDashboard({ user, token, onLogout }: DirectorDashboardProps) {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const location = useLocation()
  const path = location.pathname

  let pageTitle = 'Dashboard Utama'
  let pageSubtitle = 'Selamat datang, pantau semua persetujuan yang menunggu tindakan Anda'
  if (path.includes('/karyawan')) { pageTitle = 'Persetujuan Karyawan'; pageSubtitle = 'Kelola pendaftaran karyawan baru dan pengajuan penghapusan akun' }
  else if (path.includes('/gaji')) { pageTitle = 'Persetujuan Gaji'; pageSubtitle = 'Setujui atau tolak penyesuaian nominal gaji dan tunjangan karyawan' }
  else if (path.includes('/payroll')) { pageTitle = 'Persetujuan Payroll Bulanan'; pageSubtitle = 'Validasi dan sahkan rekap slip gaji karyawan sebelum ditransfer' }
  else if (path.includes('/operasional')) { pageTitle = 'Persetujuan Operasional'; pageSubtitle = 'Proses pengajuan cuti, lembur, klaim biaya, dan bonus karyawan' }

  return (
    <div className="flex min-h-screen text-slate-800" style={{ fontFamily: "'Inter', 'system-ui', sans-serif" }}>
      {/* Sidebar - Desktop */}
      {/* Sidebar - Desktop */}
      <aside className="hidden md:block w-64 bg-white border-r border-orange-100/80 p-6 flex-shrink-0 shadow-sm sticky top-0 h-screen overflow-y-auto">
        <DirectorSidebar user={user} onLogout={onLogout} />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <DirectorNavbar user={user} title={pageTitle} subtitle={pageSubtitle} />
        <DirectorMobileNavbar onMenuClick={() => setShowMobileSidebar(true)} />
        
        {/* Mobile Sidebar Drawer */}
        {showMobileSidebar && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowMobileSidebar(false)}
            />
            <div className="relative w-64 max-w-xs h-full flex flex-col p-6 bg-white border-r border-orange-100 shadow-2xl overflow-y-auto">
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="absolute top-4 right-4 p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition-all cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>
              <DirectorSidebar user={user} onLogout={onLogout} onClose={() => setShowMobileSidebar(false)} />
            </div>
          </div>
        )}

        <main
          className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto"
          style={{ fontFamily: "'Inter', 'system-ui', sans-serif" }}
        >
          <Routes>
            <Route path="dashboard" element={<DirekturOverview token={token} />} />
            <Route path="karyawan" element={<PersetujuanKaryawan token={token} />} />
            <Route path="gaji" element={<PersetujuanGaji token={token} />} />
            <Route path="payroll" element={<PersetujuanPayroll token={token} />} />
            <Route path="operasional" element={<PersetujuanOperational token={token} />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
