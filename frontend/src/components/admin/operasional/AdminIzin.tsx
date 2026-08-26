import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { getAssetUrl, API_BASE_URL } from '../../../utils/api'
import { 
  Check, 
  X, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Filter,
  Eye,
  FileDown,
  Printer,
  Calendar,
  Trash2,
  Plus,
  Upload
} from 'lucide-react'

interface UserDetails {
  id: number
  name: string
  email: string
  company?: string
}

interface PermitRequest {
  id: number
  user_id: number
  category: string
  custom_category: string | null
  start_date: string
  end_date: string
  reason: string
  image: string | null
  status: 'pending' | 'pending_director' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
  updated_at: string
  user?: UserDetails | null
}

interface AdminIzinProps {
  token: string
}

export default function AdminIzin({ token }: AdminIzinProps) {
  const baseUrl = API_BASE_URL || 'http://localhost:8000'
  const [permits, setPermits] = useState<PermitRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'pending_director' | 'approved' | 'rejected'>('all')

  const currentMonthStr = (() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })()

  const [monthFilter, setMonthFilter] = useState(currentMonthStr)

  // Form states for Admin Izin submission (Ajukan Izin Pribadi)
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [category, setCategory] = useState('Izin Sakit Tanpa Surat Dokter')
  const [customCategory, setCustomCategory] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const categories = [
    'Izin Sakit Tanpa Surat Dokter',
    'Izin Keperluan Keluarga Darurat',
    'Izin Urusan Hukum / Pemerintahan',
    'Izin Keagamaan',
    'LAINNYA'
  ]

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          title: 'File Terlalu Besar',
          text: 'Ukuran file maksimal adalah 5MB.',
          icon: 'warning',
          background: '#fffdfb',
          color: '#3c1105'
        })
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!startDate || !endDate || !reason) {
      Swal.fire({
        title: 'Form Belum Lengkap',
        text: 'Harap isi tanggal mulai, tanggal selesai, dan alasan izin.',
        icon: 'warning',
        background: '#fffdfb',
        color: '#3c1105'
      })
      return
    }

    if (category === 'LAINNYA' && !customCategory.trim()) {
      Swal.fire({
        title: 'Kategori Belum Lengkap',
        text: 'Harap isi nama kategori izin kustom Anda.',
        icon: 'warning',
        background: '#fffdfb',
        color: '#3c1105'
      })
      return
    }

    if (new Date(endDate) < new Date(startDate)) {
      Swal.fire({
        title: 'Tanggal Tidak Valid',
        text: 'Tanggal selesai tidak boleh sebelum tanggal mulai.',
        icon: 'warning',
        background: '#fffdfb',
        color: '#3c1105'
      })
      return
    }

    setSubmitting(true)
    
    const formData = new FormData()
    formData.append('category', category)
    if (category === 'LAINNYA') {
      formData.append('custom_category', customCategory)
    }
    formData.append('start_date', startDate)
    formData.append('end_date', endDate)
    formData.append('reason', reason)
    if (imageFile) {
      formData.append('image', imageFile)
    }

    try {
      const response = await axios.post(`${baseUrl}/api/permits`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.status === 'success') {
        Swal.fire({
          title: 'Berhasil!',
          text: response.data.message,
          icon: 'success',
          background: '#fffdfb',
          color: '#3c1105'
        })
        setShowAddModal(false)
        setCategory('Izin Sakit Tanpa Surat Dokter')
        setCustomCategory('')
        setStartDate('')
        setEndDate('')
        setReason('')
        setImageFile(null)
        setImagePreview(null)
        fetchPermits()
      }
    } catch (err: any) {
      console.error(err)
      Swal.fire('Gagal', err.response?.data?.message || 'Gagal mengirim pengajuan.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const fetchPermits = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${baseUrl}/api/admin/permits`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setPermits(response.data.data)
      }
    } catch (err: any) {
      console.error(err)
      Swal.fire({
        title: 'Error',
        text: 'Gagal memuat daftar pengajuan izin.',
        icon: 'error',
        background: '#fffdfb',
        color: '#3c1105'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPermits()
  }, [])

  const handleApprove = (id: number, employeeName: string) => {
    Swal.fire({
      title: 'Setujui Pengajuan Izin',
      text: `Apakah Anda yakin ingin memverifikasi pengajuan izin dari ${employeeName}?`,
      input: 'textarea',
      inputPlaceholder: 'Tambahkan catatan persetujuan di sini (opsional)...',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Verifikasi!',
      cancelButtonText: 'Batal',
      background: '#fffdfb',
      color: '#3c1105'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const adminNotes = result.value || ''
        try {
          const response = await axios.put(
            `${baseUrl}/api/admin/permits/${id}/approve`,
            { admin_notes: adminNotes },
            { headers: { Authorization: `Bearer ${token}` } }
          )

          if (response.data.status === 'success') {
            const permitItem = permits.find((p) => p.id === id)
            const companyName = permitItem?.user?.company || 'PT Cakrawala Parama Internasional'
            const targetPhone = companyName.toLowerCase().includes('yasodana') ? '6289656931184' : '628170038421'
            const categoryName = permitItem ? (permitItem.category === 'LAINNYA' ? permitItem.custom_category : permitItem.category) : ''
            const duration = permitItem ? calculateDays(permitItem.start_date, permitItem.end_date) : 0
            const periodStr = permitItem ? `${formatDate(permitItem.start_date)} s/d ${formatDate(permitItem.end_date)}` : ''
            const reasonText = permitItem?.reason || ''

            const appUrl = import.meta.env.VITE_APP_URL || window.location.origin
            const waMessage = `Halo Direktur, terdapat pengajuan izin baru yang membutuhkan persetujuan Anda.\n\nDetail Pengajuan:\n- Nama Karyawan: ${employeeName}\n- Perusahaan: ${companyName}\n- Kategori Izin: ${categoryName}\n- Masa Izin: ${periodStr} (${duration} Hari)\n- Alasan: ${reasonText}\n\nSilakan buka tautan berikut untuk memproses persetujuan:\n${appUrl}/director/operasional`
            const waUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(waMessage)}`

            Swal.fire({
              title: 'Diverifikasi!',
              text: 'Pengajuan izin berhasil diverifikasi. Ingin mengirim notifikasi WhatsApp ke Direktur?',
              icon: 'success',
              showCancelButton: true,
              confirmButtonText: 'Ya, Kirim WhatsApp',
              cancelButtonText: 'Tidak, Tutup',
              confirmButtonColor: '#ea580c',
              cancelButtonColor: '#94a3b8',
              background: '#fffdfb',
              color: '#3c1105'
            }).then((waResult) => {
              if (waResult.isConfirmed) {
                window.open(waUrl, '_blank')
              }
            })
            fetchPermits()
          }
        } catch (err: any) {
          console.error(err)
          const msg = err.response?.data?.message || 'Gagal memproses persetujuan.'
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
      title: 'Tolak Pengajuan Izin',
      text: `Apakah Anda yakin ingin menolak pengajuan izin dari ${employeeName}?`,
      input: 'textarea',
      inputPlaceholder: 'Tuliskan alasan penolakan di sini (opsional)...',
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
        const adminNotes = result.value || ''
        try {
          const response = await axios.put(
            `${baseUrl}/api/admin/permits/${id}/reject`,
            { admin_notes: adminNotes },
            { headers: { Authorization: `Bearer ${token}` } }
          )

          if (response.data.status === 'success') {
            Swal.fire({
              title: 'Ditolak!',
              text: 'Pengajuan izin berhasil ditolak.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
              background: '#fffdfb',
              color: '#3c1105'
            })
            fetchPermits()
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
      title: 'Hapus Pengajuan Izin?',
      text: `Apakah Anda yakin ingin menghapus pengajuan izin untuk ${name}?`,
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
        const response = await axios.delete(`${baseUrl}/api/permits/${id}`, {
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
          fetchPermits()
        }
      } catch (err: any) {
        Swal.fire('Gagal', err.response?.data?.message || 'Gagal menghapus pengajuan.', 'error')
      }
    }
  }

  const viewProofImage = (imageUrl: string, name: string) => {
    Swal.fire({
      title: `Bukti Pengajuan Izin - ${name}`,
      imageUrl: getAssetUrl(imageUrl),
      imageAlt: 'Bukti Izin',
      confirmButtonColor: '#ea580c',
      confirmButtonText: 'Tutup',
      background: '#fffdfb',
      color: '#3c1105'
    })
  }

  const calculateDays = (start: string, end: string) => {
    const s = new Date(start)
    const e = new Date(end)
    const diffTime = Math.abs(e.getTime() - s.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
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

  // Filtered permit list
  const filteredPermits = permits.filter((permit) => {
    const userName = permit.user?.name || ''
    const userEmail = permit.user?.email || ''
    const categoryText = permit.category === 'LAINNYA' ? (permit.custom_category || '') : (permit.category || '')

    const matchesSearch = 
      userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      categoryText.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || permit.status === statusFilter

    const matchesMonth = !monthFilter || 
                         permit.start_date?.startsWith(monthFilter) || 
                         permit.end_date?.startsWith(monthFilter) || 
                         permit.created_at?.startsWith(monthFilter)

    return matchesSearch && matchesStatus && matchesMonth
  })

  // Statistics calculation
  const totalPending = permits.filter((p) => p.status === 'pending').length
  const totalPendingDirector = permits.filter((p) => p.status === 'pending_director').length
  const totalApproved = permits.filter((p) => p.status === 'approved').length
  const totalRejected = permits.filter((p) => p.status === 'rejected').length

  const getIndonesianMonthName = (monthNum: number) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[monthNum];
  }

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const [year, month] = monthFilter.split('-')
    const indonesianMonthName = month ? getIndonesianMonthName(parseInt(month, 10) - 1) : 'Semua Bulan'
    const activeYear = year || ''

    const getStatusLabel = (status: string) => {
      if (status === 'approved') return 'Disetujui'
      if (status === 'rejected') return 'Ditolak'
      if (status === 'pending_director') return 'Menunggu Direktur'
      return 'Menunggu Admin'
    }

    const htmlContent = `
      <html>
        <head>
          <title>Rekap Izin Karyawan - ${indonesianMonthName} ${activeYear}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #334155; padding: 25px; line-height: 1.5; }
            h1 { text-align: center; color: #1e293b; margin-bottom: 5px; font-size: 22px; font-weight: 800; }
            h3 { text-align: center; color: #64748b; font-weight: 600; font-size: 13px; margin-top: 0; margin-bottom: 25px; }
            .meta { margin-bottom: 25px; font-size: 11px; padding: 15px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
            .meta table { width: 100%; border-collapse: collapse; }
            .meta td { padding: 4px 8px; border: none; }
            .meta td.label { font-weight: bold; color: #475569; width: 18%; }
            table.data-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px; }
            table.data-table th, table.data-table td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
            table.data-table th { background-color: #f1f5f9; font-weight: 700; color: #334155; text-transform: uppercase; font-size: 8px; letter-spacing: 0.5px; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 8px; font-weight: 700; border: 1px solid transparent; }
            .badge-pending { background-color: #fffbeb; color: #b45309; border-color: #fde68a; }
            .badge-approved { background-color: #ecfdf5; color: #047857; border-color: #a7f3d0; }
            .badge-rejected { background-color: #fef2f2; color: #b91c1c; border-color: #fca5a5; }
            @media print {
              button { display: none; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <h1>Laporan Rekapitulasi Izin Karyawan</h1>
          <h3>Bulan: ${indonesianMonthName} ${activeYear} | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</h3>
          
          <div class="meta">
            <table>
          <div class="header">
            <h1>Rekapitulasi Pengajuan Izin Karyawan</h1>
            <p>PT Cakrawala Parama Internasional & PT Yasodana Parvez Internasional</p>
          </div>
          <table class="meta-table">
            <tr>
              <td style="width: 12%;"><strong>Periode:</strong></td>
              <td style="width: 38%;">${indonesianMonthName} ${activeYear}</td>
              <td style="width: 15%;"><strong>Total Pengajuan:</strong></td>
              <td style="width: 35%;">${filteredPermits.length} Data</td>
            </tr>
            <tr>
              <td><strong>Status Filter:</strong></td>
              <td>${statusFilter === 'all' ? 'Semua Status' : statusFilter === 'approved' ? 'Disetujui' : statusFilter === 'rejected' ? 'Ditolak' : 'Menunggu Persetujuan'}</td>
              <td><strong>Waktu Cetak:</strong></td>
              <td>${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
            </tr>
          </table>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 4%; text-align: center;">No</th>
                <th style="width: 18%;">Nama Karyawan</th>
                <th style="width: 16%;">Kategori</th>
                <th style="width: 14%;">Periode Izin</th>
                <th style="width: 8%; text-align: center;">Durasi</th>
                <th style="width: 22%;">Alasan</th>
                <th style="width: 9%;">Status</th>
                <th style="width: 9%;">Catatan</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPermits.length === 0 ? `
                <tr>
                  <td colSpan="8" style="text-align: center; padding: 20px; color: #64748b;">
                    Tidak ada data pengajuan izin yang sesuai filter.
                  </td>
                </tr>
              ` : filteredPermits.map((permit, idx) => `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td><strong>${permit.user?.name || 'Karyawan Dihapus'}</strong><br/><span style="color: #64748b; font-size: 8.5px;">${permit.user?.email || '-'}</span></td>
                  <td>${permit.category === 'LAINNYA' ? permit.custom_category : permit.category}</td>
                  <td>${formatDate(permit.start_date)} s/d ${formatDate(permit.end_date)}</td>
                  <td>${calculateDays(permit.start_date, permit.end_date)} Hari</td>
                  <td>${permit.reason}</td>
                  <td><span class="badge badge-${permit.status}">${getStatusLabel(permit.status)}</span></td>
                  <td>${permit.admin_notes || '-'}</td>
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
    const [year, month] = monthFilter.split('-')
    const indonesianMonthName = month ? getIndonesianMonthName(parseInt(month, 10) - 1) : 'Semua Bulan'
    const activeYear = year || ''

    let excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #089720ff; padding: 8px; text-align: left; }
          th { background-color: #089720ff; font-weight: bold; }
          .text-center { text-align: center; }
          .title { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
          .subtitle { font-size: 12px; color: #089720ff; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="title">Laporan Rekapitulasi Izin Karyawan</div>
        <div class="subtitle">Bulan: ${indonesianMonthName} ${activeYear} | Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID')}</div>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Karyawan</th>
              <th>Email</th>
              <th>Kategori Izin</th>
              <th>Tanggal Mulai</th>
              <th>Tanggal Selesai</th>
              <th>Durasi (Hari)</th>
              <th>Alasan Izin</th>
              <th>Status</th>
              <th>Catatan Admin/Direktur</th>
            </tr>
          </thead>
          <tbody>
    `

    filteredPermits.forEach((permit, idx) => {
      const days = calculateDays(permit.start_date, permit.end_date)
      const statusText = permit.status === 'approved' 
        ? 'Disetujui' 
        : permit.status === 'rejected' 
          ? 'Ditolak' 
          : permit.status === 'pending_director' 
            ? 'Menunggu Direktur' 
            : 'Menunggu Admin'
      const catText = permit.category === 'LAINNYA' ? permit.custom_category : permit.category

      excelContent += `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td><b>${permit.user?.name || 'Karyawan Dihapus'}</b></td>
          <td>${permit.user?.email || '-'}</td>
          <td>${catText}</td>
          <td>${permit.start_date}</td>
          <td>${permit.end_date}</td>
          <td class="text-center">${days} Hari</td>
          <td>${permit.reason}</td>
          <td>${statusText}</td>
          <td>${permit.admin_notes || '-'}</td>
        </tr>
      `
    })

    if (filteredPermits.length === 0) {
      excelContent += `
        <tr>
          <td colspan="10" class="text-center" style="color: #64748b; padding: 20px;">Tidak ada data izin yang sesuai filter.</td>
        </tr>
      `
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
    link.download = `Rekap_Izin_${indonesianMonthName.replace(/\s+/g, '_')}_${activeYear}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold border ${badgeConfig[status]} font-quicksand`}>
        {textMap[status]}
      </span>
    )
  }

  const isFilterModified = searchQuery !== '' || statusFilter !== 'all' || monthFilter !== currentMonthStr

  return (
    <div className="space-y-6 font-quicksand">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Manajemen Izin Karyawan</h3>
          <p className="text-xs text-slate-500 font-medium">Verifikasi, tolak, dan pantau pengajuan izin tidak masuk kerja dari karyawan.</p>
        </div>
        
        <div className="flex items-center gap-2.5">
          {/* Ajukan Izin Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-orange-500/10 cursor-pointer"
            title="Ajukan Izin Pribadi"
          >
            <Plus className="w-4 h-4" />
            Ajukan Izin Pribadi
          </button>

          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-red-500/10 cursor-pointer"
            title="Ekspor PDF"
          >
            <Printer className="w-4 h-4" />
            Ekspor PDF
          </button>

          {/* Export Excel Button */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
            title="Ekspor Excel"
          >
            <FileDown className="w-4 h-4" />
            Ekspor Excel
          </button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        {/* Pending Admin Card */}
        <div className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-quicksand">Menunggu Admin</span>
            <span className="text-3xl font-black text-slate-800 mt-1 block font-mono">{totalPending}</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 border border-amber-100">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Director Card */}
        <div className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-quicksand">Menunggu Direktur</span>
            <span className="text-3xl font-black text-slate-800 mt-1 block font-mono">{totalPendingDirector}</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 border border-blue-100">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Approved Card */}
        <div className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-quicksand">Telah Disetujui</span>
            <span className="text-3xl font-black text-slate-800 mt-1 block font-mono">{totalApproved}</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Rejected Card */}
        <div className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-quicksand">Telah Ditolak</span>
            <span className="text-3xl font-black text-slate-800 mt-1 block font-mono">{totalRejected}</span>
          </div>
          <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 border border-rose-100">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </section>

      {/* Filter and Search Panel */}
      <section className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm font-quicksand">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          
          {/* Search Input */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cari Karyawan</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, email, kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 focus:border-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2 pl-9 pr-3 outline-none transition-all text-xs font-semibold shadow-sm"
              />
            </div>
          </div>

          {/* Month & Year Picker */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-red-500" />
              Filter Bulan
            </label>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none transition-all text-xs font-semibold shadow-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="space-y-1 col-span-1 md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Status Izin
            </label>
            <div className="flex bg-orange-50/30 border border-orange-100 rounded-xl p-1 justify-between h-[38px] items-center shadow-sm">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'pending', label: 'Menunggu Admin' },
                { id: 'pending_director', label: 'Menunggu Dir.' },
                { id: 'approved', label: 'Disetujui' },
                { id: 'rejected', label: 'Ditolak' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id as any)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    statusFilter === filter.id
                      ? 'bg-white border border-orange-100 text-red-500 shadow-sm font-extrabold'
                      : 'text-slate-500 hover:text-red-500'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Filter Button */}
          <div>
            <button
              onClick={() => {
                setSearchQuery('')
                setMonthFilter(currentMonthStr)
                setStatusFilter('all')
              }}
              disabled={!isFilterModified}
              className="w-full py-2 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 font-bold rounded-xl text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow h-[38px] flex items-center justify-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              Bersihkan Filter
            </button>
          </div>

        </div>
      </section>

      {/* Leave Applications Table */}
      <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-600"></div>
          </div>
        ) : filteredPermits.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium font-quicksand">
            <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p>Tidak ditemukan pengajuan izin yang sesuai.</p>
          </div>
        ) : (
          <div className="border border-orange-100 rounded-2xl overflow-hidden bg-orange-50/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-quicksand">
                <thead>
                  <tr className="bg-orange-50/30 text-slate-600 text-[10px] font-extrabold uppercase tracking-wider border-b border-orange-100">
                    <th className="py-4 px-5">Karyawan</th>
                    <th className="py-4 px-5">Kategori</th>
                    <th className="py-4 px-5">Dibuat</th>
                    <th className="py-4 px-5">Diterima</th>
                    <th className="py-4 px-5">Masa Izin</th>
                    <th className="py-4 px-5">Keterangan / Alasan</th>
                    <th className="py-4 px-5">Bukti</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5">Catatan Admin/Direktur</th>
                    <th className="py-4 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100 text-xs font-semibold text-slate-700">
                  {filteredPermits.map((permit) => {
                    const days = calculateDays(permit.start_date, permit.end_date)
                    return (
                      <tr key={permit.id} className="hover:bg-orange-50/10 transition-colors">
                        {/* Employee detail */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-50 to-orange-100/60 border border-orange-200/50 flex items-center justify-center text-red-500 font-extrabold text-xs">
                              {permit.user?.name ? permit.user.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div>
                              <span className="block font-bold text-slate-800">{permit.user?.name || 'Karyawan Dihapus'}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{permit.user?.email || '-'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-4 px-5">
                          <span className="block font-bold text-slate-800">
                            {permit.category === 'LAINNYA' ? permit.custom_category : permit.category}
                          </span>
                        </td>

                        {/* Dibuat */}
                        <td className="py-4 px-5 text-slate-700">
                          {formatDateTime(permit.created_at)}
                        </td>

                        {/* Diterima */}
                        <td className="py-4 px-5 text-slate-700">
                          {permit.status === 'approved' || permit.status === 'rejected'
                            ? formatDateTime(permit.updated_at)
                            : '-'}
                        </td>

                        {/* Period */}
                        <td className="py-4 px-5">
                          <span className="block text-slate-750 font-bold">{days} Hari</span>
                          <span className="text-[10px] text-slate-400 font-medium block">
                            {formatDate(permit.start_date)} - {formatDate(permit.end_date)}
                          </span>
                        </td>

                        {/* Reason */}
                        <td className="py-4 px-5 max-w-xs truncate" title={permit.reason}>
                          {permit.reason}
                        </td>

                        {/* Evidence */}
                        <td className="py-4 px-5">
                          {permit.image ? (
                            <button
                              type="button"
                              onClick={() => viewProofImage(permit.image!, permit.user?.name || 'Karyawan')}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-all border border-orange-150 cursor-pointer text-[10px] font-bold"
                            >
                              <Eye className="w-3.5 h-3.5" /> Lihat
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic font-medium">-</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-5">
                          {getStatusBadge(permit.status)}
                        </td>

                        {/* Admin Notes */}
                        <td className="py-4 px-5 max-w-[180px] truncate" title={permit.admin_notes || ''}>
                          {permit.admin_notes ? (
                            <span className="text-slate-600 font-medium italic">"{permit.admin_notes}"</span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic font-medium">-</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex justify-end gap-1.5">
                            {(permit.status === 'pending' || permit.status === 'rejected') && (
                              <button
                                onClick={() => handleApprove(permit.id, permit.user?.name || 'Karyawan')}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 hover:text-emerald-700 rounded-lg transition-all cursor-pointer shadow-sm"
                                title="Verifikasi"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            {(permit.status === 'pending' || permit.status === 'approved' || permit.status === 'pending_director') && (
                              <button
                                onClick={() => handleReject(permit.id, permit.user?.name || 'Karyawan')}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 hover:text-rose-700 rounded-lg transition-all cursor-pointer shadow-sm"
                                title="Tolak"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(permit.id, permit.user?.name || 'Karyawan')}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 hover:text-rose-850 rounded-lg transition-all cursor-pointer shadow-sm"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Modal Ajukan Izin */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-100 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 animate-scaleUp">
            
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-sm font-bold text-slate-800">Ajukan Izin Pribadi</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Silakan isi formulir di bawah untuk mengajukan izin tidak masuk kerja Anda sendiri. Pengajuan akan diteruskan langsung ke Direktur.</p>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori Izin</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none transition-all text-xs font-semibold"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {category === 'LAINNYA' && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Kategori Kustom</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Tulis kategori izin..."
                    className="w-full bg-slate-50/50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none transition-all text-xs font-semibold"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none transition-all text-xs font-semibold cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none transition-all text-xs font-semibold cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alasan Izin</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Berikan alasan detail izin..."
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none transition-all text-xs font-semibold resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lampiran Bukti (Opsional)</label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-350 text-slate-650 rounded-xl text-[10px] font-bold cursor-pointer transition-all shadow-sm">
                    <Upload className="w-3.5 h-3.5 text-orange-500" />
                    Pilih File Foto
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                  {imagePreview && (
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1 pr-2">
                      <img src={imagePreview} alt="Preview" className="w-6 h-6 object-cover rounded-lg" />
                      <span className="text-[9px] text-slate-500 font-semibold truncate max-w-[80px]">{imageFile?.name}</span>
                      <button type="button" onClick={handleRemoveImage} className="text-red-500 hover:text-red-700 text-xs cursor-pointer font-bold leading-none">×</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-orange-500/10 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
