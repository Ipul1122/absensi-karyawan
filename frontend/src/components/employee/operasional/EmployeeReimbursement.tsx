import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { 
  Upload, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  // FileText, 
  Plus, 
  FileImage,
  CalendarDays,
  DollarSign,
  Eye
} from 'lucide-react'

interface Reimbursement {
  id: number
  title: string
  category: 'Transportasi' | 'Konsumsi' | 'Medis' | 'Operasional Kantor' | 'Lainnya'
  amount: number
  expense_date: string
  description: string | null
  receipt_path: string
  status: 'pending' | 'pending_director' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
}

interface EmployeeReimbursementProps {
  token: string
}

export default function EmployeeReimbursement({ token }: EmployeeReimbursementProps) {
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Transportasi')
  const [amount, setAmount] = useState('')
  const [expenseDate, setExpenseDate] = useState('')
  const [description, setDescription] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)

  // Filter & Pagination States
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const categories = [
    'Transportasi',
    'Konsumsi',
    'Medis',
    'Operasional Kantor',
    'Lainnya'
  ]

  const fetchReimbursements = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:8000/api/reimbursements', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setReimbursements(response.data.data)
      }
    } catch (err: any) {
      console.error('Gagal mengambil data reimburse:', err)
      Swal.fire({
        title: 'Error',
        text: 'Gagal memuat riwayat pengajuan reimbursement.',
        icon: 'error',
        background: '#fffdfb',
        color: '#3c1105'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReimbursements()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          title: 'Berkas Terlalu Besar',
          text: 'Ukuran file maksimal adalah 5MB.',
          icon: 'warning',
          background: '#fffdfb',
          color: '#3c1105'
        })
        return
      }
      setReceiptFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveFile = () => {
    setReceiptFile(null)
    setReceiptPreview(null)
  }

  const formatRupiahInput = (val: string) => {
    // bersihkan karakter selain angka
    const clean = val.replace(/[^0-9]/g, '')
    setAmount(clean)
  }

  const displayRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !amount || !expenseDate || !receiptFile) {
      Swal.fire({
        title: 'Form Belum Lengkap',
        text: 'Harap isi judul, jumlah klaim, tanggal pengeluaran, dan bukti nota belanja.',
        icon: 'warning',
        background: '#fffdfb',
        color: '#3c1105'
      })
      return
    }

    setSubmitting(true)

    const formData = new FormData()
    formData.append('title', title)
    formData.append('category', category)
    formData.append('amount', amount)
    formData.append('expense_date', expenseDate)
    formData.append('description', description)
    formData.append('receipt', receiptFile)

    try {
      const response = await axios.post('http://localhost:8000/api/reimbursements', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.status === 'success') {
        Swal.fire({
          title: 'Berhasil!',
          text: response.data.message || 'Pengajuan reimbursement berhasil dikirim.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          background: '#fffdfb',
          color: '#3c1105'
        })

        // Reset form
        setTitle('')
        setCategory('Transportasi')
        setAmount('')
        setExpenseDate('')
        setDescription('')
        setReceiptFile(null)
        setReceiptPreview(null)
        setShowForm(false)

        fetchReimbursements()
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal mengirimkan pengajuan reimbursement.'
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
      text: 'Apakah Anda yakin ingin membatalkan pengajuan reimbursement ini?',
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
          const response = await axios.delete(`http://localhost:8000/api/reimbursements/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (response.data.status === 'success') {
            Swal.fire({
              title: 'Dibatalkan!',
              text: 'Pengajuan reimbursement berhasil dibatalkan.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
              background: '#fffdfb',
              color: '#3c1105'
            })
            fetchReimbursements()
          }
        } catch (err: any) {
          console.error(err)
          const msg = err.response?.data?.message || 'Gagal membatalkan pengajuan reimbursement.'
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

  const handleShowReceipt = (path: string) => {
    Swal.fire({
      title: 'Bukti Pembayaran / Nota',
      imageUrl: `http://localhost:8000${path}`,
      imageAlt: 'Bukti Nota',
      background: '#fffdfb',
      color: '#3c1105',
      confirmButtonColor: '#ea580c',
      confirmButtonText: 'Tutup'
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

  const getStatusBadge = (status: 'pending' | 'pending_director' | 'approved' | 'rejected') => {
    const config = {
      pending: {
        text: 'Menunggu Persetujuan Admin',
        classes: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: <Clock className="w-3.5 h-3.5" />
      },
      pending_director: {
        text: 'Menunggu Persetujuan Direktur',
        classes: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: <Clock className="w-3.5 h-3.5" />
      },
      approved: {
        text: 'Disetujui',
        classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
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

  // Filter & Pagination Calculations
  const filteredReimbursements = reimbursements.filter((item) => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'pending') {
      return item.status === 'pending' || item.status === 'pending_director'
    }
    return item.status === statusFilter
  })

  const itemsPerPage = 5
  const totalItems = filteredReimbursements.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedItems = filteredReimbursements.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="space-y-6">
      
      {/* Header card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-orange-100/80 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-quicksand">
            Klaim Dana (Reimbursement)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ajukan klaim pengeluaran dinas pribadi untuk diganti oleh kantor dan pantau statusnya.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer shadow-md w-full sm:w-auto justify-center ${
            showForm 
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200' 
              : 'bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white shadow-red-500/10'
          }`}
        >
          {showForm ? (
            'Tutup Formulir'
          ) : (
            <>
              <Plus className="w-4 h-4" /> Ajukan Reimbursement
            </>
          )}
        </button>
      </div>

      {/* Form Submission */}
      {showForm && (
        <section className="bg-white border border-orange-100/80 rounded-3xl p-6 shadow-sm animate-fade-in">
          <div className="border-b border-orange-100 pb-3 mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 font-quicksand">
              <DollarSign className="w-5 h-5 text-red-500" /> Formulir Klaim Baru
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column Fields */}
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-quicksand">
                    1. Judul / Keperluan Klaim
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pembelian tinta printer, BBM dinas"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-medium font-quicksand"
                    required
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-quicksand">
                    2. Kategori Klaim
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-medium font-quicksand"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Amount and Expense Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-quicksand">
                      3. Jumlah Klaim (Rp)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                      <input
                        type="text"
                        placeholder="Contoh: 150000"
                        value={amount}
                        onChange={(e) => formatRupiahInput(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2.5 pl-9 pr-4 outline-none transition-all text-xs font-bold font-mono"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-quicksand">
                      4. Tanggal Pengeluaran
                    </label>
                    <input
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-medium font-quicksand"
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-quicksand">
                    5. Deskripsi Detail (Opsional)
                  </label>
                  <textarea
                    placeholder="Tulis rincian pengeluaran secara detail..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-medium font-quicksand resize-none"
                  />
                </div>
              </div>

              {/* Right Column: File uploader */}
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-quicksand">
                  6. Unggah Bukti Nota / Kwitansi
                </label>
                
                <div className="relative aspect-video w-full rounded-2xl bg-slate-50 border-2 border-dashed border-orange-200 flex flex-col items-center justify-center p-6 text-center hover:bg-orange-50/20 transition-all duration-300 group">
                  {receiptPreview ? (
                    <div className="absolute inset-0 w-full h-full p-2">
                      <div className="relative w-full h-full rounded-xl overflow-hidden shadow-sm">
                        <img src={receiptPreview} alt="Nota Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="absolute top-2 right-2 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all shadow cursor-pointer text-xs font-bold font-quicksand"
                        >
                          Hapus Foto
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 bg-orange-50 rounded-2xl text-orange-700 border border-orange-100 mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 font-quicksand">Klik untuk upload foto nota</span>
                      <span className="text-[10px] text-slate-400 mt-1">JPEG, PNG, JPG, WEBP (Max. 5MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        required
                      />
                    </>
                  )}
                </div>

                {receiptFile && (
                  <div className="p-3 bg-emerald-50/40 border border-emerald-150 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
                    <FileImage className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{receiptFile.name}</span>
                    <span className="text-[10px] text-emerald-600 font-bold ml-auto">({(receiptFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-4 border-t border-orange-100">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto justify-center px-6 py-3 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-extrabold rounded-2xl transition-all shadow-md shadow-red-500/10 cursor-pointer text-xs flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed font-quicksand"
              >
                {submitting ? 'Mengirim...' : 'Kirim Klaim Reimbursement'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* History Log */}
      <section className="bg-white border border-orange-100/80 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-orange-100 pb-3 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 font-quicksand">
              <CalendarDays className="w-5 h-5 text-red-500" /> Riwayat Klaim Reimburse Anda
            </h3>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 font-quicksand">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-1.5 px-3 outline-none transition-all text-xs font-semibold font-quicksand shadow-sm"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-600"></div>
          </div>
        ) : filteredReimbursements.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium font-quicksand">
            <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p>Tidak ditemukan riwayat pengajuan reimbursement.</p>
          </div>
        ) : (
          <>
            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto border border-orange-100 rounded-2xl bg-orange-50/5">
              <table className="w-full text-left border-collapse font-quicksand">
                <thead>
                  <tr className="border-b border-orange-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pt-3 pl-4">Klaim / Deskripsi</th>
                    <th className="pb-3 pt-3">Kategori</th>
                    <th className="pb-3 pt-3">Jumlah Uang</th>
                    <th className="pb-3 pt-3">Tanggal Nota</th>
                    <th className="pb-3 pt-3">Nota Bukti</th>
                    <th className="pb-3 pt-3">Status</th>
                    <th className="pb-3 pt-3">Catatan Admin</th>
                    <th className="pb-3 pt-3 text-right pr-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50 text-xs font-semibold text-slate-700">
                  {paginatedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-orange-50/10 transition-colors">
                      {/* Title & Desc */}
                      <td className="py-4 pl-4">
                        <span className="block font-bold text-slate-800">{item.title}</span>
                        <span className="text-[10px] text-slate-400 font-medium max-w-[200px] truncate block">
                          {item.description || '-'}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold border text-slate-700 bg-slate-100 border-slate-200">
                          {item.category}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-4 font-bold text-slate-800 font-mono">
                        {displayRupiah(item.amount)}
                      </td>

                      {/* Expense Date */}
                      <td className="py-4 text-slate-500">
                        {formatDate(item.expense_date)}
                      </td>

                      {/* Receipt path */}
                      <td className="py-4">
                        <button
                          onClick={() => handleShowReceipt(item.receipt_path)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-700 hover:underline bg-transparent border-none cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Lihat Nota
                        </button>
                      </td>

                      {/* Status badge */}
                      <td className="py-4">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Admin Notes */}
                      <td className="py-4 max-w-[150px] truncate" title={item.admin_notes || ''}>
                        {item.admin_notes ? (
                          <span className="text-slate-600 font-medium italic">"{item.admin_notes}"</span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic font-medium">-</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-4 text-right pr-4">
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

            {/* Mobile View: Cards */}
            <div className="space-y-4 md:hidden">
              {paginatedItems.map((item) => (
                <div key={item.id} className="bg-orange-50/5 border border-orange-100/80 rounded-2xl p-4 space-y-3 shadow-sm hover:border-orange-200 transition-colors">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="block font-bold text-slate-800 text-sm">{item.title}</span>
                      <span className="text-[10px] text-slate-400 font-medium mt-0.5 block line-clamp-2">
                        {item.description || 'Tidak ada deskripsi'}
                      </span>
                    </div>
                    <div className="shrink-0">
                      {getStatusBadge(item.status)}
                    </div>
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
                        onClick={() => handleShowReceipt(item.receipt_path)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-orange-100"
                      >
                        <Eye className="w-3.5 h-3.5" /> Nota
                      </button>
                      {item.status === 'pending' && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl transition-all cursor-pointer"
                          title="Batalkan Pengajuan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {item.admin_notes && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-[10px] text-slate-500 font-medium italic">
                      <strong>Catatan Admin:</strong> "{item.admin_notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-orange-100 font-quicksand mt-4">
                <span className="text-xs text-slate-500 font-semibold text-center sm:text-left">
                  Menampilkan <span className="font-bold text-slate-750">{startIndex + 1}</span> sampai{' '}
                  <span className="font-bold text-slate-750">{Math.min(startIndex + itemsPerPage, totalItems)}</span> dari{' '}
                  <span className="font-bold text-slate-750">{totalItems}</span> entri klaim
                </span>
                <div className="flex flex-wrap items-center justify-center gap-1">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:border-orange-500 hover:text-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer bg-white"
                  >
                    Sebelumnya
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        currentPage === page
                          ? 'bg-orange-500 border border-orange-500 text-white shadow-sm font-extrabold'
                          : 'border border-slate-200 text-slate-600 hover:border-orange-500 hover:text-orange-700 bg-white'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
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
