import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import {
  Plus,
  Trash2,
  Edit2,
  X,
  ShieldCheck,
  FileSpreadsheet,
  Eye
} from 'lucide-react'
import { API_BASE_URL, getAssetUrl } from '../../../utils/api'
import EmployeeKpi from '../../employee/kpi/EmployeeKpi'

interface Employee {
  id: number
  name: string
  email: string
  division: string | null
  role: string
  photo: string | null
}

interface Responsibility {
  id: number
  user_id: number
  title: string
  description: string | null
  target_indicator: string | null
  status: string
  user?: {
    id: number
    name: string
    division: string | null
  }
}

interface AdminReport {
  id: number
  date: string
  user: {
    id: number
    name: string
    email: string
    division: string | null
    photo: string | null
  }
  attendance?: {
    id: number
    clock_in: string | null
    clock_out: string | null
    attendance_type: string | null
  } | null
  summary: string | null
  status: string
  completion_rate: number
  admin_notes: string | null
  admin_rating: number | null
  reviewedByAdmin?: { id: number; name: string } | null
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

interface AdminKpiProps {
  token: string
  user?: {
    id: number
    name: string
    email: string
    role: 'admin' | 'employee'
    photo?: string | null
  }
  initialTab?: 'monitoring' | 'responsibilities' | 'my_todo'
}

export default function AdminKpi({ token, user, initialTab = 'monitoring' }: AdminKpiProps) {
  const getTodayJakarta = () => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
  }

  const [activeTab, setActiveTab] = useState<'monitoring' | 'responsibilities' | 'my_todo'>(initialTab)

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  // TAB 1: MONITORING
  const [filterDate, setFilterDate] = useState(getTodayJakarta())
  const [filterDivision, setFilterDivision] = useState('all')
  const [reports, setReports] = useState<AdminReport[]>([])
  const [summaryMetrics, setSummaryMetrics] = useState<any>(null)
  const [loadingReports, setLoadingReports] = useState(false)
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null)
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)

  // TAB 2: RESPONSIBILITIES
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | 'all'>('all')
  const [responsibilities, setResponsibilities] = useState<Responsibility[]>([])
  const [loadingResp, setLoadingResp] = useState(false)
  const [showAddRespModal, setShowAddRespModal] = useState(false)
  const [editingResp, setEditingResp] = useState<Responsibility | null>(null)

  // Form Responsibility State
  const [respUserId, setRespUserId] = useState<number | ''>('')
  const [respTitle, setRespTitle] = useState('')
  const [respDescription, setRespDescription] = useState('')
  const [respTarget, setRespTarget] = useState('')
  const [savingResp, setSavingResp] = useState(false)

  useEffect(() => {
    fetchEmployeesList()
  }, [])

  useEffect(() => {
    if (activeTab === 'monitoring') {
      fetchAdminReports()
    } else if (activeTab === 'responsibilities') {
      fetchResponsibilities()
    }
  }, [activeTab, filterDate, filterDivision, selectedEmployeeId])

  const fetchEmployeesList = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data.status === 'success') {
        const emps = (res.data.data || []).filter((e: any) => e.role === 'employee')
        setEmployees(emps)
      }
    } catch (err) {
      console.error('Gagal mengambil daftar karyawan:', err)
    }
  }

  const fetchAdminReports = async () => {
    setLoadingReports(true)
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/kpi/reports`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          date: filterDate,
          division: filterDivision
        }
      })
      if (res.data.status === 'success') {
        setReports(res.data.data || [])
        setSummaryMetrics(res.data.summary)
      }
    } catch (err) {
      console.error('Gagal mengambil laporan KPI:', err)
    } finally {
      setLoadingReports(false)
    }
  }

  const fetchResponsibilities = async () => {
    setLoadingResp(true)
    try {
      const params: any = {}
      if (selectedEmployeeId !== 'all') {
        params.user_id = selectedEmployeeId
      }
      const res = await axios.get(`${API_BASE_URL}/api/admin/responsibilities`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      })
      if (res.data.status === 'success') {
        setResponsibilities(res.data.data || [])
      }
    } catch (err) {
      console.error('Gagal mengambil tanggung jawab:', err)
    } finally {
      setLoadingResp(false)
    }
  }

  const handleSaveResponsibility = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!respTitle.trim()) return

    setSavingResp(true)
    try {
      if (editingResp) {
        const res = await axios.put(`${API_BASE_URL}/api/admin/responsibilities/${editingResp.id}`, {
          title: respTitle,
          description: respDescription,
          target_indicator: respTarget
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (res.data.status === 'success') {
          Swal.fire({
            icon: 'success',
            title: 'Berhasil Diperbarui!',
            timer: 1200,
            showConfirmButton: false
          })
          setShowAddRespModal(false)
          setEditingResp(null)
          fetchResponsibilities()
        }
      } else {
        if (!respUserId) {
          Swal.fire({ icon: 'warning', title: 'Pilih Karyawan', text: 'Karyawan wajib dipilih.', confirmButtonColor: '#dc2626' })
          setSavingResp(false)
          return
        }

        const res = await axios.post(`${API_BASE_URL}/api/admin/responsibilities`, {
          user_id: respUserId,
          title: respTitle,
          description: respDescription,
          target_indicator: respTarget
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (res.data.status === 'success') {
          Swal.fire({
            icon: 'success',
            title: 'Tanggung Jawab Ditambahkan!',
            timer: 1200,
            showConfirmButton: false
          })
          setShowAddRespModal(false)
          resetRespForm()
          fetchResponsibilities()
        }
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err.response?.data?.message || 'Terjadi kesalahan saat menyimpan.',
        confirmButtonColor: '#dc2626'
      })
    } finally {
      setSavingResp(false)
    }
  }

  const resetRespForm = () => {
    setRespUserId('')
    setRespTitle('')
    setRespDescription('')
    setRespTarget('')
    setEditingResp(null)
  }

  const handleDeleteResponsibility = async (id: number) => {
    const confirm = await Swal.fire({
      title: 'Hapus Tanggung Jawab?',
      text: 'Data tanggung jawab ini akan dihapus dari sistem.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626'
    })

    if (!confirm.isConfirmed) return

    try {
      const res = await axios.delete(`${API_BASE_URL}/api/admin/responsibilities/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data.status === 'success') {
        fetchResponsibilities()
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err.response?.data?.message || 'Gagal menghapus data.',
        confirmButtonColor: '#dc2626'
      })
    }
  }

  // EXPORT EXCEL FUNCTION FOR ADMIN MONITORING
  const handleExportAdminKpiExcel = () => {
    if (reports.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Tidak Ada Data',
        text: `Tidak ada laporan kerja karyawan pada tanggal ${filterDate} untuk diexport.`,
        confirmButtonColor: '#dc2626'
      })
      return
    }

    const rows = reports.map((r, idx) => {
      const taskList = r.tasks?.map(t => `${t.status === 'completed' ? '[🟢 Selesai]' : t.status === 'revision' ? '[🟡 Revisi]' : '[🔴 Proses]'} ${t.title}`).join('; ') || '-'
      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><b>${r.user?.name || '-'}</b></td>
          <td>${r.user?.division || 'Karyawan'}</td>
          <td style="text-align: center;">${r.attendance?.clock_in ? r.attendance.clock_in.substring(0, 5) + ' WIB' : 'Belum Absen'}</td>
          <td style="text-align: center;">${r.tasks?.length || 0}</td>
          <td style="text-align: center;">${r.tasks?.filter(t => t.status === 'completed').length || 0}</td>
          <td style="text-align: center;"><b>${r.completion_rate}%</b></td>
          <td>${taskList}</td>
          <td>${r.summary || '-'}</td>
          <td style="text-align: center;">Terdata Otomatis</td>
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
        <h3>REKAPITULASI LAPORAN KPI & TO-DO LIST HARIAN KARYAWAN</h3>
        <p>Tanggal: <b>${filterDate}</b> | Divisi: <b>${filterDivision === 'all' ? 'Semua Divisi' : filterDivision}</b> | Total Laporan: <b>${reports.length}</b></p>
        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">No</th>
              <th>Nama Karyawan</th>
              <th>Divisi</th>
              <th style="text-align: center;">Jam Absen</th>
              <th style="text-align: center;">Total Tugas</th>
              <th style="text-align: center;">Tugas Selesai</th>
              <th style="text-align: center;">Ketercapaian (%)</th>
              <th>Rincian Tugas</th>
              <th>Ringkasan Karyawan</th>
              <th style="text-align: center;">Status Laporan</th>
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
    a.download = `Rekap_KPI_Karyawan_${filterDate}.xls`
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
            onClick={() => setActiveTab('monitoring')}
            className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'monitoring'
                ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            📊 Monitoring Laporan Kerja
          </button>
          <button
            onClick={() => setActiveTab('responsibilities')}
            className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'responsibilities'
                ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            🎯 Kelola Tanggung Jawab / KPI
          </button>
          <button
            onClick={() => setActiveTab('my_todo')}
            className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'my_todo'
                ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            📋 To-Do List Saya (Admin)
          </button>
        </div>

        {activeTab === 'monitoring' && (
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <span className="text-xs font-semibold text-slate-500">Tanggal:</span>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-2.5 sm:px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
              <button
                type="button"
                onClick={() => setFilterDate(getTodayJakarta())}
                className="px-2 sm:px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                title="Kembali ke Hari Ini"
              >
                Hari Ini
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB 1: MONITORING LAPORAN KERJA STAF
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'monitoring' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Summary Cards */}
          {summaryMetrics && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Karyawan</span>
                <p className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{summaryMetrics.total_employees}</p>
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Status aktif</span>
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Presensi Hari Ini</span>
                <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">{summaryMetrics.attended_employees}</p>
                <span className="text-[10px] sm:text-[11px] text-emerald-600/90 font-medium">Karyawan hadir</span>
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">To-Do List Terdata</span>
                <p className="text-xl sm:text-2xl font-black text-red-600 mt-1">{summaryMetrics.submitted_reports}</p>
                <span className="text-[10px] sm:text-[11px] text-red-600/90 font-medium">Telah terdata otomatis</span>
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rata-rata Capaian</span>
                <p className="text-xl sm:text-2xl font-black text-amber-500 mt-1">{summaryMetrics.average_completion_rate}%</p>
                <span className="text-[10px] sm:text-[11px] text-amber-600/90 font-medium">Tugas terselesaikan</span>
              </div>
            </div>
          )}

          {/* Table List of Reports */}
          <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-800">
                  Laporan Kerja Harian Karyawan ({reports.length})
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Pantau to-do list, rincian aktivitas, dan foto bukti kerja karyawan secara real-time
                </p>
              </div>

              {/* Filters & Export Excel */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterDivision}
                  onChange={(e) => setFilterDivision(e.target.value)}
                  className="px-3 py-2 sm:py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none cursor-pointer w-full sm:w-auto"
                >
                  <option value="all">Semua Divisi</option>
                  {Array.from(new Set(employees.map(e => e.division).filter(Boolean))).map((div: any) => (
                    <option key={div} value={div}>{div}</option>
                  ))}
                </select>

                <button
                  onClick={handleExportAdminKpiExcel}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
                  title="Export seluruh laporan hari ini ke file Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Export Excel
                </button>
              </div>
            </div>

            {loadingReports ? (
              <div className="py-16 text-center text-xs text-slate-400">Memuat laporan...</div>
            ) : reports.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm font-bold text-slate-600">Tidak ada laporan kerja pada tanggal ini</p>
                <p className="text-xs text-slate-400 mt-1">Belum ada karyawan yang mengisi to-do list pada {filterDate}.</p>
              </div>
            ) : (
              <>
                {/* ── MOBILE VIEW: CARD LIST (md:hidden) ── */}
                <div className="block md:hidden space-y-3">
                  {reports.map((r) => {
                    const completedCount = r.tasks?.filter(t => t.status === 'completed').length || 0
                    const totalCount = r.tasks?.length || 0

                    return (
                      <div
                        key={r.id}
                        className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3 hover:border-red-200 transition-all"
                      >
                        {/* Header: User Info & Presensi */}
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center shrink-0 overflow-hidden text-xs border border-red-200/60">
                              {r.user?.photo ? (
                                <img src={getAssetUrl(r.user.photo)} alt="" className="w-full h-full object-cover" />
                              ) : (
                                r.user?.name?.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-800 text-xs truncate leading-tight">{r.user?.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{r.user?.division || 'Karyawan'}</p>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            {r.attendance?.clock_in ? (
                              <span className="inline-block font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                                {r.attendance.clock_in.substring(0, 5)} WIB
                              </span>
                            ) : (
                              <span className="inline-block text-slate-400 italic text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                                Belum Absen
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar & Rate */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-600">Progres ({completedCount}/{totalCount} selesai)</span>
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

                        {/* Summary / Notes if any */}
                        {r.summary && (
                          <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-xl border border-slate-200/60 line-clamp-2">
                            "{r.summary}"
                          </p>
                        )}

                        {/* Status & Action Row */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                          <div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              🟢 Terdata Otomatis
                            </span>
                          </div>

                          <button
                            onClick={() => setSelectedReport(r)}
                            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs shadow-red-600/20 transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat Detail</span>
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
                        <th className="pb-3 pl-2">Karyawan</th>
                        <th className="pb-3">Presensi Masuk</th>
                        <th className="pb-3">Jumlah Tugas</th>
                        <th className="pb-3">Progres Capaian</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right pr-2">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {reports.map((r) => {
                        const completedCount = r.tasks?.filter(t => t.status === 'completed').length || 0
                        const totalCount = r.tasks?.length || 0

                        return (
                          <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 pl-2">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center shrink-0 overflow-hidden text-xs">
                                  {r.user?.photo ? (
                                    <img src={getAssetUrl(r.user.photo)} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    r.user?.name?.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <p className="font-extrabold text-slate-800 leading-tight">{r.user?.name}</p>
                                  <p className="text-[10px] text-slate-400">{r.user?.division || 'Karyawan'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5">
                              {r.attendance?.clock_in ? (
                                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                                  {r.attendance.clock_in.substring(0, 5)} WIB
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Belum Absen</span>
                              )}
                            </td>
                            <td className="py-3.5">
                              <span className="font-bold text-slate-700">
                                {completedCount} / {totalCount} Selesai
                              </span>
                            </td>
                            <td className="py-3.5 min-w-[140px]">
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                                  <div
                                    className={`h-full rounded-full ${
                                      r.completion_rate >= 80 ? 'bg-emerald-500' :
                                      r.completion_rate >= 50 ? 'bg-amber-500' : 'bg-red-600'
                                    }`}
                                    style={{ width: `${r.completion_rate}%` }}
                                  />
                                </div>
                                <span className="font-bold text-slate-700 text-[11px]">
                                  {r.completion_rate}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                🟢 Terdata Otomatis
                              </span>
                            </td>
                            <td className="py-3.5 text-right pr-2">
                              <button
                                onClick={() => setSelectedReport(r)}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Lihat Detail</span>
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 2: KELOLA TANGGUNG JAWAB & TARGET KPI KARYAWAN
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'responsibilities' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs overflow-hidden">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-100">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-800">
                  Daftar Tanggung Jawab & Target KPI Karyawan
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5 max-w-2xl leading-relaxed">
                  Tanggung jawab yang diinputkan di sini akan tampil sebagai acuan kerja pada portal masing-masing karyawan
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0">
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="w-full sm:w-60 md:w-64 max-w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer truncate shadow-xs"
                >
                  <option value="all">Semua Karyawan</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.division || 'Staf'})</option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    resetRespForm()
                    setShowAddRespModal(true)
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-red-600/20 transition-all cursor-pointer shrink-0 whitespace-nowrap hover:scale-[1.01] active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Tanggung Jawab</span>
                </button>
              </div>
            </div>

            {loadingResp ? (
              <div className="py-16 text-center text-xs text-slate-400">Memuat data tanggung jawab...</div>
            ) : responsibilities.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm font-bold text-slate-600">Belum Ada Tanggung Jawab Ditetapkan</p>
                <p className="text-xs text-slate-400 mt-1">Klik tombol "+ Tambah Tanggung Jawab" di atas untuk menambahkan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 mt-4 sm:mt-5">
                {responsibilities.map((resp) => (
                  <div key={resp.id} className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between hover:border-red-200 hover:shadow-xs transition-all">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase text-red-700 bg-red-100/80 px-2 py-0.5 rounded">
                          {resp.user?.name || 'Karyawan'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {resp.user?.division || ''}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 line-clamp-1">
                        {resp.title}
                      </h4>
                      {resp.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {resp.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200/60 truncate max-w-[170px]">
                        🎯 {resp.target_indicator || 'Umum'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingResp(resp)
                            setRespUserId(resp.user_id)
                            setRespTitle(resp.title)
                            setRespDescription(resp.description || '')
                            setRespTarget(resp.target_indicator || '')
                            setShowAddRespModal(true)
                          }}
                          className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteResponsibility(resp.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 3: TO-DO LIST SAYA (ADMIN PRIBADI -> LANGSUNG KE DIREKTUR)
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'my_todo' && (
        <div className="space-y-4">
          <div className="bg-red-50/60 border border-red-200 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-600/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-red-950">
                To-Do List Harian Khusus Staf Admin
              </h4>
              <p className="text-[11px] text-red-800/90 mt-0.5 leading-relaxed">
                Setiap tugas dan aktivitas kerja yang diinput di sini <b>langsung terdata otomatis dan terkirim</b> secara instan tanpa perlu approval atau ACC.
              </p>
            </div>
          </div>

          <EmployeeKpi token={token} user={user} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL DETAIL LAPORAN & TO-DO LIST KARYAWAN
      ══════════════════════════════════════════════════════════════════ */}
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
                    Rincian To-Do List: {selectedReport.user?.name}
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

            {/* Banner Status Otomatis Terdata */}
            <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-3 flex items-center gap-2.5">
              <span className="text-base">🟢</span>
              <p className="text-xs text-emerald-800 font-semibold leading-relaxed">
                To-do list dan tugas harian karyawan ini <strong>langsung terdata otomatis</strong> ke sistem saat diinputkan tanpa perlu persetujuan atau ACC manual.
              </p>
            </div>

            {selectedReport.summary && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-3.5">
                <span className="text-[10px] font-black uppercase text-slate-400">Ringkasan dari Karyawan:</span>
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
                        <p className={`text-xs font-bold ${t.status === 'completed' ? 'text-slate-800' : 'text-slate-700'}`}>
                          {t.title}
                        </p>
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
                      {t.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{t.description}</p>
                      )}
                      {t.responsibility && (
                        <span className="inline-block mt-1 text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                          📌 {t.responsibility.title}
                        </span>
                      )}
                    </div>
                  </div>

                  {t.image_path && (
                    <img
                      src={getAssetUrl(t.image_path)}
                      alt="Bukti Kerja"
                      onClick={() => setLightboxImg(getAssetUrl(t.image_path))}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs cursor-pointer hover:scale-105 transition-transform shrink-0"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer text-center shadow-xs"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT TANGGUNG JAWAB */}
      {showAddRespModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <form onSubmit={handleSaveResponsibility} className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-md border border-slate-100 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-800">
                {editingResp ? 'Edit Tanggung Jawab' : 'Tambah Tanggung Jawab / KPI'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddRespModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {!editingResp && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Pilih Karyawan:
                  </label>
                  <select
                    value={respUserId}
                    onChange={(e) => setRespUserId(e.target.value ? Number(e.target.value) : '')}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Pilih Karyawan --</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.division || 'Karyawan'})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama Tanggung Jawab / Tugas Pokok:
                </label>
                <input
                  type="text"
                  value={respTitle}
                  onChange={(e) => setRespTitle(e.target.value)}
                  placeholder="Contoh: Rekapitulasi Faktur Pajak & Penagihan"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Deskripsi / Rincian Tanggung Jawab (Opsional):
                </label>
                <textarea
                  value={respDescription}
                  onChange={(e) => setRespDescription(e.target.value)}
                  placeholder="Penjelasan detail standar pelaksanaan tugas..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Target / Indikator Capaian (Opsional):
                </label>
                <input
                  type="text"
                  value={respTarget}
                  onChange={(e) => setRespTarget(e.target.value)}
                  placeholder="Contoh: Selesai sebelum tanggal 20 setiap bulan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddRespModal(false)}
                className="px-4 py-2.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer text-center"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingResp}
                className="px-5 py-2.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-red-600/20 cursor-pointer disabled:opacity-50 text-center"
              >
                {savingResp ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
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
