import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { getAssetUrl } from '../../../utils/api'
import { 
  UserMinus, 
  Loader2, 
  Check, 
  X, 
  Mail,
  UserPlus,
  UserCheck2,
  Clock,
  Trash2,
  Shield,
  BookUser,
  Calendar,
  MapPin,
  Briefcase,
  User,
  FileText,
  CheckCircle2,
  AlertCircle,
  Building2,
  Search,
  Users,
  Hash
} from 'lucide-react'

interface Employee {
  id: number
  name: string
  email: string
  role: string
  status: 'active' | 'pending' | 'pending_delete'
  join_date: string | null
}

interface EmployeeProfile {
  id: number
  name: string
  email: string
  photo: string | null
  date_of_birth: string | null
  address: string | null
  employee_number: string | null
  join_date: string | null
  gender: string | null
  division: string | null
  cv: string | null
  no_rekening: string | null
  company: string | null
  created_at: string
}

interface PersetujuanKaryawanProps {
  token: string
  onApprovalChange?: () => void
}

const S = { fontFamily: "'Inter', 'system-ui', sans-serif" }

export default function PersetujuanKaryawan({ token, onApprovalChange }: PersetujuanKaryawanProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'pending_delete'>('active')
  const [searchQuery, setSearchQuery] = useState('')

  // Detail Modal States
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<EmployeeProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)

  const handleViewBiodata = async (empId: number) => {
    setLoadingProfile(true)
    setShowDetailModal(true)
    setSelectedProfile(null)
    try {
      const res = await axios.get(`http://localhost:8000/api/employees/${empId}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data.status === 'success') {
        setSelectedProfile(res.data.data)
      }
    } catch (err) {
      console.error(err)
      Swal.fire({
        title: 'Gagal Memuat',
        text: 'Tidak dapat mengambil biodata karyawan.',
        icon: 'error',
        background: '#fffdfb',
        color: '#3c1105'
      })
      setShowDetailModal(false)
    } finally {
      setLoadingProfile(false)
    }
  }

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await axios.get('http://localhost:8000/api/employees', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setEmployees(res.data?.data || [])
      onApprovalChange?.()
    } catch (err) { 
      console.error(err) 
    } finally { 
      setLoading(false) 
    }
  }

  useEffect(() => { 
    fetch() 
  }, [])

  const handleApprove = (emp: Employee) => {
    Swal.fire({
      title: 'Setujui Pendaftaran?',
      html: `Aktifkan akun karyawan <strong>${emp.name}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Aktifkan',
      cancelButtonText: 'Batal'
    }).then(async r => {
      if (r.isConfirmed) {
        setActionLoading(true)
        try {
          const res = await axios.put(`http://localhost:8000/api/director/employees/${emp.id}/approve`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (res.data.status === 'success') { 
            Swal.fire('Berhasil!', res.data.message, 'success')
            fetch() 
          }
        } catch (err: any) { 
          Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan.', 'error') 
        } finally { 
          setActionLoading(false) 
        }
      }
    })
  }

  const handleReject = (emp: Employee) => {
    Swal.fire({
      title: 'Tolak Pendaftaran?',
      html: `Akun <strong>${emp.name}</strong> akan dihapus secara permanen.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Tolak & Hapus',
      cancelButtonText: 'Batal'
    }).then(async r => {
      if (r.isConfirmed) {
        setActionLoading(true)
        try {
          const res = await axios.put(`http://localhost:8000/api/director/employees/${emp.id}/reject`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (res.data.status === 'success') { 
            Swal.fire('Ditolak!', res.data.message, 'success')
            fetch() 
          }
        } catch (err: any) { 
          Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan.', 'error') 
        } finally { 
          setActionLoading(false) 
        }
      }
    })
  }

  const handleApproveDelete = (emp: Employee) => {
    Swal.fire({
      title: 'Setujui Penghapusan?',
      html: `Akun <strong>${emp.name}</strong> akan dihapus permanen.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus Akun',
      cancelButtonText: 'Batal'
    }).then(async r => {
      if (r.isConfirmed) {
        setActionLoading(true)
        try {
          const res = await axios.put(`http://localhost:8000/api/director/employees/${emp.id}/approve-delete`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (res.data.status === 'success') { 
            Swal.fire('Berhasil!', res.data.message, 'success')
            fetch() 
          }
        } catch (err: any) { 
          Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan.', 'error') 
        } finally { 
          setActionLoading(false) 
        }
      }
    })
  }

  const handleRejectDelete = (emp: Employee) => {
    Swal.fire({
      title: 'Tolak Pengajuan Hapus?',
      html: `Akun <strong>${emp.name}</strong> akan dikembalikan ke status aktif.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Batalkan Hapus',
      cancelButtonText: 'Batal'
    }).then(async r => {
      if (r.isConfirmed) {
        setActionLoading(true)
        try {
          const res = await axios.put(`http://localhost:8000/api/director/employees/${emp.id}/reject-delete`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (res.data.status === 'success') { 
            Swal.fire('Dibatalkan!', res.data.message, 'success')
            fetch() 
          }
        } catch (err: any) { 
          Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan.', 'error') 
        } finally { 
          setActionLoading(false) 
        }
      }
    })
  }

  const pendingNew = employees.filter(e => e.status === 'pending')
  const pendingDel = employees.filter(e => e.status === 'pending_delete')
  const activeList = employees.filter(e => e.status === 'active')
  
  const list = activeTab === 'pending' ? pendingNew : pendingDel

  const filteredActiveEmployees = activeList.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const tabs = [
    { key: 'active' as const, label: 'Daftar Karyawan', count: activeList.length, icon: Users, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.20)' },
    { key: 'pending' as const, label: 'Pendaftaran Baru', count: pendingNew.length, icon: UserPlus, color: '#4f46e5', bg: 'rgba(79,70,229,0.08)', border: 'rgba(79,70,229,0.20)' },
    { key: 'pending_delete' as const, label: 'Pengajuan Hapus', count: pendingDel.length, icon: UserMinus, color: '#dc2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.20)' },
  ]

  return (
    <div className="space-y-6" style={S}>
      {/* Header section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">Manajemen Karyawan</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Tinjau biodata seluruh staf aktif serta proses persetujuan akun masuk/keluar</p>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-600">Otoritas Direktur Utama</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key)
                  setSearchQuery('')
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer border shadow-sm"
                style={isActive ? {
                  background: tab.bg,
                  color: tab.color,
                  borderColor: tab.border,
                } : {
                  background: 'white',
                  color: '#64748b',
                  borderColor: '#e2e8f0'
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className="px-1.5 py-0.5 rounded-md text-[10px] font-black animate-pulse"
                    style={isActive
                      ? { background: tab.color, color: 'white' }
                      : { background: '#f1f5f9', color: '#64748b' }
                    }
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Search Input for Active Employees */}
        {activeTab === 'active' && (
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/20 flex justify-end">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama atau email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:border-indigo-500 bg-white transition-all font-sans"
              />
            </div>
          </div>
        )}

        {/* List Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
            <p className="text-xs text-slate-400 font-medium">Memuat data karyawan...</p>
          </div>
        ) : activeTab === 'active' ? (
          filteredActiveEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <User className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-500">Tidak ada karyawan aktif</p>
              <p className="text-xs text-slate-350 font-medium mt-1">
                {searchQuery ? 'Hasil pencarian nihil. Coba kata kunci lain.' : 'Belum ada akun karyawan aktif terdaftar.'}
              </p>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredActiveEmployees.map(emp => (
                <div 
                  key={emp.id} 
                  className="bg-slate-50/40 border border-slate-200/60 rounded-2xl p-4 flex flex-col justify-between gap-4 hover:bg-slate-50 hover:shadow-md transition-all duration-300 relative group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-orange-600 from-indigo-500 to-purple-650 flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-md">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-800 truncate leading-normal">{emp.name}</h4>
                          {emp.role === 'admin' && (
                            <span className="inline-block text-[8px] font-extrabold px-1.5 py-0.5 bg-orange-100 text-orange-600 border border-orange-200 rounded shrink-0">
                              Admin HR
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-300" />
                          {emp.email}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-xl text-[9px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Aktif
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[10px]">
                    <div className="text-slate-400 font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      <span>Bergabung: {emp.join_date ? new Date(emp.join_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</span>
                    </div>

                    <button
                      onClick={() => handleViewBiodata(emp.id)}
                      className="px-3 py-1 bg-white border border-slate-200 hover:border-indigo-300 text-indigo-650 rounded-lg font-bold text-[9px] cursor-pointer shadow-sm group-hover:bg-indigo-50/50 transition-all"
                    >
                      Biodata
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <UserCheck2 className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-400">Tidak ada pengajuan</p>
            <p className="text-xs text-slate-300 font-medium mt-1">
              {activeTab === 'pending' ? 'Belum ada karyawan baru yang menunggu persetujuan.' : 'Tidak ada pengajuan penghapusan akun.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Nama Karyawan</th>
                  <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Bergabung</th>
                  <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
                          style={{ background: activeTab === 'pending' ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'linear-gradient(135deg,#dc2626,#b91c1c)' }}
                        >
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-slate-800">{emp.name}</span>
                        {emp.role === 'admin' && (
                          <span className="inline-block text-[8px] font-extrabold px-1.5 py-0.5 bg-orange-100 text-orange-600 border border-orange-200 rounded ml-2 shrink-0">
                            Admin HR
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Mail className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        {emp.email}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {activeTab === 'pending' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-100 animate-pulse">
                          <Clock className="w-3.5 h-3.5" /> Menunggu Aktivasi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-red-50 text-red-600 border border-red-100">
                          <Trash2 className="w-3.5 h-3.5" /> Pengajuan Hapus
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400 font-medium">
                      {emp.join_date ? new Date(emp.join_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleViewBiodata(emp.id)}
                          className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 cursor-pointer shadow-sm"
                          style={{ background: activeTab === 'pending' ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'linear-gradient(135deg,#dc2626,#b91c1c)' }}
                        >
                          {activeTab === 'pending' ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Setujui 
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-3.5 h-3.5" />
                              Hapus
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Render Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md my-8 overflow-hidden animate-zoom-in flex flex-col max-h-[90vh]">
            {/* Header gradient bar */}
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shrink-0" />
            <div className="p-6 flex flex-col flex-grow overflow-hidden">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-600 from-indigo-500 to-purple-650 flex items-center justify-center shadow-md">
                    <BookUser className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 font-quicksand">
                      {activeTab === 'pending' ? 'Persetujuan Karyawan Baru' : activeTab === 'pending_delete' ? 'Persetujuan Hapus Karyawan' : 'Detail Biodata Karyawan'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-quicksand">
                      {activeTab === 'active' ? 'Tinjau parameter lengkap dari database' : 'Tinjau biodata sebelum memproses persetujuan'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowDetailModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {loadingProfile ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400 flex-1">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                  <span className="text-xs font-quicksand text-slate-400">Memuat profil...</span>
                </div>
              ) : selectedProfile ? (
                <div className="space-y-4 text-slate-700 overflow-y-auto pr-1 flex-grow">
                  {/* Photo + Name */}
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    {selectedProfile.photo ? (
                      <img src={getAssetUrl(selectedProfile.photo)} alt="Foto"
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 shadow-sm shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-orange-600 from-indigo-150 to-purple-150 flex items-center justify-center shrink-0 border border-slate-200 text-indigo-300">
                        <User className="w-7 h-7" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800 font-quicksand truncate">{selectedProfile.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">{selectedProfile.email}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedProfile.employee_number && (
                          <span className="inline-block text-[10px] font-bold font-mono px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full">
                            #{selectedProfile.employee_number}
                          </span>
                        )}
                        {selectedProfile.division && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-full">
                            <Building2 className="w-2.5 h-2.5" />
                            {selectedProfile.division}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Jenis Kelamin', value: selectedProfile.gender === 'male' ? 'Laki-laki' : selectedProfile.gender === 'female' ? 'Perempuan' : '-', icon: <User className="w-3 h-3" /> },
                      { label: 'Tanggal Lahir', value: selectedProfile.date_of_birth ? new Date(selectedProfile.date_of_birth).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-', icon: <Calendar className="w-3 h-3" /> },
                      { label: 'Tanggal Bergabung', value: selectedProfile.join_date ? new Date(selectedProfile.join_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-', icon: <Briefcase className="w-3 h-3" /> },
                      { label: 'Terdaftar Sistem', value: selectedProfile.created_at ? new Date(selectedProfile.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-', icon: <Hash className="w-3 h-3" /> },
                      { label: 'No. Rekening', value: selectedProfile.no_rekening || '-', icon: <Hash className="w-3 h-3" /> },
                      { label: 'Perusahaan', value: selectedProfile.company || '-', icon: <Building2 className="w-3 h-3" /> },
                    ].map(item => (
                      <div key={item.label} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1 text-slate-400 mb-1">
                          {item.icon}
                          <span className="text-[9px] uppercase tracking-wider font-extrabold font-quicksand">{item.label}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 font-quicksand">{item.value}</p>
                      </div>
                    ))}
                  </div>

                    {/* Alamat */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-1 text-slate-400 mb-1">
                        <MapPin className="w-3 h-3" />
                        <span className="text-[9px] uppercase tracking-wider font-extrabold font-quicksand">Alamat Rumah</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 font-quicksand leading-relaxed">
                        {selectedProfile.address || <span className="italic text-slate-400">Belum diisi</span>}
                      </p>
                    </div>

                  {/* CV Document */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-quicksand">
                    <div className="flex items-center gap-1 text-slate-400 mb-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="text-[9px] uppercase tracking-wider font-extrabold font-quicksand">Curriculum Vitae (CV)</span>
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
                          className="px-2.5 py-1 bg-orange-600 from-indigo-500 to-purple-650 hover:brightness-110 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Lihat / Unduh
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs font-semibold text-slate-400 italic">Belum diunggah</p>
                    )}
                  </div>

                  {/* Completeness indicator */}
                  {(() => {
                    const fields = [
                      selectedProfile.photo,
                      selectedProfile.date_of_birth,
                      selectedProfile.address,
                      selectedProfile.employee_number,
                      selectedProfile.join_date,
                      selectedProfile.gender,
                      selectedProfile.cv,
                      selectedProfile.no_rekening,
                      selectedProfile.company
                    ]
                    const filled = fields.filter(Boolean).length
                    const pct = Math.round((filled / fields.length) * 100)
                    return (
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                        {pct === 100 ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
                        <div className="flex-grow">
                          <div className="flex justify-between mb-1">
                            <span className="text-[10px] font-bold text-slate-500 font-quicksand">Kelengkapan Biodata</span>
                            <span className={`text-[10px] font-bold font-mono ${pct === 100 ? 'text-emerald-600' : 'text-amber-500'}`}>{pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-400 to-indigo-500'}`}
                              style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Actions inside Modal */}
                  {activeTab !== 'active' ? (
                    <div className="flex gap-2 pt-4 border-t border-slate-100 mt-4 shrink-0">
                      <button
                        onClick={() => {
                          setShowDetailModal(false)
                          const matchingEmp = employees.find(e => e.id === selectedProfile.id)
                          if (matchingEmp) {
                            if (activeTab === 'pending') {
                              handleApprove(matchingEmp)
                            } else {
                              handleApproveDelete(matchingEmp)
                            }
                          }
                        }}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-orange-600 from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {activeTab === 'pending' ? 'Setujui' : 'Hapus'}
                      </button>
                      <button
                        onClick={() => {
                          setShowDetailModal(false)
                          const matchingEmp = employees.find(e => e.id === selectedProfile.id)
                          if (matchingEmp) {
                            if (activeTab === 'pending') {
                              handleReject(matchingEmp)
                            } else {
                              handleRejectDelete(matchingEmp)
                            }
                          }
                        }}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Tolak
                      </button>
                    </div>
                  ) : (
                    <div className="flex pt-4 border-t border-slate-100 mt-4 shrink-0">
                      <button
                        onClick={() => setShowDetailModal(false)}
                        className="w-full py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
                      >
                        Tutup
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-slate-400 flex-grow">
                  <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
                  <p className="text-xs font-quicksand">Gagal memuat detail profil.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
