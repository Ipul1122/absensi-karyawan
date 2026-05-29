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
        <div className="bg-white border border-orange-100 rounded-3xl p-6 flex items-center gap-4 hover:border-orange-200 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="p-4 bg-red-50 rounded-2xl text-red-500 border border-red-100">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-quicksand">Total Karyawan</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">
              {loading ? (
                <span className="inline-block w-8 h-8 rounded bg-slate-100 animate-pulse"></span>
              ) : (
                employeesCount
              )}
            </h3>
          </div>
        </div>

        {/* Stat 2: Absensi Hari Ini */}
        <div className="bg-white border border-orange-100 rounded-3xl p-6 flex items-center gap-4 hover:border-orange-200 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-quicksand">Absensi Hari Ini</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">
              {attendanceLoading ? (
                <span className="inline-block w-8 h-8 rounded bg-slate-100 animate-pulse"></span>
              ) : (
                presentTodayCount
              )}
            </h3>
          </div>
        </div>

        {/* Stat 3: Kehadiran Normal */}
        <div className="bg-white border border-orange-100 rounded-3xl p-6 flex items-center gap-4 hover:border-orange-200 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="p-4 bg-orange-50 rounded-2xl text-orange-655 border border-orange-100">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-quicksand">Normal Hari Ini</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">
              {attendanceLoading ? (
                <span className="inline-block w-8 h-8 rounded bg-slate-100 animate-pulse"></span>
              ) : (
                normalTodayCount
              )}
            </h3>
          </div>
        </div>
      </div>

      {/* List Kehadiran Hari Ini */}
      <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 font-quicksand flex items-center gap-2">
            Siapa Yang Hadir Hari Ini?
          </h3>
          <p className="text-xs text-slate-500 font-quicksand mt-1">Daftar kehadiran real-time karyawan pada tanggal hari ini ({formatDate(todayStr)}).</p>
        </div>

        <div className="border border-orange-100 rounded-2xl overflow-hidden bg-orange-50/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-quicksand">
              <thead>
                <tr className="bg-orange-55/30 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-orange-100 font-quicksand">
                  <th className="py-4 px-6">Nama Karyawan</th>
                  <th className="py-4 px-6">Jam Masuk (Check-In)</th>
                  <th className="py-4 px-6">Status Masuk</th>
                  <th className="py-4 px-6">Jam Keluar (Check-Out)</th>
                  <th className="py-4 px-6 text-center">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100 text-sm text-slate-600">
                {attendanceLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-450 font-semibold">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                        Memuat data kehadiran...
                      </div>
                    </td>
                  </tr>
                ) : presentTodayList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-450 font-semibold italic">
                      Belum ada karyawan yang mencatat kehadiran hari ini.
                    </td>
                  </tr>
                ) : (
                  presentTodayList.map((att) => (
                    <tr key={att.id} className="hover:bg-orange-50/10 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-extrabold text-slate-800 font-quicksand">{att.user.name}</p>
                          <p className="text-[10px] text-slate-450 font-medium mt-0.5">{att.user.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-slate-800">{att.clock_in}</td>
                      <td className="py-4 px-6">{getStatusBadge(att.status_in)}</td>
                      <td className="py-4 px-6 font-mono font-bold text-slate-800">
                        {att.clock_out ? att.clock_out : (
                          <span className="text-[11px] text-slate-400 font-semibold italic">Belum check-out</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => setSelectedAttendance(att)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-red-500 text-slate-655 hover:text-red-500 rounded-lg text-xs font-bold transition-all cursor-pointer font-quicksand shadow-sm"
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
