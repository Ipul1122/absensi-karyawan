import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { 
  FileText, 
  Printer, 
  Loader2, 
  RefreshCw, 
  Coins, 
  CheckCircle2, 
  XCircle, 
  Info,
  Calendar
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
  status: 'draft' | 'unpaid' | 'paid'
  paid_at: string | null
  notes: string | null
  updated_at: string
}

interface EmployeePayrollProps {
  token: string
}

export default function EmployeePayroll({ token }: EmployeePayrollProps) {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showSlipModal, setShowSlipModal] = useState(false)
  const [selectedSlip, setSelectedSlip] = useState<PayrollRecord | null>(null)
  const [filterMonth, setFilterMonth] = useState('')

  const fetchMyPayrolls = async () => {
    setLoading(true)
    try {
      const url = filterMonth 
        ? `http://localhost:8000/api/payroll/my-slips?period_month=${filterMonth}` 
        : 'http://localhost:8000/api/payroll/my-slips'
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        // Hanya tampilkan yang berstatus 'paid' (atau paid dan unpaid)
        // Kita tampilkan semua transaksi gaji agar transparan bagi karyawan
        setPayrolls(response.data.data)
      }
    } catch (err) {
      console.error(err)
      Swal.fire({
        title: 'Gagal Memuat Slip Gaji',
        text: 'Tidak dapat terhubung ke server API.',
        icon: 'error',
        background: '#fffdfb',
        color: '#3c1105'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMyPayrolls()
  }, [filterMonth])

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number)
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

  const handleOpenSlip = (record: PayrollRecord) => {
    setSelectedSlip(record)
    setShowSlipModal(true)
  }

  const triggerBrowserPrint = () => {
    const printContent = document.getElementById('employee-slip-print-area')?.innerHTML
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Slip Gaji - ${getIndonesianMonthLabel(selectedSlip?.period_month || '')}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; }
            .slip-card { border: 2px solid #e2e8f0; border-radius: 16px; padding: 30px; background-color: #ffffff; max-width: 650px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #fed7aa; padding-bottom: 20px; margin-bottom: 25px; }
            .logo img { height: 48px; width: auto; object-fit: contain; }
            .title { text-align: right; }
            .title h2 { margin: 0; color: #0f172a; font-size: 18px; font-weight: 800; text-transform: uppercase; }
            .title p { margin: 4px 0 0 0; font-size: 11px; color: #64748b; font-weight: 600; }
            .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 11px; margin-bottom: 30px; background-color: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .meta div { margin-bottom: 4px; }
            .section-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }
            .grid-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
            .item-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 8px; }
            .item-row.bold { font-weight: 700; color: #0f172a; border-top: 1px dashed #e2e8f0; padding-top: 8px; margin-top: 10px; }
            .total-section { background: linear-gradient(to right, #fff7ed, #ffedd5); border: 1px solid #fed7aa; border-radius: 12px; padding: 15px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
            .total-label { font-size: 12px; font-weight: 800; color: #c2410c; text-transform: uppercase; }
            .total-value { font-size: 18px; font-weight: 800; color: #000000; }
            .footer { display: flex; justify-content: space-between; margin-top: 50px; font-size: 11px; }
            .signature { text-align: center; width: 150px; }
            .signature .line { border-bottom: 1px solid #94a3b8; height: 50px; margin-bottom: 6px; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 8px; font-weight: 700; text-transform: uppercase; background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
            @media print {
              body { padding: 0; }
              .slip-card { border: none; padding: 0; max-width: 100%; }
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
    <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in font-quicksand">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 font-quicksand">Riwayat Slip Gaji Anda</h3>
          <p className="text-[11px] text-slate-500 font-medium">Lihat rincian penerimaan dan potongan gaji bulanan Anda secara transparan.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month & Year Filter */}
          <div className="flex items-center gap-2 bg-orange-50/30 border border-orange-150 rounded-xl px-3 py-1.5 shadow-sm shrink-0">
            <Calendar className="w-4 h-4 text-orange-500" />
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 outline-none w-[110px]"
            />
          </div>
          {filterMonth && (
            <button
              onClick={() => setFilterMonth('')}
              className="text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer"
            >
              Reset
            </button>
          )}

          <button
            onClick={fetchMyPayrolls}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 hover:border-red-500 text-slate-500 hover:text-red-500 rounded-xl transition-all cursor-pointer inline-flex items-center shrink-0 disabled:opacity-50 shadow-sm"
            title="Segarkan Riwayat"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table Payroll */}
      <div className="border border-orange-100 rounded-2xl overflow-hidden bg-orange-50/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-orange-50/30 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-orange-100">
                <th className="py-4 px-5">Bulan Periode</th>
                <th className="py-4 px-5 text-center">Kehadiran (H / T / C)</th>
                <th className="py-4 px-5">Gaji Pokok</th>
                <th className="py-4 px-5">Tunj. Makan</th>
                <th className="py-4 px-5">Tunj. Transport</th>
                <th className="py-4 px-5">Tunj. Jabatan</th>
                <th className="py-4 px-5">Pot. Telat</th>
                <th className="py-4 px-5">Pot. Absen</th>
                <th className="py-4 px-5">Pot. Tetap (BPJS)</th>
                <th className="py-4 px-5">Gaji Bersih</th>
                <th className="py-4 px-5 text-center">Status</th>
                <th className="py-4 px-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100 text-xs text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                      Memuat data slip gaji Anda...
                    </div>
                  </td>
                </tr>
              ) : payrolls.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400 font-semibold italic">
                    Belum ada data slip gaji yang diterbitkan untuk Anda.
                  </td>
                </tr>
              ) : (
                payrolls.map((record) => {
                  // Derive per-day rates from totals
                  const mealDaily = record.days_present > 0 ? (record.allowance_meal ?? 0) / record.days_present : 0
                  const transportDaily = record.days_present > 0 ? (record.allowance_transport ?? 0) / record.days_present : 0
                  const lateDaily = record.days_late > 0 ? record.deduction_late / record.days_late : 0
                  // Parse days_absent from notes (format: "...Potongan tidak masuk: X hari.")
                  const absenceMatch = record.notes?.match(/Potongan tidak masuk:\s*(\d+)\s*hari/)
                  const daysAbsent = absenceMatch ? parseInt(absenceMatch[1], 10) : 0
                  const absenceDaily = daysAbsent > 0 ? (record.deduction_absence ?? 0) / daysAbsent : 0

                  return (
                    <tr key={record.id} className="hover:bg-orange-50/10 transition-colors">
                      <td className="py-4 px-5 font-bold text-slate-800">
                        {getIndonesianMonthLabel(record.period_month)}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <div className="inline-flex gap-1 text-[10px] font-bold">
                          <span className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">{record.days_present} Hadir</span>
                          {record.days_late > 0 && (
                            <span className="text-rose-700 bg-rose-50 px-1 py-0.5 rounded">{record.days_late} Telat</span>
                          )}
                          {record.days_leave > 0 && (
                            <span className="text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded">{record.days_leave} Cuti</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-700">{formatRupiah(record.basic_salary)}</div>
                        <div className="text-[9px] text-slate-450 mt-0.5 font-semibold">Bulanan Tetap</div>
                      </td>
                      <td className="py-4 px-5">
                        {(record.allowance_meal ?? 0) > 0 ? (
                          <div>
                            <div className="font-semibold text-emerald-600">+{formatRupiah(record.allowance_meal)}</div>
                            <div className="text-[9px] text-slate-400 mt-0.5 font-semibold">{formatRupiah(mealDaily)}/hari × {record.days_present} hari</div>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        {(record.allowance_transport ?? 0) > 0 ? (
                          <div>
                            <div className="font-semibold text-emerald-600">+{formatRupiah(record.allowance_transport)}</div>
                            <div className="text-[9px] text-slate-400 mt-0.5 font-semibold">{formatRupiah(transportDaily)}/hari × {record.days_present} hari</div>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        {(record.allowance_position ?? 0) > 0 ? (
                          <div>
                            <div className="font-semibold text-emerald-600">+{formatRupiah(record.allowance_position)}</div>
                            <div className="text-[9px] text-slate-400 mt-0.5 font-semibold">Tunjangan bulanan</div>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        {record.deduction_late > 0 ? (
                          <div>
                            <div className="font-semibold text-rose-600">-{formatRupiah(record.deduction_late)}</div>
                            <div className="text-[9px] text-slate-400 mt-0.5 font-semibold">{formatRupiah(lateDaily)}/hari × {record.days_late} hari</div>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        {(record.deduction_absence ?? 0) > 0 ? (
                          <div>
                            <div className="font-semibold text-rose-600">-{formatRupiah(record.deduction_absence)}</div>
                            {daysAbsent > 0 ? (
                              <div className="text-[9px] text-slate-400 mt-0.5 font-semibold">{formatRupiah(absenceDaily)}/hari × {daysAbsent} hari</div>
                            ) : (
                              <div className="text-[9px] text-slate-400 mt-0.5 font-semibold">Potongan tidak masuk</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        {record.deduction_fixed > 0 ? (
                          <div>
                            <div className="font-semibold text-rose-600">-{formatRupiah(record.deduction_fixed)}</div>
                            <div className="text-[9px] text-slate-400 mt-0.5 font-semibold">Tetap bulanan</div>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <span className="font-extrabold text-slate-900 text-sm">{formatRupiah(record.net_salary)}</span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        {record.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Dibayar (Paid)
                          </span>
                        ) : record.status === 'unpaid' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                            <XCircle className="w-3 h-3 text-rose-500" /> Belum Dibayar
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                            <Info className="w-3 h-3 text-amber-500" /> Draft Rekap
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <button
                          onClick={() => handleOpenSlip(record)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-red-500/10 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Lihat Slip Gaji
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

      {/* Modal View Slip Gaji */}
      {showSlipModal && selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-950/20 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white border border-orange-100 rounded-3xl p-6 max-w-lg w-full relative shadow-xl overflow-hidden animate-zoom-in my-8 max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-red-500 via-orange-500 to-transparent"></div>
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Coins className="w-4 h-4 text-orange-500" />
                Slip Gaji Resmi Anda
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={triggerBrowserPrint}
                  className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg cursor-pointer text-xs flex items-center gap-1 shadow-sm"
                >
                  <Printer className="w-3 h-3" /> Cetak Slip
                </button>
                <button
                  onClick={() => setShowSlipModal(false)}
                  className="text-slate-400 hover:text-slate-700 font-bold p-1 hover:bg-slate-100 rounded-lg cursor-pointer text-xs"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Slip Printable area */}
            <div id="employee-slip-print-area" className="border border-slate-200 rounded-2xl p-5 space-y-5 bg-white text-slate-700">
              <div className="header">
                <div className="logo">
                  <img src="/logo-perusahaan.png" alt="PT. Cakrawala Parama Internasional" />
                </div>
                <div className="title">
                  <h2>SLIP GAJI RESMI</h2>
                  <p>Periode: {getIndonesianMonthLabel(selectedSlip.period_month)}</p>
                </div>
              </div>

              <div className="meta">
                <div>
                  <strong>Nama Karyawan:</strong> {sessionStorage.getItem('auth_user') ? JSON.parse(sessionStorage.getItem('auth_user')!).name : 'Karyawan'}
                </div>
                <div>
                  <strong>Email Karyawan:</strong> {sessionStorage.getItem('auth_user') ? JSON.parse(sessionStorage.getItem('auth_user')!).email : ''}
                </div>
                <div>
                  <strong>Status Pembayaran:</strong> <span className="badge">Lunas</span>
                </div>
                <div>
                  <strong>Tanggal Proses:</strong> {new Date(selectedSlip.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>

              <div className="grid-cols">
                <div>
                  <div className="section-title">Penerimaan (Allowance)</div>
                  <div className="item-row">
                    <span>Gaji Pokok</span>
                    <strong>{formatRupiah(selectedSlip.basic_salary)}</strong>
                  </div>
                  <div className="item-row">
                    <span>Tunjangan Makan</span>
                    <strong>{formatRupiah(selectedSlip.allowance_meal ?? 0)}</strong>
                  </div>
                  <div className="item-row">
                    <span>Tunjangan Transport</span>
                    <strong>{formatRupiah(selectedSlip.allowance_transport ?? 0)}</strong>
                  </div>
                  <div className="item-row">
                    <span>Tunjangan Jabatan</span>
                    <strong>{formatRupiah(selectedSlip.allowance_position ?? 0)}</strong>
                  </div>
                  {(selectedSlip.allowance_fixed ?? 0) > 0 && (
                    <div className="item-row">
                      <span>Tunjangan Tetap</span>
                      <strong>{formatRupiah(selectedSlip.allowance_fixed)}</strong>
                    </div>
                  )}
                  <div className="item-row">
                    <span>Hari Kerja Aktif</span>
                    <strong>{selectedSlip.days_present} Hari</strong>
                  </div>
                  <div className="item-row bold">
                    <span>Total Penerimaan</span>
                    <span>{formatRupiah(
                      selectedSlip.basic_salary + 
                      (selectedSlip.allowance_meal ?? 0) + 
                      (selectedSlip.allowance_transport ?? 0) + 
                      (selectedSlip.allowance_position ?? 0) + 
                      (selectedSlip.allowance_fixed ?? 0)
                    )}</span>
                  </div>
                </div>

                <div>
                  <div className="section-title">Pemotongan (Deduction)</div>
                  <div className="item-row">
                    <span>Terlambat Masuk ({selectedSlip.days_late} Hari)</span>
                    <strong style={{ color: '#dc2626' }}>-{formatRupiah(selectedSlip.deduction_late)}</strong>
                  </div>
                  {selectedSlip.deduction_absence > 0 && (
                    <div className="item-row">
                      <span>Tidak Masuk</span>
                      <strong style={{ color: '#dc2626' }}>-{formatRupiah(selectedSlip.deduction_absence)}</strong>
                    </div>
                  )}
                  {selectedSlip.deduction_fixed > 0 && (
                    <div className="item-row">
                      <span>BPJS & Lainnya</span>
                      <strong style={{ color: '#dc2626' }}>-{formatRupiah(selectedSlip.deduction_fixed)}</strong>
                    </div>
                  )}
                  <div className="item-row bold">
                    <span>Total Pemotongan</span>
                    <span style={{ color: '#dc2626' }}>-{formatRupiah(selectedSlip.deduction_late + (selectedSlip.deduction_absence ?? 0) + selectedSlip.deduction_fixed)}</span>
                  </div>
                </div>
              </div>

              <div className="total-section">
                <span className="total-label">Gaji Bersih Diterima (Net Salary)</span>
                <span className="total-value">{formatRupiah(selectedSlip.net_salary)}</span>
              </div>

              {selectedSlip.notes && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-500 font-semibold italic">
                  <strong>Catatan Gaji:</strong> {selectedSlip.notes}
                </div>
              )}

              <div className="footer">
                <div className="signature">
                  <p>Penerima,</p>
                  <div className="line"></div>
                  <p><strong>{sessionStorage.getItem('auth_user') ? JSON.parse(sessionStorage.getItem('auth_user')!).name : 'Karyawan'}</strong></p>
                </div>
                <div className="signature">
                  <p>Manajer HRD,</p>
                  <div className="line"></div>
                  <p><strong>HRD Department</strong></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
