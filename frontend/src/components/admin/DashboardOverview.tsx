import React from 'react'
import { Users, CheckCircle2, Clock, Loader2, Eye } from 'lucide-react'

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
  user: {
    id: number
    name: string
    email: string
  }
}

interface DashboardOverviewProps {
  loading: boolean
  attendanceLoading: boolean
  employeesCount: number
  presentTodayCount: number
  normalTodayCount: number
  presentTodayList: Attendance[]
  formatDate: (d: string) => string
  getStatusBadge: (s: string | null) => React.ReactNode
  setSelectedAttendance: (a: Attendance) => void
  todayStr: string
}

export default function DashboardOverview({
  loading,
  attendanceLoading,
  employeesCount,
  presentTodayCount,
  normalTodayCount,
  presentTodayList,
  formatDate,
  getStatusBadge,
  setSelectedAttendance,
  todayStr,
}: DashboardOverviewProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Widget Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Stat 1: Total Karyawan */}
        <div className="bg-slate-900/40 border border-slate-800/85 rounded-3xl p-6 flex items-center gap-4 hover:border-slate-750 transition-all">
          <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Karyawan</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">
              {loading ? (
                <span className="inline-block w-8 h-8 rounded bg-slate-800 animate-pulse"></span>
              ) : (
                employeesCount
              )}
            </h3>
          </div>
        </div>

        {/* Stat 2: Absensi Hari Ini */}
        <div className="bg-slate-900/40 border border-slate-800/85 rounded-3xl p-6 flex items-center gap-4 hover:border-slate-750 transition-all">
          <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Absensi Hari Ini</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">
              {attendanceLoading ? (
                <span className="inline-block w-8 h-8 rounded bg-slate-800 animate-pulse"></span>
              ) : (
                presentTodayCount
              )}
            </h3>
          </div>
        </div>

        {/* Stat 3: Kehadiran Normal */}
        <div className="bg-slate-900/40 border border-slate-800/85 rounded-3xl p-6 flex items-center gap-4 hover:border-slate-750 transition-all">
          <div className="p-4 bg-violet-500/10 rounded-2xl text-violet-400 border border-violet-500/20">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Normal Hari Ini</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">
              {attendanceLoading ? (
                <span className="inline-block w-8 h-8 rounded bg-slate-800 animate-pulse"></span>
              ) : (
                normalTodayCount
              )}
            </h3>
          </div>
        </div>
      </div>

      {/* List Kehadiran Hari Ini */}
      <section className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-200 font-quicksand flex items-center gap-2">
            <span className=""></span>
            Siapa Yang Hadir Hari Ini?
          </h3>
          <p className="text-xs text-slate-400 font-quicksand mt-1">Daftar kehadiran real-time karyawan pada tanggal hari ini ({formatDate(todayStr)}).</p>
        </div>

        <div className="border border-slate-800/60 rounded-2xl overflow-hidden bg-slate-950/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/60 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800/80 font-quicksand">
                  <th className="py-4 px-6">Nama Karyawan</th>
                  <th className="py-4 px-6">Jam Masuk (Check-In)</th>
                  <th className="py-4 px-6">Status Masuk</th>
                  <th className="py-4 px-6">Jam Keluar (Check-Out)</th>
                  <th className="py-4 px-6 text-center">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm text-slate-350">
                {attendanceLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 font-semibold">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                        Memuat data kehadiran...
                      </div>
                    </td>
                  </tr>
                ) : presentTodayList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 font-semibold italic">
                      Belum ada karyawan yang mencatat kehadiran hari ini.
                    </td>
                  </tr>
                ) : (
                  presentTodayList.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-900/10 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-semibold text-slate-200 font-quicksand">{att.user.name}</p>
                          <p className="text-[10px] text-slate-550 font-mono mt-0.5">{att.user.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-slate-300">{att.clock_in}</td>
                      <td className="py-4 px-6">{getStatusBadge(att.status_in)}</td>
                      <td className="py-4 px-6 font-mono font-bold text-slate-300">
                        {att.clock_out ? att.clock_out : (
                          <span className="text-[11px] text-slate-500 font-semibold italic">Belum check-out</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => setSelectedAttendance(att)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-950 border border-slate-850 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 rounded-lg text-xs font-bold transition-all cursor-pointer font-quicksand"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Lihat
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
