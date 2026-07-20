import React from 'react'
import { X, Clock, Loader2, ShieldCheck } from 'lucide-react'
import { apiClient } from '../../../utils/api'

interface Attendance {
  id: number
  date: string
  clock_in: string | null
  clock_out: string | null
  shift_start_time?: string | null
  shift_end_time?: string | null
  user: {
    id: number
    name: string
    email: string
    photo?: string | null
    company?: string | null
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
  const [directors, setDirectors] = React.useState<any[]>([])
  const [, setLoadingDirector] = React.useState(false)

  React.useEffect(() => {
    if (show && attendance) {
      const fetchDirectors = async () => {
        setLoadingDirector(true)
        try {
          const res = await apiClient.get('/admin/directors')
          if (res.data.status === 'success') {
            setDirectors(res.data.data)
          }
        } catch (err) {
          console.error('Gagal mengambil data direktur:', err)
        } finally {
          setLoadingDirector(false)
        }
      }
      fetchDirectors()
    }
  }, [show, attendance])

  const getDirectorStatus = (lastSeenAt: string | null) => {
    if (!lastSeenAt) return { isOnline: false, text: 'Offline (Belum pernah aktif)' }
    const date = new Date(lastSeenAt)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 5) {
      return { isOnline: true, text: 'Sedang Aktif/Online' }
    }
    if (diffMins < 60) {
      return { isOnline: false, text: `Aktif ${diffMins} menit yang lalu` }
    }
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) {
      return { isOnline: false, text: `Aktif ${diffHours} jam yang lalu` }
    }
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) {
      return { isOnline: false, text: 'Aktif kemarin' }
    }
    return { isOnline: false, text: `Aktif ${diffDays} hari yang lalu` }
  }

  if (!show || !attendance) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-950/20 backdrop-blur-md animate-fade-in">
      <div className="bg-white border border-orange-100 rounded-3xl p-6 max-w-md w-full relative shadow-xl overflow-hidden animate-zoom-in">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>

        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2 font-quicksand">
            <Clock className="w-5 h-5 text-orange-500" /> Edit Jam Presensi
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-orange-50 rounded-lg transition-all cursor-pointer text-slate-400 hover:text-red-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="block text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1 font-mono">Nama Karyawan</span>
              <p className="text-sm font-bold text-slate-800">{attendance.user.name}</p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{attendance.user.email} &bull; Tanggal: {formatDate(attendance.date)}</p>
            </div>
          </div>

          {/* Director Status */}
          {directors.length > 0 && (
            <div className="space-y-2">
              <span className="block text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1 font-mono">Status Direksi</span>
              {directors.map((dir) => (
                <div key={dir.id} className="p-3 bg-gradient-to-br from-orange-50/50 to-red-50/20 border border-orange-100/50 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        {dir.name.charAt(0)}
                      </div>
                      <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white ${getDirectorStatus(dir.last_seen_at).isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-700">{dir.name}</p>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5 font-bold">Direktur &bull; {dir.company || 'Perusahaan'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${getDirectorStatus(dir.last_seen_at).isOnline ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-600 bg-slate-50 border-slate-200'}`}>
                      {getDirectorStatus(dir.last_seen_at).text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-quicksand">
              Jam Masuk (Check-In)
            </label>
            <div className="relative">
              <input
                type="time"
                step="1"
                value={editClockIn}
                onChange={(e) => setEditClockIn(e.target.value)}
                className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-mono"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Kosongkan kolom jika karyawan belum melakukan check-in hari itu.</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-quicksand">
              Jam Keluar (Check-Out)
            </label>
            <div className="relative">
              <input
                type="time"
                step="1"
                value={editClockOut}
                onChange={(e) => setEditClockOut(e.target.value)}
                className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-mono"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Kosongkan kolom jika karyawan belum melakukan check-out hari itu.</span>
          </div>

          {/* Status changes reminder */}
          <div className="p-3 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex items-start gap-2.5">
            <ShieldCheck className="w-4.5 h-4.5 text-orange-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-600 leading-normal">
              <strong>Catatan Otomatis:</strong> Setelah disimpan, server akan secara otomatis menghitung ulang status kehadiran (Normal, Terlambat, Lembur, dll.) sesuai regulasi waktu jam masuk/pulang perusahaan.
            </p>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-orange-50/50 border border-orange-100 hover:bg-orange-50 text-slate-600 rounded-xl transition-all cursor-pointer text-xs font-bold font-quicksand"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={updating}
              className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed font-quicksand"
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
