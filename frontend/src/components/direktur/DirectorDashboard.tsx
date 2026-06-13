import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { X } from 'lucide-react'
import DirectorSidebar from '../layout/DirectorSidebar'
import DirectorNavbar, { DirectorMobileNavbar } from '../layout/DirectorNavbar'
import DirekturOverview from './dashboard/DirekturOverview'
import PersetujuanKaryawan from './persetujuan/PersetujuanKaryawan'
import PersetujuanGaji from './persetujuan/PersetujuanGaji'
import PersetujuanPayroll from './persetujuan/PersetujuanPayroll'
import PersetujuanOperational from './persetujuan/PersetujuanOperational'
import LogKehadiran from './kehadiran/LogKehadiran'

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

  const [pendingKaryawanCount, setPendingKaryawanCount] = useState(0)
  const [pendingGajiCount, setPendingGajiCount] = useState(0)
  const [pendingPayrollCount, setPendingPayrollCount] = useState(0)
  const [pendingOperasionalCount, setPendingOperasionalCount] = useState(0)

  const fetchPendingCounts = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/sidebar/notification-counts', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data.status === 'success') {
        const counts = res.data.data
        setPendingKaryawanCount(counts.pendingKaryawanCount || 0)
        setPendingGajiCount(counts.pendingGajiCount || 0)
        setPendingPayrollCount(counts.pendingPayrollCount || 0)
        setPendingOperasionalCount(counts.pendingOperasionalCount || 0)
      }
    } catch (err) {
      console.error('Failed to fetch pending counts:', err)
    }
  }

  useEffect(() => {
    fetchPendingCounts()
    const interval = setInterval(fetchPendingCounts, 15000)
    return () => clearInterval(interval)
  }, [token])

  let pageTitle = 'Dashboard Utama'
  let pageSubtitle = 'Selamat datang, pantau semua persetujuan yang menunggu tindakan Anda'
  if (path.includes('/karyawan')) { pageTitle = 'Persetujuan Karyawan'; pageSubtitle = 'Kelola pendaftaran karyawan baru dan pengajuan penghapusan akun' }
  else if (path.includes('/gaji')) { pageTitle = 'Persetujuan Gaji'; pageSubtitle = 'Setujui atau tolak penyesuaian nominal gaji dan tunjangan karyawan' }
  else if (path.includes('/payroll')) { pageTitle = 'Persetujuan Payroll Bulanan'; pageSubtitle = 'Validasi dan sahkan rekap slip gaji karyawan sebelum ditransfer' }
  else if (path.includes('/operasional')) { pageTitle = 'Persetujuan Operasional'; pageSubtitle = 'Proses pengajuan cuti, lembur, klaim biaya, bonus, dan inventaris barang' }
  else if (path.includes('/log-kehadiran')) { pageTitle = 'Log Kehadiran'; pageSubtitle = 'Pantau riwayat aktivitas absensi harian karyawan dan admin' }

  return (
    <div className="flex min-h-screen text-slate-800" style={{ fontFamily: "'Inter', 'system-ui', sans-serif" }}>
      {/* Sidebar - Desktop */}
      {/* Sidebar - Desktop */}
      <aside className="hidden md:block w-64 bg-white border-r border-orange-100/80 p-6 flex-shrink-0 shadow-sm sticky top-0 h-screen overflow-y-auto">
        <DirectorSidebar 
          user={user} 
          onLogout={onLogout} 
          pendingKaryawanCount={pendingKaryawanCount} 
          pendingGajiCount={pendingGajiCount} 
          pendingPayrollCount={pendingPayrollCount}
          pendingOperasionalCount={pendingOperasionalCount}
        />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <DirectorNavbar user={user} title={pageTitle} subtitle={pageSubtitle} />
        <DirectorMobileNavbar onMenuClick={() => setShowMobileSidebar(true)} pendingCount={pendingKaryawanCount + pendingGajiCount} />
        
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
              <DirectorSidebar 
                user={user} 
                onLogout={onLogout} 
                onClose={() => setShowMobileSidebar(false)} 
                pendingKaryawanCount={pendingKaryawanCount} 
                pendingGajiCount={pendingGajiCount} 
                pendingPayrollCount={pendingPayrollCount}
                pendingOperasionalCount={pendingOperasionalCount}
              />
            </div>
          </div>
        )}

        <main
          className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto"
          style={{ fontFamily: "'Inter', 'system-ui', sans-serif" }}
        >
          <Routes>
            <Route path="dashboard" element={<DirekturOverview token={token} />} />
            <Route path="karyawan" element={<PersetujuanKaryawan token={token} onApprovalChange={fetchPendingCounts} />} />
            <Route path="gaji" element={<PersetujuanGaji token={token} onApprovalChange={fetchPendingCounts} />} />
            <Route path="payroll" element={<PersetujuanPayroll token={token} />} />
            <Route path="operasional" element={<PersetujuanOperational token={token} />} />
            <Route path="log-kehadiran" element={<LogKehadiran token={token} />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
