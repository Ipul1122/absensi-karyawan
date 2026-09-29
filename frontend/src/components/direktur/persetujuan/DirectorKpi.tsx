import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import {
  ShieldCheck,
  Star,
  CheckCircle2,
  Clock,
  X,
  FileSpreadsheet,
  Search,
  Calendar,
  Sparkles,
  Award
} from 'lucide-react'
import { API_BASE_URL, getAssetUrl } from '../../../utils/api'

interface DirectorKpiProps {
  token: string
  onReviewChange?: () => void
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

interface AdminSummary {
  total_admin_reports: number
  pending_review_count: number
  reviewed_count: number
}

export default function DirectorKpi({ token, onReviewChange }: DirectorKpiProps) {
  const getTodayJakarta = () => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
  }

  const [activeTab, setActiveTab] = useState<'admin_reports' | 'all_reports' | 'responsibilities'>('admin_reports')
  const [selectedDate, setSelectedDate] = useState(getTodayJakarta())
  const [adminReports, setAdminReports] = useState<ReportItem[]>([])
  const [adminSummary, setAdminSummary] = useState<AdminSummary | null>(null)
  const [adminFilterStatus, setAdminFilterStatus] = useState<'all' | 'submitted' | 'reviewed_director'>('all')
  const [adminFilterDateMode, setAdminFilterDateMode] = useState<'all' | 'specific'>('all')
  const [adminSelectedDate, setAdminSelectedDate] = useState(getTodayJakarta())
  const [adminSearchQuery, setAdminSearchQuery] = useState('')

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
    }
  }, [activeTab, adminFilterStatus, adminFilterDateMode, adminSelectedDate])

  useEffect(() => {
    if (activeTab === 'all_reports') {
      fetchOverviewData()
    } else if (activeTab === 'responsibilities') {
      fetchResponsibilities()
    }
  }, [activeTab, selectedDate])

  const fetchAdminReports = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (adminFilterDateMode === 'specific' && adminSelectedDate) {
        params.date = adminSelectedDate
      } else {
        params.date = 'all'
      }
      if (adminFilterStatus !== 'all') {
        params.status = adminFilterStatus
      }
      const res = await axios.get(`${API_BASE_URL}/api/director/kpi/admin-reports`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      })
      if (res.data.status === 'success') {
        setAdminReports(res.data.data || [])
        if (res.data.summary) {
          setAdminSummary(res.data.summary)
        }
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
        onReviewChange?.()
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

  // Helper Format Tanggal Indonesia
  const formatDateIndo = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-')
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      return `${day} ${months[parseInt(month, 10) - 1]} ${year}`
    } catch {
      return dateStr
    }
  }

  // Helper Deskripsi Rating
  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 5: return '⭐⭐⭐⭐⭐ (5/5) Sangat Baik & Melampaui Target'
      case 4: return '⭐⭐⭐⭐ (4/5) Baik & Sesuai Ekspektasi'
      case 3: return '⭐⭐⭐ (3/5) Cukup / Standar Kinerja'
      case 2: return '⭐⭐ (2/5) Kurang Memuaskan / Perlu Perbaikan'
      case 1: return '⭐ (1/5) Perlu Evaluasi Serius'
      default: return ''
    }
  }

  const filteredAdminReports = adminReports.filter(report => {
    if (!adminSearchQuery.trim()) return true
    const q = adminSearchQuery.toLowerCase()
    return (
      report.user?.name?.toLowerCase().includes(q) ||
      report.user?.email?.toLowerCase().includes(q) ||
      (report.summary && report.summary.toLowerCase().includes(q)) ||
      report.tasks?.some(t => t.title.toLowerCase().includes(q))
    )
  })

  // EXPORT EXCEL FOR DIRECTOR
  const handleExportDirectorExcel = () => {
    const listToExport = activeTab === 'admin_reports' ? filteredAdminReports : allReports
    const reportTitle = activeTab === 'admin_reports' ? 'LAPORAN KINERJA KHUSUS STAF ADMIN / HR' : 'REKAPITULASI KINERJA SELURUH STAF'
    const exportDateLabel = activeTab === 'admin_reports' 
      ? (adminFilterDateMode === 'specific' ? adminSelectedDate : 'Semua Tanggal') 
      : selectedDate

    if (listToExport.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Tidak Ada Data',
        text: 'Tidak ada data laporan untuk diexport pada filter ini.',
        confirmButtonColor: '#dc2626'
      })
      return
    }

    const rows = listToExport.map((r, idx) => {
      const taskSummary = r.tasks?.map(t => `${t.status === 'completed' ? '[🟢 Selesai]' : t.status === 'revision' ? '[🟡 Revisi]' : '[🔴 Proses]'} ${t.title}`).join('; ') || '-'
      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><b>${r.user?.name || '-'}</b></td>
          <td>${r.user?.role === 'admin' ? 'Staf Admin HR' : 'Karyawan'}</td>
          <td>${r.user?.division || '-'}</td>
          <td style="text-align: center;">${r.date}</td>
          <td style="text-align: center;">${r.attendance?.clock_in ? r.attendance.clock_in.substring(0, 5) + ' WIB' : 'Bypass Presensi'}</td>
          <td style="text-align: center;">${r.tasks?.length || 0}</td>
          <td style="text-align: center;">${r.tasks?.filter(t => t.status === 'completed').length || 0}</td>
          <td style="text-align: center;"><b>${r.completion_rate}%</b></td>
          <td>${taskSummary}</td>
          <td>${r.summary || '-'}</td>
          <td style="text-align: center;">${r.director_rating ? `${r.director_rating} Bintang` : (r.status === 'submitted' ? 'Menunggu Review' : '-')}</td>
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
        <p>Tanggal: <b>${exportDateLabel}</b> | Total Laporan: <b>${listToExport.length}</b></p>
        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">No</th>
              <th>Nama Staf</th>
              <th>Jabatan</th>
              <th>Divisi</th>
              <th style="text-align: center;">Tanggal</th>
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
    a.download = `Direktur_Laporan_KPI_${exportDateLabel.replace(/\s+/g, '_')}.xls`
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
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('admin_reports')}
            className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 shrink-0 ${
              activeTab === 'admin_reports'
                ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>To-Do List Staf Admin HR</span>
            {(adminSummary?.pending_review_count ?? 0) > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'admin_reports' ? 'bg-white text-red-600' : 'bg-red-600 text-white'
              }`}>
                {adminSummary?.pending_review_count}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('all_reports')}
            className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 shrink-0 ${
              activeTab === 'all_reports'
                ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Pantauan Seluruh Tim & KPI</span>
          </button>
          <button
            onClick={() => setActiveTab('responsibilities')}
            className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 shrink-0 ${
              activeTab === 'responsibilities'
                ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Master Tanggung Jawab Staf</span>
          </button>
        </div>

        {activeTab !== 'admin_reports' && (
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <span className="text-xs font-semibold text-slate-500">Tanggal:</span>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 sm:px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
              <button
                type="button"
                onClick={() => setSelectedDate(getTodayJakarta())}
                className="px-2 sm:px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                title="Hari Ini"
              >
                Hari Ini
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB 1: LAPORAN STAF ADMIN (BYPASS -> LANGSUNG KE DIREKTUR)
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'admin_reports' && (
        <div className="space-y-4 sm:space-y-5">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-red-600/10">
            <div className="flex items-center gap-3 sm:gap-3.5">
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center shrink-0 border border-white/20">
                <ShieldCheck className="w-5 sm:w-6 h-5 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-lg font-black text-white">
                    Laporan Kerja Harian Staf Admin HR
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                    Bypass Langsung Direktur
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-white/90 font-medium mt-1 max-w-2xl leading-relaxed">
                  Laporan to-do list dari akun Admin HR langsung ditujukan ke meja Direktur Utama. Berikan evaluasi kinerja, arahan, dan rating bintang harian.
                </p>
              </div>
            </div>

            <button
              onClick={handleExportDirectorExcel}
              disabled={filteredAdminReports.length === 0}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-red-700 font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer w-full sm:w-auto shrink-0 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Export Excel ({filteredAdminReports.length})
            </button>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
            <div 
              onClick={() => setAdminFilterStatus('all')}
              className={`bg-white border rounded-2xl p-3.5 sm:p-4 transition-all cursor-pointer shadow-xs ${
                adminFilterStatus === 'all' ? 'border-red-500 ring-2 ring-red-500/15' : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Laporan HR / Admin</span>
                <span className="p-1.5 sm:p-2 rounded-xl bg-slate-100 text-slate-600">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-800 mt-1 sm:mt-2">
                {adminSummary?.total_admin_reports ?? adminReports.length}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Semua riwayat to-do list staf Admin HR</p>
            </div>

            <div 
              onClick={() => setAdminFilterStatus('submitted')}
              className={`bg-white border rounded-2xl p-3.5 sm:p-4 transition-all cursor-pointer shadow-xs ${
                adminFilterStatus === 'submitted' ? 'border-amber-500 ring-2 ring-amber-500/15' : 'border-slate-200/90 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Perlu Penilaian Direktur</span>
                <span className="p-1.5 sm:p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1 sm:mt-2">
                <p className="text-xl sm:text-2xl font-black text-amber-600">
                  {adminSummary?.pending_review_count ?? adminReports.filter(r => r.status === 'submitted').length}
                </p>
                {(adminSummary?.pending_review_count ?? 0) > 0 && (
                  <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full animate-pulse">
                    Menunggu Tindakan
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Laporan siap dievaluasi & diberi rating</p>
            </div>

            <div 
              onClick={() => setAdminFilterStatus('reviewed_director')}
              className={`bg-white border rounded-2xl p-3.5 sm:p-4 transition-all cursor-pointer shadow-xs ${
                adminFilterStatus === 'reviewed_director' ? 'border-emerald-500 ring-2 ring-emerald-500/15' : 'border-slate-200/90 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Telah Dinilai Direktur</span>
                <span className="p-1.5 sm:p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-1 sm:mt-2">
                {adminSummary?.reviewed_count ?? adminReports.filter(r => r.status === 'reviewed_director').length}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Telah diberi rating bintang dan evaluasi</p>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setAdminFilterStatus('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  adminFilterStatus === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Status ({adminSummary?.total_admin_reports ?? adminReports.length})
              </button>
              <button
                type="button"
                onClick={() => setAdminFilterStatus('submitted')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  adminFilterStatus === 'submitted'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Menunggu Review ({adminSummary?.pending_review_count ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setAdminFilterStatus('reviewed_director')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  adminFilterStatus === 'reviewed_director'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Sudah Dinilai ({adminSummary?.reviewed_count ?? 0})
              </button>
            </div>

            {/* Search & Date Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama admin / tugas..."
                  value={adminSearchQuery}
                  onChange={(e) => setAdminSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAdminFilterDateMode(adminFilterDateMode === 'all' ? 'specific' : 'all')}
                  className={`flex-1 sm:flex-initial px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    adminFilterDateMode === 'all'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {adminFilterDateMode === 'all' ? 'Semua Tanggal' : 'Pilih Tanggal'}
                </button>

                {adminFilterDateMode === 'specific' && (
                  <input
                    type="date"
                    value={adminSelectedDate}
                    onChange={(e) => setAdminSelectedDate(e.target.value)}
                    className="flex-1 sm:flex-initial px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Reports List */}
          <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs">
            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                <span>Memuat laporan to-do list Admin HR...</span>
              </div>
            ) : filteredAdminReports.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-700">Tidak Ada Laporan Admin Ditemukan</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {adminFilterStatus !== 'all' || adminFilterDateMode === 'specific' || adminSearchQuery
                    ? 'Tidak ada laporan yang sesuai dengan filter saat ini. Coba ubah filter atau tanggal.'
                    : 'Belum ada staf Admin HR yang mengisi atau mengirimkan to-do list harian.'}
                </p>
                {(adminFilterStatus !== 'all' || adminFilterDateMode === 'specific' || adminSearchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setAdminFilterStatus('all')
                      setAdminFilterDateMode('all')
                      setAdminSearchQuery('')
                    }}
                    className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAdminReports.map((report) => {
                  const completedTasksCount = report.tasks?.filter(t => t.status === 'completed').length || 0
                  const totalTasksCount = report.tasks?.length || 0

                  return (
                    <div 
                      key={report.id} 
                      className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                        report.status === 'submitted'
                          ? 'border-amber-200 bg-amber-50/20 hover:border-amber-300 shadow-xs'
                          : 'border-slate-200/80 hover:border-slate-300 hover:shadow-xs bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center shrink-0 overflow-hidden text-sm border border-red-200">
                          {report.user?.photo ? (
                            <img src={getAssetUrl(report.user.photo)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            report.user?.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-extrabold text-slate-900">{report.user?.name}</h4>
                            <span className="text-[10px] font-black px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded">
                              Staf HR / Admin
                            </span>
                            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {formatDateIndo(report.date)}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {report.attendance?.clock_in 
                                ? `Presensi: ${report.attendance.clock_in.substring(0, 5)} WIB` 
                                : '🔓 Akses Admin (Bypass Presensi)'}
                            </span>
                          </div>

                          {/* Summary / Ringkasan Admin */}
                          {report.summary && (
                            <div className="text-xs text-slate-700 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                              <span className="font-bold not-italic text-[10px] uppercase text-slate-400 block mb-0.5">
                                Ringkasan Staf Admin:
                              </span>
                              "{report.summary}"
                            </div>
                          )}

                          {/* Progress bar */}
                          <div className="space-y-1 max-w-md">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                              <span>Progres Pekerjaan ({completedTasksCount}/{totalTasksCount} Selesai)</span>
                              <span className={report.completion_rate === 100 ? 'text-emerald-600 font-extrabold' : 'text-slate-800'}>
                                {report.completion_rate}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  report.completion_rate === 100 
                                    ? 'bg-emerald-500' 
                                    : report.completion_rate >= 50 
                                      ? 'bg-amber-500' 
                                      : 'bg-red-500'
                                }`}
                                style={{ width: `${report.completion_rate}%` }}
                              />
                            </div>
                          </div>

                          {/* Task Snippets */}
                          {report.tasks && report.tasks.length > 0 && (
                            <div className="pt-1 space-y-1">
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Butir To-Do List Terdaftar:
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {report.tasks.slice(0, 4).map((t) => (
                                  <span 
                                    key={t.id}
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border ${
                                      t.status === 'completed'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : t.status === 'revision'
                                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                                          : 'bg-red-50 text-red-700 border-red-200'
                                    }`}
                                  >
                                    <span className="text-[10px]">
                                      {t.status === 'completed' ? '🟢' : t.status === 'revision' ? '🟡' : '🔴'}
                                    </span>
                                    <span className="truncate max-w-[170px]">{t.title}</span>
                                    {t.image_path && <span title="Ada Bukti Foto">📷</span>}
                                  </span>
                                ))}
                                {report.tasks.length > 4 && (
                                  <span className="text-[11px] font-bold text-slate-400 self-center">
                                    +{report.tasks.length - 4} lainnya
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Director Evaluation Review Notes if already reviewed */}
                          {report.director_notes && (
                            <div className="text-xs bg-red-50/70 border border-red-200/80 p-2.5 rounded-xl text-red-950 mt-2">
                              <span className="font-extrabold text-[10px] uppercase text-red-700 block mb-0.5">
                                Evaluasi Direktur ({report.reviewedByDirector?.name || 'Direktur Utama'}):
                              </span>
                              "{report.director_notes}"
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Column: Status & Action Button */}
                      <div className="flex flex-col md:items-end gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                        {report.director_rating ? (
                          <div className="flex flex-col md:items-end gap-1">
                            <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-xl border border-red-200">
                              {[...Array(report.director_rating)].map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-red-600 text-red-600" />
                              ))}
                              <span className="text-xs font-black text-red-700 ml-1">
                                {report.director_rating} / 5
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              ✓ Telah Dinilai Direktur
                            </span>
                          </div>
                        ) : report.status === 'submitted' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-amber-800 font-extrabold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-300 shadow-xs">
                            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                            Menunggu Penilaian Direktur
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-xl">
                            📝 Draf (Belum Disubmit)
                          </span>
                        )}

                        <button
                          onClick={() => {
                            setSelectedReport(report)
                            setDirectorRating(report.director_rating || 5)
                            setDirectorNotes(report.director_notes || '')
                          }}
                          className={`w-full md:w-auto justify-center px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5 ${
                            report.director_rating 
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200' 
                              : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5" />
                          {report.director_rating ? 'Ubah Nilai & Catatan' : 'Beri Nilai & Review'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 2: PANTAUAN SELURUH TIM & KPI MAKRO
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'all_reports' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Metrics */}
          {overviewMetrics && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Laporan Masuk</span>
                <p className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{overviewMetrics.total_reports}</p>
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Hari ini ({selectedDate})</span>
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Tugas Tim</span>
                <p className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{overviewMetrics.total_tasks}</p>
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Pekerjaan terdaftar</span>
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tugas Terselesaikan</span>
                <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">{overviewMetrics.completed_tasks}</p>
                <span className="text-[10px] sm:text-[11px] text-emerald-600/90 font-medium">Centang selesai</span>
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ketercapaian Tim</span>
                <p className="text-xl sm:text-2xl font-black text-red-600 mt-1">{overviewMetrics.company_completion_rate}%</p>
                <span className="text-[10px] sm:text-[11px] text-red-600/90 font-medium">Tingkat produktivitas</span>
              </div>
            </div>
          )}

          {/* Table All Reports */}
          <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-800">
                Rekapitulasi Kinerja Seluruh Staf ({allReports.length})
              </h3>
              <button
                onClick={handleExportDirectorExcel}
                disabled={allReports.length === 0}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer w-full sm:w-auto disabled:opacity-50"
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
              <>
                {/* ── MOBILE VIEW: CARD LIST (md:hidden) ── */}
                <div className="block md:hidden space-y-3">
                  {allReports.map((r) => {
                    const completedTasks = r.tasks?.filter(t => t.status === 'completed').length || 0
                    const totalTasks = r.tasks?.length || 0

                    return (
                      <div
                        key={r.id}
                        className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3 hover:border-red-200 transition-all"
                      >
                        {/* Header: User Info & Role */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center shrink-0 text-xs border border-red-200/60">
                              {r.user?.photo ? (
                                <img src={getAssetUrl(r.user.photo)} alt="" className="w-full h-full object-cover rounded-full" />
                              ) : (
                                r.user?.name?.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-800 text-xs truncate">{r.user?.name}</p>
                              <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                r.user?.role === 'admin' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {r.user?.role === 'admin' ? 'Admin' : 'Karyawan'}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            {r.attendance?.clock_in ? (
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                                {r.attendance.clock_in.substring(0, 5)} WIB
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                                Belum Absen
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-600">Progres ({completedTasks}/{totalTasks} selesai)</span>
                            <span className={r.completion_rate >= 80 ? 'text-emerald-600' : r.completion_rate >= 50 ? 'text-amber-600' : 'text-red-600'}>
                              {r.completion_rate}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                r.completion_rate >= 80 ? 'bg-emerald-500' :
                                r.completion_rate >= 50 ? 'bg-amber-500' : 'bg-red-600'
                              }`}
                              style={{ width: `${r.completion_rate}%` }}
                            />
                          </div>
                        </div>

                        {/* Rating Row & Detail Button */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                          <div className="flex items-center gap-3 text-[11px]">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium">Admin:</span>
                              {r.admin_rating ? (
                                <span className="font-bold text-red-600">⭐ {r.admin_rating}/5</span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">-</span>
                              )}
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium">Direktur:</span>
                              {r.director_rating ? (
                                <span className="font-bold text-red-700">⭐ {r.director_rating}/5</span>
                              ) : (
                                <span className="text-slate-400 text-[10px] italic">Belum</span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedReport(r)
                              setDirectorRating(r.director_rating || 5)
                              setDirectorNotes(r.director_notes || '')
                            }}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                          >
                            Detail & Evaluasi
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* ── DESKTOP VIEW: TABLE (hidden md:block) ── */}
                <div className="hidden md:block overflow-x-auto">
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
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 3: MASTER TANGGUNG JAWAB STAF
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'responsibilities' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-800 mb-4">
            Master Tanggung Jawab & Target KPI Seluruh Karyawan ({responsibilities.length})
          </h3>
          {loadingResp ? (
            <div className="py-16 text-center text-xs text-slate-400">Memuat...</div>
          ) : responsibilities.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">Belum ada tanggung jawab tercatat.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-2xl border border-slate-100 shadow-2xl space-y-4 sm:space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-xs sm:text-sm shrink-0">
                  {selectedReport.user?.photo ? (
                    <img src={getAssetUrl(selectedReport.user.photo)} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    selectedReport.user?.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-800 leading-tight">
                    Laporan Kerja: {selectedReport.user?.name}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
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
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-3.5">
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
                    <span className="mt-0.5 text-xs">
                      {t.status === 'completed' ? '🟢' : t.status === 'revision' ? '🟡' : '🔴'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-bold text-slate-800">{t.title}</p>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                          t.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : t.status === 'revision'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {t.status === 'completed' ? '🟢 Telah Selesai' : t.status === 'revision' ? '🟡 Revisi' : '🔴 Proses'}
                        </span>
                      </div>
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
            <div className="border-t border-slate-100 pt-3 sm:pt-4 space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-red-100 text-red-700">
                  <Award className="w-4 h-4" />
                </span>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Evaluasi & Penilaian Direktur Utama
                </h4>
              </div>

              {/* Star Rating Selector */}
              <div className="bg-slate-50 border border-slate-200/80 p-3 sm:p-3.5 rounded-2xl space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Pilih Rating Kinerja Staf:
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 bg-white px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setDirectorRating(star)}
                        className="p-1 text-slate-300 hover:text-red-500 transition-colors cursor-pointer group"
                      >
                        <Star
                          className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                            star <= directorRating ? 'text-red-600 fill-red-600' : 'text-slate-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-extrabold text-red-700 bg-red-100/70 px-2.5 py-1.5 rounded-xl border border-red-200">
                    {getRatingLabel(directorRating)}
                  </span>
                </div>
              </div>

              {/* Template Feedback Chips */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 block">
                  Rekomendasi Catatan Cepat (Klik untuk menyisipkan):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Kerja bagus, semua tugas terselesaikan tepat waktu.',
                    'Konsisten dan rapi, pertahankan performa kerja ini.',
                    'Prioritaskan penyelesaian to-do list yang masih tertunda.',
                    'Tolong tingkatkan koordinasi tim dan dokumentasi tugas.'
                  ].map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        if (!directorNotes.trim()) {
                          setDirectorNotes(tpl)
                        } else {
                          setDirectorNotes(prev => `${prev} ${tpl}`)
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-slate-200 text-[11px] font-medium text-slate-600 transition-all cursor-pointer text-left"
                    >
                      + {tpl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Textarea */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Catatan Evaluasi / Arahan Direktur:
                </label>
                <textarea
                  value={directorNotes}
                  onChange={(e) => setDirectorNotes(e.target.value)}
                  placeholder="Beri catatan apresiasi, arahan khusus, atau target tindak lanjut untuk staf Admin HR..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors text-center"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleSaveDirectorReview}
                  disabled={submittingRating}
                  className="px-5 py-2.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-red-600/20 cursor-pointer disabled:opacity-50 transition-all text-center"
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
