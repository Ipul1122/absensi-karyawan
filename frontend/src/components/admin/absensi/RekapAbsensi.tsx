import React, { useState, useEffect } from 'react'
import { Search, RefreshCw, Loader2, Eye, Clock, Calendar, FileDown, Compass, SlidersHorizontal } from 'lucide-react'
import ManualAttendanceModal from './ManualAttendanceModal'
import SalesVisitsLog from './SalesVisitsLog'

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
    photo?: string | null
    join_date?: string | null
    employee_number?: string | null
    division?: string | null
    company?: string | null
  }
  shift_start_time?: string | null
  shift_end_time?: string | null
}

interface Employee {
  id: number
  name: string
  email: string
  photo?: string | null
  join_date?: string | null
  employee_number?: string | null
  division?: string | null
  company?: string | null
  status?: 'active' | 'pending' | 'pending_delete'
  saturday_off?: boolean | number
  sunday_off?: boolean | number
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
  officeLatitude?: string
  officeLongitude?: string
  leaves?: any[]
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
  officeLatitude = '-6.2088',
  officeLongitude = '106.8456',
  leaves = [],
}: RekapAbsensiProps) {
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'sales_visits' | 'client_visits'>('attendance')
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily')

  // Helper to calculate total working days in reportMonth (excluding Sundays/Saturdays based on user schedule settings)
  const getWorkingDaysCount = (monthStr: string, emp: Employee) => {
    if (!monthStr) return 0
    const [year, month] = monthStr.split('-').map(Number)
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const todayDate = now.getDate()

    let endDay: number
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      endDay = new Date(year, month, 0).getDate()
    } else if (year === currentYear && month === currentMonth) {
      endDay = todayDate
    } else {
      return 0
    }

    const isSatOff = !!emp.saturday_off
    const isSunOff = emp.sunday_off !== false

    let startDay = 1
    if (emp.join_date) {
      const [joinYear, joinMonth, joinDay] = emp.join_date.split('-').map(Number)
      if (joinYear > year || (joinYear === year && joinMonth > month)) {
        // Employee has not joined yet during this month
        return 0
      }
      if (joinYear === year && joinMonth === month) {
        // Joined this month, start counting from join date day
        startDay = joinDay
      }
    }

    let workingDays = 0
    for (let d = startDay; d <= endDay; d++) {
      const dayOfWeek = new Date(year, month - 1, d).getDay()
      
      let isOff = false
      if (dayOfWeek === 0 && isSunOff) {
        isOff = true
      } else if (dayOfWeek === 6 && isSatOff) {
        isOff = true
      }

      if (!isOff) {
        workingDays++
      }
    }
    return workingDays
  }

  // Calculate aggregated stats for all employees for the selected reportMonth
  const getEmployeeMonthlyStats = () => {
    return employees.map((emp) => {
      const workingDays = getWorkingDaysCount(reportMonth, emp)

      // 1. Filter user attendances for this month
      const userMonthAtt = attendances.filter(
        (att) => att.user?.id === emp.id && att.date.startsWith(reportMonth)
      )

      // Present: unique dates where clock_in is not null
      const presentCount = userMonthAtt.filter((att) => att.clock_in !== null).length

      // Late: status_in === 'late'
      const lateCount = userMonthAtt.filter((att) => att.status_in === 'late').length

      // 2. Filter user approved leaves for this month
      const userLeaves = leaves.filter(
        (l) => l.user_id === emp.id && l.status === 'approved'
      )

      const isSatOff = !!emp.saturday_off
      const isSunOff = emp.sunday_off !== false

      // Calculate leave days count that overlap with the selected month and are not employee off days
      let leaveDaysCount = 0
      if (reportMonth) {
        const [year, month] = reportMonth.split('-').map(Number)
        const daysInMonth = new Date(year, month, 0).getDate()
        
        let startDay = 1
        if (emp.join_date) {
          const [joinYear, joinMonth, joinDay] = emp.join_date.split('-').map(Number)
          if (joinYear > year || (joinYear === year && joinMonth > month)) {
            startDay = daysInMonth + 1
          } else if (joinYear === year && joinMonth === month) {
            startDay = joinDay
          }
        }

        for (let d = startDay; d <= daysInMonth; d++) {
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const dayOfWeek = new Date(year, month - 1, d).getDay()
          
          let isOff = false
          if (dayOfWeek === 0 && isSunOff) {
            isOff = true
          } else if (dayOfWeek === 6 && isSatOff) {
            isOff = true
          }

          if (!isOff) {
            // Check if dateStr is within any of the user leaves range
            const isOnLeave = userLeaves.some(
              (l) => dateStr >= l.start_date && dateStr <= l.end_date
            )
            if (isOnLeave) {
              leaveDaysCount++
            }
          }
        }
      }

      // Absent: workingDays - presentCount - leaveDaysCount (clamp to 0)
      const absentCount = Math.max(0, workingDays - presentCount - leaveDaysCount)

      // Presence percentage: presentCount / workingDays * 100
      const presenceRate = workingDays > 0 
        ? Math.min(100, Math.round((presentCount / workingDays) * 100))
        : 0

      return {
        employee: emp,
        workingDays,
        present: presentCount,
        late: lateCount,
        leave: leaveDaysCount,
        absent: absentCount,
        presenceRate,
      }
    })
  }

  // Date helper functions
  const getTodayStr = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }

  const getYesterdayStr = () => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  // Filter States
  const [search, setSearch] = useState('')
  const [selectedCompany, setSelectedCompany] = useState('all')
  const [reportMonth, setReportMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}` // Default to current month-year
  })
  const [startDate, setStartDate] = useState(getTodayStr)
  const [endDate, setEndDate] = useState(getTodayStr)
  const [statusIn, setStatusIn] = useState('all')
  const [statusOut, setStatusOut] = useState('all')
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15) // Default to 15 (> 10)

  // Manual Attendance Modal States
  const [showManualModal, setShowManualModal] = useState(false)

  // Mobile Filters Collapsible State
  const [showFilters, setShowFilters] = useState(false)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, selectedCompany, reportMonth, startDate, endDate, statusIn, statusOut, itemsPerPage])

  // Filter Logic (For Web UI Display)
  const filteredAttendances = attendances.filter((att) => {
    // Only show 'kantor' type (or null/default to office) in daily attendance log
    if (att.attendance_type && att.attendance_type !== 'kantor') {
      return false
    }

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

    // 5. Company Filter
    const matchesCompany = selectedCompany === 'all' || att.user.company === selectedCompany

    return matchesSearch && matchesDate && matchesStatusIn && matchesStatusOut && matchesCompany
  })

  // Count active filters (excluding reportMonth as it defaults to current month)
  const activeFilterCount =
    (search ? 1 : 0) +
    (selectedCompany !== 'all' ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0) +
    (statusIn !== 'all' ? 1 : 0) +
    (statusOut !== 'all' ? 1 : 0)

  // Monthly Summary Stats Filter & Pagination
  const monthlyStats = getEmployeeMonthlyStats()
  const filteredMonthlyStats = monthlyStats.filter(({ employee }) => {
    const matchesSearch = 
      employee.name.toLowerCase().includes(search.toLowerCase()) ||
      employee.email.toLowerCase().includes(search.toLowerCase())
    
    const matchesCompany = selectedCompany === 'all' || employee.company === selectedCompany

    return matchesSearch && matchesCompany
  })

  // Pagination Logic
  const totalItems = viewMode === 'daily' ? filteredAttendances.length : filteredMonthlyStats.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedAttendances = filteredAttendances.slice(startIndex, startIndex + itemsPerPage)
  const paginatedMonthlyStats = filteredMonthlyStats.slice(startIndex, startIndex + itemsPerPage)

  // Helper to resolve coordinates/presets to location name
  const getSingleLokasiName = (lat: string | null | undefined, lng: string | null | undefined, type?: string | null) => {
    if (!lat) return '-'
    if (isNaN(parseFloat(lat))) return lat
    
    const latitude = parseFloat(lat)
    const longitude = lng ? parseFloat(lng) : 0

    // Check if coordinates match Mall Thamrin City preset
    if (Math.abs(latitude - (-6.1942189)) < 0.0001 && Math.abs(longitude - 106.815998) < 0.0001) {
      return 'Mall Thamrin City'
    }

    // Check if coordinates match Office coordinates
    const officeLat = parseFloat(officeLatitude)
    const officeLng = parseFloat(officeLongitude)
    if (!isNaN(officeLat) && !isNaN(officeLng)) {
      if (Math.abs(latitude - officeLat) < 0.0005 && Math.abs(longitude - officeLng) < 0.0005) {
        return 'Kantor Pusat'
      }
    }

    // Fallback based on attendance type
    if (type === 'kantor') return 'Kantor Pusat'
    if (type === 'kunjungan') return 'Kunjungan Kerja'
    if (type === 'client') return 'Kunjungan Klien'

    return 'Luar Kantor'
  }

  const getLokasiLabel = (att: Attendance) => {
    const locIn = att.latitude_in ? getSingleLokasiName(att.latitude_in, att.longitude_in, att.attendance_type) : '-'
    const locOut = att.latitude_out ? getSingleLokasiName(att.latitude_out, att.longitude_out, att.attendance_type) : '-'
    
    if (locIn === '-' && locOut === '-') return '-'
    if (locOut === '-' || locIn === locOut) return locIn
    return `${locIn} (Masuk) / ${locOut} (Keluar)`
  }

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
                <td class="label">Perusahaan:</td>
                <td>${selectedCompany === 'all' ? 'Semua Perusahaan' : selectedCompany}</td>
              </tr>
              <tr>
                <td class="label">Rentang Tanggal:</td>
                <td>${startDate && endDate ? `${formatDate(startDate)} s/d ${formatDate(endDate)}` : startDate ? `Sejak ${formatDate(startDate)}` : endDate ? `Hingga ${formatDate(endDate)}` : 'Semua Tanggal'}</td>
                <td class="label">Status Masuk:</td>
                <td>${statusIn === 'all' ? 'Semua Status' : statusIn === 'early' ? 'Lebih Awal' : statusIn === 'normal' ? 'Normal' : 'Terlambat'}</td>
              </tr>
              <tr>
                <td class="label">Status Keluar:</td>
                <td colspan="3">${statusOut === 'all' ? 'Semua Status' : statusOut === 'normal' ? 'Normal' : statusOut === 'early_departure' ? 'Pulang Cepat' : 'Lembur'}</td>
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
                <th>Absen Masuk</th>
                <th>Status Masuk</th>
                <th>Absen Keluar</th>
                <th>Status Keluar</th>
                <th>Lokasi</th>
              </tr>
            </thead>
            <tbody>
              ${currentMonthAttendances.length === 0 ? `
                <tr>
                  <td colSpan="9" style="text-align: center; padding: 20px; color: #64748b;">
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
                  <td>${getLokasiLabel(att)}</td>
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

  // Export to Excel Multi-Sheet (per karyawan)
  const handleExportExcel = () => {
    const activeMonth = reportMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const [year, month] = activeMonth.split('-')

    const getIndonesianMonthName = (monthNum: number) => {
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
      return months[monthNum]
    }
    const indonesianMonthName = getIndonesianMonthName(parseInt(month, 10) - 1)

    // ── Helpers ──────────────────────────────────────────────────────────────
    const escXml = (s: string | null | undefined) =>
      (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

    const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const getDayName = (dateStr: string) => DAYS_ID[new Date(dateStr + 'T00:00:00').getDay()]

    const getShiftLabel = (att: Attendance) => {
      const day = new Date(att.date + 'T00:00:00').getDay()
      if (day === 6) return 'Senin - Sabtu'
      return 'Senin - Jumat'
    }

    const getKeterangan = (att: Attendance) => {
      if (!att.clock_in) return 'Tidak Hadir'
      if (att.status_in === 'late') return 'Terlambat'
      if (att.status_in === 'early') return 'Hadir Lebih Awal'
      return 'Masuk Kerja'
    }

    // ── Style IDs ────────────────────────────────────────────────────────────
    const getStyleId = (att: Attendance) => {
      const dayIdx = new Date(att.date + 'T00:00:00').getDay()
      if (dayIdx === 6) return 'sSabtu'   // Sabtu → kuning
      if (!att.clock_in) return 'sAbsent' // Tidak hadir → merah muda
      if (att.status_in === 'late') return 'sLate'  // Terlambat → oranye muda
      return 'sNormal'
    }

    // ── Build one SS Row ─────────────────────────────────────────────────────
    const buildRow = (att: Attendance, idx: number) => {
      const sid = getStyleId(att)
      const cell = (val: string, type: 'String' | 'Number' = 'String') =>
        `<Cell ss:StyleID="${sid}"><Data ss:Type="${type}">${escXml(val)}</Data></Cell>`

      return `<Row ss:Height="20">
        ${cell(String(idx + 1), 'Number')}
        ${cell(att.date)}
        ${cell(att.user.name)}
        ${cell(att.user.employee_number || '-')}
        ${cell(att.user.division || '-')}
        ${cell(att.user.company || '-')}
        ${cell(getShiftLabel(att))}
        ${cell(getDayName(att.date))}
        ${cell('08:30:00')}
        ${cell('17:30:00')}
        ${cell(att.clock_in || '-')}
        ${cell(att.clock_out || '-')}
        ${cell(getKeterangan(att))}
      </Row>`
    }

    // ── Header row ───────────────────────────────────────────────────────────
    const HEADERS = [
      'No', 'Tanggal Absen', 'Karyawan', 'Nomor Induk', 'Divisi',
      'Lokasi Absen', 'Shift', 'Hari Absen',
      'Jam Masuk Kantor', 'Jam Pulang Kantor',
      'Jam Masuk Absen', 'Jam Pulang Absen', 'Keterangan Absen'
    ]
    const COL_WIDTHS = [35, 90, 140, 90, 80, 180, 100, 80, 100, 100, 100, 100, 110]

    const buildHeaderRow = () =>
      `<Row ss:Height="28">${HEADERS.map(h =>
        `<Cell ss:StyleID="sHeader"><Data ss:Type="String">${escXml(h)}</Data></Cell>`
      ).join('')}</Row>`

    const buildColDefs = () =>
      COL_WIDTHS.map(w => `<Column ss:Width="${w}"/>`).join('')

    // ── Build one worksheet ──────────────────────────────────────────────────
    const buildWorksheet = (sheetName: string, atts: Attendance[]) => {
      const sorted = [...atts].sort((a, b) => a.date.localeCompare(b.date))
      const rows = sorted.map((att, i) => buildRow(att, i)).join('')
      return `
        <Worksheet ss:Name="${escXml(sheetName.substring(0, 31))}">
          <Table>${buildColDefs()}${buildHeaderRow()}${rows}</Table>
          <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
            <FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal>
            <TopRowBottomPane>1</TopRowBottomPane>
          </WorksheetOptions>
        </Worksheet>`
    }

    // ── Group attendances per employee ───────────────────────────────────────
    const empMap = new Map<number, { name: string; atts: Attendance[] }>()
    filteredAttendances.forEach(att => {
      const uid = att.user?.id
      if (!uid) return
      if (!empMap.has(uid)) empMap.set(uid, { name: att.user?.name || 'Karyawan', atts: [] })
      empMap.get(uid)!.atts.push(att)
    })

    // ── Build all worksheets ─────────────────────────────────────────────────
    const allSheets: string[] = []
    allSheets.push(buildWorksheet('FULL REKAP PRESENSI', filteredAttendances))
    empMap.forEach(({ name, atts }) => {
      allSheets.push(buildWorksheet(name.toUpperCase(), atts))
    })

    // ── XML Workbook ─────────────────────────────────────────────────────────
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook
  xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">

  <Styles>
    <Style ss:ID="sHeader">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
      <Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="10"/>
      <Interior ss:Color="#EA580C" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C2410C"/>
        <Border ss:Position="Left"   ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C2410C"/>
        <Border ss:Position="Right"  ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C2410C"/>
        <Border ss:Position="Top"    ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C2410C"/>
      </Borders>
    </Style>
    <Style ss:ID="sNormal">
      <Alignment ss:Vertical="Center"/>
      <Font ss:Size="9"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Left"   ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Right"  ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Top"    ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
      </Borders>
    </Style>
    <Style ss:ID="sSabtu">
      <Alignment ss:Vertical="Center"/>
      <Font ss:Size="9"/>
      <Interior ss:Color="#FFF9C4" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Left"   ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Right"  ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Top"    ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
      </Borders>
    </Style>
    <Style ss:ID="sLate">
      <Alignment ss:Vertical="Center"/>
      <Font ss:Size="9"/>
      <Interior ss:Color="#FFEDD5" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Left"   ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Right"  ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Top"    ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
      </Borders>
    </Style>
    <Style ss:ID="sAbsent">
      <Alignment ss:Vertical="Center"/>
      <Font ss:Size="9"/>
      <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Left"   ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Right"  ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Top"    ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
      </Borders>
    </Style>
  </Styles>

  ${allSheets.join('\n')}
</Workbook>`

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href  = url
    link.download = `Rekap_Absensi_${indonesianMonthName.replace(/\s+/g, '_')}_${year}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }



  return (
    <div className="space-y-6">
      {/* Tab Selector */}
      <div className="flex overflow-x-auto scrollbar-none bg-orange-50/30 border border-orange-100 rounded-2xl p-1.5 backdrop-blur-md gap-1">
        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`flex-1 shrink-0 sm:shrink flex items-center justify-center gap-2 py-3 px-4 sm:px-2 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'attendance'
              ? 'bg-gradient-to-r from-red-50 to-orange-50 border border-orange-200/50 text-red-600 font-extrabold shadow-sm'
              : 'text-slate-500 hover:text-red-500 border border-transparent'
          }`}
        >
          <Clock className="w-4.5 h-4.5" />
          Log Absensi Harian
        </button>
        <button
          onClick={() => setActiveSubTab('sales_visits')}
          className={`flex-1 shrink-0 sm:shrink flex items-center justify-center gap-2 py-3 px-4 sm:px-2 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'sales_visits'
              ? 'bg-gradient-to-r from-red-50 to-orange-50 border border-orange-200/50 text-red-600 font-extrabold shadow-sm'
              : 'text-slate-500 hover:text-red-500 border border-transparent'
          }`}
        >
          <Compass className="w-4.5 h-4.5" />
          Kunjungan Lapangan / Sales
        </button>
        <button
          onClick={() => setActiveSubTab('client_visits')}
          className={`flex-1 shrink-0 sm:shrink flex items-center justify-center gap-2 py-3 px-4 sm:px-2 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'client_visits'
              ? 'bg-gradient-to-r from-red-50 to-orange-50 border border-orange-200/50 text-red-600 font-extrabold shadow-sm'
              : 'text-slate-500 hover:text-red-500 border border-transparent'
          }`}
        >
          <Compass className="w-4.5 h-4.5" />
          Kunjungan Klien
        </button>
      </div>

      {activeSubTab === 'attendance' ? (
        <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in font-quicksand">
      
      {/* Header Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 font-quicksand">
        <div className="space-y-3 w-full lg:w-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-800 font-quicksand">
                {viewMode === 'daily' ? 'Log Seluruh Absensi' : 'Ringkasan Absensi Bulanan'}
              </h3>
              <p className="text-xs text-slate-500 font-quicksand font-medium hidden sm:block mt-1">
                {viewMode === 'daily' 
                  ? 'Monitoring waktu, lokasi, foto, dan status absensi seluruh karyawan.'
                  : 'Akumulasi total kehadiran, keterlambatan, cuti, alpa, dan persentase kehadiran bulanan.'}
              </p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex bg-slate-100/80 border border-slate-200/55 p-0.5 rounded-xl w-fit select-none shrink-0 shadow-xs">
              <button
                onClick={() => setViewMode('daily')}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                  viewMode === 'daily'
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Log Harian
              </button>
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                  viewMode === 'monthly'
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Ringkasan Bulanan
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons: 2x2 Grid on Mobile, Flex on Desktop */}
        <div className="grid grid-cols-2 gap-2 w-full lg:flex lg:flex-wrap lg:items-center lg:gap-2 lg:w-auto">
          {/* Absensi Manual Button */}
          <button
            onClick={() => setShowManualModal(true)}
            disabled={attendanceLoading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:border-orange-500 text-slate-650 hover:text-orange-650 font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed font-quicksand w-full lg:w-auto hover:scale-[1.02] active:scale-[0.98] h-[38px]"
            title="Absensikan Karyawan (Manual)"
          >
            <Clock className="w-4 h-4 text-orange-500 shrink-0" />
            <span>Absensi Manual</span>
          </button>

          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            disabled={attendanceLoading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-red-500/10 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed font-quicksand w-full lg:w-auto hover:scale-[1.02] active:scale-[0.98] h-[38px]"
            title="Ekspor PDF"
          >
            <FileDown className="w-4 h-4 shrink-0" />
            <span>Ekspor PDF</span>
          </button>

          {/* Export Excel Button */}
          <button
            onClick={handleExportExcel}
            disabled={attendanceLoading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/10 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed font-quicksand w-full lg:w-auto hover:scale-[1.02] active:scale-[0.98] h-[38px]"
            title="Ekspor Excel"
          >
            <FileDown className="w-4 h-4 shrink-0" />
            <span>Ekspor Excel</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchAttendances}
            disabled={attendanceLoading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:border-red-500 text-slate-650 hover:text-red-500 rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-sm hover:scale-[1.02] active:scale-[0.98] h-[38px] w-full lg:w-[38px]"
            title="Segarkan Log"
          >
            <RefreshCw className={`w-4 h-4 shrink-0 ${attendanceLoading ? 'animate-spin' : ''}`} />
            <span className="lg:hidden">Segarkan</span>
          </button>
        </div>
      </div>

      {/* Mobile Toggle Filters Button */}
      <div className="block md:hidden mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-orange-100 hover:border-orange-200 text-slate-700 font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-sm hover:shadow active:scale-[0.98]"
        >
          <SlidersHorizontal className="w-4 h-4 text-orange-500" />
          <span>{showFilters ? 'Sembunyikan Filter & Pencarian' : 'Tampilkan Filter & Pencarian'}</span>
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center bg-orange-500 text-white text-[10px] w-5 h-5 rounded-full font-extrabold shadow-sm animate-pulse">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Modern Filters Panel */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 bg-orange-50/15 p-5 border border-orange-100/60 rounded-2xl font-quicksand ${
        showFilters ? 'grid' : 'hidden md:grid'
      }`}>
        
        {/* Search Filter */}
        <div className="space-y-1 col-span-1 sm:col-span-2 lg:col-span-2">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cari Karyawan</label>
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

        {/* Perusahaan Filter */}
        <div className="space-y-1 col-span-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Perusahaan</label>
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="w-full bg-white border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-3 outline-none transition-all text-xs font-semibold shadow-sm cursor-pointer"
          >
            <option value="all">Semua Perusahaan</option>
            <option value="PT Cakrawala Parama Internasional">PT Cakrawala Parama Internasional</option>
            <option value="PT Yasodana Parvez Internasional">PT Yasodana Parvez Internasional</option>
          </select>
        </div>

        {/* Report Month Filter (Month Picker) */}
        <div className="space-y-1 col-span-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-red-500" />
            Bulan Laporan
          </label>
          <input
            type="month"
            value={reportMonth}
            onChange={(e) => setReportMonth(e.target.value)}
            className="w-full bg-white border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none transition-all text-xs font-semibold shadow-sm cursor-pointer"
          />
        </div>

        {viewMode === 'daily' && (
          <>
            {/* Date / Calendar Filter - Start Date */}
            <div className="space-y-1 col-span-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-red-500" />
                Dari Tanggal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none transition-all text-xs font-semibold shadow-sm cursor-pointer"
              />
            </div>

            {/* Date / Calendar Filter - End Date */}
            <div className="space-y-1 col-span-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-red-500" />
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none transition-all text-xs font-semibold shadow-sm cursor-pointer"
              />
            </div>

            {/* Quick Date Shortcuts */}
            <div className="space-y-1 flex flex-col justify-end col-span-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pintasan Tanggal</label>
              <div className="flex gap-1 h-[38px] items-center">
                <button
                  type="button"
                  onClick={() => { setStartDate(getTodayStr()); setEndDate(getTodayStr()); }}
                  className="flex-1 py-2 text-center text-[9px] font-extrabold text-orange-600 bg-orange-50/50 hover:bg-orange-100 border border-orange-200/50 rounded-xl transition-all cursor-pointer active:scale-95"
                  title="Filter Hari Ini"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => { setStartDate(getYesterdayStr()); setEndDate(getYesterdayStr()); }}
                  className="flex-1 py-2 text-center text-[9px] font-extrabold text-orange-600 bg-orange-50/50 hover:bg-orange-100 border border-orange-200/50 rounded-xl transition-all cursor-pointer active:scale-95"
                  title="Filter Kemarin"
                >
                  Kemarin
                </button>
                <button
                  type="button"
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="flex-1 py-2 text-center text-[9px] font-extrabold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all cursor-pointer active:scale-95"
                  title="Semua Tanggal"
                >
                  Semua
                </button>
              </div>
            </div>

            {/* Status Masuk Filter */}
            <div className="space-y-1 col-span-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status Masuk</label>
              <select
                value={statusIn}
                onChange={(e) => setStatusIn(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-3 outline-none transition-all text-xs font-semibold shadow-sm cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="early">Datang Lebih Awal</option>
                <option value="normal">Normal</option>
                <option value="late">Terlambat</option>
              </select>
            </div>

            {/* Status Keluar Filter */}
            <div className="space-y-1 col-span-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status Keluar</label>
              <select
                value={statusOut}
                onChange={(e) => setStatusOut(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-3 outline-none transition-all text-xs font-semibold shadow-sm cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="normal">Normal</option>
                <option value="early_departure">Pulang Cepat</option>
                <option value="overtime">Lembur</option>
              </select>
            </div>
          </>
        )}

        {/* Reset Filter Button */}
        <div className="flex items-end col-span-1">
          <button
            onClick={() => {
              setSearch('')
              setSelectedCompany('all')
              const now = new Date()
              setReportMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
              setStartDate('')
              setEndDate('')
              setStatusIn('all')
              setStatusOut('all')
            }}
            disabled={
              viewMode === 'daily'
                ? !search && selectedCompany === 'all' && !startDate && !endDate && statusIn === 'all' && statusOut === 'all'
                : !search && selectedCompany === 'all' && reportMonth === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
            }
            className="w-full py-2.5 bg-white border border-slate-250 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 font-bold rounded-xl text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow"
          >
            Bersihkan Filter
          </button>
        </div>
      </div>

      {/* Attendances Table - Desktop */}
      <div className="hidden md:block border border-orange-100 rounded-2xl overflow-hidden bg-orange-50/5">
        <div className="overflow-x-auto">
          {viewMode === 'daily' ? (
            <table className="w-full text-left border-collapse font-quicksand">
              <thead>
                <tr className="bg-orange-50/30 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-orange-100 font-quicksand">
                  <th className="py-4 px-6">Karyawan</th>
                  <th className="py-4 px-6">Tanggal</th>
                  <th className="py-4 px-6">Tipe</th>
                  <th className="py-4 px-6">Absen Masuk</th>
                  <th className="py-4 px-6">Absen Keluar</th>
                  <th className="py-4 px-6">Lokasi</th>
                  <th className="py-4 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100 text-sm text-slate-600">
                {attendanceLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                        Memuat rekam absensi...
                      </div>
                    </td>
                  </tr>
                ) : paginatedAttendances.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold">
                      Data absensi tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  paginatedAttendances.map((att) => (
                    <tr key={att.id} className="hover:bg-orange-50/10 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-extrabold text-slate-800 font-quicksand">{att.user.name}</p>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">{att.user.email}</p>
                          <div className="mt-1 flex flex-wrap gap-1.5 items-center">
                            {att.user.join_date && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 w-fit">
                                Masuk: {formatDate(att.user.join_date)}
                              </span>
                            )}
                            {att.user.company && (
                              <span className={`inline-flex items-center text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                                att.user.company.includes('Cakrawala') 
                                  ? 'text-red-750 bg-red-50 border-red-200' 
                                  : 'text-blue-750 bg-blue-50 border-blue-200'
                              }`}>
                                {att.user.company.includes('Cakrawala') ? 'Cakrawala' : 'Yasodana'}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-extrabold text-slate-700 text-xs">
                        <div>{formatDate(att.date)}</div>
                        {att.shift_start_time && att.shift_end_time && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5">
                              <Clock className="w-2.5 h-2.5 text-blue-500" /> {att.shift_start_time.substring(0, 5)} - {att.shift_end_time.substring(0, 5)}
                            </span>
                          </div>
                        )}
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
                      <td className="py-4 px-6 font-extrabold text-slate-700 text-xs">
                        {getLokasiLabel(att)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedAttendance(att)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-red-500 text-slate-600 hover:text-red-500 rounded-xl text-xs font-bold transition-all cursor-pointer font-quicksand shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse font-quicksand">
              <thead>
                <tr className="bg-orange-50/30 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-orange-100 font-quicksand">
                  <th className="py-4 px-6">Karyawan</th>
                  <th className="py-4 px-6 text-center">Hari Kerja</th>
                  <th className="py-4 px-6 text-center">Hadir</th>
                  <th className="py-4 px-6 text-center">Terlambat</th>
                  <th className="py-4 px-6 text-center">Cuti / Izin</th>
                  <th className="py-4 px-6 text-center">Alpa</th>
                  <th className="py-4 px-6">Rasio Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100 text-sm text-slate-600">
                {attendanceLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                        Memuat ringkasan absensi...
                      </div>
                    </td>
                  </tr>
                ) : paginatedMonthlyStats.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold">
                      Data karyawan tidak ditemukan atau belum ada data.
                    </td>
                  </tr>
                ) : (
                  paginatedMonthlyStats.map(({ employee, workingDays, present, late, leave, absent, presenceRate }) => {
                    const employeePhotoUrl = employee.photo 
                      ? (employee.photo.startsWith('http') ? employee.photo : `http://localhost:8000/storage/${employee.photo}`)
                      : null;

                    return (
                      <tr key={employee.id} className="hover:bg-orange-50/10 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {employeePhotoUrl ? (
                              <img src={employeePhotoUrl} alt={employee.name} className="w-10 h-10 rounded-full border border-slate-200 object-cover shadow-sm" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-extrabold text-sm shadow-sm shrink-0">
                                {employee.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-extrabold text-slate-800 font-quicksand">{employee.name}</p>
                              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{employee.email}</p>
                              <div className="mt-1 flex flex-wrap gap-1.5 items-center">
                                {employee.division && (
                                  <span className="inline-flex items-center text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-quicksand">
                                    {employee.division}
                                  </span>
                                )}
                                {employee.company && (
                                  <span className={`inline-flex items-center text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                                    employee.company.includes('Cakrawala') 
                                      ? 'text-red-750 bg-red-50 border-red-200' 
                                      : 'text-blue-750 bg-blue-50 border-blue-200'
                                  }`}>
                                    {employee.company.includes('Cakrawala') ? 'Cakrawala' : 'Yasodana'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center font-bold text-slate-700">
                          {workingDays} hari
                        </td>
                        <td className="py-4 px-6 text-center font-bold text-emerald-600">
                          {present} hari
                        </td>
                        <td className="py-4 px-6 text-center font-bold text-rose-600">
                          {late} hari
                        </td>
                        <td className="py-4 px-6 text-center font-bold text-amber-600">
                          {leave} hari
                        </td>
                        <td className="py-4 px-6 text-center font-bold text-slate-400">
                          {absent} hari
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1.5 max-w-[150px]">
                            <div className="flex justify-between text-xs font-bold text-slate-700">
                              <span>{presenceRate}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/50">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  presenceRate >= 90 
                                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' 
                                    : presenceRate >= 75 
                                    ? 'bg-gradient-to-r from-amber-400 to-amber-500' 
                                    : 'bg-gradient-to-r from-red-400 to-red-500'
                                }`}
                                style={{ width: `${presenceRate}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Attendances Mobile Card View */}
      <div className="block md:hidden space-y-4">
        {viewMode === 'daily' ? (
          attendanceLoading ? (
            <div className="py-8 text-center text-slate-400 font-medium bg-white border border-orange-100 rounded-2xl shadow-sm">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                <span>Memuat rekam absensi...</span>
              </div>
            </div>
          ) : paginatedAttendances.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-semibold bg-white border border-orange-100 rounded-2xl shadow-sm">
              Data absensi tidak ditemukan.
            </div>
          ) : (
            paginatedAttendances.map((att) => (
              <div key={att.id} className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm space-y-4 hover:border-orange-200 hover:shadow-md transition-all font-quicksand">
                {/* Card Header: Name and Date */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                      {att.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">{att.user.name}</h4>
                      <p className="text-[11px] text-slate-400 font-medium">{att.user.email}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5 items-center">
                        {att.user.join_date && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 w-fit font-quicksand">
                            Masuk: {formatDate(att.user.join_date)}
                          </span>
                        )}
                        {att.user.company && (
                          <span className={`inline-flex items-center text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                            att.user.company.includes('Cakrawala') 
                              ? 'text-red-755 bg-red-50 border-red-200' 
                              : 'text-blue-755 bg-blue-50 border-blue-200'
                          }`}>
                            {att.user.company.includes('Cakrawala') ? 'Cakrawala' : 'Yasodana'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border capitalize ${
                      att.attendance_type === 'kunjungan' 
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-250' 
                        : att.attendance_type === 'client' 
                        ? 'text-amber-700 bg-amber-50 border-amber-250' 
                        : 'text-indigo-700 bg-indigo-50 border-indigo-250'
                    }`}>
                      {att.attendance_type || 'kantor'}
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                      {formatDate(att.date)}
                    </span>
                    {att.shift_start_time && att.shift_end_time && (
                      <span className="text-[9px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 mt-1 font-mono">
                        Shift: {att.shift_start_time.substring(0, 5)} - {att.shift_end_time.substring(0, 5)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body: Clock In & Clock Out Info */}
                <div className="grid grid-cols-2 gap-3 bg-orange-50/10 p-3 border border-orange-100/50 rounded-xl">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Absen Masuk</span>
                    {att.clock_in ? (
                      <div className="space-y-1">
                        <p className="font-mono text-sm font-extrabold text-slate-800">{att.clock_in}</p>
                        <div>{getStatusBadge(att.status_in)}</div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic font-semibold block">Belum masuk</span>
                    )}
                  </div>
                  <div className="space-y-1 border-l border-orange-100/50 pl-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Absen Keluar</span>
                    {att.clock_out ? (
                      <div className="space-y-1">
                        <p className="font-mono text-sm font-extrabold text-slate-800">{att.clock_out}</p>
                        <div>{getStatusBadge(att.status_out)}</div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic font-semibold block">Belum keluar</span>
                    )}
                  </div>
                </div>

                {/* GPS Location Info */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lokasi Absen</span>
                  <div className="flex items-start gap-1.5">
                    <Compass className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <span className="text-xs font-bold text-slate-700 leading-tight">
                      {getLokasiLabel(att)}
                    </span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-2 border-t border-orange-50">
                  <button
                    onClick={() => setSelectedAttendance(att)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-slate-200 hover:border-red-500 text-slate-700 hover:text-red-500 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-[0.98]"
                  >
                    <Eye className="w-4 h-4 text-slate-500" />
                    <span>Lihat Detail Absensi</span>
                  </button>
                </div>
              </div>
            ))
          )
        ) : (
          attendanceLoading ? (
            <div className="py-8 text-center text-slate-400 font-medium bg-white border border-orange-100 rounded-2xl shadow-sm">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                <span>Memuat ringkasan absensi...</span>
              </div>
            </div>
          ) : paginatedMonthlyStats.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-semibold bg-white border border-orange-100 rounded-2xl shadow-sm">
              Data karyawan tidak ditemukan.
            </div>
          ) : (
            paginatedMonthlyStats.map(({ employee, workingDays, present, late, leave, absent, presenceRate }) => {
              const employeePhotoUrl = employee.photo 
                ? (employee.photo.startsWith('http') ? employee.photo : `http://localhost:8000/storage/${employee.photo}`)
                : null;

              return (
                <div key={employee.id} className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm space-y-4 hover:border-orange-200 hover:shadow-md transition-all font-quicksand font-quicksand">
                  {/* Header: Avatar, Name, Email & Division */}
                  <div className="flex items-center gap-3">
                    {employeePhotoUrl ? (
                      <img src={employeePhotoUrl} alt={employee.name} className="w-10 h-10 rounded-full border border-slate-200 object-cover shadow-sm shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-extrabold text-sm shadow-sm shrink-0">
                        {employee.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-800 text-sm truncate">{employee.name}</h4>
                      <p className="text-[11px] text-slate-450 font-medium truncate">{employee.email}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5 items-center">
                        {employee.division && (
                          <span className="inline-flex items-center text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                            {employee.division}
                          </span>
                        )}
                        {employee.company && (
                          <span className={`inline-flex items-center text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                            employee.company.includes('Cakrawala') 
                              ? 'text-red-755 bg-red-50 border-red-200' 
                              : 'text-blue-755 bg-blue-50 border-blue-200'
                          }`}>
                            {employee.company.includes('Cakrawala') ? 'Cakrawala' : 'Yasodana'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Grid of Stats */}
                  <div className="grid grid-cols-3 gap-2 bg-orange-50/10 p-3 border border-orange-100/50 rounded-xl text-center">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Hari Kerja</span>
                      <p className="text-xs font-bold text-slate-800">{workingDays} hari</p>
                    </div>
                    <div className="space-y-1 border-l border-orange-100/50 pl-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Hadir</span>
                      <p className="text-xs font-bold text-emerald-600">{present} hari</p>
                    </div>
                    <div className="space-y-1 border-l border-orange-100/50 pl-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Terlambat</span>
                      <p className="text-xs font-bold text-rose-600">{late} hari</p>
                    </div>
                    <div className="space-y-1 pt-2 border-t border-orange-100/50">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Cuti / Izin</span>
                      <p className="text-xs font-bold text-amber-600">{leave} hari</p>
                    </div>
                    <div className="space-y-1 pt-2 border-t border-l border-orange-100/50 pl-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Alpa</span>
                      <p className="text-xs font-bold text-slate-400">{absent} hari</p>
                    </div>
                    <div className="space-y-1 pt-2 border-t border-l border-orange-100/50 pl-1 opacity-0 select-none">
                      <span className="text-[9px] block">-</span>
                      <p className="text-xs block">-</p>
                    </div>
                  </div>

                  {/* Presence Percentage Bar */}
                  <div className="space-y-1.5 pt-2 border-t border-orange-50">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Rasio Kehadiran</span>
                      <span>{presenceRate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/50">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          presenceRate >= 90 
                            ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' 
                            : presenceRate >= 75 
                            ? 'bg-gradient-to-r from-amber-400 to-amber-500' 
                            : 'bg-gradient-to-r from-red-400 to-red-500'
                        }`}
                        style={{ width: `${presenceRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )
            })
          )
        )}
      </div>

      {/* Pagination Footer */}
      {!attendanceLoading && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-orange-100 font-quicksand">
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-semibold">
            <span>
              Menampilkan <span className="font-bold text-slate-700">{startIndex + 1}</span> sampai{' '}
              <span className="font-bold text-slate-700">{Math.min(startIndex + itemsPerPage, totalItems)}</span> dari{' '}
              <span className="font-bold text-slate-700">{totalItems}</span> entri absensi
            </span>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <span>Tampilkan</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="bg-white border border-slate-200 hover:border-orange-500 rounded-lg p-1 outline-none font-bold text-slate-700 transition-all cursor-pointer font-quicksand"
              >
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span>entri</span>
            </div>
          </div>
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
      <ManualAttendanceModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        token={token}
        employees={employees}
        fetchAttendances={fetchAttendances}
        officeLatitude={officeLatitude}
        officeLongitude={officeLongitude}
      />
        </section>
      ) : activeSubTab === 'sales_visits' ? (
        <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in font-quicksand">
          <SalesVisitsLog 
            token={token} 
            formatDate={formatDate} 
            officeLatitude={officeLatitude} 
            officeLongitude={officeLongitude} 
            visitType="sales"
          />
        </section>
      ) : (
        <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in font-quicksand">
          <SalesVisitsLog 
            token={token} 
            formatDate={formatDate} 
            officeLatitude={officeLatitude} 
            officeLongitude={officeLongitude} 
            visitType="client"
          />
        </section>
      )}
    </div>
  )
}
