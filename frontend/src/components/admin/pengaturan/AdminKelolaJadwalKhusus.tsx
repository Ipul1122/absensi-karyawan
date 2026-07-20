import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { Calendar, Plus, Trash2, Search, Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface ScheduleOverride {
  id: number
  user_id: number
  override_date: string
  status: 'work_day' | 'day_off'
  reason: string | null
  user?: {
    id: number
    name: string
    email: string
    employee_number: string
    division: string
  }
  creator?: {
    id: number
    name: string
  }
}

interface Employee {
  id: number
  name: string
  employee_number: string
  division: string
}

interface AdminKelolaJadwalKhususProps {
  token: string
}

export default function AdminKelolaJadwalKhusus({ token }: AdminKelolaJadwalKhususProps) {
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  
  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  
  // Form State
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [overrideDate, setOverrideDate] = useState<string>('')
  const [overrideStatus, setOverrideStatus] = useState<'work_day' | 'day_off'>('work_day')
  const [reason, setReason] = useState<string>('')

  const headers = { Authorization: `Bearer ${token}` }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [overridesRes, empRes] = await Promise.allSettled([
        axios.get('http://localhost:8000/api/admin/schedule-overrides', { headers }),
        axios.get('http://localhost:8000/api/employees', { headers })
      ])

      if (overridesRes.status === 'fulfilled' && overridesRes.value.data.status === 'success') {
        setOverrides(overridesRes.value.data.data)
      }

      if (empRes.status === 'fulfilled' && empRes.value.data.status === 'success') {
        setEmployees(empRes.value.data.data)
      }
    } catch (err) {
      console.error('Gagal mengambil data penyesuaian jadwal:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [token])

  const handleCreateOverride = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedUserId) {
      Swal.fire({ title: 'Pilih Karyawan', text: 'Silakan pilih karyawan terlebih dahulu.', icon: 'warning' })
      return
    }
    if (!overrideDate) {
      Swal.fire({ title: 'Pilih Tanggal', text: 'Silakan pilih tanggal spesifik.', icon: 'warning' })
      return
    }

    setSubmitting(true)
    try {
      const res = await axios.post(
        'http://localhost:8000/api/admin/schedule-overrides',
        {
          user_id: parseInt(selectedUserId, 10),
          override_date: overrideDate,
          status: overrideStatus,
          reason: reason.trim() || null
        },
        { headers }
      )

      if (res.data.status === 'success') {
        Swal.fire({
          title: 'Berhasil!',
          text: res.data.message,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        })
        setShowModal(false)
        setSelectedUserId('')
        setOverrideDate('')
        setReason('')
        fetchData()
      }
    } catch (err: any) {
      console.error('Gagal menyimpan penyesuaian jadwal:', err)
      const msg = err.response?.data?.message || 'Gagal menyimpan penyesuaian jadwal.'
      Swal.fire({ title: 'Gagal', text: msg, icon: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteOverride = async (id: number, empName?: string, dateStr?: string) => {
    const confirm = await Swal.fire({
      title: 'Hapus Penyesuaian?',
      text: `Penyesuaian jadwal untuk ${empName || 'karyawan'} pada tanggal ${dateStr || ''} akan dihapus dan kembali ke jadwal standar.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    })

    if (!confirm.isConfirmed) return

    try {
      const res = await axios.delete(`http://localhost:8000/api/admin/schedule-overrides/${id}`, { headers })
      if (res.data.status === 'success') {
        Swal.fire({
          title: 'Terhapus!',
          text: res.data.message,
          icon: 'success',
          timer: 1800,
          showConfirmButton: false
        })
        fetchData()
      }
    } catch (err: any) {
      console.error('Gagal menghapus penyesuaian jadwal:', err)
      Swal.fire({ title: 'Gagal', text: 'Gagal menghapus penyesuaian jadwal.', icon: 'error' })
    }
  }

  const filteredOverrides = overrides.filter((item) => {
    const empName = item.user?.name || ''
    const empNum = item.user?.employee_number || ''
    const reasonText = item.reason || ''
    const query = searchTerm.toLowerCase()
    return empName.toLowerCase().includes(query) || empNum.toLowerCase().includes(query) || reasonText.toLowerCase().includes(query)
  })

  return (
    <div className="space-y-6 animate-fade-in font-quicksand">
      {/* Header Section */}
      <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl text-white shadow-md shadow-red-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 font-quicksand">Penyesuaian Jadwal Khusus Per Tanggal</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl font-quicksand">
            Atur status Wajib Masuk atau Libur Khusus untuk karyawan tertentu pada tanggal spesifik tanpa merubah pola jadwal mingguan dan tanpa mengganggu riwayat lalu.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-xs font-bold rounded-2xl shadow-md shadow-red-500/20 transition-all cursor-pointer shrink-0 self-start md:self-center"
        >
          <Plus className="w-4 h-4" />
          + Tambah Penyesuaian Jadwal
        </button>
      </div>

      {/* Content Section */}
      <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2 border-b border-orange-50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama / NIK karyawan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-red-400 focus:ring-1 focus:ring-red-100 rounded-xl py-2 pl-9 pr-4 text-xs font-bold outline-none text-slate-700 font-quicksand"
            />
          </div>
          <div className="text-xs text-slate-400 font-bold">
            Total {filteredOverrides.length} penyesuaian terdaftar
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-orange-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider bg-orange-50/30">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Karyawan</th>
                <th className="py-3 px-4">Status Override</th>
                <th className="py-3 px-4">Alasan / Catatan</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50 text-xs font-bold text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                      Memuat data penyesuaian jadwal...
                    </div>
                  </td>
                </tr>
              ) : filteredOverrides.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400 italic">
                    Belum ada penyesuaian jadwal khusus per tanggal yang ditambahkan.
                  </td>
                </tr>
              ) : (
                filteredOverrides.map((item) => {
                  const formattedDate = new Date(item.override_date).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })

                  return (
                    <tr key={item.id} className="hover:bg-orange-50/20 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {formattedDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{item.user?.name || '-'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          NIK: {item.user?.employee_number || '-'} • {item.user?.division || '-'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.status === 'work_day' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Wajib Masuk (Hari Kerja)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 border border-rose-200 text-rose-700 shadow-xs">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Libur Khusus (Day Off)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 italic">
                        {item.reason || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDeleteOverride(item.id, item.user?.name, formattedDate)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                          title="Hapus Penyesuaian"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl border border-orange-100 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-orange-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-bold text-slate-800">Tambah Penyesuaian Jadwal Khusus</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOverride} className="space-y-4 text-xs font-bold text-slate-700">
              {/* Select Employee */}
              <div className="space-y-1">
                <label className="block text-slate-600">Pilih Karyawan *</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:border-red-400 focus:ring-1 focus:ring-red-100 rounded-xl p-2.5 outline-none font-quicksand cursor-pointer"
                >
                  <option value="">-- Pilih Karyawan --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employee_number || 'No NIK'} - {emp.division || 'Umum'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Date */}
              <div className="space-y-1">
                <label className="block text-slate-600">Tanggal Spesifik *</label>
                <input
                  type="date"
                  value={overrideDate}
                  onChange={(e) => setOverrideDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:border-red-400 focus:ring-1 focus:ring-red-100 rounded-xl p-2.5 outline-none font-quicksand cursor-pointer"
                />
              </div>

              {/* Select Status */}
              <div className="space-y-1.5">
                <label className="block text-slate-600">Status Penyesuaian Hari *</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    onClick={() => setOverrideStatus('work_day')}
                    className={`flex items-center gap-2 p-3 rounded-2xl border cursor-pointer transition-all ${
                      overrideStatus === 'work_day'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      checked={overrideStatus === 'work_day'}
                      onChange={() => setOverrideStatus('work_day')}
                      className="accent-emerald-600 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold">🟢 Wajib Masuk</div>
                      <div className="text-[10px] text-slate-500 font-normal">Hari Kerja Wajib</div>
                    </div>
                  </label>

                  <label
                    onClick={() => setOverrideStatus('day_off')}
                    className={`flex items-center gap-2 p-3 rounded-2xl border cursor-pointer transition-all ${
                      overrideStatus === 'day_off'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      checked={overrideStatus === 'day_off'}
                      onChange={() => setOverrideStatus('day_off')}
                      className="accent-rose-600 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold">🔴 Libur Khusus</div>
                      <div className="text-[10px] text-slate-500 font-normal">Karyawan Libur</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Reason / Notes */}
              <div className="space-y-1">
                <label className="block text-slate-600">Alasan / Catatan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Lembur Proyek A / Tukar Libur / Tugas Lapangan"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-red-400 focus:ring-1 focus:ring-red-100 rounded-xl p-2.5 outline-none font-quicksand"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl shadow-md shadow-red-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Simpan Penyesuaian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
