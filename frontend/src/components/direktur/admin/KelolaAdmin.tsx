import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import {
  ShieldCheck,
  UserPlus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Search,
  Phone,
  Building2,
  MapPin,
  Loader2,
  CheckCircle2,
  Users,
  X,
  RefreshCw,
  Shield,
  ExternalLink
} from 'lucide-react'
import { getAssetUrl } from '../../../utils/api'

interface AdminUser {
  id: number
  name: string
  email: string
  role: string
  status: 'active' | 'inactive' | 'pending'
  photo?: string | null
  whatsapp?: string | null
  company?: string | null
  division?: string | null
  office_location?: 'jakarta' | 'bogor' | string | null
  password_plain?: string | null
  employee_number?: string | null
  created_at: string
  last_seen_at?: string | null
}

interface KelolaAdminProps {
  token: string
}

export default function KelolaAdmin({ token }: KelolaAdminProps) {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [revealedPasswords, setRevealedPasswords] = useState<Record<number, boolean>>({})

  // Modal States - Create
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createWhatsapp, setCreateWhatsapp] = useState('')
  const [createCompany, setCreateCompany] = useState('PT Cakrawala Parama Internasional')
  const [createDivision, setCreateDivision] = useState('Human Resources')
  const [createOfficeLocation, setCreateOfficeLocation] = useState<'jakarta' | 'bogor'>('jakarta')
  const [submittingCreate, setSubmittingCreate] = useState(false)
  const [showCreatePasswordText, setShowCreatePasswordText] = useState(false)

  // Modal States - Edit
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editWhatsapp, setEditWhatsapp] = useState('')
  const [editCompany, setEditCompany] = useState('')
  const [editDivision, setEditDivision] = useState('')
  const [editOfficeLocation, setEditOfficeLocation] = useState<'jakarta' | 'bogor'>('jakarta')
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active')
  const [submittingEdit, setSubmittingEdit] = useState(false)
  const [showEditPasswordText, setShowEditPasswordText] = useState(false)

  const fetchAdmins = async () => {
    setLoading(true)
    try {
      const res = await axios.get('http://localhost:8000/api/director/admins', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data.status === 'success') {
        setAdmins(res.data.data)
      }
    } catch (err: any) {
      console.error('Gagal mengambil daftar admin:', err)
      Swal.fire({
        title: 'Gagal Memuat Data',
        text: err.response?.data?.message || 'Tidak dapat terhubung ke server.',
        icon: 'error',
        background: '#fffdfb',
        color: '#3c1105'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  // Filtered list
  const filteredAdmins = admins.filter((adm) => {
    const matchSearch =
      adm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adm.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (adm.whatsapp && adm.whatsapp.includes(searchQuery))
    const matchCompany = companyFilter === 'all' || adm.company === companyFilter
    return matchSearch && matchCompany
  })

  // Format date helper
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Toggle revealed password
  const toggleRevealPassword = (id: number) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Copy password helper
  const handleCopyPassword = (pwd: string) => {
    navigator.clipboard.writeText(pwd)
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Kata sandi disalin ke clipboard!',
      showConfirmButton: false,
      timer: 1500,
      background: '#fffdfb',
      color: '#3c1105'
    })
  }

  // Format WhatsApp number
  const formatWaNumber = (phone?: string | null): string => {
    if (!phone) return ''
    let clean = phone.trim().replace(/\D/g, '')
    if (clean.startsWith('0')) {
      clean = '62' + clean.substring(1)
    }
    return clean
  }

  // Handle Create Admin
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createName || !createEmail || !createPassword) {
      Swal.fire({
        title: 'Formulir Belum Lengkap',
        text: 'Mohon isi Nama, Email, dan Kata Sandi.',
        icon: 'warning',
        background: '#fffdfb',
        color: '#3c1105'
      })
      return
    }

    if (createPassword.length < 6) {
      Swal.fire({
        title: 'Kata Sandi Terlalu Pendek',
        text: 'Kata sandi minimal 6 karakter.',
        icon: 'warning',
        background: '#fffdfb',
        color: '#3c1105'
      })
      return
    }

    setSubmittingCreate(true)
    try {
      const res = await axios.post(
        'http://localhost:8000/api/director/admins',
        {
          name: createName,
          email: createEmail,
          password: createPassword,
          whatsapp: createWhatsapp || null,
          company: createCompany || null,
          division: createDivision || 'Human Resources',
          office_location: createOfficeLocation
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (res.data.status === 'success') {
        Swal.fire({
          title: 'Berhasil!',
          text: 'Akun Admin HR baru berhasil didaftarkan.',
          icon: 'success',
          background: '#fffdfb',
          color: '#3c1105',
          timer: 2000,
          showConfirmButton: false
        })
        setShowCreateModal(false)
        setCreateName('')
        setCreateEmail('')
        setCreatePassword('')
        setCreateWhatsapp('')
        setCreateDivision('Human Resources')
        fetchAdmins()
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.errors
          ? Object.values(err.response.data.errors as Record<string, string[]>).flat().join('\n')
          : err.response?.data?.message || 'Gagal mendaftarkan akun Admin HR.'
      Swal.fire({
        title: 'Pendaftaran Gagal',
        text: msg,
        icon: 'error',
        background: '#fffdfb',
        color: '#3c1105'
      })
    } finally {
      setSubmittingCreate(false)
    }
  }

  // Open Edit Modal
  const handleOpenEdit = (admin: AdminUser) => {
    setEditingAdmin(admin)
    setEditName(admin.name)
    setEditEmail(admin.email)
    setEditPassword('')
    setEditWhatsapp(admin.whatsapp || '')
    setEditCompany(admin.company || 'PT Cakrawala Parama Internasional')
    setEditDivision(admin.division || 'Human Resources')
    setEditOfficeLocation((admin.office_location as 'jakarta' | 'bogor') || 'jakarta')
    setEditStatus((admin.status as 'active' | 'inactive') || 'active')
    setShowEditModal(true)
  }

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAdmin) return

    if (!editName || !editEmail) {
      Swal.fire({
        title: 'Formulir Belum Lengkap',
        text: 'Nama dan Email tidak boleh kosong.',
        icon: 'warning',
        background: '#fffdfb',
        color: '#3c1105'
      })
      return
    }

    if (editPassword && editPassword.length < 6) {
      Swal.fire({
        title: 'Kata Sandi Terlalu Pendek',
        text: 'Kata sandi baru minimal 6 karakter.',
        icon: 'warning',
        background: '#fffdfb',
        color: '#3c1105'
      })
      return
    }

    setSubmittingEdit(true)
    try {
      const payload: any = {
        name: editName,
        email: editEmail,
        whatsapp: editWhatsapp || null,
        company: editCompany || null,
        division: editDivision || 'Human Resources',
        office_location: editOfficeLocation,
        status: editStatus
      }
      if (editPassword) {
        payload.password = editPassword
      }

      const res = await axios.put(
        `http://localhost:8000/api/director/admins/${editingAdmin.id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (res.data.status === 'success') {
        Swal.fire({
          title: 'Berhasil!',
          text: 'Data akun Admin HR berhasil diperbarui.',
          icon: 'success',
          background: '#fffdfb',
          color: '#3c1105',
          timer: 2000,
          showConfirmButton: false
        })
        setShowEditModal(false)
        setEditingAdmin(null)
        fetchAdmins()
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.errors
          ? Object.values(err.response.data.errors as Record<string, string[]>).flat().join('\n')
          : err.response?.data?.message || 'Gagal memperbarui akun Admin HR.'
      Swal.fire({
        title: 'Pembaruan Gagal',
        text: msg,
        icon: 'error',
        background: '#fffdfb',
        color: '#3c1105'
      })
    } finally {
      setSubmittingEdit(false)
    }
  }

  // Handle Delete Admin
  const handleDeleteAdmin = (admin: AdminUser) => {
    Swal.fire({
      title: 'Hapus Akun Admin HR?',
      html: `Apakah Anda yakin ingin menghapus akun Admin HR <strong>${admin.name}</strong> (${admin.email})?<br><br><span class="text-xs text-rose-600 font-semibold">Tindakan ini tidak dapat dibatalkan.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus Akun',
      cancelButtonText: 'Batal',
      background: '#fffdfb',
      color: '#3c1105'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await axios.delete(`http://localhost:8000/api/director/admins/${admin.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (res.data.status === 'success') {
            Swal.fire({
              title: 'Dihapus!',
              text: 'Akun Admin HR telah berhasil dihapus.',
              icon: 'success',
              background: '#fffdfb',
              color: '#3c1105',
              timer: 2000,
              showConfirmButton: false
            })
            fetchAdmins()
          }
        } catch (err: any) {
          Swal.fire({
            title: 'Penghapusan Gagal',
            text: err.response?.data?.message || 'Terjadi kesalahan saat menghapus admin.',
            icon: 'error',
            background: '#fffdfb',
            color: '#3c1105'
          })
        }
      }
    })
  }

  const activeCount = admins.filter((a) => a.status === 'active').length
  const jakartaCount = admins.filter((a) => a.office_location !== 'bogor').length
  const bogorCount = admins.filter((a) => a.office_location === 'bogor').length

  const inputClass =
    'w-full bg-slate-50 border border-slate-200 hover:border-orange-200 focus:border-red-400 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 px-3.5 outline-none transition-all text-xs font-semibold focus:ring-2 focus:ring-red-100 font-quicksand'
  const labelClass = 'block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 font-quicksand'

  return (
    <div className="space-y-6 font-quicksand">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 rounded-3xl p-6 sm:p-7 text-white shadow-lg shadow-orange-500/15 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-extrabold uppercase tracking-widest text-white">
              <ShieldCheck className="w-3.5 h-3.5" />
              Wewenang Direktur Utama
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Kelola Akun Admin HR (CRUD)
            </h1>
            <p className="text-xs sm:text-sm text-orange-100 max-w-xl font-medium leading-relaxed">
              Direktur Utama memiliki hak istimewa penuh untuk mendaftarkan akun baru, mengedit data, melihat kata sandi, hingga menghapus akun Admin HR.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="self-start sm:self-center shrink-0 px-5 py-3 bg-white hover:bg-orange-50 text-red-600 font-extrabold rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer text-xs flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4 text-red-600" />
            + Tambah Admin HR Baru
          </button>
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-orange-100/80 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Admin HR</p>
            <h3 className="text-lg font-black text-slate-800 font-quicksand mt-0.5">{admins.length} Staf</h3>
          </div>
        </div>

        <div className="bg-white border border-emerald-100/80 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Status Aktif</p>
            <h3 className="text-lg font-black text-emerald-700 font-quicksand mt-0.5">{activeCount} Akun</h3>
          </div>
        </div>

        <div className="bg-white border border-red-100/80 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Kantor Jakarta</p>
            <h3 className="text-lg font-black text-slate-800 font-quicksand mt-0.5">{jakartaCount} Admin</h3>
          </div>
        </div>

        <div className="bg-white border border-blue-100/80 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Kantor Bogor</p>
            <h3 className="text-lg font-black text-slate-800 font-quicksand mt-0.5">{bogorCount} Admin</h3>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <section className="bg-white border border-orange-100/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        {/* Filter and Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-orange-50">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama, email, atau no WhatsApp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 hover:border-orange-200 focus:border-red-400 rounded-xl py-2 pl-9 pr-3 text-xs font-semibold outline-none transition-all placeholder-slate-400"
              />
            </div>

            {/* Company Filter Dropdown */}
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl py-2 px-3 outline-none hover:border-orange-200 focus:border-red-400 transition-all cursor-pointer"
            >
              <option value="all">Semua Perusahaan</option>
              <option value="PT Cakrawala Parama Internasional">PT Cakrawala Parama Internasional</option>
              <option value="PT Yasodana Parvez Internasional">PT Yasodana Parvez Internasional</option>
            </select>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={fetchAdmins}
              className="p-2 bg-slate-50 hover:bg-orange-50 border border-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer shadow-xs active:scale-90"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table View (Desktop & Tablet) */}
        <div className="border border-orange-100/70 rounded-2xl overflow-hidden bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-quicksand">
              <thead>
                <tr className="bg-orange-50/40 text-orange-950/80 text-[11px] font-black uppercase tracking-wider border-b border-orange-100">
                  <th className="py-3.5 px-4">Admin HR</th>
                  <th className="py-3.5 px-4">Kontak & WhatsApp</th>
                  <th className="py-3.5 px-4">Perusahaan & Penempatan</th>
                  <th className="py-3.5 px-4">Kata Sandi</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi Direktur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                        Memuat data akun Admin HR...
                      </div>
                    </td>
                  </tr>
                ) : filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                      {searchQuery || companyFilter !== 'all'
                        ? 'Admin HR tidak ditemukan sesuai filter pencarian.'
                        : 'Belum ada akun Admin HR yang terdaftar.'}
                    </td>
                  </tr>
                ) : (
                  filteredAdmins.map((adm) => (
                    <tr key={adm.id} className="hover:bg-orange-50/20 transition-colors">
                      {/* Column 1: Info Admin */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {adm.photo ? (
                            <img
                              src={getAssetUrl(adm.photo)}
                              alt={adm.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-orange-100 shadow-sm shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-500 to-orange-500 text-white flex items-center justify-center font-black text-sm uppercase shrink-0 shadow-sm">
                              {adm.name.substring(0, 2)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800 block truncate text-xs">
                              {adm.name}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] text-orange-600 font-extrabold bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 mt-0.5">
                              <Shield className="w-2.5 h-2.5" />
                              {adm.division || 'Human Resources'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Kontak */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="text-[11px] text-slate-600 font-mono block truncate max-w-[180px]">
                            {adm.email}
                          </span>
                          {adm.whatsapp ? (
                            <a
                              href={`https://wa.me/${formatWaNumber(adm.whatsapp)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-colors"
                            >
                              <Phone className="w-2.5 h-2.5 shrink-0" />
                              {adm.whatsapp}
                              <ExternalLink className="w-2 h-2 opacity-60" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic block">WA: -</span>
                          )}
                        </div>
                      </td>

                      {/* Column 3: Perusahaan & Lokasi */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 truncate max-w-[200px]">
                            <Building2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            {adm.company || '-'}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 py-0.5 px-2 rounded-full text-[10px] font-bold border ${
                              adm.office_location === 'bogor'
                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                : 'bg-red-50 text-red-700 border-red-100'
                            }`}
                          >
                            <MapPin className="w-2.5 h-2.5" />
                            {adm.office_location === 'bogor' ? 'Kantor Bogor' : 'Kantor Jakarta'}
                          </span>
                        </div>
                      </td>

                      {/* Column 4: Password Plain */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {adm.password_plain ? (
                            <>
                              <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                                {revealedPasswords[adm.id] ? adm.password_plain : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleRevealPassword(adm.id)}
                                className="p-1 text-slate-400 hover:text-orange-600 rounded cursor-pointer transition-colors"
                                title={revealedPasswords[adm.id] ? 'Sembunyikan' : 'Lihat Sandi'}
                              >
                                {revealedPasswords[adm.id] ? (
                                  <EyeOff className="w-3.5 h-3.5" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyPassword(adm.password_plain!)}
                                className="p-1 text-slate-400 hover:text-emerald-600 rounded cursor-pointer transition-colors"
                                title="Salin Kata Sandi"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Terenkripsi</span>
                          )}
                        </div>
                      </td>

                      {/* Column 5: Status */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {adm.status === 'active' ? (
                            <span className="inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Nonaktif
                            </span>
                          )}
                          <span className="text-[9px] text-slate-400 block">
                            Dibuat: {formatDate(adm.created_at)}
                          </span>
                        </div>
                      </td>

                      {/* Column 6: Aksi Direktur (Edit & Hapus) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(adm)}
                            className="px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold rounded-xl text-[10px] transition-all cursor-pointer flex items-center gap-1 active:scale-95 border border-orange-200"
                            title="Edit Data Admin HR"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAdmin(adm)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-[10px] transition-all cursor-pointer flex items-center gap-1 active:scale-95 border border-rose-200"
                            title="Hapus Akun Admin HR"
                          >
                            <Trash2 className="w-3 h-3" />
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===== MODAL: TAMBAH ADMIN HR BARU ===== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in font-quicksand">
          <div className="bg-white border border-orange-100 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-gradient-to-r from-red-500 to-orange-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Tambah Akun Admin HR Baru</h3>
                  <p className="text-[11px] text-orange-100">Buat kredensial login Admin HR untuk perusahaan</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className={labelClass}>Nama Lengkap Admin HR *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rian Pratama, S.Psi"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={labelClass}>Alamat Email Login *</label>
                  <input
                    type="email"
                    required
                    placeholder="admin.cpi@example.com"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Nomor WhatsApp</label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={createWhatsapp}
                    onChange={(e) => setCreateWhatsapp(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Kata Sandi Login * (Min. 6 Karakter)</label>
                <div className="relative">
                  <input
                    type={showCreatePasswordText ? 'text' : 'password'}
                    required
                    placeholder="Buat kata sandi akun"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePasswordText(!showCreatePasswordText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500 cursor-pointer"
                  >
                    {showCreatePasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={labelClass}>Perusahaan</label>
                  <select
                    value={createCompany}
                    onChange={(e) => setCreateCompany(e.target.value)}
                    className={inputClass}
                  >
                    <option value="PT Cakrawala Parama Internasional">PT Cakrawala Parama Internasional</option>
                    <option value="PT Yasodana Parvez Internasional">PT Yasodana Parvez Internasional</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Penempatan Kantor</label>
                  <select
                    value={createOfficeLocation}
                    onChange={(e) => setCreateOfficeLocation(e.target.value as 'jakarta' | 'bogor')}
                    className={inputClass}
                  >
                    <option value="jakarta">Kantor Jakarta</option>
                    <option value="bogor">Kantor Bogor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Divisi / Jabatan</label>
                <input
                  type="text"
                  placeholder="Human Resources"
                  value={createDivision}
                  onChange={(e) => setCreateDivision(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="px-5 py-2 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {submittingCreate ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Mendaftarkan...
                    </>
                  ) : (
                    'Simpan Akun Admin'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: EDIT ADMIN HR ===== */}
      {showEditModal && editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in font-quicksand">
          <div className="bg-white border border-orange-100 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Edit className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Edit Akun Admin HR</h3>
                  <p className="text-[11px] text-orange-100">Perbarui profil atau reset kata sandi admin</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className={labelClass}>Nama Lengkap Admin HR *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={labelClass}>Alamat Email *</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Nomor WhatsApp</label>
                  <input
                    type="text"
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Ganti Kata Sandi Baru <span className="font-normal text-slate-400 lowercase">(kosongkan jika tidak diubah)</span>
                </label>
                <div className="relative">
                  <input
                    type={showEditPasswordText ? 'text' : 'password'}
                    placeholder="Ketik kata sandi baru (min. 6 karakter)"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPasswordText(!showEditPasswordText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500 cursor-pointer"
                  >
                    {showEditPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={labelClass}>Perusahaan</label>
                  <select
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    className={inputClass}
                  >
                    <option value="PT Cakrawala Parama Internasional">PT Cakrawala Parama Internasional</option>
                    <option value="PT Yasodana Parvez Internasional">PT Yasodana Parvez Internasional</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Penempatan Kantor</label>
                  <select
                    value={editOfficeLocation}
                    onChange={(e) => setEditOfficeLocation(e.target.value as 'jakarta' | 'bogor')}
                    className={inputClass}
                  >
                    <option value="jakarta">Kantor Jakarta</option>
                    <option value="bogor">Kantor Bogor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={labelClass}>Divisi / Jabatan</label>
                  <input
                    type="text"
                    value={editDivision}
                    onChange={(e) => setEditDivision(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Status Akun</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'active' | 'inactive')}
                    className={inputClass}
                  >
                    <option value="active">Aktif (Dapat Login)</option>
                    <option value="inactive">Nonaktif (Akses Diblokir)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {submittingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
