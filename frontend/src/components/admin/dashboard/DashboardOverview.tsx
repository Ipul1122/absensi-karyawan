import { useState, useEffect, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Swal from 'sweetalert2'
import { API_BASE_URL } from '../../../utils/api'
import {
  getAttendanceLocationDetail,
  getAttendanceLocationLabel,
  getAttendanceTypeBadgeClass,
  normalizeAttendanceDate,
  resolveAttendanceTypeKey,
} from '../../../utils/attendanceLocation'
const ManualAttendanceModal = lazy(() => import('../absensi/ManualAttendanceModal'))
import MonitoringMobileCards from './MonitoringMobileCards'
import { 
  Users, 
  FileText, 
  Clock, 
  Loader2, 
  Camera,
  Calendar,
  DollarSign,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Search,
  Plus,
  Activity,
  Filter,
  MapPin,
  Sparkles,
  Laptop,
  Smartphone,
  Upload,
  UserPlus,
  Home,
  Building2,
  Briefcase,
  Handshake,
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
  attendances: Attendance[]
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
  loading: _loading,
  attendanceLoading,
  employees,
  attendances,
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
      !presentTodayList.some(att => att.user?.id === emp.id) &&
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
    att.user && att.user.name.toLowerCase().includes(searchEmployeeQuery.toLowerCase())
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
    if (status === 'early') return 'DATANG AWAL'
    if (status === 'normal') return 'TEPAT WAKTU'
    if (status === 'late') return 'TERLAMBAT'
    if (status === 'early_departure') return 'PULANG CEPAT'
    return status.toUpperCase()
  }

  const getLocationTypeIcon = (type?: string | null) => {
    switch (resolveAttendanceTypeKey(type)) {
      case 'wfh':
        return Home
      case 'client':
        return Handshake
      case 'kunjungan':
        return Briefcase
      case 'kantor':
        return Building2
      default:
        return MapPin
    }
  }

  const presentTypeBreakdown = presentTodayList.reduce(
    (acc, att) => {
      const key = resolveAttendanceTypeKey(att.attendance_type)
      acc[key] = (acc[key] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const userPhotoUrl = getFullPhotoUrl(user.photo)

    const [showFabMenu, setShowFabMenu] = useState(false)
    const [chartFilter, setChartFilter] = useState<'7' | '30' | 'month'>('7')

  // Generate date range & percentages for attendance trend dynamically
  const getChartData = () => {
    const labelDates: string[] = []
    const percentages: number[] = []
    
    // Determine number of days based on selected filter
    let daysToCount = 7
    if (chartFilter === '30') {
      daysToCount = 30
    } else if (chartFilter === 'month') {
      const now = new Date(time)
      daysToCount = now.getDate() // Days elapsed in the current month
    }
    
    for (let i = daysToCount - 1; i >= 0; i--) {
      const d = new Date(time)
      d.setDate(time.getDate() - i)
      
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const dateStr = `${yyyy}-${mm}-${dd}`
      
      // format label (e.g. "6 Agu")
      const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      labelDates.push(label)
      
      // Calculate attendance count on this date
      const presentCount = attendances.filter(
        att => normalizeAttendanceDate(att.date) === dateStr && att.clock_in
      ).length
      
      const pct = employeesCount > 0 
        ? Math.round((presentCount / employeesCount) * 100) 
        : 0
      percentages.push(pct)
    }
    
    return { labelDates, percentages }
  }

  const { labelDates, percentages } = getChartData()

  // Helper coordinate mapper for SVG line chart
  const getX = (index: number) => {
    if (percentages.length <= 1) return 40
    return 40 + (index * 330) / (percentages.length - 1)
  }

  const getY = (pct: number) => {
    // scale from Y=120 (for 0%) to Y=20 (for 100%)
    return 120 - (pct * 1.0)
  }

  let linePath = 'M 40,120'
  let areaPath = 'M 40,120 L 40,120'

  if (percentages.length > 0) {
    linePath = `M ${getX(0)} ${getY(percentages[0])}`
    areaPath = `M ${getX(0)} 120 L ${getX(0)} ${getY(percentages[0])}`
    
    for (let i = 1; i < percentages.length; i++) {
      const x = getX(i)
      const y = getY(percentages[i])
      linePath += ` L ${x} ${y}`
      areaPath += ` L ${x} ${y}`
    }
    
    areaPath += ` L ${getX(percentages.length - 1)} 120 Z`
  }

  // Calculate Doughnut stroke ratios
  const circ = 2 * Math.PI * 35 // 219.9
  const strokePresent = employeesCount > 0 ? (presentTodayCount / employeesCount) * circ : 0
  const strokeLate = employeesCount > 0 ? (lateTodayCount / employeesCount) * circ : 0
  const strokeLeave = employeesCount > 0 ? (cutiTodayCount / employeesCount) * circ : 0
  const strokeAbsent = employeesCount > 0 ? (absentTodayCount / employeesCount) * circ : 0

  // Offsets
  const offsetPresent = 0
  const offsetLate = -strokePresent
  const offsetLeave = -(strokePresent + strokeLate)
  const offsetAbsent = -(strokePresent + strokeLate + strokeLeave)

  return (
    <div className="space-y-8 animate-fade-in font-sans text-slate-800 pb-24 relative">
      
      {/* 1. COMPACT HERO BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#FFF5F5] via-[#FFFBF9] to-[#FFF5F5] border border-red-100/50 rounded-[24px] p-6 shadow-[0_8px_30px_rgba(229,57,53,0.03)] select-none">
        
        {/* Decorative background lights */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-orange-100/30 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Left: User Info & Avatar Greeting */}
          <div className="flex items-center gap-5">
            {/* Avatar with Status Badge */}
            <div className="relative shrink-0 select-none">
              {userPhotoUrl ? (
                <img 
                  src={userPhotoUrl} 
                  alt={user.name} 
                  className="w-16 h-16 rounded-full border-2 border-white shadow-md object-cover shrink-0" 
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#E53935] flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
                  {user.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
              )}
              {/* Green status badge with white inner dot */}
              <span className="absolute bottom-0 right-0 w-5 h-5 bg-[#22C55E] border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              </span>
            </div>
            
            <div className="space-y-1">
              <h1 className="text-xl md:text-2xl font-black text-[#0F172A] capitalize leading-none tracking-tight">
                {getGreeting()}, {user.name.split(' ')[0]}! 👋
              </h1>
              <p className="text-[12px] text-slate-500 font-medium leading-relaxed max-w-sm">
                Kelola dan pantau seluruh aktivitas absensi serta perizinan staf secara realtime dengan mudah.
              </p>
              
              <button 
                onClick={() => navigate('/admin/absen-mandiri')} 
                className="px-5 py-2.5 bg-[#E53935] hover:bg-[#D32F2F] text-white rounded-xl text-xs font-bold flex items-center gap-2 w-fit mt-3.5 transition-all shadow-[0_4px_12px_rgba(229,57,53,0.18)] cursor-pointer active:scale-95"
              >
                <span>Absen Anda</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Middle: Vector Illustration of HR Analytics */}
          <img 
            src="/hr-analytics.png" 
            alt="HR Analytics" 
            className="w-64 h-24 object-contain hidden lg:block shrink-0 select-none" 
          />
          
          {/* Right: White Date Card */}
          <div className="z-10 bg-[#FFFBF9]/80 border border-red-100/40 rounded-[20px] p-5 text-left flex items-center gap-4 w-[240px] shadow-[0_4px_20px_rgba(229,57,53,0.02)] shrink-0 self-center">
            <div className="p-3 bg-red-50 text-[#E53935] rounded-xl shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-none">
                Hari Ini
              </span>
              <span className="text-base font-extrabold text-slate-800 block mt-2 leading-none font-sans">
                {time.toLocaleDateString('id-ID', { weekday: 'long' })},
              </span>
              <span className="text-base font-black text-[#E53935] block mt-1.5 leading-none font-sans">
                {time.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
          
        </div>
      </div>




      {/* 3. DAILY INSIGHTS & CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left: AI Insights Summary */}
        <div className="lg:col-span-3 bg-white border border-slate-100 rounded-[20px] p-5 shadow-[0_6px_20px_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-2.5">
              <div className="p-1.5 bg-red-50 text-[#E53935] rounded-lg">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Insight Hari Ini</h3>
            </div>

            <ul className="space-y-3.5 text-xs text-slate-600 font-medium">
              <li className="flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shrink-0 mt-1"></span>
                <span>{presencePercentage}% karyawan terdaftar sudah check in hari ini.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${lateTodayCount > 0 ? 'bg-rose-500' : 'bg-slate-300'}`}></span>
                <span>{lateTodayCount} staf tercatat terlambat hari ini.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${pendingLeavesCount > 0 ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
                <span>{pendingLeavesCount} berkas cuti & izin menunggu persetujuan.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shrink-0 mt-1"></span>
                <span>Kehadiran stabil dibanding rata-rata hari kemarin.</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 mt-6 border-t border-slate-50 flex items-center gap-2 text-[10px] text-slate-400 font-extrabold uppercase select-none">
            <Activity className="w-3.5 h-3.5 text-[#E53935]" />
            <span>AI monitoring otomatis</span>
          </div>
        </div>

        {/* Middle: Attendance Trend (Line Chart) */}
        <div className="lg:col-span-6 bg-white border border-slate-100 rounded-[20px] p-5 shadow-[0_6px_20px_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Trend Kehadiran Karyawan</h3>
            
            {/* Filter Dropdown */}
            <div className="relative z-10">
              <select 
                value={chartFilter}
                onChange={(e: any) => setChartFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[10px] px-2.5 py-1 rounded-lg outline-none cursor-pointer hover:border-slate-350 transition-colors uppercase tracking-wider"
              >
                <option value="7">7 Hari Terakhir</option>
                <option value="30">30 Hari Terakhir</option>
                <option value="month">Bulan Ini</option>
              </select>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="relative w-full h-[160px] mt-4 flex items-center justify-center select-none">
            <svg viewBox="0 0 400 150" className="w-full h-full">
              {/* Definitions for Gradients */}
              <defs>
                <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E53935" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#E53935" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="line-stroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#EF5350" />
                  <stop offset="50%" stopColor="#E53935" />
                  <stop offset="100%" stopColor="#C62828" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines */}
              <line x1="30" y1="20" x2="380" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="53" x2="380" y2="53" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="86" x2="380" y2="86" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="30" y1="120" x2="380" y2="120" stroke="#f8fafc" strokeWidth="1.5" />

              {/* Gridline Labels */}
              <text x="12" y="24" className="text-[9px] font-bold fill-slate-400 font-mono">100%</text>
              <text x="12" y="57" className="text-[9px] font-bold fill-slate-400 font-mono">50%</text>
              <text x="12" y="90" className="text-[9px] font-bold fill-slate-400 font-mono">0%</text>

                            {/* Area Under Curve */}
              <path 
                d={areaPath}
                fill="url(#area-grad)"
              />

              {/* Curved Trend Line */}
              <path 
                d={linePath}
                fill="none"
                stroke="url(#line-stroke)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Data Circle Markers & Tooltips */}
              <g className="fill-white stroke-[#E53935] stroke-2">
                {percentages.map((pct, i) => (
                  <circle 
                    key={i} 
                    cx={getX(i)} 
                    cy={getY(pct)} 
                    r={percentages.length > 10 ? "2" : "3.5"} 
                  />
                ))}
              </g>

              {/* Values text */}
              {percentages.length <= 10 && (
                <g className="text-[8px] font-black fill-slate-700 font-mono">
                  {percentages.map((pct, i) => (
                    <text 
                      key={i} 
                      x={getX(i) - 8} 
                      y={getY(pct) - 8}
                    >
                      {pct}%
                    </text>
                  ))}
                </g>
              )}

                            {/* X Axis Labels */}
              <g className="text-[8px] font-extrabold fill-slate-400 uppercase font-sans">
                {percentages.map((_, i) => {
                  if (percentages.length > 7 && i % 5 !== 0 && i !== percentages.length - 1) {
                    return null
                  }
                  return (
                    <text 
                      key={i} 
                      x={getX(i) - 12} 
                      y="136"
                    >
                      {labelDates[i]}
                    </text>
                  )
                })}
              </g>
            </svg>
          </div>
        </div>

        {/* Right: Attendance Distribution (Doughnut Chart) */}
        <div className="lg:col-span-3 bg-white border border-slate-100 rounded-[20px] p-5 shadow-[0_6px_20px_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="border-b border-slate-50 pb-2.5">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Distribusi Kehadiran</h3>
          </div>

          <div className="flex flex-col items-center justify-center mt-3 select-none">
            {/* Doughnut SVG Container */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="35" 
                  fill="transparent" 
                  stroke="#f1f5f9" 
                  strokeWidth="10" 
                />
                
                {employeesCount > 0 ? (
                  <>
                    {/* Hadir segment (Green) */}
                    {strokePresent > 0 && (
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="35" 
                        fill="transparent" 
                        stroke="#22C55E" 
                        strokeWidth="10" 
                        strokeDasharray={`${strokePresent} ${circ}`}
                        strokeDashoffset={offsetPresent}
                        strokeLinecap="round"
                      />
                    )}
                    {/* Terlambat segment (Orange) */}
                    {strokeLate > 0 && (
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="35" 
                        fill="transparent" 
                        stroke="#F59E0B" 
                        strokeWidth="10" 
                        strokeDasharray={`${strokeLate} ${circ}`}
                        strokeDashoffset={offsetLate}
                        strokeLinecap="round"
                      />
                    )}
                    {/* Izin/Cuti segment (Blue) */}
                    {strokeLeave > 0 && (
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="35" 
                        fill="transparent" 
                        stroke="#3B82F6" 
                        strokeWidth="10" 
                        strokeDasharray={`${strokeLeave} ${circ}`}
                        strokeDashoffset={offsetLeave}
                        strokeLinecap="round"
                      />
                    )}
                    {/* Belum Hadir segment (Red) */}
                    {strokeAbsent > 0 && (
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="35" 
                        fill="transparent" 
                        stroke="#EF4444" 
                        strokeWidth="10" 
                        strokeDasharray={`${strokeAbsent} ${circ}`}
                        strokeDashoffset={offsetAbsent}
                        strokeLinecap="round"
                      />
                    )}
                  </>
                ) : (
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="35" 
                    fill="transparent" 
                    stroke="#cbd5e1" 
                    strokeWidth="10" 
                  />
                )}
              </svg>
              
              {/* Absolute Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800 leading-none font-mono">
                  {employeesCount}
                </span>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider mt-1">
                  Staf Total
                </span>
              </div>
            </div>

            {/* Customized Doughnut Legends */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-[10px] w-full px-2 font-bold font-sans">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
                <span className="text-slate-550 truncate">Hadir:</span>
                <span className="text-slate-800 font-mono ml-auto">{presentTodayCount}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
                <span className="text-slate-550 truncate">Lambat:</span>
                <span className="text-slate-800 font-mono ml-auto">{lateTodayCount}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
                <span className="text-slate-550 truncate">Cuti:</span>
                <span className="text-slate-800 font-mono ml-auto">{cutiTodayCount}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span>
                <span className="text-slate-550 truncate">Belum:</span>
                <span className="text-slate-800 font-mono ml-auto">{absentTodayCount}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 4. PENDING ACTION PANEL */}
      <div className="bg-white border border-slate-100 rounded-[20px] p-5 shadow-[0_6px_20px_rgba(15,23,42,0.03)] space-y-4">
        <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-50 text-[#E53935] rounded-lg">
              <ShieldAlert className="w-4.5 h-4.5 animate-pulse" />
            </div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Persetujuan Menunggu Tindakan HR</h3>
          </div>
          <button 
            type="button" 
            onClick={() => navigate('/admin/cuti')}
            className="text-[11px] font-extrabold text-[#E53935] hover:text-[#C62828] select-none"
          >
            Lihat Semua
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Item 1: Cuti & Izin */}
          <button
            onClick={() => navigate('/admin/cuti')}
            className={`relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer group active:scale-[0.98] ${
              pendingLeavesCount > 0
                ? 'bg-rose-50/20 border-red-200 hover:border-red-300 hover:bg-rose-50/40 shadow-xs'
                : 'bg-slate-50/40 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                pendingLeavesCount > 0 ? 'bg-[#E53935] text-white shadow-md shadow-red-200' : 'bg-slate-100 text-slate-400'
              }`}>
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-left min-w-0">
                <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider leading-none">Cuti & Izin</span>
                <span className={`text-[13px] font-black truncate block mt-1 leading-none ${
                  pendingLeavesCount > 0 ? 'text-[#E53935]' : 'text-slate-600'
                }`}>
                  {pendingLeavesCount > 0 ? `${pendingLeavesCount} Menunggu` : 'Selesai'}
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

          {/* Item 2: Klaim Biaya */}
          <button
            onClick={() => navigate('/admin/reimbursement')}
            className={`relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer group active:scale-[0.98] ${
              pendingReimbursementsCount > 0
                ? 'bg-orange-50/20 border-orange-200 hover:border-orange-300 hover:bg-orange-50/40 shadow-xs'
                : 'bg-slate-50/40 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                pendingReimbursementsCount > 0 ? 'bg-orange-500 text-white shadow-md shadow-orange-200' : 'bg-slate-100 text-slate-400'
              }`}>
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="text-left min-w-0">
                <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider leading-none">Klaim Biaya</span>
                <span className={`text-[13px] font-black truncate block mt-1 leading-none ${
                  pendingReimbursementsCount > 0 ? 'text-orange-700' : 'text-slate-600'
                }`}>
                  {pendingReimbursementsCount > 0 ? `${pendingReimbursementsCount} Menunggu` : 'Selesai'}
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

          {/* Item 3: Klaim Lembur */}
          <button
            onClick={() => navigate('/admin/lembur')}
            className={`relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer group active:scale-[0.98] ${
              pendingOvertimesCount > 0
                ? 'bg-amber-50/20 border-amber-200 hover:border-amber-300 hover:bg-amber-50/40 shadow-xs'
                : 'bg-slate-50/40 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                pendingOvertimesCount > 0 ? 'bg-amber-500 text-white shadow-md shadow-amber-200' : 'bg-slate-100 text-slate-400'
              }`}>
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-left min-w-0">
                <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider leading-none">Klaim Lembur</span>
                <span className={`text-[13px] font-black truncate block mt-1 leading-none ${
                  pendingOvertimesCount > 0 ? 'text-amber-700' : 'text-slate-600'
                }`}>
                  {pendingOvertimesCount > 0 ? `${pendingOvertimesCount} Menunggu` : 'Selesai'}
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

          {/* Item 4: Daftar Akun */}
          <button
            onClick={() => navigate('/admin/akunKaryawan')}
            className={`relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer group active:scale-[0.98] ${
              pendingRegistrationsCount > 0
                ? 'bg-blue-50/20 border-blue-200 hover:border-blue-300 hover:bg-blue-50/40 shadow-xs'
                : 'bg-slate-50/40 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                pendingRegistrationsCount > 0 ? 'bg-blue-500 text-white shadow-md shadow-blue-200' : 'bg-slate-100 text-slate-400'
              }`}>
                <Users className="w-5 h-5" />
              </div>
              <div className="text-left min-w-0">
                <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider leading-none">Daftar Akun</span>
                <span className={`text-[13px] font-black truncate block mt-1 leading-none ${
                  pendingRegistrationsCount > 0 ? 'text-blue-700' : 'text-slate-600'
                }`}>
                  {pendingRegistrationsCount > 0 ? `${pendingRegistrationsCount} Menunggu` : 'Selesai'}
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
        </div>
      </div>

      {/* 5. MAIN MONITORING TABLE CENTER */}
      <section className="bg-white border border-slate-100 rounded-[20px] p-4 sm:p-6 shadow-[0_6px_20px_rgba(15,23,42,0.03)] space-y-4 sm:space-y-5">
        
        {/* Table Title, Subtitle and Top Controls */}
        <div className="flex flex-col gap-4 border-b border-slate-50 pb-4">
          <div>
            <h2 className="text-[15px] sm:text-base font-extrabold text-slate-800 font-sans tracking-tight">
              <span className="md:hidden">Monitoring Karyawan</span>
              <span className="hidden md:inline">Employee Monitoring Center</span>
            </h2>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 leading-relaxed">
              <span className="md:hidden">Status real-time · Kantor, WFH, Sales & Klien</span>
              <span className="hidden md:inline">Real-Time Employee Status · Kantor, WFH, Sales & Klien</span>
            </p>
          </div>

          {/* Action Row — mobile-first stack */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-xs order-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Cari nama karyawan…"
                value={searchEmployeeQuery}
                onChange={(e) => setSearchEmployeeQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 hover:border-red-200 focus:border-[#E53935] text-slate-800 placeholder-slate-400 rounded-xl py-2.5 pl-10 pr-4 outline-none transition-all text-[13px] sm:text-xs font-semibold"
              />
            </div>

            <div className="flex items-center gap-2 order-2">
              <button
                onClick={() => setShowManualModal(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 bg-white border border-slate-200 hover:border-[#E53935] hover:text-[#E53935] hover:bg-red-50/10 text-slate-600 font-bold rounded-xl text-[12px] sm:text-xs transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Clock className="w-4 h-4 text-[#E53935]" />
                <span className="md:hidden">Absen Manual</span>
                <span className="hidden md:inline">Manual Attendance</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  Swal.fire({
                    title: 'Filter Lanjutan',
                    text: 'Fitur filter berdasarkan divisi dan tanggal sedang diinisialisasi.',
                    icon: 'info',
                    confirmButtonColor: '#E53935',
                    background: '#ffffff'
                  })
                }}
                className="p-2.5 sm:p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-xl shadow-xs cursor-pointer shrink-0"
                title="Filter Lanjutan"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {activeAttendanceTab === 'hadir' && presentTodayList.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar -mx-0.5 px-0.5 snap-x snap-mandatory">
            {([
              ['kantor', 'Kantor', Building2],
              ['wfh', 'WFH', Home],
              ['kunjungan', 'Sales', Briefcase],
              ['client', 'Klien', Handshake],
            ] as const).map(([key, label, Icon]) => {
              const count = presentTypeBreakdown[key] || 0
              if (count === 0) return null
              return (
                <span
                  key={key}
                  className={`snap-start shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border ${getAttendanceTypeBadgeClass(key)}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}: {count}
                </span>
              )
            })}
          </div>
        )}

        {/* Tab Selection Filter */}
        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl overflow-x-auto select-none no-scrollbar snap-x snap-mandatory">
          {[
            { id: 'hadir', label: 'Hadir', labelDesktop: 'Present Today', count: presentTodayCount, activeColor: 'bg-white text-emerald-700 border-emerald-100 shadow-xs shadow-emerald-500/5', badgeActive: 'bg-emerald-50 text-emerald-700' },
            { id: 'cuti', label: 'Cuti', labelDesktop: 'On Leave', count: cutiTodayCount, activeColor: 'bg-white text-amber-700 border-amber-100 shadow-xs shadow-amber-500/5', badgeActive: 'bg-amber-50 text-amber-700' },
            { id: 'belum_hadir', label: 'Belum Hadir', labelDesktop: 'Absent', count: absentTodayCount, activeColor: 'bg-white text-rose-700 border-rose-100 shadow-xs shadow-rose-500/5', badgeActive: 'bg-rose-50 text-rose-700' },
          ].map(tab => {
            const isActive = activeAttendanceTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveAttendanceTab(tab.id as any)}
                className={`snap-start flex-1 min-w-[96px] flex items-center justify-center gap-1.5 py-2.5 sm:py-2 px-3 rounded-lg text-[12px] sm:text-xs font-extrabold cursor-pointer transition-all duration-200 whitespace-nowrap border border-transparent ${
                  isActive ? tab.activeColor : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }`}
              >
                <span className="md:hidden">{tab.label}</span>
                <span className="hidden md:inline">{tab.labelDesktop}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono ${
                  isActive ? tab.badgeActive : 'bg-slate-200/60 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Mobile card list */}
        <div className="md:hidden">
          <MonitoringMobileCards
            loading={attendanceLoading}
            activeTab={activeAttendanceTab}
            presentList={filteredPresentList}
            leaveList={filteredCutiList}
            absentList={filteredAbsentList}
            todayStr={todayStr}
            getFullPhotoUrl={getFullPhotoUrl}
            getDivisionBadgeStyle={getDivisionBadgeStyle}
            getBadgeStyle={getBadgeStyle}
            getStatusText={getStatusText}
            getIndonesianDate={getIndonesianDate}
          />
        </div>

        {/* Desktop data table */}
        <div className="hidden md:block overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Check-In Time</th>
                <th className="py-3 px-4">Jenis Lokasi</th>
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium text-slate-600">
              {attendanceLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-[#E53935]" />
                      Loading monitoring data...
                    </div>
                  </td>
                </tr>
              ) : activeAttendanceTab === 'hadir' ? (
                filteredPresentList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-bold italic">
                      No active records matching search.
                    </td>
                  </tr>
                ) : (
                  filteredPresentList.map((att) => {
                    const photoUrl = getFullPhotoUrl(att.user?.photo)
                    const checkinPhoto = getFullPhotoUrl(att.photo_in)
                    const empDetails = employees.find(e => e.id === att.user?.id)
                    const employeeId = empDetails?.id ? `EMP-${1000 + empDetails.id}` : '-'
                    const division = empDetails?.division || 'General'
                    const LocationIcon = getLocationTypeIcon(att.attendance_type)
                    const locationLabel = getAttendanceLocationLabel(att.attendance_type)
                    const locationDetail = getAttendanceLocationDetail(att)

                    return (
                      <tr key={att.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        {/* Employee Avatar & Name */}
                        <td className="py-3.5 px-4 flex items-center gap-3">
                          {photoUrl ? (
                            <img src={photoUrl} alt="Avatar" className="w-8.5 h-8.5 rounded-full object-cover border border-slate-100 shadow-inner" />
                          ) : (
                            <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-br from-[#E53935] to-[#C62828] flex items-center justify-center text-white font-extrabold text-[10px]">
                              {att.user?.name ? att.user.name.substring(0, 2).toUpperCase() : '?'}
                            </div>
                          )}
                          <div>
                            <h4 className="font-extrabold text-slate-800 leading-tight">{att.user?.name}</h4>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{att.user?.email}</span>
                          </div>
                        </td>

                        {/* NIK / ID */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                          {employeeId}
                        </td>

                        {/* Division */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border uppercase tracking-wider ${getDivisionBadgeStyle(division)}`}>
                            {division}
                          </span>
                        </td>

                        {/* Check-in time */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {att.clock_in ? att.clock_in.substring(0, 5) : '-'} WIB
                        </td>

                        {/* Jenis lokasi absensi */}
                        <td className="py-3.5 px-4 text-slate-700">
                          <div className="space-y-1">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border uppercase tracking-wide ${getAttendanceTypeBadgeClass(att.attendance_type)}`}>
                              <LocationIcon className="w-3.5 h-3.5 shrink-0" />
                              {locationLabel}
                            </span>
                            {locationDetail && (
                              <p className="text-[10px] text-slate-500 leading-snug max-w-[180px] truncate" title={locationDetail}>
                                {locationDetail}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Device */}
                        <td className="py-3.5 px-4 text-slate-500">
                          <div className="flex items-center gap-1.5">
                            {att.notes_in?.toLowerCase().includes('ios') || att.notes_in?.toLowerCase().includes('iphone') ? (
                              <Smartphone className="w-3.5 h-3.5" />
                            ) : att.notes_in?.toLowerCase().includes('android') ? (
                              <Smartphone className="w-3.5 h-3.5" />
                            ) : (
                              <Laptop className="w-3.5 h-3.5" />
                            )}
                            <span className="capitalize">{att.notes_in?.toLowerCase().includes('web') ? 'Web Portal' : 'Mobile App'}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-black font-mono tracking-wider ${getBadgeStyle(att.status_in)}`}>
                            {getStatusText(att.status_in)}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="py-3.5 px-4 text-center">
                          {checkinPhoto ? (
                            <button
                              onClick={() => {
                                Swal.fire({
                                  title: `Absen Masuk: ${att.user?.name}`,
                                  imageUrl: checkinPhoto,
                                  imageAlt: 'Foto Absen Masuk',
                                  confirmButtonColor: '#E53935',
                                  confirmButtonText: 'Tutup',
                                  background: '#ffffff'
                                })
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-red-50 text-slate-550 hover:text-[#E53935] border border-slate-200 hover:border-red-200 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>View Photo</span>
                            </button>
                          ) : (
                            <span className="text-slate-405 italic text-[10px] font-semibold">No Image</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )
              ) : activeAttendanceTab === 'cuti' ? (
                filteredCutiList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-bold italic">
                      No active records matching search.
                    </td>
                  </tr>
                ) : (
                  filteredCutiList.map((l) => {
                    const photoUrl = getFullPhotoUrl(l.employee?.photo)
                    const employeeId = l.employee?.id ? `EMP-${1000 + l.employee.id}` : '-'
                    const division = l.employee?.division || 'General'

                    return (
                      <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        {/* Employee Avatar & Name */}
                        <td className="py-3.5 px-4 flex items-center gap-3">
                          {photoUrl ? (
                            <img src={photoUrl} alt="Avatar" className="w-8.5 h-8.5 rounded-full object-cover border border-slate-100 shadow-inner" />
                          ) : (
                            <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-br from-[#E53935] to-[#C62828] flex items-center justify-center text-white font-extrabold text-[10px]">
                              {l.employee?.name ? l.employee.name.substring(0, 2).toUpperCase() : '?'}
                            </div>
                          )}
                          <div>
                            <h4 className="font-extrabold text-slate-800 leading-tight">{l.employee?.name}</h4>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{l.employee?.email}</span>
                          </div>
                        </td>

                        {/* NIK / ID */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                          {employeeId}
                        </td>

                        {/* Division */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border uppercase tracking-wider ${getDivisionBadgeStyle(division)}`}>
                            {division}
                          </span>
                        </td>

                        {/* Check-in time */}
                        <td className="py-3.5 px-4 text-slate-400 italic font-bold">
                          --:--
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4 text-slate-500 italic">
                          Remote / Cuti
                        </td>

                        {/* Device */}
                        <td className="py-3.5 px-4 text-slate-400">
                          -
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-black font-mono tracking-wider bg-blue-50 text-blue-700 border border-blue-150">
                            {l.leave_type ? l.leave_type.toUpperCase() : 'LEAVE'}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => {
                              Swal.fire({
                                title: `Keterangan Cuti & Izin: ${l.employee?.name}`,
                                html: `<strong>Alasan/Keterangan:</strong><br/><p class="mt-2 text-slate-600">${l.reason}</p>`,
                                confirmButtonColor: '#E53935',
                                confirmButtonText: 'Tutup',
                                background: '#ffffff'
                              })
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-blue-50 text-slate-550 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )
              ) : (
                filteredAbsentList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-bold italic">
                      All employees have completed their check in.
                    </td>
                  </tr>
                ) : (
                  filteredAbsentList.map((emp) => {
                    const photoUrl = getFullPhotoUrl(emp.photo)
                    const employeeId = `EMP-${1000 + emp.id}`
                    const division = emp.division || 'General'
                    
                    const mailSubject = encodeURIComponent("Pemberitahuan Absensi Hari Ini - " + todayStr)
                    const mailBody = encodeURIComponent(`Halo ${emp.name},\n\nKami mendeteksi Anda belum melakukan absensi masuk pada hari ini tanggal ${getIndonesianDate(new Date())} di aplikasi E-Absensi Karyawan.\n\nMohon lakukan absensi masuk segera atau hubungi pihak HR/Admin jika ada kendala atau jika Anda berhalangan hadir.\n\nTerima kasih,\nTim HR / Admin`)

                    return (
                      <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        {/* Employee Avatar & Name */}
                        <td className="py-3.5 px-4 flex items-center gap-3">
                          {photoUrl ? (
                            <img src={photoUrl} alt="Avatar" className="w-8.5 h-8.5 rounded-full object-cover border border-slate-100 shadow-inner" />
                          ) : (
                            <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-br from-[#E53935] to-[#C62828] flex items-center justify-center text-white font-extrabold text-[10px]">
                              {emp.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h4 className="font-extrabold text-slate-800 leading-tight">{emp.name}</h4>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{emp.email}</span>
                          </div>
                        </td>

                        {/* NIK / ID */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                          {employeeId}
                        </td>

                        {/* Division */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border uppercase tracking-wider ${getDivisionBadgeStyle(division)}`}>
                            {division}
                          </span>
                        </td>

                        {/* Check-in time */}
                        <td className="py-3.5 px-4 text-slate-400 italic">
                          -
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4 text-slate-400 italic">
                          -
                        </td>

                        {/* Device */}
                        <td className="py-3.5 px-4 text-slate-400">
                          -
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-black font-mono tracking-wider bg-red-50 text-[#E53935] border border-red-150">
                            ABSENT
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="py-3.5 px-4 text-center">
                          <a
                            href={`mailto:${emp.email}?subject=${mailSubject}&body=${mailBody}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 hover:bg-[#E53935] text-[#E53935] hover:text-white border border-red-150 hover:border-[#E53935] rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Remind Staf</span>
                          </a>
                        </td>
                      </tr>
                    )
                  })
                )
              )}
            </tbody>
          </table>
        </div>

      </section>

      {/* 6. FLOATING QUICK ACTION BUTTON (FAB) */}
      <div className="fixed bottom-8 right-8 z-40 select-none font-quicksand">
        {showFabMenu && (
          <div className="absolute bottom-16 right-0 bg-white border border-slate-100 rounded-2xl p-3 shadow-xl flex flex-col gap-2.5 w-44 animate-fade-in z-50">
            <button 
              onClick={() => {
                setShowFabMenu(false)
                navigate('/admin/akunKaryawan')
              }}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-red-50/50 rounded-xl text-slate-700 hover:text-[#E53935] text-xs font-bold text-left transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-[#E53935]" />
              <span>Tambah Karyawan</span>
            </button>
            <button 
              onClick={() => {
                setShowFabMenu(false)
                navigate('/admin/akunKaryawan')
              }}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-red-50/50 rounded-xl text-slate-700 hover:text-[#E53935] text-xs font-bold text-left transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#E53935]" />
              <span>Import Excel</span>
            </button>
            <button 
              onClick={() => {
                setShowFabMenu(false)
                setShowManualModal(true)
              }}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-red-50/50 rounded-xl text-slate-700 hover:text-[#E53935] text-xs font-bold text-left transition-colors cursor-pointer"
            >
              <Clock className="w-4 h-4 text-[#E53935]" />
              <span>Absen Manual</span>
            </button>
          </div>
        )}
        <button
          onClick={() => setShowFabMenu(!showFabMenu)}
          className={`w-14 h-14 bg-[#E53935] hover:bg-[#C62828] text-white flex items-center justify-center rounded-full shadow-lg shadow-red-500/30 cursor-pointer active:scale-95 transition-all z-50 ${
            showFabMenu ? 'rotate-45 bg-[#C62828]' : ''
          }`}
          title="Aksi Cepat"
        >
          <Plus className="w-7 h-7" strokeWidth={2.5} />
        </button>
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