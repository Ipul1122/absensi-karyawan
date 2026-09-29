import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import {
  CheckCircle2,
  Star,
  Plus,
  Trash2,
  Edit2,
  X,
  Clock,
  ShieldCheck,
  FileSpreadsheet
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
}

export default function AdminKpi({ token }: AdminKpiProps) {
  const getTodayJakarta = () => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
  }

  const [activeTab, setActiveTab] = useState<'monitoring' | 'responsibilities' | 'my_todo'>('monitoring')

  // TAB 1: MONITORING
  const [filterDate, setFilterDate] = useState(getTodayJakarta())
  const [filterDivision, setFilterDivision] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [reports, setReports] = useState<AdminReport[]>([])
  const [summaryMetrics, setSummaryMetrics] = useState<any>(null)
  const [loadingReports, setLoadingReports] = useState(false)
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null)
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)

  // Review Form
  const [ratingInput, setRatingInput] = useState<number>(5)
  const [notesInput, setNotesInput] = useState<string>('')
  const [submittingReview, setSubmittingReview] = useState(false)

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
  }, [activeTab, filterDate, filterDivision, filterStatus, selectedEmployeeId])

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
          division: filterDivision,
          status: filterStatus
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

  const handleSaveReview = async () => {
    if (!selectedReport) return

    setSubmittingReview(true)
    try {
      const res = await axios.post(`${API_BASE_URL}/api/admin/kpi/reports/${selectedReport.id}/review`, {
        admin_rating: ratingInput,
        admin_notes: notesInput
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.data.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'Review Berhasil Disimpan!',
          timer: 1500,
          showConfirmButton: false
        })
        setSelectedReport(null)
        fetchAdminReports()
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan Review',
        text: err.response?.data?.message || 'Terjadi kesalahan.',
        confirmButtonColor: '#dc2626'
      })
    } finally {
      setSubmittingReview(false)
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
      const taskList = r.tasks?.map(t => `${t.status === 'completed' ? '[V]' : '[X]'} ${t.title}`).join('; ') || '-'
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
          <td style="text-align: center;">${r.status === 'reviewed_admin' ? 'Sudah Direview' : r.status === 'submitted' ? 'Menunggu Review' : 'Draft'}</td>
          <td style="text-align: center;">${r.admin_rating ? `${r.admin_rating} Bintang` : '-'}</td>
          <td>${r.admin_notes || '-'}</td>
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
              <th style="text-align: center;">Rating Admin</th>
              <th>Catatan Feedback Admin</th>
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
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'monitoring'
                ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            📊 Monitoring Laporan Kerja
          </button>
          <button
            onClick={() => setActiveTab('responsibilities')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'responsibilities'
                ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            🎯 Kelola Tanggung Jawab / KPI
          </button>
          <button
            onClick={() => setActiveTab('my_todo')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'my_todo'
                ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            📋 To-Do List Saya (Admin)
          </button>
        </div>

        {activeTab === 'monitoring' && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end pr-1">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Tanggal:</span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB 1: MONITORING LAPORAN KERJA STAF
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          {summaryMetrics && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Karyawan</span>
                <p className="text-2xl font-black text-slate-800 mt-1">{summaryMetrics.total_employees}</p>
                <span className="text-[11px] text-slate-400 font-medium">Status aktif</span>
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Presensi Hari Ini</span>
                <p className="text-2xl font-black text-emerald-600 mt-1">{summaryMetrics.attended_employees}</p>
                <span className="text-[11px] text-emerald-600/90 font-medium">Karyawan hadir</span>
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Laporan Masuk</span>
                <p className="text-2xl font-black text-red-600 mt-1">{summaryMetrics.submitted_reports}</p>
                <span className="text-[11px] text-red-600/90 font-medium">Telah disubmit</span>
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rata-rata Capaian</span>
                <p className="text-2xl font-black text-amber-500 mt-1">{summaryMetrics.average_completion_rate}%</p>
                <span className="text-[11px] text-amber-600/90 font-medium">Tugas terselesaikan</span>
              </div>
            </div>
          )}

          {/* Table List of Reports */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-800">
                  Laporan Kerja Harian Karyawan ({reports.length})
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Pantau to-do list, foto bukti kerja, dan berikan evaluasi serta rating bintang
                </p>
              </div>

              {/* Filters & Export Excel */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterDivision}
                  onChange={(e) => setFilterDivision(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Divisi</option>
                  {Array.from(new Set(employees.map(e => e.division).filter(Boolean))).map((div: any) => (
                    <option key={div} value={div}>{div}</option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Menunggu Review</option>
                  <option value="reviewed_admin">Sudah Direview Admin</option>
                </select>

                <button
                  onClick={handleExportAdminKpiExcel}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
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
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[650px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider text-[10px]">
                      <th className="pb-3 pl-2">Karyawan</th>
                      <th className="pb-3">Presensi Masuk</th>
                      <th className="pb-3">Jumlah Tugas</th>
                      <th className="pb-3">Progres Capaian</th>
                      <th className="pb-3">Rating Admin</th>
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
                            {r.admin_rating ? (
                              <div className="flex items-center gap-0.5 text-red-600">
                                {[...Array(r.admin_rating)].map((_, i) => (
                                  <Star key={i} className="w-3.5 h-3.5 fill-red-600 text-red-600" />
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Belum Dinilai</span>
                            )}
                          </td>
                          <td className="py-3.5 text-right pr-2">
                            <button
                              onClick={() => {
                                setSelectedReport(r)
                                setRatingInput(r.admin_rating || 5)
                                setNotesInput(r.admin_notes || '')
                              }}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                            >
                              Lihat & Review
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 2: KELOLA TANGGUNG JAWAB & TARGET KPI KARYAWAN
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'responsibilities' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-800">
                  Daftar Tanggung Jawab & Target KPI Karyawan
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Tanggung jawab yang diinputkan di sini akan tampil sebagai acuan kerja pada portal masing-masing karyawan
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-red-600/20 transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Tanggung Jawab
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
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
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingResp(resp)
                            setRespUserId(resp.user_id)
                            setRespTitle(resp.title)
                            setRespDescription(resp.description || '')
                            setRespTarget(resp.target_indicator || '')
                            setShowAddRespModal(true)
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteResponsibility(resp.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer"
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
          <div className="bg-red-50/60 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-600/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-red-950">
                To-Do List Harian Khusus Staf Admin
              </h4>
              <p className="text-[11px] text-red-800/90 mt-0.5 leading-relaxed">
                Setiap tugas dan laporan kerja yang Anda buat di sini <b>langsung diteruskan dan dievaluasi oleh Direktur</b> tanpa perantara.
              </p>
            </div>
          </div>

          <EmployeeKpi token={token} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL DETAIL LAPORAN & BERI REVIEW ADMIN
      ══════════════════════════════════════════════════════════════════ */}
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
                    <span className="mt-0.5">
                      {t.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold ${t.status === 'completed' ? 'text-slate-800' : 'text-slate-700'}`}>
                        {t.title}
                      </p>
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

            {/* Form Review Admin */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Beri Penilaian & Feedback Admin
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
                      onClick={() => setRatingInput(star)}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= ratingInput ? 'text-red-600 fill-red-600' : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-extrabold text-red-600 ml-2">
                    {ratingInput} / 5 Bintang
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Catatan / Masukan untuk Karyawan:
                </label>
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Contoh: Pekerjaan selesai tepat waktu, kualitas dokumentasi rapi..."
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
                  onClick={handleSaveReview}
                  disabled={submittingReview}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-red-600/20 cursor-pointer disabled:opacity-50"
                >
                  {submittingReview ? 'Menyimpan...' : 'Simpan Review & Rating'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT TANGGUNG JAWAB */}
      {showAddRespModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <form onSubmit={handleSaveResponsibility} className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md border border-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-800">
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

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddRespModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingResp}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-red-600/20 cursor-pointer disabled:opacity-50"
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
