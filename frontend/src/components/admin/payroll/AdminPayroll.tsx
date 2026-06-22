import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { 
  Coins, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2, 
  Printer, 
  Loader2, 
  Info,
  HelpCircle,
  FileDown,
  Plus,
  CalendarRange,
  Building2
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

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
  allowance_overtime?: number
  allowance_bonus?: number
  deduction_late: number
  deduction_fixed: number
  deduction_absence: number
  net_salary: number
  status: 'draft' | 'unpaid' | 'paid' | 'pending_approval'
  paid_at: string | null
  notes: string | null
  updated_at: string
  verification_hash?: string
  user: {
    id: number
    name: string
    email: string
    no_rekening?: string | null
    company?: string | null
    division?: string | null
    employee_number?: string | null
    join_date?: string | null
  }
}

interface AdminPayrollProps {
  token: string
}

export default function AdminPayroll({ token }: AdminPayrollProps) {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([])
  const [hrManagerName, setHrManagerName] = useState('HRD Department')
  
  // Selection states
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [selectedCompany, setSelectedCompany] = useState<string>('all')

  const filteredRecords = payrollRecords.filter(record => {
    if (selectedCompany === 'all') return true
    return record.user?.company === selectedCompany
  })
  
  // Loading states
  const [loadingPayroll, setLoadingPayroll] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [submittingAdjustment, setSubmittingAdjustment] = useState(false)
  
  // Modals state
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustingPayroll, setAdjustingPayroll] = useState<PayrollRecord | null>(null)
  
  // Form Adjustment states
  const [adjustBasic, setAdjustBasic] = useState('0')
  const [adjustMeal, setAdjustMeal] = useState('0')
  const [adjustTransport, setAdjustTransport] = useState('0')
  const [adjustPosition, setAdjustPosition] = useState('0')
  const [adjustFixedAllow, setAdjustFixedAllow] = useState('0')
  const [adjustLateDeduct, setAdjustLateDeduct] = useState('0')
  const [adjustFixedDeduct, setAdjustFixedDeduct] = useState('0')
  const [adjustAbsenceDeduct, setAdjustAbsenceDeduct] = useState('0')
  const [adjustNotes, setAdjustNotes] = useState('')

  // Detail Slip modal
  const [showSlipModal, setShowSlipModal] = useState(false)
  const [selectedSlip, setSelectedSlip] = useState<PayrollRecord | null>(null)

  // Tab & Holidays states
  const [activeTab, setActiveTab] = useState<'payroll' | 'holidays'>('payroll')
  const [holidays, setHolidays] = useState<any[]>([])
  const [loadingHolidays, setLoadingHolidays] = useState(false)
  const [newHolidayDate, setNewHolidayDate] = useState('')
  const [newHolidayName, setNewHolidayName] = useState('')
  const [savingHoliday, setSavingHoliday] = useState(false)
  const [seedingHolidays, setSeedingHolidays] = useState(false)

  // Fetch holidays list
  const fetchHolidays = async () => {
    setLoadingHolidays(true)
    try {
      const response = await axios.get('http://localhost:8000/api/admin/holidays', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setHolidays(response.data.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingHolidays(false)
    }
  }

  // Add new holiday date
  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newHolidayDate || !newHolidayName) {
      Swal.fire({
        title: 'Form Belum Lengkap',
        text: 'Silakan isi tanggal dan nama hari libur.',
        icon: 'warning',
        confirmButtonColor: '#ea580c'
      })
      return
    }
    setSavingHoliday(true)
    try {
      const response = await axios.post(
        'http://localhost:8000/api/admin/holidays',
        { holiday_date: newHolidayDate, name: newHolidayName },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (response.data.status === 'success') {
        Swal.fire({
          title: 'Berhasil!',
          text: response.data.message,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        })
        setNewHolidayDate('')
        setNewHolidayName('')
        fetchHolidays()
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal menambahkan hari libur.'
      Swal.fire({
        title: 'Gagal',
        text: msg,
        icon: 'error'
      })
    } finally {
      setSavingHoliday(false)
    }
  }

  // Delete holiday
  const handleDeleteHoliday = async (id: number, name: string) => {
    Swal.fire({
      title: 'Hapus Hari Libur?',
      text: `Apakah Anda yakin ingin menghapus hari libur "${name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(`http://localhost:8000/api/admin/holidays/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (response.data.status === 'success') {
            Swal.fire({
              title: 'Berhasil!',
              text: response.data.message,
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            })
            fetchHolidays()
          }
        } catch (err: any) {
          console.error(err)
          Swal.fire({
            title: 'Gagal',
            text: err.response?.data?.message || 'Gagal menghapus hari libur.',
            icon: 'error'
          })
        }
      }
    })
  }

  // Import Holidays automatically based on the selected month's year
  const handleImportHolidays = async () => {
    const yearStr = selectedMonth ? selectedMonth.split('-')[0] : String(new Date().getFullYear())
    const year = parseInt(yearStr, 10) || new Date().getFullYear()

    Swal.fire({
      title: `Impor Libur Nasional & Cuti ${year}?`,
      text: `Sistem akan mengambil data dari API publik untuk mengimpor semua hari libur nasional resmi Indonesia tahun ${year} ke database.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ea580c',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Ya, Impor Semua!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setSeedingHolidays(true)
        try {
          const response = await axios.post(
            'http://localhost:8000/api/admin/holidays/import',
            { year },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          if (response.data.status === 'success') {
            Swal.fire({
              title: 'Berhasil!',
              text: response.data.message,
              icon: 'success'
            })
            fetchHolidays()
          }
        } catch (err: any) {
          console.error(err)
          const msg = err.response?.data?.message || 'Gagal mengimpor hari libur.'
          Swal.fire({
            title: 'Gagal',
            text: msg,
            icon: 'error'
          })
        } finally {
          setSeedingHolidays(false)
        }
      }
    })
  }

  useEffect(() => {
    fetchHolidays()
  }, [])

  // Fetch payroll transactions for selected month
  const fetchPayrolls = async () => {
    setLoadingPayroll(true)
    try {
      const response = await axios.get(`http://localhost:8000/api/admin/payroll?period_month=${selectedMonth}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setPayrollRecords(response.data.data)
        if (response.data.hr_manager_name) {
          setHrManagerName(response.data.hr_manager_name)
        }
      }
    } catch (err) {
      console.error(err)
      setPayrollRecords([])
    } finally {
      setLoadingPayroll(false)
    }
  }

  useEffect(() => {
    fetchPayrolls()
  }, [selectedMonth])

  // Export to PDF
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    const [year, month] = selectedMonth.split('-')
    const displayMonthName = monthNames[parseInt(month, 10) - 1] + ' ' + year

    const totalSalary = filteredRecords.reduce((sum, r) => sum + r.net_salary, 0)
    const paidSalary = filteredRecords.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.net_salary, 0)
    const unpaidSalary = filteredRecords.filter(r => r.status !== 'paid').reduce((sum, r) => sum + r.net_salary, 0)

    // Dynamic brand elements
    let companyName = 'Semua Perusahaan'
    let logoPath = '/logo-perusahaan.png' // default fallback
    let docTitle = `Laporan Payroll Semua - ${displayMonthName}`

    if (selectedCompany === 'PT Yasodana Parvez Internasional') {
      companyName = 'PT Yasodana Parvez Internasional'
      logoPath = '/logo/LOGO-YPI.png'
      docTitle = `Laporan Payroll YPI - ${displayMonthName}`
    } else if (selectedCompany === 'PT Cakrawala Parama Internasional') {
      companyName = 'PT Cakrawala Parama Internasional'
      logoPath = '/logo/LOGO-CPI.png'
      docTitle = `Laporan Payroll CPI - ${displayMonthName}`
    }

    const fullLogoUrl = logoPath.startsWith('http') ? logoPath : `${window.location.origin}${logoPath}`

    const htmlContent = `
      <html>
        <head>
          <title>${docTitle}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #334155; padding: 25px; line-height: 1.5; }
            h1 { text-align: center; color: #1e293b; margin-bottom: 5px; font-size: 20px; font-weight: 800; }
            h3 { text-align: center; color: #64748b; font-weight: 600; font-size: 13px; margin-top: 0; margin-bottom: 25px; }
            .company-header { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; }
            .company-logo { height: 50px; width: auto; object-fit: contain; }
            .company-info { text-align: left; }
            .company-info h2 { margin: 0; font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; }
            .company-info p { margin: 2px 0 0 0; font-size: 9px; color: #64748b; font-weight: 600; }
            .totals { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
            .totals-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; text-align: center; background-color: #ffffff; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
            .totals-card .count { font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 4px; }
            .totals-card .label { font-size: 8px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
            table.data-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 9px; }
            table.data-table th, table.data-table td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; }
            table.data-table th { background-color: #f1f5f9; font-weight: 700; color: #334155; text-transform: uppercase; font-size: 7.5px; letter-spacing: 0.5px; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 7.5px; font-weight: 700; text-transform: uppercase; border: 1px solid transparent; }
            .badge-paid { background-color: #ecfdf5; color: #047857; border-color: #a7f3d0; }
            .badge-unpaid { background-color: #fef2f2; color: #b91c1c; border-color: #fca5a5; }
            .badge-draft { background-color: #fffbeb; color: #b45309; border-color: #fde68a; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            @media print {
              button { display: none; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="company-header">
            <img src="${fullLogoUrl}" alt="Logo" class="company-logo" onerror="this.style.display='none'" />
            <div class="company-info">
              <h2>${companyName}</h2>
              <p>Laporan Rekapitulasi Pembayaran Gaji Karyawan</p>
            </div>
          </div>
          <h1>Laporan Bulanan Payroll Karyawan</h1>
          <h3>Periode: ${displayMonthName} | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</h3>
          
          <div class="totals">
            <div class="totals-card">
              <div class="label">Total Pengeluaran Gaji</div>
              <div class="count" style="color: #000000;">${formatRupiah(totalSalary)}</div>
            </div>
            <div class="totals-card">
              <div class="label">Telah Dibayar (Paid)</div>
              <div class="count" style="color: #000000;">${formatRupiah(paidSalary)}</div>
            </div>
            <div class="totals-card">
              <div class="label">Belum Dibayar (Draft/Unpaid)</div>
              <div class="count" style="color: #000000;">${formatRupiah(unpaidSalary)}</div>
            </div>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 3%; text-align: center;">No</th>
                <th style="width: 15%;">Karyawan</th>
                <th style="width: 10%; text-align: center;">Kehadiran (H/T/C)</th>
                <th style="width: 12%; text-align: right;">Gaji Pokok</th>
                <th style="width: 25%;">Tunjangan</th>
                <th style="width: 18%;">Potongan</th>
                <th style="width: 12%; text-align: right;">Gaji Bersih</th>
                <th style="width: 5%; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRecords.length === 0 ? `
                <tr>
                  <td colSpan="8" style="text-align: center; padding: 20px; color: #64748b;">
                    Tidak ada data rekap payroll untuk periode ini (${displayMonthName}).
                  </td>
                </tr>
              ` : filteredRecords.map((record, idx) => `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td>
                    <strong>${record.user.name}</strong><br/>
                    <span style="color: #64748b; font-size: 8px;">${record.user.email}</span>
                    <br/><span style="color: #64748b; font-size: 8px; font-weight: bold;">Perusahaan: ${record.user.company || '-'}</span>
                    ${record.user.join_date ? `<br/><span style="color: #ea580c; font-size: 8px; font-weight: bold;">Masuk: ${new Date(record.user.join_date).toLocaleDateString('id-ID')}</span>` : ''}
                  </td>
                  <td class="text-center">${record.days_present}H / ${record.days_late}T / ${record.days_leave}C</td>
                  <td class="text-right">${formatRupiah(record.basic_salary)}</td>
                  <td>
                    <div style="font-size: 8px;">
                      ${record.allowance_meal > 0 ? `Makan: +${formatRupiah(record.allowance_meal)}<br/>` : ''}
                      ${record.allowance_transport > 0 ? `Transport: +${formatRupiah(record.allowance_transport)}<br/>` : ''}
                      ${record.allowance_position > 0 ? `Jabatan: +${formatRupiah(record.allowance_position)}<br/>` : ''}
                      ${record.allowance_fixed > 0 ? `Tetap: +${formatRupiah(record.allowance_fixed)}` : ''}
                    </div>
                  </td>
                  <td>
                    <div style="font-size: 8px;">
                      ${record.deduction_late > 0 ? `Telat: -${formatRupiah(record.deduction_late)}<br/>` : ''}
                      ${record.deduction_absence > 0 ? `Absen: -${formatRupiah(record.deduction_absence)}<br/>` : ''}
                      ${record.deduction_fixed > 0 ? `Lainnya: -${formatRupiah(record.deduction_fixed)}` : ''}
                    </div>
                  </td>
                  <td class="text-right" style="font-weight: bold; color: #0f172a;">${formatRupiah(record.net_salary)}</td>
                  <td class="text-center">
                    <span class="badge badge-${record.status}">
                      ${record.status === 'paid' ? 'Lunas' : record.status === 'unpaid' ? 'Belum Bayar' : record.status === 'pending_approval' ? 'Menunggu Direktur' : 'Draft'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  // Export to Excel
  const handleExportExcel = () => {
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    const [year, month] = selectedMonth.split('-')
    const displayMonthName = monthNames[parseInt(month, 10) - 1] + ' ' + year

    const holidaysThisMonth = holidays.filter(h => h.holiday_date && isHolidayInSelectedMonth(h.holiday_date, selectedMonth))
    const holidayInfoStr = holidaysThisMonth.length > 0 
      ? holidaysThisMonth.map(h => {
          const d = new Date(h.holiday_date)
          return `${d.getDate()} (${h.name})`
        }).join(', ')
      : 'Tidak ada'

    // Dynamic brand elements
    let companyName = 'Semua Perusahaan'
    let filename = `Laporan_Payroll_Semua_Perusahaan_${displayMonthName.replace(/\s+/g, '_')}.xls`

    if (selectedCompany === 'PT Yasodana Parvez Internasional') {
      companyName = 'PT Yasodana Parvez Internasional'
      filename = `Laporan_Payroll_YPI_${displayMonthName.replace(/\s+/g, '_')}.xls`
    } else if (selectedCompany === 'PT Cakrawala Parama Internasional') {
      companyName = 'PT Cakrawala Parama Internasional'
      filename = `Laporan_Payroll_CPI_${displayMonthName.replace(/\s+/g, '_')}.xls`
    }

    let excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:Name>Laporan Payroll</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #fed7aa; padding: 8px; text-align: left; vertical-align: middle; }
          th { background-color: #ea580c; color: white; font-weight: bold; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .title { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
          .subtitle { font-size: 12px; color: #ea580c; margin-bottom: 5px; }
          .holidays-label { font-size: 12px; color: #dc2626; font-weight: bold; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="title">Laporan Bulanan Payroll Karyawan - ${companyName}</div>
        <div class="subtitle">Periode: ${displayMonthName} | Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID')}</div>
        <div class="holidays-label">Hari Libur Nasional: ${holidayInfoStr}</div>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Karyawan</th>
              <th>Perusahaan</th>
              <th>Email</th>
              <th>Tanggal Bergabung</th>
              <th>Hari Hadir (H)</th>
              <th>Hari Terlambat (T)</th>
              <th>Hari Cuti (C)</th>
              <th>Gaji Pokok (Base)</th>
              <th>Tunj. Makan (Harian)</th>
              <th>Tunj. Transport (Harian)</th>
              <th>Tunj. Jabatan (Bulanan)</th>
              <th>Tunj. Tetap</th>
              <th>Potongan Telat (Harian)</th>
              <th>Potongan Tidak Masuk (Harian)</th>
              <th>Potongan Tetap (BPJS dll)</th>
              <th>Gaji Bersih</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
    `

    filteredRecords.forEach((record, idx) => {
      const joinDateStr = record.user.join_date 
        ? new Date(record.user.join_date).toLocaleDateString('id-ID')
        : '-'
      excelContent += `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td><b>${record.user.name}</b></td>
          <td>${record.user.company || '-'}</td>
          <td>${record.user.email}</td>
          <td>${joinDateStr}</td>
          <td class="text-center">${record.days_present}</td>
          <td class="text-center">${record.days_late}</td>
          <td class="text-center">${record.days_leave}</td>
          <td class="text-right">${formatRupiah(record.basic_salary)}</td>
          <td class="text-right">${formatRupiah(record.allowance_meal ?? 0)}</td>
          <td class="text-right">${formatRupiah(record.allowance_transport ?? 0)}</td>
          <td class="text-right">${formatRupiah(record.allowance_position ?? 0)}</td>
          <td class="text-right">${formatRupiah(record.allowance_fixed ?? 0)}</td>
          <td class="text-right">${formatRupiah(record.deduction_late)}</td>
          <td class="text-right">${formatRupiah(record.deduction_absence ?? 0)}</td>
          <td class="text-right">${formatRupiah(record.deduction_fixed)}</td>
          <td class="text-right" style="font-weight: bold;">${formatRupiah(record.net_salary)}</td>
          <td class="text-center">${record.status === 'paid' ? 'Paid' : record.status === 'unpaid' ? 'Unpaid' : record.status === 'pending_approval' ? 'Pending Approval' : 'Draft'}</td>
        </tr>
      `
    })

    if (filteredRecords.length === 0) {
      excelContent += `
        <tr>
          <td colspan="18" class="text-center" style="color: #64748b; padding: 20px;">Tidak ada data payroll pada periode ini.</td>
        </tr>
      `
    }

    excelContent += `
          </tbody>
        </table>
      </body>
      </html>
    `

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Generate Monthly Payroll
  const handleGeneratePayroll = async () => {
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    const [year, month] = selectedMonth.split('-')
    const displayMonthName = monthNames[parseInt(month, 10) - 1] + ' ' + year

    Swal.fire({
      title: 'Generate Rekap Gaji Karyawan?',
      text: `Sistem akan menghitung otomatis seluruh absensi dan cuti karyawan untuk periode ${displayMonthName}. Rekam jejak gaji lama pada periode ini (jika berstatus Draft/Belum Dibayar) akan diperbarui.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ea580c',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Ya, Hitung Gaji!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setGenerating(true)
        try {
          const response = await axios.post(
            'http://localhost:8000/api/admin/payroll/generate',
            { period_month: selectedMonth },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          
          if (response.data.status === 'success') {
            Swal.fire({
              title: 'Selesai!',
              text: response.data.message,
              icon: 'success'
            })
            fetchPayrolls()
          }
        } catch (err: any) {
          console.error(err)
          const msg = err.response?.data?.message || 'Gagal men-generate penggajian.'
          Swal.fire({
            title: 'Gagal',
            text: msg,
            icon: 'error'
          })
        } finally {
          setGenerating(false)
        }
      }
    })
  }



  // Open Adjust Modal
  const handleOpenAdjust = (record: PayrollRecord) => {
    setAdjustingPayroll(record)
    setAdjustBasic(formatInputRupiah(record.basic_salary))
    setAdjustMeal(formatInputRupiah(record.allowance_meal ?? 0))
    setAdjustTransport(formatInputRupiah(record.allowance_transport ?? 0))
    setAdjustPosition(formatInputRupiah(record.allowance_position ?? 0))
    setAdjustFixedAllow(formatInputRupiah(record.allowance_fixed ?? 0))
    setAdjustLateDeduct(formatInputRupiah(record.deduction_late))
    setAdjustFixedDeduct(formatInputRupiah(record.deduction_fixed))
    setAdjustAbsenceDeduct(formatInputRupiah(record.deduction_absence ?? 0))
    setAdjustNotes(record.notes || '')
    setShowAdjustModal(true)
  }

  // Submit Manual Adjustment
  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustingPayroll) return

    setSubmittingAdjustment(true)
    try {
      const response = await axios.put(
        `http://localhost:8000/api/admin/payroll/${adjustingPayroll.id}/update`,
        {
          basic_salary: parseFloat(parseInputRupiah(adjustBasic)) || 0,
          allowance_meal: parseFloat(parseInputRupiah(adjustMeal)) || 0,
          allowance_transport: parseFloat(parseInputRupiah(adjustTransport)) || 0,
          allowance_position: parseFloat(parseInputRupiah(adjustPosition)) || 0,
          allowance_fixed: parseFloat(parseInputRupiah(adjustFixedAllow)) || 0,
          deduction_late: parseFloat(parseInputRupiah(adjustLateDeduct)) || 0,
          deduction_fixed: parseFloat(parseInputRupiah(adjustFixedDeduct)) || 0,
          deduction_absence: parseFloat(parseInputRupiah(adjustAbsenceDeduct)) || 0,
          notes: adjustNotes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.status === 'success') {
        Swal.fire({
          title: 'Berhasil!',
          text: 'Penyesuaian gaji berhasil disimpan.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        })
        setShowAdjustModal(false)
        fetchPayrolls()
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal menyimpan penyesuaian gaji.'
      Swal.fire({
        title: 'Error',
        text: msg,
        icon: 'error'
      })
    } finally {
      setSubmittingAdjustment(false)
    }
  }

  // Delete Payroll record
  const handleDeletePayroll = (record: PayrollRecord) => {
    Swal.fire({
      title: 'Hapus Rekam Jejak Gaji?',
      text: `Apakah Anda yakin ingin menghapus data gaji ${record.user.name} pada periode ${record.period_month}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(
            `http://localhost:8000/api/admin/payroll/${record.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          if (response.data.status === 'success') {
            Swal.fire({
              title: 'Dihapus!',
              text: 'Data gaji berhasil dihapus dari rekam jejak.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            })
            fetchPayrolls()
          }
        } catch (err: any) {
          console.error(err)
          const msg = err.response?.data?.message || 'Gagal menghapus data gaji.'
          Swal.fire({
            title: 'Gagal',
            text: msg,
            icon: 'error'
          })
        }
      }
    })
  }

  const handleSendToDirector = async (record: PayrollRecord) => {
    Swal.fire({
      title: 'Ajukan ke Direktur?',
      text: `Apakah Anda yakin ingin mengajukan slip gaji ${record.user.name} ke Direktur Utama untuk disetujui?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ea580c',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Ya, Ajukan!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.post(
            `http://localhost:8000/api/admin/payroll/${record.id}/submit-approval`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          )
          if (response.data.status === 'success') {
            Swal.fire({
              title: 'Berhasil Diajukan!',
              text: response.data.message,
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
            text: err.response?.data?.message || 'Gagal mengajukan payroll.',
            icon: 'error'
          })
        }
      }
    })
  }


  const handleSubmitAllToDirector = async () => {
    Swal.fire({
      title: 'Ajukan Gaji ke Direktur?',
      text: selectedCompany === 'all'
        ? `Apakah Anda yakin ingin mengajukan seluruh slip gaji Draft pada periode ${selectedMonth} ke Direktur Utama?`
        : `Apakah Anda yakin ingin mengajukan seluruh slip gaji Draft ${selectedCompany} pada periode ${selectedMonth} ke Direktur Utama?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Ya, Ajukan!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.post(
            `http://localhost:8000/api/admin/payroll/submit-all-approval`,
            { period_month: selectedMonth, company: selectedCompany },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          if (response.data.status === 'success') {
            Swal.fire({
              title: 'Berhasil Diajukan!',
              text: response.data.message,
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
            text: err.response?.data?.message || 'Gagal mengajukan payroll.',
            icon: 'error'
          })
        }
      }
    })
  }

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number)
  }

  // Format number to Rupiah input display with dot separators (e.g. 5000000 -> 5.000.000)
  const formatInputRupiah = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return '0'
    // Remove trailing .00 (cents) and format with dot separators
    const intValue = Math.round(num) // strip any .00 decimals
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

  const getIndonesianMonthLabel = (periodMonth: string) => {
    if (!periodMonth) return ''
    const [year, month] = periodMonth.split('-')
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    return `${monthNames[parseInt(month, 10) - 1]} ${year}`
  }

  const isHolidayInSelectedMonth = (holidayDate: string, selMonth: string): boolean => {
    if (!holidayDate || !selMonth) return false
    const dateObj = new Date(holidayDate)
    const localYear = dateObj.getFullYear()
    const localMonth = String(dateObj.getMonth() + 1).padStart(2, '0')
    return `${localYear}-${localMonth}` === selMonth
  }

  // Print slip handler
  const handlePrintSlip = (record: PayrollRecord) => {
    setSelectedSlip(record)
    setShowSlipModal(true)
  }

  const triggerBrowserPrint = () => {
    const printContent = document.getElementById('slip-print-area')?.innerHTML
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Slip Gaji - ${selectedSlip?.user.name}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; }
            .slip-card { border: 2px solid #e2e8f0; border-radius: 16px; padding: 30px; background-color: #ffffff; max-width: 650px; margin: 0 auto; }
            .header { display: flex; flex-direction: row; justify-content: space-between; align-items: center; border-bottom: 2px solid #000000; padding-bottom: 16px; margin-bottom: 20px; }
            .logo img { height: 52px; width: auto; object-fit: contain; }
            .title { text-align: right; }
            .title h2 { margin: 0; color: #0f172a; font-size: 16px; font-weight: 800; text-transform: uppercase; }
            .title p { margin: 4px 0 0 0; font-size: 10px; color: #ea580c; font-weight: 700; }
            .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 11px; margin-bottom: 30px; background-color: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .meta div { margin-bottom: 4px; }
            .section-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }
            .grid-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
            .item-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 8px; }
            .item-row.bold { font-weight: 700; color: #0f172a; border-top: 1px dashed #e2e8f0; padding-top: 8px; margin-top: 10px; }
            .total-section { background: #ffffff; border: 1px solid #000000; border-radius: 12px; padding: 15px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
            .total-label { font-size: 12px; font-weight: 800; color: #000000; text-transform: uppercase; }
            .total-value { font-size: 18px; font-weight: 800; color: #000000; }
            .footer { display: flex; justify-content: space-between; margin-top: 40px; font-size: 11px; }
            .signature { text-align: center; width: 150px; }
            .signature .line { border-bottom: 1px solid #94a3b8; height: 50px; margin-bottom: 6px; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 8px; font-weight: 700; text-transform: uppercase; background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
            @page {
              size: A5 landscape;
              margin: 0;
            }
            @media print {
              body { margin: 0.3cm; padding: 0; background-color: #ffffff; font-size: 9px; }
              .slip-card { border: none; padding: 0; max-width: 100%; box-shadow: none; break-inside: avoid; page-break-inside: avoid; }
              
              .header { margin-bottom: 6px !important; padding-bottom: 6px !important; border-bottom: 1.5px solid #000000 !important; }
              .header .logo img { height: 38px !important; }
              .header h1 { font-size: 11px !important; }
              .header p { font-size: 7.5px !important; max-width: 250px !important; line-height: 1.2 !important; }
              .header .title h2 { font-size: 13px !important; }
              .header .title p { font-size: 8px !important; }
              
              .meta { margin-bottom: 8px !important; padding: 6px 10px !important; gap: 4px 12px !important; font-size: 9px !important; border-radius: 8px !important; }
              .meta div { margin-bottom: 1px !important; }
              
              .section-title { font-size: 8px !important; padding-bottom: 2px !important; margin-bottom: 6px !important; }
              .grid-cols { gap: 15px !important; margin-bottom: 8px !important; }
              .item-row { font-size: 8.5px !important; margin-bottom: 3px !important; }
              .item-row.bold { margin-top: 4px !important; padding-top: 3px !important; }
              
              .total-section { padding: 6px 10px !important; margin-bottom: 8px !important; border-radius: 8px !important; }
              .total-label { font-size: 9.5px !important; }
              .total-value { font-size: 13px !important; }
              
              .footer { margin-top: 10px !important; font-size: 8.5px !important; break-inside: avoid; page-break-inside: avoid; }
              .signature { width: 130px !important; break-inside: avoid; page-break-inside: avoid; }
              .signature .line { height: 25px !important; margin-bottom: 2px !important; }
              .signature p { margin: 1px 0 !important; }
              
              .verification-seal { padding: 4px 6px !important; margin: 0 auto !important; border-radius: 8px !important; max-width: 150px !important; gap: 4px !important; break-inside: avoid; page-break-inside: avoid; }
              .verification-seal span { font-size: 7px !important; }
              .verification-seal svg { width: 34px !important; height: 34px !important; }
            }
          </style>
        </head>
        <body>
          <div class="slip-card">
            ${printContent}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <section className="space-y-6 font-quicksand">
      {/* Tab Switcher */}
      <div className="flex overflow-x-auto scrollbar-none border-b border-orange-100 pb-2 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('payroll')}
          className={`pb-2 px-4 font-montserrat font-bold text-xs cursor-pointer transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'payroll'
              ? 'text-orange-600 border-b-2 border-orange-600 font-extrabold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Pemrosesan Gaji
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('holidays')}
          className={`pb-2 px-4 font-montserrat font-bold text-xs cursor-pointer transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'holidays'
              ? 'text-orange-600 border-b-2 border-orange-600 font-extrabold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Kelola Hari Libur
        </button>
      </div>

      {activeTab === 'payroll' ? (
        <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 font-montserrat">Pemrosesan Gaji Bulanan</h3>
            <p className="text-[11px] text-slate-500 font-quicksand font-medium">Hitung dan validasi gaji bersih karyawan berdasarkan data absensi terintegrasi.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
            {/* Month Picker */}
            <div className="flex items-center gap-2 bg-orange-50/30 border border-orange-100 rounded-xl px-3 py-2.5 shadow-sm w-full sm:w-auto shrink-0">
              <Calendar className="w-4 h-4 text-orange-500" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none w-full sm:w-[110px] font-quicksand"
              />
            </div>

            {/* Company Filter Dropdown */}
            <div className="flex items-center gap-2 bg-orange-50/30 border border-orange-100 rounded-xl px-3 py-2.5 shadow-sm w-full sm:w-auto shrink-0">
              <Building2 className="w-4 h-4 text-orange-500" />
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-750 outline-none w-full sm:w-[180px] font-quicksand cursor-pointer"
              >
                <option value="all">Semua Perusahaan</option>
                <option value="PT Yasodana Parvez Internasional">PT Yasodana Parvez Internasional</option>
                <option value="PT Cakrawala Parama Internasional">PT Cakrawala Parama Internasional</option>
              </select>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGeneratePayroll}
              disabled={generating || loadingPayroll}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-40 shadow-md shadow-red-500/10 flex-1 sm:flex-initial hover:scale-[1.02] active:scale-[0.98] font-montserrat"
            >
              {generating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Menghitung...
                </>
              ) : (
                <>
                  <Coins className="w-3.5 h-3.5" />
                  Rekap gaji
                </>
              )}
            </button>

            {/* Submit All Button */}
            {filteredRecords.some(r => r.status === 'draft') && (
              <button
                onClick={handleSubmitAllToDirector}
                disabled={generating || loadingPayroll}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-500/10 flex-1 sm:flex-initial hover:scale-[1.02] active:scale-[0.98] font-montserrat"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ajukan Gaji ke Direktur
              </button>
            )}

            {/* Export PDF Button */}
            <button
              onClick={handleExportPDF}
              disabled={generating || loadingPayroll || filteredRecords.length === 0}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-red-500/10 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed flex-1 sm:flex-initial hover:scale-[1.02] active:scale-[0.98] font-montserrat"
              title="Ekspor PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              Ekspor PDF
            </button>

            {/* Export Excel Button */}
            <button
              onClick={handleExportExcel}
              disabled={generating || loadingPayroll || filteredRecords.length === 0}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/10 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed flex-1 sm:flex-initial hover:scale-[1.02] active:scale-[0.98] font-montserrat"
              title="Ekspor Excel"
            >
              <FileDown className="w-3.5 h-3.5" />
              Ekspor Excel
            </button>
          </div>
        </div>

        {/* Alert Info & Holidays */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 bg-amber-50/60 border border-amber-100 p-4 rounded-2xl text-xs text-amber-800 leading-relaxed font-semibold">
            <Info className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong>Petunjuk Perhitungan:</strong> Periode mengikuti <strong>bulan kalender penuh</strong> (tanggal 1 s.d akhir bulan). Kehadiran dihitung dari absen yang disetujui (mandiri/kantor, kunjungan, klien). Tunjangan harian mengikuti total check-in sukses. Potongan keterlambatan jika check-in kantor setelah 09:00:00. Hasil generate berstatus <strong>Draft</strong> dapat disesuaikan sebelum diajukan ke Direktur.
            </div>
          </div>

          {holidays.filter(h => h.holiday_date && isHolidayInSelectedMonth(h.holiday_date, selectedMonth)).length > 0 ? (
            <div className="flex items-start gap-3 bg-rose-50/60 border border-rose-100 p-4 rounded-2xl text-xs text-rose-800 leading-relaxed font-semibold">
              <CalendarRange className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <strong>Hari Libur Nasional Bulan ini:</strong>
                <div className="flex flex-wrap gap-2 mt-2">
                  {holidays
                    .filter(h => h.holiday_date && isHolidayInSelectedMonth(h.holiday_date, selectedMonth))
                    .map((h, i) => {
                      const dateObj = new Date(h.holiday_date)
                      const day = dateObj.getDate()
                      return (
                        <span key={i} className="inline-flex items-center bg-white border border-rose-200 text-rose-700 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                          {day}: {h.name}
                        </span>
                      )
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs text-slate-600 leading-relaxed font-semibold">
              <Calendar className="w-4.5 h-4.5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <strong>Hari Libur Nasional:</strong> Tidak ada hari libur nasional terdaftar pada periode ini.
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        {filteredRecords.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-in">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-100 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:scale-[1.01] transition-transform">
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-quicksand">Total Gaji Dibayarkan</span>
                <span className="text-lg font-black text-orange-600 block mt-1 font-montserrat">
                  {formatRupiah(filteredRecords.reduce((sum, r) => sum + r.net_salary, 0))}
                </span>
                <span className="text-[9px] text-slate-400 font-bold block mt-0.5 font-quicksand">Untuk {filteredRecords.length} karyawan</span>
              </div>
              <div className="p-3 bg-white/80 rounded-xl text-orange-600 shadow-sm">
                <Coins className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:scale-[1.01] transition-transform">
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-quicksand">Telah Dibayar (Paid)</span>
                <span className="text-lg font-black text-emerald-600 block mt-1 font-montserrat">
                  {formatRupiah(filteredRecords.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.net_salary, 0))}
                </span>
                <span className="text-[9px] text-slate-400 font-bold block mt-0.5 font-quicksand">
                  {filteredRecords.filter(r => r.status === 'paid').length} karyawan lunas
                </span>
              </div>
              <div className="p-3 bg-white/80 rounded-xl text-emerald-600 shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:scale-[1.01] transition-transform">
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-quicksand">Belum Dibayar (Draft/Unpaid)</span>
                <span className="text-lg font-black text-amber-600 block mt-1 font-montserrat">
                  {formatRupiah(filteredRecords.filter(r => r.status !== 'paid').reduce((sum, r) => sum + r.net_salary, 0))}
                </span>
                <span className="text-[9px] text-slate-400 font-bold block mt-0.5 font-quicksand">
                  {filteredRecords.filter(r => r.status !== 'paid').length} karyawan tertunda
                </span>
              </div>
              <div className="p-3 bg-white/80 rounded-xl text-amber-600 shadow-sm">
                <Info className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}

        {/* Table Payroll - Desktop */}
        <div className="hidden lg:block border border-orange-100 rounded-2xl overflow-hidden bg-orange-50/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-orange-50/30 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-orange-100">
                  <th className="py-4 px-5">Karyawan</th>
                  <th className="py-4 px-5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span>Kehadiran (H / T / C)</span>
                      <button
                        type="button"
                        onClick={() => {
                          Swal.fire({
                            title: 'Keterangan Kehadiran',
                            html: `
                              <div class="text-left text-xs space-y-2 leading-relaxed font-sans">
                                <p><span class="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">H</span> = <strong>Hadir</strong> (Jumlah hari melakukan check-in masuk)</p>
                                <p><span class="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">T</span> = <strong>Terlambat</strong> (Jumlah hari check-in masuk di atas jam 09:00:00)</p>
                                <p><span class="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">C</span> = <strong>Cuti</strong> (Jumlah hari cuti yang disetujui HRD)</p>
                              </div>
                            `,
                            icon: 'info',
                            confirmButtonColor: '#ea580c'
                          })
                        }}
                        className="p-0.5 hover:bg-orange-100 rounded-full text-slate-400 hover:text-orange-600 transition-colors cursor-pointer outline-none"
                        title="Klik untuk detail penjelasan"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                  <th className="py-4 px-5">Rincian Hak Gaji</th>
                  <th className="py-4 px-5">Rincian Potongan</th>
                  <th className="py-4 px-5">Gaji Bersih</th>
                  <th className="py-4 px-5 text-center">Status</th>
                  <th className="py-4 px-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100 text-xs text-slate-600">
                {loadingPayroll ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                        Memuat data rekap gaji bulanan...
                      </div>
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold italic">
                      Belum ada data gaji yang di-generate pada periode ini ({getIndonesianMonthLabel(selectedMonth)}).
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-orange-50/10 transition-colors">
                      <td className="py-4 px-5">
                        <div>
                          <p className="font-extrabold text-slate-800 text-[13px]">{record.user.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{record.user.email}</p>
                          {record.user.no_rekening && (
                            <p className="text-[10px] font-bold text-blue-600 mt-1 select-all bg-blue-50/50 px-2 py-0.5 rounded border border-blue-100/50 w-fit">
                              Rek: {record.user.no_rekening} {record.user.company ? `(${record.user.company})` : ''}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <div className="inline-flex gap-1.5 text-[11px] font-bold">
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded" title="Hari Hadir">{record.days_present}H</span>
                          <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded" title="Hari Terlambat">{record.days_late}T</span>
                          <span className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded" title="Cuti Disetujui">{record.days_leave}C</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 space-y-0.5 text-[10px] font-semibold text-slate-500">
                        <div>Gaji Pokok (Base): <span className="font-bold text-slate-700">{formatRupiah(record.basic_salary)}</span></div>
                        {(record.allowance_meal ?? 0) > 0 && (
                          <div>Tunj. Makan (Harian): <span className="font-bold text-emerald-600">+{formatRupiah(record.allowance_meal)}</span></div>
                        )}
                        {(record.allowance_transport ?? 0) > 0 && (
                          <div>Tunj. Transport (Harian): <span className="font-bold text-emerald-600">+{formatRupiah(record.allowance_transport)}</span></div>
                        )}
                        {(record.allowance_position ?? 0) > 0 && (
                          <div>Tunj. Jabatan (Bulanan): <span className="font-bold text-emerald-600">+{formatRupiah(record.allowance_position)}</span></div>
                        )}
                        {(record.allowance_fixed ?? 0) > 0 && (
                          <div>Tunj. Tetap: <span className="font-bold text-emerald-600">+{formatRupiah(record.allowance_fixed)}</span></div>
                        )}
                      </td>
                      <td className="py-4 px-5 space-y-0.5 text-[10px] font-semibold text-slate-500">
                        {record.deduction_late > 0 ? (
                          <div>Telat: <span className="font-bold text-rose-600">-{formatRupiah(record.deduction_late)}</span></div>
                        ) : (
                          <div>Telat: <span className="text-slate-400">-</span></div>
                        )}
                        {record.deduction_absence > 0 ? (
                          <div>Absen: <span className="font-bold text-rose-600">-{formatRupiah(record.deduction_absence)}</span></div>
                        ) : (
                          <div>Absen: <span className="text-slate-400">-</span></div>
                        )}
                        {record.deduction_fixed > 0 ? (
                          <div>BPJS: <span className="font-bold text-rose-600">-{formatRupiah(record.deduction_fixed)}</span></div>
                        ) : (
                          <div>BPJS: <span className="text-slate-400">-</span></div>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-black text-slate-800 text-[13px] font-montserrat">{formatRupiah(record.net_salary)}</span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        {record.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                          </span>
                        ) : record.status === 'unpaid' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                            <XCircle className="w-3.5 h-3.5" /> Belum Bayar
                          </span>
                        ) : record.status === 'pending_approval' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 animate-pulse">
                            <Info className="w-3.5 h-3.5" /> Menunggu Direktur
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                            <Info className="w-3.5 h-3.5" /> Draft
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center justify-center gap-1.5">
                          {record.status === 'draft' && (
                            <button
                              onClick={() => handleSendToDirector(record)}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-300 text-indigo-700 rounded-lg font-bold transition-all cursor-pointer font-quicksand"
                              title="Ajukan ke Direktur"
                            >
                              Ajukan
                            </button>
                          )}
                          {record.status !== 'paid' && record.status !== 'pending_approval' && (
                            <>
                              <button
                                onClick={() => handleOpenAdjust(record)}
                                className="p-1.5 bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-500 text-slate-500 rounded-lg transition-all cursor-pointer"
                                title="Sesuaikan Nominal"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePayroll(record)}
                                className="p-1.5 bg-white border border-slate-200 hover:border-red-500 hover:text-red-500 text-slate-500 rounded-lg transition-all cursor-pointer"
                                title="Hapus Rekaman"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handlePrintSlip(record)}
                            className="p-1.5 bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-500 text-slate-500 rounded-lg transition-all cursor-pointer flex items-center gap-1 px-2.5"
                            title="Cetak Slip"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Slip
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table Payroll - Mobile Card View */}
        <div className="block lg:hidden space-y-4">
          {loadingPayroll ? (
            <div className="py-12 text-center text-slate-400 bg-white border border-orange-100 rounded-2xl shadow-sm">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                <span>Memuat data rekap gaji bulanan...</span>
              </div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-semibold italic bg-white border border-orange-100 rounded-2xl shadow-sm">
              Belum ada data gaji yang di-generate pada periode ini ({getIndonesianMonthLabel(selectedMonth)}).
            </div>
          ) : (
            filteredRecords.map((record) => (
              <div key={record.id} className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm space-y-4 hover:border-orange-200 hover:shadow-md transition-all">
                {/* Card Header: Initial, Name, Email, Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                      {record.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">{record.user.name}</h4>
                      <p className="text-[11px] text-slate-400 font-medium">{record.user.email}</p>
                      {record.user.no_rekening && (
                        <p className="text-[10px] font-bold text-blue-600 mt-1 select-all bg-blue-50/50 px-2 py-0.5 rounded border border-blue-100/50 w-fit">
                          Rek: {record.user.no_rekening}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="shrink-0 text-right">
                    {record.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Lunas
                      </span>
                    ) : record.status === 'unpaid' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                        Belum Bayar
                      </span>
                    ) : record.status === 'pending_approval' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 animate-pulse">
                        Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                        Draft
                      </span>
                    )}
                  </div>
                </div>

                {/* Attendance Badges */}
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold font-montserrat">
                  <span className="text-slate-400 font-bold font-quicksand uppercase tracking-wider text-[9px] mr-1">Kehadiran:</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100" title="Hari Hadir">{record.days_present}H</span>
                  <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100" title="Hari Terlambat">{record.days_late}T</span>
                  <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100" title="Cuti Disetujui">{record.days_leave}C</span>
                </div>

                {/* Allowances & Deductions grid */}
                <div className="grid grid-cols-2 gap-3 bg-orange-50/10 p-3 border border-orange-100/50 rounded-xl font-quicksand">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Penerimaan</span>
                    <div className="space-y-0.5 text-[10px] font-semibold text-slate-500">
                      <div>Gaji Pokok (Base): <span className="font-bold text-slate-700">{formatRupiah(record.basic_salary)}</span></div>
                      {(record.allowance_meal ?? 0) > 0 && (
                        <div>Tunj. Makan (Harian): <span className="font-bold text-emerald-600">+{formatRupiah(record.allowance_meal)}</span></div>
                      )}
                      {(record.allowance_transport ?? 0) > 0 && (
                        <div>Tunj. Transport (Harian): <span className="font-bold text-emerald-600">+{formatRupiah(record.allowance_transport)}</span></div>
                      )}
                      {(record.allowance_position ?? 0) > 0 && (
                        <div>Tunj. Jabatan (Bulanan): <span className="font-bold text-emerald-600">+{formatRupiah(record.allowance_position)}</span></div>
                      )}
                      {(record.allowance_fixed ?? 0) > 0 && (
                        <div>Tunj. Tetap: <span className="font-bold text-emerald-600">+{formatRupiah(record.allowance_fixed)}</span></div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1 border-l border-orange-100/50 pl-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Pemotongan</span>
                    <div className="space-y-0.5 text-[10px] font-semibold text-slate-500">
                      {record.deduction_late > 0 ? (
                        <div>Telat: <span className="font-bold text-rose-600">-{formatRupiah(record.deduction_late)}</span></div>
                      ) : (
                        <div>Telat: <span className="text-slate-400">-</span></div>
                      )}
                      {record.deduction_absence > 0 ? (
                        <div>Absen: <span className="font-bold text-rose-600">-{formatRupiah(record.deduction_absence)}</span></div>
                      ) : (
                        <div>Absen: <span className="text-slate-400">-</span></div>
                      )}
                      {record.deduction_fixed > 0 ? (
                        <div>Lainnya: <span className="font-bold text-rose-600">-{formatRupiah(record.deduction_fixed)}</span></div>
                      ) : (
                        <div>Lainnya: <span className="text-slate-400">-</span></div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Net Salary Row */}
                <div className="flex items-center justify-between gap-2 bg-orange-50/20 px-3 py-2 border border-orange-100/30 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-quicksand">Gaji Bersih Diterima</span>
                  <span className="font-black text-slate-800 text-sm font-montserrat">{formatRupiah(record.net_salary)}</span>
                </div>

                {/* Actions Footer */}
                <div className="pt-2 border-t border-orange-50 flex flex-wrap gap-1.5 items-center justify-end">
                  {record.status === 'draft' && (
                    <button
                      onClick={() => handleSendToDirector(record)}
                      className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-300 text-indigo-700 rounded-xl font-bold transition-all cursor-pointer font-quicksand text-xs flex-1"
                      title="Ajukan ke Direktur"
                    >
                      Ajukan
                    </button>
                  )}
                  {record.status !== 'paid' && record.status !== 'pending_approval' && (
                    <>
                      <button
                        onClick={() => handleOpenAdjust(record)}
                        className="p-2 bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-600 text-slate-500 rounded-xl transition-all cursor-pointer"
                        title="Sesuaikan Gaji"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePayroll(record)}
                        className="p-2 bg-white border border-slate-200 hover:border-red-500 hover:text-red-600 text-slate-500 rounded-xl transition-all cursor-pointer"
                        title="Hapus Rekaman"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handlePrintSlip(record)}
                    className="p-2 bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-600 text-slate-500 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 px-3 text-xs font-bold font-quicksand"
                    title="Cetak Slip"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Slip</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Form Tambah Hari Libur */}
          <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-4 h-fit">
            <div>
              <h3 className="text-base font-bold text-slate-800 font-quicksand">Tambah Hari Libur</h3>
              <p className="text-[11px] text-slate-500 font-medium">Daftarkan tanggal merah nasional baru agar otomatis memotong absen mangkir karyawan.</p>
            </div>
            
            {/* Auto Import Button */}
            <button
              type="button"
              onClick={handleImportHolidays}
              disabled={seedingHolidays || loadingHolidays}
              className="w-full py-2.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {seedingHolidays ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Mengimpor...
                </>
              ) : (
                <>
                  <CalendarRange className="w-3.5 h-3.5" />
                  Impor Otomatis Libur & Cuti {selectedMonth ? selectedMonth.split('-')[0] : new Date().getFullYear()}
                </>
              )}
            </button>
            
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-3 text-[9px] text-slate-400 font-bold uppercase">Atau Input Manual</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>
            
            <form onSubmit={handleAddHoliday} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tanggal Kalender</label>
                <div className="relative">
                  <input
                    type="date"
                    value={newHolidayDate}
                    onChange={(e) => setNewHolidayDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 text-slate-800 rounded-xl py-2.5 px-3 outline-none transition-all text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Libur (Keterangan)</label>
                <input
                  type="text"
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                  placeholder="Contoh: Hari Lahir Pancasila"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 text-slate-800 rounded-xl py-2.5 px-3 outline-none transition-all text-xs font-semibold"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={savingHoliday}
                className="w-full py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-red-500/10"
              >
                {savingHoliday ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Hari Libur
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Tabel Daftar Hari Libur */}
          <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-4 lg:col-span-2">
            <div>
              <h3 className="text-base font-bold text-slate-800 font-quicksand">Daftar Tanggal Merah Terdaftar</h3>
              <p className="text-[11px] text-slate-500 font-medium">Berikut adalah daftar hari libur nasional resmi yang terdaftar di database.</p>
            </div>

            {/* Holiday List - Desktop Table */}
            <div className="hidden sm:block border border-orange-100 rounded-2xl overflow-hidden bg-orange-50/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-orange-50/30 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-orange-100">
                      <th className="py-3.5 px-5">No</th>
                      <th className="py-3.5 px-5">Tanggal</th>
                      <th className="py-3.5 px-5">Hari</th>
                      <th className="py-3.5 px-5">Keterangan</th>
                      <th className="py-3.5 px-5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-100 text-xs text-slate-600">
                    {loadingHolidays ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                            Memuat data hari libur...
                          </div>
                        </td>
                      </tr>
                    ) : holidays.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold italic">
                          Belum ada tanggal merah terdaftar. Silakan tambahkan pada form di samping.
                        </td>
                      </tr>
                    ) : (
                      holidays.map((h, index) => {
                        const dateObj = new Date(h.holiday_date)
                        const formattedDate = dateObj.toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })
                        const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' })
                        return (
                          <tr key={h.id} className="hover:bg-orange-50/10 transition-colors">
                            <td className="py-3.5 px-5 font-bold text-slate-400">{index + 1}</td>
                            <td className="py-3.5 px-5 font-bold text-slate-800 font-montserrat">{formattedDate}</td>
                            <td className="py-3.5 px-5 font-semibold text-slate-500">{dayName}</td>
                            <td className="py-3.5 px-5 font-medium text-slate-700">{h.name}</td>
                            <td className="py-3.5 px-5 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteHoliday(h.id, h.name)}
                                className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 rounded-lg transition-all cursor-pointer"
                                title="Hapus Tanggal Merah"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

            {/* Holiday List - Mobile Calendar Cards */}
            <div className="block sm:hidden space-y-3">
              {loadingHolidays ? (
                <div className="py-8 text-center text-slate-400 bg-white border border-orange-100 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                    <span>Memuat data hari libur...</span>
                  </div>
                </div>
              ) : holidays.length === 0 ? (
                <div className="py-8 text-center text-slate-400 font-semibold italic bg-white border border-orange-100 rounded-2xl shadow-sm">
                  Belum ada tanggal merah terdaftar. Silakan tambahkan pada form di samping.
                </div>
              ) : (
                holidays.map((h) => {
                  const dateObj = new Date(h.holiday_date)
                  const dayNum = dateObj.getDate()
                  const monthName = dateObj.toLocaleDateString('id-ID', { month: 'short' })
                  const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' })
                  return (
                    <div key={h.id} className="bg-white border border-orange-100 rounded-2xl p-3 shadow-sm flex items-center justify-between gap-3 hover:border-orange-200 transition-all">
                      <div className="flex items-center gap-3">
                        {/* Decorative Date Badge */}
                        <div className="w-12 h-12 bg-orange-50 border border-orange-100 rounded-xl flex flex-col items-center justify-center shrink-0 shadow-sm">
                          <span className="font-extrabold text-orange-600 text-lg leading-none font-montserrat">{dayNum}</span>
                          <span className="font-bold text-orange-500 text-[9px] uppercase tracking-wider mt-0.5 leading-none font-quicksand">{monthName}</span>
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-xs font-montserrat">{h.name}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5 font-quicksand">{dayName}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteHoliday(h.id, h.name)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl border border-rose-100 hover:border-rose-200 transition-all cursor-pointer shrink-0"
                        title="Hapus Tanggal Merah"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Adjust / Manual Edit Payroll */}
      {showAdjustModal && adjustingPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-950/20 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white border border-orange-100 rounded-3xl p-6 max-w-md w-full relative shadow-xl overflow-hidden animate-zoom-in my-8 max-h-[90vh] overflow-y-auto font-quicksand">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-red-500 via-orange-600 to-transparent"></div>
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 font-montserrat">
                <Coins className="w-4 h-4 text-orange-600" />
                Penyesuaian Gaji: {adjustingPayroll.user.name}
              </h3>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 hover:bg-slate-105 rounded-lg cursor-pointer text-xs"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4 font-semibold text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gaji Pokok</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-[11px] font-montserrat">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={adjustBasic}
                    onChange={(e) => handleRupiahInput(e.target.value, setAdjustBasic)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-orange-600 text-slate-800 rounded-xl py-2.5 pl-9 pr-3 outline-none transition-all font-bold text-xs font-montserrat"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tunjangan Makan</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-[11px] font-montserrat">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={adjustMeal}
                      onChange={(e) => handleRupiahInput(e.target.value, setAdjustMeal)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-orange-600 text-slate-800 rounded-xl py-2.5 pl-9 pr-3 outline-none transition-all font-bold text-xs font-montserrat"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tunjangan Transport</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-[11px] font-montserrat">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={adjustTransport}
                      onChange={(e) => handleRupiahInput(e.target.value, setAdjustTransport)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-orange-600 text-slate-800 rounded-xl py-2.5 pl-9 pr-3 outline-none transition-all font-bold text-xs font-montserrat"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tunjangan Jabatan</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-[11px] font-montserrat">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={adjustPosition}
                      onChange={(e) => handleRupiahInput(e.target.value, setAdjustPosition)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-orange-600 text-slate-800 rounded-xl py-2.5 pl-9 pr-3 outline-none transition-all font-bold text-xs font-montserrat"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tunjangan Tetap</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-[11px] font-montserrat">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={adjustFixedAllow}
                      onChange={(e) => handleRupiahInput(e.target.value, setAdjustFixedAllow)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-orange-600 text-slate-800 rounded-xl py-2.5 pl-9 pr-3 outline-none transition-all font-bold text-xs font-montserrat"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Potongan Telat</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-1.5 flex items-center text-slate-400 font-bold text-[10px] font-montserrat">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={adjustLateDeduct}
                      onChange={(e) => handleRupiahInput(e.target.value, setAdjustLateDeduct)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-orange-600 text-slate-800 rounded-xl py-2 pl-6 pr-1.5 outline-none transition-all font-bold text-xs font-montserrat"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Potongan Absen</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-1.5 flex items-center text-slate-400 font-bold text-[10px] font-montserrat">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={adjustAbsenceDeduct}
                      onChange={(e) => handleRupiahInput(e.target.value, setAdjustAbsenceDeduct)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-orange-600 text-slate-800 rounded-xl py-2 pl-6 pr-1.5 outline-none transition-all font-bold text-xs font-montserrat"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Potongan Tetap</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-1.5 flex items-center text-slate-400 font-bold text-[10px] font-montserrat">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={adjustFixedDeduct}
                      onChange={(e) => handleRupiahInput(e.target.value, setAdjustFixedDeduct)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-orange-600 text-slate-800 rounded-xl py-2 pl-6 pr-1.5 outline-none transition-all font-bold text-xs font-montserrat"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Catatan Penyesuaian</label>
                <textarea
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Misal: Penambahan bonus lembur manual Rp 200.000"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-orange-600 text-slate-800 rounded-xl py-2 px-3 outline-none transition-all text-xs h-16 font-semibold font-quicksand"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer text-center font-quicksand"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAdjustment}
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 font-montserrat"
                >
                  {submittingAdjustment && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Simpan Penyesuaian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detail/Preview Slip Gaji */}
      {showSlipModal && selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-950/20 backdrop-blur-md animate-fade-in overflow-y-auto font-quicksand">
          <div className="bg-white border border-orange-100 rounded-3xl p-6 max-w-lg w-full relative shadow-xl overflow-hidden animate-zoom-in my-8 max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-red-500 via-orange-600 to-transparent"></div>
            
            <div className="flex justify-between items-center mb-6 font-montserrat">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Coins className="w-4 h-4 text-orange-600" />
                Pratinjau Slip Gaji
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={triggerBrowserPrint}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg cursor-pointer text-xs flex items-center gap-1 shadow-sm font-montserrat"
                >
                  <Printer className="w-3 h-3" /> Cetak
                </button>
                <button
                  onClick={() => setShowSlipModal(false)}
                  className="text-slate-400 hover:text-slate-700 font-bold p-1 hover:bg-slate-105 rounded-lg cursor-pointer text-xs"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Slip Printable area */}
            <div id="slip-print-area" className="border border-slate-200 rounded-2xl p-5 space-y-5 bg-white text-slate-700 font-quicksand">
              <style dangerouslySetInnerHTML={{ __html: `
                #slip-print-area { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; line-height: 1.5; }
                #slip-print-area .header { display: flex; flex-direction: row; justify-content: space-between; align-items: center; border-bottom: 2px solid #000000; padding-bottom: 16px; margin-bottom: 20px; }
                #slip-print-area .logo img { height: 52px; width: auto; object-fit: contain; }
                #slip-print-area .title { text-align: right; }
                #slip-print-area .title h2 { margin: 0; color: #0f172a; font-size: 16px; font-weight: 800; text-transform: uppercase; }
                #slip-print-area .title p { margin: 4px 0 0 0; font-size: 10px; color: #ea580c; font-weight: 700; }
                #slip-print-area .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 11px; margin-bottom: 30px; background-color: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; }
                #slip-print-area .meta div { margin-bottom: 4px; }
                #slip-print-area .section-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }
                #slip-print-area .grid-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
                #slip-print-area .item-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 8px; }
                #slip-print-area .item-row.bold { font-weight: 700; color: #0f172a; border-top: 1px dashed #e2e8f0; padding-top: 8px; margin-top: 10px; }
                #slip-print-area .total-section { background: #ffffff; border: 1px solid #000000; border-radius: 12px; padding: 15px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                #slip-print-area .total-label { font-size: 12px; font-weight: 800; color: #000000; text-transform: uppercase; }
                #slip-print-area .total-value { font-size: 18px; font-weight: 800; color: #000000; }
                #slip-print-area .footer { display: flex; justify-content: space-between; margin-top: 50px; font-size: 11px; }
                #slip-print-area .signature { text-align: center; width: 150px; }
                #slip-print-area .signature .line { border-bottom: 1px solid #94a3b8; height: 50px; margin-bottom: 6px; }
                #slip-print-area .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 8px; font-weight: 700; text-transform: uppercase; background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
              ` }} />

              <div className="header font-montserrat">
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div className="logo" style={{ flexShrink: 0 }}>
                    <img 
                      src={selectedSlip.user.company === 'PT Yasodana Parvez Internasional' ? `${window.location.origin}/logo/LOGO-YPI.png` : `${window.location.origin}/logo/LOGO-CPI.png`} 
                      alt={selectedSlip.user.company || 'PT Cakrawala Parama Internasional'} 
                    />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <h1 style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                      {selectedSlip.user.company || 'PT Cakrawala Parama Internasional'}
                    </h1>
                    <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#64748b', fontWeight: 600, maxWidth: '280px', lineHeight: '1.3' }} className="font-quicksand">
                      Thamrin City, Jl. Kebon Kacang Raya Lantai 2 Blok C9a No.5, Kb. Melati, Kec. Tanah Abang, Kota Jakarta Pusat, DKI Jakarta 10230
                      <br />
                      Telp: {selectedSlip.user.company === 'PT Yasodana Parvez Internasional' ? '(021) 719-1234' : '(021) 536-5678'} | Email: {selectedSlip.user.company === 'PT Yasodana Parvez Internasional' ? 'hr@yasodana.co.id' : 'hr@cakrawala.co.id'}
                    </p>
                  </div>
                </div>
                <div className="title">
                  <p className="font-quicksand font-bold">Periode: {getIndonesianMonthLabel(selectedSlip.period_month)}</p>
                </div>
              </div>

              <div className="meta">
                <div>
                  <strong>Nama:</strong> {selectedSlip.user.name}
                </div>
                <div>
                  <strong>Jabatan:</strong> {selectedSlip.user.division || '-'}
                </div>
                <div>
                  <strong>NIP:</strong> {selectedSlip.user.employee_number || '-'}
                </div>
                <div>
                  <strong>Email:</strong> {selectedSlip.user.email}
                </div>

                <div>
                  <strong>Tanggal Proses:</strong>{' '}
                  {selectedSlip.status === 'paid' && selectedSlip.paid_at
                    ? new Date(selectedSlip.paid_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                    : new Date(selectedSlip.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div>
                  <strong>Status Pembayaran:</strong>{' '}
                  <span className="badge">
                    {selectedSlip.status === 'paid'
                      ? 'Lunas'
                      : selectedSlip.status === 'unpaid'
                        ? 'Belum Dibayar'
                        : selectedSlip.status === 'pending_approval'
                          ? 'Menunggu Direktur'
                          : 'Draft'}
                  </span>
                </div>
                <div>
                  <strong>Tanggal Bergabung:</strong>{' '}
                  {selectedSlip.user.join_date 
                    ? new Date(selectedSlip.user.join_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                    : '-'}
                </div>
              </div>

              <div className="grid-cols">
                <div>
                  <div className="section-title font-montserrat">Penerimaan (Allowance)</div>
                  <div className="item-row">
                    <span>Gaji Pokok</span>
                    <strong className="font-montserrat">{formatRupiah(selectedSlip.basic_salary)}</strong>
                  </div>
                  <div className="item-row">
                    <span>Tunjangan Makan</span>
                    <strong className="font-montserrat">{formatRupiah(selectedSlip.allowance_meal ?? 0)}</strong>
                  </div>
                  <div className="item-row">
                    <span>Tunjangan Transport</span>
                    <strong className="font-montserrat">{formatRupiah(selectedSlip.allowance_transport ?? 0)}</strong>
                  </div>
                  <div className="item-row">
                    <span>Tunjangan Jabatan</span>
                    <strong className="font-montserrat">{formatRupiah(selectedSlip.allowance_position ?? 0)}</strong>
                  </div>
                  {(selectedSlip.allowance_fixed ?? 0) > 0 && (
                    <div className="item-row">
                      <span>Tunjangan Tetap</span>
                      <strong className="font-montserrat">{formatRupiah(selectedSlip.allowance_fixed)}</strong>
                    </div>
                  )}
                  {(selectedSlip.allowance_overtime ?? 0) > 0 && (
                    <div className="item-row">
                      <span>Lembur (Overtime)</span>
                      <strong className="font-montserrat">{formatRupiah(selectedSlip.allowance_overtime ?? 0)}</strong>
                    </div>
                  )}
                  {(selectedSlip.allowance_bonus ?? 0) > 0 && (
                    <div className="item-row">
                      <span>Bonus Kinerja</span>
                      <strong className="font-montserrat">{formatRupiah(selectedSlip.allowance_bonus ?? 0)}</strong>
                    </div>
                  )}
                  <div className="item-row">
                    <span>Hari Kerja Kerja Aktif</span>
                    <strong>{selectedSlip.days_present} Hari</strong>
                  </div>
                  <div className="item-row bold">
                    <span>Total Penerimaan</span>
                    <span className="font-montserrat">{formatRupiah(
                      selectedSlip.basic_salary + 
                      (selectedSlip.allowance_meal ?? 0) + 
                      (selectedSlip.allowance_transport ?? 0) + 
                      (selectedSlip.allowance_position ?? 0) + 
                      (selectedSlip.allowance_fixed ?? 0) +
                      (selectedSlip.allowance_overtime ?? 0) +
                      (selectedSlip.allowance_bonus ?? 0)
                    )}</span>
                  </div>
                </div>

                <div>
                  <div className="section-title font-montserrat">Pemotongan (Deduction)</div>
                  <div className="item-row">
                    <span>Terlambat Masuk ({selectedSlip.days_late} Hari)</span>
                    <strong style={{ color: '#dc2626' }} className="font-montserrat">-{formatRupiah(selectedSlip.deduction_late)}</strong>
                  </div>
                  {selectedSlip.deduction_absence > 0 && (
                    <div className="item-row">
                      <span>Tidak Masuk</span>
                      <strong style={{ color: '#dc2626' }} className="font-montserrat">-{formatRupiah(selectedSlip.deduction_absence)}</strong>
                    </div>
                  )}
                  {selectedSlip.deduction_fixed > 0 && (
                    <div className="item-row">
                      <span>BPJS & Lainnya</span>
                      <strong style={{ color: '#dc2626' }} className="font-montserrat">-{formatRupiah(selectedSlip.deduction_fixed)}</strong>
                    </div>
                  )}
                  <div className="item-row bold">
                    <span>Total Pemotongan</span>
                    <span style={{ color: '#dc2626' }} className="font-montserrat">-{formatRupiah(selectedSlip.deduction_late + (selectedSlip.deduction_absence ?? 0) + selectedSlip.deduction_fixed)}</span>
                  </div>
                </div>
              </div>

              <div className="total-section">
                <span className="total-label font-montserrat">Gaji Bersih Diterima (Net Salary)</span>
                <span className="total-value font-montserrat">{formatRupiah(selectedSlip.net_salary)}</span>
              </div>


              <div className="footer font-quicksand" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '40px' }}>
                <div className="signature">
                  <p>Penerima,</p>
                  <div className="line"></div>
                  <p><strong>{selectedSlip.user.name}</strong></p>
                </div>

                {/* QR Code Digital Seal */}
                <div className="verification-seal" style={{ display: 'flex', gap: '8px', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px', backgroundColor: '#f8fafc', maxWidth: '200px', margin: '0 auto 10px auto', alignItems: 'center' }}>
                  <div style={{ flexShrink: 0, padding: '2px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <QRCodeSVG 
                      value={`${window.location.origin}/verify-slip/${selectedSlip.id}/${selectedSlip.verification_hash || ''}`} 
                      size={44}
                      level="M"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'left' }}>
                    <span style={{ fontSize: '8px', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.3px', lineHeight: 1.1 }}>Verified</span>
                    <span style={{ fontSize: '6px', fontWeight: 700, color: '#0f172a', marginTop: '2px', wordBreak: 'break-all', lineHeight: 1.1 }}>Ref: {selectedSlip.id}-{selectedSlip.period_month}</span>
                    <span style={{ fontSize: '5px', fontWeight: 600, color: '#64748b', marginTop: '1px', lineHeight: 1 }}>Digitally Signed</span>
                  </div>
                </div>

                <div className="signature">
                  <p>Manajer HRD,</p>
                  <div className="line"></div>
                  <p><strong>{hrManagerName}</strong></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
