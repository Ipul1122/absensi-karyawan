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
  Menu, 
  X, 
  ChevronRight
} from 'lucide-react'

// Import layout component
import EmployeeSidebar from './layout/EmployeeSidebar'
import Logo from './layout/Logo'

// Import subcomponents
import EmployeeOverview from './employee/dashboard/EmployeeOverview'
import EmployeeAbsen from './employee/absensi/EmployeeAbsen'
import EmployeeSales from './employee/absensi/EmployeeSales'
import EmployeeClient from './employee/absensi/EmployeeClient'
import EmployeeHistory from './employee/absensi/EmployeeHistory'
import EmployeeSettings from './employee/pengaturan/EmployeeSettings'
import BiodataSetting from './employee/pengaturan/BiodataSetting'
import EmployeeCuti from './employee/operasional/EmployeeCuti'
import EmployeeIzin from './employee/operasional/EmployeeIzin'
import EmployeePayroll from './employee/payroll/EmployeePayroll'
import EmployeeReimbursement from './employee/operasional/EmployeeReimbursement'
import EmployeeBonus from './employee/payroll/EmployeeBonus'
import EmployeeOvertime from './employee/operasional/EmployeeOvertime'
import { getAssetUrl } from '../utils/api'
import {
  isPushNotificationSupported,
  getExistingSubscription,
  askNotificationPermission,
  subscribeUserToPush
} from '../utils/pushNotificationHelper'

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
  attendance_type?: string | null
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
  const [company, setCompany] = useState<string>('')
  const [profile, setProfile] = useState<any | null>(null)
  const [sidebarCounts, setSidebarCounts] = useState({
    pendingCutiCount: 0,
    pendingIzinCount: 0,
    pendingLemburCount: 0,
    pendingReimburseCount: 0,
    unpaidPayrollCount: 0,
    operasionalCount: 0,
  })

  // Remove dark mode class and theme from local storage
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    localStorage.removeItem('theme')
  }, [])

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

  const fetchSidebarCounts = async () => {
    if (document.hidden) return
    try {
      const response = await axios.get('http://localhost:8000/api/sidebar/notification-counts', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setSidebarCounts(response.data.data)
      }
    } catch (err) {
      console.error('Gagal mengambil data counts sidebar:', err)
    }
  }

  const checkAndOfferPushNotifications = async (authToken: string, userProfile: any) => {
    if (!isPushNotificationSupported()) return

    try {
      const existing = await getExistingSubscription()
      if (existing) return

      const promptShown = localStorage.getItem('push_notification_prompt_shown')
      if (promptShown) return

      localStorage.setItem('push_notification_prompt_shown', 'true')

      // Berikan jeda 3 detik sebelum menawarkan agar transisi mulus
      setTimeout(() => {
        Swal.fire({
          title: 'Aktifkan Pengingat Absensi? 🔔',
          text: 'Menerima notifikasi langsung di handphone Anda sebelum jam kerja (08:30) agar tidak terlambat absen.',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Aktifkan Sekarang',
          cancelButtonText: 'Lain Kali',
          confirmButtonColor: '#4f46e5',
          cancelButtonColor: '#64748b',
          background: '#fffdfb',
          color: '#3c1105'
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              const permission = await askNotificationPermission()
              if (permission === 'granted') {
                if (!userProfile.vapid_public_key) {
                  console.error('Kunci VAPID tidak tersedia di data profil.')
                  return
                }
                await subscribeUserToPush(authToken, userProfile.vapid_public_key)
                Swal.fire({
                  title: 'Berhasil! 🎉',
                  text: 'Notifikasi push HP aktif. Anda akan menerima pengingat absensi otomatis setiap pagi.',
                  icon: 'success',
                  confirmButtonColor: '#4f46e5',
                  background: '#fffdfb',
                  color: '#3c1105'
                })
              }
            } catch (err: any) {
              console.error('Gagal melakukan pendaftaran push:', err)
            }
          }
        })
      }, 3500)

    } catch (err) {
      console.error('Gagal mengecek status push notification:', err)
    }
  }

  const fetchProfile = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setCompany(response.data.data.company || '')
        setProfile(response.data.data)
        // Tawarkan push notifications secara cerdas
        checkAndOfferPushNotifications(token, response.data.data)
      }
    } catch (err) {
      console.error('Gagal mengambil data profil karyawan:', err)
    }
  }

  useEffect(() => {
    fetchTodayAttendance()
    fetchOfficeSetting()
    fetchHistory()
    fetchProfile()
    fetchSidebarCounts()
  }, [])

  useEffect(() => {
    const interval = setInterval(fetchSidebarCounts, 15000)
    return () => clearInterval(interval)
  }, [token])

  // Determine current step
  const getAttendanceState = () => {
    if (loading) return 'loading' as const

    // Evaluasi hari libur kerja mingguan
    const dayOfWeek = time.getDay() // 0 = Minggu, 6 = Sabtu
    const isSatOff = profile ? !!profile.saturday_off : false
    const isSunOff = profile ? profile.sunday_off !== false : true
    const isOffDay = (dayOfWeek === 6 && isSatOff) || (dayOfWeek === 0 && isSunOff)

    if (!todayAttendance || !todayAttendance.clock_in) {
      if (isOffDay) {
        return 'day_off' as const
      }
      return 'needs_checkin' as const
    }
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
      return { text: 'Datang Lebih Awal', colorClass: 'text-amber-700 bg-amber-50 border-amber-200' }
    } else if (timeVal >= startNormal && timeVal <= endNormal) {
      return { text: 'Normal (Sesuai Jadwal)', colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
    } else {
      return { text: 'Terlambat', colorClass: 'text-rose-700 bg-rose-50 border-rose-200' }
    }
  }

  const getLiveCheckOutStatus = () => {
    const hrs = time.getHours()
    const mins = time.getMinutes()
    const timeVal = hrs * 60 + mins

    const startNormal = 17 * 60 // 17:00
    const endNormal = 18 * 60 // 18:00

    if (timeVal < startNormal) {
      return { text: 'Pulang Cepat', colorClass: 'text-rose-700 bg-rose-50 border-rose-200' }
    } else if (timeVal >= startNormal && timeVal <= endNormal) {
      return { text: 'Normal (Sesuai Jadwal)', colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
    } else {
      return { text: 'Lembur', colorClass: 'text-amber-700 bg-amber-50 border-amber-200' }
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
        background: '#fffdfb',
        color: '#3c1105'
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
      early: 'text-amber-700 bg-amber-50 border-amber-200',
      normal: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      late: 'text-rose-700 bg-rose-50 border-rose-200',
      early_departure: 'text-rose-700 bg-rose-50 border-rose-200',
      overtime: 'text-amber-700 bg-amber-50 border-amber-200'
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${colorMap[status] || 'text-slate-600 bg-slate-50 border-slate-200'}`}>
        {textMap[status] || status}
      </span>
    )
  }

  const getRouteInfo = () => {
    const path = location.pathname
    if (path.includes('absen')) {
      return { title: 'Absen Kantor', subtitle: 'Clock In / Out' }
    }
    if (path.includes('sales')) {
      return { title: 'Kunjungan Lapangan & Sales', subtitle: 'Clock In / Out' }
    }
    if (path.includes('client')) {
      return { title: 'Kunjungan Klien (Client Visit)', subtitle: 'Clock In / Out' }
    }
    if (path.includes('cuti')) {
      return { title: 'Pengajuan Cuti', subtitle: 'Leave Request' }
    }
    if (path.includes('izin')) {
      return { title: 'Pengajuan Izin', subtitle: 'Permit Request' }
    }
    if (path.includes('riwayat')) {
      return { title: 'Riwayat Presensi', subtitle: 'History Logs' }
    }
    if (path.includes('pengaturan')) {
      return { title: 'Pengaturan Akun', subtitle: 'Settings' }
    }
    if (path.includes('biodata')) {
      return { title: 'Atur Biodata', subtitle: 'Biodata Settings' }
    }
    if (path.includes('payroll')) {
      return { title: 'Rincian Slip Gaji', subtitle: 'My Payslips' }
    }
    if (path.includes('reimbursement')) {
      return { title: 'Reimbursement Karyawan', subtitle: 'Klaim Biaya Pengeluaran' }
    }
    if (path.includes('bonus')) {
      return { title: 'Bonus Saya', subtitle: 'My Bonuses' }
    }
    if (path.includes('lembur')) {
      return { title: 'Pengajuan Lembur Kerja', subtitle: 'Overtime Requests' }
    }
    return { title: 'Dashboard Karyawan', subtitle: 'Overview' }
  }

  const routeInfo = getRouteInfo()
  const totalPending = sidebarCounts.operasionalCount + sidebarCounts.unpaidPayrollCount

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row bg-[#f8fafc] text-slate-700 transition-colors duration-300">
      
      {/* Mobile Top Navbar Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="relative p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-red-500 transition-all cursor-pointer"
          >
            <Menu className="w-5 h-5" />
            {totalPending > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[9px] font-black w-4.5 h-4.5 flex items-center justify-center border border-white animate-pulse">
                {totalPending}
              </span>
            )}
          </button>
          <Logo className="w-8 h-8" company={company} />
        </div>

      </header>

      {/* Floating Toggle Button on Left Middle Edge */}
      <button
        onClick={() => setMobileSidebarOpen(true)}
        className={`hidden fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white p-2.5 py-3.5 rounded-r-2xl shadow-lg shadow-red-500/20 border border-l-0 border-orange-200/20 transition-all duration-300 cursor-pointer flex items-center active:scale-95 active:translate-x-1 ${
          mobileSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        title="Buka Menu"
      >
        <ChevronRight className="w-5 h-5 animate-pulse" />
        {totalPending > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full text-[9px] font-black w-4.5 h-4.5 flex items-center justify-center border border-white animate-pulse">
            {totalPending}
          </span>
        )}
      </button>

      {/* Desktop Left Sidebar (Fixed) */}
      <aside className="hidden md:block w-64 bg-white border-r border-slate-200 p-6 flex-shrink-0 shadow-sm transition-colors duration-300">
        <EmployeeSidebar user={user} onLogout={handleLogoutClick} counts={sidebarCounts} company={company} />
      </aside>

      {/* Mobile Sidebar (Slide-over drawer) */}
      <div 
        className={`fixed inset-0 z-50 md:hidden bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          mobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } flex`}
      >
        <div 
          className={`w-64 bg-white border-r border-slate-200 p-6 h-full flex-shrink-0 relative transition-transform duration-300 ease-out ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } transition-colors duration-300`}
        >
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="absolute top-4 right-4 p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-lg transition-all cursor-pointer active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
          <EmployeeSidebar user={user} onLogout={handleLogoutClick} onClose={() => setMobileSidebarOpen(false)} counts={sidebarCounts} company={company} />
        </div>
        <div className="flex-grow h-full" onClick={() => setMobileSidebarOpen(false)}></div>
      </div>

      {/* Main Content Area */}
      <main className="flex-grow p-4 md:p-10 min-h-screen overflow-y-auto min-w-0 bg-[#f8fafc] transition-colors duration-300">
        
        {/* Dynamic header with page title & notifications/profile */}
        <div className="flex flex-row items-center justify-between border-b border-slate-200 pb-6 mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight font-sans capitalize">
              {routeInfo.title}
            </h1>
            <p className="text-xs text-slate-400 font-bold mt-1">
              {formatDate(time)}
            </p>
          </div>
          
          {/* Header Actions - User Profile */}
          <div className="flex items-center gap-4">


            {/* Profile Info */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-800 tracking-tight leading-tight capitalize font-sans">
                  {profile?.name || user.name}
                </p>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5 font-mono">
                  {profile?.division || 'Karyawan'}
                </p>
              </div>
              
              {/* User Avatar Circle */}
              <div className="w-10 h-10 rounded-full border border-slate-200 shadow-sm overflow-hidden bg-slate-100 flex items-center justify-center relative hover:scale-105 active:scale-95 transition-all cursor-pointer">
                {profile?.photo ? (
                  <img 
                    src={getAssetUrl(profile.photo)} 
                    alt={user.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-orange-500 text-white font-black text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Live active indicator dot */}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Nested Routing Views */}
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-red-500"></div>
          </div>
        ) : (
          <Routes>
            <Route 
              path="dashboard" 
              element={
                <EmployeeOverview
                  user={user}
                  token={token}
                  time={time}
                  todayAttendance={todayAttendance}
                  attendanceState={attendanceState}
                  getLiveCheckInStatus={getLiveCheckInStatus}
                  getLiveCheckOutStatus={getLiveCheckOutStatus}
                  formatDate={formatDate}
                  history={history}
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
              path="sales" 
              element={
                <EmployeeSales
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
              path="client" 
              element={
                <EmployeeClient
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
                  token={token}
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
            <Route 
              path="biodata" 
              element={
                <BiodataSetting
                  user={user}
                  token={token}
                />
              } 
            />
            <Route 
              path="cuti" 
              element={
                <EmployeeCuti
                  token={token}
                />
              } 
            />
            <Route 
              path="izin" 
              element={
                <EmployeeIzin
                  token={token}
                />
              } 
            />
            <Route 
              path="payroll" 
              element={
                <EmployeePayroll
                  token={token}
                  user={user}
                  company={company}
                />
              } 
            />
            <Route 
              path="reimbursement" 
              element={
                <EmployeeReimbursement
                  token={token}
                />
              } 
            />
            <Route 
              path="bonus" 
              element={
                <EmployeeBonus
                  token={token}
                />
              } 
            />
            <Route 
              path="lembur" 
              element={
                <EmployeeOvertime
                  token={token}
                />
              } 
            />
            {/* Fallback route */}
            <Route path="" element={<Navigate to="dashboard" replace />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        )}
      </main>
    </div>
  )
}

