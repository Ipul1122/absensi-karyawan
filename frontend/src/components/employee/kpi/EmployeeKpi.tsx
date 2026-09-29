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
  FileSpreadsheet,
  ShieldCheck,
  ChevronDown,
  ChevronUp
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
  priority?: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'revision' | 'completed' | 'cancelled'
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
  user?: {
    id?: number
    name?: string
    email?: string
    role?: string
    photo?: string | null
  }
}

export default function EmployeeKpi({ token, user }: EmployeeKpiProps) {
  const isAdmin = user?.role === 'admin'
  const getTodayJakarta = () => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
  }

  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today')
  const [selectedDate, setSelectedDate] = useState<string>(getTodayJakarta())
  const [hasAttendance, setHasAttendance] = useState<boolean>(false)
  const [attendanceInfo, setAttendanceInfo] = useState<any>(null)
  const [myResponsibilities, setMyResponsibilities] = useState<Responsibility[]>([])
  const [showResponsibilities, setShowResponsibilities] = useState(false)
  const [report, setReport] = useState<DailyReport | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // Single Quick Add
  const [quickTitle, setQuickTitle] = useState('')
  const [quickStatus, setQuickStatus] = useState<'in_progress' | 'revision' | 'completed'>('in_progress')
  const [quickResponsibilityId, setQuickResponsibilityId] = useState<number | ''>('')
  const [submittingQuick, setSubmittingQuick] = useState(false)

  // Bulk Add Modal
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkRows, setBulkRows] = useState<Array<{
    title: string
    status: 'in_progress' | 'revision' | 'completed'
    responsibility_id: number | ''
    imageFile: File | null
    imagePreview: string | null
  }>>([
    { title: '', status: 'in_progress', responsibility_id: '', imageFile: null, imagePreview: null },
    { title: '', status: 'in_progress', responsibility_id: '', imageFile: null, imagePreview: null },
    { title: '', status: 'in_progress', responsibility_id: '', imageFile: null, imagePreview: null },
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

    if (!hasAttendance && !isAdmin) {
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
        status: quickStatus
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
    setBulkRows([
      ...bulkRows,
      { title: '', status: 'in_progress', responsibility_id: '', imageFile: null, imagePreview: null }
    ])
  }

  const handleRemoveBulkRow = (index: number) => {
    if (bulkRows.length <= 1) return
    if (bulkRows[index].imagePreview) {
      URL.revokeObjectURL(bulkRows[index].imagePreview!)
    }
    setBulkRows(bulkRows.filter((_, i) => i !== index))
  }

  const handleBulkImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validasi maksimal 2MB (2 * 1024 * 1024 = 2097152 bytes)
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'Ukuran Terlalu Besar',
        text: `Ukuran file foto "${file.name}" adalah ${(file.size / (1024 * 1024)).toFixed(2)} MB. Batas maksimal yang diperbolehkan adalah 2MB.`,
        confirmButtonColor: '#dc2626'
      })
      e.target.value = ''
      return
    }

    const updated = [...bulkRows]
    if (updated[index].imagePreview) {
      URL.revokeObjectURL(updated[index].imagePreview!)
    }
    updated[index].imageFile = file
    updated[index].imagePreview = URL.createObjectURL(file)
    setBulkRows(updated)
    e.target.value = ''
  }

  const handleRemoveBulkImage = (index: number) => {
    const updated = [...bulkRows]
    if (updated[index].imagePreview) {
      URL.revokeObjectURL(updated[index].imagePreview!)
    }
    updated[index].imageFile = null
    updated[index].imagePreview = null
    setBulkRows(updated)
  }

  const handleBulkSubmit = async () => {
    const validRows = bulkRows.filter(r => r.title.trim() !== '')

    if (validRows.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Form Kosong',
        text: 'Minimal isi satu judul tugas.',
        confirmButtonColor: '#dc2626'
      })
      return
    }

    // Validasi ganda 2MB sebelum kirim
    for (const r of validRows) {
      if (r.imageFile && r.imageFile.size > 2 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'Ukuran Foto Melebihi 2MB',
          text: `Foto pada tugas "${r.title}" melebihi batas 2MB. Harap ganti foto terlebih dahulu.`,
          confirmButtonColor: '#dc2626'
        })
        return
      }
    }

    setSubmittingBulk(true)
    try {
      const formData = new FormData()
      formData.append('date', selectedDate)

      validRows.forEach((r, idx) => {
        formData.append(`tasks[${idx}][title]`, r.title.trim())
        formData.append(`tasks[${idx}][status]`, r.status)
        if (r.responsibility_id !== '') {
          formData.append(`tasks[${idx}][responsibility_id]`, String(r.responsibility_id))
        }
        if (r.imageFile) {
          formData.append(`tasks[${idx}][image]`, r.imageFile)
        }
      })

      const res = await axios.post(`${API_BASE_URL}/api/kpi/tasks/bulk`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
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
          { title: '', status: 'in_progress', responsibility_id: '', imageFile: null, imagePreview: null },
          { title: '', status: 'in_progress', responsibility_id: '', imageFile: null, imagePreview: null },
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

  const handleUpdateStatus = async (task: Task, newStatus: 'in_progress' | 'revision' | 'completed') => {
    try {
      const res = await axios.patch(`${API_BASE_URL}/api/kpi/tasks/${task.id}/status`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.data.status === 'success') {
        if (report) {
          const updatedTasks = report.tasks.map(t => t.id === task.id ? {
            ...t,
            status: newStatus as any,
            completed_at: newStatus === 'completed' ? new Date().toISOString() : null
          } : t)
          setReport({
            ...report,
            tasks: updatedTasks,
            completion_rate: res.data.completion_rate
          })
        }
      }
    } catch (err: any) {
      console.error('Gagal update status:', err)
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengubah Status',
        text: err.response?.data?.message || 'Terjadi kesalahan sistem.',
        confirmButtonColor: '#dc2626'
      })
    }
  }

  const handleToggleStatus = (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'in_progress' : 'completed'
    handleUpdateStatus(task, nextStatus)
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
    if (!hasAttendance && !isAdmin) {
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
          text: isAdmin
            ? 'Laporan kerja harian Admin HR berhasil disimpan dan langsung dikirimkan ke meja Direktur Utama.'
            : 'Laporan kerja harian Anda telah tersimpan dan siap ditinjau oleh Admin & Direktur.',
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
        <td style="text-align: center;">${t.status === 'completed' ? '🟢 Selesai' : t.status === 'revision' ? '🟡 Revisi' : '🔴 Proses'}</td>
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
  const revisionTasks = tasks.filter(t => t.status === 'revision').length
  const processTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'revision').length
  const completionRate = report?.completion_rate ?? 0

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 font-sans">
      
      {/* ══════════════════════════════════════════════════════════════════
          TOP NAVIGATION TABS
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white border border-slate-200/90 rounded-2xl p-2 sm:p-2.5 shadow-xs">
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-3 sm:px-4 py-2 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-center whitespace-nowrap ${
              activeTab === 'today'
                ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            📋 To-Do List Harian
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 sm:px-4 py-2 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-center whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            🗓️ Riwayat KPI
          </button>
        </div>

        {activeTab === 'today' && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 w-full sm:w-auto justify-between sm:justify-end pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 px-1 sm:px-0">
            <span className="text-[11px] sm:text-xs">Tanggal:</span>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 sm:px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer"
              />
              {selectedDate !== getTodayJakarta() && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(getTodayJakarta())}
                  className="px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-black rounded-xl border border-red-200 transition-colors"
                >
                  Hari Ini
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {activeTab === 'today' ? (
        <>
          {/* ══════════════════════════════════════════════════════════════════
              BAGIAN 1: TANGGUNG JAWAB & TARGET KPI SAYA (Collapsible)
          ══════════════════════════════════════════════════════════════════ */}
          <div className="bg-gradient-to-br from-red-50/60 via-slate-50/50 to-white border border-red-200/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs transition-all">
            <div 
              onClick={() => setShowResponsibilities(!showResponsibilities)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm shadow-red-600/20 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <h3 className="text-xs sm:text-sm md:text-base font-extrabold text-slate-900 tracking-tight">
                      Tanggung Jawab & Target KPI Saya
                    </h3>
                    <span className="text-[10px] font-black px-2 py-0.5 bg-red-100/80 text-red-800 rounded-full border border-red-200">
                      {myResponsibilities.length}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                    {showResponsibilities ? 'Pedoman utama pekerjaan Anda' : 'Ketuk untuk melihat rincian target KPI'}
                  </p>
                </div>
              </div>
              <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                {showResponsibilities ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            {showResponsibilities && (
              <div className="mt-3.5 pt-3 border-t border-red-100">
                {myResponsibilities.length === 0 ? (
                  <div className="bg-white border border-slate-200/80 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-500 font-medium">
                      Belum ada tanggung jawab spesifik yang ditetapkan Admin untuk akun Anda. Anda tetap dapat membuat to-do list harian mandiri.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    {myResponsibilities.map((resp, idx) => (
                      <div key={resp.id} className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-4 shadow-xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
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
                          <div className="mt-2 pt-2 border-t border-slate-100 pl-7 flex items-center gap-1.5">
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
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              BAGIAN 2: STATUS PRESENSI HARI/TANGGAL INI (GATE TO-DO LIST)
          ══════════════════════════════════════════════════════════════════ */}
          {isAdmin ? (
            <div className="bg-gradient-to-r from-red-500/10 via-orange-500/10 to-amber-500/10 border border-red-200/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-500/20 mt-0.5 sm:mt-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                      Mode To-Do List Admin HR
                    </h4>
                    <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 bg-red-100 text-red-800 rounded border border-red-200 uppercase">
                      Laporan Direktur
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">
                    To-do list Anda <strong>langsung diteruskan ke Direktur Utama</strong> untuk evaluasi & rating kinerja.
                    {attendanceInfo?.clock_in && (
                      <span className="ml-1 text-emerald-700 font-bold">
                        (Presensi: {attendanceInfo.clock_in.substring(0, 5)} WIB)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Kirim ke Direktur Aktif
                </span>
              </div>
            </div>
          ) : !hasAttendance && !loading ? (
            <div className="bg-red-50/70 border border-red-200 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-start gap-3 w-full">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-red-600/20">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-red-950">
                    Presensi Masuk Belum Tercatat ({selectedDate})
                  </h4>
                  <p className="text-[11px] sm:text-xs text-red-800/90 mt-0.5 leading-relaxed">
                    Sistem mengunci pengisian to-do list sampai Anda melakukan <b>Absen Masuk (Clock-In)</b> pada tanggal ini.
                  </p>
                </div>
              </div>
              {selectedDate === getTodayJakarta() && (
                <a
                  href="/employee/absen"
                  className="w-full sm:w-auto text-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-red-600/20 transition-all shrink-0 active:scale-95 cursor-pointer"
                >
                  Absen Sekarang →
                </a>
              )}
            </div>
          ) : null}

          {hasAttendance && attendanceInfo && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] sm:text-xs">
                  Presensi Masuk Terverifikasi: <span className="font-extrabold text-red-600">{attendanceInfo.clock_in?.substring(0, 5)} WIB</span> ({attendanceInfo.attendance_type || 'Kantor'})
                </span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 w-fit">
                Sesi Terbuka
              </span>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              BAGIAN 3: PROGRESS & RINGKASAN CAPAIAN HARI INI
          ══════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Progress Card */}
            <div className="md:col-span-2 bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <h3 className="text-xs sm:text-base font-extrabold text-slate-800">
                      Ketercapaian To-Do List Hari Ini
                    </h3>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        🟢 {completedTasks} Selesai
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        🟡 {revisionTasks} Revisi
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        🔴 {processTasks} Proses
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xl sm:text-2xl font-black ${
                      completionRate >= 80 ? 'text-emerald-600' :
                      completionRate >= 50 ? 'text-amber-500' : 'text-red-600'
                    }`}>
                      {completionRate}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 sm:h-3 overflow-hidden border border-slate-200/60 p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      completionRate >= 80 ? 'bg-emerald-500' :
                      completionRate >= 50 ? 'bg-amber-500' :
                      'bg-red-600'
                    }`}
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons Row (Responsive for Mobile) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3.5 pt-3 border-t border-slate-100">
                <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setShowBulkModal(true)}
                    disabled={!hasAttendance && !isAdmin}
                    className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Bulk</span>
                  </button>
                  <button
                    onClick={handleCarryOver}
                    disabled={!hasAttendance && !isAdmin}
                    className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    title="Tarik tugas kemarin yang belum selesai"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Kemarin</span>
                  </button>
                  <button
                    onClick={handleExportSingleDateExcel}
                    disabled={totalTasks === 0}
                    className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Export data tanggal ini ke Excel"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Excel</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowSubmitModal(true)}
                  disabled={(!hasAttendance && !isAdmin) || totalTasks === 0}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 sm:py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-sm shadow-red-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {report?.status === 'submitted' 
                      ? (isAdmin ? 'Perbarui ke Direktur' : 'Perbarui Laporan') 
                      : (isAdmin ? 'Kirim ke Direktur' : 'Kirim Laporan')}
                  </span>
                </button>
              </div>
            </div>

            {/* Review Status Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
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
                     report?.status === 'submitted' ? (isAdmin ? '⏳ Menunggu Direktur' : '⏳ Menunggu Review') : '📝 Draft'}
                  </span>
                </div>

                {(report?.admin_rating || report?.director_rating) && (
                  <div className="mt-2.5 bg-red-50/50 border border-red-200 rounded-xl p-2.5">
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

              <div className="text-[10px] sm:text-[11px] text-slate-400 mt-2 font-medium">
                Pembaruan: {report?.updated_at ? new Date(report.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              BAGIAN 4: QUICK ADD FORM (Mobile-First 2-Column Selects)
          ══════════════════════════════════════════════════════════════════ */}
          <form onSubmit={handleQuickAdd} className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
            <div className="flex-1 w-full">
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="+ Tambah tugas apa yang Anda kerjakan lalu tekan Enter..."
                disabled={!hasAttendance && !isAdmin}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 disabled:opacity-50"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                {myResponsibilities.length > 0 && (
                  <select
                    value={quickResponsibilityId}
                    onChange={(e) => setQuickResponsibilityId(e.target.value ? Number(e.target.value) : '')}
                    disabled={!hasAttendance && !isAdmin}
                    className="w-full sm:w-auto px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer disabled:opacity-50 truncate"
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
                  value={quickStatus}
                  onChange={(e) => setQuickStatus(e.target.value as any)}
                  disabled={!hasAttendance && !isAdmin}
                  className={`w-full sm:w-auto px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 cursor-pointer disabled:opacity-50 ${myResponsibilities.length === 0 ? 'col-span-2' : ''}`}
                  title="Pilih status tugas (🔴 Proses / 🟡 Revisi / 🟢 Selesai)"
                >
                  <option value="in_progress">🔴 Proses</option>
                  <option value="revision">🟡 Revisi</option>
                  <option value="completed">🟢 Selesai</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={(!hasAttendance && !isAdmin) || !quickTitle.trim() || submittingQuick}
                className="w-full sm:w-auto px-5 py-2.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-red-600/20 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{submittingQuick ? 'Menyimpan...' : 'Tambah Tugas'}</span>
              </button>
            </div>
          </form>

          {/* ══════════════════════════════════════════════════════════════════
              BAGIAN 5: DAFTAR TO-DO LIST & FOTO (< 2MB)
          ══════════════════════════════════════════════════════════════════ */}
          <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 mb-3 sm:mb-4 flex items-center justify-between">
              <span>Daftar Pekerjaan ({tasks.length})</span>
              <span className="text-[10px] sm:text-[11px] font-normal text-slate-400">
                Centang lingkaran saat selesai
              </span>
            </h3>

            {tasks.length === 0 ? (
              <div className="py-10 sm:py-12 text-center">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-2.5">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-700">Belum Ada Tugas Ditambahkan</h4>
                <p className="text-[11px] sm:text-xs text-slate-400 max-w-sm mx-auto mt-1 px-4">
                  Ketik tugas pada form di atas atau gunakan tombol <b>+ Bulk</b> untuk memasukkan beberapa pekerjaan sekaligus.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 sm:space-y-3">
                {tasks.map((task) => {
                  const isDone = task.status === 'completed'
                  const isRevision = task.status === 'revision'

                  return (
                    <div
                      key={task.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isDone
                          ? 'bg-emerald-50/40 border-emerald-200/90'
                          : isRevision
                            ? 'bg-amber-50/40 border-amber-200/90'
                            : 'bg-white border-slate-200/70 hover:border-red-200 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(task)}
                          className="mt-0.5 -ml-0.5 p-1 transition-colors cursor-pointer shrink-0"
                          title={isDone ? 'Tandai sedang proses' : 'Tandai telah selesai'}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                          ) : isRevision ? (
                            <div className="w-5 h-5 rounded-full border-2 border-amber-500 bg-amber-100/70 flex items-center justify-center text-[10px] font-black text-amber-700">
                              !
                            </div>
                          ) : (
                            <Circle className="w-5 h-5 text-red-300 hover:text-emerald-500" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p className={`text-xs sm:text-sm font-bold tracking-tight leading-snug ${
                            isDone ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}>
                            {task.title}
                          </p>

                          {task.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                            {/* Pilihan Status Interaktif: 🟢 Selesai, 🟡 Revisi, 🔴 Proses */}
                            <select
                              value={isDone ? 'completed' : isRevision ? 'revision' : 'in_progress'}
                              onChange={(e) => handleUpdateStatus(task, e.target.value as any)}
                              className={`text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-lg border cursor-pointer focus:outline-none transition-all ${
                                isDone 
                                  ? 'bg-emerald-100/90 text-emerald-800 border-emerald-300 hover:bg-emerald-200' :
                                isRevision
                                  ? 'bg-amber-100/90 text-amber-800 border-amber-300 hover:bg-amber-200' :
                                  'bg-red-100/80 text-red-700 border-red-200 hover:bg-red-200'
                              }`}
                              title="Klik untuk mengubah status: 🟢 Selesai / 🟡 Revisi / 🔴 Proses"
                            >
                              <option value="in_progress">🔴 Proses</option>
                              <option value="revision">🟡 Revisi</option>
                              <option value="completed">🟢 Selesai</option>
                            </select>

                            {task.responsibility && (
                              <span className="text-[9px] sm:text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 sm:px-2 py-0.5 rounded-md border border-slate-200 truncate max-w-[160px] sm:max-w-[200px]">
                                📌 {task.responsibility.title}
                              </span>
                            )}

                            {isDone && task.completed_at && (
                              <span className="text-[9px] sm:text-[10px] font-medium text-emerald-700 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(task.completed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Photo & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                        {task.image_path ? (
                          <div className="flex items-center gap-2">
                            <div className="relative group">
                              <img
                                src={getAssetUrl(task.image_path)}
                                alt="Bukti Kerja"
                                onClick={() => setLightboxImage(getAssetUrl(task.image_path))}
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-slate-200 shadow-2xs cursor-pointer hover:scale-105 transition-transform"
                              />
                              <button
                                type="button"
                                onClick={() => handleDeletePhoto(task.id)}
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-[10px] cursor-pointer shadow"
                                title="Hapus foto"
                              >
                                ×
                              </button>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Bukti Terunggah</span>
                          </div>
                        ) : (
                          <label className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer active:scale-95">
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
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors cursor-pointer active:scale-90"
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
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-800">Riwayat Laporan & Evaluasi Kinerja</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Lihat catatan evaluasi dan penilaian bintang dari atasan</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="month"
                value={historyMonth}
                onChange={(e) => setHistoryMonth(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              />
              <button
                onClick={handleExportHistoryExcel}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer whitespace-nowrap"
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
            <div className="space-y-2.5 sm:space-y-3">
              {historyList.map((item) => (
                <div key={item.id} className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
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

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-[11px] text-slate-500">
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

                  <div className="flex items-center gap-1 self-start md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto justify-between md:justify-end">
                    <span className="text-[10px] text-slate-400 font-bold md:hidden">Rating Atasan:</span>
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 1: BULK ADD TASKS (With optional Image Proof max 2MB)
      ══════════════════════════════════════════════════════════════════ */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-2xl border border-slate-100 shadow-2xl space-y-3.5 sm:space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-800">Bulk Add Tasks</h3>
                <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                  Tambah beberapa to-do list sekaligus, bisa melampirkan foto bukti (Maks. 2MB per gambar)
                </p>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {bulkRows.map((row, idx) => (
                <div key={idx} className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 sm:p-3.5 space-y-2.5 transition-all hover:border-slate-300">
                  {/* Baris 1: Nomor, Judul Tugas, Tombol Hapus */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-400 w-5 text-center shrink-0">
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
                      placeholder={`Nama tugas #${idx + 1}...`}
                      className="flex-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveBulkRow(idx)}
                      disabled={bulkRows.length <= 1}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 disabled:opacity-30 cursor-pointer shrink-0 transition-colors"
                      title="Hapus baris"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Baris 2: Tanggung Jawab, Prioritas, & Lampiran Foto (Maks 2MB) */}
                  <div className="flex flex-wrap items-center gap-2 pl-7">
                    {myResponsibilities.length > 0 && (
                      <select
                        value={row.responsibility_id}
                        onChange={(e) => {
                          const updated = [...bulkRows]
                          updated[idx].responsibility_id = e.target.value ? Number(e.target.value) : ''
                          setBulkRows(updated)
                        }}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none truncate max-w-[150px]"
                      >
                        <option value="">(Tugas Umum)</option>
                        {myResponsibilities.map(r => (
                          <option key={r.id} value={r.id}>{r.title}</option>
                        ))}
                      </select>
                    )}

                    <select
                      value={row.status}
                      onChange={(e) => {
                        const updated = [...bulkRows]
                        updated[idx].status = e.target.value as any
                        setBulkRows(updated)
                      }}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                      title="Status tugas: 🔴 Proses / 🟡 Revisi / 🟢 Selesai"
                    >
                      <option value="in_progress">🔴 Proses</option>
                      <option value="revision">🟡 Revisi</option>
                      <option value="completed">🟢 Selesai</option>
                    </select>

                    {/* Lampiran Foto (Maksimal 2MB) */}
                    {row.imagePreview ? (
                      <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-xl border border-emerald-200 shadow-2xs">
                        <img
                          src={row.imagePreview}
                          alt="Lampiran"
                          onClick={() => setLightboxImage(row.imagePreview)}
                          className="w-7 h-7 rounded-lg object-cover border border-slate-200 cursor-pointer hover:scale-105 transition-transform shrink-0"
                          title="Klik untuk memperbesar"
                        />
                        <span className="text-[11px] font-bold text-emerald-700 truncate max-w-[100px] sm:max-w-[140px]">
                          {row.imageFile?.name || 'Foto terlampir'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                          ({row.imageFile ? (row.imageFile.size / (1024 * 1024)).toFixed(1) + 'MB' : ''})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBulkImage(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer transition-colors"
                          title="Hapus foto"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-600 cursor-pointer transition-all shrink-0">
                        <Camera className="w-3.5 h-3.5 text-slate-500" />
                        <span>+ Foto</span>
                        <span className="text-[10px] text-slate-400 font-medium">(Maks 2MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleBulkImageChange(idx, e)}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleAddBulkRow}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer w-full sm:w-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Baris
              </button>

              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleBulkSubmit}
                  disabled={submittingBulk}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-red-600/20 transition-all cursor-pointer disabled:opacity-50 text-center"
                >
                  {submittingBulk ? 'Menyimpan...' : 'Simpan Semua'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-md border border-slate-100 shadow-2xl space-y-3.5 sm:space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-800">
                  {isAdmin ? 'Kirim Laporan ke Direktur' : 'Submit Laporan Kerja Harian'}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Tanggal: {selectedDate}</p>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Ringkasan / Kendala / Catatan Hasil Kerja (Opsional):
              </label>
              <textarea
                value={dailySummary}
                onChange={(e) => setDailySummary(e.target.value)}
                placeholder="Tuliskan capaian utama hari ini atau kendala yang dihadapi..."
                rows={4}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
              <p className="text-[11px] text-slate-400">
                Tingkat ketercapaian saat ini: <b>{completionRate}%</b> ({completedTasks} dari {totalTasks} selesai).
              </p>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer text-center"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                disabled={submittingReport}
                className="px-5 py-2.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-red-600/20 cursor-pointer disabled:opacity-50 text-center"
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
