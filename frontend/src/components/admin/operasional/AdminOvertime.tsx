import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { 
  Check, 
  X, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  // Filter,
  FileDown,
  Printer,
  CalendarDays,
  Users,
  Trash2
} from 'lucide-react'

interface UserDetails {
  id: number
  name: string
  email: string
  company?: string | null
}

interface Overtime {
  id: number
  user_id: number
  date: string
  start_time: string
  end_time: string
  duration: number
  reason: string
  status: 'pending' | 'pending_director' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
  updated_at: string
  user: UserDetails
}

interface EmployeeRecap {
  id: number
  name: string
  email: string
  approved_hours: number
  pending_hours: number
  request_count: number
}

interface AdminOvertimeProps {
  token: string
}

const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function AdminOvertime({ token }: AdminOvertimeProps) {
  const [activeTab, setActiveTab] = useState<'logs' | 'recap'>('logs')
  const [overtimes, setOvertimes] = useState<Overtime[]>([])
  const [recapData, setRecapData] = useState<EmployeeRecap[]>([])
  
  const [summary, setSummary] = useState({
    active_month: new Date().toISOString().slice(0, 7),
    total_approved_hours_this_month: 0,
    pending_count: 0,
    pending_director_count: 0,
    approved_count: 0,
    rejected_count: 0
  })

  const [loading, setLoading] = useState(true)
  const [recapLoading, setRecapLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'pending_director' | 'approved' | 'rejected'>('all')
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7))
  
  // Pagination States
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
      const response = await axios.get('http://localhost:8000/api/admin/overtimes', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search: searchQuery,
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
      console.error(err)
      Swal.fire({
        title: 'Error',
        text: 'Gagal memuat daftar pengajuan lembur.',
        icon: 'error',
        background: '#fffdfb',
        color: '#3c1105'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRecap = async () => {
    setRecapLoading(true)
    try {
      const response = await axios.get('http://localhost:8000/api/admin/overtimes/recap', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          month: monthFilter
        }
      })
      if (response.data.status === 'success') {
        setRecapData(response.data.data)
      }
    } catch (err: any) {
      console.error('Gagal mengambil data rekap lembur:', err)
    } finally {
      setRecapLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchOvertimes()
    } else {
      fetchRecap()
    }
  }, [activeTab, searchQuery, statusFilter, monthFilter, currentPage])

  const handleApprove = (id: number, employeeName: string, duration: number) => {
    Swal.fire({
      title: 'Setujui Pengajuan Lembur',
      text: `Apakah Anda yakin ingin menyetujui pengajuan lembur selama ${duration} jam dari ${employeeName}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Setujui!',
      cancelButtonText: 'Batal',
      background: '#fffdfb',
      color: '#3c1105'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.put(
            `http://localhost:8000/api/admin/overtimes/${id}/approve`,
            { admin_notes: 'Disetujui oleh Admin.' },
            { headers: { Authorization: `Bearer ${token}` } }
          )

          if (response.data.status === 'success') {
            Swal.fire({
              title: 'Disetujui!',
              text: 'Pengajuan lembur berhasil disetujui.',
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
          const msg = err.response?.data?.message || 'Gagal menyetujui pengajuan.'
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

  const handleReject = (id: number, employeeName: string) => {
    Swal.fire({
      title: 'Tolak Pengajuan Lembur',
      text: `Apakah Anda yakin ingin menolak pengajuan lembur dari ${employeeName}?`,
      input: 'textarea',
      inputPlaceholder: 'Tuliskan alasan penolakan di sini...',
      inputValidator: (value) => {
        if (!value) {
          return 'Alasan penolakan wajib diisi!'
        }
      },
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Tolak!',
      cancelButtonText: 'Batal',
      background: '#fffdfb',
      color: '#3c1105'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const adminNotes = result.value
        try {
          const response = await axios.put(
            `http://localhost:8000/api/admin/overtimes/${id}/reject`,
            { admin_notes: adminNotes },
            { headers: { Authorization: `Bearer ${token}` } }
          )

          if (response.data.status === 'success') {
            Swal.fire({
              title: 'Ditolak!',
              text: 'Pengajuan lembur berhasil ditolak.',
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
          const msg = err.response?.data?.message || 'Gagal memproses penolakan.'
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

  const handleDelete = async (id: number, name: string) => {
    const result = await Swal.fire({
      title: 'Hapus Pengajuan Lembur?',
      text: `Apakah Anda yakin ingin menghapus pengajuan lembur untuk ${name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      background: '#fffdfb',
      color: '#3c1105'
    })

    if (result.isConfirmed) {
      try {
        const response = await axios.delete(`http://localhost:8000/api/overtimes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (response.data.status === 'success') {
          Swal.fire({
            title: 'Terhapus!',
            text: response.data.message,
            icon: 'success',
            background: '#fffdfb',
            color: '#3c1105'
          })
          fetchOvertimes()
        }
      } catch (err: any) {
        Swal.fire('Gagal', err.response?.data?.message || 'Gagal menghapus pengajuan.', 'error')
      }
    }
  }

  const handleWhatsAppShare = (item: Overtime) => {
    const company = item.user.company;
    const isYpi = company === 'PT Yasodana Parvez Internasional';
    const directorName = isYpi ? 'Pak Andre' : 'Bu Dian';
    const phone = isYpi ? '6289656931184' : '628170038421';

    Swal.fire({
      title: 'Kirim WhatsApp ke Direktur',
      text: `Kirim rincian lembur untuk ${item.user.name} ke ${directorName}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Kirim!',
      cancelButtonText: 'Batal',
      background: '#fffdfb',
      color: '#3c1105'
    }).then((result) => {
      if (result.isConfirmed) {
        const statusText = item.status === 'approved' 
          ? 'Disetujui' 
          : item.status === 'rejected' 
            ? 'Ditolak' 
            : item.status === 'pending_director' 
              ? 'Menunggu Direktur' 
              : 'Menunggu Admin';

        const message = `Halo ${directorName}, mohon verifikasi pengajuan lembur berikut:

Nama: ${item.user.name}
Tanggal: ${formatDate(item.date)}
Waktu: ${formatTime(item.start_time)} - ${formatTime(item.end_time)}
Durasi: ${item.duration} jam
Tugas: ${item.reason}
Status: ${statusText}

Terima kasih.`;

        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      }
    });
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
    const [hourStr] = cleanTime.split(':')
    const hour = parseInt(hourStr, 10)
    
    let period = 'malam'
    if (hour >= 4 && hour < 11) {
      period = 'pagi'
    } else if (hour >= 11 && hour < 15) {
      period = 'siang'
    } else if (hour >= 15 && hour < 18) {
      period = 'sore'
    }
    
    return `${cleanTime} ${period}`
  }

  const getStatusBadge = (status: 'pending' | 'pending_director' | 'approved' | 'rejected') => {
    const badgeConfig = {
      pending: 'bg-amber-50 text-amber-700 border-amber-250',
      pending_director: 'bg-blue-50 text-blue-700 border-blue-200',
      approved: 'bg-emerald-50 text-emerald-700 border-emerald-250',
      rejected: 'bg-rose-50 text-rose-700 border-rose-250'
    }

    const textMap = {
      pending: 'Menunggu Admin',
      pending_director: 'Menunggu Direktur',
      approved: 'Disetujui',
      rejected: 'Ditolak'
    }

    return (
      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeConfig[status]} font-quicksand`}>
        {textMap[status]}
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

    let htmlContent = ''

    if (activeTab === 'logs') {
      const getStatusLabel = (status: string) => {
        if (status === 'approved') return 'Disetujui'
        if (status === 'rejected') return 'Ditolak'
        if (status === 'pending_director') return 'Menunggu Direktur'
        return 'Menunggu Admin'
      }

      htmlContent = `
        <html>
          <head>
            <title>Rekap Pengajuan Lembur Karyawan</title>
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
            </style>
          </head>
          <body>
            <h1>Daftar Pengajuan Lembur Karyawan</h1>
            <h3>Periode: ${formatMonthName(monthFilter)}</h3>
            
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 5%; text-align: center;">No</th>
                  <th>Karyawan</th>
                  <th>Tanggal</th>
                  <th>Jam Lembur</th>
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
                      Tidak ada data pengajuan lembur.
                    </td>
                  </tr>
                ` : overtimes.map((item, idx) => `
                  <tr>
                    <td style="text-align: center;">${idx + 1}</td>
                    <td><strong>${item.user.name}</strong><br/><span style="color: #64748b; font-size: 8.5px;">${item.user.email}</span></td>
                    <td>${formatDate(item.date)}</td>
                    <td>${formatTime(item.start_time)} - ${formatTime(item.end_time)}</td>
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
    } else {
      htmlContent = `
        <html>
          <head>
            <title>Rekapitulasi Total Jam Lembur Karyawan</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #334155; padding: 25px; line-height: 1.5; }
              h1 { text-align: center; color: #1e293b; margin-bottom: 5px; font-size: 20px; font-weight: 800; }
              h3 { text-align: center; color: #64748b; font-weight: 600; font-size: 13px; margin-top: 0; margin-bottom: 25px; }
              table.data-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px; }
              table.data-table th, table.data-table td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
              table.data-table th { background-color: #f1f5f9; font-weight: 700; color: #334155; text-transform: uppercase; font-size: 8px; }
            </style>
          </head>
          <body>
            <h1>Rekapitulasi Total Lembur Karyawan</h1>
            <h3>Periode: ${formatMonthName(monthFilter)}</h3>
            
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 5%; text-align: center;">No</th>
                  <th>Karyawan</th>
                  <th>Email</th>
                  <th>Total Lembur Disetujui</th>
                  <th>Total Lembur Pending</th>
                  <th>Total Pengajuan</th>
                </tr>
              </thead>
              <tbody>
                ${recapData.length === 0 ? `
                  <tr>
                    <td colSpan="6" style="text-align: center; padding: 20px; color: #64748b;">
                      Tidak ada data rekap lembur.
                    </td>
                  </tr>
                ` : recapData.map((item, idx) => `
                  <tr>
                    <td style="text-align: center;">${idx + 1}</td>
                    <td><strong>${item.name}</strong></td>
                    <td>${item.email}</td>
                    <td><strong>${item.approved_hours} jam</strong></td>
                    <td>${item.pending_hours} jam</td>
                    <td>${item.request_count} kali</td>
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
    }

    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  const handleExportExcel = () => {
    let excelContent = ''
    let filename = ''

    if (activeTab === 'logs') {
      filename = `Daftar_Pengajuan_Lembur_${monthFilter}.xls`
      excelContent = `
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
          <h2>Laporan Pengajuan Lembur Karyawan - Periode ${monthFilter}</h2>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Karyawan</th>
                <th>Email</th>
                <th>Tanggal</th>
                <th>Jam Mulai</th>
                <th>Jam Selesai</th>
                <th>Durasi (Jam)</th>
                <th>Rincian Tugas</th>
                <th>Status</th>
                <th>Catatan Admin</th>
              </tr>
            </thead>
            <tbody>
      `

      overtimes.forEach((item, idx) => {
        const statusText = item.status === 'approved' 
          ? 'Disetujui' 
          : item.status === 'rejected' 
            ? 'Ditolak' 
            : item.status === 'pending_director' 
              ? 'Menunggu Direktur' 
              : 'Menunggu Admin'
        excelContent += `
          <tr>
            <td>${idx + 1}</td>
            <td><b>${item.user.name}</b></td>
            <td>${item.user.email}</td>
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
    } else {
      filename = `Rekap_Lembur_Bulanan_${monthFilter}.xls`
      excelContent = `
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
          <h2>Rekapitulasi Total Lembur Karyawan - Periode ${monthFilter}</h2>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Karyawan</th>
                <th>Email</th>
                <th>Jam Disetujui (Jam)</th>
                <th>Jam Pending (Jam)</th>
                <th>Frekuensi Pengajuan</th>
              </tr>
            </thead>
            <tbody>
      `

      recapData.forEach((item, idx) => {
        excelContent += `
          <tr>
            <td>${idx + 1}</td>
            <td><b>${item.name}</b></td>
            <td>${item.email}</td>
            <td>${item.approved_hours}</td>
            <td>${item.pending_hours}</td>
            <td>${item.request_count}</td>
          </tr>
        `
      })
    }

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
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const isFilterModified = searchQuery !== '' || statusFilter !== 'all' || monthFilter !== new Date().toISOString().slice(0, 7)

  return (
    <div className="space-y-6 font-quicksand">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Manajemen Lembur Karyawan</h3>
          <p className="text-xs text-slate-500 font-medium">Review, verifikasi pengajuan, dan rekapitulasi data lembur bulanan karyawan.</p>
        </div>
        
        <div className="flex items-center gap-2.5">
          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-red-500/10 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan
          </button>

          {/* Export Excel Button */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            Ekspor Excel
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-5 gap-6">
        {/* Approved total monthly */}
        <div className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-quicksand">Lembur Disetujui ({formatMonthName(monthFilter)})</span>
            <span className="text-xl font-black text-emerald-600 mt-1 block font-mono">{summary.total_approved_hours_this_month} jam</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Card */}
        <div className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-quicksand">Menunggu Admin</span>
            <span className="text-3xl font-black text-slate-800 mt-1 block font-mono">{summary.pending_count}</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 border border-amber-100">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Director Card */}
        <div className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-quicksand">Menunggu Direktur</span>
            <span className="text-3xl font-black text-slate-800 mt-1 block font-mono">{summary.pending_director_count}</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 border border-blue-100">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Approved Card */}
        <div className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-quicksand">Disetujui (Total)</span>
            <span className="text-3xl font-black text-slate-800 mt-1 block font-mono">{summary.approved_count}</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
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

      {/* Tab Switcher */}
      <div className="flex border-b border-orange-100/60 pb-px">
        <button
          onClick={() => {
            setActiveTab('logs')
            setCurrentPage(1)
          }}
          className={`pb-3 text-xs font-bold transition-all px-4 cursor-pointer relative ${
            activeTab === 'logs' 
              ? 'text-red-500 border-b-2 border-red-500 font-extrabold' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4" /> Daftar Pengajuan
          </span>
        </button>
        <button
          onClick={() => setActiveTab('recap')}
          className={`pb-3 text-xs font-bold transition-all px-4 cursor-pointer relative ${
            activeTab === 'recap' 
              ? 'text-red-500 border-b-2 border-red-500 font-extrabold' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Rekap Bulanan Karyawan
          </span>
        </button>
      </div>

      {/* Filter and Search Panel */}
      <section className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm font-quicksand">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          
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

          {/* Search Input (only relevant for Detailed Logs) */}
          <div className={`space-y-1 ${activeTab === 'recap' ? 'opacity-40 pointer-events-none' : ''}`}>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cari Karyawan</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                disabled={activeTab === 'recap'}
                className="w-full bg-slate-50/50 border border-slate-200 focus:border-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2 pl-9 pr-3 outline-none transition-all text-xs font-semibold shadow-sm h-[38px]"
              />
            </div>
          </div>

          {/* Status Filter (only relevant for Detailed Logs) */}
          <div className={`space-y-1 ${activeTab === 'recap' ? 'opacity-40 pointer-events-none' : ''}`}>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Lembur</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any)
                setCurrentPage(1)
              }}
              disabled={activeTab === 'recap'}
              className="w-full bg-slate-50/50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none transition-all text-xs font-semibold shadow-sm h-[38px]"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu Admin</option>
              <option value="pending_director">Menunggu Direktur</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>

          {/* Reset Filter Button */}
          <div>
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
                setMonthFilter(new Date().toISOString().slice(0, 7))
                setCurrentPage(1)
              }}
              disabled={!isFilterModified}
              className="w-full py-2 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 font-bold rounded-xl text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow h-[38px] flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              Bersihkan Filter
            </button>
          </div>

        </div>
      </section>

      {/* Main Table Content */}
      <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm">
        {activeTab === 'logs' ? (
          /* Logs Tab */
          loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-600"></div>
            </div>
          ) : overtimes.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium font-quicksand">
              <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p>Tidak ditemukan pengajuan lembur yang sesuai filter.</p>
            </div>
          ) : (
            <div className="border border-orange-100 rounded-2xl overflow-hidden bg-orange-50/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-quicksand">
                  <thead>
                    <tr className="bg-orange-50/30 text-slate-600 text-[10px] font-extrabold uppercase tracking-wider border-b border-orange-100">
                      <th className="py-4 px-5">Karyawan</th>
                      <th className="py-4 px-5">Tanggal</th>
                      <th className="py-4 px-5">Dibuat</th>
                      <th className="py-4 px-5">Diterima</th>
                      <th className="py-4 px-5">Jam Lembur</th>
                      <th className="py-4 px-5">Durasi</th>
                      <th className="py-4 px-5">Rincian Tugas / Pekerjaan</th>
                      <th className="py-4 px-5">Status</th>
                      <th className="py-4 px-5">Catatan Admin</th>
                      <th className="py-4 px-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-100 text-xs font-semibold text-slate-700">
                    {overtimes.map((item) => (
                      <tr key={item.id} className="hover:bg-orange-50/10 transition-colors">
                        {/* Employee profile */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-50 to-orange-100/60 border border-orange-200/50 flex items-center justify-center text-red-500 font-extrabold text-xs">
                              {item.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="block font-bold text-slate-800">{item.user.name}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{item.user.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-4 px-5">
                          <span className="block text-slate-800 font-bold">{formatDate(item.date)}</span>
                        </td>

                        {/* Dibuat */}
                        <td className="py-4 px-5 text-slate-700">
                          {formatDateTime(item.created_at)}
                        </td>

                        {/* Diterima */}
                        <td className="py-4 px-5 text-slate-700">
                          {item.status === 'approved' || item.status === 'rejected'
                            ? formatDateTime(item.updated_at)
                            : '-'}
                        </td>

                        {/* Time */}
                        <td className="py-4 px-5 text-slate-500">
                          {formatTime(item.start_time)} - {formatTime(item.end_time)}
                        </td>

                        {/* Duration */}
                        <td className="py-4 px-5 font-bold text-slate-800 font-mono">
                          {item.duration} jam
                        </td>

                        {/* Reason */}
                        <td className="py-4 px-5 text-slate-600 max-w-[200px] truncate" title={item.reason}>
                          {item.reason}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-5">
                          {getStatusBadge(item.status)}
                        </td>

                        {/* Admin Notes */}
                        <td className="py-4 px-5 max-w-[150px] truncate" title={item.admin_notes || ''}>
                          {item.admin_notes ? (
                            <span className="text-slate-600 font-medium italic">"{item.admin_notes}"</span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic font-medium">-</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex justify-end gap-1.5 items-center">
                            {(item.status === 'pending' || item.status === 'rejected') && (
                              <button
                                onClick={() => handleApprove(item.id, item.user.name, item.duration)}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 hover:text-emerald-700 rounded-lg transition-all cursor-pointer shadow-sm"
                                title="Setujui"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            {(item.status === 'pending' || item.status === 'approved' || item.status === 'pending_director') && (
                              <button
                                onClick={() => handleReject(item.id, item.user.name)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 hover:text-rose-700 rounded-lg transition-all cursor-pointer shadow-sm"
                                title="Tolak"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(item.id, item.user.name)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 hover:text-rose-800 rounded-lg transition-all cursor-pointer shadow-sm"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleWhatsAppShare(item)}
                              className="p-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-600 hover:text-green-700 rounded-lg transition-all cursor-pointer shadow-sm flex items-center justify-center"
                              title="Kirim WhatsApp ke Direktur"
                            >
                              <WhatsAppIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          /* Recap Tab */
          recapLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-600"></div>
            </div>
          ) : recapData.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium font-quicksand">
              <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p>Tidak ada data rekapitulasi lembur untuk bulan ini.</p>
            </div>
          ) : (
            <div className="border border-orange-100 rounded-2xl overflow-hidden bg-orange-50/5 animate-fade-in">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-quicksand">
                  <thead>
                    <tr className="bg-orange-50/30 text-slate-600 text-[10px] font-extrabold uppercase tracking-wider border-b border-orange-100">
                      <th className="py-4 px-5">Nama Karyawan</th>
                      <th className="py-4 px-5">Email</th>
                      <th className="py-4 px-5">Total Jam Disetujui</th>
                      <th className="py-4 px-5">Total Jam Menunggu</th>
                      <th className="py-4 px-5">Total Frekuensi Pengajuan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-100 text-xs font-semibold text-slate-700">
                    {recapData.map((item) => (
                      <tr key={item.id} className="hover:bg-orange-50/10 transition-colors">
                        <td className="py-4 px-5 font-bold text-slate-800">
                          {item.name}
                        </td>
                        <td className="py-4 px-5 text-slate-500">
                          {item.email}
                        </td>
                        <td className="py-4 px-5 font-bold text-emerald-600 font-mono">
                          {item.approved_hours} jam
                        </td>
                        <td className="py-4 px-5 text-amber-600 font-mono">
                          {item.pending_hours} jam
                        </td>
                        <td className="py-4 px-5 text-slate-600 font-mono">
                          {item.request_count} kali
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* Detailed Logs Pagination Controls */}
        {activeTab === 'logs' && pagination.last_page > 1 && (
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
      </section>

    </div>
  )
}
