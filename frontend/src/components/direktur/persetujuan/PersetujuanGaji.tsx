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
  CheckCircle2
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
}

const S = { fontFamily: "'Inter', 'system-ui', sans-serif" }

export default function PersetujuanGaji({ token }: PersetujuanGajiProps) {
  const [data, setData] = useState<EmployeeWithConfig[]>([])
  const [loading, setLoading] = useState(true)

  const fetchConfigs = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:8000/api/admin/payroll/configurations', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') setData(response.data.data)
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
      confirmButtonColor: '#4f46e5',
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

  const rows = [
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
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
        <p className="text-xs text-slate-400 font-medium">Memuat perubahan gaji...</p>
      </div>
    )
  }

  const pendingChanges = data.filter(e => e.salary_configuration?.salary_change_status === 'pending')

  return (
    <div className="space-y-6" style={S}>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md" style={{ background: 'linear-gradient(135deg,#0891b2,#0e7490)' }}>
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Persetujuan Penyesuaian Gaji</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Bandingkan nilai lama dan baru, lalu putuskan persetujuan</p>
            </div>
          </div>
          {pendingChanges.length > 0 && (
            <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold" style={{ background: 'rgba(8,145,178,0.06)', borderColor: 'rgba(8,145,178,0.15)', color: '#0891b2' }}>
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              {pendingChanges.length} perubahan gaji menunggu persetujuan Anda
            </div>
          )}
        </div>

        <div className="p-6">
          {pendingChanges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-slate-400">Tidak ada pengajuan</p>
              <p className="text-xs text-slate-300 font-medium mt-1">Semua konfigurasi gaji sudah diproses.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {pendingChanges.map((employee) => {
                const config = employee.salary_configuration!
                const changedRows = rows.filter(r => {
                  const newVal = config[r.newKey as keyof SalaryConfig] as number | null
                  const oldVal = config[r.old as keyof SalaryConfig] as number
                  return newVal !== null && newVal !== oldVal
                })

                return (
                  <div
                    key={employee.id}
                    className="rounded-2xl border overflow-hidden"
                    style={{ borderColor: 'rgba(8,145,178,0.20)' }}
                  >
                    {/* Card header */}
                    <div className="px-5 py-4 flex items-center gap-3 border-b" style={{ background: 'rgba(8,145,178,0.05)', borderColor: 'rgba(8,145,178,0.12)' }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: 'linear-gradient(135deg,#0891b2,#0e7490)' }}>
                        {employee.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{employee.name}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">{employee.email}</p>
                      </div>
                    </div>

                    {/* Changes table */}
                    <div className="px-5 py-4 space-y-0">
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">
                        <TrendingUp className="w-3 h-3" />
                        Rincian Perubahan
                      </div>
                      {changedRows.map(r => {
                        const oldVal = config[r.old as keyof SalaryConfig] as number
                        const newVal = config[r.newKey as keyof SalaryConfig] as number
                        const isIncrease = newVal > oldVal
                        return (
                          <div key={r.label} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                            <span className="text-xs font-medium text-slate-500">{r.label}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-slate-300 line-through font-medium">{fmt(oldVal)}</span>
                              <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                              <span className={`text-xs font-black ${isIncrease ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(newVal)}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Actions */}
                    <div className="px-5 py-4 flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50">
                      <button
                        onClick={() => handleReject(config.id, employee.name)}
                        className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> Tolak
                      </button>
                      <button
                        onClick={() => handleApprove(config.id, employee.name)}
                        className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 cursor-pointer shadow-sm"
                        style={{ background: 'linear-gradient(135deg,#0891b2,#0e7490)' }}
                      >
                        <Check className="w-3.5 h-3.5" /> Setujui Gaji Baru
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
