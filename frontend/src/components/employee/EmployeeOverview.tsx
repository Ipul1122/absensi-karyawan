import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Clock, 
  Calendar, 
  Sparkles, 
  Building, 
  User as UserIcon,
  ArrowRight,
  UserCheck
} from 'lucide-react'

interface Shift {
  id: number
  name: string
  clock_in: string
  clock_out: string
  early_checkin_before: string
  late_checkin_after: string
  early_checkout_before: string
  overtime_checkout_after: string
}

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'employee'
  photo?: string | null
  shift?: Shift | null
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

interface EmployeeOverviewProps {
  user: User
  time: Date
  todayAttendance: Attendance | null
  attendanceState: 'loading' | 'needs_checkin' | 'needs_checkout' | 'completed'
  getLiveCheckInStatus: () => { text: string; colorClass: string }
  getLiveCheckOutStatus: () => { text: string; colorClass: string }
  formatDate: (date: Date) => string
  getStatusBadge: (status: string | null) => React.ReactNode
}

export default function EmployeeOverview({
  user,
  time,
  todayAttendance,
  attendanceState,
  getLiveCheckInStatus,
  getLiveCheckOutStatus,
  formatDate,
  getStatusBadge
}: EmployeeOverviewProps) {
  const navigate = useNavigate()

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '-'
    const parts = timeStr.split(':')
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`
    }
    return timeStr
  }

  const getGreeting = () => {
    const hrs = time.getHours()
    if (hrs < 12) return 'Selamat Pagi'
    if (hrs < 15) return 'Selamat Siang'
    if (hrs < 18) return 'Selamat Sore'
    return 'Selamat Malam'
  }

  return (
    <div className="space-y-6">
      {/* Grid Clock & Live Status */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Dynamic Clock Card */}
        <section className="md:col-span-5 bg-gradient-to-tr from-white to-orange-50/20 border border-orange-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-orange-50 rounded-2xl text-orange-600 border border-orange-100">
              <Clock className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 font-quicksand">
              Waktu Online
            </span>
          </div>
          
          <div className="my-4">
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 font-mono">
              {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </h2>
            <p className="text-sm text-slate-650 flex items-center gap-1.5 mt-1 font-bold font-quicksand">
              <Calendar className="w-4 h-4 text-slate-500" />
              {formatDate(time)}
            </p>
          </div>
          
          <div className="border-t border-orange-100 pt-3 text-xs text-slate-500 font-bold flex items-center gap-1 font-quicksand">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin duration-3000" />
            {getGreeting()}, {user.name.split(' ')[0]}!
          </div>
        </section>

        {/* Info & Status Cards */}
        <section className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* Card 1: Attendance status */}
          <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm hover:border-orange-200/90 transition-all duration-300 group">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-red-50 rounded-2xl text-red-500 border border-red-100">
                <UserCheck className="w-6 h-6" />
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold font-quicksand">Hari Ini</span>
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-extrabold text-slate-800 font-quicksand">Status Kehadiran</h3>
              <p className="text-xs text-slate-500 mt-1">Status Anda pada tanggal hari ini.</p>
              
              <div className="mt-3 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold font-quicksand">Masuk:</span>
                  {todayAttendance?.clock_in ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-800 font-mono">{todayAttendance.clock_in}</span>
                      {getStatusBadge(todayAttendance.status_in)}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic font-semibold">Belum Absen</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold font-quicksand">Keluar:</span>
                  {todayAttendance?.clock_out ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-800 font-mono">{todayAttendance.clock_out}</span>
                      {getStatusBadge(todayAttendance.status_out)}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic font-semibold">Belum Absen</span>
                  )}
                </div>
              </div>
            </div>

            {/* Interactive button to go to the Absen page */}
            <div className="mt-5 pt-3 border-t border-orange-100">
              {attendanceState === 'needs_checkin' ? (
                <button
                  id="btn-goto-absen-in"
                  onClick={() => navigate('/employee/absen')}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-500/10 cursor-pointer font-quicksand"
                >
                  Lakukan Absen Masuk <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : attendanceState === 'needs_checkout' ? (
                <button
                  id="btn-goto-absen-out"
                  onClick={() => navigate('/employee/absen')}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-500/10 cursor-pointer font-quicksand"
                >
                  Lakukan Absen Keluar <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="text-center text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 py-1.5 px-3 rounded-lg font-quicksand">
                  Absensi Hari Ini Lengkap
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Live Evaluation Indicator */}
          <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm hover:border-orange-200/90 transition-all duration-300 group">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-orange-50 rounded-2xl text-orange-600 border border-orange-100">
                <Building className="w-6 h-6" />
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold font-quicksand">Indikator</span>
            </div>
            
            <div className="mt-4 flex-grow flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 font-quicksand">Evaluasi Waktu</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Jadwal: <span className="font-bold text-slate-700">{user.shift ? `${user.shift.name} (${formatTime(user.shift.clock_in)} - ${formatTime(user.shift.clock_out)})` : 'Shift Normal (09:00 - 17:00)'}</span>
                </p>
              </div>
              
              <div className="mt-4 pt-3 border-t border-orange-100">
                {attendanceState === 'needs_checkin' ? (
                  <div className="space-y-1">
                    <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider block font-quicksand">Estimasi Absen Masuk:</span>
                    <div>
                      <span className={`inline-flex px-2.5 py-0.5 rounded text-xs font-bold border ${getLiveCheckInStatus().colorClass} font-quicksand`}>
                        {getLiveCheckInStatus().text}
                      </span>
                    </div>
                  </div>
                ) : attendanceState === 'needs_checkout' ? (
                  <div className="space-y-1">
                    <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider block font-quicksand">Estimasi Absen Keluar:</span>
                    <div>
                      <span className={`inline-flex px-2.5 py-0.5 rounded text-xs font-bold border ${getLiveCheckOutStatus().colorClass} font-quicksand`}>
                        {getLiveCheckOutStatus().text}
                      </span>
                    </div>
                  </div>
                ) : attendanceState === 'completed' ? (
                  <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-center font-quicksand">
                    Absensi Hari Ini Selesai
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 animate-pulse font-semibold font-quicksand">Menghubungkan...</span>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Profile Details Card */}
      <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 pb-3 border-b border-orange-100 font-quicksand">
          <UserIcon className="w-5 h-5 text-red-500" /> Profil Akun Karyawan
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 uppercase font-bold font-quicksand">Nama Lengkap</span>
            <p className="text-sm font-bold text-slate-700 font-quicksand">{user.name}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-400 uppercase font-bold font-quicksand">Alamat Email</span>
            <p className="text-sm font-bold text-slate-700 font-quicksand">{user.email}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-400 uppercase font-bold font-quicksand">Jadwal Shift</span>
            <p className="text-sm font-bold text-slate-700 font-quicksand font-mono">
              {user.shift ? (
                `${user.shift.name} (${formatTime(user.shift.clock_in)} - ${formatTime(user.shift.clock_out)})`
              ) : (
                'Shift Normal (09:00 - 17:00)'
              )}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-400 uppercase font-bold font-quicksand">Tipe Akun</span>
            <p className="text-sm font-bold text-slate-700 font-quicksand">Akses Karyawan Umum</p>
          </div>
        </div>
      </section>
    </div>
  )
}
