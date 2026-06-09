import { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  UserCheck, 
  Wallet, 
  Coins, 
  FileCheck, 
  ArrowUpRight,
  Loader2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface DirekturOverviewProps {
  token: string
}

const cardDefs = [
  {
    key: 'employee',
    title: 'Persetujuan Karyawan',
    icon: UserCheck,
    to: '/director/karyawan',
    color: '#4f46e5',
    colorLight: 'rgba(79,70,229,0.08)',
    colorBorder: 'rgba(79,70,229,0.15)',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    desc: (s: Stats) => `${s.pendingRegister} Pendaftar · ${s.pendingDelete} Hapus`,
    pending: (s: Stats) => s.pendingRegister + s.pendingDelete,
  },
  {
    key: 'salary',
    title: 'Penyesuaian Gaji',
    icon: Wallet,
    to: '/director/gaji',
    color: '#0891b2',
    colorLight: 'rgba(8,145,178,0.08)',
    colorBorder: 'rgba(8,145,178,0.15)',
    gradient: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
    desc: (s: Stats) => `${s.pendingSalary} Pengajuan Setelan`,
    pending: (s: Stats) => s.pendingSalary,
  },
  {
    key: 'payroll',
    title: 'Payroll Bulanan',
    icon: Coins,
    to: '/director/payroll',
    color: '#d97706',
    colorLight: 'rgba(217,119,6,0.08)',
    colorBorder: 'rgba(217,119,6,0.15)',
    gradient: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
    desc: (s: Stats) => `${s.pendingPayroll} Slip Siap Disahkan`,
    pending: (s: Stats) => s.pendingPayroll,
  },
  {
    key: 'operational',
    title: 'Operasional SDM',
    icon: FileCheck,
    to: '/director/operasional',
    color: '#059669',
    colorLight: 'rgba(5,150,105,0.08)',
    colorBorder: 'rgba(5,150,105,0.15)',
    gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    desc: () => 'Cuti · Lembur · Klaim · Bonus',
    pending: (s: Stats) => s.pendingOperational,
  },
]

interface Stats {
  pendingRegister: number
  pendingDelete: number
  pendingSalary: number
  pendingPayroll: number
  pendingOperational: number
}

export default function DirekturOverview({ token }: DirekturOverviewProps) {
  const [stats, setStats] = useState<Stats>({
    pendingRegister: 0, pendingDelete: 0, pendingSalary: 0,
    pendingPayroll: 0, pendingOperational: 0
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const [
        resEmployees, resSalary, resPayroll,
        resLeaves, resOvertimes, resReimbursements, resBonuses
      ] = await Promise.all([
        axios.get('http://localhost:8000/api/employees', { headers }).catch(() => ({ data: { data: [] } })),
        axios.get('http://localhost:8000/api/admin/payroll/configurations', { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`http://localhost:8000/api/admin/payroll?period_month=${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get('http://localhost:8000/api/admin/leaves', { headers }).catch(() => ({ data: { data: [] } })),
        axios.get('http://localhost:8000/api/admin/overtimes', { headers }).catch(() => ({ data: { data: [] } })),
        axios.get('http://localhost:8000/api/admin/reimbursements', { headers }).catch(() => ({ data: { data: [] } })),
        axios.get('http://localhost:8000/api/admin/bonuses', { headers }).catch(() => ({ data: { data: [] } })),
      ])

      const employees = resEmployees.data?.data || []
      const salaryConfigs = resSalary.data?.data || []
      const payrolls = resPayroll.data?.data || []
      const leaves = resLeaves.data?.data || []
      const overtimes = resOvertimes.data?.data || []
      const reimbursements = resReimbursements.data?.data || []
      const bonuses = resBonuses.data?.data || []

      const pendingRegister = employees.filter((e: any) => e.status === 'pending').length
      const pendingDelete = employees.filter((e: any) => e.status === 'pending_delete').length
      const pendingSalary = salaryConfigs.filter((e: any) => e.salary_configuration?.salary_change_status === 'pending').length
      const pendingPayroll = payrolls.filter((e: any) => e.status === 'pending_approval').length
      const pendingLeaves = leaves.filter((e: any) => e.status === 'pending_director').length
      const pendingOvertimes = overtimes.filter((e: any) => e.status === 'pending_director').length
      const pendingReimbursements = reimbursements.filter((e: any) => e.status === 'pending_director').length
      const pendingBonuses = bonuses.filter((e: any) => e.status === 'pending').length
      const pendingOperational = pendingLeaves + pendingOvertimes + pendingReimbursements + pendingBonuses

      setStats({ pendingRegister, pendingDelete, pendingSalary, pendingPayroll, pendingOperational })
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchStats() }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin mb-3" style={{ color: '#4f46e5' }} />
        <p className="text-sm text-slate-400 font-medium">Memuat rangkuman persetujuan...</p>
      </div>
    )
  }

  const totalPending = Object.values(stats).reduce((a, b) => a + b, 0)
  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Selamat Pagi' : now.getHours() < 18 ? 'Selamat Siang' : 'Selamat Sore'

  return (
    <div className="space-y-8" style={{ fontFamily: "'Inter', 'system-ui', sans-serif" }}>

      {/* Hero Welcome Banner */}
      <div
        className="relative overflow-hidden rounded-3xl p-8 text-white"
        style={{ background: 'linear-gradient(135deg, #1a1f5e 0%, #2d2fa3 50%, #1e3a8a 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-semibold text-indigo-200">{greeting}, Direktur</span>
              </div>
              <h2 className="text-2xl font-bold leading-snug">
                Portal Pengesahan<br />
                <span className="text-indigo-300">Direktur Utama</span>
              </h2>
              <p className="text-sm text-indigo-200/80 max-w-md leading-relaxed font-medium">
                Pantau dan kelola seluruh pengajuan dari tim administrasi. Keputusan Anda menentukan kelancaran operasional perusahaan.
              </p>
            </div>

            {/* Stats summary badges */}
            <div className="flex flex-col gap-2 shrink-0">
              {totalPending > 0 ? (
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)' }}>
                  <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                  <div>
                    <p className="text-lg font-black text-white leading-tight">{totalPending}</p>
                    <p className="text-[10px] text-indigo-200 font-semibold">Menunggu Tindakan</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)' }}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">Semua Bersih</p>
                    <p className="text-[10px] text-indigo-200 font-semibold">Tidak ada pending</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <TrendingUp className="w-3.5 h-3.5 text-indigo-300" />
                <span className="text-[10px] text-indigo-200 font-semibold">
                  {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section heading */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-1">Panel Persetujuan</h3>
        <p className="text-xs text-slate-400 font-medium">Klik panel untuk mengelola setiap kategori persetujuan</p>
      </div>

      {/* Approval Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {cardDefs.map((card) => {
          const IconComp = card.icon
          const pendingCount = card.pending(stats)
          const hasPending = pendingCount > 0

          return (
            <Link
              key={card.key}
              to={card.to}
              className="group relative block rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{
                background: '#ffffff',
                border: hasPending ? `1.5px solid ${card.colorBorder}` : '1.5px solid #f1f5f9',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
              }}
            >
              <div className="flex items-start justify-between mb-5">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md"
                  style={{ background: card.gradient }}
                >
                  <IconComp className="w-5 h-5" />
                </div>

                {hasPending ? (
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black"
                    style={{ background: card.colorLight, color: card.color, border: `1px solid ${card.colorBorder}` }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: card.color }} />
                    {pendingCount} Menunggu
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <CheckCircle2 className="w-3 h-3" />
                    Selesai
                  </div>
                )}
              </div>

              <h4 className="text-sm font-bold text-slate-800 mb-1 group-hover:text-indigo-700 transition-colors">
                {card.title}
              </h4>
              <p className="text-xs text-slate-400 font-medium mb-5">{card.desc(stats)}</p>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-[11px] font-semibold" style={{ color: card.color }}>
                  Buka Panel
                </span>
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  style={{ background: card.colorLight }}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" style={{ color: card.color }} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick tip */}
      <div className="rounded-2xl p-4 flex items-center gap-3 border border-indigo-100"
        style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)' }}>
        <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-indigo-500" />
        </div>
        <div>
          <p className="text-xs font-bold text-indigo-700">Tips</p>
          <p className="text-[11px] text-indigo-500 font-medium">
            Klik badge "Menunggu" di setiap kartu untuk langsung menuju item yang perlu tindakan Anda.
          </p>
        </div>
      </div>
    </div>
  )
}
