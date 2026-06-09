import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { Plus, Trash2, Calendar, ShieldAlert, Loader2 } from 'lucide-react'

interface Holiday {
  id: number
  date: string
  name: string
}

interface AdminHolidaysProps {
  token: string
}

export default function AdminHolidays({ token }: AdminHolidaysProps) {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // Form states
  const [date, setDate] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchHolidays = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:8000/api/holidays', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setHolidays(response.data.data)
      }
    } catch (err: any) {
      console.error(err)
      Swal.fire({
        title: 'Gagal Memuat Hari Libur',
        text: 'Tidak dapat terhubung ke server API.',
        icon: 'error',
        confirmButtonColor: '#ef4444'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHolidays()
  }, [])

  const handleOpenAddModal = () => {
    setDate('')
    setName('')
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !name) {
      Swal.fire({ title: 'Form Belum Lengkap', text: 'Silakan isi semua kolom.', icon: 'warning', confirmButtonColor: '#ef4444' })
      return
    }

    setSubmitting(true)
    try {
      const response = await axios.post('http://localhost:8000/api/admin/holidays', {
        date,
        name
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.status === 'success') {
        Swal.fire({
          title: 'Berhasil!',
          text: 'Hari libur baru berhasil ditambahkan.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: '#fffdfb',
          color: '#3c1105'
        })
        setShowModal(false)
        fetchHolidays()
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal menyimpan hari libur.'
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

  const handleDelete = (id: number, holidayName: string) => {
    Swal.fire({
      title: 'Hapus Hari Libur?',
      text: `Apakah Anda yakin ingin menghapus hari libur "${holidayName}"? Hari ini akan kembali dihitung sebagai hari kerja efektif di payroll.`,
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
          const response = await axios.delete(`http://localhost:8000/api/admin/holidays/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (response.data.status === 'success') {
            Swal.fire({
              title: 'Dihapus!',
              text: 'Hari libur berhasil dihapus.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
              background: '#fffdfb',
              color: '#3c1105'
            })
            fetchHolidays()
          }
        } catch (err: any) {
          console.error(err)
          Swal.fire({
            title: 'Gagal Menghapus',
            text: 'Terjadi kesalahan saat menghapus hari libur.',
            icon: 'error',
            confirmButtonColor: '#ef4444'
          })
        }
      }
    })
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-quicksand">
      {/* Informative Alert / Guideline Column */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white border border-orange-100 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-orange-100 pb-3">
            <Calendar className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-black text-slate-800">Kalender Hari Kerja</h3>
          </div>
          <div className="space-y-3 text-xs font-semibold text-slate-600 leading-relaxed">
            <p>
              Sistem absensi menggunakan kalender kerja untuk menentukan **hari kerja efektif** bulanan.
            </p>
            <div className="bg-orange-50/40 p-3 rounded-2xl border border-orange-100/60 space-y-2 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>**Akhir Pekan (Weekend):**</span>
              </div>
              <p className="pl-4 text-slate-500">
                Hari **Minggu** dideteksi secara otomatis sebagai akhir pekan dan dikecualikan dari hari kerja.
              </p>
              
              <div className="flex items-center gap-2 pt-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span>**Hari Libur Nasional:**</span>
              </div>
              <p className="pl-4 text-slate-500">
                Daftar tanggal merah atau cuti bersama yang Anda masukkan di sebelah kanan akan dikecualikan dari pemotongan gaji / mangkir di payroll bulanan.
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2 text-[11px] text-amber-800">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Menghapus hari libur akan memicu pemutakhiran hari kerja efektif saat Anda men-generate payroll bulanan kembali.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Holidays List Column */}
      <div className="lg:col-span-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-orange-100 p-6 rounded-3xl shadow-sm">
          <div>
            <h2 className="text-lg font-black text-slate-800">Daftar Hari Libur Resmi</h2>
            <p className="text-xs text-slate-500 mt-1">Hari libur nasional yang berlaku untuk seluruh divisi karyawan.</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-655 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-md shadow-red-500/10 cursor-pointer text-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tambah Tanggal Merah
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 bg-white border border-orange-100 rounded-3xl shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : holidays.length === 0 ? (
          <div className="bg-white border border-orange-100 p-12 rounded-3xl text-center shadow-sm">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700">Tidak Ada Hari Libur Terdaftar</h4>
            <p className="text-xs text-slate-400 mt-1">Gunakan tombol di atas untuk mendaftarkan hari libur atau cuti bersama nasional.</p>
          </div>
        ) : (
          <div className="bg-white border border-orange-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-orange-100 bg-orange-50/20 text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">
                    <th className="py-4 px-6">Tanggal</th>
                    <th className="py-4 px-6">Nama / Keterangan Libur</th>
                    <th className="py-4 px-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100 text-xs font-semibold text-slate-700">
                  {holidays.map((holiday) => (
                    <tr key={holiday.id} className="hover:bg-orange-50/10 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-red-500">{holiday.date}</td>
                      <td className="py-4 px-6 leading-relaxed">
                        <span className="block font-bold text-slate-800">{holiday.name}</span>
                        <span className="block text-[10px] text-slate-400 font-medium">{formatDate(holiday.date)}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleDelete(holiday.id, holiday.name)}
                            className="p-1.5 bg-slate-50 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Hapus Libur"
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
      </div>

      {/* Add Holiday Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-950/20 backdrop-blur-md animate-fade-in">
          <div className="bg-white border border-orange-100 rounded-3xl p-6 max-w-md w-full relative shadow-xl overflow-hidden animate-zoom-in font-quicksand">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
            
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-red-500" /> Tambah Hari Libur Baru
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
                  Tanggal Libur
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 text-slate-850 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nama Hari Libur
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tahun Baru Hijriah, Hari Raya Idul Fitri"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 text-slate-850 placeholder-slate-400 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-semibold"
                />
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
                  className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-655 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-md shadow-red-500/10 cursor-pointer text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" />Menyimpan...</>
                  ) : (
                    'Simpan Libur'
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
