import { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  Loader2, 
  Camera, 
  Search, 
  SlidersHorizontal, 
  Info,
  Calendar,
  Users,
  Clock,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  X,
  MapPin,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface AttendanceRecord {
  id: number
  user_id: number
  date: string
  clock_in: string | null
  clock_out: string | null
  notes_in: string | null
  notes_out: string | null
  latitude_in: string | null
  longitude_in: string | null
  latitude_out: string | null
  longitude_out: string | null
  attendance_type: string
  approval_status: 'approved' | 'pending' | 'rejected'
  photo_in: string | null
  photo_out: string | null
  status_in: 'early' | 'normal' | 'late' | null
  status_out: 'early_departure' | 'normal' | 'overtime' | null
  user: { 
    id: number
    name: string
    email: string
    photo: string | null
    role: 'admin' | 'employee' | 'director'
  } | null
}

interface LogKehadiranProps {
  token: string
}

const S = { fontFamily: "'Inter', 'system-ui', sans-serif" }

const formatMonthYear = (monthStr: string) => {
  if (!monthStr) return ''
  const [year, month] = monthStr.split('-')
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  const mIndex = parseInt(month, 10) - 1
  return `${months[mIndex]} ${year}`
}

const getIndonesianDayNameFull = (dateStr: string) => {
  const dateObj = new Date(dateStr)
  return dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function LogKehadiran({ token }: LogKehadiranProps) {
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  
  // Selected Month (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  
  // Selected Date on Calendar (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState('')
  
  // Filters for the daily detail list
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<'all' | 'admin' | 'employee'>('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all')
  const [showFilters, setShowFilters] = useState(false)
  
  // Detail Modal popup
  const [selectedDetail, setSelectedDetail] = useState<AttendanceRecord | null>(null)

  const fetchAttendances = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:8000/api/admin/attendances', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        const data: AttendanceRecord[] = response.data.data
        setAttendances(data)
        
        // Unique months (YYYY-MM)
        const months = Array.from(new Set(data.map(r => r.date.substring(0, 7))))
          .sort((a, b) => b.localeCompare(a))
        
        setAvailableMonths(months)
        if (months.length > 0) {
          const defaultMonth = months[0]
          setSelectedMonth(defaultMonth)
          
          // Set selectedDate to latest log in this month or default to today's date if within this month
          const monthLogs = data.filter(r => r.date.startsWith(defaultMonth))
          if (monthLogs.length > 0) {
            setSelectedDate(monthLogs[0].date)
          } else {
            setSelectedDate(`${defaultMonth}-01`)
          }
        } else {
          const cur = new Date().toISOString().substring(0, 7)
          setSelectedMonth(cur)
          setAvailableMonths([cur])
          setSelectedDate(new Date().toISOString().substring(0, 10))
        }
      }
    } catch (err) {
      console.error('Error fetching attendances:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendances()
  }, [])

  // Update selectedDate automatically when selectedMonth changes
  useEffect(() => {
    if (selectedMonth) {
      const monthLogs = attendances.filter(r => r.date.startsWith(selectedMonth))
      if (monthLogs.length > 0) {
        setSelectedDate(monthLogs[0].date)
      } else {
        setSelectedDate(`${selectedMonth}-01`)
      }
    }
  }, [selectedMonth])

  const handleResetFilters = () => {
    setSearchTerm('')
    setSelectedRole('all')
    setSelectedStatus('all')
  }

  // Next/Prev Month helpers
  const handleMonthChange = (direction: 'prev' | 'next') => {
    const currentIndex = availableMonths.indexOf(selectedMonth)
    if (direction === 'prev' && currentIndex < availableMonths.length - 1) {
      setSelectedMonth(availableMonths[currentIndex + 1])
    } else if (direction === 'next' && currentIndex > 0) {
      setSelectedMonth(availableMonths[currentIndex - 1])
    }
  }

  // Monthly stats calculations (based on all logs in the selected month)
  const monthlyData = attendances.filter(record => record.date.startsWith(selectedMonth))
  const totalAbsen = monthlyData.length
  const totalTepatWaktu = monthlyData.filter(r => r.clock_in && r.status_in !== 'late').length
  const totalTerlambat = monthlyData.filter(r => r.status_in === 'late').length
  const totalLembur = monthlyData.filter(r => r.status_out === 'overtime').length

  // Filter daily logs based on selectedDate and filters
  const dailyLogs = monthlyData.filter(record => record.date === selectedDate)
  const filteredDailyLogs = dailyLogs.filter(record => {
    const userObj = record.user
    if (!userObj) return false

    const matchesSearch = 
      userObj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userObj.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = 
      selectedRole === 'all' || 
      userObj.role === selectedRole

    const matchesStatus = 
      selectedStatus === 'all' || 
      record.approval_status === selectedStatus

    return matchesSearch && matchesRole && matchesStatus
  })

  // Generate Calendar cells (Monday to Sunday)
  const generateCalendarDays = () => {
    if (!selectedMonth) return []
    const [year, month] = selectedMonth.split('-').map(Number)
    
    // First day index (0 = Sun, 1 = Mon...)
    const firstDayIndex = new Date(year, month - 1, 1).getDay()
    // Align with Monday starting week: Mon=0, Tue=1, ..., Sun=6
    const startDayOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1
    
    // Total days in the active month
    const totalDays = new Date(year, month, 0).getDate()
    
    const cells = []
    // Preceding month empty slots
    for (let i = 0; i < startDayOffset; i++) {
      cells.push({ dayNum: null, dateStr: '' })
    }
    // Days of this month
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${selectedMonth}-${String(d).padStart(2, '0')}`
      cells.push({ dayNum: d, dateStr })
    }
    return cells
  }

  const calendarDays = generateCalendarDays()

  // Formatting helpers
  const getStatusInLabel = (status: string | null) => {
    if (!status) return null
    if (status === 'early') {
      return <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-teal-50 text-teal-650 border border-teal-100">Awal</span>
    }
    if (status === 'late') {
      return <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-50 text-rose-600 border border-rose-100">Lambat</span>
    }
    return <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-50 text-slate-400 border border-slate-100">Normal</span>
  }

  const getStatusOutLabel = (status: string | null) => {
    if (!status) return null
    if (status === 'early_departure') {
      return <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-50 text-amber-600 border border-amber-100">Pulang Cepat</span>
    }
    if (status === 'overtime') {
      return <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-purple-50 text-purple-650 border border-purple-100">Lembur</span>
    }
    return <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-50 text-slate-400 border border-slate-100">Normal</span>
  }

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-[9px] font-black bg-emerald-50 text-emerald-605 border border-emerald-100">
            <CheckCircle2 className="w-2.5 h-2.5" /> Valid
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-[9px] font-black bg-red-50 text-red-500 border border-red-100">
            <XCircle className="w-2.5 h-2.5" /> Ditolak
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-[9px] font-black bg-amber-50 text-amber-600 border border-amber-100 animate-pulse">
            <AlertCircle className="w-2.5 h-2.5" /> Pending
          </span>
        )
    }
  }

  const getAttendanceTypeLabel = (type: string) => {
    switch (type) {
      case 'kantor':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-650 border border-blue-100">Kantor</span>
      case 'kunjungan':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-600 border border-orange-100">Kunjungan</span>
      case 'client':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">Klien</span>
      default:
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-50 text-slate-500 border border-slate-100 capitalize">{type}</span>
    }
  }

  return (
    <div className="space-y-6" style={S}>
      {/* Top Banner and Month Selector */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0"
            style={{ background: 'linear-gradient(135deg,#ea580c,#dc2626)' }}
          >
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Laporan Kehadiran Bulanan
            </h2>
            <p className="text-[11px] text-slate-450 font-medium mt-0.5">
              Antarmuka Kalender Interaktif - Klik tanggal untuk melihat daftar rincian kehadiran
            </p>
          </div>
        </div>

        {/* Month Selector dropdown */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-end">
          <div className="flex items-center border border-orange-100 bg-orange-50/20 rounded-2xl p-1 shadow-sm">
            <button
              onClick={() => handleMonthChange('prev')}
              className="p-1.5 hover:bg-orange-100/50 text-orange-600 rounded-lg transition-colors cursor-pointer"
              disabled={availableMonths.indexOf(selectedMonth) === availableMonths.length - 1}
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1 bg-transparent text-orange-700 font-extrabold text-xs outline-none cursor-pointer border-none appearance-none pr-6 relative"
            >
              {availableMonths.map(m => (
                <option key={m} value={m} className="font-semibold text-slate-850">
                  {formatMonthYear(m)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-orange-600 -ml-5 mr-3 pointer-events-none" />

            <button
              onClick={() => handleMonthChange('next')}
              className="p-1.5 hover:bg-orange-100/50 text-orange-600 rounded-lg transition-colors cursor-pointer"
              disabled={availableMonths.indexOf(selectedMonth) === 0}
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Statistics Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Absen */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50/80 flex items-center justify-center text-blue-500 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Absensi</p>
            <h4 className="text-sm font-black text-slate-800 mt-0.5">{totalAbsen} Absen</h4>
          </div>
        </div>

        {/* Card 2: Tepat Waktu */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50/80 flex items-center justify-center text-teal-650 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tepat Waktu</p>
            <h4 className="text-sm font-black text-slate-800 mt-0.5">{totalTepatWaktu} Hari</h4>
          </div>
        </div>

        {/* Card 3: Terlambat */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50/80 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Terlambat</p>
            <h4 className="text-sm font-black text-slate-800 mt-0.5">{totalTerlambat} Kali</h4>
          </div>
        </div>

        {/* Card 4: Lembur */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50/80 flex items-center justify-center text-purple-655 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lembur</p>
            <h4 className="text-sm font-black text-slate-800 mt-0.5">{totalLembur} Hari</h4>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Calendar (Left) & Daily Details Panel (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        
        {/* Left Panel: Calendar Grid */}
        <div className="xl:col-span-3 bg-white rounded-3xl border border-slate-150 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Kalender Kehadiran - {formatMonthYear(selectedMonth)}
            </h3>
            <span className="text-[9px] text-slate-400 font-bold italic">
              Klik tanggal untuk rincian
            </span>
          </div>

          {/* Calendar Grid Container */}
          <div className="space-y-1">
            {/* Days of the Week headers */}
            <div className="grid grid-cols-7 text-center border-b border-slate-100 pb-2">
              {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day, idx) => (
                <span 
                  key={day} 
                  className={`text-[10px] font-black uppercase ${
                    idx >= 5 ? 'text-rose-500' : 'text-slate-400'
                  }`}
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Grid Cells */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <Loader2 className="w-7 h-7 animate-spin text-orange-600 mb-2" />
                <p className="text-[11px] text-slate-400 font-medium">Memuat kalender...</p>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1 pt-1">
                {calendarDays.map((cell, idx) => {
                  const isDay = cell.dayNum !== null
                  const dateStr = cell.dateStr
                  const isSelected = isDay && selectedDate === dateStr
                  
                  // Get records for this day
                  const dayRecords = isDay ? monthlyData.filter(r => r.date === dateStr) : []
                  const hasLogs = dayRecords.length > 0
                  
                  const hasLate = dayRecords.some(r => r.status_in === 'late')
                  const hasPending = dayRecords.some(r => r.approval_status === 'pending')

                  return (
                    <div
                      key={idx}
                      onClick={() => isDay && setSelectedDate(dateStr)}
                      className={`min-h-[64px] rounded-2xl p-2 flex flex-col justify-between transition-all select-none border ${
                        !isDay 
                          ? 'border-transparent bg-transparent' 
                          : isSelected 
                            ? 'border-orange-500 bg-orange-50/40 text-orange-850 font-black shadow-sm'
                            : hasLogs
                              ? 'border-slate-150 bg-white hover:bg-slate-50/70 hover:border-orange-200 text-slate-800 cursor-pointer'
                              : 'border-slate-100 bg-slate-50/40 hover:bg-slate-50 text-slate-400 cursor-pointer'
                      }`}
                    >
                      {isDay ? (
                        <>
                          {/* Day number */}
                          <span className={`text-xs font-bold ${
                            isSelected ? 'text-orange-700' : new Date(dateStr).getDay() === 0 || new Date(dateStr).getDay() === 6 ? 'text-rose-500' : 'text-slate-700'
                          }`}>
                            {cell.dayNum}
                          </span>
                          
                          {/* Dot / Text indicators inside day cell */}
                          {hasLogs && (
                            <div className="space-y-1">
                              {/* Simple Badge */}
                              <div className="text-[8px] font-black leading-none text-slate-500 px-1 py-0.5 rounded bg-slate-100 inline-block">
                                {dayRecords.length} Staf
                              </div>
                              {/* Small status dots */}
                              <div className="flex gap-1 items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Valid" />
                                {hasLate && <span className="w-1.5 h-1.5 rounded-full bg-red-500" title="Terlambat" />}
                                {hasPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="Pending Koreksi" />}
                              </div>
                            </div>
                          )}
                        </>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Daily Attendees List */}
        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-150 p-5 shadow-sm space-y-4 flex flex-col min-h-[480px]">
          {/* Header */}
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider leading-tight">
                Rincian Kehadiran
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                {selectedDate ? getIndonesianDayNameFull(selectedDate) : ''}
              </p>
            </div>
            
            {/* Filter Toggle inside sidebar details */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1 px-2 py-1 border rounded-lg text-[9px] font-black transition-all cursor-pointer bg-white ${
                showFilters ? 'border-orange-300 text-orange-600 bg-orange-50' : 'border-slate-200 text-slate-500 hover:border-orange-200'
              }`}
            >
              <SlidersHorizontal className="w-2.5 h-2.5" />
              Saring
            </button>
          </div>

          {/* Sidebar Saringan drawer */}
          {showFilters && (
            <div className="p-3 bg-slate-50 border border-slate-150 rounded-2xl grid grid-cols-2 gap-2 animate-fadeIn">
              <div className="space-y-0.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Akses</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  className="w-full p-1.5 bg-white border border-slate-200 focus:border-orange-500 rounded-lg text-[10px] font-semibold outline-none cursor-pointer"
                >
                  <option value="all">Semua</option>
                  <option value="employee">Karyawan</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="space-y-0.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="w-full p-1.5 bg-white border border-slate-200 focus:border-orange-500 rounded-lg text-[10px] font-semibold outline-none cursor-pointer"
                >
                  <option value="all">Semua</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Valid</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </div>
              <div className="col-span-2 space-y-0.5">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cari Nama</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ketik nama karyawan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-6 pr-2 py-1 bg-white border border-slate-200 focus:border-orange-500 rounded-lg text-[10px] font-medium outline-none"
                  />
                </div>
              </div>
              {(searchTerm || selectedRole !== 'all' || selectedStatus !== 'all') && (
                <button
                  onClick={handleResetFilters}
                  className="col-span-2 mt-1 py-1 text-center bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 rounded-lg text-[9px] font-black transition-all cursor-pointer"
                >
                  Reset Saringan
                </button>
              )}
            </div>
          )}

          {/* List panel */}
          <div className="flex-1 overflow-y-auto max-h-[360px] pr-1 space-y-3">
            {filteredDailyLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                <Info className="w-8 h-8 opacity-30 mb-2" />
                <p className="text-xs font-bold">Tidak ada data absensi</p>
                <p className="text-[10px] text-slate-350 mt-0.5 max-w-[200px]">
                  Tidak ada catatan kehadiran karyawan yang cocok untuk tanggal {selectedDate} ini.
                </p>
              </div>
            ) : (
              filteredDailyLogs.map(record => (
                <div
                  key={record.id}
                  onClick={() => setSelectedDetail(record)}
                  className="bg-slate-50/50 hover:bg-orange-50/10 border border-slate-150 hover:border-orange-100 rounded-2xl p-3 space-y-3 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
                >
                  {/* Top: profile, email, status badge */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      {record.user?.photo ? (
                        <img
                          src={record.user.photo.startsWith('http') ? record.user.photo : `http://localhost:8000/storage/${record.user.photo}`}
                          alt={record.user.name}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-655 font-bold text-xs shrink-0">
                          {record.user?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h5 className="text-[11px] font-black text-slate-800 leading-none group-hover:text-orange-600 transition-colors">
                            {record.user?.name}
                          </h5>
                          {record.user?.role === 'admin' ? (
                            <span className="text-[8px] font-black text-orange-600 uppercase tracking-widest leading-none">Admin</span>
                          ) : (
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Staf</span>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1">{record.user?.email}</p>
                      </div>
                    </div>
                    {getApprovalBadge(record.approval_status)}
                  </div>

                  {/* Center: Shift times */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-emerald-50/45 border border-emerald-100/60 rounded-xl p-2">
                      <span className="text-[8px] font-black text-emerald-600 uppercase tracking-wider block">Jam Masuk</span>
                      <span className="font-extrabold text-slate-850 mt-0.5 block">{record.clock_in || '-'}</span>
                      {record.clock_in && <div className="mt-1">{getStatusInLabel(record.status_in)}</div>}
                    </div>
                    <div className="bg-rose-50/45 border border-rose-100/60 rounded-xl p-2">
                      <span className="text-[8px] font-black text-red-500 uppercase tracking-wider block">Jam Keluar</span>
                      <span className="font-extrabold text-slate-850 mt-0.5 block">{record.clock_out || '-'}</span>
                      {record.clock_out && <div className="mt-1">{getStatusOutLabel(record.status_out)}</div>}
                    </div>
                  </div>

                  {/* Bottom details */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100 pt-2 bg-slate-50/20 px-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold text-slate-400">Metode:</span>
                      {getAttendanceTypeLabel(record.attendance_type)}
                    </div>
                    
                    {(record.notes_in || record.notes_out || record.photo_in || record.photo_out) && (
                      <span className="text-[9px] font-black text-orange-600 flex items-center gap-1 group-hover:underline">
                        Lihat Bukti & Detail →
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Attendance Detail Pop-up Modal */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-lg w-full p-6 shadow-2xl relative space-y-5 animate-scaleUp">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedDetail(null)}
              className="absolute top-4 right-4 p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header: User info & date */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              {selectedDetail.user?.photo ? (
                <img
                  src={selectedDetail.user.photo.startsWith('http') ? selectedDetail.user.photo : `http://localhost:8000/storage/${selectedDetail.user.photo}`}
                  alt={selectedDetail.user.name}
                  className="w-11 h-11 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center text-orange-655 font-black text-sm">
                  {selectedDetail.user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-slate-800">{selectedDetail.user?.name}</h3>
                  {selectedDetail.user?.role === 'admin' ? (
                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-orange-100 text-orange-600 tracking-wider">Admin</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-slate-100 text-slate-500 tracking-wider">Karyawan</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{selectedDetail.user?.email}</p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="space-y-4">
              {/* Date & Method */}
              <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                <span className="font-extrabold text-slate-700">Tanggal Kehadiran:</span>
                <span className="font-bold text-slate-900 bg-slate-50 px-2.5 py-1 rounded-xl">
                  {getIndonesianDayNameFull(selectedDetail.date)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                <span className="font-extrabold text-slate-700">Metode Absensi:</span>
                <div>{getAttendanceTypeLabel(selectedDetail.attendance_type)}</div>
              </div>

              {/* Check In / Out Cards with Photos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Clock In */}
                <div className="rounded-2xl p-3 border border-slate-150 space-y-2 bg-slate-50/50">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Jam Masuk</span>
                    {getStatusInLabel(selectedDetail.status_in)}
                  </div>
                  <p className="text-sm font-black text-slate-800">{selectedDetail.clock_in || '-'}</p>
                  
                  {selectedDetail.photo_in ? (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200">
                      <img 
                        src={`http://localhost:8000${selectedDetail.photo_in}`} 
                        alt="Foto Masuk" 
                        className="w-full h-24 object-cover"
                      />
                      <a 
                        href={`http://localhost:8000${selectedDetail.photo_in}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="absolute inset-0 bg-slate-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-[10px] text-white font-bold"
                      >
                        Lihat Foto
                      </a>
                    </div>
                  ) : (
                    <div className="w-full h-24 bg-slate-100/70 rounded-xl flex flex-col items-center justify-center text-slate-400">
                      <Camera className="w-5 h-5 mb-1 opacity-40" />
                      <span className="text-[9px] font-semibold">Tidak ada foto</span>
                    </div>
                  )}
                  {selectedDetail.notes_in && (
                    <p className="text-[9px] text-slate-500 font-medium italic mt-1 bg-white p-1.5 rounded-lg border border-slate-100">
                      "{selectedDetail.notes_in}"
                    </p>
                  )}
                </div>

                {/* Clock Out */}
                <div className="rounded-2xl p-3 border border-slate-150 space-y-2 bg-slate-50/50">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-[9px] font-black text-red-500 uppercase tracking-wider">Jam Keluar</span>
                    {getStatusOutLabel(selectedDetail.status_out)}
                  </div>
                  <p className="text-sm font-black text-slate-800">{selectedDetail.clock_out || '-'}</p>
                  
                  {selectedDetail.photo_out ? (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200">
                      <img 
                        src={`http://localhost:8000${selectedDetail.photo_out}`} 
                        alt="Foto Keluar" 
                        className="w-full h-24 object-cover"
                      />
                      <a 
                        href={`http://localhost:8000${selectedDetail.photo_out}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="absolute inset-0 bg-slate-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-[10px] text-white font-bold"
                      >
                        Lihat Foto
                      </a>
                    </div>
                  ) : (
                    <div className="w-full h-24 bg-slate-100/70 rounded-xl flex flex-col items-center justify-center text-slate-400">
                      <Camera className="w-5 h-5 mb-1 opacity-40" />
                      <span className="text-[9px] font-semibold">Tidak ada foto</span>
                    </div>
                  )}
                  {selectedDetail.notes_out && (
                    <p className="text-[9px] text-slate-500 font-medium italic mt-1 bg-white p-1.5 rounded-lg border border-slate-100">
                      "{selectedDetail.notes_out}"
                    </p>
                  )}
                </div>
              </div>

              {/* Coordinates / Map details */}
              {(selectedDetail.latitude_in || selectedDetail.latitude_out) && (
                <div className="p-3 bg-orange-50/20 border border-orange-100/60 rounded-2xl flex items-start gap-2 text-xs text-slate-650">
                  <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-orange-850">Lokasi GPS Koordinat:</p>
                    <div className="flex gap-2.5 mt-1">
                      {selectedDetail.latitude_in && (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${selectedDetail.latitude_in},${selectedDetail.longitude_in}`}
                          target="_blank" 
                          rel="noreferrer"
                          className="hover:underline text-[9px] font-black text-orange-600"
                        >
                          Peta Lokasi Masuk
                        </a>
                      )}
                      {selectedDetail.latitude_out && (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${selectedDetail.latitude_out},${selectedDetail.longitude_out}`}
                          target="_blank" 
                          rel="noreferrer"
                          className="hover:underline text-[9px] font-black text-red-500"
                        >
                          Peta Lokasi Pulang
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Approval status harian */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-extrabold text-slate-700">Status Validasi Harian:</span>
                <div>{getApprovalBadge(selectedDetail.approval_status)}</div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedDetail(null)}
                className="px-5 py-2.5 bg-slate-900 text-white font-extrabold text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
