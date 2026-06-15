import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { 
  FileCheck, 
  Loader2, 
  Check, 
  X, 
  Calendar, 
  Clock, 
  Receipt, 
  Gift, 
  CalendarDays,
  ExternalLink,
  CheckCircle2,
  Package
} from 'lucide-react'

interface UserBrief { id: number; name: string; email: string }

interface LeaveRequest {
  id: number; user_id: number; category: string; custom_category: string | null
  start_date: string; end_date: string; reason: string; image: string | null
  status: string; admin_notes: string | null; user: UserBrief
}

interface OvertimeRequest {
  id: number; user_id: number; date: string; start_time: string; end_time: string
  duration: number; reason: string; status: string; admin_notes: string | null; user: UserBrief
}

interface ReimbursementRequest {
  id: number; user_id: number; title: string; category: string; amount: number
  expense_date: string; description: string | null; receipt_path: string; status: string
  admin_notes: string | null; user: UserBrief
}

interface BonusRequest {
  id: number; user_id: number; bonus_amount: number; bonus_date: string
  description: string | null; status: string; user: UserBrief
}

interface InventoryRequest {
  id: number
  nama_barang: string
  tanggal_pembelian: string
  harga: number
  foto: string | null
  lokasi: string
  struk_pembelian: string | null
  pemakai_barang: string | null
  kondisi_barang: 'ori' | 'second'
  status: string
  admin_notes: string | null
}

interface PersetujuanOperationalProps { token: string }
type ActiveSubTab = 'cuti' | 'lembur' | 'reimbursement' | 'bonus' | 'inventaris'

const S = { fontFamily: "'Inter', 'system-ui', sans-serif" }

const tabDefs = [
  { key: 'cuti' as const, label: 'Cuti', icon: CalendarDays, color: '#4f46e5', bg: 'rgba(79,70,229,0.08)', border: 'rgba(79,70,229,0.20)', gradient: 'linear-gradient(135deg,#4f46e5,#7c3aed)' },
  { key: 'lembur' as const, label: 'Lembur', icon: Clock, color: '#d97706', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.20)', gradient: 'linear-gradient(135deg,#d97706,#b45309)' },
  { key: 'reimbursement' as const, label: 'Klaim Biaya', icon: Receipt, color: '#0891b2', bg: 'rgba(8,145,178,0.08)', border: 'rgba(8,145,178,0.20)', gradient: 'linear-gradient(135deg,#0891b2,#0e7490)' },
  { key: 'bonus' as const, label: 'Bonus', icon: Gift, color: '#059669', bg: 'rgba(5,150,105,0.08)', border: 'rgba(5,150,105,0.20)', gradient: 'linear-gradient(135deg,#059669,#047857)' },
  { key: 'inventaris' as const, label: 'Inventaris', icon: Package, color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.20)', gradient: 'linear-gradient(135deg,#f97316,#ea580c)' },
]

export default function PersetujuanOperational({ token }: PersetujuanOperationalProps) {
  const [activeTab, setActiveTab] = useState<ActiveSubTab>('cuti')
  const [loading, setLoading] = useState(true)
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [overtimes, setOvertimes] = useState<OvertimeRequest[]>([])
  const [reimbursements, setReimbursements] = useState<ReimbursementRequest[]>([])
  const [bonuses, setBonuses] = useState<BonusRequest[]>([])
  const [inventories, setInventories] = useState<InventoryRequest[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const [r1, r2, r3, r4, r5] = await Promise.all([
        axios.get('http://localhost:8000/api/admin/leaves', { headers }).catch(() => ({ data: { data: [] } })),
        axios.get('http://localhost:8000/api/admin/overtimes', { headers }).catch(() => ({ data: { data: [] } })),
        axios.get('http://localhost:8000/api/admin/reimbursements', { headers }).catch(() => ({ data: { data: [] } })),
        axios.get('http://localhost:8000/api/admin/bonuses', { headers }).catch(() => ({ data: { data: [] } })),
        axios.get('http://localhost:8000/api/admin/inventories', { headers }).catch(() => ({ data: { data: [] } })),
      ])
      setLeaves(r1.data?.data || [])
      setOvertimes(r2.data?.data || [])
      setReimbursements(r3.data?.data || [])
      setBonuses(r4.data?.data || [])
      setInventories(r5.data?.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const fmt = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

  const formatTime = (timeString: string) => {
    if (!timeString) return ''
    const cleanTime = timeString.substring(0, 5)
    const [hourStr] = cleanTime.split(':')
    const hour = parseInt(hourStr, 10)
    
    let period = 'malam'
    if (hour >= 4 && hour < 11) {
      period = 'pagi'
    } else if (hour >= 11 && hour < 15) {
      period = 'siang'
    } else if (hour >= 15 && hour < 18) {
      period = 'sore'
    }
    
    return `${cleanTime} ${period}`
  }

  const pendingLeaves = leaves.filter(l => l.status === 'pending_director')
  const pendingOvertimes = overtimes.filter(o => o.status === 'pending_director')
  const pendingReimbursements = reimbursements.filter(r => r.status === 'pending_director')
  const pendingBonuses = bonuses.filter(b => b.status === 'pending')
  const pendingInventories = inventories.filter(i => i.status === 'pending')

  const counts: Record<ActiveSubTab, number> = {
    cuti: pendingLeaves.length,
    lembur: pendingOvertimes.length,
    reimbursement: pendingReimbursements.length,
    bonus: pendingBonuses.length,
    inventaris: pendingInventories.length
  }

  // Actions
  const approve = async (url: string, name?: string, imageUrl?: string) => {
    const swalOptions: any = {
      title: 'Setujui Pengajuan?',
      html: name ? `Apakah Anda yakin ingin menyetujui pengajuan untuk <strong>${name}</strong>?` : 'Apakah Anda yakin ingin menyetujui pengajuan ini?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Setujui',
      cancelButtonText: 'Batal'
    }
    if (imageUrl) {
      swalOptions.imageUrl = imageUrl
      swalOptions.imageHeight = 200
      swalOptions.imageAlt = 'Bukti Nota Pembelian'
      delete swalOptions.icon
    }

    const result = await Swal.fire(swalOptions)
    if (result.isConfirmed) {
      try {
        const res = await axios.put(url, {}, { headers: { Authorization: `Bearer ${token}` } })
        if (res.data.status === 'success') { 
          Swal.fire({
            title: 'Berhasil!',
            text: res.data.message,
            icon: 'success',
            confirmButtonColor: '#10b981'
          })
          fetchData() 
        }
      } catch (err: any) { Swal.fire('Gagal', err.response?.data?.message || 'Gagal.', 'error') }
    }
  }

  const rejectWithNotes = async (url: string, fieldName: string, imageUrl?: string) => {
    const swalOptions: any = {
      title: 'Alasan Penolakan',
      input: 'textarea',
      inputLabel: fieldName,
      inputPlaceholder: 'Tulis alasan penolakan...',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Tolak',
      cancelButtonText: 'Batal',
      inputValidator: v => { if (!v) return 'Alasan penolakan wajib diisi!' }
    }
    if (imageUrl) {
      swalOptions.imageUrl = imageUrl
      swalOptions.imageHeight = 200
      swalOptions.imageAlt = 'Bukti Nota Pembelian'
    }

    const { value: notes } = await Swal.fire(swalOptions)
    if (notes) {
      try {
        const res = await axios.put(url, { admin_notes: notes }, { headers: { Authorization: `Bearer ${token}` } })
        if (res.data.status === 'success') { Swal.fire('Ditolak!', res.data.message, 'success'); fetchData() }
      } catch (err: any) { Swal.fire('Gagal', err.response?.data?.message || 'Gagal.', 'error') }
    }
  }

  const rejectSimple = async (url: string, name: string, imageUrl?: string) => {
    const swalOptions: any = {
      title: 'Tolak Pengajuan?',
      html: `Yakin menolak pengajuan untuk <strong>${name}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Tolak',
      cancelButtonText: 'Batal'
    }
    if (imageUrl) {
      swalOptions.imageUrl = imageUrl
      swalOptions.imageHeight = 200
      swalOptions.imageAlt = 'Bukti Nota Pembelian'
      delete swalOptions.icon
    }

    const result = await Swal.fire(swalOptions)
    if (result.isConfirmed) {
      try {
        const res = await axios.put(url, {}, { headers: { Authorization: `Bearer ${token}` } })
        if (res.data.status === 'success') { Swal.fire('Ditolak!', res.data.message, 'success'); fetchData() }
      } catch (err: any) { Swal.fire('Gagal', err.response?.data?.message || 'Gagal.', 'error') }
    }
  }

  const currentTab = tabDefs.find(t => t.key === activeTab)!

  const ActionButtons = ({ approveUrl, rejectUrl, rejectLabel, name, simpleReject = false, imageUrl }: {
    approveUrl: string; rejectUrl: string; rejectLabel?: string; name: string; simpleReject?: boolean; imageUrl?: string
  }) => (
    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        onClick={() => simpleReject ? rejectSimple(rejectUrl, name, imageUrl) : rejectWithNotes(rejectUrl, rejectLabel || 'Alasan', imageUrl)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
      >
        <X className="w-3.5 h-3.5" /> Tolak
      </button>
      <button
        onClick={() => approve(approveUrl, name, imageUrl)}
        className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 cursor-pointer shadow-sm"
        style={{ background: currentTab.gradient }}
      >
        <Check className="w-3.5 h-3.5" /> Setujui
      </button>
    </div>
  )

  return (
    <div className="space-y-6" style={S}>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md" style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Persetujuan Operasional SDM</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Proses pengajuan cuti, lembur, klaim biaya, dan bonus karyawan</p>
            </div>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex flex-wrap gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          {tabDefs.map(tab => {
            const Icon = tab.icon
            const isAct = activeTab === tab.key
            const cnt = counts[tab.key]
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer border"
                style={isAct ? {
                  background: tab.bg,
                  color: tab.color,
                  borderColor: tab.border
                } : {
                  background: 'white',
                  color: '#64748b',
                  borderColor: '#e2e8f0'
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {cnt > 0 && (
                  <span
                    className="px-1.5 py-0.5 rounded-md text-[10px] font-black"
                    style={isAct ? { background: tab.color, color: 'white' } : { background: '#f1f5f9', color: '#64748b' }}
                  >
                    {cnt}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin mb-2" style={{ color: currentTab.color }} />
            <p className="text-xs text-slate-400 font-medium">Memuat data operasional...</p>
          </div>
        ) : (

          /* ── CUTI ── */
          activeTab === 'cuti' ? (
            pendingLeaves.length === 0 ? (
              <EmptyState text="Tidak ada pengajuan cuti yang menunggu persetujuan." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Karyawan</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Kategori & Tanggal</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Alasan</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Bukti</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingLeaves.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6"><EmployeeCell name={r.user?.name} email={r.user?.email} gradient={currentTab.gradient} /></td>
                        <td className="py-4 px-6">
                          <span className="inline-block px-2 py-0.5 rounded-lg text-[9px] font-black mb-1.5 uppercase tracking-wider" style={{ background: currentTab.bg, color: currentTab.color, border: `1px solid ${currentTab.border}` }}>
                            {r.category === 'LAINNYA' ? r.custom_category : r.category}
                          </span>
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-300 shrink-0" />
                            {new Date(r.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} — {new Date(r.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </td>
                        <td className="py-4 px-6 max-w-[200px]">
                          <p className="text-xs text-slate-500 font-medium truncate" title={r.reason}>{r.reason}</p>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {r.image ? (
                            <a href={`http://localhost:8000${r.image}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold hover:underline" style={{ color: currentTab.color }}>
                              <ExternalLink className="w-3 h-3" /> Lihat
                            </a>
                          ) : <span className="text-slate-300 text-xs">-</span>}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <ActionButtons
                            approveUrl={`http://localhost:8000/api/director/leaves/${r.id}/approve`}
                            rejectUrl={`http://localhost:8000/api/director/leaves/${r.id}/reject`}
                            rejectLabel="Alasan Penolakan Cuti"
                            name={r.user?.name}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )

          /* ── LEMBUR ── */
          ) : activeTab === 'lembur' ? (
            pendingOvertimes.length === 0 ? (
              <EmptyState text="Tidak ada pengajuan lembur yang menunggu persetujuan." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Karyawan</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Tanggal & Durasi</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Jam</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Alasan</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingOvertimes.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6"><EmployeeCell name={r.user?.name} email={r.user?.email} gradient={currentTab.gradient} /></td>
                        <td className="py-4 px-6">
                          <p className="text-xs font-semibold text-slate-700">{new Date(r.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-lg text-[10px] font-black" style={{ background: currentTab.bg, color: currentTab.color, border: `1px solid ${currentTab.border}` }}>{r.duration} jam</span>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-300" /> {formatTime(r.start_time)} – {formatTime(r.end_time)}
                          </p>
                        </td>
                        <td className="py-4 px-6 max-w-[180px]">
                          <p className="text-xs text-slate-500 font-medium truncate" title={r.reason}>{r.reason}</p>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <ActionButtons
                            approveUrl={`http://localhost:8000/api/director/overtimes/${r.id}/approve`}
                            rejectUrl={`http://localhost:8000/api/director/overtimes/${r.id}/reject`}
                            rejectLabel="Alasan Penolakan Lembur"
                            name={r.user?.name}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )

          /* ── REIMBURSEMENT ── */
          ) : activeTab === 'reimbursement' ? (
            pendingReimbursements.length === 0 ? (
              <EmptyState text="Tidak ada klaim biaya yang menunggu persetujuan." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Karyawan</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Judul & Kategori</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Nominal</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Nota</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingReimbursements.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6"><EmployeeCell name={r.user?.name} email={r.user?.email} gradient={currentTab.gradient} /></td>
                        <td className="py-4 px-6">
                          <p className="text-xs font-semibold text-slate-800">{r.title}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="inline-block px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider" style={{ background: currentTab.bg, color: currentTab.color, border: `1px solid ${currentTab.border}` }}>{r.category}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{new Date(r.expense_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="text-sm font-black text-slate-800">{fmt(r.amount)}</span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {r.receipt_path ? (
                            <a href={`http://localhost:8000${r.receipt_path}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold hover:underline" style={{ color: currentTab.color }}>
                              <ExternalLink className="w-3 h-3" /> Nota
                            </a>
                          ) : <span className="text-slate-300 text-xs">-</span>}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <ActionButtons
                            approveUrl={`http://localhost:8000/api/director/reimbursements/${r.id}/approve`}
                            rejectUrl={`http://localhost:8000/api/director/reimbursements/${r.id}/reject`}
                            rejectLabel="Alasan Penolakan Klaim"
                            name={r.user?.name}
                            imageUrl={r.receipt_path ? `http://localhost:8000${r.receipt_path}` : undefined}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )

          /* ── BONUS ── */
          ) : activeTab === 'bonus' ? (
            pendingBonuses.length === 0 ? (
              <EmptyState text="Tidak ada pengajuan bonus yang menunggu persetujuan." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Karyawan</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Tanggal Pembagian</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Nominal Bonus</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Keterangan</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingBonuses.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6"><EmployeeCell name={r.user?.name} email={r.user?.email} gradient={currentTab.gradient} /></td>
                        <td className="py-4 px-6 text-xs font-medium text-slate-500">
                          {new Date(r.bonus_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="text-sm font-black text-slate-800">{fmt(r.bonus_amount)}</span>
                        </td>
                        <td className="py-4 px-6 max-w-[180px]">
                          <p className="text-xs text-slate-400 font-medium truncate" title={r.description || ''}>{r.description || '-'}</p>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <ActionButtons
                            approveUrl={`http://localhost:8000/api/director/bonuses/${r.id}/approve`}
                            rejectUrl={`http://localhost:8000/api/director/bonuses/${r.id}/reject`}
                            name={r.user?.name}
                            simpleReject
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* ── INVENTARIS ── */
            pendingInventories.length === 0 ? (
              <EmptyState text="Tidak ada pengajuan inventaris barang yang menunggu persetujuan." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Barang</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Tgl Pembelian & Harga</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Detail</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Berkas</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {pendingInventories.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden bg-slate-50 shadow-sm" style={{ background: currentTab.bg, borderColor: currentTab.border }}>
                              {r.foto ? (
                                <img src={`http://localhost:8000${r.foto}`} alt={r.nama_barang} className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-extrabold text-xs" style={{ color: currentTab.color }}>{r.nama_barang?.charAt(0)?.toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{r.nama_barang}</p>
                              <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase bg-slate-50 text-slate-500 border-slate-200">
                                {r.kondisi_barang}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-xs text-slate-500 font-medium">
                            {new Date(r.tanggal_pembelian).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-xs font-black text-slate-800 mt-1">{fmt(r.harga)}</p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-xs text-slate-600 font-medium"><span className="text-slate-400 font-semibold">Lokasi:</span> {r.lokasi}</p>
                          <p className="text-xs text-slate-600 font-medium mt-1">
                            <span className="text-slate-400 font-semibold">Pemakai:</span> {r.pemakai_barang || 'Kantor'}
                          </p>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex flex-col gap-1 items-center justify-center">
                            {r.struk_pembelian ? (
                              <a href={`http://localhost:8000${r.struk_pembelian}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold hover:underline" style={{ color: currentTab.color }}>
                                <ExternalLink className="w-3 h-3" /> Struk
                              </a>
                            ) : <span className="text-slate-300 text-[10px] font-medium">-</span>}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <ActionButtons
                            approveUrl={`http://localhost:8000/api/director/inventories/${r.id}/approve`}
                            rejectUrl={`http://localhost:8000/api/director/inventories/${r.id}/reject`}
                            rejectLabel="Alasan Penolakan Barang Inventaris"
                            name={r.nama_barang}
                            imageUrl={r.foto ? `http://localhost:8000${r.foto}` : undefined}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )
        )}
      </div>
    </div>
  )
}

// Sub-components
function EmployeeCell({ name, email, gradient }: { name: string; email: string; gradient: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0" style={{ background: gradient }}>
        {name?.charAt(0)?.toUpperCase()}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">{name}</p>
        <p className="text-[10px] text-slate-400 font-medium">{email}</p>
      </div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
      </div>
      <p className="text-sm font-semibold text-slate-400">Tidak ada pengajuan</p>
      <p className="text-xs text-slate-300 font-medium mt-1 text-center max-w-xs">{text}</p>
    </div>
  )
}
