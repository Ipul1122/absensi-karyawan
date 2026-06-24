import { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  UserCheck, 
  Wallet, 
  Coins, 
  FileCheck, 
  ArrowUpRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  UserPlus,
  UserMinus,
  CalendarDays,
  Clock,
  Receipt,
  Gift,
  Package,
  Search,
  Calendar,
  DollarSign,
  User,
  Shield,
  Info,
  BookUser,
  X,
  MapPin,
  Briefcase,
  FileText,
  Building2,
  Check,
  ExternalLink,
  Phone
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'
import { getAssetUrl } from '../../../utils/api'

interface DirekturOverviewProps {
  token: string
}

interface Stats {
  pendingRegister: number
  pendingDelete: number
  pendingSalary: number
  pendingPayroll: number
  pendingOperational: number
}

interface UnifiedPendingItem {
  id: number
  type: 'employee_new' | 'employee_delete' | 'salary_config' | 'payroll' | 'leave' | 'overtime' | 'reimbursement' | 'bonus' | 'inventory'
  title: string
  subtitle: string
  requesterName: string
  requesterEmail?: string
  date: string
  amount?: number
  badgeText: string
  details: string
  originalData: any
}

export default function DirekturOverview({ token }: DirekturOverviewProps) {
  // Counters State
  const [stats, setStats] = useState<Stats>({
    pendingRegister: 0, pendingDelete: 0, pendingSalary: 0,
    pendingPayroll: 0, pendingOperational: 0
  })

  // Full Data State for Inbox and Widgets
  const [unifiedPendingItems, setUnifiedPendingItems] = useState<UnifiedPendingItem[]>([])
  const [totalEmployees, setTotalEmployees] = useState<number>(0)
  const [totalProposedPayroll, setTotalProposedPayroll] = useState<number>(0)
  const [activeLeavesToday, setActiveLeavesToday] = useState<any[]>([])
  const [totalOverallTasksCount, setTotalOverallTasksCount] = useState<number>(0)

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  
  // Inbox UI State
  const [inboxTab, setInboxTab] = useState<'all' | 'employee' | 'salary_payroll' | 'operational' | 'inventory'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Detail Profile Modal State
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<UnifiedPendingItem | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const res = await axios.get('http://localhost:8000/api/director/dashboard-summary', { headers })
      
      if (res.data.status === 'success') {
        const {
          totalEmployees: resTotalEmployees,
          totalProposedPayroll: resTotalProposedPayroll,
          activeLeavesToday: resActiveLeavesToday,
          totalOverallTasksCount: resTotalOverallTasksCount,
          stats: responseStats,
          unifiedPendingItems: responsePendingItems
        } = res.data.data

        setTotalEmployees(resTotalEmployees)
        setTotalProposedPayroll(resTotalProposedPayroll)
        setActiveLeavesToday(resActiveLeavesToday)
        setTotalOverallTasksCount(resTotalOverallTasksCount)
        setStats(responseStats)
        setUnifiedPendingItems(responsePendingItems)
      }
    } catch (err) { 
      console.error(err) 
    } finally { 
      setLoading(false) 
    }
  }

  useEffect(() => { 
    fetchStats() 
  }, [])

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(val)
  }

  const formatDateSafe = (dateStr: string | null | undefined, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) => {
    if (!dateStr) return '-'
    const parsed = Date.parse(dateStr)
    if (isNaN(parsed)) return '-'
    return new Date(dateStr).toLocaleDateString('id-ID', options)
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

  const formatWaNumber = (phone: string | null | undefined): string => {
    if (!phone) return ''
    let cleanPhone = phone.trim().replace(/\D/g, '')
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1)
    }
    return cleanPhone
  }

  // Quick action handlers
  const handleQuickApprove = async (item: UnifiedPendingItem) => {
    let url = ''
    let title = 'Setujui Pengajuan?'
    let html = `Apakah Anda yakin ingin menyetujui pengajuan ini?`
    let swalOptions: any = {}

    switch (item.type) {
      case 'employee_new':
        url = `http://localhost:8000/api/director/employees/${item.id}/approve`
        title = 'Setujui Pendaftaran Karyawan?'
        html = `Aktifkan akun karyawan <strong>${item.requesterName}</strong>?`
        break
      case 'employee_delete':
        url = `http://localhost:8000/api/director/employees/${item.id}/approve-delete`
        title = 'Setujui Penghapusan Akun?'
        html = `Akun <strong>${item.requesterName}</strong> akan dihapus permanen.`
        break
      case 'salary_config':
        url = `http://localhost:8000/api/director/payroll/configurations/${item.id}/approve`
        title = 'Setujui Penyesuaian Gaji?'
        html = `Setujui perubahan nominal gaji untuk <strong>${item.requesterName}</strong>?`
        break
      case 'payroll':
        url = `http://localhost:8000/api/director/payroll/${item.id}/approve`
        title = 'Sahkan Payroll Bulanan?'
        html = `Sahkan gaji <strong>${item.requesterName}</strong> sebesar <strong>${formatIDR(item.amount || 0)}</strong>?`
        break
      case 'leave':
        url = `http://localhost:8000/api/director/leaves/${item.id}/approve`
        title = 'Setujui Pengajuan Cuti?'
        html = `Setujui cuti untuk <strong>${item.requesterName}</strong>?`
        break
      case 'overtime':
        url = `http://localhost:8000/api/director/overtimes/${item.id}/approve`
        title = 'Setujui Pengajuan Lembur?'
        html = `Setujui lembur untuk <strong>${item.requesterName}</strong>?`
        break
      case 'reimbursement':
        url = `http://localhost:8000/api/director/reimbursements/${item.id}/approve`
        title = 'Setujui Klaim Biaya?'
        html = `Setujui reimbursement sebesar <strong>${formatIDR(item.amount || 0)}</strong> untuk <strong>${item.requesterName}</strong>?`
        if (item.originalData?.receipt_path) {
          swalOptions.imageUrl = `http://localhost:8000${item.originalData.receipt_path}`
          swalOptions.imageHeight = 200
          swalOptions.imageAlt = 'Bukti Nota Pembelian'
        }
        break
      case 'bonus':
        url = `http://localhost:8000/api/director/bonuses/${item.id}/approve`
        title = 'Setujui Proposal Bonus?'
        html = `Setujui pengajuan bonus <strong>${formatIDR(item.amount || 0)}</strong> untuk <strong>${item.requesterName}</strong>?`
        break
      case 'inventory':
        url = `http://localhost:8000/api/director/inventories/${item.id}/approve`
        title = 'Setujui Inventaris Baru?'
        html = `Setujui pengadaan barang <strong>${item.originalData.nama_barang}</strong> seharga <strong>${formatIDR(item.amount || 0)}</strong>?`
        if (item.originalData?.foto) {
          swalOptions.imageUrl = `http://localhost:8000${item.originalData.foto}`
          swalOptions.imageHeight = 200
          swalOptions.imageAlt = 'Foto Barang Inventaris'
        }
        break
    }

    Swal.fire({
      title,
      html,
      icon: swalOptions.imageUrl ? undefined : 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Setujui',
      cancelButtonText: 'Batal',
      background: '#ffffff',
      color: '#1e293b',
      ...swalOptions
    }).then(async result => {
      if (result.isConfirmed) {
        setActionLoading(true)
        try {
          const res = await axios.put(url, {}, { headers: { Authorization: `Bearer ${token}` } })
          if (res.data.status === 'success') {
            Swal.fire({
              title: 'Berhasil!',
              text: res.data.message || 'Pengajuan disetujui.',
              icon: 'success',
              confirmButtonColor: '#4f46e5'
            })
            fetchStats()
          }
        } catch (err: any) {
          Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan.', 'error')
        } finally {
          setActionLoading(false)
        }
      }
    })
  }

  const handleQuickReject = async (item: UnifiedPendingItem) => {
    let url = ''
    let title = 'Tolak Pengajuan?'
    let html = `Apakah Anda yakin ingin menolak pengajuan ini?`
    let needsNotes = false
    let notesLabel = 'Alasan Penolakan'
    let swalOptions: any = {}

    switch (item.type) {
      case 'employee_new':
        url = `http://localhost:8000/api/director/employees/${item.id}/reject`
        title = 'Tolak Pendaftaran Karyawan?'
        html = `Akun <strong>${item.requesterName}</strong> akan dihapus permanen dari sistem.`
        break
      case 'employee_delete':
        url = `http://localhost:8000/api/director/employees/${item.id}/reject-delete`
        title = 'Tolak Pengajuan Hapus Akun?'
        html = `Batalkan pengajuan hapus dan kembalikan akun <strong>${item.requesterName}</strong> ke status aktif.`
        break
      case 'salary_config':
        url = `http://localhost:8000/api/director/payroll/configurations/${item.id}/reject`
        title = 'Tolak Penyesuaian Gaji?'
        html = `Tolak pengajuan gaji baru untuk Karyawan <strong>${item.requesterName}</strong>.`
        break
      case 'payroll':
        url = `http://localhost:8000/api/director/payroll/${item.id}/reject`
        title = 'Tolak Slip Gaji?'
        html = `Tolak slip gaji <strong>${item.requesterName}</strong> dan kembalikan ke draft admin.`
        break
      case 'leave':
        url = `http://localhost:8000/api/director/leaves/${item.id}/reject`
        title = 'Tolak Cuti Karyawan?'
        needsNotes = true
        notesLabel = 'Alasan Penolakan Cuti'
        break
      case 'overtime':
        url = `http://localhost:8000/api/director/overtimes/${item.id}/reject`
        title = 'Tolak Lembur Karyawan?'
        needsNotes = true
        notesLabel = 'Alasan Penolakan Lembur'
        break
      case 'reimbursement':
        url = `http://localhost:8000/api/director/reimbursements/${item.id}/reject`
        title = 'Tolak Klaim Biaya?'
        needsNotes = true
        notesLabel = 'Alasan Penolakan Reimbursement'
        if (item.originalData?.receipt_path) {
          swalOptions.imageUrl = `http://localhost:8000${item.originalData.receipt_path}`
          swalOptions.imageHeight = 200
          swalOptions.imageAlt = 'Bukti Nota Pembelian'
        }
        break
      case 'bonus':
        url = `http://localhost:8000/api/director/bonuses/${item.id}/reject`
        title = 'Tolak Proposal Bonus?'
        html = `Tolak bonus untuk Karyawan <strong>${item.requesterName}</strong>.`
        break
      case 'inventory':
        url = `http://localhost:8000/api/director/inventories/${item.id}/reject`
        title = 'Tolak Pengadaan Barang?'
        needsNotes = true
        notesLabel = 'Alasan Penolakan Inventaris'
        if (item.originalData?.foto) {
          swalOptions.imageUrl = `http://localhost:8000${item.originalData.foto}`
          swalOptions.imageHeight = 200
          swalOptions.imageAlt = 'Foto Barang Inventaris'
        }
        break
    }

    if (needsNotes) {
      const { value: notes } = await Swal.fire({
        title,
        input: 'textarea',
        inputLabel: notesLabel,
        inputPlaceholder: 'Tuliskan alasan penolakan di sini...',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Tolak',
        cancelButtonText: 'Batal',
        inputValidator: v => { if (!v) return 'Alasan penolakan wajib diisi!' },
        ...swalOptions
      })
      if (notes) {
        setActionLoading(true)
        try {
          const res = await axios.put(url, { admin_notes: notes }, { headers: { Authorization: `Bearer ${token}` } })
          if (res.data.status === 'success') {
            Swal.fire({
              title: 'Ditolak!',
              text: res.data.message || 'Pengajuan ditolak.',
              icon: 'success',
              confirmButtonColor: '#4f46e5'
            })
            fetchStats()
          }
        } catch (err: any) {
          Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan.', 'error')
        } finally {
          setActionLoading(false)
        }
      }
    } else {
      Swal.fire({
        title,
        html,
        icon: swalOptions.imageUrl ? undefined : 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Ya, Tolak',
        cancelButtonText: 'Batal',
        background: '#ffffff',
        color: '#1e293b',
        ...swalOptions
      }).then(async result => {
        if (result.isConfirmed) {
          setActionLoading(true)
          try {
            const res = await axios.put(url, {}, { headers: { Authorization: `Bearer ${token}` } })
            if (res.data.status === 'success') {
              Swal.fire({
                title: 'Ditolak!',
                text: res.data.message || 'Pengajuan ditolak.',
                icon: 'success',
                confirmButtonColor: '#4f46e5'
              })
              fetchStats()
            }
          } catch (err: any) {
            Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan.', 'error')
          } finally {
            setActionLoading(false)
          }
        }
      })
    }
  }

  const handleViewProfileDetail = async (item: UnifiedPendingItem) => {
    setSelectedItem(item)
    setShowDetailModal(true)
    setSelectedProfile(null)

    // For employee new/delete, or items that need employee biodata alongside their request details
    let employeeId = 0
    if (item.type === 'employee_new' || item.type === 'employee_delete') {
      employeeId = item.id
    } else if (item.originalData?.user_id) {
      employeeId = item.originalData.user_id
    } else if (item.originalData?.user?.id) {
      employeeId = item.originalData.user.id
    }

    if (employeeId > 0 && item.type !== 'inventory') {
      setLoadingProfile(true)
      try {
        const headers = { Authorization: `Bearer ${token}` }
        const res = await axios.get(`http://localhost:8000/api/employees/${employeeId}/profile`, { headers })
        if (res.data.status === 'success') {
          setSelectedProfile(res.data.data)
        }
      } catch (err) {
        console.error('Failed to load profile for detail:', err)
      } finally {
        setLoadingProfile(false)
      }
    }
  }

  // Calculate metrics
  const totalPending = Object.values(stats).reduce((a, b) => a + b, 0)
  
  // Total overall task processed ratio mockup based on database size
  const totalCompletedTasksCount = totalOverallTasksCount - totalPending
  const completionPercent = totalOverallTasksCount > 0 ? Math.round((totalCompletedTasksCount / totalOverallTasksCount) * 100) : 100

  // Filter unified items
  const rawInboxItems = unifiedPendingItems
  const filteredInboxItems = rawInboxItems.filter(item => {
    const matchesSearch = 
      item.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.requesterEmail && item.requesterEmail.toLowerCase().includes(searchQuery.toLowerCase()))

    if (!matchesSearch) return false

    if (inboxTab === 'all') return true
    if (inboxTab === 'employee') return item.type === 'employee_new' || item.type === 'employee_delete'
    if (inboxTab === 'salary_payroll') return item.type === 'salary_config' || item.type === 'payroll'
    if (inboxTab === 'operational') return item.type === 'leave' || item.type === 'overtime' || item.type === 'reimbursement' || item.type === 'bonus'
    if (inboxTab === 'inventory') return item.type === 'inventory'
    return true
  })

  // Get counters for tabs
  const tabCounts = {
    all: rawInboxItems.length,
    employee: rawInboxItems.filter(i => i.type === 'employee_new' || i.type === 'employee_delete').length,
    salary_payroll: rawInboxItems.filter(i => i.type === 'salary_config' || i.type === 'payroll').length,
    operational: rawInboxItems.filter(i => i.type === 'leave' || i.type === 'overtime' || i.type === 'reimbursement' || i.type === 'bonus').length,
    inventory: rawInboxItems.filter(i => i.type === 'inventory').length
  }

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Selamat Pagi' : now.getHours() < 18 ? 'Selamat Siang' : 'Selamat Sore'

  const cardDefs = [
    {
      key: 'employee',
      title: 'Persetujuan Karyawan',
      icon: UserCheck,
      to: '/director/karyawan',
      color: '#6366f1', // Indigo
      colorLight: 'rgba(99,102,241,0.06)',
      colorBorder: 'rgba(99,102,241,0.15)',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      desc: `Pendaftar Baru: ${stats.pendingRegister} · Pengajuan Hapus: ${stats.pendingDelete}`,
      pending: stats.pendingRegister + stats.pendingDelete,
    },
    {
      key: 'salary',
      title: 'Penyesuaian Gaji',
      icon: Wallet,
      to: '/director/gaji',
      color: '#06b6d4', // Cyan
      colorLight: 'rgba(6,182,212,0.06)',
      colorBorder: 'rgba(6,182,212,0.15)',
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      desc: `Pengajuan Nominal Baru: ${stats.pendingSalary} berkas`,
      pending: stats.pendingSalary,
    },
    {
      key: 'payroll',
      title: 'Payroll Bulanan',
      icon: Coins,
      to: '/director/payroll',
      color: '#f59e0b', // Amber
      colorLight: 'rgba(245,158,11,0.06)',
      colorBorder: 'rgba(245,158,11,0.15)',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      desc: `Siap Dibayar: ${stats.pendingPayroll} lembar`,
      pending: stats.pendingPayroll,
    },
    {
      key: 'operational',
      title: 'Operasional SDM',
      icon: FileCheck,
      to: '/director/operasional',
      color: '#10b981', // Emerald
      colorLight: 'rgba(16,185,129,0.06)',
      colorBorder: 'rgba(16,185,129,0.15)',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      desc: `Cuti, Lembur, Klaim & Barang: ${stats.pendingOperational} tugas`,
      pending: stats.pendingOperational,
    },
  ]

  const getIconColorClass = (type: string) => {
    switch (type) {
      case 'employee_new': return 'bg-indigo-50 text-indigo-600 border border-indigo-100'
      case 'employee_delete': return 'bg-red-50 text-red-600 border border-red-100'
      case 'salary_config': return 'bg-cyan-50 text-cyan-600 border border-cyan-100'
      case 'payroll': return 'bg-amber-50 text-amber-600 border border-amber-100'
      case 'leave': return 'bg-purple-50 text-purple-600 border border-purple-100'
      case 'overtime': return 'bg-orange-50 text-orange-600 border border-orange-100'
      case 'reimbursement': return 'bg-teal-50 text-teal-600 border border-teal-100'
      case 'bonus': return 'bg-emerald-50 text-emerald-600 border border-emerald-100'
      case 'inventory': return 'bg-rose-50 text-rose-600 border border-rose-100'
      default: return 'bg-slate-50 text-slate-600 border border-slate-100'
    }
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'employee_new': return <UserPlus className="w-5 h-5" />
      case 'employee_delete': return <UserMinus className="w-5 h-5" />
      case 'salary_config': return <Wallet className="w-5 h-5" />
      case 'payroll': return <Coins className="w-5 h-5" />
      case 'leave': return <CalendarDays className="w-5 h-5" />
      case 'overtime': return <Clock className="w-5 h-5" />
      case 'reimbursement': return <Receipt className="w-5 h-5" />
      case 'bonus': return <Gift className="w-5 h-5" />
      case 'inventory': return <Package className="w-5 h-5" />
      default: return <Info className="w-5 h-5" />
    }
  }

  const renderModalDetails = () => {
    if (!selectedItem) return null

    switch (selectedItem.type) {
      case 'employee_new':
      case 'employee_delete':
        if (!selectedProfile) return null
        const fields = [
          selectedProfile.photo,
          selectedProfile.date_of_birth,
          selectedProfile.address,
          selectedProfile.employee_number,
          selectedProfile.join_date,
          selectedProfile.gender,
          selectedProfile.cv,
          selectedProfile.no_rekening,
          selectedProfile.company,
          selectedProfile.whatsapp
        ]
        const filled = fields.filter(Boolean).length
        const pct = Math.round((filled / fields.length) * 100)
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                { label: 'Jenis Kelamin', value: selectedProfile.gender === 'male' ? 'Laki-laki' : selectedProfile.gender === 'female' ? 'Perempuan' : '-', icon: <User className="w-3 h-3" /> },
                { label: 'Tanggal Lahir', value: formatDateSafe(selectedProfile.date_of_birth, { day: 'numeric', month: 'long', year: 'numeric' }), icon: <Calendar className="w-3 h-3" /> },
                { label: 'Bergabung', value: formatDateSafe(selectedProfile.join_date, { day: 'numeric', month: 'long', year: 'numeric' }), icon: <Briefcase className="w-3 h-3" /> },
                { label: 'Divisi Utama', value: selectedProfile.division || 'Umum', icon: <Building2 className="w-3 h-3" /> },
                { label: 'No. Rekening', value: selectedProfile.no_rekening || '-', icon: <Coins className="w-3 h-3" /> },
                { label: 'Perusahaan', value: selectedProfile.company || '-', icon: <Building2 className="w-3 h-3" /> },
              ].map(item => (
                <div key={item.label} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1 text-slate-400 mb-1">
                    {item.icon}
                    <span className="text-[9px] uppercase tracking-wider font-extrabold">{item.label}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-705">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div className="flex items-center gap-1 text-slate-400 mb-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-[9px] uppercase tracking-wider font-extrabold">WhatsApp / No. Telp</span>
              </div>
              {selectedProfile.whatsapp ? (
                <a 
                  href={`https://wa.me/${formatWaNumber(selectedProfile.whatsapp)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-indigo-650 hover:text-indigo-800 transition-colors inline-flex items-center gap-1.5 hover:underline"
                >
                  <span>{selectedProfile.whatsapp}</span>
                  <span className="text-[8px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 flex items-center gap-0.5 ml-2">
                    Hubungi Karyawan
                  </span>
                </a>
              ) : (
                <span className="text-xs font-bold text-slate-705">-</span>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div className="flex items-center gap-1 text-slate-400 mb-1">
                <MapPin className="w-3 h-3" />
                <span className="text-[9px] uppercase tracking-wider font-extrabold">Alamat Lengkap</span>
              </div>
              <p className="text-xs font-semibold text-slate-705 leading-relaxed">
                {selectedProfile.address || <span className="italic text-slate-400">Belum diisi</span>}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div className="flex items-center gap-1 text-slate-400 mb-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span className="text-[9px] uppercase tracking-wider font-extrabold">Curriculum Vitae (CV)</span>
              </div>
              {selectedProfile.cv ? (
                <div className="flex items-center justify-between gap-3 bg-white p-2 border border-slate-100 rounded-lg">
                  <span className="text-xs font-semibold text-slate-600 truncate flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                    Dokumen CV Karyawan
                  </span>
                  <a
                    href={getAssetUrl(selectedProfile.cv)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-gradient-to-r from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg text-[10px] font-bold transition-all hover:brightness-110 cursor-pointer"
                  >
                    Lihat / Unduh
                  </a>
                </div>
              ) : (
                <p className="text-xs font-semibold text-slate-400 italic">Belum diunggah</p>
              )}
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
              {pct === 100 ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
              <div className="flex-grow">
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-500">Kelengkapan Profile</span>
                  <span className={`text-[10px] font-bold font-mono ${pct === 100 ? 'text-emerald-600' : 'text-amber-500'}`}>{pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-400 to-indigo-500'}`}
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          </div>
        )

      case 'salary_config':
        const config = selectedItem.originalData
        const sRows = [
          { label: 'Gaji Pokok', oldKey: 'basic_salary', newKey: 'pending_basic_salary' },
          { label: 'Tunjangan Makan Harian', oldKey: 'allowance_meal_daily', newKey: 'pending_allowance_meal_daily' },
          { label: 'Tunjangan Transport Harian', oldKey: 'allowance_transport_daily', newKey: 'pending_allowance_transport_daily' },
          { label: 'Tunjangan Jabatan', oldKey: 'allowance_position', newKey: 'pending_allowance_position' },
          { label: 'Denda Keterlambatan', oldKey: 'deduction_late_daily', newKey: 'pending_deduction_late_daily' },
          { label: 'Potongan Absensi Harian', oldKey: 'deduction_absence_daily', newKey: 'pending_deduction_absence_daily' },
          { label: 'Potongan Tetap', oldKey: 'deduction_fixed', newKey: 'pending_deduction_fixed' },
        ]
        
        const changedSalaryRows = sRows.filter(r => {
          const oldVal = config[r.oldKey]
          const newVal = config[r.newKey]
          return newVal !== null && newVal !== oldVal
        })

        return (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Perbandingan Parameter Gaji</h4>
            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-505 border-b border-slate-100">
                    <th className="py-2.5 px-4 text-left font-bold uppercase tracking-wider text-[9px] text-slate-400">Komponen</th>
                    <th className="py-2.5 px-4 text-right font-bold uppercase tracking-wider text-[9px] text-slate-400">Semula</th>
                    <th className="py-2.5 px-4 text-right font-bold uppercase tracking-wider text-[9px] text-slate-400">Usulan Baru</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {changedSalaryRows.map(r => {
                    const oldVal = config[r.oldKey] || 0
                    const newVal = config[r.newKey] || 0
                    const isIncrease = newVal > oldVal
                    return (
                      <tr key={r.label} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 text-slate-700 font-semibold">{r.label}</td>
                        <td className="py-3 px-4 text-right text-slate-400 line-through font-medium">{formatIDR(oldVal)}</td>
                        <td className={`py-3 px-4 text-right font-black ${isIncrease ? 'text-emerald-600' : 'text-red-500'}`}>
                          {formatIDR(newVal)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )

      case 'payroll':
        const record = selectedItem.originalData
        return (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rincian Slip Gaji Bulanan</h4>
            <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
              <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-xl border border-emerald-100">
                <p className="text-[9px] uppercase font-bold text-emerald-600/80">Hadir</p>
                <p className="text-sm font-black">{record.days_present} Hari</p>
              </div>
              <div className="bg-red-50 text-red-700 p-2.5 rounded-xl border border-red-100">
                <p className="text-[9px] uppercase font-bold text-red-600/80">Terlambat</p>
                <p className="text-sm font-black">{record.days_late} Hari</p>
              </div>
              <div className="bg-blue-50 text-blue-700 p-2.5 rounded-xl border border-blue-100">
                <p className="text-[9px] uppercase font-bold text-blue-600/80">Cuti</p>
                <p className="text-sm font-black">{record.days_leave} Hari</p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Pemasukan (+)</p>
                <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
                  <span className="text-slate-500">Gaji Pokok</span>
                  <span className="font-semibold text-slate-700">{formatIDR(record.basic_salary)}</span>
                </div>
                {record.allowance_meal > 0 && (
                  <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
                    <span className="text-slate-500">Tunjangan Makan</span>
                    <span className="font-semibold text-slate-700">{formatIDR(record.allowance_meal)}</span>
                  </div>
                )}
                {record.allowance_transport > 0 && (
                  <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
                    <span className="text-slate-500">Tunjangan Transport</span>
                    <span className="font-semibold text-slate-700">{formatIDR(record.allowance_transport)}</span>
                  </div>
                )}
                {record.allowance_position > 0 && (
                  <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
                    <span className="text-slate-500">Tunjangan Jabatan</span>
                    <span className="font-semibold text-slate-700">{formatIDR(record.allowance_position)}</span>
                  </div>
                )}
                {record.allowance_fixed > 0 && (
                  <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
                    <span className="text-slate-500">Tunjangan Tetap</span>
                    <span className="font-semibold text-slate-700">{formatIDR(record.allowance_fixed)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1 pt-2">
                <p className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Potongan (-)</p>
                {record.deduction_late > 0 && (
                  <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
                    <span className="text-slate-500">Denda Keterlambatan</span>
                    <span className="font-semibold text-slate-700 text-red-500">-{formatIDR(record.deduction_late)}</span>
                  </div>
                )}
                {record.deduction_absence > 0 && (
                  <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
                    <span className="text-slate-500">Potongan Absensi</span>
                    <span className="font-semibold text-slate-700 text-red-500">-{formatIDR(record.deduction_absence)}</span>
                  </div>
                )}
                {record.deduction_fixed > 0 && (
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Potongan Tetap</span>
                    <span className="font-semibold text-slate-700 text-red-500">-{formatIDR(record.deduction_fixed)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-sm mt-2">
                <span className="font-extrabold text-slate-800">Total Gaji Bersih (Transfer)</span>
                <span className="font-black text-indigo-600 text-base">{formatIDR(record.net_salary)}</span>
              </div>
            </div>
          </div>
        )

      case 'leave':
        const lRequest = selectedItem.originalData
        const start = lRequest.start_date ? Date.parse(lRequest.start_date) : NaN
        const end = lRequest.end_date ? Date.parse(lRequest.end_date) : NaN
        const lDaysCount = (!isNaN(start) && !isNaN(end))
          ? Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1
          : 0
        return (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rincian Pengajuan Cuti</h4>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Kategori Cuti</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {lRequest.category === 'LAINNYA' ? lRequest.custom_category : lRequest.category}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Durasi Cuti</p>
                  <p className="font-bold text-slate-800 text-sm mt-1">{lDaysCount} Hari Kerja</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Periode Pelaksanaan</p>
                <p className="font-semibold text-slate-800 mt-1 flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                  {formatDateSafe(lRequest.start_date, { day: 'numeric', month: 'long', year: 'numeric' })}
                  <span className="text-slate-400 font-normal">s/d</span>
                  {formatDateSafe(lRequest.end_date, { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Alasan Cuti</p>
                <p className="font-semibold text-slate-800 mt-1.5 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                  {lRequest.reason || <span className="italic text-slate-300">Tidak ada penjelasan alasan</span>}
                </p>
              </div>

              {lRequest.image && (
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1.5">Berkas Surat Cuti / Dokter</p>
                  <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-white group shadow-sm max-h-48 flex items-center justify-center p-2">
                    <img src={`http://localhost:8000${lRequest.image}`} alt="Surat Lampiran Cuti" className="max-h-40 object-contain" />
                    <a 
                      href={`http://localhost:8000${lRequest.image}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" /> Buka Lampiran Ukuran Penuh
                    </a>
                  </div>
                </div>
              )}

              {lRequest.created_at && (
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Waktu Pengajuan (Dibuat)</p>
                  <p className="font-semibold text-slate-700 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatDateTime(lRequest.created_at)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )

      case 'overtime':
        const oRequest = selectedItem.originalData
        return (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rincian Pengajuan Lembur</h4>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Tanggal Lembur</p>
                  <p className="font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-slate-400" />
                    {formatDateSafe(oRequest.date, { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Durasi Lembur</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100 font-black text-[10px]">
                    {oRequest.duration} Jam Kerja
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Jam Pelaksanaan</p>
                <p className="font-bold text-slate-700 mt-1.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {(oRequest.start_time || '').substring(0, 5)} WIB <span className="text-slate-400 font-normal">s/d</span> {(oRequest.end_time || '').substring(0, 5)} WIB
                </p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Alasan Lembur</p>
                <p className="font-semibold text-slate-700 mt-1.5 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                  {oRequest.reason || <span className="italic text-slate-300">Tidak ada keterangan lembur</span>}
                </p>
              </div>

              {oRequest.created_at && (
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Waktu Pengajuan (Dibuat)</p>
                  <p className="font-semibold text-slate-700 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatDateTime(oRequest.created_at)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )

      case 'reimbursement':
        const rRequest = selectedItem.originalData
        return (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rincian Klaim Biaya</h4>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Kategori Klaim</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-teal-50 text-teal-700 border border-teal-100">
                    {rRequest.category}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Tanggal Nota</p>
                  <p className="font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-slate-400" />
                    {formatDateSafe(rRequest.expense_date, { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-100 rounded-xl flex justify-between items-center shadow-sm">
                <span className="font-bold text-slate-600">Total Nominal Reimbursement</span>
                <span className="text-base font-black text-teal-600">{formatIDR(rRequest.amount)}</span>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Judul Pengajuan</p>
                <p className="font-bold text-slate-800 mt-1">{rRequest.title}</p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Deskripsi / Penjelasan Biaya</p>
                <p className="font-semibold text-slate-700 mt-1.5 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                  {rRequest.description || <span className="italic text-slate-300">Tidak ada deskripsi tertulis</span>}
                </p>
              </div>

              {rRequest.receipt_path && (
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1.5">Bukti Kwitansi / Struk Nota</p>
                  <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-white group shadow-sm max-h-48 flex items-center justify-center p-2">
                    <img src={`http://localhost:8000${rRequest.receipt_path}`} alt="Bukti Nota Pembelian" className="max-h-40 object-contain" />
                    <a 
                      href={`http://localhost:8000${rRequest.receipt_path}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" /> Buka Nota Pembelian
                    </a>
                  </div>
                </div>
              )}

              {rRequest.created_at && (
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Waktu Pengajuan (Dibuat)</p>
                  <p className="font-semibold text-slate-700 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatDateTime(rRequest.created_at)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )

      case 'bonus':
        const bRequest = selectedItem.originalData
        return (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rincian Pengajuan Bonus</h4>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Tanggal Pembagian</p>
                  <p className="font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-slate-400" />
                    {formatDateSafe(bRequest.bonus_date, { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Jumlah Bonus</p>
                  <span className="inline-block mt-1 text-sm font-black text-emerald-600">
                    {formatIDR(bRequest.bonus_amount)}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Deskripsi / Penjelasan Kinerja</p>
                <p className="font-semibold text-slate-700 mt-1.5 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                  {bRequest.description || <span className="italic text-slate-300">Tidak ada keterangan penjelasan</span>}
                </p>
              </div>

              {bRequest.created_at && (
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Waktu Pengajuan (Dibuat)</p>
                  <p className="font-semibold text-slate-700 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatDateTime(bRequest.created_at)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )

      case 'inventory':
        const iRequest = selectedItem.originalData
        return (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rincian Pengadaan Barang Inventaris</h4>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4 text-xs">
              {iRequest.foto && (
                <div className="flex items-center justify-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <img src={`http://localhost:8000${iRequest.foto}`} alt="Foto Barang" className="max-h-40 object-contain rounded-lg" />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Nama Barang</p>
                  <p className="font-bold text-slate-800 text-sm mt-1">{iRequest.nama_barang}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Kondisi Barang</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded bg-slate-200 text-slate-700 font-extrabold uppercase text-[9px] border border-slate-300">
                    {iRequest.kondisi_barang === 'ori' ? 'Baru / Original' : 'Bekas / Second'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Harga Barang</p>
                  <p className="font-black text-rose-600 text-sm mt-1">{formatIDR(iRequest.harga)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Tanggal Pembelian</p>
                  <p className="font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-slate-400" />
                    {formatDateSafe(iRequest.tanggal_pembelian, { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Lokasi Barang</p>
                  <p className="font-semibold text-slate-700 mt-1">{iRequest.lokasi || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Pemakai Barang</p>
                  <p className="font-semibold text-slate-700 mt-1">{iRequest.pemakai_barang || 'Kantor Bersama'}</p>
                </div>
              </div>

              {iRequest.struk_pembelian && (
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1.5">Nota Pembelian / Struk Toko</p>
                  <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-white group shadow-sm max-h-48 flex items-center justify-center p-2">
                    <img src={`http://localhost:8000${iRequest.struk_pembelian}`} alt="Struk Pembelian" className="max-h-40 object-contain" />
                    <a 
                      href={`http://localhost:8000${iRequest.struk_pembelian}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" /> Buka Nota Pembayaran
                    </a>
                  </div>
                </div>
              )}

              {iRequest.created_at && (
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Waktu Pengajuan (Dibuat)</p>
                  <p className="font-semibold text-slate-700 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatDateTime(iRequest.created_at)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="space-y-8 pb-10" style={{ fontFamily: "'Inter', 'system-ui', sans-serif" }}>

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl text-white p-8 md:p-10 shadow-xl transition-all duration-500 hover:shadow-orange-950/5"
        style={{ background: 'linear-gradient(135deg, #e31b00 0%, #ff5200 100%)' }}>
        
        {/* Abstract futuristic glowing elements */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full opacity-20 blur-3xl bg-white/20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full opacity-15 blur-3xl bg-white/10 pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full opacity-15 blur-2xl bg-white/10 pointer-events-none animate-pulse" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold text-white border border-white/20 bg-black/10 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-white animate-spin" style={{ animationDuration: '4s' }} />
              {greeting.toUpperCase()}, DIREKTUR UTAMA
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight text-white font-sans">
              Portal Kendali & <span className="text-white">Pengesahan Utama</span>
            </h2>
            <p className="text-sm md:text-base text-white/90 leading-relaxed font-medium">
              Selamat datang kembali. Anda memiliki kontrol penuh atas kelancaran administrasi perusahaan. Tinjau, sahkan, atau kelola seluruh laporan di bawah ini.
            </p>
          </div>

          {/* Stats summary circles / details */}
          <div className="flex items-center gap-6 shrink-0 bg-white/10 backdrop-blur-lg border border-white/20 p-5 rounded-2xl shadow-xl w-full md:w-auto justify-around">
            <div className="flex flex-col items-center">
              <div className="relative flex items-center justify-center">
                {/* SVG Circular Progress */}
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="28" className="stroke-white/20" strokeWidth="4" fill="transparent" />
                  <circle cx="32" cy="32" r="28" className="stroke-white transition-all duration-1000" strokeWidth="4" fill="transparent"
                    strokeDasharray={2 * Math.PI * 28}
                    strokeDashoffset={2 * Math.PI * 28 * (1 - completionPercent / 100)}
                    strokeLinecap="round" />
                </svg>
                <span className="absolute text-sm font-black text-white">{completionPercent}%</span>
              </div>
              <p className="text-[10px] text-white/80 font-bold uppercase tracking-wider mt-2">Pekerjaan Selesai</p>
            </div>

            <div className="w-[1px] h-12 bg-white/20" />

            <div className="space-y-1.5 text-center md:text-left">
              {totalPending > 0 ? (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 animate-bounce text-white" />
                  <span className="text-lg font-black text-white">{totalPending}</span>
                  <span className="text-xs font-semibold text-white/90">Menunggu</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span className="text-sm font-bold text-white">Semua Selesai</span>
                </div>
              )}
              <div className="text-[10px] font-bold text-white/80 flex items-center gap-1.5 justify-center md:justify-start">
                <Calendar className="w-3.5 h-3.5 text-white" />
                {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Company Health & Insights Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Metric 1: Active Employees */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-slate-50 opacity-50 group-hover:scale-110 transition-transform" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Karyawan Aktif</span>
              <h4 className="text-2xl font-black text-slate-800">{totalEmployees}</h4>
              <p className="text-xs text-slate-400 font-medium">Akun terverifikasi aktif</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <User className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metric 2: Estimated Month Payroll */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-slate-50 opacity-50 group-hover:scale-110 transition-transform" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Alokasi Payroll</span>
              <h4 className="text-2xl font-black text-slate-800">{formatIDR(totalProposedPayroll)}</h4>
              <p className="text-xs text-slate-400 font-medium">Bulan berjalan</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metric 3: Active Cuti Today */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-slate-50 opacity-50 group-hover:scale-110 transition-transform" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-2 w-full">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Cuti Hari Ini</span>
              <h4 className="text-2xl font-black text-slate-800">
                {activeLeavesToday.length} <span className="text-xs font-semibold text-slate-400">karyawan</span>
              </h4>
              
              {/* Interactive preview of who is cuti */}
              {activeLeavesToday.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1 max-h-12 overflow-y-auto">
                  {activeLeavesToday.map((c: any) => (
                    <span key={c.id} className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100" title={c.reason}>
                      {c.user?.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-medium">Semua karyawan hadir bekerja</p>
              )}
            </div>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
        </div>

      </div>

      {/* Grid Menu Persetujuan */}
      <div>
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-700">Kategori Persetujuan</h3>
          <p className="text-xs text-slate-400 font-medium">Pilih modul spesifik untuk pengelolaan yang lebih mendalam</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cardDefs.map((card) => {
            const Icon = card.icon
            const isPending = card.pending > 0

            return (
              <Link
                key={card.key}
                to={card.to}
                className="group relative block rounded-3xl bg-white p-5 border border-slate-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{
                  borderLeft: isPending ? `4px solid ${card.color}` : '1px solid #f1f5f9'
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md transition-all group-hover:scale-110"
                    style={{ background: card.gradient }}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {isPending ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold animate-pulse"
                      style={{ background: card.colorLight, color: card.color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: card.color }} />
                      {card.pending} Pending
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Bersih
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">
                  {card.title}
                </h4>
                <p className="text-[11px] text-slate-400 font-medium line-clamp-2 leading-relaxed mb-4">{card.desc}</p>

                <div className="flex items-center justify-between border-t border-slate-50 pt-3 text-[11px] font-bold transition-all"
                  style={{ color: card.color }}>
                  <span>Kelola Detail</span>
                  <ArrowUpRight className="w-3.5 h-3.5 transform transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Unified Quick Approval Inbox (Inbox Persetujuan Cepat) */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
        
        {/* Inbox Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Inbox Persetujuan Cepat</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Tinjau & proses seluruh pengajuan pending langsung dari dashboard Anda</p>
            </div>
          </div>

          {/* Search bar inside inbox */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama karyawan..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 outline-none focus:border-indigo-500 bg-slate-50/50 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Inbox Tabs Filter */}
        <div className="flex flex-wrap gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50/30">
          {[
            { key: 'all', label: 'Semua Pengajuan', count: tabCounts.all },
            { key: 'employee', label: 'Karyawan', count: tabCounts.employee },
            { key: 'salary_payroll', label: 'Gaji & Payroll', count: tabCounts.salary_payroll },
            { key: 'operational', label: 'Operasional SDM', count: tabCounts.operational },
            { key: 'inventory', label: 'Inventaris Barang', count: tabCounts.inventory }
          ].map((tab) => {
            const isActive = inboxTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setInboxTab(tab.key as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200/60 shadow-sm'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Inbox List Content */}
        <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
              <p className="text-xs text-slate-400 font-medium">Sinkronisasi data pending...</p>
            </div>
          ) : filteredInboxItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-3 text-emerald-400 border border-emerald-100">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">Semua Terkendali!</h4>
              <p className="text-xs text-slate-400 font-medium mt-1 max-w-sm">
                {searchQuery ? 'Tidak ditemukan pengajuan dengan kata kunci pencarian tersebut.' : 'Tidak ada tugas persetujuan pending pada kategori ini. Kerja bagus!'}
              </p>
            </div>
          ) : (
            filteredInboxItems.map((item) => (
              <div key={`${item.type}-${item.id}`} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors">
                
                {/* User & Request Description */}
                <div className="flex items-start gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getIconColorClass(item.type)}`}>
                    {getItemIcon(item.type)}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/50 uppercase tracking-wider text-[9px]">
                        {item.badgeText}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatDateSafe(item.date, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <h5 className="text-sm font-bold text-slate-800 leading-snug break-words">
                      {item.title}
                    </h5>
                    <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 flex-wrap">
                      <span className="text-slate-700 font-black">{item.requesterName}</span>
                      {item.requesterEmail && <span className="text-slate-400 font-normal break-all">({item.requesterEmail})</span>}
                    </p>
                    <p className="text-xs text-slate-450 font-medium leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100 break-words font-sans">
                      {item.details}
                    </p>
                    {item.originalData?.created_at && (
                      <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-1">
                        <Clock className="w-3.5 h-3.5 text-slate-350 shrink-0" />
                        <span>Dibuat: {formatDateTime(item.originalData.created_at)}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Inbox Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleViewProfileDetail(item)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
                    title="Lihat Detail"
                  >
                    <BookUser className="w-3.5 h-3.5 text-indigo-500" />
                    Detail
                  </button>

                  <button
                    onClick={() => handleQuickReject(item)}
                    disabled={actionLoading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 bg-red-50/50 border border-red-100 hover:bg-red-50 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    Tolak
                  </button>

                  <button
                    onClick={() => handleQuickApprove(item)}
                    disabled={actionLoading}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:brightness-110 cursor-pointer shadow-sm bg-gradient-to-r from-indigo-500 to-indigo-600 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Setujui
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Quick Tip Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="text-[10px] text-slate-500 font-medium">
            Aksi persetujuan cepat di atas akan memperbarui database secara langsung. Gunakan tombol **Detail** untuk meninjau biodata pendaftar atau riwayat CV.
          </span>
        </div>
      </div>

      {/* Render Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-zoom-in max-h-[90vh] flex flex-col">
            {/* Header gradient bar */}
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shrink-0" />
            
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-650 flex items-center justify-center shadow-md text-white shrink-0">
                  <BookUser className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Detail Pengajuan: {selectedItem.badgeText}</h3>
                  <p className="text-[10px] text-slate-400">Tinjau seluruh rincian berkas sebelum memberikan persetujuan</p>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-slate-700">
              
              {/* Profile Card Summary */}
              {selectedProfile ? (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  {selectedProfile.photo ? (
                    <img src={getAssetUrl(selectedProfile.photo)} alt="Foto Profil"
                      className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 border border-slate-100 text-indigo-300">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{selectedProfile.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{selectedProfile.email}</p>
                    {selectedProfile.division && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-full mt-1">
                        <Building2 className="w-2.5 h-2.5" />
                        {selectedProfile.division}
                      </span>
                    )}
                  </div>
                </div>
              ) : selectedItem.type !== 'inventory' && loadingProfile ? (
                <div className="flex items-center justify-center py-4 gap-2 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  <span className="text-[11px] text-slate-400">Memuat info pengaju...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{selectedItem.requesterName}</p>
                    {selectedItem.requesterEmail && <p className="text-[10px] text-slate-400 font-mono">{selectedItem.requesterEmail}</p>}
                  </div>
                </div>
              )}

              {/* Render Type-Specific Detail Layout */}
              {renderModalDetails()}

              {/* Action Buttons in Modal */}
              <div className="flex gap-2 pt-4 border-t border-slate-100 mt-4 shrink-0 font-sans">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleQuickReject(selectedItem);
                  }}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-50 text-red-600 border border-red-100 font-bold rounded-xl text-xs hover:bg-red-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  Tolak
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleQuickApprove(selectedItem);
                  }}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold rounded-xl text-xs hover:brightness-110 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  Setujui
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
