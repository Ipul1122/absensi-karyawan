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
  Hash,
  Phone
} from 'lucide-react'

interface Employee {
  id: number
  name: string
  email: string
  role: string
  status: 'active' | 'pending' | 'pending_delete'
  join_date: string | null
  photo?: string | null
  whatsapp?: string | null
  division?: string | null
  company?: string | null
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
  whatsapp: string | null
}

interface PersetujuanKaryawanProps {
  token: string
  onApprovalChange?: () => void
}

const formatWaNumber = (phone: string | null | undefined): string => {
  if (!phone) return ''
  let cleanPhone = phone.trim().replace(/\D/g, '')
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.substring(1)
  }
  return cleanPhone
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
                      {emp.photo ? (
                        <img 
                          src={getAssetUrl(emp.photo)} 
                          alt={emp.name}
                          className="w-9 h-9 rounded-xl object-cover shadow-md shrink-0 border border-slate-200" 
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-orange-600 from-indigo-500 to-purple-650 flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-md">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                      )}
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
                          <Mail className="w-3 h-3 text-slate-350" />
                          {emp.email}
                        </p>
                        {emp.whatsapp && (
                          <p className="text-[10px] text-slate-500 font-bold truncate flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                            <a
                              href={`https://wa.me/${formatWaNumber(emp.whatsapp)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 hover:underline"
                            >
                              {emp.whatsapp}
                            </a>
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {emp.division && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-violet-50 text-violet-600 border border-violet-100">
                              {emp.division}
                            </span>
                          )}
                          {emp.company && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                              {emp.company.replace('PT ', '')}
                            </span>
                          )}
                        </div>
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
                  <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Kontak</th>
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
                        {emp.photo ? (
                          <img 
                            src={getAssetUrl(emp.photo)} 
                            alt={emp.name} 
                            className="w-8 h-8 rounded-xl object-cover shadow-sm shrink-0 border border-slate-200" 
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
                            style={{ background: activeTab === 'pending' ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'linear-gradient(135deg,#dc2626,#b91c1c)' }}
                          >
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-sm font-semibold text-slate-800 block truncate">{emp.name}</span>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {emp.role === 'admin' && (
                              <span className="inline-block text-[8px] font-extrabold px-1.5 py-0.5 bg-orange-100 text-orange-600 border border-orange-200 rounded shrink-0">
                                Admin HR
                              </span>
                            )}
                            {emp.division && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-violet-50 text-violet-600 border border-violet-100">
                                {emp.division}
                              </span>
                            )}
                            {emp.company && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                {emp.company.replace('PT ', '')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <Mail className="w-3.5 h-3.5 text-slate-350 shrink-0" />
                          <span>{emp.email}</span>
                        </div>
                        {emp.whatsapp && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-550 font-medium">
                            <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <a
                              href={`https://wa.me/${formatWaNumber(emp.whatsapp)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-650 hover:text-indigo-800 hover:underline font-semibold"
                            >
                              {emp.whatsapp}
                            </a>
                          </div>
                        )}
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden animate-zoom-in flex flex-col max-h-[90vh]">
            {/* Header gradient bar */}
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shrink-0" />
            <div className="p-6 md:p-8 flex flex-col flex-grow overflow-hidden">
              <div className="flex items-center justify-between pb-5 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-inner border border-indigo-100/50">
                    <BookUser className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 font-quicksand leading-tight">
                      {activeTab === 'pending' ? 'Persetujuan Karyawan Baru' : activeTab === 'pending_delete' ? 'Persetujuan Hapus Karyawan' : 'Detail Biodata Karyawan'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-quicksand mt-0.5">
                      {activeTab === 'active' ? 'Tinjau parameter lengkap dari database' : 'Tinjau biodata sebelum memproses persetujuan'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowDetailModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {loadingProfile ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 flex-grow">
                  <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
                  <span className="text-xs font-quicksand text-slate-500">Memuat profil...</span>
                </div>
              ) : selectedProfile ? (
                <div className="flex-grow overflow-y-auto mt-6 pr-2 space-y-6 scrollbar-thin">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
                    {/* Left Column: Avatar & Summary Card */}
                    <div className="md:col-span-2 space-y-5">
                      <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200/50 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                        {/* Decorative Background Glow */}
                        <div className="absolute -top-12 -left-12 w-28 h-28 bg-indigo-200/20 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute -bottom-12 -right-12 w-28 h-28 bg-purple-200/20 rounded-full blur-2xl pointer-events-none" />

                        {/* Photo/Avatar container */}
                        <div className="relative group mb-4">
                          {selectedProfile.photo ? (
                            <div className="relative p-1 bg-white rounded-2xl shadow-md border border-slate-200/80 transition-all duration-300 hover:shadow-lg">
                              <img 
                                src={getAssetUrl(selectedProfile.photo)} 
                                alt="Foto Profil"
                                className="w-24 h-24 rounded-xl object-cover" 
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-650 p-[1px] shadow-md">
                              <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center">
                                <span className="text-3xl font-extrabold bg-gradient-to-br from-indigo-500 to-purple-650 bg-clip-text text-transparent">
                                  {selectedProfile.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                          )}
                          {/* Status Badge */}
                          <div className="absolute -bottom-2 -right-2">
                            {activeTab === 'active' ? (
                              <span className="flex h-5 items-center px-2.5 rounded-full text-[9px] font-bold bg-emerald-500 text-white shadow-sm border border-emerald-400">
                                Aktif
                              </span>
                            ) : activeTab === 'pending' ? (
                              <span className="flex h-5 items-center px-2.5 rounded-full text-[9px] font-bold bg-amber-500 text-white shadow-sm border border-amber-400 animate-pulse">
                                Pending
                              </span>
                            ) : (
                              <span className="flex h-5 items-center px-2.5 rounded-full text-[9px] font-bold bg-rose-500 text-white shadow-sm border border-rose-400">
                                Hapus
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Name & Email */}
                        <h4 className="text-sm font-bold text-slate-800 leading-snug break-words max-w-full px-1">{selectedProfile.name}</h4>
                        <p className="text-[11px] text-slate-400 font-mono mt-1 break-all px-2">{selectedProfile.email}</p>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1.5 justify-center mt-4">
                          {selectedProfile.employee_number ? (
                            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] font-bold font-mono">
                              NIP: {selectedProfile.employee_number}
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-full text-[10px] font-semibold font-mono">
                              No NIP
                            </span>
                          )}
                          {selectedProfile.division && (
                            <span className="px-2.5 py-0.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-full text-[10px] font-bold">
                              {selectedProfile.division}
                            </span>
                          )}
                        </div>

                        <div className="w-full border-t border-slate-200/50 my-4 shrink-0" />

                        {/* Completeness Indicator */}
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
                            <div className="w-full text-left space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200/40">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-quicksand">Kelengkapan</span>
                                <span className={`text-[10px] font-bold font-mono ${pct === 100 ? 'text-emerald-600' : 'text-amber-500'}`}>{pct}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-400 to-indigo-500'}`}
                                  style={{ width: `${pct}%` }} />
                              </div>
                              <p className="text-[9px] text-slate-400 leading-normal font-medium">
                                {pct === 100 ? 'Biodata lengkap & siap bekerja.' : 'Sebagian biodata belum dilengkapi.'}
                              </p>
                            </div>
                          )
                        })()}
                      </div>
                    </div>

                    {/* Right Column: Detailed Profiles Cards */}
                    <div className="md:col-span-3 space-y-6">
                      {/* Section 1: Informasi Personal */}
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-500 flex items-center gap-1.5 px-0.5">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                          Informasi Personal
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-3 bg-slate-50/50 border border-slate-200/60 rounded-xl hover:bg-slate-50 transition-colors">
                            <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-quicksand">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Jenis Kelamin</span>
                            </div>
                            <span className="text-xs font-bold text-slate-700">
                              {selectedProfile.gender === 'male' ? 'Laki-laki' : selectedProfile.gender === 'female' ? 'Perempuan' : '-'}
                            </span>
                          </div>
                          <div className="p-3 bg-slate-50/50 border border-slate-200/60 rounded-xl hover:bg-slate-50 transition-colors">
                            <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-quicksand">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Tanggal Lahir</span>
                            </div>
                            <span className="text-xs font-bold text-slate-700">
                              {selectedProfile.date_of_birth ? new Date(selectedProfile.date_of_birth).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                            </span>
                          </div>
                          <div className="p-3 bg-slate-50/50 border border-slate-200/60 rounded-xl hover:bg-slate-50 transition-colors sm:col-span-2">
                            <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-quicksand">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Alamat Rumah</span>
                            </div>
                            <span className="text-xs font-semibold text-slate-700 leading-relaxed block">
                              {selectedProfile.address || <span className="italic text-slate-400 font-normal">Belum diisi</span>}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Pekerjaan & Keuangan */}
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-violet-500 flex items-center gap-1.5 px-0.5">
                          <span className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
                          Pekerjaan & Finansial
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-3 bg-slate-50/50 border border-slate-200/60 rounded-xl hover:bg-slate-50 transition-colors">
                            <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-quicksand">
                              <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Tanggal Bergabung</span>
                            </div>
                            <span className="text-xs font-bold text-slate-700">
                              {selectedProfile.join_date ? new Date(selectedProfile.join_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                            </span>
                          </div>
                          <div className="p-3 bg-slate-50/50 border border-slate-200/60 rounded-xl hover:bg-slate-50 transition-colors">
                            <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-quicksand">
                              <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Terdaftar Sistem</span>
                            </div>
                            <span className="text-xs font-bold text-slate-700">
                              {selectedProfile.created_at ? new Date(selectedProfile.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                            </span>
                          </div>
                          <div className="p-3 bg-slate-50/50 border border-slate-200/60 rounded-xl hover:bg-slate-50 transition-colors">
                            <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-quicksand">
                              <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>No. Rekening</span>
                            </div>
                            <span className="text-xs font-bold text-slate-700">
                              {selectedProfile.no_rekening || '-'}
                            </span>
                          </div>
                          <div className="p-3 bg-slate-50/50 border border-slate-200/60 rounded-xl hover:bg-slate-50 transition-colors">
                            <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-quicksand">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Perusahaan</span>
                            </div>
                            <span className="text-xs font-bold text-slate-700">
                              {selectedProfile.company || '-'}
                            </span>
                          </div>
                          <div className="p-3 bg-slate-50/50 border border-slate-200/60 rounded-xl hover:bg-slate-50 transition-colors sm:col-span-2">
                            <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-quicksand">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>WhatsApp / No. Telp</span>
                            </div>
                            {selectedProfile.whatsapp ? (
                              <a 
                                href={`https://wa.me/${formatWaNumber(selectedProfile.whatsapp)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold text-indigo-650 hover:text-indigo-800 transition-colors inline-flex items-center gap-1.5 hover:underline"
                              >
                                <span>{selectedProfile.whatsapp}</span>
                                <span className="text-[8px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 flex items-center gap-0.5">
                                  Hubungi Karyawan
                                </span>
                              </a>
                            ) : (
                              <span className="text-xs font-bold text-slate-700">-</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Pendukung Dokumen */}
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500 flex items-center gap-1.5 px-0.5">
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                          Dokumen Penunjang
                        </h5>
                        <div className="p-3.5 bg-slate-50/50 border border-slate-200/60 rounded-xl">
                          <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-quicksand">
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Curriculum Vitae (CV)</span>
                          </div>
                          {selectedProfile.cv ? (
                            <div className="flex items-center justify-between gap-3 bg-white p-3 border border-slate-200/60 rounded-xl shadow-sm">
                              <div className="min-w-0 flex-1 flex items-center gap-2.5">
                                <div className="w-9 h-9 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-center text-rose-500 shrink-0">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-slate-700 truncate">cv_karyawan.pdf</p>
                                  <p className="text-[9px] font-semibold text-slate-400 uppercase font-mono">Dokumen PDF</p>
                                </div>
                              </div>
                              <a
                                href={getAssetUrl(selectedProfile.cv)}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-650 hover:brightness-105 active:scale-95 text-white rounded-lg text-[10px] font-extrabold transition-all cursor-pointer shadow-sm tracking-wide text-center shrink-0"
                              >
                                Buka Dokumen
                              </a>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 py-1.5">
                              <span className="text-xs font-semibold text-slate-400 italic">Belum diunggah</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions inside Modal */}
                  {activeTab !== 'active' ? (
                    <div className="flex gap-3 pt-6 border-t border-slate-100 shrink-0">
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
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-105 hover:shadow-lg hover:shadow-indigo-100 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-indigo-50"
                      >
                        <Check className="w-4 h-4" />
                        {activeTab === 'pending' ? 'Setujui Pendaftaran' : 'Setujui Hapus Akun'}
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
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        Tolak Pengajuan
                      </button>
                    </div>
                  ) : (
                    <div className="flex pt-6 border-t border-slate-100 shrink-0">
                      <button
                        onClick={() => setShowDetailModal(false)}
                        className="w-full py-3 bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm text-center"
                      >
                        Tutup Detail
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 flex-grow">
                  <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
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
