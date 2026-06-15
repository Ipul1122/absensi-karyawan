import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { 
  Settings, 
  Loader2, 
  Edit3
} from 'lucide-react'

interface User {
  id: number
  name: string
  email: string
  salary_configuration?: SalaryConfig | null
}

interface SalaryConfig {
  id?: number
  user_id: number
  basic_salary: number
  allowance_meal_daily: number
  allowance_transport_daily: number
  allowance_fixed: number
  allowance_position: number
  deduction_late_daily: number
  deduction_absence_daily: number
  deduction_fixed: number
  pending_basic_salary?: number | null
  pending_allowance_meal_daily?: number | null
  pending_allowance_transport_daily?: number | null
  pending_allowance_position?: number | null
  pending_deduction_late_daily?: number | null
  pending_deduction_absence_daily?: number | null
  pending_deduction_fixed?: number | null
  salary_change_status?: 'none' | 'pending' | 'approved' | 'rejected'
}

interface AdminSalaryConfigProps {
  token: string
}

export default function AdminSalaryConfig({ token }: AdminSalaryConfigProps) {
  const [employees, setEmployees] = useState<User[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [submittingConfig, setSubmittingConfig] = useState(false)
  
  // Modals state
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null)
  
  // Form Configuration states
  const [basicSalary, setBasicSalary] = useState('0')
  const [allowanceMealDaily, setAllowanceMealDaily] = useState('0')
  const [allowanceTransportDaily, setAllowanceTransportDaily] = useState('0')
  const [allowancePosition, setAllowancePosition] = useState('0')
  const [deductionLateDaily, setDeductionLateDaily] = useState('0')
  const [deductionAbsenceDaily, setDeductionAbsenceDaily] = useState('0')
  const [deductionFixed, setDeductionFixed] = useState('0')

  // Fetch salary configurations
  const fetchConfigurations = async () => {
    setLoadingEmployees(true)
    try {
      const response = await axios.get('http://localhost:8000/api/admin/payroll/configurations', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setEmployees(response.data.data)
      }
    } catch (err) {
      console.error(err)
      Swal.fire({
        title: 'Gagal Memuat Data',
        text: 'Tidak dapat mengambil konfigurasi gaji karyawan.',
        icon: 'error'
      })
    } finally {
      setLoadingEmployees(false)
    }
  }

  useEffect(() => {
    fetchConfigurations()
  }, [])

  // Open Edit Config Modal
  const handleOpenConfig = (employee: User) => {
    setEditingEmployee(employee)
    if (employee.salary_configuration) {
      const cfg = employee.salary_configuration
      const isPending = cfg.salary_change_status === 'pending'
      
      setBasicSalary(formatInputRupiah(isPending && cfg.pending_basic_salary !== null ? cfg.pending_basic_salary : cfg.basic_salary))
      setAllowanceMealDaily(formatInputRupiah(isPending && cfg.pending_allowance_meal_daily !== null ? cfg.pending_allowance_meal_daily : (cfg.allowance_meal_daily ?? 0)))
      setAllowanceTransportDaily(formatInputRupiah(isPending && cfg.pending_allowance_transport_daily !== null ? cfg.pending_allowance_transport_daily : (cfg.allowance_transport_daily ?? 0)))
      setAllowancePosition(formatInputRupiah(isPending && cfg.pending_allowance_position !== null ? cfg.pending_allowance_position : (cfg.allowance_position ?? 0)))
      setDeductionLateDaily(formatInputRupiah(isPending && cfg.pending_deduction_late_daily !== null ? cfg.pending_deduction_late_daily : cfg.deduction_late_daily))
      setDeductionAbsenceDaily(formatInputRupiah(isPending && cfg.pending_deduction_absence_daily !== null ? cfg.pending_deduction_absence_daily : (cfg.deduction_absence_daily ?? 0)))
      setDeductionFixed(formatInputRupiah(isPending && cfg.pending_deduction_fixed !== null ? cfg.pending_deduction_fixed : cfg.deduction_fixed))
    } else {
      setBasicSalary('0')
      setAllowanceMealDaily('0')
      setAllowanceTransportDaily('0')
      setAllowancePosition('0')
      setDeductionLateDaily('0')
      setDeductionAbsenceDaily('0')
      setDeductionFixed('0')
    }
    setShowConfigModal(true)
  }

  // Submit Salary Configuration
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEmployee) return

    setSubmittingConfig(true)
    try {
      const response = await axios.post(
        'http://localhost:8000/api/admin/payroll/configurations',
        {
          user_id: editingEmployee.id,
          basic_salary: parseFloat(parseInputRupiah(basicSalary)) || 0,
          allowance_meal_daily: parseFloat(parseInputRupiah(allowanceMealDaily)) || 0,
          allowance_transport_daily: parseFloat(parseInputRupiah(allowanceTransportDaily)) || 0,
          allowance_position: parseFloat(parseInputRupiah(allowancePosition)) || 0,
          allowance_fixed: 0,
          deduction_late_daily: parseFloat(parseInputRupiah(deductionLateDaily)) || 0,
          deduction_absence_daily: parseFloat(parseInputRupiah(deductionAbsenceDaily)) || 0,
          deduction_fixed: parseFloat(parseInputRupiah(deductionFixed)) || 0
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.status === 'success') {
        Swal.fire({
          title: 'Berhasil!',
          text: 'Pengajuan perubahan gaji berhasil disimpan dan menunggu persetujuan Direktur.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        })
        setShowConfigModal(false)
        fetchConfigurations()
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal menyimpan konfigurasi gaji.'
      Swal.fire({
        title: 'Error',
        text: msg,
        icon: 'error'
      })
    } finally {
      setSubmittingConfig(false)
    }
  }

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number)
  }

  // Format number to Rupiah input display with dot separators (e.g. 5000000 -> 5.000.000)
  const formatInputRupiah = (value: number | string | null | undefined): string => {
    const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0)
    if (isNaN(num)) return '0'
    const intValue = Math.round(num)
    return new Intl.NumberFormat('id-ID').format(intValue)
  }

  // Parse formatted Rupiah input back to plain number string (e.g. 5.000.000 -> 5000000)
  const parseInputRupiah = (formatted: string): string => {
    return formatted.replace(/\./g, '')
  }

  // Handle Rupiah input change: strip non-digits, reformat with dots
  const handleRupiahInput = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const raw = value.replace(/[^0-9]/g, '')
    if (raw === '') {
      setter('0')
      return
    }
    setter(new Intl.NumberFormat('id-ID').format(parseInt(raw, 10)))
  }

  return (
    <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in font-quicksand">
      <div>
        <h3 className="text-base font-bold text-slate-800 font-quicksand">Setelan Gaji Karyawan</h3>
        <p className="text-[11px] text-slate-500 font-medium">Tentukan gaji pokok, tunjangan harian, serta potongan tetap, potongan tidak masuk & terlambat untuk masing-masing karyawan.</p>
      </div>

      <div className="border border-orange-100 rounded-2xl overflow-hidden bg-orange-50/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-orange-50/30 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-orange-100">
                <th className="py-4 px-5">Karyawan</th>
                <th className="py-4 px-5">Gaji Pokok (Base)</th>
                <th className="py-4 px-5">Tunj. Makan (Harian)</th>
                <th className="py-4 px-5">Tunj. Transport (Harian)</th>
                <th className="py-4 px-5">Tunj. Jabatan (Bulanan)</th>
                <th className="py-4 px-5">Potongan Telat (Harian)</th>
                <th className="py-4 px-5">Potongan Tidak Masuk (Harian)</th>
                <th className="py-4 px-5">Potongan Tetap (BPJS dll)</th>
                <th className="py-4 px-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100 text-xs text-slate-600">
              {loadingEmployees ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                      Memuat data karyawan...
                    </div>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-semibold">
                    Tidak ada data karyawan ditemukan.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const cfg = emp.salary_configuration
                  return (
                    <tr key={emp.id} className="hover:bg-orange-50/10 transition-colors">
                      <td className="py-4 px-5">
                        <div>
                          <p className="font-extrabold text-slate-800 text-[13px]">{emp.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{emp.email}</p>
                          {cfg && cfg.salary_change_status === 'pending' && (
                            <span className="inline-flex items-center gap-1 mt-1.5 py-0.5 px-2 rounded-full text-[9px] font-extrabold bg-amber-50 text-amber-600 border border-amber-100 animate-pulse">
                              Perubahan Menunggu Direktur
                            </span>
                          )}
                          {cfg && cfg.salary_change_status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 mt-1.5 py-0.5 px-2 rounded-full text-[9px] font-extrabold bg-rose-50 text-rose-600 border border-rose-100">
                              Perubahan Ditolak
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 font-bold text-slate-700">
                        {cfg ? formatRupiah(cfg.basic_salary) : <span className="text-slate-400 italic">Belum diset</span>}
                      </td>
                      <td className="py-4 px-5 font-semibold text-slate-700">
                        {cfg ? formatRupiah(cfg.allowance_meal_daily) : <span className="text-slate-400 italic">Belum diset</span>}
                      </td>
                      <td className="py-4 px-5 font-semibold text-slate-700">
                        {cfg ? formatRupiah(cfg.allowance_transport_daily) : <span className="text-slate-400 italic">Belum diset</span>}
                      </td>
                      <td className="py-4 px-5 font-semibold text-slate-700">
                        {cfg ? formatRupiah(cfg.allowance_position) : <span className="text-slate-400 italic">Belum diset</span>}
                      </td>
                      <td className="py-4 px-5 font-semibold text-rose-600">
                        {cfg ? `${formatRupiah(cfg.deduction_late_daily)}/telat` : <span className="text-slate-400 italic">Belum diset</span>}
                      </td>
                      <td className="py-4 px-5 font-semibold text-rose-600">
                        {cfg ? `${formatRupiah(cfg.deduction_absence_daily)}/absen` : <span className="text-slate-400 italic">Belum diset</span>}
                      </td>
                      <td className="py-4 px-5 font-semibold text-rose-600">
                        {cfg ? formatRupiah(cfg.deduction_fixed) : <span className="text-slate-400 italic">Belum diset</span>}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <button
                          onClick={() => handleOpenConfig(emp)}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-600 rounded-xl font-bold transition-all cursor-pointer shadow-sm"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Atur Gaji
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Configuration Edit */}
      {showConfigModal && editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-950/20 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white border border-orange-100 rounded-3xl p-6 max-w-md w-full relative shadow-xl overflow-hidden animate-zoom-in my-8 max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-red-500 via-orange-500 to-transparent"></div>
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-orange-500" />
                Setelan Gaji: {editingEmployee.name}
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 hover:bg-slate-100 rounded-lg cursor-pointer text-xs"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4 font-semibold text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gaji Pokok (Bulanan)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-[11px]">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={basicSalary}
                    onChange={(e) => handleRupiahInput(e.target.value, setBasicSalary)}
                    placeholder="Contoh: 4.000.000"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 text-slate-800 rounded-xl py-2.5 pl-9 pr-3 outline-none transition-all font-bold text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tunj. Makan (Harian)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-[11px]">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={allowanceMealDaily}
                      onChange={(e) => handleRupiahInput(e.target.value, setAllowanceMealDaily)}
                      placeholder="Contoh: 15.000"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 text-slate-800 rounded-xl py-2.5 pl-9 pr-3 outline-none transition-all font-bold text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tunj. Transport (Harian)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-[11px]">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={allowanceTransportDaily}
                      onChange={(e) => handleRupiahInput(e.target.value, setAllowanceTransportDaily)}
                      placeholder="Contoh: 20.000"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 text-slate-800 rounded-xl py-2.5 pl-9 pr-3 outline-none transition-all font-bold text-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tunj. Jabatan (Bulanan)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-[11px]">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={allowancePosition}
                    onChange={(e) => handleRupiahInput(e.target.value, setAllowancePosition)}
                    placeholder="Contoh: 500.000"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 text-slate-800 rounded-xl py-2.5 pl-9 pr-3 outline-none transition-all font-bold text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Potongan Telat (Harian)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-[11px]">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={deductionLateDaily}
                      onChange={(e) => handleRupiahInput(e.target.value, setDeductionLateDaily)}
                      placeholder="Contoh: 15.000"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 text-slate-800 rounded-xl py-2.5 pl-9 pr-3 outline-none transition-all font-bold text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Potongan Absen (Harian)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-[11px]">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={deductionAbsenceDaily}
                      onChange={(e) => handleRupiahInput(e.target.value, setDeductionAbsenceDaily)}
                      placeholder="Contoh: 50.000"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 text-slate-800 rounded-xl py-2.5 pl-9 pr-3 outline-none transition-all font-bold text-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Potongan Tetap (BPJS dll)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-[11px]">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={deductionFixed}
                    onChange={(e) => handleRupiahInput(e.target.value, setDeductionFixed)}
                    placeholder="Contoh: 100.000"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 text-slate-800 rounded-xl py-2.5 pl-9 pr-3 outline-none transition-all font-bold text-xs"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingConfig}
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {submittingConfig && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Simpan Setelan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
