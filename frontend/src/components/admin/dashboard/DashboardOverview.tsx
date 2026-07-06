import { useState, useEffect, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Swal from 'sweetalert2'
import { API_BASE_URL } from '../../../utils/api'
const ManualAttendanceModal = lazy(() => import('../absensi/ManualAttendanceModal'))
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  Camera,
  FileText,
  Calendar,
  TrendingUp,
  DollarSign,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Search
} from 'lucide-react'

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
  shift_start_time?: string | null
  shift_end_time?: string | null
  user: {
    id: number
    name: string
    email: string
    photo?: string | null
  }
}

interface OfficeSetting {
  latitude: string
  longitude: string
  radius: number
}

interface Employee {
  id: number
  name: string
  email: string
  password_plain?: string
  photo?: string | null
  division?: string | null
  created_at: string
  updated_at: string
  status?: 'active' | 'pending' | 'pending_delete'
}

interface DashboardOverviewProps {
  loading: boolean
  attendanceLoading: boolean
  employees: Employee[]
  presentTodayCount: number
  presentTodayList: Attendance[]
  todayStr: string
  user: {
    id: number
    name: string
    email: string
    role: 'admin' | 'employee'
    photo?: string | null
  }
  token: string
  time: Date
  officeSetting: OfficeSetting | null
  leaves: any[]
  fetchAttendances: () => void
}

export default function DashboardOverview({
  loading,
  attendanceLoading,
  employees,
  presentTodayCount,
  presentTodayList,
  todayStr,
  user,
  token,
  time,
  officeSetting,
  leaves,
  fetchAttendances
}: DashboardOverviewProps) {
  // Modal State for Manual Input
  const [showManualModal, setShowManualModal] = useState(false)

  // ---------- Additional Local States for Monitoring & Sync ----------
  const navigate = useNavigate()
  const [reimbursements, setReimbursements] = useState<any[]>([])
  const [overtimes, setOvertimes] = useState<any[]>([])
  const [activeAttendanceTab, setActiveAttendanceTab] = useState<'hadir' | 'cuti' | 'belum_hadir'>('hadir')
  const [searchEmployeeQuery, setSearchEmployeeQuery] = useState('')

  useEffect(() => {
    fetchReimbursementsAndOvertimes()
  }, [])

  const fetchReimbursementsAndOvertimes = async () => {
    try {
      const [reimResponse, otResponse] = await Promise.all([
        axios.get('http://localhost:8000/api/admin/reimbursements', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:8000/api/admin/overtimes', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      if (reimResponse.data.status === 'success') {
        setReimbursements(reimResponse.data.data)
      }
      if (otResponse.data.status === 'success') {
        setOvertimes(otResponse.data.data)
      }
    } catch (err) {
      console.error('Gagal mengambil data reimbursement/lembur:', err)
    }
  }


  // Standarize photo URLs
  const getFullPhotoUrl = (path: string | null | undefined) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    if (path.startsWith('/storage/')) return `${API_BASE_URL}${path}`
    if (path.startsWith('storage/')) return `${API_BASE_URL}/${path}`
    return `${API_BASE_URL}/storage/${path}`
  }

  // Dynamic statistics calculations (fully synced!)
  const activeEmployees = employees.filter(e => e.status === 'active')
  const employeesCount = activeEmployees.length

  // presentTodayList and presentTodayCount are passed down as props

  const lateTodayCount = presentTodayList.filter(
    (att) => att.status_in === 'late'
  ).length

  const cutiTodayList = leaves.filter(
    (l) => l.status === 'approved' && todayStr >= l.start_date && todayStr <= l.end_date
  )
  const cutiTodayCount = cutiTodayList.length

  const absentTodayList = activeEmployees.filter(
    (emp) => 
      !presentTodayList.some(att => att.user.id === emp.id) &&
      !cutiTodayList.some(l => l.user_id === emp.id)
  )
  const absentTodayCount = absentTodayList.length

  const presencePercentage = employeesCount > 0 
    ? Math.round((presentTodayCount / employeesCount) * 100)
    : 0

  // Pending items count
  const pendingLeavesCount = leaves.filter(l => l.status === 'pending').length
  const pendingReimbursementsCount = reimbursements.filter(r => r.status === 'pending').length
  const pendingOvertimesCount = overtimes.filter(o => o.status === 'pending').length
  const pendingRegistrationsCount = employees.filter(e => e.status === 'pending' || e.status === 'pending_delete').length

  // Filtered lists for the tabs based on query search
  const filteredPresentList = presentTodayList.filter(att => 
    att.user.name.toLowerCase().includes(searchEmployeeQuery.toLowerCase())
  )

  const filteredCutiList = cutiTodayList.map(l => {
    const emp = employees.find(e => e.id === l.user_id)
    return { ...l, employee: emp }
  }).filter(l => 
    l.employee?.name?.toLowerCase().includes(searchEmployeeQuery.toLowerCase())
  )

  const filteredAbsentList = absentTodayList.filter(emp =>
    emp.name.toLowerCase().includes(searchEmployeeQuery.toLowerCase())
  )

  const getDivisionBadgeStyle = (division: string | null | undefined) => {
    if (!division) return 'bg-slate-50 text-slate-500 border-slate-100'
    const div = division.toLowerCase()
    if (div.includes('it') || div.includes('tekno') || div.includes('dev')) return 'bg-indigo-50 text-indigo-700 border-indigo-100'
    if (div.includes('keuangan') || div.includes('akuntan') || div.includes('finance')) return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    if (div.includes('sdm') || div.includes('hr')) return 'bg-violet-50 text-violet-750 border-violet-100'
    if (div.includes('pemasaran') || div.includes('sales') || div.includes('marketing') || div.includes('pemasar')) return 'bg-blue-50 text-blue-700 border-blue-100'
    if (div.includes('operasional') || div.includes('ops')) return 'bg-amber-50 text-amber-700 border-amber-100'
    if (div.includes('produksi')) return 'bg-rose-50 text-rose-700 border-rose-100'
    if (div.includes('hukum') || div.includes('legal')) return 'bg-slate-100 text-slate-700 border-slate-200'
    return 'bg-slate-50 text-slate-650 border-slate-200'
  }

  // Format date helper
  const getIndonesianDate = (d: Date) => {
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // Get dynamic greeting
  const getGreeting = () => {
    const hrs = time.getHours()
    if (hrs < 12) return 'Selamat Pagi'
    if (hrs < 15) return 'Selamat Siang'
    if (hrs < 18) return 'Selamat Sore'
    return 'Selamat Malam'
  }

  // Format single recent attendance log status badge
  const getBadgeStyle = (status: string | null) => {
    if (!status) return 'bg-slate-100 text-slate-700 border border-slate-200'
    if (status === 'early' || status === 'normal') {
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    }
    if (status === 'late' || status === 'early_departure') {
      return 'bg-rose-50 text-rose-700 border border-rose-200'
    }
    return 'bg-amber-50 text-amber-700 border border-amber-200'
  }

  const getStatusText = (status: string | null) => {
    if (!status) return 'HADIR'
    if (status === 'early') return 'DATANG CEPAT'
    if (status === 'normal') return 'ON TIME'
    if (status === 'late') return 'TERLAMBAT'
    if (status === 'early_departure') return 'PULANG CEPAT'
    return status.toUpperCase()
  }

  const userPhotoUrl = getFullPhotoUrl(user.photo)

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in font-quicksand">
      
      {/* 1. GREETING BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-500 to-orange-600 rounded-2xl md:rounded-[32px] p-5 md:p-8 text-white shadow-lg shadow-red-500/10 select-none">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          
          {/* User Info & Avatar */}
          <div className="flex items-center gap-3.5 md:gap-5">
            {userPhotoUrl ? (
              <img src={userPhotoUrl} alt={user.name} className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-white/30 shadow-md object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/25 flex items-center justify-center text-white font-black text-sm md:text-xl shrink-0 shadow-inner">
                {user.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            
            <div>
              <span className="text-white/95 text-[8px] md:text-[9.5px] font-extrabold uppercase tracking-widest bg-white/15 px-2.5 py-1 rounded-full border border-white/10 select-none font-quicksand">
                Akses Admin Utama HR
              </span>
              <h1 className="text-lg md:text-2xl font-black mt-2 font-quicksand capitalize leading-tight">
                {getGreeting()}, {user.name.split(' ')[0]}!
              </h1>
              <p className="text-[10px] md:text-xs text-orange-50/90 font-semibold mt-1 max-w-[280px] md:max-w-md">
                Kelola dan pantau seluruh aktivitas absensi serta perizinan staf secara realtime.
              </p>
              
              <button 
                onClick={() => navigate('/admin/absen-mandiri')} 
                className="inline-flex items-center gap-1 mt-2.5 px-3 py-1.5 bg-white/25 hover:bg-white/35 active:scale-95 transition-all text-white border border-white/15 rounded-lg text-[9px] md:text-[10px] font-bold tracking-wide backdrop-blur-md select-none cursor-pointer"
              >
                <span>Absen Anda</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
          
          {/* Date Info */}
          <div className="text-left md:text-right flex flex-row md:flex-col md:items-end justify-between items-center shrink-0 select-none bg-white/15 px-4 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl border border-white/10 backdrop-blur-md w-full md:w-auto">
            <span className="text-[9px] md:text-[10px] font-black text-orange-100 uppercase tracking-widest block font-quicksand">
              {time.toLocaleDateString('id-ID', { weekday: 'long' })}
            </span>
            <span className="text-xs md:text-sm font-bold text-white md:mt-0.5 block font-quicksand">
              {getIndonesianDate(time)}
            </span>
          </div>
          
        </div>
      </div>

      {/* 2. STATS KPI GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {/* Total Employees */}
        <div className="bg-white border border-slate-100 rounded-2xl md:rounded-[28px] p-4 md:p-6 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group border-l-4 border-l-blue-500">
          <div className="flex justify-between items-start gap-1">
            <div>
              <p className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-wider font-quicksand">Total Staf</p>
              <h3 className="text-2xl md:text-3xl font-black text-slate-800 mt-1 md:mt-2 font-mono leading-none">
                {loading ? <Loader2 className="w-4 h-4 md:w-6 md:h-6 animate-spin text-slate-400" /> : employeesCount}
              </h3>
            </div>
            <div className="p-2.5 md:p-3 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl border border-blue-100 group-hover:scale-110 transition-transform shrink-0 shadow-xs">
              <Users className="w-4.5 h-4.5 md:w-5.5 md:h-5.5" />
            </div>
          </div>
          <div className="mt-3.5 md:mt-4 text-[9px] md:text-xs text-slate-500 font-semibold flex items-center gap-1 select-none font-quicksand truncate">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500 shrink-0" /> Karyawan terdaftar aktif
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-white border border-slate-100 rounded-2xl md:rounded-[28px] p-4 md:p-6 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start gap-1">
            <div>
              <p className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-wider font-quicksand">Hadir Hari Ini</p>
              <h3 className="text-2xl md:text-3xl font-black text-slate-800 mt-1 md:mt-2 font-mono leading-none flex items-baseline gap-1">
                {attendanceLoading ? <Loader2 className="w-4 h-4 md:w-6 md:h-6 animate-spin text-slate-400" /> : presentTodayCount}
                <span className="text-[10px] md:text-xs text-slate-400 font-bold font-quicksand">({presencePercentage}%)</span>
              </h3>
            </div>
            <div className="p-2.5 md:p-3 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl border border-emerald-100 group-hover:scale-110 transition-transform shrink-0 shadow-xs">
              <CheckCircle2 className="w-4.5 h-4.5 md:w-5.5 md:h-5.5" />
            </div>
          </div>
          <div className="mt-4 md:mt-5.5 w-full h-1 bg-slate-100 rounded-full overflow-hidden select-none">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${presencePercentage}%` }}></div>
          </div>
        </div>

        {/* Late Today */}
        <div className={`border rounded-2xl md:rounded-[28px] p-4 md:p-6 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group border-l-4 ${
          lateTodayCount > 0
            ? 'bg-rose-50/15 border-rose-100 border-l-rose-500'
            : 'bg-white border-slate-100 border-l-slate-400'
        }`}>
          <div className="flex justify-between items-start gap-1">
            <div>
              <p className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-wider font-quicksand">Terlambat</p>
              <h3 className={`text-2xl md:text-3xl font-black mt-1 md:mt-2 font-mono leading-none ${lateTodayCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                {attendanceLoading ? <Loader2 className="w-4 h-4 md:w-6 md:h-6 animate-spin text-slate-400" /> : lateTodayCount}
              </h3>
            </div>
            <div className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl border group-hover:scale-110 transition-transform shrink-0 shadow-xs ${
              lateTodayCount > 0
                ? 'bg-rose-100/60 text-rose-600 border-rose-200'
                : 'bg-slate-50 text-slate-400 border-slate-100'
            }`}>
              <Clock className="w-4.5 h-4.5 md:w-5.5 md:h-5.5" />
            </div>
          </div>
          <div className="mt-3.5 md:mt-4 text-[9px] md:text-xs text-slate-500 font-semibold flex items-center gap-1 select-none font-quicksand truncate">
            {lateTodayCount > 0 ? (
              <>
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span className="text-rose-650 font-bold">Butuh pantauan HR</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Semua tepat waktu</span>
              </>
            )}
          </div>
        </div>

        {/* On Leave / Cuti */}
        <div className="bg-white border border-slate-100 rounded-2xl md:rounded-[28px] p-4 md:p-6 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group border-l-4 border-l-amber-500">
          <div className="flex justify-between items-start gap-1">
            <div>
              <p className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-wider font-quicksand">Izin & Cuti</p>
              <h3 className="text-2xl md:text-3xl font-black text-slate-800 mt-1 md:mt-2 font-mono leading-none">
                {loading ? <Loader2 className="w-4 h-4 md:w-6 md:h-6 animate-spin text-slate-400" /> : cutiTodayCount}
              </h3>
            </div>
            <div className="p-2.5 md:p-3 bg-amber-50 text-amber-600 rounded-xl md:rounded-2xl border border-amber-100 group-hover:scale-110 transition-transform shrink-0 shadow-xs">
              <FileText className="w-4.5 h-4.5 md:w-5.5 md:h-5.5" />
            </div>
          </div>
          <div className="mt-3.5 md:mt-4 text-[9px] md:text-xs text-slate-500 font-semibold flex items-center gap-1 select-none font-quicksand truncate">
            <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Berdasarkan izin disetujui
          </div>
        </div>
      </div>

      {/* 3. PENDING ACTION PANEL */}
      <div className="bg-white border border-slate-100 rounded-2xl md:rounded-[32px] p-4 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
          <ShieldAlert className="w-4 h-4 md:w-5 h-5 text-red-500 animate-pulse shrink-0" />
          <h3 className="text-[10px] md:text-xs font-black text-slate-800 uppercase tracking-wider font-quicksand">Persetujuan Menunggu Tindakan HR</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          
          {/* Leaves */}
          <button
            onClick={() => navigate('/admin/cuti')}
            className={`relative flex items-center justify-between p-3.5 md:p-4.5 rounded-xl md:rounded-2xl border transition-all duration-200 cursor-pointer group select-none active:scale-[0.98] ${
              pendingLeavesCount > 0
                ? 'bg-rose-50/20 border-red-200 hover:border-red-300 hover:bg-rose-50/40 shadow-xs'
                : 'bg-slate-50/40 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
            }`}
          >
            {pendingLeavesCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-650 text-[10px] font-black text-white shadow-md ring-2 ring-white animate-pulse">
                {pendingLeavesCount}
              </span>
            )}
            <div className="flex items-center gap-2.5 md:gap-3 min-w-0 flex-1">
              <div className={`w-8.5 h-8.5 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${pendingLeavesCount > 0 ? 'bg-red-500 text-white shadow-md shadow-red-200' : 'bg-slate-100 text-slate-400'}`}>
                <Calendar className="w-4.5 h-4.5" />
              </div>
              <div className="text-left min-w-0">
                <span className="block text-[8px] md:text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider font-quicksand">Cuti & Izin</span>
                <span className={`text-[11px] md:text-xs font-black truncate block mt-0.5 ${pendingLeavesCount > 0 ? 'text-red-700' : 'text-slate-600'}`}>
                  {pendingLeavesCount > 0 ? `${pendingLeavesCount} Berkas` : 'Selesai'}
                </span>
              </div>
            </div>
            <ArrowRight className="hidden md:block w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
 
          {/* Reimbursement */}
          <button
            onClick={() => navigate('/admin/reimbursement')}
            className={`relative flex items-center justify-between p-3.5 md:p-4.5 rounded-xl md:rounded-2xl border transition-all duration-200 cursor-pointer group select-none active:scale-[0.98] ${
              pendingReimbursementsCount > 0
                ? 'bg-orange-50/20 border-orange-200 hover:border-orange-300 hover:bg-orange-50/40 shadow-xs'
                : 'bg-slate-50/40 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
            }`}
          >
            {pendingReimbursementsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[10px] font-black text-white shadow-md ring-2 ring-white animate-pulse">
                {pendingReimbursementsCount}
              </span>
            )}
            <div className="flex items-center gap-2.5 md:gap-3 min-w-0 flex-1">
              <div className={`w-8.5 h-8.5 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${pendingReimbursementsCount > 0 ? 'bg-orange-500 text-white shadow-md shadow-orange-200' : 'bg-slate-100 text-slate-400'}`}>
                <DollarSign className="w-4.5 h-4.5" />
              </div>
              <div className="text-left min-w-0">
                <span className="block text-[8px] md:text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider font-quicksand">Klaim Biaya</span>
                <span className={`text-[11px] md:text-xs font-black truncate block mt-0.5 ${pendingReimbursementsCount > 0 ? 'text-orange-700' : 'text-slate-600'}`}>
                  {pendingReimbursementsCount > 0 ? `${pendingReimbursementsCount} Berkas` : 'Selesai'}
                </span>
              </div>
            </div>
            <ArrowRight className="hidden md:block w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
 
          {/* Overtimes */}
          <button
            onClick={() => navigate('/admin/lembur')}
            className={`relative flex items-center justify-between p-3.5 md:p-4.5 rounded-xl md:rounded-2xl border transition-all duration-200 cursor-pointer group select-none active:scale-[0.98] ${
              pendingOvertimesCount > 0
                ? 'bg-amber-50/20 border-amber-200 hover:border-amber-300 hover:bg-amber-50/40 shadow-xs'
                : 'bg-slate-50/40 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
            }`}
          >
            {pendingOvertimesCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-white shadow-md ring-2 ring-white animate-pulse">
                {pendingOvertimesCount}
              </span>
            )}
            <div className="flex items-center gap-2.5 md:gap-3 min-w-0 flex-1">
              <div className={`w-8.5 h-8.5 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${pendingOvertimesCount > 0 ? 'bg-amber-500 text-white shadow-md shadow-amber-200' : 'bg-slate-100 text-slate-400'}`}>
                <Clock className="w-4.5 h-4.5" />
              </div>
              <div className="text-left min-w-0">
                <span className="block text-[8px] md:text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider font-quicksand">Klaim Lembur</span>
                <span className={`text-[11px] md:text-xs font-black truncate block mt-0.5 ${pendingOvertimesCount > 0 ? 'text-amber-700' : 'text-slate-655'}`}>
                  {pendingOvertimesCount > 0 ? `${pendingOvertimesCount} Berkas` : 'Selesai'}
                </span>
              </div>
            </div>
            <ArrowRight className="hidden md:block w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
 
          {/* Account Verification */}
          <button
            onClick={() => navigate('/admin/akunKaryawan')}
            className={`relative flex items-center justify-between p-3.5 md:p-4.5 rounded-xl md:rounded-2xl border transition-all duration-200 cursor-pointer group select-none active:scale-[0.98] ${
              pendingRegistrationsCount > 0
                ? 'bg-blue-50/20 border-blue-200 hover:border-blue-305 hover:bg-blue-50/40 shadow-xs'
                : 'bg-slate-50/40 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
            }`}
          >
            {pendingRegistrationsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-650 text-[10px] font-black text-white shadow-md ring-2 ring-white animate-pulse">
                {pendingRegistrationsCount}
              </span>
            )}
            <div className="flex items-center gap-2.5 md:gap-3 min-w-0 flex-1">
              <div className={`w-8.5 h-8.5 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${pendingRegistrationsCount > 0 ? 'bg-blue-500 text-white shadow-md shadow-blue-200' : 'bg-slate-100 text-slate-400'}`}>
                <Users className="w-4.5 h-4.5" />
              </div>
              <div className="text-left min-w-0">
                <span className="block text-[8px] md:text-[9.5px] text-slate-400 font-extrabold uppercase tracking-wider font-quicksand">Daftar Akun</span>
                <span className={`text-[11px] md:text-xs font-black truncate block mt-0.5 ${pendingRegistrationsCount > 0 ? 'text-blue-700' : 'text-slate-600'}`}>
                  {pendingRegistrationsCount > 0 ? `${pendingRegistrationsCount} Akun` : 'Selesai'}
                </span>
              </div>
            </div>
            <ArrowRight className="hidden md:block w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
        </div>
      </div>

      {/* 4. MAIN MONITORING GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-start">
        
        {/* Left Column: Workforce Presence Monitor (Full Width) */}
        <section className="lg:col-span-12 bg-white border border-slate-100 rounded-2xl md:rounded-[32px] p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 min-h-[520px] flex flex-col justify-between">
          <div className="space-y-4 md:space-y-5">
            {/* Header + Search bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm md:text-base font-extrabold text-slate-800">Pusat Pemantauan Kehadiran</h3>
                <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Real-time Employee Status</p>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Absensi Manual Button */}
                <button
                  onClick={() => setShowManualModal(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-red-500 hover:text-red-650 hover:bg-red-50/10 text-slate-600 font-bold rounded-xl text-[10px] md:text-xs transition-all shadow-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98] font-quicksand shrink-0"
                  title="Absensikan Karyawan (Manual)"
                >
                  <Clock className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>Absensi Manual</span>
                </button>

                {/* Simple Search Input */}
                <div className="relative shrink-0 flex-grow sm:flex-grow-0 sm:w-48">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari nama..."
                    value={searchEmployeeQuery}
                    onChange={(e) => setSearchEmployeeQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-red-200 focus:border-red-400 text-slate-800 placeholder-slate-450 rounded-xl py-1.5 pl-9 pr-3 outline-none transition-all text-[10px] md:text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Tab controls */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl overflow-x-auto select-none no-scrollbar">
              {[
                { id: 'hadir', label: 'Hadir', count: presentTodayCount, activeColor: 'bg-white text-emerald-700 border-emerald-100 shadow-xs shadow-emerald-500/5', badgeActive: 'bg-emerald-50 text-emerald-700' },
                { id: 'cuti', label: 'Izin/Cuti', count: cutiTodayCount, activeColor: 'bg-white text-amber-700 border-amber-100 shadow-xs shadow-amber-500/5', badgeActive: 'bg-amber-50 text-amber-700' },
                { id: 'belum_hadir', label: 'Belum Hadir', count: absentTodayCount, activeColor: 'bg-white text-rose-700 border-rose-100 shadow-xs shadow-rose-500/5', badgeActive: 'bg-rose-50 text-rose-700' },
              ].map(tab => {
                const isActive = activeAttendanceTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveAttendanceTab(tab.id as any)}
                    className={`flex-grow flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[10px] md:text-xs font-extrabold cursor-pointer transition-all duration-200 whitespace-nowrap border border-transparent ${
                      isActive
                        ? tab.activeColor
                        : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                    }`}
                  >
                    {tab.label}
                    <span className={`px-2 py-0.5 rounded-full text-[8.5px] md:text-[9.5px] font-bold font-mono ${
                      isActive
                        ? tab.badgeActive
                        : 'bg-slate-200/60 text-slate-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Tab content lists */}
            <div className="space-y-2 md:space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {attendanceLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400 font-bold text-xs">
                  <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                  Memproses data pemantauan...
                </div>
              ) : activeAttendanceTab === 'hadir' ? (
                filteredPresentList.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 font-bold text-xs italic">
                    {searchEmployeeQuery ? 'Nama tidak ditemukan.' : 'Belum ada karyawan yang hadir hari ini.'}
                  </div>
                ) : (
                  filteredPresentList.map((att) => {
                    const photoUrl = getFullPhotoUrl(att.user.photo)
                    const checkinPhoto = getFullPhotoUrl(att.photo_in)
                    const empDivision = employees.find(e => e.id === att.user.id)?.division

                    return (
                      <div 
                        key={att.id} 
                        className={`flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/50 hover:shadow-sm hover:scale-[1.005] transition-all duration-200 animate-fade-in font-quicksand gap-3 border-l-4 ${
                          att.status_in === 'late' ? 'border-l-rose-500' : 'border-l-emerald-500'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
                          {photoUrl ? (
                            <img src={photoUrl} alt="Foto" className="w-8.5 h-8.5 md:w-10 md:h-10 rounded-full border border-slate-100 object-cover shrink-0 shadow-inner" />
                          ) : (
                            <div className="w-8.5 h-8.5 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 border border-orange-200/40 flex items-center justify-center text-white font-extrabold text-[10px] md:text-xs shadow-md shrink-0 select-none">
                              {att.user.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-[11px] md:text-xs font-black text-slate-800 truncate">{att.user.name}</h4>
                              <span className={`inline-block px-1.5 py-0.2 rounded-full text-[7.5px] md:text-[8px] font-extrabold border font-quicksand shrink-0 ${getDivisionBadgeStyle(empDivision)}`}>
                                {empDivision || 'Umum'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                                {att.clock_in ? att.clock_in.substring(0, 5) : '-'} WIB
                              </span>
                              <span className="w-0.5 h-0.5 bg-slate-300 rounded-full"></span>
                              <span className="text-[8px] md:text-[9px] text-slate-400 font-extrabold capitalize truncate">
                                {att.attendance_type === 'kantor' ? 'Kantor' : att.attendance_type === 'client' ? 'Klien' : 'Dinas'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 md:gap-3 shrink-0 select-none">
                          <span className={`px-2 py-0.5 rounded-full text-[8.5px] md:text-[9.5px] font-black font-mono tracking-wider shadow-xs scale-90 md:scale-100 ${getBadgeStyle(att.status_in)}`}>
                            {getStatusText(att.status_in)}
                          </span>
                          {checkinPhoto && (
                            <button
                              onClick={() => {
                                Swal.fire({
                                  title: `Bukti Foto Absen Masuk: ${att.user.name}`,
                                  imageUrl: checkinPhoto,
                                  imageAlt: 'Absen Masuk Foto Wajah',
                                  confirmButtonColor: '#dc2626',
                                  confirmButtonText: 'Tutup',
                                  background: '#ffffff',
                                })
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-full transition-colors cursor-pointer shrink-0"
                              title="Lihat Foto Absen"
                            >
                              <Camera className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )
              ) : activeAttendanceTab === 'cuti' ? (
                filteredCutiList.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 font-bold text-xs italic">
                    {searchEmployeeQuery ? 'Nama tidak ditemukan.' : 'Tidak ada karyawan yang izin/cuti hari ini.'}
                  </div>
                ) : (
                  filteredCutiList.map((l) => {
                    const photoUrl = getFullPhotoUrl(l.employee?.photo)
                    return (
                      <div 
                        key={l.id} 
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/50 hover:shadow-sm hover:scale-[1.005] transition-all duration-200 animate-fade-in font-quicksand gap-3 border-l-4 border-l-amber-500"
                      >
                        <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
                          {photoUrl ? (
                            <img src={photoUrl} alt="Foto" className="w-8.5 h-8.5 md:w-10 md:h-10 rounded-full border border-slate-100 object-cover shrink-0 shadow-inner" />
                          ) : (
                            <div className="w-8.5 h-8.5 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border border-orange-200/40 flex items-center justify-center text-white font-extrabold text-[10px] md:text-xs shadow-md shrink-0 select-none">
                              {l.employee?.name ? l.employee.name.substring(0, 2).toUpperCase() : '?'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-[11px] md:text-xs font-black text-slate-800 truncate">{l.employee?.name || 'Karyawan'}</h4>
                              <span className={`inline-block px-1.5 py-0.2 rounded-full text-[7.5px] md:text-[8px] font-extrabold border font-quicksand shrink-0 ${getDivisionBadgeStyle(l.employee?.division)}`}>
                                {l.employee?.division || 'Umum'}
                              </span>
                            </div>
                            <p className="text-[9px] md:text-[10px] text-slate-400 font-medium truncate mt-0.5">
                              Alasan: <strong className="text-slate-600 font-bold">{l.reason}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right font-quicksand scale-90 md:scale-100">
                          <span className="px-2 py-0.5 rounded-full text-[8.5px] md:text-[9.5px] font-black font-mono tracking-wider bg-amber-50 text-amber-700 border border-amber-100 shadow-xs block w-fit ml-auto">
                            {l.leave_type ? l.leave_type.toUpperCase() : 'CUTI'}
                          </span>
                          <span className="block text-[7.5px] md:text-[8.5px] text-slate-400 font-bold font-mono mt-1 select-none">
                            {l.start_date.substring(5)} s/d {l.end_date.substring(5)}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )
              ) : (
                filteredAbsentList.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 font-bold text-xs italic">
                    {searchEmployeeQuery ? 'Nama tidak ditemukan.' : 'Seluruh staf telah melakukan absensi masuk.'}
                  </div>
                ) : (
                  filteredAbsentList.map((emp) => {
                    const photoUrl = getFullPhotoUrl(emp.photo)
                    const mailSubject = encodeURIComponent("Pemberitahuan Absensi Hari Ini - " + todayStr)
                    const mailBody = encodeURIComponent(`Halo ${emp.name},\n\nKami mendeteksi Anda belum melakukan absensi masuk pada hari ini tanggal ${getIndonesianDate(new Date())} di aplikasi E-Absensi Karyawan.\n\nMohon lakukan absensi masuk segera atau hubungi pihak HR/Admin jika ada kendala atau jika Anda berhalangan hadir.\n\nTerima kasih,\nTim HR / Admin`)
                    return (
                      <div 
                        key={emp.id} 
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/50 hover:shadow-sm hover:scale-[1.005] transition-all duration-200 animate-fade-in font-quicksand gap-3 border-l-4 border-l-slate-400"
                      >
                        <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
                          {photoUrl ? (
                            <img src={photoUrl} alt="Foto" className="w-8.5 h-8.5 md:w-10 md:h-10 rounded-full border border-slate-100 object-cover shrink-0 shadow-inner" />
                          ) : (
                            <div className="w-8.5 h-8.5 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 border border-slate-200/50 flex items-center justify-center text-white font-extrabold text-[10px] md:text-xs shadow-md shrink-0 select-none">
                              {emp.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-[11px] md:text-xs font-black text-slate-800 truncate">{emp.name}</h4>
                              <span className={`inline-block px-1.5 py-0.2 rounded-full text-[7.5px] md:text-[8px] font-extrabold border font-quicksand shrink-0 ${getDivisionBadgeStyle(emp.division)}`}>
                                {emp.division || 'Umum'}
                              </span>
                            </div>
                            <p className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono mt-0.5 select-none">
                              Belum Absen Masuk
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 md:gap-2.5 shrink-0 select-none">
                          <span className="px-2 py-0.5 rounded-full text-[8.5px] md:text-[9.5px] font-black font-mono tracking-wider bg-rose-50 text-rose-700 border border-rose-100 shadow-xs scale-90 md:scale-100">
                            ABSEN
                          </span>
                          <a
                            href={`mailto:${emp.email}?subject=${mailSubject}&body=${mailBody}`}
                            className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 rounded-full transition-all shadow-xs border border-red-150 bg-red-50/30 cursor-pointer shrink-0"
                            title="Kirim Email Pengingat"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )
                  })
                )
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Manual Attendance Modal */}
      {showManualModal && (
        <Suspense fallback={null}>
          <ManualAttendanceModal
            isOpen={showManualModal}
            onClose={() => setShowManualModal(false)}
            token={token}
            employees={employees}
            fetchAttendances={fetchAttendances}
            officeLatitude={officeSetting?.latitude}
            officeLongitude={officeSetting?.longitude}
          />
        </Suspense>
      )}

    </div>
  )
}
