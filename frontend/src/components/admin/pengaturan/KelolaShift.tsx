import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { Plus, Edit2, Trash2, Clock, Loader2, X } from 'lucide-react'
import { API_BASE_URL } from '../../../utils/api'

interface Shift {
  id: number
  name: string
  start_time: string
  end_time: string
  grace_period: number
}

interface KelolaShiftProps {
  token: string
}

export default function KelolaShift({ token }: KelolaShiftProps) {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [gracePeriod, setGracePeriod] = useState(15)

  const fetchShifts = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/api/shifts`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setShifts(response.data.data)
      }
    } catch (err) {
      console.error('Gagal mengambil daftar shift:', err)
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Gagal mengambil data shift dari server.',
        confirmButtonColor: '#ea580c'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShifts()
  }, [])

  const handleOpenAdd = () => {
    setName('')
    setStartTime('09:00')
    setEndTime('17:00')
    setGracePeriod(15)
    setEditMode(false)
    setSelectedId(null)
    setShowModal(true)
  }

  const handleOpenEdit = (shift: Shift) => {
    setName(shift.name)
    setStartTime(shift.start_time.substring(0, 5))
    setEndTime(shift.end_time.substring(0, 5))
    setGracePeriod(shift.grace_period)
    setEditMode(true)
    setSelectedId(shift.id)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSubmitting(true)
    try {
      const payload = {
        name,
        start_time: startTime,
        end_time: endTime,
        grace_period: gracePeriod
      }

      let response
      if (editMode && selectedId) {
        response = await axios.put(
          `${API_BASE_URL}/api/admin/shifts/${selectedId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } else {
        response = await axios.post(
          `${API_BASE_URL}/api/admin/shifts`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }

      if (response.data.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: editMode ? 'Shift berhasil diperbarui.' : 'Shift baru berhasil dibuat.',
          timer: 1500,
          showConfirmButton: false
        })
        setShowModal(false)
        fetchShifts()
      }
    } catch (err: any) {
      console.error('Gagal memproses shift:', err)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Terjadi kesalahan saat memproses data.',
        confirmButtonColor: '#ea580c'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number, shiftName: string) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: `Menghapus shift "${shiftName}" akan berdampak pada riwayat absen terkait jika menggunakan shift ini.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#cbd5e1',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    })

    if (result.isConfirmed) {
      try {
        const response = await axios.delete(`${API_BASE_URL}/api/admin/shifts/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (response.data.status === 'success') {
          Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: 'Shift berhasil dihapus.',
            timer: 1500,
            showConfirmButton: false
          })
          fetchShifts()
        }
      } catch (err: any) {
        console.error('Gagal menghapus shift:', err)
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: err.response?.data?.message || 'Gagal menghapus shift kerja.',
          confirmButtonColor: '#ea580c'
        })
      }
    }
  }

  return (
    <div className="space-y-6 font-quicksand">
      {/* Description header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-orange-50/15 p-5 border border-orange-100/60 rounded-3xl">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-quicksand">
            <Clock className="w-4 h-4 text-orange-500" />
            Pengaturan Shift Kerja Karyawan
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-2xl font-quicksand">
            Tentukan daftar shift resmi perusahaan (Pagi, Siang, Sore, Malam). Karyawan akan memilih kategori shift ini saat melakukan absen masuk, sehingga sistem menghitung status kehadiran sesuai jam kerja shift tersebut secara otomatis.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-650 hover:to-orange-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-red-500/10 cursor-pointer self-start sm:self-center hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Tambah Shift
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-orange-50/20 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-orange-50/60">
                <th className="py-4 px-6">Nama Shift</th>
                <th className="py-4 px-6">Jam Masuk</th>
                <th className="py-4 px-6">Jam Selesai</th>
                <th className="py-4 px-6">Toleransi (Menit)</th>
                <th className="py-4 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-650 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                      <span className="font-bold">Memuat daftar shift...</span>
                    </div>
                  </td>
                </tr>
              ) : shifts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-bold">
                    Belum ada shift yang terdaftar. Silakan buat shift baru.
                  </td>
                </tr>
              ) : (
                shifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-extrabold text-slate-800">
                      {shift.name}
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-slate-700">
                      {shift.start_time.substring(0, 5)}
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-slate-700">
                      {shift.end_time.substring(0, 5)}
                    </td>
                    <td className="py-4 px-6 text-slate-700">
                      {shift.grace_period} menit
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(shift)}
                          className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all cursor-pointer"
                          title="Edit Shift"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(shift.id, shift.name)}
                          className="p-1.5 text-slate-500 hover:text-red-650 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                          title="Hapus Shift"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-950/20 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white border border-orange-100 rounded-3xl p-6 max-w-md w-full relative shadow-xl overflow-hidden animate-zoom-in my-8">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-red-500 via-orange-500 to-transparent"></div>

            {/* Header */}
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-orange-50">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-orange-500" />
                {editMode ? 'Edit Shift Kerja' : 'Tambah Shift Kerja Baru'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nama Shift
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Shift Siang, Shift Malam"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Jam Masuk
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Jam Keluar
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Toleransi Keterlambatan (Menit)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none text-xs font-semibold"
                />
              </div>

              {/* Footer */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-orange-50 mt-5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl transition-all cursor-pointer text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-650 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Simpan Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
