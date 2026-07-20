import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import {
  Wallet,
  Loader2,
  Check,
  X,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Search,
  Users,
  AlertCircle,
  XCircle,
  Clock,
  BadgeCheck
} from 'lucide-react'

interface SalaryConfig {
  id: number
  user_id: number
  basic_salary: number
  allowance_meal_daily: number
  allowance_transport_daily: number
  allowance_position: number
  deduction_late_daily: number
  deduction_absence_daily: number
  deduction_fixed: number
  pending_basic_salary: number | null
  pending_allowance_meal_daily: number | null
  pending_allowance_transport_daily: number | null
  pending_allowance_position: number | null
  pending_deduction_late_daily: number | null
  pending_deduction_absence_daily: number | null
  pending_deduction_fixed: number | null
  salary_change_status: 'none' | 'pending' | 'approved' | 'rejected'
}

interface EmployeeWithConfig {
  id: number
  name: string
  email: string
  salary_configuration: SalaryConfig | null
}

interface PersetujuanGajiProps {
  token: string
  onApprovalChange?: () => void
}

const S = { fontFamily: "'Quicksand', 'Inter', 'system-ui', sans-serif" }

const ORANGE = {
  color: '#ea580c',
  bg: 'rgba(234,88,12,0.07)',
  border: 'rgba(234,88,12,0.18)',
  gradient: 'linear-gradient(135deg, #ea580c, #c2410c)',
}

export default function PersetujuanGaji({ token, onApprovalChange }: PersetujuanGajiProps) {
  const [data, setData] = useState<EmployeeWithConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchConfigs = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:8000/api/admin/payroll/configurations', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setData(response.data.data)
        onApprovalChange?.()
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchConfigs() }, [])

  const handleApprove = (configId: number, name: string) => {
    Swal.fire({
      title: 'Setujui Penyesuaian Gaji?',
      html: `Setujui perubahan nominal gaji untuk <strong>${name}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ea580c',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Setujui',
      cancelButtonText: 'Batal'
    }).then(async result => {
      if (result.isConfirmed) {
        try {
          const res = await axios.put(`http://localhost:8000/api/director/payroll/configurations/${configId}/approve`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (res.data.status === 'success') { Swal.fire('Berhasil!', res.data.message, 'success'); fetchConfigs() }
        } catch (err: any) { Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan.', 'error') }
      }
    })
  }

  const handleReject = (configId: number, name: string) => {
    Swal.fire({
      title: 'Tolak Penyesuaian Gaji?',
      html: `Tolak perubahan gaji untuk <strong>${name}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Tolak',
      cancelButtonText: 'Batal'
    }).then(async result => {
      if (result.isConfirmed) {
        try {
          const res = await axios.put(`http://localhost:8000/api/director/payroll/configurations/${configId}/reject`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (res.data.status === 'success') { Swal.fire('Berhasil!', res.data.message, 'success'); fetchConfigs() }
        } catch (err: any) { Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan.', 'error') }
      }
    })
  }

  const fmt = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

  const salaryRows = [
    { label: 'Gaji Pokok', old: 'basic_salary', newKey: 'pending_basic_salary' },
    { label: 'Tunjangan Makan', old: 'allowance_meal_daily', newKey: 'pending_allowance_meal_daily' },
    { label: 'Tunjangan Transport', old: 'allowance_transport_daily', newKey: 'pending_allowance_transport_daily' },
    { label: 'Tunjangan Jabatan', old: 'allowance_position', newKey: 'pending_allowance_position' },
    { label: 'Denda Telat', old: 'deduction_late_daily', newKey: 'pending_deduction_late_daily' },
    { label: 'Potongan Absen', old: 'deduction_absence_daily', newKey: 'pending_deduction_absence_daily' },
    { label: 'Potongan Tetap', old: 'deduction_fixed', newKey: 'pending_deduction_fixed' },
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32" style={S}>
        <Loader2 className="w-6 h-6 animate-spin mb-2" style={{ color: ORANGE.color }} />
        <p className="text-xs text-slate-400 font-semibold">Memuat data gaji karyawan...</p>
      </div>
    )
  }

  const pendingList = data.filter(e => e.salary_configuration?.salary_change_status === 'pending')
  const approvedList = data.filter(e => e.salary_configuration?.salary_change_status === 'approved')
  const rejectedList = data.filter(e => e.salary_configuration?.salary_change_status === 'rejected')

  const getFilteredData = () => {
    const map: Record<string, EmployeeWithConfig[]> = {
      pending: pendingList,
      approved: approvedList,
      rejected: rejectedList,
      all: data,
    }
    const list = map[activeTab] ?? data
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter(e => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q))
  }

  const filteredData = getFilteredData()

  const tabDefs = [
    {
      id: 'pending' as const,
      label: 'Menunggu',
      desc: 'Perlu ditinjau',
      count: pendingList.length,
      icon: Clock,
      color: '#d97706',
      bg: 'rgba(217,119,6,0.08)',
      border: 'rgba(217,119,6,0.20)',
      gradient: 'linear-gradient(135deg,#d97706,#b45309)',
    },
    {
      id: 'approved' as const,
      label: 'Disetujui',
      desc: 'Sudah diproses',
      count: approvedList.length,
      icon: BadgeCheck,
      color: '#059669',
      bg: 'rgba(5,150,105,0.08)',
      border: 'rgba(5,150,105,0.20)',
      gradient: 'linear-gradient(135deg,#059669,#047857)',
    },
    {
      id: 'rejected' as const,
      label: 'Ditolak',
      desc: 'Pengajuan ditolak',
      count: rejectedList.length,
      icon: XCircle,
      color: '#dc2626',
      bg: 'rgba(220,38,38,0.07)',
      border: 'rgba(220,38,38,0.18)',
      gradient: 'linear-gradient(135deg,#dc2626,#b91c1c)',
    },
    {
      id: 'all' as const,
      label: 'Semua Karyawan',
      desc: 'Seluruh konfigurasi',
      count: data.length,
      icon: Users,
      color: '#ea580c',
      bg: 'rgba(234,88,12,0.07)',
      border: 'rgba(234,88,12,0.18)',
      gradient: 'linear-gradient(135deg,#ea580c,#c2410c)',
    },
  ]

  const currentTab = tabDefs.find(t => t.id === activeTab)!

  return (
    <div className="space-y-5" style={S}>

      {/* ── Top stat strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Staf', value: data.length, icon: Users, color: ORANGE.color, bg: ORANGE.bg, border: ORANGE.border },
          { label: 'Perlu Ditinjau', value: pendingList.length, icon: Clock, color: '#d97706', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.20)' },
          { label: 'Telah Disetujui', value: approvedList.length, icon: CheckCircle2, color: '#059669', bg: 'rgba(5,150,105,0.08)', border: 'rgba(5,150,105,0.20)' },
          { label: 'Pernah Ditolak', value: rejectedList.length, icon: XCircle, color: '#dc2626', bg: 'rgba(220,38,38,0.07)', border: 'rgba(220,38,38,0.18)' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div
              key={i}
              className="flex items-center gap-3.5 px-4 py-4 rounded-2xl border bg-white"
              style={{ borderColor: s.border }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                <Icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{s.label}</p>
                <p className="text-2xl font-black leading-none" style={{ color: s.color }}>{s.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Main card ── */}
      <div className="bg-white rounded-2xl border border-orange-100/80 shadow-sm overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-orange-100/60 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm" style={{ background: ORANGE.gradient }}>
            <Wallet className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-black text-slate-800 tracking-tight">Informasi & Persetujuan Gaji</h2>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Pantau setelan kompensasi karyawan dan proses pengajuan perubahan gaji
            </p>
          </div>
          {pendingList.length > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black border shrink-0"
              style={{ background: 'rgba(217,119,6,0.08)', color: '#d97706', borderColor: 'rgba(217,119,6,0.20)' }}>
              <AlertCircle className="w-3 h-3" />
              {pendingList.length} menunggu
            </span>
          )}
        </div>

        {/* Tab bar + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-3.5 border-b border-orange-100/40 bg-orange-50/20">
          <div className="flex flex-wrap gap-1.5 flex-1">
            {tabDefs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer border"
                  style={isActive ? {
                    background: tab.bg,
                    color: tab.color,
                    borderColor: tab.border,
                  } : {
                    background: 'white',
                    color: '#64748b',
                    borderColor: '#e2e8f0',
                  }}
                >
                  <Icon className="w-3.5 h-3.5" style={isActive ? { color: tab.color } : { color: '#94a3b8' }} />
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className="px-1.5 py-0.5 rounded-md text-[9px] font-black leading-none"
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

          <div className="relative shrink-0 w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-8 py-2 text-xs border border-orange-100 rounded-xl outline-none transition-all font-semibold text-slate-700 bg-white placeholder:text-slate-300"
              style={{ paddingLeft: '2rem' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="p-5">
          {filteredData.length === 0 ? (
            <EmptyState
              text={searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : `Belum ada data untuk kategori "${currentTab.label}".`}
              color={currentTab.color}
            />
          ) : activeTab === 'pending' ? (
            /* ── Pending approval cards ── */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredData.map(employee => {
                const config = employee.salary_configuration!
                const changedRows = salaryRows.filter(r => {
                  const newVal = config[r.newKey as keyof SalaryConfig] as number | null
                  const oldVal = config[r.old as keyof SalaryConfig] as number
                  return newVal !== null && newVal !== oldVal
                })

                return (
                  <div
                    key={employee.id}
                    className="rounded-xl border overflow-hidden bg-white hover:shadow-md transition-shadow duration-200"
                    style={{ borderColor: 'rgba(217,119,6,0.22)' }}
                  >
                    {/* Card top accent line */}
                    <div className="h-0.5" style={{ background: 'linear-gradient(90deg,#f59e0b,#ea580c,transparent)' }} />

                    {/* Employee info */}
                    <div className="px-4 py-3.5 flex items-center gap-3 border-b" style={{ background: 'rgba(251,191,36,0.05)', borderColor: 'rgba(217,119,6,0.12)' }}>
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0"
                        style={{ background: 'linear-gradient(135deg,#f59e0b,#ea580c)' }}
                      >
                        {employee.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">{employee.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium truncate">{employee.email}</p>
                      </div>
                      <span className="text-[9px] font-black px-2 py-1 rounded-lg border shrink-0"
                        style={{ background: 'rgba(217,119,6,0.08)', color: '#d97706', borderColor: 'rgba(217,119,6,0.20)' }}>
                        PENDING
                      </span>
                    </div>

                    {/* Salary changes */}
                    <div className="px-4 py-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3 text-orange-500" /> Rincian Perubahan
                      </p>
                      <div className="space-y-0">
                        {changedRows.length === 0 ? (
                          <p className="text-xs text-slate-400 font-medium">Tidak ada perubahan yang terdeteksi.</p>
                        ) : changedRows.map(r => {
                          const oldVal = config[r.old as keyof SalaryConfig] as number
                          const newVal = config[r.newKey as keyof SalaryConfig] as number
                          const isUp = newVal > oldVal
                          return (
                            <div key={r.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                              <span className="text-xs font-semibold text-slate-500">{r.label}</span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] text-slate-300 line-through font-semibold">{fmt(oldVal)}</span>
                                <ArrowRight className="w-2.5 h-2.5 text-slate-300 shrink-0" />
                                <span className={`text-xs font-black ${isUp ? 'text-emerald-600' : 'text-rose-500'}`}>{fmt(newVal)}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-4 py-3 flex items-center justify-end gap-2 border-t bg-slate-50/40" style={{ borderColor: 'rgba(217,119,6,0.10)' }}>
                      <button
                        onClick={() => handleReject(config.id, employee.name)}
                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-500 bg-white border border-slate-200 hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                      >
                        <X className="w-3 h-3" /> Tolak
                      </button>
                      <button
                        onClick={() => handleApprove(config.id, employee.name)}
                        className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-bold text-white cursor-pointer shadow-sm transition-opacity hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg,#f59e0b,#ea580c)' }}
                      >
                        <Check className="w-3 h-3" /> Setujui
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* ── Table view for Approved / Rejected / All ── */
            <div className="rounded-xl border border-orange-100/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-[10px] font-black uppercase tracking-wider text-slate-400" style={{ background: 'rgba(234,88,12,0.04)', borderColor: 'rgba(234,88,12,0.12)' }}>
                      <th className="py-3.5 px-5">Karyawan</th>
                      <th className="py-3.5 px-5">Gaji Pokok</th>
                      <th className="py-3.5 px-5">Tunjangan Harian</th>
                      <th className="py-3.5 px-5">Tunjangan Jabatan</th>
                      <th className="py-3.5 px-5">Potongan Harian</th>
                      <th className="py-3.5 px-5">Pot. Tetap</th>
                      <th className="py-3.5 px-5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-50 text-xs text-slate-600">
                    {filteredData.map(employee => {
                      const cfg = employee.salary_configuration
                      const status = cfg?.salary_change_status ?? 'none'

                      const statusStyle = {
                        approved: { bg: 'rgba(5,150,105,0.08)', color: '#059669', border: 'rgba(5,150,105,0.20)', label: 'Disetujui', Icon: BadgeCheck },
                        rejected: { bg: 'rgba(220,38,38,0.07)', color: '#dc2626', border: 'rgba(220,38,38,0.18)', label: 'Ditolak', Icon: XCircle },
                        pending: { bg: 'rgba(217,119,6,0.08)', color: '#d97706', border: 'rgba(217,119,6,0.20)', label: 'Menunggu', Icon: Clock },
                        none: { bg: 'rgba(234,88,12,0.07)', color: '#ea580c', border: 'rgba(234,88,12,0.18)', label: 'Aktif', Icon: CheckCircle2 },
                      }[status] ?? { bg: 'rgba(100,116,139,0.07)', color: '#64748b', border: 'rgba(100,116,139,0.18)', label: 'Tidak Diatur', Icon: AlertCircle }

                      return (
                        <tr key={employee.id} className="hover:bg-orange-50/30 transition-colors">
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs shrink-0"
                                style={{ background: ORANGE.gradient }}
                              >
                                {employee.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{employee.name}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{employee.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-5 font-black text-slate-700">
                            {cfg ? fmt(cfg.basic_salary) : <span className="text-slate-300 italic font-medium">—</span>}
                          </td>
                          <td className="py-4 px-5">
                            {cfg ? (
                              <div className="space-y-0.5">
                                <p className="text-slate-500 font-medium">Makan: <span className="font-bold text-slate-700">{fmt(cfg.allowance_meal_daily)}</span></p>
                                <p className="text-slate-500 font-medium">Trans: <span className="font-bold text-slate-700">{fmt(cfg.allowance_transport_daily)}</span></p>
                              </div>
                            ) : <span className="text-slate-300 italic font-medium">—</span>}
                          </td>
                          <td className="py-4 px-5 font-bold text-slate-700">
                            {cfg ? fmt(cfg.allowance_position) : <span className="text-slate-300 italic font-medium">—</span>}
                          </td>
                          <td className="py-4 px-5">
                            {cfg ? (
                              <div className="space-y-0.5">
                                <p className="text-slate-500 font-medium">Telat: <span className="font-bold text-rose-600">{fmt(cfg.deduction_late_daily)}</span></p>
                                <p className="text-slate-500 font-medium">Absen: <span className="font-bold text-rose-600">{fmt(cfg.deduction_absence_daily)}</span></p>
                              </div>
                            ) : <span className="text-slate-300 italic font-medium">—</span>}
                          </td>
                          <td className="py-4 px-5 font-bold text-rose-600">
                            {cfg ? fmt(cfg.deduction_fixed) : <span className="text-slate-300 italic font-medium">—</span>}
                          </td>
                          <td className="py-4 px-5 text-center">
                            <span
                              className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-[9px] font-black border"
                              style={{ background: statusStyle.bg, color: statusStyle.color, borderColor: statusStyle.border }}
                            >
                              <statusStyle.Icon className="w-2.5 h-2.5" />
                              {statusStyle.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ text, color }: { text: string; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: `${color}10` }}>
        <CheckCircle2 className="w-6 h-6" style={{ color: `${color}80` }} />
      </div>
      <p className="text-sm font-bold text-slate-400">Tidak ada data</p>
      <p className="text-xs text-slate-300 font-medium mt-1 max-w-xs">{text}</p>
    </div>
  )
}
