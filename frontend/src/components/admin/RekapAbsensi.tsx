import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { Search, RefreshCw, Loader2, Eye, Clock, Calendar, FileDown, X } from 'lucide-react'

interface Attendance {
  id: number
  date: string
  attendance_type?: string | null
  clock_in: string | null
  clock_out: string | null
  latitude_in: string | null
  longitude_in: string | null
  latitude_out: string | null
  longitude_out: string | null
  photo_in: string | null
  photo_out: string | null
  notes_in: string | null
  notes_out: string | null
  status_in: string | null
  status_out: string | null
  user: {
    id: number
    name: string
    email: string
  }
}

interface Employee {
  id: number
  name: string
  email: string
}

interface RekapAbsensiProps {
  token: string
  employees: Employee[]
  attendanceLoading: boolean
  attendances: Attendance[]
  fetchAttendances: () => void
  formatDate: (d: string) => string
  getStatusBadge: (s: string | null) => React.ReactNode
  setSelectedAttendance: (a: Attendance) => void
  handleOpenEditModal: (a: Attendance) => void
}

export default function RekapAbsensi({
  token,
  employees,
  attendanceLoading,
  attendances,
  fetchAttendances,
  formatDate,
  getStatusBadge,
  setSelectedAttendance,
  handleOpenEditModal,
}: RekapAbsensiProps) {
  // Filter States
  const [search, setSearch] = useState('')
  const [reportMonth, setReportMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}` // Default to current month-year
  })
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [statusIn, setStatusIn] = useState('all')
  const [statusOut, setStatusOut] = useState('all')
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Manual Attendance Modal States
  const [showManualModal, setShowManualModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split('T')[0])
  const [manualType, setManualType] = useState<'kantor' | 'kunjungan' | 'client'>('kantor')
  const [manualClockIn, setManualClockIn] = useState('08:00') // default jam masuk
  const [manualClockOut, setManualClockOut] = useState('17:00') // default jam keluar
  const [manualNotes, setManualNotes] = useState('Input absensi manual oleh Admin')
  const [submittingManual, setSubmittingManual] = useState(false)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, reportMonth, startDate, endDate, statusIn, statusOut])

  // Filter Logic (For Web UI Display)
  const filteredAttendances = attendances.filter((att) => {
    // 1. Search Query (Name/Email)
    const matchesSearch =
      !search ||
      att.user.name.toLowerCase().includes(search.toLowerCase()) ||
      att.user.email.toLowerCase().includes(search.toLowerCase())

    // 2. Calendar Date Range & Month Filter
    const matchesDate =
      (!startDate || att.date >= startDate) &&
      (!endDate || att.date <= endDate) &&
      (!reportMonth || att.date.startsWith(reportMonth))

    // 3. Status Masuk Filter
    const matchesStatusIn = statusIn === 'all' || att.status_in === statusIn

    // 4. Status Keluar Filter
    const matchesStatusOut = statusOut === 'all' || att.status_out === statusOut

    return matchesSearch && matchesDate && matchesStatusIn && matchesStatusOut
  })

  // Pagination Logic
  const totalItems = filteredAttendances.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedAttendances = filteredAttendances.slice(startIndex, startIndex + itemsPerPage)

  // Export to PDF (Filtered strictly to selected report month, in Indonesian language)
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    // Parse report month-year
    const activeMonth = reportMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const [year, month] = activeMonth.split('-')
    const currentMonthNum = parseInt(month, 10) - 1
    const currentYear = year

    // Filter to ONLY include records from the selected report month
    const currentMonthAttendances = filteredAttendances.filter(att => att.date.startsWith(activeMonth))

    // Helper functions for Indonesian translation in PDF
    const getTypeLabel = (type: string | null | undefined) => {
      if (!type || type === 'kantor') return 'Kantor'
      if (type === 'kunjungan') return 'Kunjungan Kerja'
      if (type === 'client') return 'Kunjungan Klien'
      return type
    }

    const getStatusInLabel = (status: string | null | undefined) => {
      if (!status) return '-'
      if (status === 'early') return 'Lebih Awal'
      if (status === 'normal') return 'Normal'
      if (status === 'late') return 'Terlambat'
      return status
    }

    const getStatusOutLabel = (status: string | null | undefined) => {
      if (!status) return '-'
      if (status === 'normal') return 'Normal'
      if (status === 'early_departure') return 'Pulang Cepat'
      if (status === 'overtime') return 'Lembur'
      return status
    }

    // Calculations for Totals in PDF (based on selected month's filtered data)
    const pdfCountType = (type: string | null) => {
      return currentMonthAttendances.filter(att => {
        if (type === 'kantor') {
          return !att.attendance_type || att.attendance_type === 'kantor'
        }
        return att.attendance_type === type
      }).length
    }

    const pdfCountStatusIn = (status: string) => {
      return currentMonthAttendances.filter(att => att.status_in === status).length
    }

    const pdfCountStatusOut = (status: string) => {
      return currentMonthAttendances.filter(att => att.status_out === status).length
    }

    const getIndonesianMonthName = (monthNum: number) => {
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      return months[monthNum];
    }

    const indonesianMonthName = getIndonesianMonthName(currentMonthNum)

    const htmlContent = `
      <html>
        <head>
          <title>Rekap Absensi Karyawan - ${indonesianMonthName} ${currentYear}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #334155; padding: 25px; line-height: 1.5; }
            h1 { text-align: center; color: #1e293b; margin-bottom: 5px; font-size: 22px; font-weight: 800; }
            h3 { text-align: center; color: #64748b; font-weight: 600; font-size: 13px; margin-top: 0; margin-bottom: 25px; }
            .meta { margin-bottom: 25px; font-size: 11px; padding: 15px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
            .meta table { width: 100%; border-collapse: collapse; }
            .meta td { padding: 4px 8px; border: none; }
            .meta td.label { font-weight: bold; color: #475569; width: 18%; }
            .totals { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 25px; }
            .totals-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px; text-align: center; background-color: #ffffff; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
            .totals-card .count { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px; }
            .totals-card .label { font-size: 8px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
            table.data-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px; }
            table.data-table th, table.data-table td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
            table.data-table th { background-color: #f1f5f9; font-weight: 700; color: #334155; text-transform: uppercase; font-size: 8px; letter-spacing: 0.5px; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 8px; font-weight: 700; text-transform: capitalize; border: 1px solid transparent; }
            .badge-kantor { background-color: #e0e7ff; color: #3730a3; border-color: #c7d2fe; }
            .badge-kunjungan { background-color: #d1fae5; color: #065f46; border-color: #a7f3d0; }
            .badge-client { background-color: #fef3c7; color: #92400e; border-color: #fde68a; }
            .badge-normal { background-color: #ecfdf5; color: #047857; border-color: #a7f3d0; }
            .badge-late { background-color: #fef2f2; color: #b91c1c; border-color: #fca5a5; }
            .badge-early { background-color: #fffbeb; color: #b45309; border-color: #fde68a; }
            .badge-early_departure { background-color: #fef2f2; color: #b91c1c; border-color: #fca5a5; }
            .badge-overtime { background-color: #fffbeb; color: #b45309; border-color: #fde68a; }
            @media print {
              button { display: none; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <h1>Laporan Rekap Absensi Karyawan</h1>
          <h3>Bulan: ${indonesianMonthName} ${currentYear} | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</h3>
          
          <div class="meta">
            <table>
              <tr>
                <td class="label">Pencarian Karyawan:</td>
                <td>${search || 'Semua Karyawan'}</td>
                <td class="label">Rentang Tanggal:</td>
                <td>${startDate && endDate ? `${formatDate(startDate)} s/d ${formatDate(endDate)}` : startDate ? `Sejak ${formatDate(startDate)}` : endDate ? `Hingga ${formatDate(endDate)}` : 'Semua Tanggal'}</td>
              </tr>
              <tr>
                <td class="label">Status Masuk:</td>
                <td>${statusIn === 'all' ? 'Semua Status' : statusIn === 'early' ? 'Lebih Awal' : statusIn === 'normal' ? 'Normal' : 'Terlambat'}</td>
                <td class="label">Status Keluar:</td>
                <td>${statusOut === 'all' ? 'Semua Status' : statusOut === 'normal' ? 'Normal' : statusOut === 'early_departure' ? 'Pulang Cepat' : 'Lembur'}</td>
              </tr>
            </table>
          </div>

          <div class="totals" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
            <div class="totals-card">
              <div class="label">Total Absen (Bulan Ini)</div>
              <div class="count">${currentMonthAttendances.length}</div>
            </div>
            <div class="totals-card">
              <div class="label">Tipe Kantor</div>
              <div class="count">${pdfCountType('kantor')}</div>
            </div>
            <div class="totals-card">
              <div class="label">Tipe Kunjungan</div>
              <div class="count">${pdfCountType('kunjungan')}</div>
            </div>
            <div class="totals-card">
              <div class="label">Tipe Client</div>
              <div class="count">${pdfCountType('client')}</div>
            </div>
            <div class="totals-card">
              <div class="label">Hadir Normal</div>
              <div class="count">${pdfCountStatusIn('normal')}</div>
            </div>
            <div class="totals-card">
              <div class="label">Hadir Terlambat</div>
              <div class="count">${pdfCountStatusIn('late')}</div>
            </div>
            <div class="totals-card">
              <div class="label">Pulang Cepat</div>
              <div class="count">${pdfCountStatusOut('early_departure')}</div>
            </div>
            <div class="totals-card">
              <div class="label">Kerja Lembur</div>
              <div class="count">${pdfCountStatusOut('overtime')}</div>
            </div>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">No</th>
                <th>Nama Karyawan</th>
                <th>Tanggal</th>
                <th>Tipe</th>
                <th>Clock-In (Masuk)</th>
                <th>Status Masuk</th>
                <th>Clock-Out (Keluar)</th>
                <th>Status Keluar</th>
              </tr>
            </thead>
            <tbody>
              ${currentMonthAttendances.length === 0 ? `
                <tr>
                  <td colSpan="8" style="text-align: center; padding: 20px; color: #64748b;">
                    Tidak ada data absensi untuk bulan ini (${indonesianMonthName} ${currentYear}).
                  </td>
                </tr>
              ` : currentMonthAttendances.map((att, idx) => `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td><strong>${att.user.name}</strong><br/><span style="color: #64748b; font-size: 8.5px;">${att.user.email}</span></td>
                  <td>${formatDate(att.date)}</td>
                  <td><span class="badge badge-${att.attendance_type || 'kantor'}">${getTypeLabel(att.attendance_type)}</span></td>
                  <td style="font-family: monospace; font-weight: bold;">${att.clock_in || '-'}</td>
                  <td>${att.status_in ? `<span class="badge badge-${att.status_in}">${getStatusInLabel(att.status_in)}</span>` : '-'}</td>
                  <td style="font-family: monospace; font-weight: bold;">${att.clock_out || '-'}</td>
                  <td>${att.status_out ? `<span class="badge badge-${att.status_out}">${getStatusOutLabel(att.status_out)}</span>` : '-'}</td>
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

  // Handle Manual Attendance Submission
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) {
      Swal.fire({
        title: 'Pilih Karyawan',
        text: 'Silakan pilih karyawan terlebih dahulu.',
        icon: 'warning',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#6366f1'
      })
      return
    }

    setSubmittingManual(true)
    try {
      const response = await axios.post(
        'http://localhost:8000/api/admin/attendances',
        {
          user_id: parseInt(selectedUserId, 10),
          date: manualDate,
          attendance_type: manualType,
          clock_in: manualClockIn,
          clock_out: manualClockOut || null,
          notes: manualNotes
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.status === 'success') {
        Swal.fire({
          title: 'Berhasil!',
          text: response.data.message || 'Absensi manual karyawan berhasil dibuat.',
          icon: 'success',
          background: '#1e293b',
          color: '#f8fafc',
          timer: 2000,
          showConfirmButton: false
        })
        
        // Reset state and close modal
        setShowManualModal(false)
        setSelectedUserId('')
        setManualNotes('Input absensi manual oleh Admin')
        
        // Refresh log table
        fetchAttendances()
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal membuat absensi manual.'
      Swal.fire({
        title: 'Gagal',
        text: msg,
        icon: 'error',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#ef4444'
      })
    } finally {
      setSubmittingManual(false)
    }
  }

  return (
    <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in font-quicksand">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-quicksand">
        <div>
          <h3 className="text-lg font-bold text-slate-800 font-quicksand">Log Seluruh Absensi</h3>
          <p className="text-xs text-slate-500 font-quicksand font-medium">Monitoring waktu, lokasi, foto, dan status absensi seluruh karyawan.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Absensi Manual Button */}
          <button
            onClick={() => setShowManualModal(true)}
            disabled={attendanceLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:border-orange-500 text-slate-655 hover:text-orange-600 font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed font-quicksand"
            title="Absensikan Karyawan (Manual)"
          >
            <Clock className="w-4 h-4 text-orange-500" />
            Absensi Manual
          </button>

          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            disabled={attendanceLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-650 hover:to-orange-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-red-500/10 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed font-quicksand"
            title="Ekspor PDF"
          >
            <FileDown className="w-4 h-4" />
            Ekspor PDF
          </button>

          <button
            onClick={fetchAttendances}
            disabled={attendanceLoading}
            className="p-2.5 bg-white border border-slate-200 hover:border-red-500 text-slate-500 hover:text-red-500 rounded-xl transition-all cursor-pointer inline-flex items-center shrink-0 disabled:opacity-50 shadow-sm"
            title="Segarkan Log"
          >
            <RefreshCw className={`w-4 h-4 ${attendanceLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Modern Filters Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 bg-orange-50/15 p-5 border border-orange-100/60 rounded-2xl font-quicksand">
        
        {/* Search Filter */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider">Cari Karyawan</label>
          <div className="relative">
            <Search className="absolute inset-y-0 left-0 pl-3 w-4.5 h-4.5 my-auto text-slate-400" />
            <input
              type="text"
              placeholder="Nama atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 pl-9 pr-3 outline-none transition-all text-xs font-semibold shadow-sm"
            />
          </div>
        </div>

        {/* Report Month Filter (Month Picker) */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-red-500" />
            Bulan Laporan
          </label>
          <input
            type="month"
            value={reportMonth}
            onChange={(e) => setReportMonth(e.target.value)}
            className="w-full bg-white border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none transition-all text-xs font-semibold shadow-sm"
          />
        </div>

        {/* Date / Calendar Filter - Start Date */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-red-500" />
            Dari Tanggal
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-white border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none transition-all text-xs font-semibold shadow-sm"
          />
        </div>

        {/* Date / Calendar Filter - End Date */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-red-500" />
            Sampai Tanggal
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-white border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none transition-all text-xs font-semibold shadow-sm"
          />
        </div>

        {/* Status Masuk Filter */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status Masuk</label>
          <select
            value={statusIn}
            onChange={(e) => setStatusIn(e.target.value)}
            className="w-full bg-white border border-slate-200 focus:border-red-500 text-slate-755 rounded-xl py-2 px-3 outline-none transition-all text-xs font-semibold shadow-sm"
          >
            <option value="all">Semua Status Masuk</option>
            <option value="early">Datang Lebih Awal</option>
            <option value="normal">Normal</option>
            <option value="late">Terlambat</option>
          </select>
        </div>

        {/* Status Keluar Filter */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-555 uppercase tracking-wider">Status Keluar</label>
          <select
            value={statusOut}
            onChange={(e) => setStatusOut(e.target.value)}
            className="w-full bg-white border border-slate-200 focus:border-red-500 text-slate-755 rounded-xl py-2 px-3 outline-none transition-all text-xs font-semibold shadow-sm"
          >
            <option value="all">Semua Status Keluar</option>
            <option value="normal">Normal</option>
            <option value="early_departure">Pulang Cepat</option>
            <option value="overtime">Lembur</option>
          </select>
        </div>

        {/* Reset Filter Button */}
        <div className="flex items-end">
          <button
            onClick={() => {
              setSearch('')
              const now = new Date()
              setReportMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
              setStartDate('')
              setEndDate('')
              setStatusIn('all')
              setStatusOut('all')
            }}
            disabled={!search && !startDate && !endDate && statusIn === 'all' && statusOut === 'all'}
            className="w-full py-2.5 bg-white border border-slate-250 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 font-bold rounded-xl text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow"
          >
            Bersihkan Filter
          </button>
        </div>
      </div>

      {/* Attendances Table */}
      <div className="border border-orange-100 rounded-2xl overflow-hidden bg-orange-50/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-quicksand">
            <thead>
              <tr className="bg-orange-55/30 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-orange-100 font-quicksand">
                <th className="py-4 px-6">Karyawan</th>
                <th className="py-4 px-6">Tanggal</th>
                <th className="py-4 px-6">Tipe</th>
                <th className="py-4 px-6">Clock-In (Masuk)</th>
                <th className="py-4 px-6">Clock-Out (Keluar)</th>
                <th className="py-4 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100 text-sm text-slate-600">
              {attendanceLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-450 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                      Memuat rekam absensi...
                    </div>
                  </td>
                </tr>
              ) : paginatedAttendances.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-450 font-semibold">
                    Data absensi tidak ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedAttendances.map((att) => (
                  <tr key={att.id} className="hover:bg-orange-50/10 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-extrabold text-slate-800 font-quicksand">{att.user.name}</p>
                        <p className="text-[11px] text-slate-450 font-medium mt-0.5">{att.user.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-extrabold text-slate-700 text-xs">
                      {formatDate(att.date)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                        att.attendance_type === 'kunjungan' 
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-250' 
                          : att.attendance_type === 'client' 
                          ? 'text-amber-700 bg-amber-50 border-amber-250' 
                          : 'text-indigo-700 bg-indigo-50 border-indigo-250'
                      }`}>
                        {att.attendance_type || 'kantor'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {att.clock_in ? (
                        <div className="space-y-1">
                          <p className="font-mono text-xs font-bold text-slate-800">{att.clock_in}</p>
                          <div>{getStatusBadge(att.status_in)}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic font-semibold">Belum masuk</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {att.clock_out ? (
                        <div className="space-y-1">
                          <p className="font-mono text-xs font-bold text-slate-800">{att.clock_out}</p>
                          <div>{getStatusBadge(att.status_out)}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic font-semibold">Belum keluar</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedAttendance(att)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-red-500 text-slate-655 hover:text-red-500 rounded-xl text-xs font-bold transition-all cursor-pointer font-quicksand shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detail
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(att)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-orange-500 text-slate-655 hover:text-orange-600 rounded-xl text-xs font-bold transition-all cursor-pointer font-quicksand shadow-sm"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Edit
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

      {/* Pagination Footer */}
      {!attendanceLoading && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-orange-100 font-quicksand">
          <span className="text-xs text-slate-500 font-semibold">
            Menampilkan <span className="font-bold text-slate-700">{startIndex + 1}</span> sampai{' '}
            <span className="font-bold text-slate-700">{Math.min(startIndex + itemsPerPage, totalItems)}</span> dari{' '}
            <span className="font-bold text-slate-700">{totalItems}</span> entri absensi
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:border-orange-500 hover:text-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer bg-white"
              >
                Sebelumnya
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                })
                .map((page, index, array) => {
                  const showEllipsisBefore = page > 1 && array[index - 1] !== page - 1
                  return (
                    <React.Fragment key={page}>
                      {showEllipsisBefore && <span className="px-1.5 text-slate-400 text-xs">...</span>}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          currentPage === page
                            ? 'bg-orange-500 border border-orange-500 text-white shadow-sm'
                            : 'border border-slate-200 text-slate-600 hover:border-orange-500 hover:text-orange-600 bg-white'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  )
                })}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:border-orange-500 hover:text-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer bg-white"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </div>
      )}

      {/* Manual Attendance Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-950/20 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white border border-orange-100 rounded-3xl p-6 max-w-md w-full relative shadow-xl overflow-hidden animate-zoom-in my-8 max-h-[90vh] overflow-y-auto font-quicksand">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-red-500 via-orange-500 to-transparent"></div>

            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" /> Absensikan Karyawan
              </h3>
              <button
                onClick={() => {
                  setShowManualModal(false)
                  setSelectedUserId('')
                }}
                className="p-1.5 hover:bg-orange-50/50 rounded-lg transition-all cursor-pointer text-slate-400 hover:text-red-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleManualSubmit} className="space-y-4">
              {/* Employee Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Karyawan *
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-550 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-semibold"
                  required
                >
                  <option value="">-- Pilih Karyawan --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                  ))}
                </select>
              </div>

              {/* Date Input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Tanggal Absensi *
                </label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-semibold"
                  required
                />
              </div>

              {/* Attendance Type */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Tipe Presensi *
                </label>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value as any)}
                  className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 text-slate-700 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-semibold"
                  required
                >
                  <option value="kantor">Absen Kantor</option>
                  <option value="kunjungan">Kunjungan Kerja / Lapangan</option>
                  <option value="client">Kunjungan Klien (Client Visit)</option>
                </select>
              </div>

              {/* Clock In & Clock Out Times */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Jam Masuk *
                  </label>
                  <input
                    type="time"
                    value={manualClockIn}
                    onChange={(e) => setManualClockIn(e.target.value)}
                    className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Jam Keluar (Opsional)
                  </label>
                  <input
                    type="time"
                    value={manualClockOut}
                    onChange={(e) => setManualClockOut(e.target.value)}
                    className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-mono"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Catatan / Keterangan
                </label>
                <textarea
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Keterangan absensi manual..."
                  rows={2}
                  className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 px-4 outline-none transition-all text-xs resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-orange-50">
                <button
                  type="button"
                  onClick={() => {
                    setShowManualModal(false)
                    setSelectedUserId('')
                  }}
                  className="px-4 py-2.5 bg-orange-50/50 border border-orange-100 hover:bg-orange-50 text-slate-655 rounded-xl transition-all cursor-pointer text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingManual}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingManual ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    'Absensikan Karyawan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
