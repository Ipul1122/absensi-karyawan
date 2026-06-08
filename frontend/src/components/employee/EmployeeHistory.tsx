import React from 'react'
import Swal from 'sweetalert2'
import { Eye, ShieldAlert, Filter } from 'lucide-react'

interface Attendance {
  id: number
  date: string
  attendance_type?: string | null
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
}

interface EmployeeHistoryProps {
  history: Attendance[]
  getStatusBadge: (status: string | null) => React.ReactNode
}

export default function EmployeeHistory({ history, getStatusBadge }: EmployeeHistoryProps) {
  // State for filtering
  const [filterType, setFilterType] = React.useState<'all' | 'month-year' | 'date'>('all')
  const [selectedMonth, setSelectedMonth] = React.useState<number>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = React.useState<number>(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = React.useState<string>('')
  
  // Pagination State
  const [currentPage, setCurrentPage] = React.useState<number>(1)
  const [itemsPerPage, setItemsPerPage] = React.useState<number>(10)

  // Filter history logic
  const filteredHistory = history.filter(record => {
    if (!record.date) return false
    const parts = record.date.split('-') // ["YYYY", "MM", "DD"]
    if (parts.length < 3) return false
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10)
    
    if (filterType === 'month-year') {
      return month === selectedMonth && year === selectedYear
    } else if (filterType === 'date') {
      return record.date === selectedDate
    }
    return true
  })

  const totalItems = filteredHistory.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedHistory = filteredHistory.slice(startIndex, endIndex)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Attendance History Section */}
      <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 font-quicksand">Riwayat Presensi Mandiri</h3>
            <p className="text-xs text-slate-500 font-quicksand mt-1">Daftar rekaman absensi Anda yang tercatat di sistem.</p>
          </div>
          
          {/* Row limit selector */}
          <div className="flex items-center gap-2 shrink-0 self-start md:self-center bg-orange-50/30 border border-orange-100/50 px-3 py-1.5 rounded-xl font-quicksand">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Tampilkan:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(parseInt(e.target.value, 10)); setCurrentPage(1); }}
              className="bg-white border border-orange-100 focus:border-red-400 focus:ring-1 focus:ring-red-100 text-slate-700 rounded-lg py-0.5 px-2 outline-none text-xs font-bold cursor-pointer font-quicksand"
            >
              <option value="10">10 baris</option>
              <option value="20">20 baris</option>
              <option value="50">50 baris</option>
            </select>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="space-y-4 border-b border-orange-50/50 pb-5">
          <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest font-quicksand">
            <Filter className="w-3.5 h-3.5 text-orange-550" />
            <span>Filter Data Riwayat</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setFilterType('all'); setCurrentPage(1); }}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer font-quicksand ${
                filterType === 'all'
                  ? 'bg-gradient-to-br from-red-500 to-orange-600 border-red-500 text-white shadow-md shadow-red-500/10'
                  : 'bg-white border-orange-100 hover:border-orange-200 hover:bg-orange-50/25 text-slate-600'
              }`}
            >
              Semua Riwayat
            </button>
            <button
              onClick={() => { setFilterType('month-year'); setCurrentPage(1); }}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer font-quicksand ${
                filterType === 'month-year'
                  ? 'bg-gradient-to-br from-red-500 to-orange-600 border-red-500 text-white shadow-md shadow-red-500/10'
                  : 'bg-white border-orange-100 hover:border-orange-200 hover:bg-orange-50/25 text-slate-600'
              }`}
            >
              Pilih Bulan & Tahun
            </button>
            <button
              onClick={() => { setFilterType('date'); setCurrentPage(1); }}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer font-quicksand ${
                filterType === 'date'
                  ? 'bg-gradient-to-br from-red-500 to-orange-600 border-red-500 text-white shadow-md shadow-red-500/10'
                  : 'bg-white border-orange-100 hover:border-orange-200 hover:bg-orange-50/25 text-slate-600'
              }`}
            >
              Pilih Tanggal Spesifik
            </button>
          </div>

          {/* Expanded month & year filter inputs */}
          {filterType === 'month-year' && (
            <div className="flex flex-wrap gap-3 items-center p-4 bg-orange-50/20 border border-orange-100/60 rounded-2xl animate-fade-in">
              <div className="w-full sm:w-auto">
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 font-quicksand">Bulan</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => { setSelectedMonth(parseInt(e.target.value, 10)); setCurrentPage(1); }}
                  className="bg-white border border-orange-100 focus:border-red-400 text-slate-800 rounded-xl py-2 px-3 outline-none text-xs font-bold font-quicksand w-full sm:w-48 cursor-pointer"
                >
                  <option value="1">Januari</option>
                  <option value="2">Februari</option>
                  <option value="3">Maret</option>
                  <option value="4">April</option>
                  <option value="5">Mei</option>
                  <option value="6">Juni</option>
                  <option value="7">Juli</option>
                  <option value="8">Agustus</option>
                  <option value="9">September</option>
                  <option value="10">Oktober</option>
                  <option value="11">November</option>
                  <option value="12">Desember</option>
                </select>
              </div>
              <div className="w-full sm:w-auto">
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 font-quicksand">Tahun</label>
                <select
                  value={selectedYear}
                  onChange={(e) => { setSelectedYear(parseInt(e.target.value, 10)); setCurrentPage(1); }}
                  className="bg-white border border-orange-100 focus:border-red-400 text-slate-800 rounded-xl py-2 px-3 outline-none text-xs font-bold font-quicksand w-full sm:w-32 cursor-pointer"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 3 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Expanded date filter inputs */}
          {filterType === 'date' && (
            <div className="flex flex-wrap gap-3 items-center p-4 bg-orange-50/20 border border-orange-100/60 rounded-2xl animate-fade-in">
              <div className="w-full sm:w-auto">
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 font-quicksand">Pilih Tanggal</label>
                <div className="relative">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => { setSelectedDate(e.target.value); setCurrentPage(1); }}
                    className="bg-white border border-orange-100 focus:border-red-400 text-slate-800 rounded-xl py-2 pl-3 pr-3 outline-none text-xs font-bold font-quicksand w-full sm:w-48 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table representation */}
        <div className="border border-orange-100 rounded-2xl overflow-hidden bg-orange-50/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-quicksand">
              <thead>
                <tr className="bg-orange-55/30 text-slate-655 text-xs font-bold uppercase tracking-wider border-b border-orange-100 font-quicksand">
                  <th className="py-4 px-6">Tanggal</th>
                  <th className="py-4 px-6">Tipe</th>
                  <th className="py-4 px-6">Masuk (Check-In)</th>
                  <th className="py-4 px-6">Keluar (Check-Out)</th>
                  <th className="py-4 px-6 text-center">Foto Presensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100 text-sm text-slate-600">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold italic">
                      {filterType === 'all'
                        ? 'Belum ada riwayat absensi yang tercatat.'
                        : 'Tidak ada riwayat absensi yang cocok dengan filter.'}
                    </td>
                  </tr>
                ) : (
                  paginatedHistory.map((record) => (
                    <tr key={record.id} className="hover:bg-orange-50/10 transition-colors">
                      <td className="py-4 px-6 font-extrabold text-slate-800 font-quicksand">
                        {new Date(record.date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                          record.attendance_type === 'kunjungan' 
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-250' 
                            : record.attendance_type === 'client' 
                            ? 'text-amber-700 bg-amber-50 border-amber-250' 
                            : 'text-indigo-700 bg-indigo-50 border-indigo-250'
                        }`}>
                          {record.attendance_type || 'kantor'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {record.clock_in ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-xs font-bold text-slate-800">{record.clock_in}</span>
                            <div>{getStatusBadge(record.status_in)}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic font-semibold">Tidak ada data</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {record.clock_out ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-xs font-bold text-slate-800">{record.clock_out}</span>
                            <div>{getStatusBadge(record.status_out)}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic font-semibold">Tidak ada data</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {record.photo_in && (
                            <button
                              onClick={() => {
                                Swal.fire({
                                  title: 'Foto Masuk',
                                  imageUrl: `http://localhost:8000${record.photo_in}`,
                                  imageAlt: 'Foto Masuk',
                                  background: '#fffdfb',
                                  color: '#3c1105',
                                  confirmButtonColor: '#ef4444'
                                })
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-red-500 text-slate-600 hover:text-red-500 rounded-lg text-xs font-bold transition-all cursor-pointer font-quicksand shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Masuk
                            </button>
                          )}
                          {record.photo_out && (
                            <button
                              onClick={() => {
                                Swal.fire({
                                  title: 'Foto Keluar',
                                  imageUrl: `http://localhost:8000${record.photo_out}`,
                                  imageAlt: 'Foto Keluar',
                                  background: '#fffdfb',
                                  color: '#3c1105',
                                  confirmButtonColor: '#ea580c'
                                })
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-orange-500 text-slate-600 hover:text-orange-600 rounded-lg text-xs font-bold transition-all cursor-pointer font-quicksand shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Keluar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Section */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-orange-100/50 pt-5 px-2 gap-4 font-quicksand">
            <span className="text-xs text-slate-500 font-medium order-2 sm:order-1">
              Menampilkan <span className="font-bold text-slate-700">{startIndex + 1}</span> -{' '}
              <span className="font-bold text-slate-700">{Math.min(endIndex, totalItems)}</span> dari{' '}
              <span className="font-bold text-slate-750">{totalItems}</span> data
            </span>
            
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5 order-1 sm:order-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={safeCurrentPage === 1}
                  className="px-3 py-1.5 bg-white border border-orange-100 hover:border-orange-200 text-slate-600 rounded-lg text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed select-none cursor-pointer"
                >
                  Sebelumnya
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      safeCurrentPage === page
                        ? 'bg-gradient-to-br from-red-500 to-orange-600 text-white font-extrabold shadow-md shadow-red-500/15'
                        : 'bg-white border border-orange-150 hover:border-orange-300 text-slate-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={safeCurrentPage === totalPages}
                  className="px-3 py-1.5 bg-white border border-orange-100 hover:border-orange-200 text-slate-600 rounded-lg text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed select-none cursor-pointer"
                >
                  Selanjutnya
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Notification banner */}
      <div className="p-4 bg-orange-50/20 border border-orange-100 rounded-2xl flex items-center gap-3 shadow-sm">
        <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
        <p className="text-xs text-slate-600 leading-relaxed font-quicksand font-semibold">
          <strong>Lokasi dan Kamera Wajib:</strong> Kehadiran Anda divalidasi menggunakan koordinat GPS nyata serta foto selfie kamera instan. Memanipulasi lokasi atau kamera adalah pelanggaran disiplin.
        </p>
      </div>
    </div>
  )
}

