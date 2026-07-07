import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { Search, RefreshCw, Loader2, Eye, Clock, Calendar, FileDown, Compass, SlidersHorizontal } from 'lucide-react'
import ManualAttendanceModal from './ManualAttendanceModal'
import SalesVisitsLog from './SalesVisitsLog'
import { API_BASE_URL } from '../../../utils/api'

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

interface Leave {
  id: number
  user_id: number
  status: string
  start_date: string
  end_date: string
  category?: string
  custom_category?: string
  reason?: string
  user?: {
    id: number
    name: string
    email: string
    company?: string
  }
}

interface Permit {
  id: number
  user_id: number
  status: string
  start_date: string
  end_date: string
  category?: string
  custom_category?: string
  reason?: string
  user?: {
    id: number
    name: string
    email: string
    company?: string
  }
}

interface SalesVisit {
  id: number
  date: string
  visit_type?: string
  client_name?: string
  notes?: string | null
  notes_out?: string | null
  visit_time?: string | null
  visit_time_out?: string | null
  user: {
    id: number
    name: string
    email: string
    company?: string
  }
}

interface RekapAbsensiProps {
  token: string
  employees: Employee[]
  attendanceLoading: boolean
  attendances: Attendance[]
  fetchAttendances: () => void
  fetchLeaves?: () => void
  fetchPermits?: () => void
  formatDate: (d: string) => string
  getStatusBadge: (s: string | null) => React.ReactNode
  setSelectedAttendance: (a: Attendance) => void
  officeLatitude?: string
  officeLongitude?: string
  leaves?: Leave[]
  permits?: Permit[]
}

export default function RekapAbsensi({
  token,
  employees,
  attendanceLoading,
  attendances,
  fetchAttendances,
  fetchLeaves,
  fetchPermits,
  formatDate,
  getStatusBadge,
  setSelectedAttendance,
  officeLatitude = '-6.2088',
  officeLongitude = '106.8456',
  leaves = [],
  permits = [],
}: RekapAbsensiProps) {
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'sales_visits' | 'client_visits'>('attendance')
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily')

  const [salesVisits, setSalesVisits] = useState<SalesVisit[]>([])

  const fetchSalesVisits = useCallback(async () => {
    try {
      const baseUrl = API_BASE_URL || 'http://localhost:8000'
      const response = await axios.get(`${baseUrl}/api/admin/sales-visits`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setSalesVisits(response.data.data)
      }
    } catch (err) {
      console.error('Gagal mengambil data kunjungan sales:', err)
    }
  }, [token])

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
      // Exclude today if employee hasn't clocked in yet and doesn't have an approved leave/permit today
      const todayStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(todayDate).padStart(2, '0')}`
      const hasCheckedInToday = attendances.some(
        (att) => Number(att.user.id) === Number(emp.id) && att.date === todayStr && att.clock_in !== null
      )
      const hasLeaveOrPermitToday = [...leaves, ...permits].some(
        (lp) => Number(lp.user_id) === Number(emp.id) && lp.status === 'approved' && todayStr >= lp.start_date && todayStr <= lp.end_date
      )

      if (!hasCheckedInToday && !hasLeaveOrPermitToday) {
        endDay = todayDate - 1
      } else {
        endDay = todayDate
      }
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
        (att) => Number(att.user.id) === Number(emp.id) && att.date.startsWith(reportMonth)
      )

      // Present: unique dates where clock_in is not null
      const presentCount = userMonthAtt.filter((att) => att.clock_in !== null).length

      // Late: status_in === 'late'
      const lateCount = userMonthAtt.filter((att) => att.status_in === 'late').length

      // 2. Filter user approved leaves for this month
      const userLeaves = leaves.filter(
        (l) => Number(l.user_id) === Number(emp.id) && l.status === 'approved'
      )

      // Filter user approved permits for this month
      const userPermits = permits.filter(
        (p) => Number(p.user_id) === Number(emp.id) && p.status === 'approved'
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
            // Check if dateStr is within any of the user permits range
            const isOnPermit = userPermits.some(
              (p) => dateStr >= p.start_date && dateStr <= p.end_date
            )
            if (isOnLeave || isOnPermit) {
              leaveDaysCount++
            }
          }
        }
      }

      // Absent: workingDays - presentCount - leaveDaysCount (clamp to 0)
      const absentCount = Math.max(0, workingDays - presentCount - leaveDaysCount)

      const salesCount = salesVisits.filter(
        (v) => Number(v.user.id) === Number(emp.id) && v.date.startsWith(reportMonth) && (v.visit_type || 'sales') === 'sales'
      ).length

      const clientCount = salesVisits.filter(
        (v) => Number(v.user.id) === Number(emp.id) && v.date.startsWith(reportMonth) && (v.visit_type || 'sales') === 'client'
      ).length

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
        salesCount,
        clientCount,
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
    const timer = setTimeout(() => {
      setCurrentPage(1)
    }, 0)
    return () => clearTimeout(timer)
  }, [search, selectedCompany, reportMonth, startDate, endDate, statusIn, statusOut, itemsPerPage])

  // Fetch leaves, permits & sales visits on mount to ensure we have fresh data
  useEffect(() => {
    if (fetchLeaves) fetchLeaves()
    if (fetchPermits) fetchPermits()
    fetchSalesVisits()
  }, [fetchLeaves, fetchPermits, fetchSalesVisits])

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

    const getIndonesianMonthName = (monthNum: number) => {
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      return months[monthNum];
    }

    const indonesianMonthName = getIndonesianMonthName(currentMonthNum)

    let title: string
    let subtitle: string
    let contentHtml: string

    if (viewMode === 'monthly') {
      title = 'Laporan Ringkasan Absensi Bulanan Karyawan'
      subtitle = `Bulan: ${indonesianMonthName} ${currentYear} | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
      
      contentHtml = `
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">No</th>
                <th>Nama Karyawan</th>
                <th>Nomor Induk</th>
                <th>Divisi</th>
                <th>Perusahaan</th>
                <th style="text-align: center;">Hari Kerja</th>
                <th style="text-align: center;">Hadir</th>
                <th style="text-align: center;">Terlambat</th>
                <th style="text-align: center;">Cuti / Izin</th>
                <th style="text-align: center;">Alpa</th>
                <th style="text-align: center;">Kunjungan Sales</th>
                <th style="text-align: center;">Kunjungan Klien</th>
                <th style="text-align: center;">Rasio Kehadiran</th>
              </tr>
            </thead>
            <tbody>
              ${filteredMonthlyStats.length === 0 ? `
                <tr>
                  <td colSpan="13" style="text-align: center; padding: 20px; color: #64748b;">
                    Tidak ada data ringkasan absensi karyawan.
                  </td>
                </tr>
              ` : filteredMonthlyStats.map(({ employee, workingDays, present, late, leave, absent, salesCount, clientCount, presenceRate }, idx) => `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td><strong>${employee.name}</strong><br/><span style="color: #64748b; font-size: 8.5px;">${employee.email}</span></td>
                  <td>${employee.employee_number || '-'}</td>
                  <td>${employee.division || '-'}</td>
                  <td>${employee.company || '-'}</td>
                  <td style="text-align: center; font-weight: bold;">${workingDays} hari</td>
                  <td style="text-align: center; color: #047857; font-weight: bold;">${present} hari</td>
                  <td style="text-align: center; color: #b91c1c; font-weight: bold;">${late} hari</td>
                  <td style="text-align: center; color: #b45309; font-weight: bold;">${leave} hari</td>
                  <td style="text-align: center; color: #64748b; font-weight: bold;">${absent} hari</td>
                  <td style="text-align: center; color: #2563eb; font-weight: bold;">${salesCount || 0} kali</td>
                  <td style="text-align: center; color: #7c3aed; font-weight: bold;">${clientCount || 0} kali</td>
                  <td style="text-align: center; font-weight: bold; color: ${presenceRate >= 90 ? '#047857' : presenceRate >= 75 ? '#b45309' : '#b91c1c'}">${presenceRate}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
      `
    } else {
      title = 'Laporan Rekap Absensi Karyawan'
      
      let dateRangeStr: string
      if (startDate && endDate) {
        dateRangeStr = `${formatDate(startDate)} s/d ${formatDate(endDate)}`
      } else if (startDate) {
        dateRangeStr = `Sejak ${formatDate(startDate)}`
      } else if (endDate) {
        dateRangeStr = `Hingga ${formatDate(endDate)}`
      } else {
        dateRangeStr = `Bulan ${indonesianMonthName} ${currentYear}`
      }
      subtitle = `Periode: ${dateRangeStr} | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`

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

      // Calculations for Totals in PDF (based on filtered data)
      const pdfCountType = (type: string | null) => {
        return filteredAttendances.filter(att => {
          if (type === 'kantor') {
            return !att.attendance_type || att.attendance_type === 'kantor'
          }
          return att.attendance_type === type
        }).length
      }

      const pdfCountStatusIn = (status: string) => {
        return filteredAttendances.filter(att => att.status_in === status).length
      }

      const pdfCountStatusOut = (status: string) => {
        return filteredAttendances.filter(att => att.status_out === status).length
      }

      contentHtml = `
          <div class="totals" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
            <div class="totals-card">
              <div class="label">Total Kehadiran</div>
              <div class="count">${filteredAttendances.length}</div>
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
              ${filteredAttendances.length === 0 ? `
                <tr>
                  <td colSpan="9" style="text-align: center; padding: 20px; color: #64748b;">
                    Tidak ada data absensi untuk periode ini.
                  </td>
                </tr>
              ` : filteredAttendances.map((att, idx) => `
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
      `
    }

    const htmlContent = `
      <html>
        <head>
          <title>${title} - ${indonesianMonthName} ${currentYear}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #334155; padding: 25px; line-height: 1.5; }
            h1 { text-align: center; color: #1e293b; margin-bottom: 5px; font-size: 20px; font-weight: 800; }
            h3 { text-align: center; color: #64748b; font-weight: 600; font-size: 12px; margin-top: 0; margin-bottom: 25px; }
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
          <h1>${title}</h1>
          <h3>${subtitle}</h3>
          
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

          ${contentHtml}

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

  // Export to Excel merged sheet
  const handleExportExcel = async () => {
    const activeMonth = reportMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const [year, month] = activeMonth.split('-')

    const getIndonesianMonthName = (monthNum: number) => {
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
      return months[monthNum]
    }
    const indonesianMonthName = getIndonesianMonthName(parseInt(month, 10) - 1)

    // Dynamic dates depending on viewMode
    const activeStartDate = viewMode === 'monthly' ? '' : startDate
    const activeEndDate = viewMode === 'monthly' ? '' : endDate

    console.log("DEBUG EXPORT: reportMonth =", reportMonth);
    console.log("DEBUG EXPORT: activeStartDate =", activeStartDate);
    console.log("DEBUG EXPORT: activeEndDate =", activeEndDate);
    console.log("DEBUG EXPORT: permits prop =", permits);
    console.log("DEBUG EXPORT: leaves prop =", leaves);

    // ── Helpers ──────────────────────────────────────────────────────────────
    const escXml = (s: string | null | undefined) =>
      (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

    const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const getDayName = (dateStr: string) => DAYS_ID[new Date(dateStr + 'T00:00:00').getDay()]

    const getKeteranganLocal = (att: Attendance) => {
      if (!att.clock_in) return 'Tidak Hadir'
      if (att.status_in === 'late') return 'Terlambat'
      if (att.status_in === 'early') return 'Hadir Lebih Awal'
      return 'Masuk Kerja'
    }

    const isDateInFilter = (dateStr: string) => {
      return (!activeStartDate || dateStr >= activeStartDate) &&
             (!activeEndDate || dateStr <= activeEndDate) &&
             (!reportMonth || dateStr.startsWith(reportMonth))
    }

    const getDatesInRange = (startDateStr: string, endDateStr: string) => {
      const dates = []
      const start = new Date(startDateStr + 'T00:00:00')
      const end = new Date(endDateStr + 'T00:00:00')
      const current = new Date(start)
      while (current <= end) {
        const year = current.getFullYear()
        const month = String(current.getMonth() + 1).padStart(2, '0')
        const day = String(current.getDate()).padStart(2, '0')
        dates.push(`${year}-${month}-${day}`)
        current.setDate(current.getDate() + 1)
      }
      return dates
    }


    // Helper to sanitize Excel Sheet names to avoid illegal characters and duplicate clashing
    const sanitizeSheetName = (name: string, index: number, usedNames: Set<string>) => {
      let cleanName = name.replace(new RegExp('[\\\\/\\?\\*\\[\\]]', 'g'), '').trim()
      cleanName = cleanName.substring(0, 26).toUpperCase()
      if (!cleanName) cleanName = `EMPLOYEE_${index}`
      
      let finalName = cleanName
      let suffix = 1
      while (usedNames.has(finalName)) {
        const suffixStr = ` - ${suffix}`
        finalName = cleanName.substring(0, 31 - suffixStr.length) + suffixStr
        suffix++
      }
      usedNames.add(finalName)
      return finalName
    }

    // ── Fetch Sales & Client Visits from API ─────────────────────────────────
    Swal.fire({
      title: 'Memproses...',
      text: 'Sedang mengambil data kunjungan sales/klien...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      }
    })

    const baseUrl = API_BASE_URL || 'http://localhost:8000'
    let visits: SalesVisit[] = []
    try {
      const response = await axios.get(`${baseUrl}/api/admin/sales-visits`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        visits = response.data.data
      }
    } catch (err) {
      console.error('Gagal mengambil data kunjungan sales/klien:', err)
      Swal.fire({
        title: 'Gagal',
        text: 'Tidak dapat mengambil data kunjungan sales/klien.',
        icon: 'error',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#ef4444'
      })
      return
    }

    // ── Define Row Type and Collect Data ─────────────────────────────────────
    interface ExportRow {
      employeeId: number
      date: string
      dayName: string
      employeeName: string
      employeeNumber: string
      division: string
      company: string
      type: 'Kantor' | 'Sales' | 'Klien' | 'Cuti' | 'Izin'
      timeIn: string
      timeOut: string
      locationDetail: string
      notes: string
      styleId: string
      statusIn?: string
      statusOut?: string
    }

    const activeStatusIn = viewMode === 'daily' ? statusIn : 'all'
    const activeStatusOut = viewMode === 'daily' ? statusOut : 'all'

    // 1. Office Attendance
    const officeData: ExportRow[] = attendances
      .filter((att) => {
        if (att.attendance_type && att.attendance_type !== 'kantor') {
          return false
        }

        const matchesSearch = !search ||
          att.user.name.toLowerCase().includes(search.toLowerCase()) ||
          att.user.email.toLowerCase().includes(search.toLowerCase())

        const matchesDate = isDateInFilter(att.date)
        const matchesCompany = selectedCompany === 'all' || att.user.company === selectedCompany
        const matchesStatusIn = activeStatusIn === 'all' || att.status_in === activeStatusIn
        const matchesStatusOut = activeStatusOut === 'all' || att.status_out === activeStatusOut

        return matchesSearch && matchesDate && matchesCompany && matchesStatusIn && matchesStatusOut
      })
      .map((att) => {
        const emp = employees.find(e => Number(e.id) === Number(att.user.id))
        
        let notesText = getKeteranganLocal(att)
        if (att.notes_in) notesText += ` (Masuk: ${att.notes_in})`
        if (att.notes_out) notesText += ` (Keluar: ${att.notes_out})`

        let styleId = 'sNormal'
        if (!att.clock_in) {
          styleId = 'sAbsent'
        } else if (att.status_in === 'late') {
          styleId = 'sLate'
        }

        return {
          employeeId: att.user.id,
          date: att.date,
          dayName: getDayName(att.date),
          employeeName: att.user.name,
          employeeNumber: att.user.employee_number || emp?.employee_number || '-',
          division: att.user.division || emp?.division || '-',
          company: att.user.company || emp?.company || '-',
          type: 'Kantor',
          timeIn: att.clock_in || '-',
          timeOut: att.clock_out || '-',
          locationDetail: getLokasiLabel(att),
          notes: notesText,
          styleId,
          statusIn: att.status_in || undefined,
          statusOut: att.status_out || undefined
        }
      })

    // 2 & 3. Sales & Client Visits
    const salesData: ExportRow[] = []
    const clientData: ExportRow[] = []

    visits.forEach(v => {
      const type = (v.visit_type || 'sales') === 'client' ? 'Klien' : 'Sales'
      const emp = employees.find(e => Number(e.id) === Number(v.user.id))
      
      const matchesSearch = !search ||
        v.user.name.toLowerCase().includes(search.toLowerCase()) ||
        v.user.email.toLowerCase().includes(search.toLowerCase()) ||
        (v.client_name && v.client_name.toLowerCase().includes(search.toLowerCase()))

      const matchesDate = isDateInFilter(v.date)
      const matchesCompany = selectedCompany === 'all' || v.user.company === selectedCompany || emp?.company === selectedCompany

      if (!matchesSearch || !matchesDate || !matchesCompany) return

      const notesText = (v.notes ? `Masuk: ${v.notes}` : '') + (v.notes_out ? ` | Keluar: ${v.notes_out}` : '') || '-'

      const mappedVisit: ExportRow = {
        employeeId: v.user.id,
        date: v.date,
        dayName: getDayName(v.date),
        employeeName: v.user.name,
        employeeNumber: emp?.employee_number || '-',
        division: emp?.division || '-',
        company: v.user.company || emp?.company || '-',
        type: type,
        timeIn: v.visit_time || '-',
        timeOut: v.visit_time_out || '-',
        locationDetail: v.client_name || '-',
        notes: notesText,
        styleId: type === 'Klien' ? 'sClient' : 'sSales'
      }

      if (type === 'Klien') {
        clientData.push(mappedVisit)
      } else {
        salesData.push(mappedVisit)
      }
    })

    // 4. Cuti (Leaves)
    const leavesData: ExportRow[] = []
    leaves.forEach(l => {
      if (l.status !== 'approved') return

      const userId = l.user_id || l.user?.id
      const emp = employees.find(e => Number(e.id) === Number(userId))
      if (!emp) return

      const matchesSearch = !search ||
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase())
      
      const matchesCompany = selectedCompany === 'all' || emp.company === selectedCompany
      if (!matchesSearch || !matchesCompany) return

      const dates = getDatesInRange(l.start_date, l.end_date)
      dates.forEach(dateStr => {
        if (!isDateInFilter(dateStr)) return

        // Skip weekend cuti/izin to avoid double counting weekends in calculations
        const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay()
        const isSatOff = !!emp.saturday_off
        const isSunOff = emp.sunday_off !== false
        let isOff = false
        if (dayOfWeek === 0 && isSunOff) {
          isOff = true
        } else if (dayOfWeek === 6 && isSatOff) {
          isOff = true
        }

        if (isOff) return // Exclude weekend leaves

        leavesData.push({
          employeeId: emp.id,
          date: dateStr,
          dayName: getDayName(dateStr),
          employeeName: emp.name,
          employeeNumber: emp.employee_number || '-',
          division: emp.division || '-',
          company: emp.company || '-',
          type: 'Cuti',
          timeIn: '-',
          timeOut: '-',
          locationDetail: l.category === 'LAINNYA' ? l.custom_category || 'Lainnya' : l.category || '-',
          notes: l.reason || '-',
          styleId: 'sLeave'
        })
      })
    })

    // 5. Izin (Permits)
    const permitsData: ExportRow[] = []
    permits.forEach(p => {
      if (p.status !== 'approved') return

      const userId = p.user_id || p.user?.id
      const emp = employees.find(e => Number(e.id) === Number(userId))
      if (!emp) return

      const matchesSearch = !search ||
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase())
      
      const matchesCompany = selectedCompany === 'all' || emp.company === selectedCompany
      if (!matchesSearch || !matchesCompany) return

      const dates = getDatesInRange(p.start_date, p.end_date)
      dates.forEach(dateStr => {
        if (!isDateInFilter(dateStr)) return

        // Skip weekend cuti/izin to avoid double counting weekends in calculations
        const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay()
        const isSatOff = !!emp.saturday_off
        const isSunOff = emp.sunday_off !== false
        let isOff = false
        if (dayOfWeek === 0 && isSunOff) {
          isOff = true
        } else if (dayOfWeek === 6 && isSatOff) {
          isOff = true
        }

        if (isOff) return // Exclude weekend permits

        permitsData.push({
          employeeId: emp.id,
          date: dateStr,
          dayName: getDayName(dateStr),
          employeeName: emp.name,
          employeeNumber: emp.employee_number || '-',
          division: emp.division || '-',
          company: emp.company || '-',
          type: 'Izin',
          timeIn: '-',
          timeOut: '-',
          locationDetail: p.category === 'LAINNYA' ? p.custom_category || 'Lainnya' : p.category || '-',
          notes: p.reason || '-',
          styleId: 'sLeave'
        })
      })
    })

    // Combine and Sort
    const mergedRows: ExportRow[] = [
      ...officeData,
      ...salesData,
      ...clientData,
      ...leavesData,
      ...permitsData
    ]

    mergedRows.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date)
      if (dateCompare !== 0) return dateCompare
      return a.employeeName.localeCompare(b.employeeName)
    })

    // Group records by employee, pre-populating with ALL employees to ensure zero activity employees are included
    const empMap = new Map<number, { employee: Employee; name: string; rows: ExportRow[] }>()
    
    // Sort employees by name to ensure consistent order
    const sortedEmployees = [...employees].sort((a, b) => a.name.localeCompare(b.name))
    
    // Initialize all active employees in map
    sortedEmployees.forEach(emp => {
      // Filter mapping by search query and company filter
      const matchesSearch = !search ||
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase())
      
      const matchesCompany = selectedCompany === 'all' || emp.company === selectedCompany

      if (matchesSearch && matchesCompany) {
        empMap.set(emp.id, { employee: emp, name: emp.name, rows: [] })
      }
    })

    // Populate rows
    mergedRows.forEach(row => {
      const uid = row.employeeId
      if (empMap.has(uid)) {
        empMap.get(uid)!.rows.push(row)
      }
    })

    Swal.close()

    // Helper to calculate working days count for the filtered range
    const getFilteredWorkingDays = (emp: Employee) => {
      const lastDayOfMonth = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate()
      
      let startStr = `${activeMonth}-01`
      let endStr = `${activeMonth}-${String(lastDayOfMonth).padStart(2, '0')}`

      if (activeStartDate && activeStartDate > startStr) {
        startStr = activeStartDate
      }
      if (activeEndDate && activeEndDate < endStr) {
        endStr = activeEndDate
      }

      if (emp.join_date && emp.join_date > startStr) {
        startStr = emp.join_date
      }

      const now = new Date()
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      
      if (activeMonth === todayStr.substring(0, 7) && endStr >= todayStr) {
        const empRows = empMap.get(emp.id)?.rows || []
        const hasActivityToday = empRows.some(
          (r) => r.date === todayStr && (r.type === 'Kantor' || r.type === 'Sales' || r.type === 'Klien') && r.timeIn !== '-'
        )
        const hasLeaveOrPermitToday = [...leaves, ...permits].some(
          (lp) => Number(lp.user_id) === Number(emp.id) && lp.status === 'approved' && todayStr >= lp.start_date && todayStr <= lp.end_date
        )

        if (!hasActivityToday && !hasLeaveOrPermitToday) {
          const yesterday = new Date(now)
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
          if (endStr > yesterdayStr) {
            endStr = yesterdayStr
          }
        } else {
          if (endStr > todayStr) {
            endStr = todayStr
          }
        }
      }

      if (startStr > endStr) return 0

      let workingDays = 0
      const isSatOff = !!emp.saturday_off
      const isSunOff = emp.sunday_off !== false

      const start = new Date(startStr + 'T00:00:00')
      const end = new Date(endStr + 'T00:00:00')
      const current = new Date(start)
      
      while (current <= end) {
        const dayOfWeek = current.getDay()
        let isOff = false
        if (dayOfWeek === 0 && isSunOff) {
          isOff = true
        } else if (dayOfWeek === 6 && isSatOff) {
          isOff = true
        }

        if (!isOff) {
          workingDays++
        }
        current.setDate(current.getDate() + 1)
      }
      return workingDays
    }

    // ── Build XML Worksheet ──────────────────────────────────────────────────
    const COL_WIDTHS = [35, 90, 80, 145, 90, 100, 180, 80, 90, 90, 220, 220]
    const HEADERS = [
      'No', 'Tanggal', 'Hari', 'Nama Karyawan', 'Nomor Induk', 'Divisi',
      'Perusahaan', 'Tipe', 'Jam Masuk', 'Jam Keluar', 'Lokasi / Detail', 'Keterangan'
    ]

    const buildRowXML = (row: ExportRow, idx: number) => {
      const cell = (val: string, type: 'String' | 'Number' = 'String') =>
        `<Cell ss:StyleID="${row.styleId}"><Data ss:Type="${type}">${escXml(val)}</Data></Cell>`

      return `<Row ss:Height="20">
        ${cell(String(idx + 1), 'Number')}
        ${cell(row.date)}
        ${cell(row.dayName)}
        ${cell(row.employeeName)}
        ${cell(row.employeeNumber)}
        ${cell(row.division)}
        ${cell(row.company)}
        ${cell(row.type)}
        ${cell(row.timeIn)}
        ${cell(row.timeOut)}
        ${cell(row.locationDetail)}
        ${cell(row.notes)}
      </Row>`
    }

    const buildWorksheetXML = (sheetName: string, rows: ExportRow[], employee?: Employee) => {
      let summaryRowsXML = ''
      if (employee) {
        const workingDays = getFilteredWorkingDays(employee)
        
        // Count unique dates present to avoid double-counting presence on multiple visits/checkins
        const presentDates = new Set(
          rows
            .filter(r => (r.type === 'Kantor' || r.type === 'Sales' || r.type === 'Klien') && r.timeIn !== '-')
            .map(r => r.date)
        )
        const presentCount = presentDates.size

        const lateCount = rows.filter(r => r.statusIn === 'late').length
        const overtimeCount = rows.filter(r => r.statusOut === 'overtime').length
        const earlyDepartureCount = rows.filter(r => r.statusOut === 'early_departure').length
        const sickCount = rows.filter(r => 
          (r.type === 'Cuti' || r.type === 'Izin') && 
          r.locationDetail.toLowerCase().includes('sakit')
        ).length
        const cutiCount = rows.filter(r => 
          r.type === 'Cuti' && 
          !r.locationDetail.toLowerCase().includes('sakit')
        ).length
        const izinCount = rows.filter(r => 
          r.type === 'Izin' && 
          !r.locationDetail.toLowerCase().includes('sakit')
        ).length

        const totalLeavePermit = sickCount + cutiCount + izinCount
        const absentCount = Math.max(0, workingDays - presentCount - totalLeavePermit)

        const salesCount = rows.filter(r => r.type === 'Sales').length
        const clientCount = rows.filter(r => r.type === 'Klien').length

        summaryRowsXML = `
        <Row ss:Height="15"></Row>
        <Row ss:Height="22">
          <Cell ss:StyleID="sSummaryHeader" ss:MergeAcross="10"><Data ss:Type="String">TOTAL KESELURUHAN (SUMMARY)</Data></Cell>
        </Row>
        <Row ss:Height="20">
          <Cell ss:StyleID="sSummaryCol"><Data ss:Type="String">Hari Kerja</Data></Cell>
          <Cell ss:StyleID="sSummaryCol"><Data ss:Type="String">Hadir</Data></Cell>
          <Cell ss:StyleID="sSummaryCol"><Data ss:Type="String">Kunjungan Sales</Data></Cell>
          <Cell ss:StyleID="sSummaryCol"><Data ss:Type="String">Kunjungan Klien</Data></Cell>
          <Cell ss:StyleID="sSummaryCol"><Data ss:Type="String">Terlambat</Data></Cell>
          <Cell ss:StyleID="sSummaryCol"><Data ss:Type="String">Lembur</Data></Cell>
          <Cell ss:StyleID="sSummaryCol"><Data ss:Type="String">Pulang Cepat</Data></Cell>
          <Cell ss:StyleID="sSummaryCol"><Data ss:Type="String">Izin (Non-Sakit)</Data></Cell>
          <Cell ss:StyleID="sSummaryCol"><Data ss:Type="String">Cuti (Non-Sakit)</Data></Cell>
          <Cell ss:StyleID="sSummaryCol"><Data ss:Type="String">Sakit</Data></Cell>
          <Cell ss:StyleID="sSummaryCol"><Data ss:Type="String">Alpa</Data></Cell>
        </Row>
        <Row ss:Height="20">
          <Cell ss:StyleID="sSummaryVal"><Data ss:Type="Number">${workingDays}</Data></Cell>
          <Cell ss:StyleID="sSummaryValGreen"><Data ss:Type="Number">${presentCount}</Data></Cell>
          <Cell ss:StyleID="sSummaryVal"><Data ss:Type="Number">${salesCount}</Data></Cell>
          <Cell ss:StyleID="sSummaryVal"><Data ss:Type="Number">${clientCount}</Data></Cell>
          <Cell ss:StyleID="sSummaryValOrange"><Data ss:Type="Number">${lateCount}</Data></Cell>
          <Cell ss:StyleID="sSummaryValYellow"><Data ss:Type="Number">${overtimeCount}</Data></Cell>
          <Cell ss:StyleID="sSummaryValRed"><Data ss:Type="Number">${earlyDepartureCount}</Data></Cell>
          <Cell ss:StyleID="sSummaryVal"><Data ss:Type="Number">${izinCount}</Data></Cell>
          <Cell ss:StyleID="sSummaryVal"><Data ss:Type="Number">${cutiCount}</Data></Cell>
          <Cell ss:StyleID="sSummaryValYellow"><Data ss:Type="Number">${sickCount}</Data></Cell>
          <Cell ss:StyleID="sSummaryValRed"><Data ss:Type="Number">${absentCount}</Data></Cell>
        </Row>`
      }

      return `
      <Worksheet ss:Name="${escXml(sheetName)}">
        <Table>
          ${COL_WIDTHS.map(w => `<Column ss:Width="${w}"/>`).join('')}
          <Row ss:Height="28">
            ${HEADERS.map(h => `<Cell ss:StyleID="sHeader"><Data ss:Type="String">${escXml(h)}</Data></Cell>`).join('')}
          </Row>
          ${rows.map((row, idx) => buildRowXML(row, idx)).join('\n')}
          ${summaryRowsXML}
        </Table>
        <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
          <FreezePanes/>
          <FrozenNoSplit/>
          <SplitHorizontal>1</SplitHorizontal>
          <TopRowBottomPane>1</TopRowBottomPane>
        </WorksheetOptions>
      </Worksheet>`
    }

    const buildSummarySheetXML = () => {
      const COL_WIDTHS_SUM = [35, 160, 100, 100, 150, 80, 85, 80, 80, 80, 100, 100, 80, 80, 100, 100, 120]
      const HEADERS_SUM = [
        'No', 'Nama Karyawan', 'Nomor Induk', 'Divisi', 'Perusahaan',
        'Hari Kerja', 'Hadir', 'Terlambat', 'Lembur', 'Pulang Cepat',
        'Izin (Non-Sakit)', 'Cuti (Non-Sakit)', 'Sakit', 'Alpa', 'Kunjungan Sales', 'Kunjungan Klien', 'Rasio Kehadiran (%)'
      ]

      const rowsXML = Array.from(empMap.values()).map(({ employee, name, rows }, idx) => {
        const workingDays = getFilteredWorkingDays(employee)
        
        // Count unique dates present
        const presentDates = new Set(
          rows
            .filter(r => (r.type === 'Kantor' || r.type === 'Sales' || r.type === 'Klien') && r.timeIn !== '-')
            .map(r => r.date)
        )
        const presentCount = presentDates.size

        const lateCount = rows.filter(r => r.statusIn === 'late').length
        const overtimeCount = rows.filter(r => r.statusOut === 'overtime').length
        const earlyDepartureCount = rows.filter(r => r.statusOut === 'early_departure').length
        const sickCount = rows.filter(r => 
          (r.type === 'Cuti' || r.type === 'Izin') && 
          r.locationDetail.toLowerCase().includes('sakit')
        ).length
        const cutiCount = rows.filter(r => 
          r.type === 'Cuti' && 
          !r.locationDetail.toLowerCase().includes('sakit')
        ).length
        const izinCount = rows.filter(r => 
          r.type === 'Izin' && 
          !r.locationDetail.toLowerCase().includes('sakit')
        ).length

        const totalLeavePermit = sickCount + cutiCount + izinCount
        const absentCount = Math.max(0, workingDays - presentCount - totalLeavePermit)
        const salesCount = rows.filter(r => r.type === 'Sales').length
        const clientCount = rows.filter(r => r.type === 'Klien').length
        const presenceRate = workingDays > 0 
          ? Math.min(100, Math.round((presentCount / workingDays) * 100))
          : 0

        const cell = (val: string, type: 'String' | 'Number' = 'String', style: string = 'sSummaryVal') =>
          `<Cell ss:StyleID="${style}"><Data ss:Type="${type}">${escXml(val)}</Data></Cell>`

        return `<Row ss:Height="20">
          ${cell(String(idx + 1), 'Number', 'sSummaryVal')}
          <Cell ss:StyleID="sNormal"><Data ss:Type="String">${escXml(name)}</Data></Cell>
          <Cell ss:StyleID="sNormal"><Data ss:Type="String">${escXml(employee.employee_number || '-')}</Data></Cell>
          <Cell ss:StyleID="sNormal"><Data ss:Type="String">${escXml(employee.division || '-')}</Data></Cell>
          <Cell ss:StyleID="sNormal"><Data ss:Type="String">${escXml(employee.company || '-')}</Data></Cell>
          ${cell(String(workingDays), 'Number', 'sSummaryVal')}
          ${cell(String(presentCount), 'Number', 'sSummaryValGreen')}
          ${cell(String(lateCount), 'Number', 'sSummaryValOrange')}
          ${cell(String(overtimeCount), 'Number', 'sSummaryValYellow')}
          ${cell(String(earlyDepartureCount), 'Number', 'sSummaryValRed')}
          ${cell(String(izinCount), 'Number', 'sSummaryVal')}
          ${cell(String(cutiCount), 'Number', 'sSummaryVal')}
          ${cell(String(sickCount), 'Number', 'sSummaryValYellow')}
          ${cell(String(absentCount), 'Number', 'sSummaryValRed')}
          ${cell(String(salesCount), 'Number', 'sSummaryVal')}
          ${cell(String(clientCount), 'Number', 'sSummaryVal')}
          ${cell(String(presenceRate) + '%', 'String', presenceRate >= 90 ? 'sSummaryValGreen' : presenceRate >= 75 ? 'sSummaryValYellow' : 'sSummaryValRed')}
        </Row>`
      }).join('\n')

      return `
      <Worksheet ss:Name="RINGKASAN BULANAN">
        <Table>
          ${COL_WIDTHS_SUM.map(w => `<Column ss:Width="${w}"/>`).join('')}
          <Row ss:Height="28">
            ${HEADERS_SUM.map(h => `<Cell ss:StyleID="sHeader"><Data ss:Type="String">${escXml(h)}</Data></Cell>`).join('')}
          </Row>
          ${rowsXML}
        </Table>
        <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
          <FreezePanes/>
          <FrozenNoSplit/>
          <SplitHorizontal>1</SplitHorizontal>
          <TopRowBottomPane>1</TopRowBottomPane>
        </WorksheetOptions>
      </Worksheet>`
    }

    const worksheetsXML: string[] = []
    worksheetsXML.push(buildWorksheetXML('REKAP ABSENSI GABUNGAN', mergedRows))
    worksheetsXML.push(buildSummarySheetXML())

    const usedSheetNames = new Set<string>()
    usedSheetNames.add('REKAP ABSENSI GABUNGAN')
    usedSheetNames.add('RINGKASAN BULANAN')

    empMap.forEach(({ employee, name, rows }) => {
      const sortedRows = [...rows].sort((a, b) => a.date.localeCompare(b.date))
      const safeSheetName = sanitizeSheetName(name, employee.id, usedSheetNames)
      worksheetsXML.push(buildWorksheetXML(safeSheetName, sortedRows, employee))
    })

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
      <Interior ss:Color="#1E3A8A" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1E40AF"/>
        <Border ss:Position="Left"   ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1E40AF"/>
        <Border ss:Position="Right"  ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1E40AF"/>
        <Border ss:Position="Top"    ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1E40AF"/>
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
    <Style ss:ID="sSales">
      <Alignment ss:Vertical="Center"/>
      <Font ss:Size="9"/>
      <Interior ss:Color="#E0F2FE" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Left"   ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Right"  ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Top"    ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
      </Borders>
    </Style>
    <Style ss:ID="sClient">
      <Alignment ss:Vertical="Center"/>
      <Font ss:Size="9"/>
      <Interior ss:Color="#F3E8FF" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Left"   ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Right"  ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Top"    ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
      </Borders>
    </Style>
    <Style ss:ID="sLeave">
      <Alignment ss:Vertical="Center"/>
      <Font ss:Size="9"/>
      <Interior ss:Color="#FEF9C3" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Left"   ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Right"  ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
        <Border ss:Position="Top"    ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
      </Borders>
    </Style>
    <Style ss:ID="sSummaryHeader">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="10"/>
      <Interior ss:Color="#334155" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#475569"/>
        <Border ss:Position="Left"   ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#475569"/>
        <Border ss:Position="Right"  ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#475569"/>
        <Border ss:Position="Top"    ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#475569"/>
      </Borders>
    </Style>
    <Style ss:ID="sSummaryCol">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Font ss:Bold="1" ss:Size="9" ss:Color="#1E293B"/>
      <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Left"   ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Right"  ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Top"    ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
      </Borders>
    </Style>
    <Style ss:ID="sSummaryVal">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Font ss:Size="9"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Left"   ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Right"  ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Top"    ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
      </Borders>
    </Style>
    <Style ss:ID="sSummaryValGreen">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Font ss:Bold="1" ss:Size="9" ss:Color="#15803D"/>
      <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Left"   ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Right"  ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Top"    ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
      </Borders>
    </Style>
    <Style ss:ID="sSummaryValOrange">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Font ss:Bold="1" ss:Size="9" ss:Color="#C2410C"/>
      <Interior ss:Color="#FFEDD5" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Left"   ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Right"  ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Top"    ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
      </Borders>
    </Style>
    <Style ss:ID="sSummaryValRed">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Font ss:Bold="1" ss:Size="9" ss:Color="#B91C1C"/>
      <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Left"   ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Right"  ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Top"    ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
      </Borders>
    </Style>
    <Style ss:ID="sSummaryValYellow">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Font ss:Bold="1" ss:Size="9" ss:Color="#A16207"/>
      <Interior ss:Color="#FEF9C3" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Left"   ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Right"  ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Top"    ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
      </Borders>
    </Style>
  </Styles>

  ${worksheetsXML.join('\n')}
</Workbook>`

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href  = url
    link.download = `Rekap_Absensi_Gabungan_${indonesianMonthName.replace(/\s+/g, '_')}_${year}.xls`
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
            onClick={() => {
              fetchAttendances()
              if (fetchLeaves) fetchLeaves()
              if (fetchPermits) fetchPermits()
              fetchSalesVisits()
            }}
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
                  <th className="py-4 px-6 text-center">Kunjungan Sales</th>
                  <th className="py-4 px-6 text-center">Kunjungan Klien</th>
                  <th className="py-4 px-6">Rasio Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100 text-sm text-slate-600">
                {attendanceLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                        Memuat ringkasan absensi...
                      </div>
                    </td>
                  </tr>
                ) : paginatedMonthlyStats.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 font-semibold">
                      Data karyawan tidak ditemukan atau belum ada data.
                    </td>
                  </tr>
                ) : (
                  paginatedMonthlyStats.map(({ employee, workingDays, present, late, leave, absent, salesCount, clientCount, presenceRate }) => {
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
                              <p className="text-[11px] text-slate-450 font-medium mt-0.5">{employee.email}</p>
                              <div className="mt-1 flex flex-wrap gap-1.5 items-center">
                                {employee.division && (
                                  <span className="inline-flex items-center text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-quicksand">
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
                        <td className="py-4 px-6 text-center font-bold text-blue-600">
                          {salesCount || 0} kunjungan
                        </td>
                        <td className="py-4 px-6 text-center font-bold text-purple-650">
                          {clientCount || 0} kunjungan
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
            paginatedMonthlyStats.map(({ employee, workingDays, present, late, leave, absent, salesCount, clientCount, presenceRate }) => {
              const employeePhotoUrl = employee.photo 
                ? (employee.photo.startsWith('http') ? employee.photo : `http://localhost:8000/storage/${employee.photo}`)
                : null;

              return (
                <div key={employee.id} className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm space-y-4 hover:border-orange-200 hover:shadow-md transition-all font-quicksand">
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
                  <div className="grid grid-cols-4 gap-2 bg-orange-50/10 p-3 border border-orange-100/50 rounded-xl text-center">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-quicksand">Kerja</span>
                      <p className="text-xs font-bold text-slate-800 font-quicksand">{workingDays}h</p>
                    </div>
                    <div className="space-y-1 border-l border-orange-100/50 pl-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-quicksand">Hadir</span>
                      <p className="text-xs font-bold text-emerald-600 font-quicksand">{present}h</p>
                    </div>
                    <div className="space-y-1 border-l border-orange-100/50 pl-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-quicksand">Telat</span>
                      <p className="text-xs font-bold text-rose-600 font-quicksand">{late}h</p>
                    </div>
                    <div className="space-y-1 border-l border-orange-100/50 pl-1">
                      <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block font-quicksand">Izin</span>
                      <p className="text-xs font-bold text-amber-600 font-quicksand">{leave}h</p>
                    </div>
                    <div className="space-y-1 pt-2 border-t border-orange-100/50">
                      <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block font-quicksand">Alpa</span>
                      <p className="text-xs font-bold text-slate-400 font-quicksand">{absent}h</p>
                    </div>
                    <div className="space-y-1 pt-2 border-t border-l border-orange-100/50 pl-1">
                      <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block font-quicksand">Sales</span>
                      <p className="text-xs font-bold text-blue-600 font-quicksand">{salesCount || 0}x</p>
                    </div>
                    <div className="space-y-1 pt-2 border-t border-l border-orange-100/50 pl-1">
                      <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block font-quicksand">Klien</span>
                      <p className="text-xs font-bold text-purple-600 font-quicksand">{clientCount || 0}x</p>
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
