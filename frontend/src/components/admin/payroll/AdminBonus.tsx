import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { 
  Plus, 
  Search, 
  Coins, 
  Trash2, 
  Edit, 
  X, 
  Save, 
  Calendar, 
  Users, 
  TrendingUp, 
  Gift,
  AlertCircle
} from 'lucide-react'

interface UserDetails {
  id: number
  name: string
  email: string
  company?: string | null
}

interface Bonus {
  id: number
  user_id: number
  bonus_amount: number
  bonus_date: string
  description: string | null
  created_at: string
  updated_at: string
  user: UserDetails
  status: 'pending' | 'approved' | 'rejected'
}

interface Employee {
  id: number
  name: string
  email: string
  company?: string | null
}

interface AdminBonusProps {
  token: string
}

const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function AdminBonus({ token }: AdminBonusProps) {
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserFilter, setSelectedUserFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  // Form state for creating a bonus
  const [userId, setUserId] = useState('')
  const [bonusAmount, setBonusAmount] = useState('')
  const [bonusDate, setBonusDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingBonus, setEditingBonus] = useState<Bonus | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [updating, setUpdating] = useState(false)

  // Fetch all bonuses
  const fetchBonuses = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/admin/bonuses', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setBonuses(response.data.data)
      }
    } catch (err: any) {
      console.error('Gagal mengambil data bonus:', err)
      Swal.fire({
        title: 'Error',
        text: 'Gagal memuat daftar bonus karyawan.',
        icon: 'error',
        background: '#fffdfb',
        color: '#3c1105'
      })
    }
  }

  // Fetch all employees for dropdown
  const fetchEmployees = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/employees', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setEmployees(response.data.data)
      }
    } catch (err: any) {
      console.error('Gagal mengambil data karyawan:', err)
    }
  }

  const loadData = async () => {
    setLoading(true)
    await Promise.all([fetchBonuses(), fetchEmployees()])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Create new bonus
  const handleAddBonus = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsedAmount = parseFloat(bonusAmount.replace(/[^0-9]/g, ''))
    if (!userId || !bonusAmount || !bonusDate || isNaN(parsedAmount) || parsedAmount <= 0) {
      Swal.fire({
        title: 'Form Belum Lengkap',
        text: 'Silakan isi semua kolom input yang diperlukan dengan benar.',
        icon: 'warning',
        background: '#fffdfb',
        color: '#3c1105'
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await axios.post(
        'http://localhost:8000/api/admin/bonuses',
        {
          user_id: parseInt(userId),
          bonus_amount: parsedAmount,
          bonus_date: bonusDate,
          description: description
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.status === 'success') {
        Swal.fire({
          title: 'Berhasil!',
          text: response.data.message || 'Bonus berhasil diberikan.',
          icon: 'success',
          background: '#fffdfb',
          color: '#3c1105',
          timer: 2000,
          showConfirmButton: false
        })

        // Reset form
        setUserId('')
        setBonusAmount('')
        setBonusDate(new Date().toISOString().split('T')[0])
        setDescription('')

        // Refresh bonuses
        fetchBonuses()
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal menyimpan data bonus.'
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

  // Open Edit Modal
  const handleOpenEditModal = (bonus: Bonus) => {
    setEditingBonus(bonus)
    setEditAmount(formatInputRupiah(bonus.bonus_amount.toString()))
    setEditDate(bonus.bonus_date)
    setEditDescription(bonus.description || '')
    setShowEditModal(true)
  }

  // Update bonus
  const handleEditBonusSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBonus) return

    const parsedEditAmount = parseFloat(editAmount.replace(/[^0-9]/g, ''))
    if (!editAmount || !editDate || isNaN(parsedEditAmount) || parsedEditAmount <= 0) {
      Swal.fire({
        title: 'Form Belum Lengkap',
        text: 'Jumlah bonus dan tanggal wajib diisi dengan benar.',
        icon: 'warning',
        background: '#fffdfb',
        color: '#3c1105'
      })
      return
    }

    setUpdating(true)
    try {
      const response = await axios.put(
        `http://localhost:8000/api/admin/bonuses/${editingBonus.id}`,
        {
          bonus_amount: parsedEditAmount,
          bonus_date: editDate,
          description: editDescription
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.status === 'success') {
        Swal.fire({
          title: 'Berhasil!',
          text: 'Data bonus berhasil diperbarui.',
          icon: 'success',
          background: '#fffdfb',
          color: '#3c1105',
          timer: 1500,
          showConfirmButton: false
        })
        setShowEditModal(false)
        fetchBonuses()
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal memperbarui bonus.'
      Swal.fire({
        title: 'Gagal',
        text: msg,
        icon: 'error',
        background: '#fffdfb',
        color: '#3c1105'
      })
    } finally {
      setUpdating(false)
    }
  }

  // Delete bonus
  const handleDeleteBonus = (id: number, employeeName: string, amount: number) => {
    Swal.fire({
      title: 'Hapus Bonus?',
      text: `Apakah Anda yakin ingin menghapus data bonus sebesar Rp ${amount.toLocaleString('id-ID')} untuk ${employeeName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      background: '#fffdfb',
      color: '#3c1105'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(`http://localhost:8000/api/admin/bonuses/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })

          if (response.data.status === 'success') {
            Swal.fire({
              title: 'Dihapus!',
              text: 'Data bonus berhasil dihapus.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
              background: '#fffdfb',
              color: '#3c1105'
            })
            fetchBonuses()
          }
        } catch (err: any) {
          console.error(err)
          Swal.fire({
            title: 'Gagal',
            text: 'Gagal menghapus data bonus.',
            icon: 'error',
            background: '#fffdfb',
            color: '#3c1105'
          })
        }
      }
    })
  }

  const handleWhatsAppShare = (item: Bonus) => {
    const company = item.user.company;
    const isYpi = company === 'PT Yasodana Parvez Internasional';
    const directorName = isYpi ? 'Pak Andre' : 'Bu Dian';
    const phone = isYpi ? '6289656931184' : '628170038421';

    Swal.fire({
      title: 'Kirim WhatsApp ke Direktur',
      text: `Kirim rincian bonus untuk ${item.user.name} ke ${directorName}?`,
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
        const message = `Halo ${directorName}, mohon verifikasi pengajuan bonus berikut:

Nama Karyawan: ${item.user.name}
Jumlah Bonus: ${displayRupiah(item.bonus_amount)}
Tanggal: ${formatDate(item.bonus_date)}
Keterangan: ${item.description || '-'}
Status: ${item.status === 'approved' ? 'Disetujui' : item.status === 'rejected' ? 'Ditolak' : 'Menunggu Direktur'}

Terima kasih.`;

        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      }
    });
  }

  // Calculation for KPI cards
  const approvedBonuses = bonuses.filter(b => b.status === 'approved')
  const pendingBonuses = bonuses.filter(b => b.status === 'pending')
  const totalBonusAwarded = approvedBonuses.reduce((acc, curr) => acc + curr.bonus_amount, 0)
  const uniqueRecipients = new Set(approvedBonuses.map((b) => b.user_id)).size
  
  const pendingCount = pendingBonuses.length
  const totalPendingAmount = pendingBonuses.reduce((acc, curr) => acc + curr.bonus_amount, 0)

  // Filtered bonuses
  const filteredBonuses = bonuses.filter((item) => {
    const matchesSearch = 
      item.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesUser = selectedUserFilter === 'all' || item.user_id.toString() === selectedUserFilter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter

    return matchesSearch && matchesUser && matchesStatus
  })

  const displayRupiah = (number: number) => {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(number)
  }

  const formatInputRupiah = (value: string) => {
    const numberString = value.replace(/[^0-9]/g, '')
    if (!numberString) return ''
    return new Intl.NumberFormat('id-ID').format(parseInt(numberString))
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

  return (
    <div className="space-y-6 font-quicksand">
      
      {/* Header Panel */}
      <div>
        <h3 className="text-lg font-bold text-slate-800">Pemberian Bonus Karyawan</h3>
        <p className="text-xs text-slate-500 font-medium">Kelola penghargaan, insentif, dan bonus tunai bagi para staf karyawan.</p>
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        {/* Total Bonus Awarded */}
        <div className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-quicksand">Total Bonus Disetujui</span>
            <span className="text-xl font-black text-amber-600 mt-1 block font-mono">{displayRupiah(totalBonusAwarded)}</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 border border-amber-100">
            <Coins className="w-6 h-6 animate-bounce" />
          </div>
        </div>

        {/* Total Employees Rewarded */}
        <div className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-quicksand">Karyawan Penerima</span>
            <span className="text-3xl font-black text-slate-800 mt-1 block font-mono">{uniqueRecipients} <span className="text-xs font-semibold text-slate-400">orang</span></span>
          </div>
          <div className="p-3 bg-red-50 rounded-2xl text-red-500 border border-red-100">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Menunggu Direktur Count */}
        <div className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-quicksand">Menunggu Direktur</span>
            <span className="text-3xl font-black text-amber-500 mt-1 block font-mono">{pendingCount} <span className="text-xs font-semibold text-slate-400">pengajuan</span></span>
          </div>
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-500 border border-amber-100">
            <Gift className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Nominal Menunggu */}
        <div className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-quicksand">Nominal Menunggu</span>
            <span className="text-xl font-black text-slate-600 mt-1 block font-mono">{displayRupiah(totalPendingAmount)}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl text-slate-500 border border-slate-100">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </section>

      {/* Main Grid: Form Left, Table Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Form Input Bonus */}
        <section className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-orange-100 pb-3">
            <div className="p-1.5 bg-red-50 rounded-xl text-red-500">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Input Bonus Baru</h4>
              <p className="text-[10px] text-slate-400 font-medium">Tambahkan insentif kerja</p>
            </div>
          </div>

          <form onSubmit={handleAddBonus} className="space-y-4 text-xs font-semibold text-slate-700">
            {/* Karyawan Select */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilih Penerima *</label>
              <select
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none transition-all shadow-sm"
              >
                <option value="">-- Pilih Karyawan --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Jumlah Uang */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jumlah Bonus (IDR) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                <input
                  required
                  type="text"
                  placeholder="Contoh: 500.000"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(formatInputRupiah(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2 pl-9 pr-3 outline-none transition-all shadow-sm font-semibold"
                />
              </div>
            </div>

            {/* Tanggal */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Diberikan *</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  type="date"
                  value={bonusDate}
                  onChange={(e) => setBonusDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2 pl-9 pr-3 outline-none transition-all shadow-sm font-semibold"
                />
              </div>
            </div>

            {/* Keterangan */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Keterangan / Alasan</label>
              <textarea
                placeholder="Tuliskan keterangan (misal: Insentif performa proyek Q2)"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none transition-all shadow-sm resize-none font-semibold"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-extrabold rounded-xl transition-all shadow-md shadow-red-500/10 cursor-pointer text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Memproses...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Kirim Bonus
                </>
              )}
            </button>
          </form>
        </section>

        {/* Table List & Filters */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters Bar */}
          <section className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Search */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cari Bonus</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama karyawan atau keterangan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 focus:border-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2 pl-9 pr-3 outline-none transition-all text-xs font-semibold shadow-sm"
                  />
                </div>
              </div>

              {/* User Filter */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter Karyawan</label>
                <select
                  value={selectedUserFilter}
                  onChange={(e) => setSelectedUserFilter(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none transition-all text-xs font-semibold shadow-sm"
                >
                  <option value="all">Semua Karyawan</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none transition-all text-xs font-semibold shadow-sm"
                >
                  <option value="all">Semua Status</option>
                  <option value="pending">Menunggu Direktur</option>
                  <option value="approved">Disetujui</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </div>
            </div>
          </section>

          {/* Table list */}
          <section className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-600"></div>
              </div>
            ) : filteredBonuses.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium">
                <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                <p>Tidak ditemukan data bonus yang sesuai.</p>
              </div>
            ) : (
              <div className="border border-orange-100 rounded-2xl overflow-hidden bg-orange-50/5">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-orange-50/20 text-slate-600 text-[10px] font-extrabold uppercase tracking-wider border-b border-orange-100">
                        <th className="py-3.5 px-4">Karyawan</th>
                        <th className="py-3.5 px-4">Jumlah Bonus</th>
                        <th className="py-3.5 px-4">Tanggal</th>
                        <th className="py-3.5 px-4">Dibuat</th>
                        <th className="py-3.5 px-4">Diterima</th>
                        <th className="py-3.5 px-4">Keterangan</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-100 text-xs font-semibold text-slate-700">
                      {filteredBonuses.map((item) => (
                        <tr key={item.id} className="hover:bg-orange-50/10 transition-colors">
                          {/* User info */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-50 to-orange-100 border border-orange-200/50 flex items-center justify-center text-amber-600 font-bold text-[11px]">
                                {item.user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="block font-bold text-slate-800">{item.user.name}</span>
                                <span className="text-[9px] text-slate-400 font-medium">{item.user.email}</span>
                              </div>
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="py-3 px-4 font-bold text-emerald-600 font-mono">
                            {displayRupiah(item.bonus_amount)}
                          </td>

                          {/* Date */}
                          <td className="py-3 px-4 text-slate-500 font-medium">
                            <span className="block text-slate-800 font-bold">{formatDate(item.bonus_date)}</span>
                          </td>

                          {/* Dibuat */}
                          <td className="py-3 px-4 text-slate-700">
                            {formatDateTime(item.created_at)}
                          </td>

                          {/* Diterima */}
                          <td className="py-3 px-4 text-slate-700">
                            {item.status === 'approved' || item.status === 'rejected'
                              ? formatDateTime(item.updated_at)
                              : '-'}
                          </td>

                          {/* Description */}
                          <td className="py-3 px-4 text-slate-600 font-medium max-w-[150px] truncate" title={item.description || ''}>
                            {item.description || <span className="text-[10px] text-slate-400 italic">-</span>}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            {item.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-600 border border-amber-100">
                                Menunggu Direktur
                              </span>
                            )}
                            {item.status === 'approved' && (
                              <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                Disetujui
                              </span>
                            )}
                            {item.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-600 border border-rose-100">
                                Ditolak
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                             <div className="flex justify-end gap-1.5 items-center">
                               <button
                                 onClick={() => handleOpenEditModal(item)}
                                 className="p-1.5 bg-orange-50 hover:bg-orange-150 border border-orange-200 text-orange-700 rounded-lg transition-all cursor-pointer shadow-sm"
                                 title="Edit"
                               >
                                 <Edit className="w-3.5 h-3.5" />
                               </button>
                               <button
                                 onClick={() => handleDeleteBonus(item.id, item.user.name, item.bonus_amount)}
                                 className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 hover:text-rose-700 rounded-lg transition-all cursor-pointer shadow-sm"
                                 title="Hapus"
                               >
                                 <Trash2 className="w-3.5 h-3.5" />
                               </button>
                               <button
                                 onClick={() => handleWhatsAppShare(item)}
                                 className="p-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-600 hover:text-green-700 rounded-lg transition-all cursor-pointer shadow-sm flex items-center justify-center"
                                 title="Kirim WhatsApp ke Direktur"
                               >
                                 <WhatsAppIcon className="w-3.5 h-3.5" />
                               </button>
                             </div>
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>

      </div>

      {/* Edit Bonus Modal */}
      {showEditModal && editingBonus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in">
            <div className="h-1.5 bg-gradient-to-r from-red-500 to-orange-600" />
            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Edit Data Bonus</h3>
                  <p className="text-[10px] text-slate-400">Memperbarui bonus untuk {editingBonus.user.name}</p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditBonusSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
                {/* Nominal */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jumlah Bonus (IDR) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                    <input
                      required
                      type="text"
                      placeholder="Contoh: 500.000"
                      value={editAmount}
                      onChange={(e) => setEditAmount(formatInputRupiah(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2 pl-9 pr-3 outline-none transition-all shadow-sm font-semibold"
                    />
                  </div>
                </div>

                {/* Tanggal */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Diberikan *</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2 pl-9 pr-3 outline-none transition-all shadow-sm font-semibold"
                    />
                  </div>
                </div>

                {/* Keterangan */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Keterangan / Alasan</label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none transition-all shadow-sm resize-none font-semibold"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {updating ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Simpan Perubahan
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    Batal
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}
