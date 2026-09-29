import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import {
  CheckCircle2,
  Circle,
  Plus,
  Camera,
  Trash2,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Send,
  Star,
  Clock,
  Layers,
  X,
  FileSpreadsheet
} from 'lucide-react'
import { API_BASE_URL, getAssetUrl } from '../../../utils/api'

interface Responsibility {
  id: number
  title: string
  description: string | null
  target_indicator: string | null
}

interface Task {
  id: number
  title: string
  description: string | null
  image_path: string | null
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  completed_at: string | null
  responsibility: {
    id: number
    title: string
  } | null
}

interface DailyReport {
  id: number
  date: string
  summary: string | null
  status: 'draft' | 'submitted' | 'reviewed_admin' | 'reviewed_director'
  completion_rate: number
  admin_notes: string | null
  admin_rating: number | null
  reviewed_by_admin?: { id: number; name: string } | null
  director_notes: string | null
  director_rating: number | null
  reviewed_by_director?: { id: number; name: string } | null
  updated_at?: string | null
  tasks: Task[]
}

interface EmployeeKpiProps {
  token: string
}

export default function EmployeeKpi({ token }: EmployeeKpiProps) {
  const getTodayJakarta = () => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
  }

  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today')
  const [selectedDate, setSelectedDate] = useState<string>(getTodayJakarta())
  const [hasAttendance, setHasAttendance] = useState<boolean>(false)
  const [attendanceInfo, setAttendanceInfo] = useState<any>(null)
  const [myResponsibilities, setMyResponsibilities] = useState<Responsibility[]>([])
  const [report, setReport] = useState<DailyReport | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // Single Quick Add
  const [quickTitle, setQuickTitle] = useState('')
  const [quickPriority, setQuickPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [quickResponsibilityId, setQuickResponsibilityId] = useState<number | ''>('')
  const [submittingQuick, setSubmittingQuick] = useState(false)

  // Bulk Add Modal
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkRows, setBulkRows] = useState<Array<{ title: string; priority: 'low' | 'medium' | 'high'; responsibility_id: number | '' }>>([
    { title: '', priority: 'medium', responsibility_id: '' },
    { title: '', priority: 'medium', responsibility_id: '' },
    { title: '', priority: 'medium', responsibility_id: '' },
  ])
  const [submittingBulk, setSubmittingBulk] = useState(false)

  // Submit Summary Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [dailySummary, setDailySummary] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)

  // Image Lightbox Modal
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  // Riwayat State
  const [historyList, setHistoryList] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyMonth, setHistoryMonth] = useState(getTodayJakarta().slice(0, 7))

  useEffect(() => {
    fetchMyResponsibilities()
  }, [])

  useEffect(() => {
    if (activeTab === 'today') {
      fetchReportForDate(selectedDate)
    } else {
      fetchHistory()
    }
  }, [selectedDate, activeTab, historyMonth])

  const fetchMyResponsibilities = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/kpi/my-responsibilities`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data.status === 'success') {
        setMyResponsibilities(res.data.data)
      }
    } catch (err) {
      console.error('Gagal mengambil tanggung jawab:', err)
    }
  }

  const fetchReportForDate = async (dateStr: string) => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE_URL}/api/kpi/by-date`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { date: dateStr }
      })
      if (res.data.status === 'success') {
        setHasAttendance(res.data.data.has_attendance)
        setAttendanceInfo(res.data.data.attendance)
        setReport(res.data.data.report)
      }
    } catch (err: any) {
      console.error('Gagal mengambil data to-do list:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    setLoadingHistory(true)
    try {
      const res = await axios.get(`${API_BASE_URL}/api/kpi/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { month: historyMonth }
      })
      if (res.data.status === 'success') {
        setHistoryList(res.data.data.data || [])
      }
    } catch (err) {
      console.error('Gagal mengambil riwayat to-do list:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickTitle.trim()) return

    if (!hasAttendance) {
      Swal.fire({
        icon: 'warning',
        title: 'Presensi Masuk Diperlukan',
        text: 'Anda belum melakukan absen masuk pada tanggal ini. Silakan absen terlebih dahulu.',
        confirmButtonColor: '#dc2626'
      })
      return
    }

    setSubmittingQuick(true)
    try {
      const payload: any = {
        date: selectedDate,
        title: quickTitle.trim(),
        priority: quickPriority
      }
      if (quickResponsibilityId !== '') {
        payload.responsibility_id = quickResponsibilityId
      }

      const res = await axios.post(`${API_BASE_URL}/api/kpi/tasks`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.data.status === 'success') {
        setQuickTitle('')
        fetchReportForDate(selectedDate)
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menambah Tugas',
        text: err.response?.data?.message || 'Terjadi kesalahan sistem.',
        confirmButtonColor: '#dc2626'
      })
    } finally {
      setSubmittingQuick(false)
    }
  }

  const handleAddBulkRow = () => {
    setBulkRows([...bulkRows, { title: '', priority: 'medium', responsibility_id: '' }])
  }

  const handleRemoveBulkRow = (index: number) => {
    if (bulkRows.length <= 1) return
    setBulkRows(bulkRows.filter((_, i) => i !== index))
  }

  const handleBulkSubmit = async () => {
    const validTasks = bulkRows
      .filter(r => r.title.trim() !== '')
      .map(r => ({
        title: r.title.trim(),
        priority: r.priority,
        responsibility_id: r.responsibility_id !== '' ? r.responsibility_id : null
      }))

    if (validTasks.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Form Kosong',
        text: 'Minimal isi satu judul tugas.',
        confirmButtonColor: '#dc2626'
      })
      return
    }

    setSubmittingBulk(true)
    try {
      const res = await axios.post(`${API_BASE_URL}/api/kpi/tasks/bulk`, {
        date: selectedDate,
        tasks: validTasks
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.data.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: res.data.message,
          timer: 1500,
          showConfirmButton: false
        })
        setShowBulkModal(false)
        setBulkRows([
          { title: '', priority: 'medium', responsibility_id: '' },
          { title: '', priority: 'medium', responsibility_id: '' },
        ])
        fetchReportForDate(selectedDate)
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Bulk Add',
        text: err.response?.data?.message || 'Terjadi kesalahan sistem.',
        confirmButtonColor: '#dc2626'
      })
    } finally {
      setSubmittingBulk(false)
    }
  }

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    try {
      const res = await axios.patch(`${API_BASE_URL}/api/kpi/tasks/${task.id}/status`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.data.status === 'success') {
        if (report) {
          const updatedTasks = report.tasks.map(t => t.id === task.id ? { ...t, status: newStatus as any, completed_at: newStatus === 'completed' ? new Date().toISOString() : null } : t)
          setReport({
            ...report,
            tasks: updatedTasks,
            completion_rate: res.data.completion_rate
          })
        }
      }
    } catch (err: any) {
      console.error('Gagal update status:', err)
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    const result = await Swal.fire({
      title: 'Hapus Tugas?',
      text: 'Tugas ini beserta foto buktinya akan dihapus dari daftar.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b'
    })

    if (!result.isConfirmed) return

    try {
      const res = await axios.delete(`${API_BASE_URL}/api/kpi/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data.status === 'success') {
        fetchReportForDate(selectedDate)
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menghapus',
        text: err.response?.data?.message || 'Terjadi kesalahan.',
        confirmButtonColor: '#dc2626'
      })
    }
  }

  const handlePhotoUpload = async (taskId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const MAX_SIZE = 2 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      Swal.fire({
        icon: 'error',
        title: 'Ukuran Foto Terlalu Besar!',
        text: `Ukuran file Anda ${(file.size / (1024 * 1024)).toFixed(2)} MB. Maksimal ukuran foto bukti adalah 2MB.`,
        confirmButtonColor: '#dc2626'
      })
      e.target.value = ''
      return
    }

    const formData = new FormData()
    formData.append('image', file)

    Swal.fire({
      title: 'Mengunggah Foto...',
      text: 'Harap tunggu sejenak.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    })

    try {
      const res = await axios.post(`${API_BASE_URL}/api/kpi/tasks/${taskId}/upload-photo`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      if (res.data.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'Foto Berhasil Diunggah!',
          timer: 1200,
          showConfirmButton: false
        })
        fetchReportForDate(selectedDate)
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengunggah',
        text: err.response?.data?.message || 'Gagal mengirim foto ke server.',
        confirmButtonColor: '#dc2626'
      })
    } finally {
      e.target.value = ''
    }
  }

  const handleDeletePhoto = async (taskId: number) => {
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/kpi/tasks/${taskId}/delete-photo`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data.status === 'success') {
        fetchReportForDate(selectedDate)
      }
    } catch (err) {
      console.error('Gagal hapus foto:', err)
    }
  }

  const handleCarryOver = async () => {
    if (!hasAttendance) {
      Swal.fire({
        icon: 'warning',
        title: 'Belum Absen Masuk',
        text: 'Lakukan absen masuk terlebih dahulu sebelum memindahkan tugas.',
        confirmButtonColor: '#dc2626'
      })
      return
    }

    const confirm = await Swal.fire({
      title: 'Tarik Tugas Kemarin?',
      text: 'Tugas-tugas dari hari sebelumnya yang belum selesai akan disalin ke tanggal aktif hari ini.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Tarik Sekarang',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626'
    })

    if (!confirm.isConfirmed) return

    try {
      const res = await axios.post(`${API_BASE_URL}/api/kpi/carry-over`, {
        target_date: selectedDate
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.data.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'Selesai!',
          text: res.data.message,
          confirmButtonColor: '#dc2626'
        })
        fetchReportForDate(selectedDate)
      } else if (res.data.status === 'info') {
        Swal.fire({
          icon: 'info',
          title: 'Informasi',
          text: res.data.message,
          confirmButtonColor: '#dc2626'
        })
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err.response?.data?.message || 'Gagal menarik tugas kemarin.',
        confirmButtonColor: '#dc2626'
      })
    }
  }

  const handleSubmitReport = async () => {
    setSubmittingReport(true)
    try {
      const res = await axios.post(`${API_BASE_URL}/api/kpi/submit-daily`, {
        date: selectedDate,
        summary: dailySummary
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.data.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'Laporan Terkirim! 🎉',
          text: 'Laporan kerja harian Anda telah tersimpan dan siap ditinjau oleh Admin & Direktur.',
          confirmButtonColor: '#dc2626'
        })
        setShowSubmitModal(false)
        fetchReportForDate(selectedDate)
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengirim Laporan',
        text: err.response?.data?.message || 'Terjadi kesalahan.',
        confirmButtonColor: '#dc2626'
      })
    } finally {
      setSubmittingReport(false)
    }
  }

  // Export Excel Single Date
  const handleExportSingleDateExcel = () => {
    if (!report || !report.tasks || report.tasks.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Tidak Ada Data',
        text: 'Tidak ada tugas yang bisa diexport pada tanggal ini.',
        confirmButtonColor: '#dc2626'
      })
      return
    }

    const rows = report.tasks.map((t, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td>${t.title}</td>
        <td>${t.description || '-'}</td>
        <td>${t.responsibility?.title || 'Umum'}</td>
        <td style="text-align: center;">${t.priority === 'high' ? 'Tinggi' : t.priority === 'medium' ? 'Sedang' : 'Rendah'}</td>
        <td style="text-align: center;">${t.status === 'completed' ? 'Selesai' : 'Belum Selesai'}</td>
        <td style="text-align: center;">${t.completed_at ? new Date(t.completed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
      </tr>
    `).join('')

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
        <h3>LAPORAN TO-DO LIST HARIAN KARYAWAN</h3>
        <p>Tanggal: <b>${selectedDate}</b> | Ketercapaian: <b>${completionRate}%</b> (${completedTasks}/${totalTasks} Selesai)</p>
        ${report.summary ? `<p>Catatan Karyawan: <i>${report.summary}</i></p>` : ''}
        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">No</th>
              <th>Nama Tugas</th>
              <th>Keterangan</th>
              <th>Tanggung Jawab KPI</th>
              <th style="text-align: center;">Prioritas</th>
              <th style="text-align: center;">Status</th>
              <th style="text-align: center;">Waktu Selesai</th>
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
    a.download = `To-Do-List_${selectedDate}.xls`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Export History to Excel
  const handleExportHistoryExcel = () => {
    if (historyList.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Tidak Ada Data',
        text: 'Tidak ada riwayat laporan pada bulan ini.',
        confirmButtonColor: '#dc2626'
      })
      return
    }

    const rows = historyList.map((item, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td style="text-align: center;">${item.date}</td>
        <td style="text-align: center;">${item.completion_rate}%</td>
        <td style="text-align: center;">${item.tasks?.length || 0}</td>
        <td>${item.summary || '-'}</td>
        <td style="text-align: center;">${item.admin_rating ? `${item.admin_rating} Bintang` : '-'}</td>
        <td>${item.admin_notes || '-'}</td>
        <td style="text-align: center;">${item.director_rating ? `${item.director_rating} Bintang` : '-'}</td>
        <td>${item.director_notes || '-'}</td>
      </tr>
    `).join('')

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
        <h3>REKAPITULASI KINERJA & TO-DO LIST BULAN ${historyMonth}</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">No</th>
              <th style="text-align: center;">Tanggal</th>
              <th style="text-align: center;">Ketercapaian (%)</th>
              <th style="text-align: center;">Total Tugas</th>
              <th>Ringkasan Kerja</th>
              <th style="text-align: center;">Rating Admin</th>
              <th>Catatan Admin</th>
              <th style="text-align: center;">Rating Direktur</th>
              <th>Catatan Direktur</th>
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
    a.download = `Rekap_Kinerja_${historyMonth}.xls`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const tasks = report?.tasks || []
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const completionRate = report?.completion_rate ?? 0

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* ══════════════════════════════════════════════════════════════════
          TOP NAVIGATION TABS
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl p-2.5 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'today'
                ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            📋 To-Do List Harian
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            🗓️ Riwayat & Penilaian KPI
          </button>
        </div>

        {activeTab === 'today' && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 w-full sm:w-auto justify-between sm:justify-end pr-1">
            <span>Pilih Tanggal:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer"
            />
          </div>
        )}
      </div>

      {activeTab === 'today' ? (
        <>
          {/* ══════════════════════════════════════════════════════════════════
              BAGIAN 1: TANGGUNG JAWAB & TARGET KPI SAYA (Merah Elegan)
          ══════════════════════════════════════════════════════════════════ */}
          <div className="bg-gradient-to-br from-red-50/60 via-slate-50/50 to-white border border-red-200/80 rounded-3xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm shadow-red-600/20">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                    Tanggung Jawab & Target KPI Saya
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Ditetapkan oleh Admin sebagai pedoman utama pekerjaan Anda
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 bg-red-100/80 text-red-800 rounded-full border border-red-200">
                {myResponsibilities.length} Tanggung Jawab
              </span>
            </div>

            {myResponsibilities.length === 0 ? (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center">
                <p className="text-xs text-slate-500 font-medium">
                  Belum ada tanggung jawab spesifik yang ditetapkan Admin untuk akun Anda. Anda tetap dapat membuat to-do list harian mandiri.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {myResponsibilities.map((resp, idx) => (
                  <div key={resp.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:border-red-200 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 text-[10px] font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                          {resp.title}
                        </h4>
                      </div>
                      {resp.description && (
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed pl-7">
                          {resp.description}
                        </p>
                      )}
                    </div>
                    {resp.target_indicator && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 pl-7 flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200/60">
                          🎯 Target: {resp.target_indicator}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              BAGIAN 2: STATUS PRESENSI HARI/TANGGAL INI (GATE TO-DO LIST)
          ══════════════════════════════════════════════════════════════════ */}
          {!hasAttendance && !loading && (
            <div className="bg-red-50/70 border border-red-200 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3 w-full">
                <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-600/20">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-red-950">
                    Presensi Masuk Belum Tercatat ({selectedDate})
                  </h4>
                  <p className="text-xs text-red-800/90 mt-0.5 leading-relaxed">
                    Sistem mengunci pengisian to-do list sampai Anda melakukan <b>Absen Masuk (Clock-In)</b> pada tanggal ini.
                  </p>
                </div>
              </div>
              {selectedDate === getTodayJakarta() && (
                <a
                  href="/employee/absen"
                  className="w-full sm:w-auto text-center px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-red-600/20 transition-all shrink-0 active:scale-95 cursor-pointer"
                >
                  Absen Sekarang →
                </a>
              )}
            </div>
          )}

          {hasAttendance && attendanceInfo && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Presensi Masuk Terverifikasi: <span className="font-extrabold text-red-600">{attendanceInfo.clock_in?.substring(0, 5)} WIB</span> ({attendanceInfo.attendance_type || 'Kantor'})
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 w-fit">
                Sesi Terbuka
              </span>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              BAGIAN 3: PROGRESS & RINGKASAN CAPAIAN HARI INI
          ══════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Progress Card */}
            <div className="md:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-800">
                    Ketercapaian To-Do List Hari Ini
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {completedTasks} dari {totalTasks} tugas telah diselesaikan
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-black ${
                    completionRate >= 80 ? 'text-emerald-600' :
                    completionRate >= 50 ? 'text-amber-500' : 'text-red-600'
                  }`}>
                    {completionRate}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/60 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    completionRate >= 80 ? 'bg-emerald-500' :
                    completionRate >= 50 ? 'bg-amber-500' :
                    'bg-red-600'
                  }`}
                  style={{ width: `${completionRate}%` }}
                />
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowBulkModal(true)}
                    disabled={!hasAttendance}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Bulk Add
                  </button>
                  <button
                    onClick={handleCarryOver}
                    disabled={!hasAttendance}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tarik Tugas Kemarin
                  </button>
                  <button
                    onClick={handleExportSingleDateExcel}
                    disabled={totalTasks === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Export data tanggal ini ke Excel"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Export Excel
                  </button>
                </div>

                <button
                  onClick={() => setShowSubmitModal(true)}
                  disabled={!hasAttendance || totalTasks === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold shadow-sm shadow-red-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  {report?.status === 'submitted' ? 'Update Laporan' : 'Kirim Laporan'}
                </button>
              </div>
            </div>

            {/* Review Status Card */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Status Peninjauan
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                    report?.status === 'reviewed_director' ? 'bg-red-50 text-red-700 border-red-200' :
                    report?.status === 'reviewed_admin' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    report?.status === 'submitted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    {report?.status === 'reviewed_director' ? '👑 Dinilai Direktur' :
                     report?.status === 'reviewed_admin' ? '👔 Disetujui Admin' :
                     report?.status === 'submitted' ? '⏳ Menunggu Review' : '📝 Draft'}
                  </span>
                </div>

                {(report?.admin_rating || report?.director_rating) && (
                  <div className="mt-3 bg-red-50/50 border border-red-200 rounded-xl p-2.5">
                    <p className="text-[10px] font-bold text-red-800">Penilaian Kinerja:</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= ((report.director_rating || report.admin_rating) ?? 0)
                              ? 'text-red-500 fill-red-500'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    {report.admin_notes && (
                      <p className="text-[11px] text-slate-700 italic mt-1 bg-white/90 p-1.5 rounded-lg border border-red-100">
                        Admin: "{report.admin_notes}"
                      </p>
                    )}
                    {report.director_notes && (
                      <p className="text-[11px] text-red-900 italic mt-1 bg-red-100/60 p-1.5 rounded-lg border border-red-200">
                        Direktur: "{report.director_notes}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-400 mt-2 font-medium">
                Pembaruan: {report?.updated_at ? new Date(report.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              BAGIAN 4: QUICK ADD FORM
          ══════════════════════════════════════════════════════════════════ */}
          <form onSubmit={handleQuickAdd} className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="+ Tambah tugas hari ini lalu tekan Enter..."
                disabled={!hasAttendance}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 disabled:opacity-50"
              />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto">
              {myResponsibilities.length > 0 && (
                <select
                  value={quickResponsibilityId}
                  onChange={(e) => setQuickResponsibilityId(e.target.value ? Number(e.target.value) : '')}
                  disabled={!hasAttendance}
                  className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer disabled:opacity-50"
                >
                  <option value="">(Tugas Umum)</option>
                  {myResponsibilities.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={quickPriority}
                onChange={(e) => setQuickPriority(e.target.value as any)}
                disabled={!hasAttendance}
                className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer disabled:opacity-50"
              >
                <option value="low">🟢 Rendah</option>
                <option value="medium">🟡 Sedang</option>
                <option value="high">🔴 Tinggi</option>
              </select>

              <button
                type="submit"
                disabled={!hasAttendance || !quickTitle.trim() || submittingQuick}
                className="w-full sm:w-auto px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-red-600/20 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingQuick ? 'Menyimpan...' : 'Tambah'}
              </button>
            </div>
          </form>

          {/* ══════════════════════════════════════════════════════════════════
              BAGIAN 5: DAFTAR TO-DO LIST & FOTO (< 2MB)
          ══════════════════════════════════════════════════════════════════ */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center justify-between">
              <span>Daftar Pekerjaan ({tasks.length})</span>
              <span className="text-[11px] font-normal text-slate-400">
                Centang lingkaran saat tugas telah selesai
              </span>
            </h3>

            {tasks.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-700">Belum Ada Tugas Ditambahkan</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Ketik tugas pada form di atas atau gunakan tombol <b>Bulk Add</b> untuk memasukkan beberapa pekerjaan sekaligus.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => {
                  const isDone = task.status === 'completed'
                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isDone
                          ? 'bg-emerald-50/40 border-emerald-200/80'
                          : 'bg-white border-slate-200/70 hover:border-red-200 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(task)}
                          className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 hover:text-red-500" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p className={`text-xs sm:text-sm font-bold tracking-tight ${
                            isDone ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}>
                            {task.title}
                          </p>

                          {task.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              task.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                              task.priority === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {task.priority === 'high' ? '🔴 Tinggi' :
                               task.priority === 'medium' ? '🟡 Sedang' : '🟢 Rendah'}
                            </span>

                            {task.responsibility && (
                              <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 truncate max-w-[200px]">
                                📌 {task.responsibility.title}
                              </span>
                            )}

                            {isDone && task.completed_at && (
                              <span className="text-[10px] font-medium text-emerald-700 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Selesai {new Date(task.completed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pl-8 sm:pl-0 shrink-0">
                        {task.image_path ? (
                          <div className="relative group">
                            <img
                              src={getAssetUrl(task.image_path)}
                              alt="Bukti Kerja"
                              onClick={() => setLightboxImage(getAssetUrl(task.image_path))}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs cursor-pointer hover:scale-105 transition-transform"
                            />
                            <button
                              onClick={() => handleDeletePhoto(task.id)}
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow"
                              title="Hapus foto"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <label className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer">
                            <Camera className="w-3.5 h-3.5 text-red-600" />
                            <span>Foto Bukti</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handlePhotoUpload(task.id, e)}
                            />
                          </label>
                        )}

                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Hapus tugas"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* ══════════════════════════════════════════════════════════════════
            TAB RIWAYAT & PENILAIAN KPI SAYA
        ══════════════════════════════════════════════════════════════════ */
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Riwayat Laporan & Evaluasi Kinerja</h3>
              <p className="text-xs text-slate-400 font-medium">Lihat catatan evaluasi dan penilaian bintang dari atasan</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={historyMonth}
                onChange={(e) => setHistoryMonth(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              />
              <button
                onClick={handleExportHistoryExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Export Excel
              </button>
            </div>
          </div>

          {loadingHistory ? (
            <div className="py-12 text-center text-xs text-slate-400">Memuat riwayat...</div>
          ) : historyList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Tidak ada data laporan kerja pada bulan {historyMonth}.
            </div>
          ) : (
            <div className="space-y-3">
              {historyList.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl border border-slate-200/80 hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800">
                        {new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        item.completion_rate >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        item.completion_rate >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {item.completion_rate}% Selesai
                      </span>
                    </div>

                    {item.summary && (
                      <p className="text-xs text-slate-600 mt-1 italic">
                        Ringkasan: "{item.summary}"
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500">
                      <span>Total: <b>{item.tasks?.length || 0} tugas</b></span>
                      {item.admin_notes && (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Catatan Admin: {item.admin_notes}
                        </span>
                      )}
                      {item.director_notes && (
                        <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          Catatan Direktur: {item.director_notes}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= ((item.director_rating || item.admin_rating) ?? 0)
                            ? 'text-red-500 fill-red-500'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 1: BULK ADD TASKS
      ══════════════════════════════════════════════════════════════════ */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-2xl border border-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Bulk Add Tasks</h3>
                <p className="text-xs text-slate-400 font-medium">Tanggal: {selectedDate}</p>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {bulkRows.map((row, idx) => (
                <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-slate-50/50 p-2 sm:p-0 rounded-xl">
                  <span className="text-xs font-bold text-slate-400 w-5 text-center hidden sm:inline">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    value={row.title}
                    onChange={(e) => {
                      const updated = [...bulkRows]
                      updated[idx].title = e.target.value
                      setBulkRows(updated)
                    }}
                    placeholder={`Tugas ${idx + 1}...`}
                    className="flex-1 w-full sm:w-auto px-3 py-2 bg-white sm:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                  {myResponsibilities.length > 0 && (
                    <select
                      value={row.responsibility_id}
                      onChange={(e) => {
                        const updated = [...bulkRows]
                        updated[idx].responsibility_id = e.target.value ? Number(e.target.value) : ''
                        setBulkRows(updated)
                      }}
                      className="px-2.5 py-2 bg-white sm:bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 focus:outline-none max-w-[130px]"
                    >
                      <option value="">(Umum)</option>
                      {myResponsibilities.map(r => (
                        <option key={r.id} value={r.id}>{r.title}</option>
                      ))}
                    </select>
                  )}
                  <select
                    value={row.priority}
                    onChange={(e) => {
                      const updated = [...bulkRows]
                      updated[idx].priority = e.target.value as any
                      setBulkRows(updated)
                    }}
                    className="px-2 py-2 bg-white sm:bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 focus:outline-none"
                  >
                    <option value="low">🟢</option>
                    <option value="medium">🟡</option>
                    <option value="high">🔴</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveBulkRow(idx)}
                    disabled={bulkRows.length <= 1}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-30 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleAddBulkRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Baris
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleBulkSubmit}
                  disabled={submittingBulk}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-red-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submittingBulk ? 'Menyimpan...' : 'Simpan Semua Tugas'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 2: SUBMIT DAILY REPORT
      ══════════════════════════════════════════════════════════════════ */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md border border-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Submit Laporan Kerja Harian</h3>
                <p className="text-xs text-slate-400 font-medium">Tanggal: {selectedDate}</p>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">
                Ringkasan / Kendala / Catatan Hasil Kerja (Opsional):
              </label>
              <textarea
                value={dailySummary}
                onChange={(e) => setDailySummary(e.target.value)}
                placeholder="Tuliskan capaian utama hari ini atau kendala yang dihadapi..."
                rows={4}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
              <p className="text-[11px] text-slate-400">
                Tingkat ketercapaian saat ini: <b>{completionRate}%</b> ({completedTasks} dari {totalTasks} selesai).
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                disabled={submittingReport}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-red-600/20 cursor-pointer disabled:opacity-50"
              >
                {submittingReport ? 'Mengirim...' : 'Kirim Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Preview */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm cursor-pointer"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl">
            <img src={lightboxImage} alt="Bukti Pekerjaan" className="w-full h-full max-h-[85vh] object-contain" />
            <button
              onClick={() => setLightboxImage(null)}
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
