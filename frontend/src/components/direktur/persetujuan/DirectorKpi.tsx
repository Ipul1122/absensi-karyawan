import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import {
  ShieldCheck,
  Star,
  CheckCircle2,
  Clock,
  X,
  FileSpreadsheet
} from 'lucide-react'
import { API_BASE_URL, getAssetUrl } from '../../../utils/api'

interface DirectorKpiProps {
  token: string
}

interface ReportItem {
  id: number
  date: string
  user: {
    id: number
    name: string
    email: string
    division: string | null
    role: string
    photo: string | null
  }
  attendance?: {
    id: number
    clock_in: string | null
    clock_out: string | null
  } | null
  summary: string | null
  status: string
  completion_rate: number
  admin_notes: string | null
  admin_rating: number | null
  reviewedByAdmin?: { id: number; name: string } | null
  director_notes: string | null
  director_rating: number | null
  reviewedByDirector?: { id: number; name: string } | null
  tasks: Array<{
    id: number
    title: string
    description: string | null
    image_path: string | null
    priority: string
    status: string
    completed_at: string | null
    responsibility?: { id: number; title: string } | null
  }>
}

export default function DirectorKpi({ token }: DirectorKpiProps) {
  const getTodayJakarta = () => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
  }

  const [activeTab, setActiveTab] = useState<'admin_reports' | 'all_reports' | 'responsibilities'>('admin_reports')
  const [selectedDate, setSelectedDate] = useState(getTodayJakarta())
  const [adminReports, setAdminReports] = useState<ReportItem[]>([])
  const [allReports, setAllReports] = useState<ReportItem[]>([])
  const [overviewMetrics, setOverviewMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Selected Report Modal
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null)
  const [directorRating, setDirectorRating] = useState<number>(5)
  const [directorNotes, setDirectorNotes] = useState<string>('')
  const [submittingRating, setSubmittingRating] = useState(false)
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)

  // Master Responsibilities
  const [responsibilities, setResponsibilities] = useState<any[]>([])
  const [loadingResp, setLoadingResp] = useState(false)

  useEffect(() => {
    if (activeTab === 'admin_reports') {
      fetchAdminReports()
    } else if (activeTab === 'all_reports') {
      fetchOverviewData()
    } else if (activeTab === 'responsibilities') {
      fetchResponsibilities()
    }
  }, [activeTab, selectedDate])

  const fetchAdminReports = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE_URL}/api/director/kpi/admin-reports`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { date: selectedDate }
      })
      if (res.data.status === 'success') {
        setAdminReports(res.data.data || [])
      }
    } catch (err) {
      console.error('Gagal mengambil laporan Admin:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchOverviewData = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE_URL}/api/director/kpi/overview`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { date: selectedDate }
      })
      if (res.data.status === 'success') {
        setAllReports(res.data.data?.reports || [])
        setOverviewMetrics(res.data.data?.metrics)
      }
    } catch (err) {
      console.error('Gagal mengambil overview KPI:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchResponsibilities = async () => {
    setLoadingResp(true)
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/responsibilities`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data.status === 'success') {
        setResponsibilities(res.data.data || [])
      }
    } catch (err) {
      console.error('Gagal mengambil data tanggung jawab:', err)
    } finally {
      setLoadingResp(false)
    }
  }

  const handleSaveDirectorReview = async () => {
    if (!selectedReport) return

    setSubmittingRating(true)
    try {
      const res = await axios.post(`${API_BASE_URL}/api/director/kpi/reports/${selectedReport.id}/review`, {
        director_rating: directorRating,
        director_notes: directorNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.data.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'Penilaian Direktur Disimpan!',
          timer: 1500,
          showConfirmButton: false
        })
        setSelectedReport(null)
        if (activeTab === 'admin_reports') {
          fetchAdminReports()
        } else {
          fetchOverviewData()
        }
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err.response?.data?.message || 'Terjadi kesalahan.',
        confirmButtonColor: '#dc2626'
      })
    } finally {
      setSubmittingRating(false)
    }
  }

  // EXPORT EXCEL FOR DIRECTOR
  const handleExportDirectorExcel = () => {
    const listToExport = activeTab === 'admin_reports' ? adminReports : allReports
    const reportTitle = activeTab === 'admin_reports' ? 'LAPORAN KINERJA KHUSUS STAF ADMIN' : 'REKAPITULASI KINERJA SELURUH STAF'

    if (listToExport.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Tidak Ada Data',
        text: 'Tidak ada data laporan untuk diexport pada tanggal ini.',
        confirmButtonColor: '#dc2626'
      })
      return
    }

    const rows = listToExport.map((r, idx) => {
      const taskSummary = r.tasks?.map(t => `${t.status === 'completed' ? '[V]' : '[X]'} ${t.title}`).join('; ') || '-'
      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><b>${r.user?.name || '-'}</b></td>
          <td>${r.user?.role === 'admin' ? 'Staf Admin' : 'Karyawan'}</td>
          <td>${r.user?.division || '-'}</td>
          <td style="text-align: center;">${r.attendance?.clock_in ? r.attendance.clock_in.substring(0, 5) + ' WIB' : 'Belum Absen'}</td>
          <td style="text-align: center;">${r.tasks?.length || 0}</td>
          <td style="text-align: center;">${r.tasks?.filter(t => t.status === 'completed').length || 0}</td>
          <td style="text-align: center;"><b>${r.completion_rate}%</b></td>
          <td>${taskSummary}</td>
          <td>${r.summary || '-'}</td>
          <td style="text-align: center;">${r.director_rating ? `${r.director_rating} Bintang` : '-'}</td>
          <td>${r.director_notes || '-'}</td>
        </tr>
      `
    }).join('')

    const tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: sans-serif; }
          th { background-color: #dc2626; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; }
        </style>
      </head>
      <body>
        <h3>${reportTitle}</h3>
        <p>Tanggal: <b>${selectedDate}</b> | Total Laporan: <b>${listToExport.length}</b></p>
        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">No</th>
              <th>Nama Staf</th>
              <th>Jabatan</th>
              <th>Divisi</th>
              <th style="text-align: center;">Jam Absen</th>
              <th style="text-align: center;">Total Tugas</th>
              <th style="text-align: center;">Selesai</th>
              <th style="text-align: center;">Ketercapaian (%)</th>
              <th>Rincian Tugas</th>
              <th>Ringkasan Staf</th>
              <th style="text-align: center;">Rating Direktur</th>
              <th>Catatan Evaluasi Direktur</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
      </html>
    `

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Direktur_Laporan_KPI_${selectedDate}.xls`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* ══════════════════════════════════════════════════════════════════
          TOP NAVIGATION TABS
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl p-2.5 shadow-xs">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('admin_reports')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'admin_reports'
                ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            🛡️ Laporan Staf Admin (Review Langsung)
          </button>
          <button
            onClick={() => setActiveTab('all_reports')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all_reports'
                ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            📈 Pantauan Seluruh Tim & KPI
          </button>
          <button
            onClick={() => setActiveTab('responsibilities')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'responsibilities'
                ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            🎯 Master Tanggung Jawab Staf
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end pr-1">
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Tanggal:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB 1: LAPORAN STAF ADMIN (BYPASS -> LANGSUNG KE DIREKTUR)
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'admin_reports' && (
        <div className="space-y-5">
          <div className="bg-red-50/60 border border-red-200 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-600/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-red-950">
                  Laporan Kerja Harian Staf Admin (Bypass Session)
                </h3>
                <p className="text-xs text-red-800/90 font-medium mt-0.5">
                  Laporan to-do list dari akun Admin langsung ditujukan ke meja Direktur untuk evaluasi dan pemberian rating.
                </p>
              </div>
            </div>

            <button
              onClick={handleExportDirectorExcel}
              disabled={adminReports.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer shrink-0 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export Excel
            </button>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs">
            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400">Memuat laporan Admin...</div>
            ) : adminReports.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm font-bold text-slate-600">Belum Ada Laporan Staf Admin</p>
                <p className="text-xs text-slate-400 mt-1">Staf admin belum mengisi to-do list pada tanggal {selectedDate}.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {adminReports.map((report) => (
                  <div key={report.id} className="p-5 rounded-2xl border border-slate-200/80 hover:border-red-200 hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center shrink-0 overflow-hidden text-sm">
                        {report.user?.photo ? (
                          <img src={getAssetUrl(report.user.photo)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          report.user?.name?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-slate-900">{report.user?.name}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded">
                            Staf HR / Admin
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Presensi: {report.attendance?.clock_in ? `${report.attendance.clock_in.substring(0, 5)} WIB` : 'Belum tercatat'}
                        </p>
                        {report.summary && (
                          <p className="text-xs text-slate-700 mt-1.5 italic bg-slate-50 p-2 rounded-xl border border-slate-200/60 max-w-xl">
                            "{report.summary}"
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs font-bold text-slate-700">
                            Progres: {report.completion_rate}% ({report.tasks?.filter(t => t.status === 'completed').length}/{report.tasks?.length} Tugas Selesai)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end gap-2 shrink-0">
                      {report.director_rating ? (
                        <div className="flex items-center gap-1 text-red-600">
                          {[...Array(report.director_rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-red-600 text-red-600" />
                          ))}
                          <span className="text-xs font-bold text-red-700 ml-1">({report.director_rating}/5)</span>
                        </div>
                      ) : (
                        <span className="text-xs text-red-700 font-bold bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                          ⏳ Menunggu Penilaian Direktur
                        </span>
                      )}

                      <button
                        onClick={() => {
                          setSelectedReport(report)
                          setDirectorRating(report.director_rating || 5)
                          setDirectorNotes(report.director_notes || '')
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-red-600/20 transition-all cursor-pointer"
                      >
                        Beri Nilai & Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 2: PANTAUAN SELURUH TIM & KPI MAKRO
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'all_reports' && (
        <div className="space-y-6">
          {/* Metrics */}
          {overviewMetrics && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Laporan Masuk</span>
                <p className="text-2xl font-black text-slate-800 mt-1">{overviewMetrics.total_reports}</p>
                <span className="text-[11px] text-slate-400 font-medium">Hari ini ({selectedDate})</span>
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Tugas Tim</span>
                <p className="text-2xl font-black text-slate-800 mt-1">{overviewMetrics.total_tasks}</p>
                <span className="text-[11px] text-slate-400 font-medium">Pekerjaan terdaftar</span>
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tugas Terselesaikan</span>
                <p className="text-2xl font-black text-emerald-600 mt-1">{overviewMetrics.completed_tasks}</p>
                <span className="text-[11px] text-emerald-600/90 font-medium">Centang selesai</span>
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ketercapaian Perusahaan</span>
                <p className="text-2xl font-black text-red-600 mt-1">{overviewMetrics.company_completion_rate}%</p>
                <span className="text-[11px] text-red-600/90 font-medium">Tingkat produktivitas</span>
              </div>
            </div>
          )}

          {/* Table All Reports */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-800">
                Rekapitulasi Kinerja Seluruh Staf ({allReports.length})
              </h3>
              <button
                onClick={handleExportDirectorExcel}
                disabled={allReports.length === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer self-start sm:self-auto disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Export Excel
              </button>
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400">Memuat data...</div>
            ) : allReports.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                Tidak ada data pada tanggal {selectedDate}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[650px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider text-[10px]">
                      <th className="pb-3 pl-2">Staf</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Progres Capaian</th>
                      <th className="pb-3">Review Admin</th>
                      <th className="pb-3">Review Direktur</th>
                      <th className="pb-3 text-right pr-2">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {allReports.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 pl-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-[11px]">
                              {r.user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-extrabold text-slate-800">{r.user?.name}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            r.user?.role === 'admin' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {r.user?.role === 'admin' ? 'Admin' : 'Karyawan'}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-800">{r.completion_rate}%</span>
                            <span className="text-[10px] text-slate-400">
                              ({r.tasks?.filter(t => t.status === 'completed').length}/{r.tasks?.length})
                            </span>
                          </div>
                        </td>
                        <td className="py-3">
                          {r.admin_rating ? (
                            <span className="font-bold text-red-600">⭐ {r.admin_rating}/5</span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">-</span>
                          )}
                        </td>
                        <td className="py-3">
                          {r.director_rating ? (
                            <span className="font-bold text-red-700">⭐ {r.director_rating}/5</span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">-</span>
                          )}
                        </td>
                        <td className="py-3 text-right pr-2">
                          <button
                            onClick={() => {
                              setSelectedReport(r)
                              setDirectorRating(r.director_rating || 5)
                              setDirectorNotes(r.director_notes || '')
                            }}
                            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 3: MASTER TANGGUNG JAWAB STAF
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'responsibilities' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-800 mb-4">
            Master Tanggung Jawab & Target KPI Seluruh Karyawan ({responsibilities.length})
          </h3>
          {loadingResp ? (
            <div className="py-16 text-center text-xs text-slate-400">Memuat...</div>
          ) : responsibilities.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">Belum ada tanggung jawab tercatat.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {responsibilities.map((resp) => (
                <div key={resp.id} className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 hover:border-red-200 hover:shadow-xs transition-all">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-black text-red-700 bg-red-100/80 px-2 py-0.5 rounded">
                      {resp.user?.name}
                    </span>
                    <span className="text-[10px] text-slate-400">{resp.user?.division || 'Karyawan'}</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 line-clamp-1">{resp.title}</h4>
                  {resp.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{resp.description}</p>
                  )}
                  {resp.target_indicator && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60">
                      <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        🎯 {resp.target_indicator}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL DETAIL LAPORAN & PENILAIAN DIREKTUR */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-2xl border border-slate-100 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-sm">
                  {selectedReport.user?.photo ? (
                    <img src={getAssetUrl(selectedReport.user.photo)} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    selectedReport.user?.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-800">
                    Laporan Kerja: {selectedReport.user?.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Tanggal: {selectedReport.date} · {selectedReport.completion_rate}% Selesai
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedReport.summary && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                <span className="text-[10px] font-black uppercase text-slate-400">Ringkasan Staf:</span>
                <p className="text-xs text-slate-700 mt-1 italic leading-relaxed">
                  "{selectedReport.summary}"
                </p>
              </div>
            )}

            <div className="space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Daftar Tugas ({selectedReport.tasks?.length || 0})
              </h4>
              {selectedReport.tasks?.map((t) => (
                <div key={t.id} className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <span className="mt-0.5">
                      {t.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800">{t.title}</p>
                      {t.description && <p className="text-[11px] text-slate-500 mt-0.5">{t.description}</p>}
                    </div>
                  </div>
                  {t.image_path && (
                    <img
                      src={getAssetUrl(t.image_path)}
                      alt="Bukti Kerja"
                      onClick={() => setLightboxImg(getAssetUrl(t.image_path))}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 cursor-pointer hover:scale-105 transition-transform shrink-0"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Form Penilaian Direktur */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Penilaian & Apresiasi Direktur
              </h4>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Rating Kinerja (Bintang 1 - 5):
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setDirectorRating(star)}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= directorRating ? 'text-red-600 fill-red-600' : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-extrabold text-red-600 ml-2">
                    {directorRating} / 5 Bintang
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Catatan / Evaluasi Direktur:
                </label>
                <textarea
                  value={directorNotes}
                  onChange={(e) => setDirectorNotes(e.target.value)}
                  placeholder="Beri catatan apresiasi atau arahan kinerja..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleSaveDirectorReview}
                  disabled={submittingRating}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-red-600/20 cursor-pointer disabled:opacity-50"
                >
                  {submittingRating ? 'Menyimpan...' : 'Simpan Penilaian Direktur'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Foto */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm cursor-pointer"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl">
            <img src={lightboxImg} alt="Bukti Kerja" className="w-full h-full max-h-[85vh] object-contain" />
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute top-3 right-3 p-1.5 bg-slate-900/60 hover:bg-slate-900 text-white rounded-full shadow transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
