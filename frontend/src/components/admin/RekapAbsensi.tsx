import React from 'react'
import { Search, RefreshCw, Loader2, Eye, Clock } from 'lucide-react'

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

interface RekapAbsensiProps {
  attendanceLoading: boolean
  filteredAttendances: Attendance[]
  attendanceSearchQuery: string
  setAttendanceSearchQuery: (v: string) => void
  fetchAttendances: () => void
  formatDate: (d: string) => string
  getStatusBadge: (s: string | null) => React.ReactNode
  setSelectedAttendance: (a: Attendance) => void
  handleOpenEditModal: (a: Attendance) => void
}

export default function RekapAbsensi({
  attendanceLoading,
  filteredAttendances,
  attendanceSearchQuery,
  setAttendanceSearchQuery,
  fetchAttendances,
  formatDate,
  getStatusBadge,
  setSelectedAttendance,
  handleOpenEditModal,
}: RekapAbsensiProps) {
  return (
    <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-quicksand">
        <div>
          <h3 className="text-lg font-bold text-slate-800 font-quicksand">Log Seluruh Absensi</h3>
          <p className="text-xs text-slate-500 font-quicksand font-medium">Monitoring waktu, lokasi, foto, dan status absensi seluruh karyawan.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search / Filter Input */}
          <div className="relative max-w-xs w-full sm:w-80">
            <Search className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-slate-400" />
            <input
              type="text"
              placeholder="Cari karyawan, email, atau tanggal YYYY-MM-DD..."
              value={attendanceSearchQuery}
              onChange={(e) => setAttendanceSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-805 placeholder-slate-400 rounded-xl py-2.5 pl-9 pr-4 outline-none transition-all text-xs font-semibold"
            />
          </div>

          <button
            onClick={fetchAttendances}
            disabled={attendanceLoading}
            className="p-2.5 bg-white border border-slate-200 hover:border-red-500 text-slate-500 hover:text-red-500 rounded-xl transition-all cursor-pointer inline-flex items-center shrink-0 disabled:opacity-50 shadow-sm"
            title="Segarkan Log"
          >
            <RefreshCw className={`w-4 h-4 ${attendanceLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Attendances Table */}
      <div className="border border-orange-100 rounded-2xl overflow-hidden bg-orange-50/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-quicksand">
            <thead>
              <tr className="bg-orange-55/30 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-orange-100 font-quicksand">
                <th className="py-4 px-6">Karyawan</th>
                <th className="py-4 px-6">Tanggal</th>
                <th className="py-4 px-6">Clock-In (Masuk)</th>
                <th className="py-4 px-6">Clock-Out (Keluar)</th>
                <th className="py-4 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100 text-sm text-slate-600">
              {attendanceLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-450 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                      Memuat rekam absensi...
                    </div>
                  </td>
                </tr>
              ) : filteredAttendances.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-450 font-semibold">
                    {attendanceSearchQuery ? 'Data absensi tidak ditemukan.' : 'Belum ada data absensi tercatat.'}
                  </td>
                </tr>
              ) : (
                filteredAttendances.map((att) => (
                  <tr key={att.id} className="hover:bg-orange-50/10 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-extrabold text-slate-800 font-quicksand">{att.user.name}</p>
                        <p className="text-[11px] text-slate-450 font-medium mt-0.5">{att.user.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-extrabold text-slate-700 text-xs">
                      {formatDate(att.date)}
                    </td>
                    <td className="py-4 px-6">
                      {att.clock_in ? (
                        <div className="space-y-1">
                          <p className="font-mono text-xs font-bold text-slate-800">{att.clock_in}</p>
                          <div>{getStatusBadge(att.status_in)}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic font-semibold">Belum masuk</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {att.clock_out ? (
                        <div className="space-y-1">
                          <p className="font-mono text-xs font-bold text-slate-800">{att.clock_out}</p>
                          <div>{getStatusBadge(att.status_out)}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic font-semibold">Belum keluar</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedAttendance(att)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-red-500 text-slate-655 hover:text-red-500 rounded-xl text-xs font-bold transition-all cursor-pointer font-quicksand shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detail
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(att)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-orange-500 text-slate-655 hover:text-orange-600 rounded-xl text-xs font-bold transition-all cursor-pointer font-quicksand shadow-sm"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Edit Jam
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
