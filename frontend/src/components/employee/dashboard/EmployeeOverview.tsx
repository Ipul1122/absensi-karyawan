import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { getAssetUrl } from '../../../utils/api'
import RobotMascot from './RobotMascot'
import {
  CalendarDays,
  Banknote,
  CalendarCheck,
  Mail,
  Briefcase,
  Clock,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Calendar,
  Fingerprint
} from 'lucide-react'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'employee'
}

interface Attendance {
  id: number
  date: string
  clock_in: string | null
  clock_out: string | null
  status_in: string | null
  status_out: string | null
  attendance_type?: string | null
  photo_in?: string | null
  latitude_in?: string | null
  longitude_in?: string | null
  latitude_out?: string | null
  longitude_out?: string | null
  photo_out?: string | null
  notes_in?: string | null
  notes_out?: string | null
}

interface ProfileData {
  name: string
  email: string
  photo: string | null
  date_of_birth: string | null
  address: string | null
  employee_number: string | null
  join_date: string | null
  gender: string | null
  division: string | null
  cv: string | null
  company?: string | null
}

interface PayrollRecord {
  id: number
  period_month: string
  basic_salary: number
  allowance_meal: number
  allowance_transport: number
  allowance_fixed: number
  allowance_position: number
  deduction_late: number
  deduction_fixed: number
  deduction_absence: number
  net_salary: number
  status: 'draft' | 'unpaid' | 'paid'
  paid_at: string | null
}

interface EmployeeOverviewProps {
  user: User
  token: string
  time: Date
  todayAttendance: Attendance | null
  attendanceState: 'loading' | 'needs_checkin' | 'needs_checkout' | 'completed'
  getLiveCheckInStatus: () => { text: string; colorClass: string }
  getLiveCheckOutStatus: () => { text: string; colorClass: string }
  formatDate: (date: Date) => string
  history: Attendance[]
}

const announcements = [
  {
    id: 1,
    tag: 'Kebijakan HR',
    title: 'Mulai 1 Juli 2026, semua klaim reimbursement wajib melampirkan foto struk digital asli.',
    icon: <AlertCircle className="w-5 h-5 text-orange-500 dark:text-orange-400" />,
    bgColor: 'bg-orange-50/50 dark:bg-orange-950/20',
    borderColor: 'border-orange-100 dark:border-orange-900/30'
  },
  {
    id: 2,
    tag: 'Hari Libur',
    title: 'Hari Libur Nasional: Libur Tahun Baru Hijriah jatuh pada hari Sabtu, 27 Juni 2026.',
    icon: <Calendar className="w-5 h-5 text-blue-500 dark:text-blue-400" />,
    bgColor: 'bg-blue-50/50 dark:bg-blue-950/20',
    borderColor: 'border-blue-100 dark:border-blue-900/30'
  },
  {
    id: 3,
    tag: 'Tips Produktivitas',
    title: 'Lakukan peregangan fisik selama 5 menit setiap 2 jam bekerja untuk menjaga fokus Anda.',
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />,
    bgColor: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    borderColor: 'border-emerald-100 dark:border-emerald-900/30'
  }
]

export default function EmployeeOverview({
  user,
  token,
  time,
  todayAttendance,
  attendanceState,
  formatDate,
  history
}: EmployeeOverviewProps) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [activeMobileTab, setActiveMobileTab] = useState<'pintasan' | 'presensi' | 'profil'>('pintasan')
  const [currentSlide, setCurrentSlide] = useState(0)

  // State for announcements including dynamic upcoming holidays
  const [activeAnnouncements, setActiveAnnouncements] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('employee_announcements')
      if (cached) {
        const parsed = JSON.parse(cached)
        return parsed.map((item: any) => {
          if (item.tag === 'Hari Libur') {
            return {
              ...item,
              icon: <Calendar className="w-5 h-5 text-blue-500" />
            }
          }
          if (item.tag === 'Kebijakan HR') {
            return {
              ...item,
              icon: <AlertCircle className="w-5 h-5 text-orange-500" />
            }
          }
          return {
            ...item,
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          }
        })
      }
    } catch (e) {
      console.error('Gagal memuat cache pengumuman:', e)
    }
    return announcements
  })

  // Fetch upcoming holidays from backend to update announcement carousel dynamically
  useEffect(() => {
    const fetchUpcomingHolidays = async () => {
      const headers = { Authorization: `Bearer ${token}` }
      try {
        const res = await axios.get('http://localhost:8000/api/holidays/upcoming', { headers })
        if (res.data.status === 'success' && res.data.data.length > 0) {
          const nextHoliday = res.data.data[0]
          const holidayDate = new Date(nextHoliday.holiday_date)
          const formattedHolidayDate = holidayDate.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })

          const dynamicHoliday = {
            id: 'holiday-' + nextHoliday.id,
            tag: 'Hari Libur',
            title: `Hari Libur Nasional: ${nextHoliday.name} jatuh pada hari ${formattedHolidayDate}.`,
            bgColor: 'bg-blue-50/50',
            borderColor: 'border-blue-100'
          }

          const updatedList = [
            announcements[0],
            dynamicHoliday,
            announcements[2]
          ]

          // Map icons back
          const listWithIcons = updatedList.map(item => ({
            ...item,
            icon: item.tag === 'Hari Libur'
              ? <Calendar className="w-5 h-5 text-blue-500" />
              : item.tag === 'Kebijakan HR'
              ? <AlertCircle className="w-5 h-5 text-orange-500" />
              : <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          }))

          setActiveAnnouncements(listWithIcons)

          // Save to cache (without React node icon)
          const serialized = updatedList.map(item => ({
            id: item.id,
            tag: item.tag,
            title: item.title,
            bgColor: item.bgColor,
            borderColor: item.borderColor
          }))
          localStorage.setItem('employee_announcements', JSON.stringify(serialized))
        }
      } catch (err) {
        console.error('Gagal mengambil data hari libur nasional terintegrasi:', err)
      }
    }

    fetchUpcomingHolidays()
  }, [token])

  // Fetch employee stats and profile
  useEffect(() => {
    const fetchAllData = async () => {
      setStatsLoading(true)
      const headers = { Authorization: `Bearer ${token}` }
      try {
        const [profileRes, payrollsRes] = await Promise.allSettled([
          axios.get('http://localhost:8000/api/user/profile', { headers }),
          axios.get('http://localhost:8000/api/payroll/my-slips', { headers })
        ])

        if (profileRes.status === 'fulfilled' && profileRes.value.data.status === 'success') {
          setProfile(profileRes.value.data.data)
        }
        if (payrollsRes.status === 'fulfilled' && payrollsRes.value.data.status === 'success') {
          setPayrolls(payrollsRes.value.data.data)
        }
      } catch (err) {
        console.error('Gagal mengambil data ringkasan dashboard:', err)
      } finally {
        setStatsLoading(false)
      }
    }

    fetchAllData()
  }, [token])

  // Announcement auto-rotating timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % activeAnnouncements.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [activeAnnouncements.length])

  const getGreeting = () => {
    const hrs = time.getHours()
    if (hrs < 12) return 'Selamat Pagi'
    if (hrs < 15) return 'Selamat Siang'
    if (hrs < 18) return 'Selamat Sore'
    return 'Selamat Malam'
  }

  const greeting = getGreeting()

  // --- Calculations for Synced Data ---
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const monthlyHistory = history.filter(att => {
    const d = new Date(att.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  const workDays = monthlyHistory.filter(a => a.clock_in).length
  const lateDays = monthlyHistory.filter(a => a.status_in === 'late').length

  const sortedPayrolls = [...payrolls].sort((a, b) => b.period_month.localeCompare(a.period_month))
  const latestPayroll = sortedPayrolls[0] || null

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number)
  }

  // --- SVG Sparkline Calculations ---
  const parseClockIn = (timeStr: string | null | undefined): number => {
    if (!timeStr) return 510 // default 08:30 (510 mins)
    const parts = timeStr.split(':')
    if (parts.length < 2) return 510
    const hours = parseInt(parts[0], 10)
    const minutes = parseInt(parts[1], 10)
    return hours * 60 + minutes
  }

  const validHistory = [...history]
    .filter(h => h.clock_in)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7)

  let minutesList = validHistory.map(h => parseClockIn(h.clock_in))
  if (minutesList.length < 7) {
    const simulatedDefault = [495, 505, 488, 512, 490, 500, 492] // simulated 7 days
    minutesList = [...simulatedDefault.slice(0, 7 - minutesList.length), ...minutesList]
  }

  const minM = Math.min(...minutesList, 480) // baseline at least 08:00
  const maxM = Math.max(...minutesList, 540) // baseline at least 09:00
  const range = maxM - minM === 0 ? 1 : maxM - minM

  const sparkWidth = 70
  const sparkHeight = 24
  const sparkPoints = minutesList.map((m, idx) => {
    const x = (idx / 6) * (sparkWidth - 6) + 3
    const y = 3 + ((m - minM) / range) * (sparkHeight - 6)
    return { x, y }
  })

  const linePath = sparkPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L ${sparkPoints[sparkPoints.length - 1].x.toFixed(1)} ${sparkHeight} L ${sparkPoints[0].x.toFixed(1)} ${sparkHeight} Z`

  return (
    <div className="w-full max-w-screen-xl mx-auto font-quicksand space-y-6 md:space-y-8">
      
      {/* ==============================
          WELCOME BANNER & CLOCK WIDGET
      ============================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Welcome Banner & Announcement Carousel */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Welcome Banner Card */}
          <section 
            className="text-white rounded-[2rem] p-6 md:p-8 shadow-xl shadow-orange-950/5 relative overflow-hidden flex flex-col justify-between min-h-[240px] group transition-all duration-500 border border-white/10"
            style={{ background: 'linear-gradient(135deg, #e31b00 0%, #ff5200 100%)' }}
          >
            {/* Glassmorphic fluid blobs */}
            <div className="absolute -right-20 -top-20 w-72 h-72 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
            
            <div className="z-10 space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/10 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest text-white border border-white/20">
                {greeting} 👋
              </span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight font-sans text-white leading-tight mt-2">
                Halo, {profile?.name || user.name}!
              </h2>
              <p className="text-xs md:text-sm text-white/90 font-medium max-w-md">
                {attendanceState === 'needs_checkin' 
                  ? 'Semangat bekerja hari ini. Jangan lupa absen masuk ya!' 
                  : attendanceState === 'needs_checkout'
                  ? 'Kerja bagus hari ini! Jangan lupa absen pulang nanti ya.'
                  : 'Luar biasa! Anda telah menyelesaikan presensi hari ini. Selamat beristirahat!'}
              </p>
            </div>

            <div className="z-10 flex flex-wrap items-center gap-3 mt-6">
              <button
                onClick={() => navigate('/employee/absen')}
                className="bg-white text-orange-600 hover:bg-orange-50 font-black text-xs px-6 py-3.5 rounded-2xl flex items-center gap-2 hover:-translate-y-0.5 active:scale-95 transition-all shadow-md shadow-red-950/10 cursor-pointer"
              >
                <Fingerprint className="w-4 h-4" />
                {attendanceState === 'needs_checkout' ? 'Absen Pulang' : 'Absen Sekarang'}
              </button>
              <button
                onClick={() => navigate('/employee/riwayat')}
                className="bg-white/15 backdrop-blur-md text-white hover:bg-white/25 border border-white/20 font-bold text-xs px-6 py-3.5 rounded-2xl flex items-center gap-2 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                Lihat Jadwal
              </button>
            </div>
          </section>

          {/* Announcement Carousel Card */}
          <section className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-md transition-all duration-300 relative overflow-hidden">
            <h3 className="text-xs font-black text-slate-800 font-sans tracking-tight mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              Papan Pengumuman
            </h3>
            
            <div className="relative min-h-[72px] flex items-center">
              {activeAnnouncements.map((slide, idx) => (
                <div
                  key={slide.id}
                  className={`transition-all duration-500 absolute inset-0 flex items-center gap-4 ${
                    idx === currentSlide 
                      ? 'opacity-100 translate-x-0 pointer-events-auto' 
                      : 'opacity-0 translate-x-8 pointer-events-none'
                  }`}
                >
                  <div className={`p-3 rounded-2xl border ${slide.bgColor} ${slide.borderColor} shrink-0`}>
                    {slide.icon}
                  </div>
                  <div className="flex-1 min-w-0 pr-8">
                    <span className="inline-block text-[9px] font-black uppercase tracking-wider text-slate-400">
                      {slide.tag}
                    </span>
                    <p className="text-xs font-black text-slate-700 leading-relaxed mt-0.5">
                      {slide.title}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Dots Navigation */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10">
                {activeAnnouncements.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === currentSlide ? 'bg-orange-500 h-3.5' : 'bg-slate-200'
                    }`}
                    title={`Buka pengumuman ke-${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </section>

        </div>

        {/* Clock Widget Card */}
        <section className="lg:col-span-4 bg-white border border-slate-200 rounded-[2rem] p-6 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:shadow-md transition-all duration-300 min-h-[320px] lg:min-h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-rose-500/5 opacity-50 pointer-events-none"></div>
          
          <div className="flex justify-between items-start z-10 w-full">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Waktu Sekarang</p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-800 font-mono tracking-wider mt-1 relative z-10">
                {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </h2>
            </div>
            <div className="p-3 bg-slate-50 text-orange-600 rounded-2xl border border-slate-200">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
          </div>

          {/* Robot Waving Mascot */}
          <div className="flex justify-center items-center py-2 z-10 my-auto">
            <RobotMascot state={attendanceState} />
          </div>

          <div className="z-10 w-full mt-2 lg:mt-0">
            <p className="text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-fit">
              {formatDate(time)}
            </p>
            
            {/* Divider */}
            <div className="w-full h-px bg-slate-200 my-4"></div>
            
            {/* Shift & Status Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shift</p>
                <p className="text-sm font-black text-slate-700 font-mono mt-0.5">08:30 — 17:30</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Aktif
                </span>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* ==============================
          4 STAT CARDS ROW
      ============================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Card 1: Total Kehadiran */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[130px] group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50/50 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between mb-4 z-10">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-slate-200 rounded-full px-2 py-0.5 font-mono">
              +2
            </span>
          </div>
          <div className="z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Kehadiran</p>
            <p className="text-xl md:text-2xl font-black text-slate-800 font-sans mt-0.5">
              {workDays} <span className="text-xs text-slate-400 font-bold">Hari</span>
            </p>
          </div>
        </div>

        {/* Card 2: Total Ketidakhadiran */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[130px] group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-50/50 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between mb-4 z-10">
            <div className="p-2.5 bg-orange-50 text-orange-600 border border-orange-100 rounded-2xl group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Ketidakhadiran</p>
            <p className="text-xl md:text-2xl font-black text-slate-800 font-sans mt-0.5">
              {lateDays} <span className="text-xs text-slate-400 font-bold">Hari</span>
            </p>
          </div>
        </div>

        {/* Card 3: Saldo Absen */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[130px] group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50/50 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between mb-4 z-10">
            <div className="p-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
              <TrendingUp className="w-5 h-5" />
            </div>
            {/* SVG Sparkline Graph */}
            <div className="flex items-center" title="Tren Waktu Datang (7 Hari Kerja Terakhir)">
              <svg className="w-18 h-6 overflow-visible" viewBox={`0 0 ${sparkWidth} ${sparkHeight}`}>
                <defs>
                  <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="sparkline-stroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#60a5fa" />
                  </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#sparkline-grad)" />
                <path d={linePath} fill="none" stroke="url(#sparkline-stroke)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={sparkPoints[sparkPoints.length - 1].x} cy={sparkPoints[sparkPoints.length - 1].y} r="2" fill="#3b82f6" stroke="#ffffff" strokeWidth="0.75" />
              </svg>
            </div>
          </div>
          <div className="z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Saldo Absen</p>
            <p className="text-xl md:text-2xl font-black text-slate-800 font-sans mt-0.5">
              Rp 0
            </p>
          </div>
        </div>

        {/* Card 4: Gaji Terakhir */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[130px] group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50/50 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between mb-4 z-10">
            <div className="p-2.5 bg-purple-50 text-purple-600 border border-purple-100 rounded-2xl group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Gaji Terakhir</p>
            {statsLoading ? (
              <div className="h-6 w-24 bg-slate-100 animate-pulse rounded mt-1.5"></div>
            ) : (
              <p className="text-lg md:text-xl font-black text-slate-800 font-sans mt-0.5 tracking-tight truncate" title={latestPayroll ? formatRupiah(latestPayroll.net_salary) : 'Rp 0'}>
                {latestPayroll ? formatRupiah(latestPayroll.net_salary) : 'Rp 0'}
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex p-1 bg-slate-100 border border-slate-200 rounded-2xl gap-1">
        <button
          onClick={() => setActiveMobileTab('pintasan')}
          className={`flex-1 py-2.5 text-center rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeMobileTab === 'pintasan'
              ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-200/50'
          }`}
        >
          Pintasan
        </button>
        <button
          onClick={() => setActiveMobileTab('presensi')}
          className={`flex-1 py-2.5 text-center rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeMobileTab === 'presensi'
              ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-200/50'
          }`}
        >
          Presensi
        </button>
        <button
          onClick={() => setActiveMobileTab('profil')}
          className={`flex-1 py-2.5 text-center rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeMobileTab === 'profil'
              ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-200/50'
          }`}
        >
          Profil
        </button>
      </div>

      {/* ==============================
          BOTTOM 3-COLUMN PANELS
      ============================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Panel 1: Menu Cepat */}
        <section className={`lg:col-span-4 bg-white border border-slate-200 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-md transition-all duration-300 ${activeMobileTab === 'pintasan' ? 'block' : 'hidden lg:block'}`}>
          <h3 className="text-base font-black text-slate-800 font-sans tracking-tight mb-6">
            Menu Cepat
          </h3>
          <div className="grid grid-cols-2 gap-4">
            
            {/* Quick Button 1: Absen Masuk */}
            <button
              onClick={() => navigate('/employee/absen')}
              className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-200 bg-slate-50/30 hover:bg-slate-50 hover:shadow-sm hover:-translate-y-0.5 active:scale-95 transition-all duration-300 aspect-square group cursor-pointer"
            >
              <div className="p-3 bg-white text-orange-600 rounded-xl shadow-sm border border-slate-200 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-orange-700 mt-3 font-sans">Absen Masuk</span>
            </button>

            {/* Quick Button 2: Pengajuan Izin */}
            <button
              onClick={() => navigate('/employee/cuti')}
              className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-200 bg-slate-50/30 hover:bg-slate-50 hover:shadow-sm hover:-translate-y-0.5 active:scale-95 transition-all duration-300 aspect-square group cursor-pointer"
            >
              <div className="p-3 bg-white text-blue-600 rounded-xl shadow-sm border border-slate-200 group-hover:scale-110 transition-transform duration-300">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-blue-750 mt-3 font-sans">Pengajuan Izin</span>
            </button>

            {/* Quick Button 3: Slip Gaji */}
            <button
              onClick={() => navigate('/employee/payroll')}
              className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-200 bg-slate-50/30 hover:bg-slate-50 hover:shadow-sm hover:-translate-y-0.5 active:scale-95 transition-all duration-300 aspect-square group cursor-pointer"
            >
              <div className="p-3 bg-white text-emerald-600 rounded-xl shadow-sm border border-slate-200 group-hover:scale-110 transition-transform duration-300">
                <Banknote className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-emerald-700 mt-3 font-sans">Slip Gaji</span>
            </button>

            {/* Quick Button 4: Lihat Jadwal */}
            <button
              onClick={() => navigate('/employee/riwayat')}
              className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-200 bg-slate-50/30 hover:bg-slate-50 hover:shadow-sm hover:-translate-y-0.5 active:scale-95 transition-all duration-300 aspect-square group cursor-pointer"
            >
              <div className="p-3 bg-white text-purple-600 rounded-xl shadow-sm border border-slate-200 group-hover:scale-110 transition-transform duration-300">
                <CalendarDays className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-purple-700 mt-3 font-sans">Lihat Jadwal</span>
            </button>

          </div>
        </section>

        {/* Panel 2: Presensi Hari Ini */}
        <section className={`lg:col-span-4 bg-white border border-slate-200 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-md transition-all duration-300 ${activeMobileTab === 'presensi' ? 'flex flex-col justify-between' : 'hidden lg:flex lg:flex-col lg:justify-between'}`}>
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-black text-slate-800 font-sans tracking-tight">
                Presensi Hari Ini
              </h3>
              <button
                onClick={() => navigate('/employee/riwayat')}
                className="text-xs font-black text-orange-600 hover:text-orange-700 transition-colors flex items-center cursor-pointer"
              >
                Detail <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Vertical Timeline List */}
            <div className="relative pl-6 space-y-5">
              {/* Timeline Line */}
              <div className="absolute left-[7px] top-1.5 bottom-1.5 w-0.5 bg-slate-200"></div>

              {/* Step 1: Absen Masuk */}
              <div className="relative flex items-center justify-between">
                <div className={`absolute -left-[23px] w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                  todayAttendance?.clock_in ? 'bg-emerald-500' : 'bg-slate-300'
                }`}></div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                    {todayAttendance?.clock_in ? todayAttendance.clock_in.substring(0, 5) : '08:30'}
                  </span>
                  <span className="text-xs font-black text-slate-700 font-sans">Absen Masuk</span>
                </div>
                <div>
                  {todayAttendance?.clock_in ? (
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border ${
                      todayAttendance.status_in === 'normal' || todayAttendance.status_in === 'early' 
                        ? 'text-emerald-700 bg-emerald-50/70 border-emerald-200' 
                        : 'text-rose-700 bg-rose-50/70 border-rose-200'
                    }`}>
                      {todayAttendance.status_in === 'normal' || todayAttendance.status_in === 'early' ? 'Tepat Waktu' : 'Terlambat'}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black border text-orange-700 bg-orange-50/70 border-orange-200">
                      Menunggu
                    </span>
                  )}
                </div>
              </div>

              {/* Step 2: Istirahat */}
              <div className="relative flex items-center justify-between">
                <div className={`absolute -left-[23px] w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                  todayAttendance?.clock_in && time.getHours() >= 12 ? 'bg-blue-500' : 'bg-slate-300'
                }`}></div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 font-mono">12:01</span>
                  <span className="text-xs font-black text-slate-700 font-sans">Istirahat</span>
                </div>
                <div>
                  {todayAttendance?.clock_in && time.getHours() >= 12 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black border text-blue-700 bg-blue-50/70 border-blue-200">
                      Selesai
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black border text-slate-500 bg-slate-50 border-slate-200">
                      Menunggu
                    </span>
                  )}
                </div>
              </div>

              {/* Step 3: Kembali Kerja */}
              <div className="relative flex items-center justify-between">
                <div className={`absolute -left-[23px] w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                  todayAttendance?.clock_in && time.getHours() >= 13 ? 'bg-emerald-500' : 'bg-slate-300'
                }`}></div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 font-mono">13:05</span>
                  <span className="text-xs font-black text-slate-700 font-sans">Kembali Kerja</span>
                </div>
                <div>
                  {todayAttendance?.clock_in && time.getHours() >= 13 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black border text-emerald-700 bg-emerald-50/70 border-emerald-200">
                      Tepat Waktu
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black border text-slate-500 bg-slate-50 border-slate-200">
                      Menunggu
                    </span>
                  )}
                </div>
              </div>

              {/* Step 4: Absen Pulang */}
              <div className="relative flex items-center justify-between">
                <div className={`absolute -left-[23px] w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                  todayAttendance?.clock_out ? 'bg-emerald-500' : todayAttendance?.clock_in ? 'bg-orange-400 animate-pulse' : 'bg-slate-300'
                }`}></div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                    {todayAttendance?.clock_out ? todayAttendance.clock_out.substring(0, 5) : '17:30'}
                  </span>
                  <span className="text-xs font-black text-slate-700 font-sans">Absen Pulang</span>
                </div>
                <div>
                  {todayAttendance?.clock_out ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black border text-slate-700 bg-slate-50 border-slate-200">
                      Selesai
                    </span>
                  ) : todayAttendance?.clock_in ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black border text-orange-700 bg-orange-50/70 border-orange-200 animate-pulse">
                      Menunggu
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black border text-slate-400 bg-slate-50 border-slate-150">
                      Belum Mulai
                    </span>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Conditional Notice Message Box */}
          <div className={`mt-6 p-4 rounded-2xl flex items-center gap-3 border ${
            attendanceState === 'needs_checkin'
              ? 'bg-amber-50/50 border border-amber-200 text-amber-800'
              : attendanceState === 'needs_checkout'
              ? 'bg-orange-50/50 border border-orange-200 text-orange-800'
              : 'bg-emerald-50/50 border border-emerald-200 text-emerald-800'
          }`}>
            <Clock className="w-5 h-5 shrink-0 animate-pulse" />
            <p className="text-xs font-bold font-sans">
              {attendanceState === 'needs_checkin'
                ? 'Jangan lupa melakukan absen masuk hari ini!'
                : attendanceState === 'needs_checkout'
                ? 'Jangan lupa absen pulang pukul 17:30'
                : 'Presensi hari ini telah lengkap. Terima kasih!'}
            </p>
          </div>
        </section>

        {/* Panel 3: Profil Saya */}
        <section className={`lg:col-span-4 bg-white border border-slate-200 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-md transition-all duration-300 ${activeMobileTab === 'profil' ? 'flex flex-col justify-between min-h-[360px]' : 'hidden lg:flex lg:flex-col lg:justify-between lg:min-h-[360px]'}`}>
          <div>
            <h3 className="text-base font-black text-slate-800 font-sans tracking-tight mb-6">
              Profil Saya
            </h3>
            
            <div className="flex flex-col items-center">
              {/* Profile Image Square */}
              <div className="w-20 h-20 rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center relative hover:scale-105 active:scale-95 transition-transform duration-300">
                {profile?.photo ? (
                  <img 
                    src={getAssetUrl(profile.photo)} 
                    alt={user.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-3xl font-black text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <h4 className="text-lg font-black text-slate-800 tracking-tight mt-4 capitalize">
                {profile?.name || user.name}
              </h4>
              <span className="inline-flex text-[10px] font-extrabold text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-3 py-1 mt-1 font-mono">
                {profile?.company || 'Karyawan Aktif'}
              </span>
            </div>

            {/* List details */}
            <div className="w-full space-y-3 border-t border-slate-200 mt-6 pt-5">
              <div className="flex items-center gap-3 text-slate-600">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-bold truncate" title={profile?.email || user.email}>
                  {profile?.email || user.email}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-bold">
                  {profile?.division || 'Staf Produksi'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-bold">
                  {profile?.date_of_birth 
                    ? new Date(profile.date_of_birth).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Senin, 19 Juni 1944'}
                </span>
              </div>
            </div>
          </div>

          {/* Kehadiran Progress Bar */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider font-mono">Total Absen Bulan Ini</span>
              <span className="text-[11px] font-black text-slate-800 font-mono">{workDays}/22 Hari</span>
            </div>
            
            {/* Progress track */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500" 
                style={{ width: `${workDays > 0 ? Math.min(100, (workDays / 22) * 100) : 0}%` }}
              ></div>
            </div>

            <p className="text-[10px] text-slate-400 font-bold mt-1.5 text-right font-mono">
              {workDays > 0 ? Math.round((workDays / 22) * 100) : 0}% kehadiran
            </p>
          </div>
        </section>

      </div>
    </div>
  )
}
