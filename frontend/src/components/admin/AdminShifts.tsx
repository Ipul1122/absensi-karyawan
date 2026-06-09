import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { Plus, Edit2, Trash2, Clock, ShieldCheck, Loader2 } from 'lucide-react'

interface Shift {
  id: number
  name: string
  clock_in: string
  clock_out: string
  early_checkin_before: string
  late_checkin_after: string
  early_checkout_before: string
  overtime_checkout_after: string
  users_count?: number
}

interface AdminShiftsProps {
  token: string
  onRefreshEmployees?: () => void
}

export default function AdminShifts({ token, onRefreshEmployees }: AdminShiftsProps) {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [clockIn, setClockIn] = useState('09:00')
  const [clockOut, setClockOut] = useState('17:00')
  const [earlyCheckinBefore, setEarlyCheckinBefore] = useState('08:30')
  const [lateCheckinAfter, setLateCheckinAfter] = useState('09:00')
  const [earlyCheckoutBefore, setEarlyCheckoutBefore] = useState('17:00')
  const [overtimeCheckoutAfter, setOvertimeCheckoutAfter] = useState('18:00')
  const [submitting, setSubmitting] = useState(false)

  const fetchShifts = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:8000/api/admin/shifts', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setShifts(response.data.data)
      }
    } catch (err: any) {
      console.error(err)
      Swal.fire({
        title: 'Gagal Memuat Shift',
        text: 'Tidak dapat menghubungkan ke server API.',
        icon: 'error',
        background: '#fffdfb',
        color: '#3c1105',
        confirmButtonColor: '#ef4444'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShifts()
  }, [])

  const handleOpenAddModal = () => {
    setEditingShift(null)
    setName('')
    setClockIn('09:00')
    setClockOut('17:00')
    setEarlyCheckinBefore('08:30')
    setLateCheckinAfter('09:00')
    setEarlyCheckoutBefore('17:00')
    setOvertimeCheckoutAfter('18:00')
    setShowModal(true)
  }

  const handleOpenEditModal = (shift: Shift) => {
    setEditingShift(shift)
    setName(shift.name)
    setClockIn(shift.clock_in.substring(0, 5))
    setClockOut(shift.clock_out.substring(0, 5))
    setEarlyCheckinBefore(shift.early_checkin_before.substring(0, 5))
    setLateCheckinAfter(shift.late_checkin_after.substring(0, 5))
    setEarlyCheckoutBefore(shift.early_checkout_before.substring(0, 5))
    setOvertimeCheckoutAfter(shift.overtime_checkout_after.substring(0, 5))
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) {
      Swal.fire({ title: 'Nama Shift Wajib Diisi', icon: 'warning', confirmButtonColor: '#ef4444' })
      return
    }

    setSubmitting(true)
    try {
      const data = {
        name,
        clock_in: clockIn,
        clock_out: clockOut,
        early_checkin_before: earlyCheckinBefore,
        late_checkin_after: lateCheckinAfter,
        early_checkout_before: earlyCheckoutBefore,
        overtime_checkout_after: overtimeCheckoutAfter
      }

      let response;
      if (editingShift) {
        response = await axios.put(`http://localhost:8000/api/admin/shifts/${editingShift.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } else {
        response = await axios.post('http://localhost:8000/api/admin/shifts', data, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }

      if (response.data.status === 'success') {
        Swal.fire({
          title: 'Berhasil!',
          text: response.data.message || 'Shift berhasil disimpan.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: '#fffdfb',
          color: '#3c1105'
        })
        setShowModal(false)
        fetchShifts()
        if (onRefreshEmployees) {
          onRefreshEmployees()
        }
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal memproses shift.'
      Swal.fire({
        title: 'Gagal Menyimpan',
        text: msg,
        icon: 'error',
        confirmButtonColor: '#ef4444'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (id: number, name: string) => {
    Swal.fire({
      title: 'Hapus Shift?',
      text: `Apakah Anda yakin ingin menghapus "${name}"? Tindakan ini tidak dapat dibatalkan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      background: '#fffdfb',
      color: '#3c1105'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(`http://localhost:8000/api/admin/shifts/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (response.data.status === 'success') {
            Swal.fire({
              title: 'Dihapus!',
              text: 'Shift berhasil dihapus.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
              background: '#fffdfb',
              color: '#3c1105'
            })
            fetchShifts()
            if (onRefreshEmployees) {
              onRefreshEmployees()
            }
          }
        } catch (err: any) {
          console.error(err)
          const msg = err.response?.data?.message || 'Gagal menghapus shift ini.'
          Swal.fire({
            title: 'Gagal Menghapus',
            text: msg,
            icon: 'error',
            confirmButtonColor: '#ef4444'
          })
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-orange-100 p-6 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-800 font-quicksand">Konfigurasi Shift Jam Kerja</h2>
          <p className="text-xs text-slate-500 mt-1">Kelola jam masuk, jam pulang, batas toleransi terlambat, dan lembur karyawan.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-650 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-md shadow-red-500/10 cursor-pointer text-xs flex items-center gap-2 font-quicksand"
        >
          <Plus className="w-4 h-4" /> Tambah Shift Baru
        </button>
      </div>

      {/* Shifts Table */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white border border-orange-100 rounded-3xl shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </div>
      ) : shifts.length === 0 ? (
        <div className="bg-white border border-orange-100 p-12 rounded-3xl text-center shadow-sm">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-700 font-quicksand">Belum Ada Shift Kerja</h4>
          <p className="text-xs text-slate-400 mt-1">Silakan tambahkan shift kerja pertama Anda dengan tombol di atas.</p>
        </div>
      ) : (
        <div className="bg-white border border-orange-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-orange-100 bg-orange-50/20 text-slate-500 text-[10px] font-extrabold uppercase tracking-wider font-quicksand">
                  <th className="py-4 px-6">Nama Shift</th>
                  <th className="py-4 px-6">Jam Masuk (Official)</th>
                  <th className="py-4 px-6">Jam Pulang (Official)</th>
                  <th className="py-4 px-6">Toleransi Check-In</th>
                  <th className="py-4 px-6">Toleransi Check-Out</th>
                  <th className="py-4 px-6 text-center">Karyawan Aktif</th>
                  <th className="py-4 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100 text-xs font-semibold text-slate-700 font-quicksand">
                {shifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-orange-50/10 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-800">{shift.name}</td>
                    <td className="py-4 px-6 font-mono text-emerald-600">{shift.clock_in.substring(0, 5)}</td>
                    <td className="py-4 px-6 font-mono text-red-500">{shift.clock_out.substring(0, 5)}</td>
                    <td className="py-4 px-6 leading-relaxed">
                      <span className="block text-[10px] text-slate-400">Normal Check-in:</span>
                      <span className="font-mono text-slate-600">{shift.early_checkin_before.substring(0, 5)} - {shift.late_checkin_after.substring(0, 5)}</span>
                    </td>
                    <td className="py-4 px-6 leading-relaxed">
                      <span className="block text-[10px] text-slate-400">Normal Check-out:</span>
                      <span className="font-mono text-slate-600">{shift.early_checkout_before.substring(0, 5)} - {shift.overtime_checkout_after.substring(0, 5)}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold">
                        {shift.users_count || 0} Orang
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(shift)}
                          className="p-1.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-red-500 hover:bg-orange-50 rounded-lg transition-all cursor-pointer"
                          title="Edit Shift"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(shift.id, shift.name)}
                          disabled={shift.name === 'Shift Normal'}
                          className="p-1.5 bg-slate-50 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:hover:bg-slate-50 disabled:hover:text-slate-400 disabled:cursor-not-allowed"
                          title="Hapus Shift"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-950/20 backdrop-blur-md animate-fade-in">
          <div className="bg-white border border-orange-100 rounded-3xl p-6 max-w-lg w-full relative shadow-xl overflow-hidden animate-zoom-in font-quicksand">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
            
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-500" /> {editingShift ? 'Edit Shift Kerja' : 'Tambah Shift Kerja Baru'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-orange-50 rounded-lg transition-all cursor-pointer text-slate-400 hover:text-red-500"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nama Shift
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Shift Siang, Shift IT"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Jam Masuk (Official)
                  </label>
                  <input
                    type="time"
                    required
                    value={clockIn}
                    onChange={(e) => setClockIn(e.target.value)}
                    className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Jam Pulang (Official)
                  </label>
                  <input
                    type="time"
                    required
                    value={clockOut}
                    onChange={(e) => setClockOut(e.target.value)}
                    className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="bg-orange-50/30 border border-orange-100/60 rounded-2xl p-4 space-y-4">
                <span className="text-[10px] font-bold text-red-550 uppercase tracking-widest block border-b border-orange-100 pb-1.5">
                  Setelan Toleransi / Kelonggaran Absensi
                </span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Check-in Normal Mulai
                    </label>
                    <input
                      type="time"
                      required
                      value={earlyCheckinBefore}
                      onChange={(e) => setEarlyCheckinBefore(e.target.value)}
                      className="w-full bg-white border border-orange-150 focus:border-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none text-xs font-mono font-bold"
                    />
                    <span className="text-[9px] text-slate-400 mt-1 block">Sebelum jam ini dinilai "Awal"</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Batas Akhir Check-in
                    </label>
                    <input
                      type="time"
                      required
                      value={lateCheckinAfter}
                      onChange={(e) => setLateCheckinAfter(e.target.value)}
                      className="w-full bg-white border border-orange-150 focus:border-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none text-xs font-mono font-bold"
                    />
                    <span className="text-[9px] text-slate-400 mt-1 block">Lewat dari jam ini dinilai "Terlambat"</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-orange-100/60 pt-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Check-out Normal Mulai
                    </label>
                    <input
                      type="time"
                      required
                      value={earlyCheckoutBefore}
                      onChange={(e) => setEarlyCheckoutBefore(e.target.value)}
                      className="w-full bg-white border border-orange-150 focus:border-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none text-xs font-mono font-bold"
                    />
                    <span className="text-[9px] text-slate-400 mt-1 block">Sebelum jam ini dinilai "Pulang Cepat"</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Batas Lembur Mulai
                    </label>
                    <input
                      type="time"
                      required
                      value={overtimeCheckoutAfter}
                      onChange={(e) => setOvertimeCheckoutAfter(e.target.value)}
                      className="w-full bg-white border border-orange-150 focus:border-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none text-xs font-mono font-bold"
                    />
                    <span className="text-[9px] text-slate-400 mt-1 block">Lewat dari jam ini dinilai "Lembur"</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-orange-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-orange-50/50 border border-orange-100 hover:bg-orange-50 text-slate-650 rounded-xl transition-all cursor-pointer text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-650 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-md shadow-red-500/10 cursor-pointer text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" />Menyimpan...</>
                  ) : (
                    'Simpan Shift'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function XIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
