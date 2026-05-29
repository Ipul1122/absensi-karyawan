import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { 
  Routes, 
  Route, 
  Navigate, 
  useLocation 
} from 'react-router-dom'
import { 
  Clock, 
  Menu, 
  X, 
  ChevronRight
} from 'lucide-react'

// Import layout component
import EmployeeSidebar from './layout/EmployeeSidebar'

// Import subcomponents
import EmployeeOverview from './employee/EmployeeOverview'
import EmployeeAbsen from './employee/EmployeeAbsen'
import EmployeeHistory from './employee/EmployeeHistory'
import EmployeeSettings from './employee/EmployeeSettings'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'employee'
}

interface EmployeeDashboardProps {
  user: User
  token: string
  onLogout: () => void
}

interface Attendance {
  id: number
  date: string
  clock_in: string | null
  clock_out: string | null
  latitude_in: string | null
  longitude_in: string | null
  latitude_out: string | null
  longitude_out: string | null
  photo_in: string | null
  photo_out: string | null
  notes_in: string | null
  notes_out: string | null
  status_in: string | null
  status_out: string | null
}

interface OfficeSetting {
  id: number
  latitude: string
  longitude: string
  radius: number
}

export default function EmployeeDashboard({ user, token, onLogout }: EmployeeDashboardProps) {
  const location = useLocation()
  const [time, setTime] = useState(new Date())
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null)
  const [officeSetting, setOfficeSetting] = useState<OfficeSetting | null>(null)
  const [history, setHistory] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch today's attendance, office setting & history
  const fetchTodayAttendance = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/attendance/today', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setTodayAttendance(response.data.data)
      }
    } catch (err) {
      console.error('Gagal mengambil data absensi hari ini:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchOfficeSetting = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/office-setting', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setOfficeSetting(response.data.data)
      }
    } catch (err) {
      console.error('Gagal mengambil data lokasi kantor:', err)
    }
  }

  const fetchHistory = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/attendance/history', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setHistory(response.data.data)
      }
    } catch (err) {
      console.error('Gagal mengambil riwayat absensi:', err)
    }
  }

  useEffect(() => {
    fetchTodayAttendance()
    fetchOfficeSetting()
    fetchHistory()
  }, [])

  // Determine current step
  const getAttendanceState = () => {
    if (loading) return 'loading' as const
    if (!todayAttendance || !todayAttendance.clock_in) return 'needs_checkin' as const
    if (!todayAttendance.clock_out) return 'needs_checkout' as const
    return 'completed' as const
  }

  const attendanceState = getAttendanceState()

  // Timer-based status evaluation for visual guidelines
  const getLiveCheckInStatus = () => {
    const hrs = time.getHours()
    const mins = time.getMinutes()
    const timeVal = hrs * 60 + mins

    const startNormal = 8 * 60 + 30 // 08:30
    const endNormal = 9 * 60 // 09:00

    if (timeVal < startNormal) {
      return { text: 'Datang Lebih Awal', colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
    } else if (timeVal >= startNormal && timeVal <= endNormal) {
      return { text: 'Normal (Sesuai Jadwal)', colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }
    } else {
      return { text: 'Terlambat', colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20' }
    }
  }

  const getLiveCheckOutStatus = () => {
    const hrs = time.getHours()
    const mins = time.getMinutes()
    const timeVal = hrs * 60 + mins

    const startNormal = 17 * 60 // 17:00
    const endNormal = 18 * 60 // 18:00

    if (timeVal < startNormal) {
      return { text: 'Pulang Cepat', colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20' }
    } else if (timeVal >= startNormal && timeVal <= endNormal) {
      return { text: 'Normal (Sesuai Jadwal)', colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }
    } else {
      return { text: 'Lembur', colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
    }
  }

  const handleLogoutClick = async () => {
    try {
      await axios.post(
        'http://localhost:8000/api/logout',
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
    } catch (err) {
      console.error('API logout error', err)
    } finally {
      onLogout()
      Swal.fire({
        title: 'Logged Out',
        text: 'Anda telah keluar dari aplikasi.',
        icon: 'info',
        timer: 1500,
        showConfirmButton: false,
        background: '#1e293b',
        color: '#f8fafc'
      })
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) return '-'
    const textMap: Record<string, string> = {
      early: 'Datang Lebih Awal',
      normal: 'Normal',
      late: 'Terlambat',
      early_departure: 'Pulang Cepat',
      overtime: 'Lembur'
    }
    const colorMap: Record<string, string> = {
      early: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      normal: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      late: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      early_departure: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      overtime: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${colorMap[status] || 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>
        {textMap[status] || status}
      </span>
    )
  }

  const getRouteInfo = () => {
    const path = location.pathname
    if (path.includes('absen')) {
      return { title: 'Formulir Absensi', subtitle: 'Clock In / Out' }
    }
    if (path.includes('riwayat')) {
      return { title: 'Riwayat Presensi', subtitle: 'History Logs' }
    }
    if (path.includes('pengaturan')) {
      return { title: 'Pengaturan Akun', subtitle: 'Settings' }
    }
    return { title: 'Dashboard Karyawan', subtitle: 'Overview' }
  }

  const routeInfo = getRouteInfo()

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row bg-slate-950">
      
      {/* Mobile Top Navbar Header */}
      <header className="md:hidden flex items-center gap-3 px-6 py-4 bg-slate-900/40 border-b border-slate-850">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="p-2 bg-slate-950 border border-slate-800 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-base">
            K
          </div>
          <span className="text-xs font-extrabold text-white tracking-wider font-quicksand uppercase">Portal Karyawan</span>
        </div>
      </header>

      {/* Floating Toggle Button on Left Middle Edge */}
      {!mobileSidebarOpen && (
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="md:hidden fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-650 text-white p-2 py-3 rounded-r-2xl shadow-lg shadow-indigo-650/30 border border-l-0 border-indigo-500/20 transition-all cursor-pointer flex items-center"
          title="Buka Menu"
        >
          <ChevronRight className="w-5 h-5 animate-pulse" />
        </button>
      )}

      {/* Desktop Left Sidebar (Fixed) */}
      <aside className="hidden md:block w-64 bg-slate-950/40 border-r border-slate-900/60 p-6 flex-shrink-0">
        <EmployeeSidebar user={user} onLogout={handleLogoutClick} />
      </aside>

      {/* Mobile Sidebar (Slide-over drawer) */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-950/90 backdrop-blur-sm animate-fade-in flex">
          <div className="w-64 bg-slate-900 border-r border-slate-800/80 p-6 h-full flex-shrink-0 relative animate-slide-right">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <EmployeeSidebar user={user} onLogout={handleLogoutClick} onClose={() => setMobileSidebarOpen(false)} />
          </div>
          <div className="flex-grow h-full" onClick={() => setMobileSidebarOpen(false)}></div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow p-6 md:p-10 min-h-screen overflow-y-auto">
        
        {/* Dynamic header with page title & clock */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900/60 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">
                Employee Panel
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] text-slate-500 font-bold font-mono">
                {routeInfo.subtitle}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1 font-quicksand capitalize">
              {routeInfo.title}
            </h1>
          </div>

          {/* Clock widget */}
          <div className="flex items-center gap-3 bg-slate-900/40 border border-slate-850 px-4 py-2 rounded-2xl">
            <Clock className="w-4 h-4 text-indigo-400 animate-pulse" />
            <div>
              <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Live Clock</span>
              <span className="text-xs font-bold text-white font-mono">{time.toLocaleTimeString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Nested Routing Views */}
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-400"></div>
          </div>
        ) : (
          <Routes>
            <Route 
              path="dashboard" 
              element={
                <EmployeeOverview
                  user={user}
                  time={time}
                  todayAttendance={todayAttendance}
                  attendanceState={attendanceState}
                  getLiveCheckInStatus={getLiveCheckInStatus}
                  getLiveCheckOutStatus={getLiveCheckOutStatus}
                  formatDate={formatDate}
                  getStatusBadge={getStatusBadge}
                />
              } 
            />
            <Route 
              path="absen" 
              element={
                <EmployeeAbsen
                  token={token}
                  todayAttendance={todayAttendance}
                  officeSetting={officeSetting}
                  fetchTodayAttendance={fetchTodayAttendance}
                  fetchHistory={fetchHistory}
                  getStatusBadge={getStatusBadge}
                />
              } 
            />
            <Route 
              path="riwayat" 
              element={
                <EmployeeHistory
                  history={history}
                  getStatusBadge={getStatusBadge}
                />
              } 
            />
            <Route 
              path="pengaturan" 
              element={
                <EmployeeSettings
                  user={user}
                  token={token}
                />
              } 
            />
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        )}
      </main>
    </div>
  )
}
