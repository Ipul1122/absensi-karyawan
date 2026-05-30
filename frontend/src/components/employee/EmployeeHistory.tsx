import React from 'react'
import Swal from 'sweetalert2'
import { Eye, ShieldAlert } from 'lucide-react'

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
  return (
    <div className="space-y-6">
      {/* Attendance History Section */}
      <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 font-quicksand">Riwayat Presensi Mandiri</h3>
          <p className="text-xs text-slate-500 font-quicksand mt-1">Daftar rekaman absensi Anda selama 30 hari terakhir.</p>
        </div>

        <div className="border border-orange-100 rounded-2xl overflow-hidden bg-orange-50/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-quicksand">
              <thead>
                <tr className="bg-orange-55/30 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-orange-100 font-quicksand">
                  <th className="py-4 px-6">Tanggal</th>
                  <th className="py-4 px-6">Tipe</th>
                  <th className="py-4 px-6">Masuk (Check-In)</th>
                  <th className="py-4 px-6">Keluar (Check-Out)</th>
                  <th className="py-4 px-6 text-center">Foto Presensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100 text-sm text-slate-600">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-450 font-semibold">
                      Belum ada riwayat absensi yang tercatat.
                    </td>
                  </tr>
                ) : (
                  history.map((record) => (
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
