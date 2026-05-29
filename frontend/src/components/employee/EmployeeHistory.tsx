import React from 'react'
import Swal from 'sweetalert2'
import { Eye, ShieldAlert } from 'lucide-react'

interface Attendance {
  id: number
  date: string
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
      <section className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-200 font-quicksand">Riwayat Presensi Mandiri</h3>
          <p className="text-xs text-slate-400 font-quicksand mt-1">Daftar rekaman absensi Anda selama 30 hari terakhir.</p>
        </div>

        <div className="border border-slate-800/60 rounded-2xl overflow-hidden bg-slate-950/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/60 text-slate-455 text-xs font-bold uppercase tracking-wider border-b border-slate-800/80 font-quicksand">
                  <th className="py-4 px-6">Tanggal</th>
                  <th className="py-4 px-6">Masuk (Check-In)</th>
                  <th className="py-4 px-6">Keluar (Check-Out)</th>
                  <th className="py-4 px-6 text-center">Foto Presensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm text-slate-350">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 font-semibold">
                      Belum ada riwayat absensi yang tercatat.
                    </td>
                  </tr>
                ) : (
                  history.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-300 font-quicksand">
                        {new Date(record.date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-6">
                        {record.clock_in ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-xs font-bold text-slate-200">{record.clock_in}</span>
                            <div>{getStatusBadge(record.status_in)}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Tidak ada data</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {record.clock_out ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-xs font-bold text-slate-200">{record.clock_out}</span>
                            <div>{getStatusBadge(record.status_out)}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Tidak ada data</span>
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
                                  background: '#1e293b',
                                  color: '#f8fafc',
                                  confirmButtonColor: '#6366f1'
                                })
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-950 border border-slate-805 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 rounded-lg text-xs font-bold transition-all cursor-pointer font-quicksand"
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
                                  background: '#1e293b',
                                  color: '#f8fafc',
                                  confirmButtonColor: '#6366f1'
                                })
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-950 border border-slate-805 hover:border-violet-500 text-slate-400 hover:text-violet-400 rounded-lg text-xs font-bold transition-all cursor-pointer font-quicksand"
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
      <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0" />
        <p className="text-xs text-slate-400 leading-relaxed font-quicksand">
          <strong>Lokasi dan Kamera Wajib:</strong> Kehadiran Anda divalidasi menggunakan koordinat GPS nyata serta foto selfie kamera instan. Memanipulasi lokasi atau kamera adalah pelanggaran disiplin.
        </p>
      </div>
    </div>
  )
}
