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
        <section className="md:col-span-5 bg-gradient-to-tr from-slate-900/60 to-slate-900/20 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-violet-500/10 rounded-2xl text-violet-400 border border-violet-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-quicksand">
              Waktu Online
            </span>
          </div>
          
          <div className="my-4">
            <h2 className="text-4xl font-extrabold tracking-tight text-white font-mono">
              {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </h2>
            <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-1 font-bold font-quicksand">
              <Calendar className="w-4 h-4 text-slate-500" />
              {formatDate(time)}
            </p>
          </div>
          
          <div className="border-t border-slate-800/60 pt-3 text-xs text-slate-500 font-bold flex items-center gap-1 font-quicksand">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin duration-3000" />
            {getGreeting()}, {user.name.split(' ')[0]}!
          </div>
        </section>

        {/* Info & Status Cards */}
        <section className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* Card 1: Attendance status */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between hover:border-slate-700/60 transition-all group">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
                <UserCheck className="w-6 h-6" />
              </div>
              <span className="text-[10px] text-slate-550 uppercase tracking-widest font-bold font-quicksand">Hari Ini</span>
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-extrabold text-slate-200 font-quicksand">Status Kehadiran</h3>
              <p className="text-xs text-slate-400 mt-1">Status Anda pada tanggal hari ini.</p>
              
              <div className="mt-3 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Masuk:</span>
                  {todayAttendance?.clock_in ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white font-mono">{todayAttendance.clock_in}</span>
                      {getStatusBadge(todayAttendance.status_in)}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic font-semibold">Belum Absen</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Keluar:</span>
                  {todayAttendance?.clock_out ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white font-mono">{todayAttendance.clock_out}</span>
                      {getStatusBadge(todayAttendance.status_out)}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic font-semibold">Belum Absen</span>
                  )}
                </div>
              </div>
            </div>

            {/* Interactive button to go to the Absen page */}
            <div className="mt-5 pt-3 border-t border-slate-800/40">
              {attendanceState === 'needs_checkin' ? (
                <button
                  id="btn-goto-absen-in"
                  onClick={() => navigate('/employee/absen')}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 cursor-pointer font-quicksand"
                >
                  Lakukan Absen Masuk <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : attendanceState === 'needs_checkout' ? (
                <button
                  id="btn-goto-absen-out"
                  onClick={() => navigate('/employee/absen')}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 cursor-pointer font-quicksand"
                >
                  Lakukan Absen Keluar <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="text-center text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-1.5 px-3 rounded-lg font-quicksand">
                  Absensi Hari Ini Lengkap
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Live Evaluation Indicator */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between hover:border-slate-700/60 transition-all group">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
                <Building className="w-6 h-6" />
              </div>
              <span className="text-[10px] text-slate-550 uppercase tracking-widest font-bold font-quicksand">Indikator</span>
            </div>
            
            <div className="mt-4 flex-grow flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-200 font-quicksand">Evaluasi Waktu</h3>
                <p className="text-xs text-slate-400 mt-1">Status jika Anda mengirim absensi sekarang:</p>
              </div>
              
              <div className="mt-4 pt-3 border-t border-slate-800/40">
                {attendanceState === 'needs_checkin' ? (
                  <div className="space-y-1">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block font-quicksand">Estimasi Absen Masuk:</span>
                    <div>
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold border ${getLiveCheckInStatus().colorClass} font-quicksand`}>
                        {getLiveCheckInStatus().text}
                      </span>
                    </div>
                  </div>
                ) : attendanceState === 'needs_checkout' ? (
                  <div className="space-y-1">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block font-quicksand">Estimasi Absen Keluar:</span>
                    <div>
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold border ${getLiveCheckOutStatus().colorClass} font-quicksand`}>
                        {getLiveCheckOutStatus().text}
                      </span>
                    </div>
                  </div>
                ) : attendanceState === 'completed' ? (
                  <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl text-center font-quicksand">
                    Absensi Hari Ini Selesai
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 animate-pulse font-quicksand">Menghubungkan...</span>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Profile Details Card */}
      <section className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl">
        <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2 pb-3 border-b border-slate-800/60 font-quicksand">
          <UserIcon className="w-5 h-5 text-indigo-400" /> Profil Akun Karyawan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <span className="text-xs text-slate-550 uppercase font-bold font-quicksand">Nama Lengkap</span>
            <p className="text-sm font-bold text-slate-350 font-quicksand">{user.name}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-550 uppercase font-bold font-quicksand">Alamat Email</span>
            <p className="text-sm font-bold text-slate-350 font-quicksand">{user.email}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-550 uppercase font-bold font-quicksand">Tipe Akun</span>
            <p className="text-sm font-bold text-slate-350 font-quicksand">Akses Karyawan Umum</p>
          </div>
        </div>
      </section>
    </div>
  )
}
