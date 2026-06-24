import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { 
  Calendar, 
  CalendarRange, 
  Plus, 
  Trash2, 
  Loader2
} from 'lucide-react'

interface AdminKelolaHariLiburProps {
  token: string
}

export default function AdminKelolaHariLibur({ token }: AdminKelolaHariLiburProps) {
  const [holidays, setHolidays] = useState<any[]>([])
  const [loadingHolidays, setLoadingHolidays] = useState(false)
  const [newHolidayDate, setNewHolidayDate] = useState('')
  const [newHolidayName, setNewHolidayName] = useState('')
  const [savingHoliday, setSavingHoliday] = useState(false)
  const [seedingHolidays, setSeedingHolidays] = useState(false)
  
  // Year selector state for automatic import (defaulting to current year)
  const [importYear, setImportYear] = useState(() => String(new Date().getFullYear()))

  // Fetch holidays list
  const fetchHolidays = async () => {
    setLoadingHolidays(true)
    try {
      const response = await axios.get('http://localhost:8000/api/admin/holidays', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setHolidays(response.data.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingHolidays(false)
    }
  }

  // Add new holiday date
  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newHolidayDate || !newHolidayName) {
      Swal.fire({
        title: 'Form Belum Lengkap',
        text: 'Silakan isi tanggal dan nama hari libur.',
        icon: 'warning',
        confirmButtonColor: '#ea580c'
      })
      return
    }
    setSavingHoliday(true)
    try {
      const response = await axios.post(
        'http://localhost:8000/api/admin/holidays',
        { holiday_date: newHolidayDate, name: newHolidayName },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.data.status === 'success') {
        Swal.fire({
          title: 'Berhasil!',
          text: response.data.message,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        })
        setNewHolidayDate('')
        setNewHolidayName('')
        fetchHolidays()
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal menambahkan hari libur.'
      Swal.fire({
        title: 'Gagal',
        text: msg,
        icon: 'error'
      })
    } finally {
      setSavingHoliday(false)
    }
  }

  // Delete holiday
  const handleDeleteHoliday = async (id: number, name: string) => {
    Swal.fire({
      title: 'Hapus Hari Libur?',
      text: `Apakah Anda yakin ingin menghapus hari libur "${name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(`http://localhost:8000/api/admin/holidays/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (response.data.status === 'success') {
            Swal.fire({
              title: 'Berhasil!',
              text: response.data.message,
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            })
            fetchHolidays()
          }
        } catch (err: any) {
          console.error(err)
          Swal.fire({
            title: 'Gagal',
            text: err.response?.data?.message || 'Gagal menghapus hari libur.',
            icon: 'error'
          })
        }
      }
    })
  }

  // Import Holidays automatically based on the selected year
  const handleImportHolidays = async () => {
    const year = parseInt(importYear, 10) || new Date().getFullYear()

    Swal.fire({
      title: `Impor Libur Nasional & Cuti ${year}?`,
      text: `Sistem akan mengambil data dari API publik untuk mengimpor semua hari libur nasional resmi Indonesia tahun ${year} ke database.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ea580c',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Ya, Impor Semua!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setSeedingHolidays(true)
        try {
          const response = await axios.post(
            'http://localhost:8000/api/admin/holidays/import',
            { year },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          if (response.data.status === 'success') {
            Swal.fire({
              title: 'Berhasil!',
              text: response.data.message,
              icon: 'success'
            })
            fetchHolidays()
          }
        } catch (err: any) {
          console.error(err)
          const msg = err.response?.data?.message || 'Gagal mengimpor hari libur.'
          Swal.fire({
            title: 'Gagal',
            text: msg,
            icon: 'error'
          })
        } finally {
          setSeedingHolidays(false)
        }
      }
    })
  }

  useEffect(() => {
    fetchHolidays()
  }, [])

  // Year options for auto import
  const currentYear = new Date().getFullYear()
  const yearOptions = [
    String(currentYear - 1),
    String(currentYear),
    String(currentYear + 1)
  ]

  return (
    <section className="space-y-6 font-quicksand">
      <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-slate-800 font-montserrat">Kelola Hari Libur</h3>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Daftarkan dan sinkronisasi hari libur nasional untuk penyesuaian otomatis presensi karyawan.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        {/* Form Tambah Hari Libur */}
        <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-4 h-fit">
          <div>
            <h3 className="text-base font-bold text-slate-800 font-montserrat">Tambah Hari Libur</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Daftarkan tanggal merah nasional baru agar otomatis memotong absen mangkir karyawan.</p>
          </div>
          
          {/* Auto Import Selection & Button */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <select
                  value={importYear}
                  onChange={(e) => setImportYear(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 text-slate-800 rounded-xl py-2.5 px-3 outline-none transition-all text-xs font-bold cursor-pointer font-quicksand"
                >
                  {yearOptions.map(y => (
                    <option key={y} value={y}>Tahun {y}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleImportHolidays}
                disabled={seedingHolidays || loadingHolidays}
                className="px-4 py-2.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 font-montserrat"
              >
                {seedingHolidays ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Mengimpor...
                  </>
                ) : (
                  <>
                    <CalendarRange className="w-3.5 h-3.5" />
                    Impor Otomatis
                  </>
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Mengambil data libur nasional resmi Indonesia dari API publik.</p>
          </div>
          
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-3 text-[9px] text-slate-400 font-bold uppercase">Atau Input Manual</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>
          
          <form onSubmit={handleAddHoliday} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tanggal Kalender</label>
              <div className="relative">
                <input
                  type="date"
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 text-slate-800 rounded-xl py-2.5 px-3 outline-none transition-all text-xs font-semibold"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Libur (Keterangan)</label>
              <input
                type="text"
                value={newHolidayName}
                onChange={(e) => setNewHolidayName(e.target.value)}
                placeholder="Contoh: Hari Lahir Pancasila"
                className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 text-slate-800 rounded-xl py-2.5 px-3 outline-none transition-all text-xs font-semibold"
                required
              />
            </div>

            <button
              type="submit"
              disabled={savingHoliday}
              className="w-full py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-red-500/10 font-montserrat"
            >
              {savingHoliday ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Hari Libur
                </>
              )}
            </button>
          </form>
        </div>

        {/* Tabel Daftar Hari Libur */}
        <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-4 lg:col-span-2">
          <div>
            <h3 className="text-base font-bold text-slate-800 font-montserrat">Daftar Tanggal Merah Terdaftar</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Berikut adalah daftar hari libur nasional resmi yang terdaftar di database.</p>
          </div>

          {/* Holiday List - Desktop Table */}
          <div className="hidden sm:block border border-orange-100 rounded-2xl overflow-hidden bg-orange-50/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-orange-50/30 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-orange-100">
                    <th className="py-3.5 px-5 w-12">No</th>
                    <th className="py-3.5 px-5 w-44">Tanggal</th>
                    <th className="py-3.5 px-5 w-24">Hari</th>
                    <th className="py-3.5 px-5">Keterangan</th>
                    <th className="py-3.5 px-5 text-center w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100 text-xs text-slate-600">
                  {loadingHolidays ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                          Memuat data hari libur...
                        </div>
                      </td>
                    </tr>
                  ) : holidays.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold italic">
                        Belum ada tanggal merah terdaftar. Silakan tambahkan pada form di samping.
                      </td>
                    </tr>
                  ) : (
                    holidays.map((h, index) => {
                      const dateObj = new Date(h.holiday_date)
                      const formattedDate = dateObj.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })
                      const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' })
                      return (
                        <tr key={h.id} className="hover:bg-orange-50/10 transition-colors">
                          <td className="py-3.5 px-5 font-bold text-slate-400">{index + 1}</td>
                          <td className="py-3.5 px-5 font-bold text-slate-800 font-montserrat">{formattedDate}</td>
                          <td className="py-3.5 px-5 font-semibold text-slate-500">{dayName}</td>
                          <td className="py-3.5 px-5 font-medium text-slate-700">{h.name}</td>
                          <td className="py-3.5 px-5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteHoliday(h.id, h.name)}
                              className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 rounded-lg transition-all cursor-pointer"
                              title="Hapus Tanggal Merah"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

          {/* Holiday List - Mobile Calendar Cards */}
          <div className="block sm:hidden space-y-3">
            {loadingHolidays ? (
              <div className="py-8 text-center text-slate-400 bg-white border border-orange-100 rounded-2xl shadow-sm">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                  <span>Memuat data hari libur...</span>
                </div>
              </div>
            ) : holidays.length === 0 ? (
              <div className="py-8 text-center text-slate-400 font-semibold italic bg-white border border-orange-100 rounded-2xl shadow-sm">
                Belum ada tanggal merah terdaftar. Silakan tambahkan pada form di samping.
              </div>
            ) : (
              holidays.map((h) => {
                const dateObj = new Date(h.holiday_date)
                const dayNum = dateObj.getDate()
                const monthName = dateObj.toLocaleDateString('id-ID', { month: 'short' })
                const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' })
                return (
                  <div key={h.id} className="bg-white border border-orange-100 rounded-2xl p-3 shadow-sm flex items-center justify-between gap-3 hover:border-orange-200 transition-all">
                    <div className="flex items-center gap-3">
                      {/* Decorative Date Badge */}
                      <div className="w-12 h-12 bg-orange-50 border border-orange-100 rounded-xl flex flex-col items-center justify-center shrink-0 shadow-sm font-quicksand">
                        <span className="font-extrabold text-orange-600 text-lg leading-none font-montserrat">{dayNum}</span>
                        <span className="font-bold text-orange-500 text-[9px] uppercase tracking-wider mt-0.5 leading-none">{monthName}</span>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-xs font-montserrat">{h.name}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5 font-quicksand">{dayName}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteHoliday(h.id, h.name)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl border border-rose-100 hover:border-rose-200 transition-all cursor-pointer shrink-0"
                      title="Hapus Tanggal Merah"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
