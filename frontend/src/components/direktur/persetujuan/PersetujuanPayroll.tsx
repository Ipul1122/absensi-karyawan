import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { 
  Coins, 
  Loader2, 
  X, 
  Calendar,
  CheckCircle2,
  DollarSign,
  CreditCard
} from 'lucide-react'

interface PayrollRecord {
  id: number
  user_id: number
  period_month: string
  days_present: number
  days_late: number
  days_leave: number
  basic_salary: number
  allowance_meal: number
  allowance_transport: number
  allowance_fixed: number
  allowance_position: number
  deduction_late: number
  deduction_fixed: number
  deduction_absence: number
  net_salary: number
  status: string
  notes: string | null
  user: { 
    id: number; 
    name: string; 
    email: string;
    no_rekening?: string | null;
    company?: string | null;
  }
}

interface PersetujuanPayrollProps { token: string }

const S = { fontFamily: "'Inter', 'system-ui', sans-serif" }

export default function PersetujuanPayroll({ token }: PersetujuanPayrollProps) {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [activeTab, setActiveTab] = useState<'unpaid' | 'paid'>('unpaid')

  const fetchPayrolls = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`http://localhost:8000/api/admin/payroll?period_month=${selectedMonth}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') setPayrollRecords(response.data.data)
    } catch (err) { console.error(err); setPayrollRecords([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPayrolls() }, [selectedMonth])

  const fmt = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

  const handleRejectSingle = (record: PayrollRecord) => {
    Swal.fire({
      title: 'Kembalikan ke Draft?',
      html: `Tolak gaji <strong>${record.user.name}</strong> dan kembalikan ke draft?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Kembalikan',
      cancelButtonText: 'Batal'
    }).then(async result => {
      if (result.isConfirmed) {
        setActionLoading(true)
        try {
          const res = await axios.put(`http://localhost:8000/api/director/payroll/${record.id}/reject`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (res.data.status === 'success') { Swal.fire('Berhasil!', res.data.message, 'success'); fetchPayrolls() }
        } catch (err: any) { Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan.', 'error') }
        finally { setActionLoading(false) }
      }
    })
  }

  const handleRejectAll = () => {
    Swal.fire({
      title: 'Tolak Semua Payroll?',
      text: 'Semua slip gaji pending akan dikembalikan ke draft.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Tolak Semua',
      cancelButtonText: 'Batal'
    }).then(async result => {
      if (result.isConfirmed) {
        setActionLoading(true)
        try {
          const res = await axios.post('http://localhost:8000/api/director/payroll/reject-all', { period_month: selectedMonth }, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (res.data.status === 'success') { Swal.fire('Sukses!', res.data.message, 'success'); fetchPayrolls() }
        } catch (err: any) { Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan.', 'error') }
        finally { setActionLoading(false) }
      }
    })
  }

  const handlePaySingle = (record: PayrollRecord) => {
    const noRek = record.user.no_rekening || 'Belum diatur'
    const company = record.user.company || '-'
    Swal.fire({
      title: 'Tandai Gaji Lunas?',
      html: `
        <div class="text-left space-y-3 font-quicksand text-sm">
          <p>Apakah Anda ingin menandai pembayaran gaji ini sebagai lunas?</p>
          <div class="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-2 mt-2">
            <div class="flex justify-between">
              <span class="text-slate-400 font-semibold font-bold">Nama:</span>
              <span class="font-extrabold text-slate-800">${record.user.name}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400 font-semibold font-bold">Gaji Bersih:</span>
              <span class="font-extrabold text-emerald-600">${fmt(record.net_salary)}</span>
            </div>
            <div class="flex justify-between border-t border-slate-200 pt-2">
              <span class="text-slate-400 font-semibold font-bold">No. Rekening:</span>
              <span class="font-extrabold text-blue-600 select-all">${noRek}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400 font-semibold font-bold">Perusahaan (PT):</span>
              <span class="font-bold text-slate-700">${company}</span>
            </div>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Ya, Tandai Lunas',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setActionLoading(true)
        try {
          const res = await axios.put(
            `http://localhost:8000/api/director/payroll/${record.id}/pay`,
            { status: 'paid' },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          if (res.data.status === 'success') {
            Swal.fire({
              title: 'Berhasil!',
              text: 'Gaji karyawan berhasil ditandai lunas (Paid).',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            })
            fetchPayrolls()
          }
        } catch (err: any) {
          console.error(err)
          Swal.fire({
            title: 'Gagal',
            text: err.response?.data?.message || 'Gagal menandai gaji sebagai lunas.',
            icon: 'error'
          })
        } finally {
          setActionLoading(false)
        }
      }
    })
  }

  const unpaidPayrolls = payrollRecords.filter(r => r.status === 'unpaid' || r.status === 'pending_approval')
  const paidPayrolls = payrollRecords.filter(r => r.status === 'paid')
  
  const currentRecords = activeTab === 'unpaid'
    ? unpaidPayrolls
    : paidPayrolls

  return (
    <div className="space-y-6" style={S}>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md" style={{ background: 'linear-gradient(135deg,#d97706,#b45309)' }}>
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Persetujuan & Pembayaran Payroll</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Validasi, setujui, dan lakukan pembayaran slip gaji karyawan</p>
              </div>
            </div>

            {/* Month filter */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold text-slate-700 outline-none"
              />
            </div>
          </div>

          {/* Summary stats */}
          {activeTab === 'unpaid' && unpaidPayrolls.length > 0 && (
            <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-xl border text-xs font-bold" style={{ background: 'rgba(217,119,6,0.06)', borderColor: 'rgba(217,119,6,0.15)', color: '#d97706' }}>
                  <span className="font-black">{unpaidPayrolls.length}</span> Slip Siap Dibayar
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                  Total: <span className="font-black text-slate-800">{fmt(unpaidPayrolls.reduce((sum, r) => sum + r.net_salary, 0))}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRejectAll}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-red-200 hover:text-red-650 hover:bg-red-50 transition-all cursor-pointer disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" /> Tolak Semua
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 px-6 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('unpaid')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'unpaid'
                ? 'border-amber-600 text-amber-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Siap Dibayar / Belum Lunas ({unpaidPayrolls.length})
          </button>
          <button
            onClick={() => setActiveTab('paid')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'paid'
                ? 'border-amber-600 text-amber-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sudah Dibayar / Lunas ({paidPayrolls.length})
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500 mb-2" />
            <p className="text-xs text-slate-400 font-medium">Memuat data payroll...</p>
          </div>
        ) : currentRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-slate-400">
              {activeTab === 'unpaid'
                ? 'Tidak ada payroll yang siap dibayar'
                : 'Belum ada payroll yang lunas'}
            </p>
            <p className="text-xs text-slate-300 font-medium mt-1">
              {activeTab === 'unpaid'
                ? 'Semua slip gaji pada periode ini belum diajukan atau sudah diproses.'
                : 'Silakan lakukan pembayaran pada tab "Siap Dibayar".'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Karyawan</th>
                  <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Kehadiran</th>
                  <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Gaji Pokok</th>
                  <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Tunjangan</th>
                  <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Potongan</th>
                  <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Gaji Bersih</th>
                  <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-left">No. Rekening</th>
                  <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRecords.map(record => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0" style={{ background: 'linear-gradient(135deg,#d97706,#b45309)' }}>
                          {record.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{record.user.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{record.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">{record.days_present}H</span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-red-50 text-red-500 border border-red-100">{record.days_late}T</span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-blue-50 text-blue-500 border border-blue-100">{record.days_leave}C</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right text-xs font-semibold text-slate-600">{fmt(record.basic_salary)}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="text-[10px] font-semibold text-emerald-600 space-y-0.5">
                        {record.allowance_meal > 0 && <div>+{fmt(record.allowance_meal)}</div>}
                        {record.allowance_transport > 0 && <div>+{fmt(record.allowance_transport)}</div>}
                        {record.allowance_position > 0 && <div>+{fmt(record.allowance_position)}</div>}
                        {record.allowance_fixed > 0 && <div>+{fmt(record.allowance_fixed)}</div>}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="text-[10px] font-semibold text-red-500 space-y-0.5">
                        {record.deduction_late > 0 && <div>-{fmt(record.deduction_late)}</div>}
                        {record.deduction_absence > 0 && <div>-{fmt(record.deduction_absence)}</div>}
                        {record.deduction_fixed > 0 && <div>-{fmt(record.deduction_fixed)}</div>}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="text-sm font-black text-slate-800">{fmt(record.net_salary)}</span>
                    </td>
                    <td className="py-4 px-6 text-left">
                      {record.user.no_rekening ? (
                        <div className="flex flex-col items-start gap-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold text-blue-600 select-all bg-blue-50/50 border border-blue-100/50">
                            <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                            {record.user.no_rekening}
                          </span>
                          {record.user.company && (
                            <span className="text-[10px] text-slate-400 font-medium ml-1">
                              {record.user.company}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Belum diatur</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        {activeTab === 'unpaid' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handlePaySingle(record)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 rounded-xl text-white font-bold text-xs transition-all hover:opacity-95 cursor-pointer shadow-sm disabled:opacity-50 bg-gradient-to-r from-emerald-600 to-teal-700 flex items-center justify-center gap-1"
                              title="Tandai Gaji Lunas"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Bayar
                            </button>
                            <button
                              onClick={() => handleRejectSingle(record)}
                              disabled={actionLoading}
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 bg-slate-100 hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer disabled:opacity-50"
                              title="Kembalikan ke Draft"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        {activeTab === 'paid' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Lunas
                          </span>
                        )}
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
