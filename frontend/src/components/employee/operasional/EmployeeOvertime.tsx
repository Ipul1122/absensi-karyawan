import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Plus, 
  CalendarDays,
  FileDown,
  Printer,
  X
} from 'lucide-react'

interface Overtime {
  id: number
  date: string
  start_time: string
  end_time: string
  duration: number
  reason: string
  status: 'pending' | 'pending_director' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
  updated_at: string
}

interface Summary {
  active_month: string
  total_approved_hours_this_month: number
  pending_count: number
  approved_count: number
  rejected_count: number
}

const hoursOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const minutesOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

interface EmployeeOvertimeProps {
  token: string
}

export default function EmployeeOvertime({ token }: EmployeeOvertimeProps) {
  const [overtimes, setOvertimes] = useState<Overtime[]>([])
  const [summary, setSummary] = useState<Summary>({
    active_month: new Date().toISOString().slice(0, 7),
    total_approved_hours_this_month: 0,
    pending_count: 0,
    approved_count: 0,
    rejected_count: 0
  })
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Helper to get Asia/Jakarta date (YYYY-MM-DD)
  const getJakartaDate = () => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
  }

  // Helper to get Asia/Jakarta time (HH:MM) in 24-hour format
  const getJakartaTime = (offsetHours = 0) => {
    const d = new Date(Date.now() + offsetHours * 60 * 60 * 1000)
    return new Intl.DateTimeFormat('en-GB', { 
      timeZone: 'Asia/Jakarta', 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    }).format(d)
  }

  // Form states
  const [date, setDate] = useState(getJakartaDate())
  const [startTime, setStartTime] = useState(getJakartaTime())
  const [endTime, setEndTime] = useState(getJakartaTime(2))
  const [reason, setReason] = useState('')

  // Filter & Pagination States
  const [statusFilter, setStatusFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7))
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    total: 0,
    per_page: 10,
    current_page: 1,
    last_page: 1
  })

  const fetchOvertimes = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:8000/api/overtimes', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status: statusFilter,
          month: monthFilter,
          page: currentPage,
          per_page: 10
        }
      })
      if (response.data.status === 'success') {
        setOvertimes(response.data.data)
        setPagination(response.data.pagination)
        setSummary(response.data.summary)
      }
    } catch (err: any) {
      console.error('Gagal mengambil data lembur:', err)
      Swal.fire({
        title: 'Error',
        text: 'Gagal memuat riwayat pengajuan lembur.',
        icon: 'error',
        background: '#fffdfb',
        color: '#3c1105'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOvertimes()
  }, [statusFilter, monthFilter, currentPage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!date || !startTime || !endTime || !reason) {
      Swal.fire({
        title: 'Form Belum Lengkap',
        text: 'Harap isi tanggal, jam mulai, jam selesai, dan rincian pekerjaan lembur.',
        icon: 'warning',
        background: '#fffdfb',
        color: '#3c1105'
      })
      return
    }

    setSubmitting(true)

    try {
      const response = await axios.post('http://localhost:8000/api/overtimes', {
        date,
        start_time: startTime,
        end_time: endTime,
        reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.status === 'success') {
        Swal.fire({
          title: 'Berhasil!',
          text: response.data.message || 'Pengajuan lembur berhasil dikirim.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          background: '#fffdfb',
          color: '#3c1105'
        })

        // Reset form
        setDate(getJakartaDate())
        setStartTime(getJakartaTime())
        setEndTime(getJakartaTime(2))
        setReason('')
        setShowForm(false)

        fetchOvertimes()
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal mengirimkan pengajuan lembur.'
      Swal.fire({
        title: 'Gagal',
        text: msg,
        icon: 'error',
        background: '#fffdfb',
        color: '#3c1105'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (id: number) => {
    Swal.fire({
      title: 'Batalkan Pengajuan?',
      text: 'Apakah Anda yakin ingin membatalkan pengajuan lembur ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ea580c',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Batalkan!',
      cancelButtonText: 'Kembali',
      background: '#fffdfb',
      color: '#3c1105'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(`http://localhost:8000/api/overtimes/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (response.data.status === 'success') {
            Swal.fire({
              title: 'Dibatalkan!',
              text: 'Pengajuan lembur berhasil dibatalkan.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
              background: '#fffdfb',
              color: '#3c1105'
            })
            fetchOvertimes()
          }
        } catch (err: any) {
          console.error(err)
          const msg = err.response?.data?.message || 'Gagal membatalkan pengajuan lembur.'
          Swal.fire({
            title: 'Gagal',
            text: msg,
            icon: 'error',
            background: '#fffdfb',
            color: '#3c1105'
          })
        }
      }
    })
  }

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-'
    const d = new Date(dateString)
    const dateFormatted = d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
    const timeFormatted = d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
    return `${dateFormatted}, ${timeFormatted} WIB`
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ''
    const cleanTime = timeString.substring(0, 5)
    return `${cleanTime} WIB`
  }

  const getStatusBadge = (status: 'pending' | 'pending_director' | 'approved' | 'rejected') => {
    const config = {
      pending: {
        text: 'Menunggu Persetujuan Admin',
        classes: 'bg-amber-50 text-amber-700 border-amber-250',
        icon: <Clock className="w-3.5 h-3.5" />
      },
      pending_director: {
        text: 'Menunggu Persetujuan Direktur',
        classes: 'bg-blue-50 text-blue-700 border-blue-250',
        icon: <Clock className="w-3.5 h-3.5" />
      },
      approved: {
        text: 'Disetujui',
        classes: 'bg-emerald-50 text-emerald-700 border-emerald-250',
        icon: <CheckCircle className="w-3.5 h-3.5" />
      },
      rejected: {
        text: 'Ditolak',
        classes: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: <XCircle className="w-3.5 h-3.5" />
      }
    }

    const active = config[status]

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${active.classes} font-quicksand`}>
        {active.icon}
        {active.text}
      </span>
    )
  }

  const formatMonthName = (monthString: string) => {
    if (!monthString) return ''
    const [year, month] = monthString.split('-')
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1)
    return dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  }

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const getStatusLabel = (status: string) => {
      if (status === 'approved') return 'Disetujui'
      if (status === 'rejected') return 'Ditolak'
      return 'Menunggu Persetujuan'
    }

    const htmlContent = `
      <html>
        <head>
          <title>Riwayat Lembur Karyawan</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #334155; padding: 25px; line-height: 1.5; }
            h1 { text-align: center; color: #1e293b; margin-bottom: 5px; font-size: 20px; font-weight: 800; }
            h3 { text-align: center; color: #64748b; font-weight: 600; font-size: 13px; margin-top: 0; margin-bottom: 25px; }
            table.data-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px; }
            table.data-table th, table.data-table td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
            table.data-table th { background-color: #f1f5f9; font-weight: 700; color: #334155; text-transform: uppercase; font-size: 8px; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 8px; font-weight: 700; }
            .badge-pending { background-color: #fffbeb; color: #b45309; }
            .badge-approved { background-color: #ecfdf5; color: #047857; }
            .badge-rejected { background-color: #fef2f2; color: #b91c1c; }
            @media print {
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <h1>Laporan Riwayat Pengajuan Lembur Karyawan</h1>
          <h3>Periode: ${formatMonthName(monthFilter)}</h3>
          
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">No</th>
                <th>Tanggal</th>
                <th>Jam Mulai</th>
                <th>Jam Selesai</th>
                <th>Durasi (Jam)</th>
                <th>Pekerjaan / Rincian</th>
                <th>Status</th>
                <th>Catatan Admin</th>
              </tr>
            </thead>
            <tbody>
              ${overtimes.length === 0 ? `
                <tr>
                  <td colSpan="8" style="text-align: center; padding: 20px; color: #64748b;">
                    Tidak ada data lembur yang sesuai filter.
                  </td>
                </tr>
              ` : overtimes.map((item, idx) => `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td>${formatDate(item.date)}</td>
                  <td>${formatTime(item.start_time)}</td>
                  <td>${formatTime(item.end_time)}</td>
                  <td><strong>${item.duration} jam</strong></td>
                  <td>${item.reason}</td>
                  <td><span class="badge badge-${item.status}">${getStatusLabel(item.status)}</span></td>
                  <td>${item.admin_notes || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  const handleExportExcel = () => {
    let excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
          th { background-color: #f1f5f9; font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>Riwayat Lembur Karyawan - Periode ${monthFilter}</h2>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Tanggal</th>
              <th>Jam Mulai</th>
              <th>Jam Selesai</th>
              <th>Durasi (Jam)</th>
              <th>Rincian Pekerjaan</th>
              <th>Status</th>
              <th>Catatan Admin</th>
            </tr>
          </thead>
          <tbody>
    `

    overtimes.forEach((item, idx) => {
      const statusText = item.status === 'approved' ? 'Disetujui' : item.status === 'rejected' ? 'Ditolak' : 'Menunggu Persetujuan'
      excelContent += `
        <tr>
          <td>${idx + 1}</td>
          <td>${item.date}</td>
          <td>${formatTime(item.start_time)}</td>
          <td>${formatTime(item.end_time)}</td>
          <td>${item.duration}</td>
          <td>${item.reason}</td>
          <td>${statusText}</td>
          <td>${item.admin_notes || '-'}</td>
        </tr>
      `
    })

    excelContent += `
          </tbody>
        </table>
      </body>
      </html>
    `

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Riwayat_Lembur_${monthFilter}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const [startHour, startMinute] = (startTime || '00:00').split(':')
  const [endHour, endMinute] = (endTime || '00:00').split(':')

  const isFilterModified = statusFilter !== 'all' || monthFilter !== new Date().toISOString().slice(0, 7)

  return (
    <div className="space-y-6">
      
      {/* Header card */}
      <div className="flex justify-between items-center bg-white p-6 border border-orange-100/80 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-quicksand">
            Pengajuan Lembur Karyawan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ajukan lembur kerja mandiri, cantumkan rincian tugas, dan pantau status persetujuan dari Admin.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer shadow-md ${
            showForm 
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200' 
              : 'bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white shadow-red-500/10'
          }`}
        >
          {showForm ? (
            'Tutup Formulir'
          ) : (
            <>
              <Plus className="w-4 h-4" /> Ajukan Lembur
            </>
          )}
        </button>
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        {/* Approved Hours This Month */}
        <div className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-quicksand">Lembur Disetujui ({formatMonthName(monthFilter)})</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block font-mono">{summary.total_approved_hours_this_month} jam</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Card */}
        <div className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-quicksand">Menunggu Persetujuan</span>
            <span className="text-3xl font-black text-slate-800 mt-1 block font-mono">{summary.pending_count}</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 border border-amber-100">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Approved Card */}
        <div className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-quicksand">Disetujui (Total)</span>
            <span className="text-3xl font-black text-slate-800 mt-1 block font-mono">{summary.approved_count}</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Rejected Card */}
        <div className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-quicksand">Ditolak (Total)</span>
            <span className="text-3xl font-black text-slate-800 mt-1 block font-mono">{summary.rejected_count}</span>
          </div>
          <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 border border-rose-100">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </section>

      {/* Form Submission */}
      {showForm && (
        <section className="bg-white border border-orange-100/80 rounded-3xl p-6 shadow-sm animate-fade-in">
          <div className="border-b border-orange-100 pb-3 mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 font-quicksand">
              <Clock className="w-5 h-5 text-red-500" /> Formulir Pengajuan Lembur Baru
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-quicksand">
                  1. Tanggal Lembur
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-semibold font-quicksand shadow-sm"
                  required
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-quicksand">
                  2. Jam Mulai (WIB)
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={startHour}
                    onChange={(e) => setStartTime(`${e.target.value}:${startMinute}`)}
                    className="flex-grow bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-3 outline-none transition-all text-xs font-semibold font-quicksand shadow-sm cursor-pointer"
                  >
                    {hoursOptions.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span className="text-slate-400 font-extrabold">:</span>
                  <select
                    value={startMinute}
                    onChange={(e) => setStartTime(`${startHour}:${e.target.value}`)}
                    className="flex-grow bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-3 outline-none transition-all text-xs font-semibold font-quicksand shadow-sm cursor-pointer"
                  >
                    {minutesOptions.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* End Time */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-quicksand">
                  3. Jam Selesai (WIB)
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={endHour}
                    onChange={(e) => setEndTime(`${e.target.value}:${endMinute}`)}
                    className="flex-grow bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-3 outline-none transition-all text-xs font-semibold font-quicksand shadow-sm cursor-pointer"
                  >
                    {hoursOptions.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span className="text-slate-400 font-extrabold">:</span>
                  <select
                    value={endMinute}
                    onChange={(e) => setEndTime(`${endHour}:${e.target.value}`)}
                    className="flex-grow bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-3 outline-none transition-all text-xs font-semibold font-quicksand shadow-sm cursor-pointer"
                  >
                    {minutesOptions.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-quicksand">
                4. Rincian Tugas / Pekerjaan yang Diselesaikan
              </label>
              <textarea
                placeholder="Jelaskan pekerjaan penting yang diselesaikan selama lembur..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-semibold font-quicksand shadow-sm resize-none"
                required
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-4 border-t border-orange-100">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-extrabold rounded-2xl transition-all shadow-md shadow-red-500/10 cursor-pointer text-xs flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed font-quicksand"
              >
                {submitting ? 'Mengirim...' : 'Kirim Pengajuan Lembur'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Filter and Search Panel */}
      <section className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm font-quicksand">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          
          {/* Month Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilih Bulan</label>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => {
                setMonthFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full bg-slate-50/50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none transition-all text-xs font-semibold shadow-sm h-[38px]"
            />
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Pengajuan</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full bg-slate-50/50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none transition-all text-xs font-semibold shadow-sm h-[38px]"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>

          {/* Export & Reset Panel */}
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              className="flex-grow inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-red-500 to-orange-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-red-500/10 cursor-pointer h-[38px]"
            >
              <Printer className="w-3.5 h-3.5" /> PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="flex-grow inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/10 cursor-pointer h-[38px]"
            >
              <FileDown className="w-3.5 h-3.5" /> Excel
            </button>
            {isFilterModified && (
              <button
                onClick={() => {
                  setStatusFilter('all')
                  setMonthFilter(new Date().toISOString().slice(0, 7))
                  setCurrentPage(1)
                }}
                className="inline-flex items-center justify-center p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all cursor-pointer h-[38px]"
                title="Reset Filter"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            )}
          </div>

        </div>
      </section>

      {/* History Log */}
      <section className="bg-white border border-orange-100/80 rounded-3xl p-6 shadow-sm">
        <div className="border-b border-orange-100 pb-3 mb-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 font-quicksand">
            <CalendarDays className="w-5 h-5 text-red-500" /> Riwayat Pengajuan Lembur
          </h3>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-600"></div>
          </div>
        ) : overtimes.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium font-quicksand">
            <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p>Tidak ditemukan riwayat pengajuan lembur yang sesuai filter.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-quicksand">
                <thead>
                  <tr className="border-b border-orange-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 px-3">Tanggal</th>
                    <th className="pb-3 px-3">Dibuat</th>
                    <th className="pb-3 px-3">Diterima</th>
                    <th className="pb-3 px-3">Waktu</th>
                    <th className="pb-3 px-3">Durasi</th>
                    <th className="pb-3 px-3">Rincian Pekerjaan</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3">Catatan Admin</th>
                    <th className="pb-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50 text-xs font-semibold text-slate-700">
                  {overtimes.map((item) => (
                    <tr key={item.id} className="hover:bg-orange-50/10 transition-colors">
                      {/* Date */}
                      <td className="py-4 px-3">
                        <span className="block text-slate-800 font-bold">{formatDate(item.date)}</span>
                      </td>

                      {/* Dibuat */}
                      <td className="py-4 px-3 text-slate-750">
                        {formatDateTime(item.created_at)}
                      </td>

                      {/* Diterima */}
                      <td className="py-4 px-3 text-slate-750">
                        {item.status === 'approved' || item.status === 'rejected'
                          ? formatDateTime(item.updated_at)
                          : '-'}
                      </td>

                      {/* Time */}
                      <td className="py-4 px-3 text-slate-600">
                        {formatTime(item.start_time)} - {formatTime(item.end_time)}
                      </td>

                      {/* Duration */}
                      <td className="py-4 px-3 font-bold text-slate-800 font-mono">
                        {item.duration} jam
                      </td>

                      {/* Reason */}
                      <td className="py-4 px-3 text-slate-600 max-w-[250px] truncate" title={item.reason}>
                        {item.reason}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-3">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Admin Notes */}
                      <td className="py-4 px-3 max-w-[150px] truncate" title={item.admin_notes || ''}>
                        {item.admin_notes ? (
                          <span className="text-slate-600 font-medium italic">"{item.admin_notes}"</span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic font-medium">-</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-3 text-right">
                        {item.status === 'pending' ? (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 hover:text-rose-700 rounded-lg transition-all cursor-pointer shadow-sm"
                            title="Batalkan Pengajuan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.last_page > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-orange-100 font-quicksand mt-4">
                <span className="text-xs text-slate-500 font-semibold">
                  Menampilkan Halaman <span className="font-bold text-slate-750">{pagination.current_page}</span> dari{' '}
                  <span className="font-bold text-slate-750">{pagination.last_page}</span> (Total <span className="font-bold text-slate-750">{pagination.total}</span> entri)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={pagination.current_page === 1}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:border-orange-500 hover:text-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer bg-white"
                  >
                    Sebelumnya
                  </button>
                  {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        pagination.current_page === page
                          ? 'bg-orange-500 border border-orange-500 text-white shadow-sm font-extrabold'
                          : 'border border-slate-200 text-slate-600 hover:border-orange-500 hover:text-orange-700 bg-white'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.last_page))}
                    disabled={pagination.current_page === pagination.last_page}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:border-orange-500 hover:text-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer bg-white"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
