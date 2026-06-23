import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { 
  Settings, 
  Loader2, 
  Edit3,
  MessageSquare,
  Send
} from 'lucide-react'

interface User {
  id: number
  name: string
  email: string
  company?: string | null
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
  
  // WhatsApp notification states
  const [directors, setDirectors] = useState<any[]>([])
  const [showWaModal, setShowWaModal] = useState(false)
  const [waEmployee, setWaEmployee] = useState<User | null>(null)
  const [selectedDirectorId, setSelectedDirectorId] = useState<string>('')
  const [directorPhone, setDirectorPhone] = useState<string>('')
  const [waMessage, setWaMessage] = useState<string>('')
  
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

  const fetchDirectors = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/admin/directors', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setDirectors(response.data.data)
      }
    } catch (err) {
      console.error('Gagal mengambil data direktur:', err)
    }
  }

  useEffect(() => {
    fetchConfigurations()
    fetchDirectors()
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

  const handleOpenWaModal = (employee: User) => {
    setWaEmployee(employee)
    
    const employeeCompany = employee.company
    let matchedDirector = directors.find(d => d.company === employeeCompany)
    if (!matchedDirector && directors.length > 0) {
      matchedDirector = directors[0]
    }

    if (matchedDirector) {
      setSelectedDirectorId(matchedDirector.id.toString())
      setDirectorPhone(matchedDirector.whatsapp || '')
    } else {
      setSelectedDirectorId('')
      setDirectorPhone('')
    }

    const cfg = employee.salary_configuration
    if (cfg) {
      const isPending = cfg.salary_change_status === 'pending'
      const basic = (isPending && cfg.pending_basic_salary !== null && cfg.pending_basic_salary !== undefined ? cfg.pending_basic_salary : cfg.basic_salary) ?? 0
      const meal = (isPending && cfg.pending_allowance_meal_daily !== null && cfg.pending_allowance_meal_daily !== undefined ? cfg.pending_allowance_meal_daily : (cfg.allowance_meal_daily ?? 0)) ?? 0
      const trans = (isPending && cfg.pending_allowance_transport_daily !== null && cfg.pending_allowance_transport_daily !== undefined ? cfg.pending_allowance_transport_daily : (cfg.allowance_transport_daily ?? 0)) ?? 0
      const pos = (isPending && cfg.pending_allowance_position !== null && cfg.pending_allowance_position !== undefined ? cfg.pending_allowance_position : (cfg.allowance_position ?? 0)) ?? 0
      const late = (isPending && cfg.pending_deduction_late_daily !== null && cfg.pending_deduction_late_daily !== undefined ? cfg.pending_deduction_late_daily : cfg.deduction_late_daily) ?? 0
      const absence = (isPending && cfg.pending_deduction_absence_daily !== null && cfg.pending_deduction_absence_daily !== undefined ? cfg.pending_deduction_absence_daily : (cfg.deduction_absence_daily ?? 0)) ?? 0
      const fixedDeduct = (isPending && cfg.pending_deduction_fixed !== null && cfg.pending_deduction_fixed !== undefined ? cfg.pending_deduction_fixed : cfg.deduction_fixed) ?? 0

      const directorName = matchedDirector ? matchedDirector.name : 'Direktur'
      const companyName = employee.company || '-'
      const approvalUrl = `${window.location.origin}/director/gaji`

      const messageText = `Halo *${directorName}*,

Berikut adalah pengajuan perubahan setelan gaji karyawan untuk disetujui:

*Nama Karyawan*: ${employee.name}
*Perusahaan*: ${companyName}

*Rincian Setelan Gaji Pokok & Tunjangan Baru*:
- Gaji Pokok: ${formatRupiah(basic)}
- Tunj. Makan (Harian): ${formatRupiah(meal)}
- Tunj. Transport (Harian): ${formatRupiah(trans)}
- Tunj. Jabatan (Bulanan): ${formatRupiah(pos)}
- Potongan Telat (Harian): ${formatRupiah(late)}
- Potongan Absen (Harian): ${formatRupiah(absence)}
- Potongan Tetap: ${formatRupiah(fixedDeduct)}

Mohon untuk memeriksa dan melakukan persetujuan melalui sistem di link berikut:
${approvalUrl}

Terima kasih.`

      setWaMessage(messageText)
    }

    setShowWaModal(true)
  }

  const handleDirectorChange = (directorId: string) => {
    setSelectedDirectorId(directorId)
    const director = directors.find(d => d.id.toString() === directorId)
    if (director && waEmployee) {
      setDirectorPhone(director.whatsapp || '')
      
      const cfg = waEmployee.salary_configuration
      if (cfg) {
        const isPending = cfg.salary_change_status === 'pending'
        const basic = (isPending && cfg.pending_basic_salary !== null && cfg.pending_basic_salary !== undefined ? cfg.pending_basic_salary : cfg.basic_salary) ?? 0
        const meal = (isPending && cfg.pending_allowance_meal_daily !== null && cfg.pending_allowance_meal_daily !== undefined ? cfg.pending_allowance_meal_daily : (cfg.allowance_meal_daily ?? 0)) ?? 0
        const trans = (isPending && cfg.pending_allowance_transport_daily !== null && cfg.pending_allowance_transport_daily !== undefined ? cfg.pending_allowance_transport_daily : (cfg.allowance_transport_daily ?? 0)) ?? 0
        const pos = (isPending && cfg.pending_allowance_position !== null && cfg.pending_allowance_position !== undefined ? cfg.pending_allowance_position : (cfg.allowance_position ?? 0)) ?? 0
        const late = (isPending && cfg.pending_deduction_late_daily !== null && cfg.pending_deduction_late_daily !== undefined ? cfg.pending_deduction_late_daily : cfg.deduction_late_daily) ?? 0
        const absence = (isPending && cfg.pending_deduction_absence_daily !== null && cfg.pending_deduction_absence_daily !== undefined ? cfg.pending_deduction_absence_daily : (cfg.deduction_absence_daily ?? 0)) ?? 0
        const fixedDeduct = (isPending && cfg.pending_deduction_fixed !== null && cfg.pending_deduction_fixed !== undefined ? cfg.pending_deduction_fixed : cfg.deduction_fixed) ?? 0

        const approvalUrl = `${window.location.origin}/director/gaji`
        const companyName = waEmployee.company || '-'

        const messageText = `Halo *${director.name}*,

Berikut adalah pengajuan perubahan setelan gaji karyawan untuk disetujui:

*Nama Karyawan*: ${waEmployee.name}
*Perusahaan*: ${companyName}

*Rincian Setelan Gaji Pokok & Tunjangan Baru*:
- Gaji Pokok: ${formatRupiah(basic)}
- Tunj. Makan (Harian): ${formatRupiah(meal)}
- Tunj. Transport (Harian): ${formatRupiah(trans)}
- Tunj. Jabatan (Bulanan): ${formatRupiah(pos)}
- Potongan Telat (Harian): ${formatRupiah(late)}
- Potongan Absen (Harian): ${formatRupiah(absence)}
- Potongan Tetap: ${formatRupiah(fixedDeduct)}

Mohon untuk memeriksa dan melakukan persetujuan melalui sistem di link berikut:
${approvalUrl}

Terima kasih.`

        setWaMessage(messageText)
      }
    }
  }

  const handleSendWa = () => {
    if (!directorPhone) {
      Swal.fire({
        title: 'Nomor WhatsApp Kosong',
        text: 'Direktur yang dipilih belum menyetel nomor WhatsApp di profil mereka.',
        icon: 'warning'
      })
      return
    }

    const cleanPhone = directorPhone.replace(/[^0-9]/g, '')
    if (cleanPhone.length < 9) {
      Swal.fire({
        title: 'Nomor Tidak Valid',
        text: 'Format nomor WhatsApp tidak valid.',
        icon: 'warning'
      })
      return
    }

    let formattedPhone = cleanPhone
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.substring(1)
    }

    const encodedText = encodeURIComponent(waMessage)
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodedText}`
    window.open(waUrl, '_blank')
    setShowWaModal(false)
  }

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number)
  }

  // Format number to Rupiah input display with dot separators (e.g. 5000000 -> 5.000.000)
  function formatInputRupiah(value: number | string | null | undefined): string {
    const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0)
    if (isNaN(num)) return '0'
    const intValue = Math.round(num)
    return new Intl.NumberFormat('id-ID').format(intValue)
  }

  // Parse formatted Rupiah input back to plain number string (e.g. 5.000.000 -> 5000000)
  function parseInputRupiah(formatted: string): string {
    return formatted.replace(/\./g, '')
  }

  // Handle Rupiah input change: strip non-digits, reformat with dots
  function handleRupiahInput(value: string, setter: React.Dispatch<React.SetStateAction<string>>) {
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
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenConfig(emp)}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-600 rounded-xl font-bold transition-all cursor-pointer shadow-sm"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Atur Gaji
                          </button>
                          {cfg && cfg.salary_change_status === 'pending' && (
                            <button
                              onClick={() => handleOpenWaModal(emp)}
                              className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-50 border border-emerald-200 hover:border-emerald-500 hover:text-emerald-700 text-emerald-600 rounded-xl font-bold transition-all cursor-pointer shadow-sm"
                              title="Kirim detail perubahan ke WhatsApp Direktur"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              Kirim WA
                            </button>
                          )}
                        </div>
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

      {/* Modal: WhatsApp Send */}
      {showWaModal && waEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-950/20 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white border border-orange-100 rounded-3xl p-6 max-w-lg w-full relative shadow-xl overflow-hidden animate-zoom-in my-8 max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-transparent"></div>
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                Kirim WA ke Direktur
              </h3>
              <button
                onClick={() => setShowWaModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 hover:bg-slate-100 rounded-lg cursor-pointer text-xs"
              >
                Tutup
              </button>
            </div>

            <div className="space-y-4 font-semibold text-xs text-slate-700">
              <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1">
                <p className="text-[10px] uppercase font-bold text-emerald-700">Info Karyawan</p>
                <p className="text-xs text-slate-800">Nama: <span className="font-extrabold">{waEmployee.name}</span></p>
                <p className="text-xs text-slate-800">Perusahaan: <span className="font-extrabold">{waEmployee.company || '-'}</span></p>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pilih Direktur</label>
                <select
                  value={selectedDirectorId}
                  onChange={(e) => handleDirectorChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl py-2.5 px-3 outline-none font-bold text-xs"
                >
                  <option value="" disabled>-- Pilih Direktur --</option>
                  {directors.map((dir) => (
                    <option key={dir.id} value={dir.id.toString()}>
                      {dir.name} ({dir.company})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Isi Pesan WhatsApp (Dapat Diedit)</label>
                <textarea
                  rows={10}
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 outline-none font-mono text-[11px] font-medium resize-none leading-relaxed"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowWaModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSendWa}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
                >
                  <Send className="w-3.5 h-3.5" />
                  Kirim ke WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
