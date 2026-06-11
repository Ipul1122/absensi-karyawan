import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { 
  CalendarRange, 
  Loader2, 
  Check, 
  X, 
  Clock, 
  MapPin, 
  MessageSquare,
  Camera,
  CheckCircle2
} from 'lucide-react'

interface AttendanceRecord {
  id: number
  user_id: number
  date: string
  clock_in: string | null
  clock_out: string | null
  notes_in: string | null
  notes_out: string | null
  attendance_type: string
  approval_status: 'approved' | 'pending' | 'rejected'
  photo_in: string | null
  photo_out: string | null
  user: { id: number; name: string; email: string }
}

interface PersetujuanKehadiranProps { token: string }

const S = { fontFamily: "'Inter', 'system-ui', sans-serif" }

export default function PersetujuanKehadiran({ token }: PersetujuanKehadiranProps) {
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAttendances = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:8000/api/admin/attendances', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') setAttendances(response.data.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAttendances() }, [])

  const handleApprove = (id: number, name: string) => {
    Swal.fire({
      title: 'Setujui Koreksi Absensi?',
      html: `Setujui koreksi jam absen untuk <strong>${name}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Setujui',
      cancelButtonText: 'Batal'
    }).then(async result => {
      if (result.isConfirmed) {
        try {
          const res = await axios.put(`http://localhost:8000/api/director/attendances/${id}/approve`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (res.data.status === 'success') { Swal.fire('Berhasil!', res.data.message, 'success'); fetchAttendances() }
        } catch (err: any) { Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan.', 'error') }
      }
    })
  }

  const handleReject = (id: number, name: string) => {
    Swal.fire({
      title: 'Tolak Koreksi Absensi?',
      html: `Tolak koreksi jam absen untuk <strong>${name}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Tolak',
      cancelButtonText: 'Batal'
    }).then(async result => {
      if (result.isConfirmed) {
        try {
          const res = await axios.put(`http://localhost:8000/api/director/attendances/${id}/reject`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (res.data.status === 'success') { Swal.fire('Berhasil!', res.data.message, 'success'); fetchAttendances() }
        } catch (err: any) { Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan.', 'error') }
      }
    })
  }

  const pendingAttendances = attendances.filter(a => a.approval_status === 'pending')

  return (
    <div className="space-y-6" style={S}>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md"
              style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)' }}
            >
              <CalendarRange className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Persetujuan Koreksi Absensi</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Validasi data jam kehadiran manual yang diinput oleh admin</p>
            </div>
          </div>
          {pendingAttendances.length > 0 && (
            <div
              className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold"
              style={{ background: 'rgba(220,38,38,0.06)', borderColor: 'rgba(220,38,38,0.15)', color: '#dc2626' }}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              {pendingAttendances.length} koreksi absensi menunggu validasi Anda
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin mb-2" style={{ color: '#dc2626' }} />
            <p className="text-xs text-slate-400 font-medium">Memuat data koreksi absensi...</p>
          </div>
        ) : pendingAttendances.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-slate-400">Tidak ada koreksi pending</p>
            <p className="text-xs text-slate-300 font-medium mt-1">Semua data absensi telah divalidasi.</p>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-5">
            {pendingAttendances.map(record => (
              <div
                key={record.id}
                className="rounded-2xl border overflow-hidden"
                style={{ borderColor: 'rgba(220,38,38,0.20)' }}
              >
                {/* Card Header */}
                <div
                  className="px-5 py-4 flex items-center justify-between border-b"
                  style={{ background: 'rgba(220,38,38,0.05)', borderColor: 'rgba(220,38,38,0.12)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0"
                      style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)' }}
                    >
                      {record.user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{record.user?.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{record.user?.email}</p>
                    </div>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-xl text-[10px] font-black"
                    style={{ background: 'rgba(220,38,38,0.10)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.20)' }}
                  >
                    {new Date(record.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {/* Time Details */}
                <div className="px-5 py-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-3 border" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Clock className="w-3 h-3 text-emerald-500" />
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Absen Masuk</span>
                    </div>
                    <p className="text-sm font-black text-slate-800">{record.clock_in || '-'}</p>
                    {record.photo_in && (
                      <a href={`http://localhost:8000${record.photo_in}`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:underline mt-1.5">
                        <Camera className="w-3 h-3" /> Foto Masuk
                      </a>
                    )}
                  </div>
                  <div className="rounded-xl p-3 border" style={{ background: '#fff7f7', borderColor: '#fecaca' }}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Clock className="w-3 h-3 text-red-400" />
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">Absen Pulang</span>
                    </div>
                    <p className="text-sm font-black text-slate-800">{record.clock_out || '-'}</p>
                    {record.photo_out && (
                      <a href={`http://localhost:8000${record.photo_out}`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-[10px] font-bold text-red-500 hover:underline mt-1.5">
                        <Camera className="w-3 h-3" /> Foto Pulang
                      </a>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div className="px-5 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    Metode: <span className="font-bold text-slate-700 capitalize">{record.attendance_type?.replace('_', ' ')}</span>
                  </div>
                  {(record.notes_in || record.notes_out) && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        {record.notes_in || record.notes_out}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-5 py-4 flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 mt-4">
                  <button
                    onClick={() => handleReject(record.id, record.user?.name)}
                    className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Tolak
                  </button>
                  <button
                    onClick={() => handleApprove(record.id, record.user?.name)}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 cursor-pointer shadow-sm"
                    style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
                  >
                    <Check className="w-3.5 h-3.5" /> Setujui Koreksi
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
