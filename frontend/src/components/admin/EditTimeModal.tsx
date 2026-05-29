import React from 'react'
import { X, Clock, Loader2, ShieldCheck } from 'lucide-react'

interface Attendance {
  id: number
  date: string
  clock_in: string | null
  clock_out: string | null
  user: {
    id: number
    name: string
    email: string
  }
}

interface EditTimeModalProps {
  show: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  attendance: Attendance | null
  editClockIn: string
  setEditClockIn: (v: string) => void
  editClockOut: string
  setEditClockOut: (v: string) => void
  updating: boolean
  formatDate: (d: string) => string
}

export default function EditTimeModal({
  show,
  onClose,
  onSubmit,
  attendance,
  editClockIn,
  setEditClockIn,
  editClockOut,
  setEditClockOut,
  updating,
  formatDate,
}: EditTimeModalProps) {
  if (!show || !attendance) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full relative shadow-2xl overflow-hidden animate-zoom-in">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>

        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-extrabold text-white flex items-center gap-2 font-quicksand">
            <Clock className="w-5 h-5 text-amber-400" /> Edit Jam Presensi
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-850 rounded-lg transition-all cursor-pointer text-slate-450 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <span className="block text-[10px] uppercase text-slate-550 font-bold tracking-wider mb-1 font-mono">Nama Karyawan</span>
            <p className="text-sm font-bold text-slate-200">{attendance.user.name}</p>
            <p className="text-xs text-slate-450 font-mono mt-0.5">{attendance.user.email} &bull; Tanggal: {formatDate(attendance.date)}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-quicksand">
              Jam Masuk (Check-In)
            </label>
            <div className="relative">
              <input
                type="time"
                step="1"
                value={editClockIn}
                onChange={(e) => setEditClockIn(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-amber-500 text-white rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-mono"
              />
            </div>
            <span className="text-[10px] text-slate-550 mt-1 block">Kosongkan kolom jika karyawan belum melakukan check-in hari itu.</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-quicksand">
              Jam Keluar (Check-Out)
            </label>
            <div className="relative">
              <input
                type="time"
                step="1"
                value={editClockOut}
                onChange={(e) => setEditClockOut(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-amber-500 text-white rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-mono"
              />
            </div>
            <span className="text-[10px] text-slate-550 mt-1 block">Kosongkan kolom jika karyawan belum melakukan check-out hari itu.</span>
          </div>

          {/* Status changes reminder */}
          <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-2.5">
            <ShieldCheck className="w-4.5 h-4.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-400 leading-normal">
              <strong>Catatan Otomatis:</strong> Setelah disimpan, server akan secara otomatis menghitung ulang status kehadiran (Normal, Terlambat, Lembur, dll.) sesuai regulasi waktu jam masuk/pulang perusahaan.
            </p>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-950 border border-slate-850 hover:bg-slate-800 text-slate-355 hover:text-white rounded-xl transition-all cursor-pointer text-xs font-bold font-quicksand"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={updating}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl transition-all shadow-md shadow-amber-600/20 cursor-pointer text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed font-quicksand"
            >
              {updating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Jam'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
