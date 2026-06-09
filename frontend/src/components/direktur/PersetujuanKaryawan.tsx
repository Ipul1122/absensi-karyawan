import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
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
  Shield
} from 'lucide-react'

interface Employee {
  id: number
  name: string
  email: string
  role: string
  status: 'active' | 'pending' | 'pending_delete'
  join_date: string | null
}

interface PersetujuanKaryawanProps {
  token: string
}

const S = { fontFamily: "'Inter', 'system-ui', sans-serif" }

export default function PersetujuanKaryawan({ token }: PersetujuanKaryawanProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'pending' | 'pending_delete'>('pending')

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await axios.get('http://localhost:8000/api/employees', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setEmployees(res.data?.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

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
          if (res.data.status === 'success') { Swal.fire('Berhasil!', res.data.message, 'success'); fetch() }
        } catch (err: any) { Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan.', 'error') }
        finally { setActionLoading(false) }
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
          if (res.data.status === 'success') { Swal.fire('Ditolak!', res.data.message, 'success'); fetch() }
        } catch (err: any) { Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan.', 'error') }
        finally { setActionLoading(false) }
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
          if (res.data.status === 'success') { Swal.fire('Berhasil!', res.data.message, 'success'); fetch() }
        } catch (err: any) { Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan.', 'error') }
        finally { setActionLoading(false) }
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
          if (res.data.status === 'success') { Swal.fire('Dibatalkan!', res.data.message, 'success'); fetch() }
        } catch (err: any) { Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan.', 'error') }
        finally { setActionLoading(false) }
      }
    })
  }

  const pendingNew = employees.filter(e => e.status === 'pending')
  const pendingDel = employees.filter(e => e.status === 'pending_delete')
  const list = activeTab === 'pending' ? pendingNew : pendingDel

  const tabs = [
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
              <h2 className="text-base font-bold text-slate-800">Persetujuan Karyawan</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Kelola pendaftaran karyawan baru dan pengajuan penghapusan akun</p>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-600">Aksi Permanen · Hati-hati</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer border"
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
                    className="px-1.5 py-0.5 rounded-md text-[10px] font-black"
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

        {/* Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
            <p className="text-xs text-slate-400 font-medium">Memuat data karyawan...</p>
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
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
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0"
                          style={{ background: activeTab === 'pending' ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'linear-gradient(135deg,#dc2626,#b91c1c)' }}
                        >
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-slate-800">{emp.name}</span>
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
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-100">
                          <Clock className="w-3 h-3" /> Menunggu Aktivasi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-red-50 text-red-600 border border-red-100">
                          <Trash2 className="w-3 h-3" /> Pengajuan Hapus
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400 font-medium">
                      {emp.join_date ? new Date(emp.join_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => activeTab === 'pending' ? handleApprove(emp) : handleApproveDelete(emp)}
                          disabled={actionLoading}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 cursor-pointer shadow-sm disabled:opacity-50"
                          style={{ background: activeTab === 'pending' ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'linear-gradient(135deg,#dc2626,#b91c1c)' }}
                        >
                          <Check className="w-3.5 h-3.5" />
                          {activeTab === 'pending' ? 'Setujui' : 'Hapus'}
                        </button>
                        <button
                          onClick={() => activeTab === 'pending' ? handleReject(emp) : handleRejectDelete(emp)}
                          disabled={actionLoading}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          Tolak
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
    </div>
  )
}
