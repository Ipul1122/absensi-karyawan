import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { getAssetUrl } from '../../../utils/api'
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
  // Calendar,
  DollarSign
} from 'lucide-react'

interface UserDetails {
  id: number
  name: string
  email: string
  company?: string
}

interface Reimbursement {
  id: number
  user_id: number
  title: string
  category: string
  amount: number
  expense_date: string
  description: string | null
  receipt_path: string
  status: 'pending' | 'pending_director' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
  updated_at: string
  user: UserDetails
}

interface AdminReimbursementProps {
  token: string
}

const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function AdminReimbursement({ token }: AdminReimbursementProps) {
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([])
  const [summary, setSummary] = useState({
    total_approved_this_month: 0,
    pending_count: 0,
    pending_director_count: 0,
    approved_count: 0,
    rejected_count: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'pending_director' | 'approved' | 'rejected'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const fetchReimbursements = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/admin/reimbursements', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setReimbursements(response.data.data)
      }
    } catch (err: any) {
      console.error(err)
      Swal.fire({
        title: 'Error',
        text: 'Gagal memuat daftar klaim reimbursement.',
        icon: 'error',
        background: '#fffdfb',
        color: '#3c1105'
      })
    }
  }

  const fetchSummary = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/admin/reimbursements/summary', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setSummary(response.data.data)
      }
    } catch (err: any) {
      console.error(err)
    }
  }

  const loadData = async () => {
    setLoading(true)
    await Promise.all([fetchReimbursements(), fetchSummary()])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleApprove = (id: number, employeeName: string, amount: number) => {
    Swal.fire({
      title: 'Setujui Reimbursement',
      text: `Apakah Anda yakin ingin menyetujui pengajuan reimburse sebesar Rp ${amount.toLocaleString('id-ID')} dari ${employeeName}?`,
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
            `http://localhost:8000/api/admin/reimbursements/${id}/approve`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          )

          if (response.data.status === 'success') {
            const item = reimbursements.find((r) => r.id === id)
            const companyName = item?.user?.company || 'PT Cakrawala Parama Internasional'
            const targetPhone = companyName.toLowerCase().includes('yasodana') ? '6289656931184' : '628170038421'
            const titleText = item?.title || ''
            const categoryText = item?.category || ''
            const amountText = item ? displayRupiah(item.amount) : ''
            const expenseDateText = item ? formatDate(item.expense_date) : ''

            const appUrl = import.meta.env.VITE_APP_URL || window.location.origin
            const waMessage = `Halo Direktur, terdapat pengajuan reimbursement baru yang membutuhkan persetujuan Anda.\n\nDetail Pengajuan:\n- Nama Karyawan: ${employeeName}\n- Perusahaan: ${companyName}\n- Keperluan: ${titleText}\n- Kategori: ${categoryText}\n- Nominal: ${amountText}\n- Tanggal Nota: ${expenseDateText}\n\nSilakan buka tautan berikut untuk memproses persetujuan:\n${appUrl}/director/karyawan`
            const waUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(waMessage)}`

            Swal.fire({
              title: 'Disetujui!',
              text: 'Klaim reimbursement berhasil disetujui. Ingin mengirim notifikasi WhatsApp ke Direktur?',
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
            loadData()
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
      title: 'Tolak Reimbursement',
      text: `Apakah Anda yakin ingin menolak pengajuan reimburse dari ${employeeName}?`,
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
            `http://localhost:8000/api/admin/reimbursements/${id}/reject`,
            { admin_notes: adminNotes },
            { headers: { Authorization: `Bearer ${token}` } }
          )

          if (response.data.status === 'success') {
            Swal.fire({
              title: 'Ditolak!',
              text: 'Klaim reimbursement berhasil ditolak.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
              background: '#fffdfb',
              color: '#3c1105'
            })
            loadData()
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

  const handleWhatsAppShare = (item: Reimbursement) => {
    const company = item.user.company;
    const isYpi = company === 'PT Yasodana Parvez Internasional';
    const directorName = isYpi ? 'Pak Andre' : 'Bu Dian';
    const phone = isYpi ? '6289656931184' : '628170038421';

    Swal.fire({
      title: 'Kirim WhatsApp ke Direktur',
      text: `Kirim rincian reimbursement untuk ${item.user.name} ke ${directorName}?`,
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

        const message = `Halo ${directorName}, mohon verifikasi pengajuan reimbursement berikut:

Nama Karyawan: ${item.user.name}
Keperluan: ${item.title}
Kategori: ${item.category}
Tanggal Nota: ${formatDate(item.expense_date)}
Nominal: ${displayRupiah(item.amount)}
Keterangan: ${item.description || '-'}
Status: ${statusText}

Terima kasih.`;

        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      }
    });
  }

  const viewProofImage = (imageUrl: string, name: string) => {
    Swal.fire({
      title: `Bukti Nota - ${name}`,
      imageUrl: getAssetUrl(imageUrl),
      imageAlt: 'Bukti Nota Belanja',
      confirmButtonColor: '#ea580c',
      confirmButtonText: 'Tutup',
      background: '#fffdfb',
      color: '#3c1105'
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

  const displayRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number)
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

  // Filtered List
  const filteredReimbursements = reimbursements.filter((item) => {
    const matchesSearch = 
      item.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const getStatusLabel = (status: string) => {
      if (status === 'approved') return 'Disetujui'
      if (status === 'rejected') return 'Ditolak'
      if (status === 'pending_director') return 'Menunggu Direktur'
      return 'Menunggu Admin'
    }

    const htmlContent = `
      <html>
        <head>
          <title>Rekap Reimbursement Karyawan</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #334155; padding: 25px; line-height: 1.5; }
            h1 { text-align: center; color: #1e293b; margin-bottom: 5px; font-size: 22px; font-weight: 800; }
            h3 { text-align: center; color: #64748b; font-weight: 600; font-size: 13px; margin-top: 0; margin-bottom: 25px; }
            .meta { margin-bottom: 25px; font-size: 11px; padding: 15px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
            table.data-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px; }
            table.data-table th, table.data-table td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
            table.data-table th { background-color: #f1f5f9; font-weight: 700; color: #334155; text-transform: uppercase; font-size: 8px; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 8px; font-weight: 700; }
            .badge-pending { background-color: #fffbeb; color: #b45309; }
            .badge-approved { background-color: #ecfdf5; color: #047857; }
            .badge-rejected { background-color: #fef2f2; color: #b91c1c; }
            @media print {
              button { display: none; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <h1>Laporan Rekapitulasi Reimbursement Karyawan</h1>
          <h3>Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</h3>
          
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">No</th>
                <th>Nama Karyawan</th>
                <th>Keperluan</th>
                <th>Kategori</th>
                <th>Tanggal Transaksi</th>
                <th>Jumlah Uang</th>
                <th>Status</th>
                <th>Catatan Admin</th>
              </tr>
            </thead>
            <tbody>
              ${filteredReimbursements.length === 0 ? `
                <tr>
                  <td colSpan="8" style="text-align: center; padding: 20px; color: #64748b;">
                    Tidak ada data reimbursement yang sesuai filter.
                  </td>
                </tr>
              ` : filteredReimbursements.map((item, idx) => `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td><strong>${item.user.name}</strong><br/><span style="color: #64748b; font-size: 8.5px;">${item.user.email}</span></td>
                  <td>${item.title}</td>
                  <td>${item.category}</td>
                  <td>${formatDate(item.expense_date)}</td>
                  <td><strong>Rp ${item.amount.toLocaleString('id-ID')}</strong></td>
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
        <h2>Laporan Rekapitulasi Reimbursement Karyawan</h2>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Karyawan</th>
              <th>Email</th>
              <th>Keperluan</th>
              <th>Kategori</th>
              <th>Tanggal Transaksi</th>
              <th>Nominal</th>
              <th>Status</th>
              <th>Catatan Admin</th>
            </tr>
          </thead>
          <tbody>
    `

    filteredReimbursements.forEach((item, idx) => {
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
          <td>${item.title}</td>
          <td>${item.category}</td>
          <td>${item.expense_date}</td>
          <td>Rp ${item.amount}</td>
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
    link.download = `Rekap_Reimbursement_${new Date().toISOString().slice(0, 10)}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const isFilterModified = searchQuery !== '' || statusFilter !== 'all' || categoryFilter !== 'all'

  return (
    <div className="space-y-6 font-quicksand">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Manajemen Reimbursement Karyawan</h3>
          <p className="text-xs text-slate-500 font-medium">Review dan verifikasi nota pengeluaran klaim dinas karyawan.</p>
        </div>
        
        <div className="flex items-center gap-2.5">
          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-red-500/10 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Ekspor PDF
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
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Approved total monthly */}
        <div className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-quicksand">Dana Disetujui Bulan Ini</span>
            <span className="text-xl font-black text-emerald-600 mt-1 block font-mono">{displayRupiah(summary.total_approved_this_month)}</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
            <DollarSign className="w-6 h-6" />
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

      {/* Filter and Search Panel */}
      <section className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm font-quicksand">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          
          {/* Search Input */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cari Pengajuan</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, email, keperluan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 focus:border-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2 pl-9 pr-3 outline-none transition-all text-xs font-semibold shadow-sm"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori Pengeluaran</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none transition-all text-xs font-semibold shadow-sm"
            >
              <option value="all">Semua Kategori</option>
              <option value="Transportasi">Transportasi</option>
              <option value="Konsumsi">Konsumsi</option>
              <option value="Medis">Medis</option>
              <option value="Operasional Kantor">Operasional Kantor</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1 col-span-1 md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Status Klaim
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
                setCategoryFilter('all')
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

      {/* Table */}
      <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-600"></div>
          </div>
        ) : filteredReimbursements.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium font-quicksand">
            <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p>Tidak ditemukan klaim reimbursement yang sesuai filter.</p>
          </div>
        ) : (
          <>
            {/* Desktop View: Table */}
            <div className="hidden md:block border border-orange-100 rounded-2xl overflow-hidden bg-orange-50/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-quicksand">
                  <thead>
                    <tr className="bg-orange-50/30 text-slate-600 text-[10px] font-extrabold uppercase tracking-wider border-b border-orange-100">
                      <th className="py-4 px-5">Karyawan</th>
                      <th className="py-4 px-5">Keperluan / Keterangan</th>
                      <th className="py-4 px-5">Dibuat</th>
                      <th className="py-4 px-5">Diterima</th>
                      <th className="py-4 px-5">Kategori</th>
                      <th className="py-4 px-5">Nominal Klaim</th>
                      <th className="py-4 px-5">Tanggal Nota</th>
                      <th className="py-4 px-5">Nota Bukti</th>
                      <th className="py-4 px-5">Status</th>
                      <th className="py-4 px-5">Catatan Admin</th>
                      <th className="py-4 px-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-100 text-xs font-semibold text-slate-700">
                    {filteredReimbursements.map((item) => (
                      <tr key={item.id} className="hover:bg-orange-50/10 transition-colors">
                        {/* Employee detail */}
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

                        {/* Title & Desc */}
                        <td className="py-4 px-5 max-w-[240px]">
                          <span className="block font-bold text-slate-800 break-words whitespace-normal leading-normal">{item.title}</span>
                          <span className="text-[10px] text-slate-400 font-medium max-w-[220px] truncate block">
                            {item.description || '-'}
                          </span>
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

                        {/* Category */}
                        <td className="py-4 px-5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold border text-slate-700 bg-slate-100 border-slate-200">
                            {item.category}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-5 font-bold text-slate-800 font-mono">
                          {displayRupiah(item.amount)}
                        </td>

                        {/* Date */}
                        <td className="py-4 px-5 text-slate-500">
                          {formatDate(item.expense_date)}
                        </td>

                        {/* Struk */}
                        <td className="py-4 px-5">
                          <button
                            type="button"
                            onClick={() => viewProofImage(item.receipt_path, item.user.name)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-all border border-orange-150 cursor-pointer text-[10px] font-bold"
                          >
                            <Eye className="w-3.5 h-3.5" /> Lihat Nota
                          </button>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-5">
                          {getStatusBadge(item.status)}
                        </td>

                        {/* Admin notes */}
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
                            {item.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(item.id, item.user.name, item.amount)}
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 hover:text-emerald-700 rounded-lg transition-all cursor-pointer shadow-sm"
                                  title="Setujui"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleReject(item.id, item.user.name)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 hover:text-rose-700 rounded-lg transition-all cursor-pointer shadow-sm"
                                  title="Tolak"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
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

            {/* Mobile View: Cards */}
            <div className="space-y-4 md:hidden">
              {filteredReimbursements.map((item) => (
                <div key={item.id} className="bg-orange-50/5 border border-orange-100/80 rounded-2xl p-4 space-y-3 shadow-sm hover:border-orange-200 transition-colors">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-50 to-orange-100/60 border border-orange-200/50 flex items-center justify-center text-red-500 font-extrabold text-xs shrink-0">
                        {item.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="block font-bold text-slate-800 text-xs">{item.user.name}</span>
                        <span className="text-[9px] text-slate-400 font-medium block">{item.user.email}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {getStatusBadge(item.status)}
                    </div>
                  </div>

                  <div className="border-t border-orange-100/55 pt-2">
                    <span className="block font-bold text-slate-800 text-sm break-words leading-snug">{item.title}</span>
                    <span className="text-[10px] text-slate-400 font-medium mt-1 block break-words">
                      {item.description || 'Tidak ada deskripsi'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-orange-100/50 py-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">Kategori</span>
                      <span className="font-semibold text-slate-700">{item.category}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">Tanggal Nota</span>
                      <span className="font-semibold text-slate-700">{formatDate(item.expense_date)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">Jumlah Klaim</span>
                      <span className="text-sm font-extrabold text-slate-900 font-mono">{displayRupiah(item.amount)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => viewProofImage(item.receipt_path, item.user.name)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl text-xs font-bold transition-all border border-orange-100 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Nota
                      </button>
                      <div className="flex gap-1 items-center">
                        {item.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(item.id, item.user.name, item.amount)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-600 hover:text-emerald-700 rounded-lg transition-all cursor-pointer shadow-sm"
                              title="Setujui"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(item.id, item.user.name)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 hover:text-rose-700 rounded-lg transition-all cursor-pointer shadow-sm"
                              title="Tolak"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleWhatsAppShare(item)}
                          className="p-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-600 hover:text-green-700 rounded-lg transition-all cursor-pointer shadow-sm flex items-center justify-center"
                          title="Kirim WhatsApp ke Direktur"
                        >
                          <WhatsAppIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {item.admin_notes && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-[10px] text-slate-500 font-medium italic">
                      <strong>Catatan Admin:</strong> "{item.admin_notes}"
                    </div>
                  )}

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-[10px] text-slate-500 font-medium space-y-1 mt-2">
                    <div><strong>Dibuat:</strong> {formatDateTime(item.created_at)}</div>
                    <div>
                      <strong>Diterima:</strong> {item.status === 'approved' ? formatDateTime(item.updated_at) :
                       item.status === 'rejected' ? `Ditolak pada ${formatDateTime(item.updated_at)}` : '-'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

    </div>
  )
}
