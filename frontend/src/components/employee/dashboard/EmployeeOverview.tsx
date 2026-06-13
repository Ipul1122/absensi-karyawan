import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  LogOut,
  LogIn,
  CalendarDays,
  ReceiptText,
  Clock3,
  Banknote,
  CalendarCheck,
  Mail,
  Building2,
  Briefcase,
  Clock,
  TrendingUp,
  Gift,
  ChevronRight
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
}

interface LeaveRequest {
  id: number
  category: string
  custom_category: string | null
  start_date: string
  end_date: string
  reason: string
  status: 'pending' | 'pending_director' | 'approved' | 'rejected'
  created_at: string
}

interface Reimbursement {
  id: number
  title: string
  category: string
  amount: number
  expense_date: string
  status: 'pending' | 'pending_director' | 'approved' | 'rejected'
  created_at: string
}

interface Overtime {
  id: number
  date: string
  duration: number
  status: 'pending' | 'pending_director' | 'approved' | 'rejected'
}

interface Bonus {
  id: number
  bonus_amount: number
  bonus_date: string
  status: string
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

export default function EmployeeOverview({
  user,
  token,
  time,
  todayAttendance,
  attendanceState,
  getLiveCheckInStatus,
  getLiveCheckOutStatus,
  formatDate,
  history
}: EmployeeOverviewProps) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  
  // States for synced data
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([])
  const [overtimes, setOvertimes] = useState<Overtime[]>([])
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([])
  const [statsLoading, setStatsLoading] = useState(true)

  // Fetch all employee statistics in parallel
  useEffect(() => {
    const fetchAllData = async () => {
      setStatsLoading(true)
      const headers = { Authorization: `Bearer ${token}` }
      try {
        const [
          profileRes,
          leavesRes,
          reimbursementsRes,
          overtimesRes,
          bonusesRes,
          payrollsRes
        ] = await Promise.allSettled([
          axios.get('http://localhost:8000/api/user/profile', { headers }),
          axios.get('http://localhost:8000/api/leaves', { headers }),
          axios.get('http://localhost:8000/api/reimbursements', { headers }),
          axios.get('http://localhost:8000/api/overtimes', { headers }),
          axios.get('http://localhost:8000/api/bonuses', { headers }),
          axios.get('http://localhost:8000/api/payroll/my-slips', { headers })
        ])

        if (profileRes.status === 'fulfilled' && profileRes.value.data.status === 'success') {
          setProfile(profileRes.value.data.data)
        }
        if (leavesRes.status === 'fulfilled' && leavesRes.value.data.status === 'success') {
          setLeaves(leavesRes.value.data.data)
        }
        if (reimbursementsRes.status === 'fulfilled' && reimbursementsRes.value.data.status === 'success') {
          setReimbursements(reimbursementsRes.value.data.data)
        }
        if (overtimesRes.status === 'fulfilled' && overtimesRes.value.data.status === 'success') {
          setOvertimes(overtimesRes.value.data.data)
        }
        if (bonusesRes.status === 'fulfilled' && bonusesRes.value.data.status === 'success') {
          setBonuses(bonusesRes.value.data.data)
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

  const getGreeting = () => {
    const hrs = time.getHours()
    if (hrs < 12) return 'Selamat Pagi'
    if (hrs < 15) return 'Selamat Siang'
    if (hrs < 18) return 'Selamat Sore'
    return 'Selamat Malam'
  }

  const greeting = getGreeting()

  // Helper date duration calculator
  const calculateDays = (start: string, end: string) => {
    const s = new Date(start)
    const e = new Date(end)
    const diffTime = Math.abs(e.getTime() - s.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  // --- Calculations for Synced Data ---

  // 1. Attendance stats
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const monthlyHistory = history.filter(att => {
    const d = new Date(att.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  const workDays = monthlyHistory.filter(a => a.clock_in).length
  const onTimeDays = monthlyHistory.filter(
    a => a.status_in === 'normal' || a.status_in === 'early'
  ).length
  const lateDays = monthlyHistory.filter(a => a.status_in === 'late').length
  const attendanceRate = workDays > 0 ? Math.round((onTimeDays / workDays) * 100) : 0

  // 2. Cuti (Leaves) stats
  const approvedLeavesCount = leaves
    .filter(l => l.status === 'approved')
    .reduce((acc, curr) => acc + calculateDays(curr.start_date, curr.end_date), 0)
  const pendingLeavesCount = leaves.filter(l => l.status === 'pending' || l.status === 'pending_director').length

  // 3. Reimbursements stats
  const approvedReimburseAmount = reimbursements
    .filter(r => r.status === 'approved')
    .reduce((acc, curr) => acc + curr.amount, 0)
  const pendingReimburseCount = reimbursements.filter(r => r.status === 'pending' || r.status === 'pending_director').length

  // 4. Overtime stats
  const approvedOvertimesDuration = overtimes
    .filter(o => o.status === 'approved')
    .reduce((acc, curr) => acc + curr.duration, 0)
  const pendingOvertimesCount = overtimes.filter(o => o.status === 'pending' || o.status === 'pending_director').length

  // 5. Bonuses stats
  const totalBonusAmount = bonuses.reduce((acc, curr) => acc + curr.bonus_amount, 0)
  const totalBonusCount = bonuses.length

  // 6. Latest Slip Gaji (Payroll) stats
  const sortedPayrolls = [...payrolls].sort((a, b) => b.period_month.localeCompare(a.period_month))
  const latestPayroll = sortedPayrolls[0] || null

  const photoSrc = profile?.photo || null
  const divisionLabel = profile?.division || 'Belum diatur'

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number)
  }

  const getIndonesianMonthLabel = (periodMonth: string) => {
    if (!periodMonth) return ''
    const [year, month] = periodMonth.split('-')
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    return `${monthNames[parseInt(month, 10) - 1]} ${year}`
  }

  return (
    <div className="w-full max-w-screen-xl mx-auto font-quicksand grid grid-cols-1 md:grid-cols-12 gap-8">
      
      {/* ==============================
          GREETING BANNER (Vibrant & Premium)
      ============================== */}
      <section className="col-span-1 md:col-span-12 bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 text-white rounded-3xl p-6 md:p-8 shadow-xl shadow-red-500/10 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group">
        
        {/* Glow circles decorations */}
        <div className="absolute -right-24 -top-24 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700 pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700 pointer-events-none"></div>
        
        <div className="z-10 space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-extrabold uppercase tracking-widest text-white border border-white/15">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
            Karyawan Aktif
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight font-sans">
            {greeting}, {user.name}
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-orange-50 font-semibold">
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-orange-200" />
              Divisi: {divisionLabel}
            </span>
            <span className="hidden sm:inline text-white/40">|</span>
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-orange-200" />
              ID Karyawan: {profile?.employee_number || 'Belum Diatur'}
            </span>
          </div>
        </div>

        <div className="bg-white/15 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/25 min-w-[170px] text-center z-10 shadow-inner group-hover:bg-white/20 transition-all duration-300">
          <p className="text-[10px] text-orange-100 uppercase tracking-widest mb-1 font-extrabold">Waktu Server</p>
          <p className="text-3xl text-white font-mono font-black tracking-wider">
            {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <span className="text-[9px] text-orange-200 block mt-1 font-semibold uppercase">{formatDate(time).split(',')[1]}</span>
        </div>
      </section>

      {/* ==============================
          MAIN COLUMN (LEFT/TOP) - col-span-8
      ============================== */}
      <div className="col-span-1 md:col-span-8 flex flex-col gap-8">
        
        {/* Attendance Control Center */}
        <section className="bg-white border border-orange-100/80 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-20 -top-20 w-44 h-44 bg-orange-50 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500 pointer-events-none"></div>
          
          <div className="flex items-center justify-between border-b border-orange-100/60 pb-3 mb-6">
            <h3 className="text-base font-black text-slate-800 font-sans tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-500" /> Presensi Hari Ini
            </h3>
            <span className="text-[10px] font-bold text-slate-400 font-mono">
              {formatDate(time).split(',')[0]}
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-8 items-center">
            
            {/* Timeline Progress */}
            <div className="flex-1 flex flex-col gap-6 relative w-full border-l-2 border-slate-100 ml-3 pl-6 py-1">
              
              {/* Step 1: Clock In */}
              <div className="relative">
                <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm transition-all duration-300 ${
                  todayAttendance?.clock_in ? 'bg-red-500 scale-110' : 'bg-slate-200'
                }`}></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Absen Masuk</p>
                <p className="text-base font-black text-slate-700 font-mono mt-0.5">
                  {todayAttendance?.clock_in ? todayAttendance.clock_in.substring(0, 5) : '--:--'}
                </p>
                {todayAttendance?.clock_in ? (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold mt-1.5 px-2 py-0.5 rounded-full ${
                    todayAttendance.status_in === 'normal' || todayAttendance.status_in === 'early' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                      : 'bg-rose-50 text-rose-700 border border-rose-100'
                  }`}>
                    {todayAttendance.status_in === 'normal' || todayAttendance.status_in === 'early' ? 'Tepat Waktu' : 'Terlambat'}
                  </span>
                ) : (
                  attendanceState === 'needs_checkin' && (
                    <span className="inline-flex text-[10px] font-extrabold mt-1.5 text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                      {getLiveCheckInStatus().text}
                    </span>
                  )
                )}
              </div>
              
              {/* Step 2: Clock Out */}
              <div className="relative">
                <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm transition-all duration-300 ${
                  todayAttendance?.clock_out ? 'bg-orange-500 scale-110' : 'bg-slate-200'
                }`}></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Absen Keluar</p>
                <p className="text-base font-black text-slate-750 font-mono mt-0.5">
                  {todayAttendance?.clock_out ? todayAttendance.clock_out.substring(0, 5) : '--:--'}
                </p>
                {todayAttendance?.clock_out ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold mt-1.5 px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
                    Selesai Kerja
                  </span>
                ) : (
                  attendanceState === 'needs_checkout' && (
                    <span className="inline-flex text-[10px] font-extrabold mt-1.5 text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                      {getLiveCheckOutStatus().text}
                    </span>
                  )
                )}
              </div>
            </div>
            
            {/* Clock CTA Buttons */}
            <div className="flex flex-col gap-3 w-full sm:w-auto min-w-[200px] shrink-0">
              <button 
                onClick={() => navigate('/employee/absen')}
                disabled={attendanceState !== 'needs_checkin'}
                className={`w-full py-3 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 border transition-all duration-300 shadow-md ${
                  attendanceState === 'needs_checkin'
                    ? 'bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white border-transparent hover:-translate-y-0.5 shadow-red-500/10 cursor-pointer'
                    : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed shadow-none'
                }`}
              >
                <LogIn className="w-4 h-4" />
                Absen Masuk
              </button>
              
              <button 
                onClick={() => navigate('/employee/absen')}
                disabled={attendanceState !== 'needs_checkout'}
                className={`w-full py-3 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 border transition-all duration-300 shadow-md ${
                  attendanceState === 'needs_checkout'
                    ? 'bg-gradient-to-r from-slate-800 to-slate-950 hover:from-slate-800 hover:to-black text-white border-transparent hover:-translate-y-0.5 shadow-slate-900/10 cursor-pointer'
                    : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed shadow-none'
                }`}
              >
                <LogOut className="w-4 h-4" />
                Absen Keluar
              </button>
            </div>
          </div>
        </section>

        {/* Ringkasan Data & Statistik Terintegrasi */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pl-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 font-mono">
              <TrendingUp className="w-4 h-4" /> Ringkasan Data Utama Anda
            </h3>
            {statsLoading && <span className="text-[10px] text-red-500 font-bold animate-pulse">Menyinkronkan data...</span>}
          </div>

          {statsLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="bg-white border border-orange-100/50 rounded-3xl p-5 shadow-sm space-y-3 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="w-24 h-3 bg-slate-200 rounded"></div>
                    <div className="w-8 h-8 bg-slate-200 rounded-xl"></div>
                  </div>
                  <div className="w-32 h-6 bg-slate-200 rounded"></div>
                  <div className="w-16 h-2 bg-slate-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              
              {/* Card 1: Cuti Karyawan */}
              <div className="bg-white border border-orange-100/80 rounded-3xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Cuti </span>
                  <div className="p-2.5 bg-indigo-50 text-indigo-500 border border-indigo-100 rounded-2xl group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <span className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                    {approvedLeavesCount} <span className="text-xs text-slate-400 font-bold">Hari disetujui</span>
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">
                    {pendingLeavesCount > 0 ? `${pendingLeavesCount} pengajuan sedang diproses` : 'Tidak ada pengajuan aktif'}
                  </p>
                </div>
              </div>

              {/* Card 2: Klaim Reimbursement */}
              <div className="bg-white border border-orange-100/80 rounded-3xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Reimburse</span>
                  <div className="p-2.5 bg-rose-50 text-rose-500 border border-rose-100 rounded-2xl group-hover:bg-rose-500 group-hover:text-white transition-colors duration-300">
                    <ReceiptText className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <span className="text-lg md:text-xl font-black text-slate-800 tracking-tight font-mono block truncate" title={formatRupiah(approvedReimburseAmount)}>
                    {formatRupiah(approvedReimburseAmount)}
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">
                    {pendingReimburseCount > 0 ? `${pendingReimburseCount} klaim menunggu persetujuan` : 'Semua klaim selesai diproses'}
                  </p>
                </div>
              </div>

              {/* Card 3: Lembur Kerja */}
              <div className="bg-white border border-orange-100/80 rounded-3xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Lembur <br /> Kerja</span>
                  <div className="p-2.5 bg-amber-50 text-amber-500 border border-amber-100 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                    <Clock3 className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <span className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                    {approvedOvertimesDuration} <span className="text-xs text-slate-400 font-bold">Jam disetujui</span>
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">
                    {pendingOvertimesCount > 0 ? `${pendingOvertimesCount} laporan dalam verifikasi` : 'Tidak ada laporan pending'}
                  </p>
                </div>
              </div>

              {/* Card 4: Total Bonus */}
              <div className="bg-white border border-orange-100/80 rounded-3xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Bonus & Insentif</span>
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                    <Gift className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <span className="text-lg md:text-xl font-black text-emerald-600 tracking-tight font-mono block truncate" title={formatRupiah(totalBonusAmount)}>
                    {formatRupiah(totalBonusAmount)}
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">
                    {totalBonusCount > 0 ? `Akumulasi dari ${totalBonusCount} kali penerimaan` : 'Belum ada bonus tercatat'}
                  </p>
                </div>
              </div>

            </div>
          )}
        </section>

        {/* Quick Actions / Pintasan Cepat */}
        <section className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2 font-mono">
            Menu Pintasan Cepat
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <button 
              onClick={() => navigate('/employee/cuti')}
              className="bg-white border border-orange-100/60 rounded-3xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-3 aspect-square group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-indigo-500 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                <CalendarDays className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-700 text-center">Ajukan Cuti</span>
            </button>
            
            <button 
              onClick={() => navigate('/employee/reimbursement')}
              className="bg-white border border-orange-100/60 rounded-3xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-3 aspect-square group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50/70 border border-rose-100 text-rose-500 flex items-center justify-center group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300">
                <ReceiptText className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-700 text-center">Reimburse</span>
            </button>
            
            <button 
              onClick={() => navigate('/employee/lembur')}
              className="bg-white border border-orange-100/60 rounded-3xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-3 aspect-square group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50/70 border border-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                <Clock3 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-700 text-center">Lapor Lembur</span>
            </button>
            
            <button 
              onClick={() => navigate('/employee/payroll')}
              className="bg-white border border-orange-100/60 rounded-3xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-3 aspect-square group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-50/70 border border-slate-200 text-slate-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-slate-800 group-hover:text-white transition-all duration-300">
                <Banknote className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-700 text-center">Slip Gaji</span>
            </button>
          </div>
        </section>

      </div>

      {/* ==============================
          SIDEBAR COLUMN (RIGHT/BOTTOM) - col-span-4
      ============================== */}
      <div className="col-span-1 md:col-span-4 flex flex-col gap-8">
        
        {/* Digital ID Card (Highly Polished) */}
        <section className="bg-white border border-orange-100/80 rounded-3xl shadow-sm overflow-hidden group hover:shadow-md transition-shadow duration-300">
          <div className="h-24 bg-slate-800 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 opacity-90"></div>
            <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
          </div>
          <div className="px-6 pb-6 pt-0 relative flex flex-col items-center">
            
            {/* Photo frame */}
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-md -mt-12 mb-4 overflow-hidden bg-slate-50 flex items-center justify-center relative group-hover:scale-105 transition-transform duration-300">
              {photoSrc ? (
                 <img src={photoSrc.startsWith('http') ? photoSrc : `http://localhost:8000${photoSrc}`} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                 <span className="text-3xl font-black text-slate-300">{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            
            <h4 className="text-lg font-black text-slate-800 text-center capitalize">{profile?.name || user.name}</h4>
            <p className="text-[10px] font-extrabold text-orange-600 bg-orange-50 border border-orange-100 rounded-full px-3 py-0.5 mt-1 text-center font-mono">
              ID: {profile?.employee_number || 'N/A'}
            </p>
            
            <div className="w-full space-y-3 border-t border-slate-100 mt-6 pt-5">
              <div className="flex items-center gap-3 text-slate-600">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-semibold truncate" title={profile?.email || user.email}>{profile?.email || user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs font-semibold">Divisi: {profile?.division || 'Belum Diatur'}</span>
              </div>
              {profile?.join_date && (
                <div className="flex items-center gap-3 text-slate-600">
                  <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-xs font-semibold">Gabung: {new Date(profile.join_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Kehadiran Statistik (Bulan Ini) */}
        <section className="bg-white border border-orange-100/80 rounded-3xl p-5 shadow-sm space-y-4">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 font-mono">
            Kehadiran Bulan Ini
          </h4>
          <div className="grid grid-cols-2 gap-3">
            
            <div className="bg-slate-50 border border-slate-150/60 rounded-2xl p-3.5 shadow-sm text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Hadir</p>
              <p className="text-2xl font-black text-slate-800 font-mono">{workDays}</p>
            </div>
            
            <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-3.5 shadow-sm text-center">
              <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Tepat Waktu</p>
              <p className="text-2xl font-black text-emerald-600 font-mono">{onTimeDays}</p>
            </div>
            
            <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-3.5 shadow-sm text-center">
              <p className="text-[9px] font-bold text-rose-700 uppercase tracking-wider mb-1">Terlambat</p>
              <p className="text-2xl font-black text-rose-600 font-mono">{lateDays}</p>
            </div>
            
            <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-3.5 shadow-sm text-center">
              <p className="text-[9px] font-bold text-indigo-700 uppercase tracking-wider mb-1">Akurasi</p>
              <p className="text-2xl font-black text-indigo-600 font-mono">{attendanceRate}%</p>
            </div>

          </div>
        </section>

        {/* Status Slip Gaji Terbaru (Payroll widget) */}
        <section className="bg-white border border-orange-100/80 rounded-3xl p-5 shadow-sm space-y-4 group">
          <div className="flex items-center justify-between pl-1">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">
              Slip Gaji Terbaru
            </h4>
            <button 
              onClick={() => navigate('/employee/payroll')}
              className="text-[10px] font-black text-red-500 hover:text-red-750 flex items-center gap-0.5"
            >
              Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {statsLoading ? (
            <div className="space-y-2.5 animate-pulse py-2">
              <div className="w-1/2 h-3 bg-slate-200 rounded"></div>
              <div className="w-3/4 h-5 bg-slate-200 rounded"></div>
              <div className="w-1/3 h-4 bg-slate-200 rounded"></div>
            </div>
          ) : latestPayroll ? (
            <div className="space-y-3.5">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{getIndonesianMonthLabel(latestPayroll.period_month)}</p>
                <p className="text-xl font-black text-slate-800 mt-1 font-mono">{formatRupiah(latestPayroll.net_salary)}</p>
              </div>
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold">Status Pembayaran</span>
                {latestPayroll.status === 'paid' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 font-mono">
                    Lunas (Paid)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold bg-rose-50 text-rose-700 border border-rose-100 font-mono">
                    Belum Dibayar
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs italic font-medium">
              Belum ada slip gaji yang disahkan untuk Anda.
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
