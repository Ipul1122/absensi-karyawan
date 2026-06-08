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
      setBasicSalary(String(employee.salary_configuration.basic_salary))
      setAllowanceMealDaily(String(employee.salary_configuration.allowance_meal_daily ?? 0))
      setAllowanceTransportDaily(String(employee.salary_configuration.allowance_transport_daily ?? 0))
      setAllowancePosition(String(employee.salary_configuration.allowance_position ?? 0))
      setDeductionLateDaily(String(employee.salary_configuration.deduction_late_daily))
      setDeductionAbsenceDaily(String(employee.salary_configuration.deduction_absence_daily ?? 0))
      setDeductionFixed(String(employee.salary_configuration.deduction_fixed))
    } else {
      setBasicSalary('4500000') // Default mock Gaji Pokok
      setAllowanceMealDaily('0')
      setAllowanceTransportDaily('0')
      setAllowancePosition('0')
      setDeductionLateDaily('20000') // Default mock Potongan telat harian
      setDeductionAbsenceDaily('0') // Default mock Potongan tidak masuk harian
      setDeductionFixed('100000') // Default mock Potongan tetap (BPJS)
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
          basic_salary: parseFloat(basicSalary) || 0,
          allowance_meal_daily: parseFloat(allowanceMealDaily) || 0,
          allowance_transport_daily: parseFloat(allowanceTransportDaily) || 0,
          allowance_position: parseFloat(allowancePosition) || 0,
          allowance_fixed: 0,
          deduction_late_daily: parseFloat(deductionLateDaily) || 0,
          deduction_absence_daily: parseFloat(deductionAbsenceDaily) || 0,
          deduction_fixed: parseFloat(deductionFixed) || 0
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.status === 'success') {
        Swal.fire({
          title: 'Berhasil!',
          text: 'Setelan gaji karyawan berhasil disimpan.',
          icon: 'success',
          timer: 1500,
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
              <tr className="bg-orange-55/30 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-orange-100">
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
                  <td colSpan={9} className="py-12 text-center text-slate-450">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                      Memuat data karyawan...
                    </div>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-450 font-semibold">
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
                          <p className="text-[10px] text-slate-450 mt-0.5">{emp.email}</p>
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
                <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider">Gaji Pokok (Bulanan)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-[11px]">Rp</span>
                  <input
                    type="number"
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(e.target.value)}
                    placeholder="Contoh: 4000000"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 text-slate-800 rounded-xl py-2.5 pl-9 pr-3 outline-none transition-all font-bold text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider">Tunj. Makan (Harian)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-[11px]">Rp</span>
                    <input
                      type="number"
                      value={allowanceMealDaily}
                      onChange={(e) => setAllowanceMealDaily(e.target.value)}
                      placeholder="Contoh: 15000"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 text-slate-800 rounded-xl py-2.5 pl-9 pr-3 outline-none transition-all font-bold text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider">Tunj. Transport (Harian)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-[11px]">Rp</span>
                    <input
                      type="number"
                      value={allowanceTransportDaily}
                      onChange={(e) => setAllowanceTransportDaily(e.target.value)}
                      placeholder="Contoh: 20000"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 text-slate-800 rounded-xl py-2.5 pl-9 pr-3 outline-none transition-all font-bold text-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider">Tunj. Jabatan (Bulanan)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-[11px]">Rp</span>
                  <input
                    type="number"
                    value={allowancePosition}
                    onChange={(e) => setAllowancePosition(e.target.value)}
                    placeholder="Contoh: 500000"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 text-slate-800 rounded-xl py-2.5 pl-9 pr-3 outline-none transition-all font-bold text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider">Potongan Telat (Harian)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-[11px]">Rp</span>
                    <input
                      type="number"
                      value={deductionLateDaily}
                      onChange={(e) => setDeductionLateDaily(e.target.value)}
                      placeholder="Contoh: 15000"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 text-slate-800 rounded-xl py-2.5 pl-9 pr-3 outline-none transition-all font-bold text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-555 uppercase tracking-wider">Potongan Absen (Harian)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-[11px]">Rp</span>
                    <input
                      type="number"
                      value={deductionAbsenceDaily}
                      onChange={(e) => setDeductionAbsenceDaily(e.target.value)}
                      placeholder="Contoh: 50000"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 text-slate-800 rounded-xl py-2.5 pl-9 pr-3 outline-none transition-all font-bold text-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider">Potongan Tetap (BPJS dll)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-[11px]">Rp</span>
                  <input
                    type="number"
                    value={deductionFixed}
                    onChange={(e) => setDeductionFixed(e.target.value)}
                    placeholder="Contoh: 100000"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 text-slate-800 rounded-xl py-2.5 pl-9 pr-3 outline-none transition-all font-bold text-xs"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 py-2.5 border border-slate-250 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingConfig}
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-650 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
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
