import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { getAssetUrl, API_BASE_URL } from '../../../utils/api'
import { 
  Upload, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Plus, 
  FileImage,
  CalendarDays,
  UserCheck
} from 'lucide-react'

interface PermitRequest {
  id: number
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
}

interface EmployeeIzinProps {
  token: string
}

export default function EmployeeIzin({ token }: EmployeeIzinProps) {
  const baseUrl = API_BASE_URL || 'http://localhost:8000'
  const [permits, setPermits] = useState<PermitRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [adminWhatsapp, setAdminWhatsapp] = useState<string | null>(null)

  // Form states
  const [category, setCategory] = useState('Izin Sakit Tanpa Surat Dokter')
  const [customCategory, setCustomCategory] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Filter & Pagination States
  const [monthFilter, setMonthFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [monthFilter])

  const categories = [
    'Izin Sakit Tanpa Surat Dokter',
    'Izin Keperluan Keluarga Darurat',
    'Izin Urusan Hukum / Pemerintahan',
    'Izin Keagamaan',
    'LAINNYA'
  ]

  const fetchPermits = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${baseUrl}/api/permits`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setPermits(response.data.data)
      }
    } catch (err: any) {
      console.error('Gagal mengambil data izin:', err)
      Swal.fire({
        title: 'Error',
        text: 'Gagal memuat riwayat pengajuan izin.',
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

  // Fetch admin WhatsApp contact from database
  useEffect(() => {
    const fetchAdminWhatsapp = async () => {
      try {
        const res = await axios.get(`${baseUrl}/api/admin-contact`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.data.status === 'success' && res.data.data?.whatsapp) {
          setAdminWhatsapp(res.data.data.whatsapp)
        }
      } catch (err) {
        console.error('Gagal fetch nomor WA admin:', err)
      }
    }
    fetchAdminWhatsapp()
  }, [token])

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

  const handleSubmit = async (e: React.FormEvent) => {
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

    // Check end date is after start date
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
    
    // Create FormData for file upload
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
          text: `${response.data.message || 'Pengajuan izin berhasil dikirim.'} Ingin mengirim notifikasi WhatsApp ke Admin?`,
          icon: 'success',
          confirmButtonText: 'Ya, Kirim WhatsApp',
          confirmButtonColor: '#ea580c',
          background: '#fffdfb',
          color: '#3c1105'
        }).then((result) => {
          if (result.isConfirmed) {
            const savedUser = sessionStorage.getItem('auth_user')
            const userObj = savedUser ? JSON.parse(savedUser) : null
            const employeeName = userObj ? userObj.name : 'Karyawan'
            const categoryName = category === 'LAINNYA' ? customCategory : category
            const formattedStartDate = formatDate(startDate)
            const formattedEndDate = formatDate(endDate)
            const message = `Halo admin / HR, Saya ${employeeName} mengajukan izin ${categoryName} pada tanggal ${formattedStartDate} s/d ${formattedEndDate}.\n\nLink: ${window.location.origin}/admin/izin`
            const waUrl = adminWhatsapp
              ? `https://api.whatsapp.com/send?phone=${adminWhatsapp.replace(/\D/g, '').replace(/^0/, '62')}&text=${encodeURIComponent(message)}`
              : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`
            window.open(waUrl, '_blank')
          }
        })

        // Reset form
        setCategory('Izin Sakit Tanpa Surat Dokter')
        setCustomCategory('')
        setStartDate('')
        setEndDate('')
        setReason('')
        setImageFile(null)
        setImagePreview(null)
        setShowForm(false)

        fetchPermits()
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal mengirimkan pengajuan izin.'
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
      text: 'Apakah Anda yakin ingin membatalkan pengajuan izin ini?',
      icon: 'warning',
      confirmButtonColor: '#ea580c',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Batalkan!',
      cancelButtonText: 'Kembali',
      background: '#fffdfb',
      color: '#3c1105'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(`${baseUrl}/api/permits/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (response.data.status === 'success') {
            Swal.fire({
              title: 'Dibatalkan!',
              text: 'Pengajuan izin berhasil dibatalkan.',
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
          const msg = err.response?.data?.message || 'Gagal membatalkan pengajuan izin.'
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
  const filteredPermits = permits.filter((permit) => {
    if (!monthFilter) return true
    return (
      permit.start_date.startsWith(monthFilter) ||
      permit.end_date.startsWith(monthFilter) ||
      permit.created_at.startsWith(monthFilter)
    )
  })

  const itemsPerPage = 5
  const totalItems = filteredPermits.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedPermits = filteredPermits.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="space-y-6">
      
      {/* Header and Toggle Button */}
      <div className="flex justify-between items-center bg-white p-6 border border-orange-100/80 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-quicksand">
            Pengajuan Izin Karyawan
          </h2>
          <p className="text-xs text-slate-500 mt-1">Ajukan izin kerja dan pantau status persetujuan dari Admin & Direktur di sini.</p>
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
              <Plus className="w-4 h-4" /> Buat Pengajuan Izin
            </>
          )}
        </button>
      </div>

      {/* Leave Request Form */}
      {showForm && (
        <section className="bg-white border border-orange-100/80 rounded-3xl p-6 shadow-sm animate-fade-in">
          <div className="border-b border-orange-100 pb-3 mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 font-quicksand">
              <CalendarDays className="w-5 h-5 text-red-500" /> Form Pengajuan Izin Baru
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column Fields */}
              <div className="space-y-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-quicksand">
                    1. Kategori Izin
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

                {/* Custom Category Input if LAINNYA selected */}
                {category === 'LAINNYA' && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-quicksand">
                      Tuliskan Jenis Izin
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Izin Urusan Keluarga, Izin Musibah, dll."
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-medium font-quicksand"
                    />
                  </div>
                )}

                {/* Date Ranges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-quicksand">
                      2. Tanggal Mulai
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-medium font-quicksand"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-quicksand">
                      3. Tanggal Selesai
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-medium font-quicksand"
                    />
                  </div>
                </div>

                {/* Reason Textarea */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-quicksand">
                    4. Alasan / Keterangan Izin
                  </label>
                  <textarea
                    placeholder="Tuliskan keterangan detail alasan Anda mengajukan izin kerja..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-medium font-quicksand resize-none"
                  />
                </div>
              </div>

              {/* Right Column Fields: Image Upload */}
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-quicksand">
                  5. Dokumen Bukti Pendukung (Opsional)
                </label>
                
                <div className="relative aspect-video w-full rounded-2xl bg-slate-50 border-2 border-dashed border-orange-200 flex flex-col items-center justify-center p-6 text-center hover:bg-orange-50/20 transition-all duration-300 group">
                  {imagePreview ? (
                    <div className="absolute inset-0 w-full h-full p-2">
                      <div className="relative w-full h-full rounded-xl overflow-hidden shadow-sm">
                        <img src={imagePreview} alt="Bukti Izin Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all shadow cursor-pointer text-xs font-bold"
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
                      <span className="text-xs font-bold text-slate-700 font-quicksand">Klik untuk upload foto/bukti</span>
                      <span className="text-[10px] text-slate-400 mt-1">JPEG, PNG, JPG, WEBP (Max. 5MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </>
                  )}
                </div>

                {imageFile && (
                  <div className="p-3 bg-emerald-50/40 border border-emerald-150 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
                    <FileImage className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{imageFile.name}</span>
                    <span className="text-[10px] text-emerald-600 font-bold ml-auto">({(imageFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-orange-100">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-extrabold rounded-2xl transition-all shadow-md shadow-red-500/10 cursor-pointer text-xs flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed font-quicksand"
              >
                {submitting ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan Izin'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* History Log Section */}
      <section className="bg-white border border-orange-100/80 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-orange-100 pb-3 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 font-quicksand">
              <UserCheck className="w-5 h-5 text-red-500" /> Riwayat Pengajuan Izin Anda
            </h3>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 font-quicksand">
              <CalendarDays className="w-4 h-4 text-slate-400" /> Filter Bulan:
            </div>
            <div className="flex items-center gap-2 font-quicksand">
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-1.5 px-3 outline-none transition-all text-xs font-semibold font-quicksand shadow-sm"
              />
              {monthFilter && (
                <button
                  type="button"
                  onClick={() => setMonthFilter('')}
                  className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-500 hover:text-red-500 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all cursor-pointer font-quicksand shadow-sm"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-600"></div>
          </div>
        ) : filteredPermits.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium font-quicksand">
            <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p>{monthFilter ? 'Tidak ditemukan pengajuan izin pada bulan ini.' : 'Anda belum pernah mengajukan izin.'}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-quicksand">
                <thead>
                  <tr className="border-b border-orange-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Kategori</th>
                    <th className="pb-3">Dibuat</th>
                    <th className="pb-3">Diterima</th>
                    <th className="pb-3">Durasi</th>
                    <th className="pb-3">Keterangan / Alasan</th>
                    <th className="pb-3">Bukti</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Catatan Admin/Direktur</th>
                    <th className="pb-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50 text-xs font-semibold text-slate-700">
                  {paginatedPermits.map((permit) => {
                    const days = calculateDays(permit.start_date, permit.end_date)
                    return (
                      <tr key={permit.id} className="hover:bg-orange-50/10 transition-colors">
                        {/* Category */}
                        <td className="py-4">
                          <span className="block font-bold text-slate-800">
                            {permit.category === 'LAINNYA' ? permit.custom_category : permit.category}
                          </span>
                        </td>

                        {/* Dibuat */}
                        <td className="py-4 text-slate-750">
                          {formatDateTime(permit.created_at)}
                        </td>

                        {/* Diterima */}
                        <td className="py-4 text-slate-750">
                          {permit.status === 'approved' || permit.status === 'rejected'
                            ? formatDateTime(permit.updated_at)
                            : '-'}
                        </td>

                        {/* Dates / Duration */}
                        <td className="py-4">
                          <span className="block text-slate-750 font-bold">{days} Hari</span>
                          <span className="text-[10px] text-slate-400 font-medium block">
                            {formatDate(permit.start_date)} - {formatDate(permit.end_date)}
                          </span>
                        </td>

                        {/* Reason */}
                        <td className="py-4 max-w-xs truncate" title={permit.reason}>
                          {permit.reason}
                        </td>

                        {/* Image/Proof */}
                        <td className="py-4">
                          {permit.image ? (
                            <a 
                              href={getAssetUrl(permit.image)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-700 hover:underline"
                            >
                              <FileText className="w-3.5 h-3.5" /> Lihat Bukti
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic font-medium">-</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4">
                          {getStatusBadge(permit.status)}
                        </td>

                        {/* Admin Notes */}
                        <td className="py-4 max-w-[200px] truncate" title={permit.admin_notes || ''}>
                          {permit.admin_notes ? (
                            <span className="text-slate-600 font-medium italic">"{permit.admin_notes}"</span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic font-medium">-</span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-4 text-right">
                          {permit.status === 'pending' ? (
                            <button
                              onClick={() => handleDelete(permit.id)}
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
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-orange-100 font-quicksand mt-4">
                <span className="text-xs text-slate-500 font-semibold">
                  Menampilkan <span className="font-bold text-slate-750">{startIndex + 1}</span> sampai{' '}
                  <span className="font-bold text-slate-750">{Math.min(startIndex + itemsPerPage, totalItems)}</span> dari{' '}
                  <span className="font-bold text-slate-750">{totalItems}</span> entri izin
                </span>
                <div className="flex items-center gap-1">
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
