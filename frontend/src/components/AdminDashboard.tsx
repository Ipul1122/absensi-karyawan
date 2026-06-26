import React, { useState, useEffect, lazy, Suspense } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { 
  Routes, 
  Route, 
  Navigate, 
  useLocation 
} from 'react-router-dom'
import { 
  X,
  ChevronRight
} from 'lucide-react'

// Import layout components
import AdminSidebar from './layout/AdminSidebar'
import AdminNavbar, { AdminMobileNavbar } from './layout/AdminNavbar'

// Import sub-components (Lazy loaded for optimal code splitting & chunk sizing)
const DashboardOverview = lazy(() => import('./admin/dashboard/DashboardOverview'))
const RekapAbsensi = lazy(() => import('./admin/absensi/RekapAbsensi'))
const AbsenMandiriAdmin = lazy(() => import('./admin/absensi/AbsenMandiriAdmin'))
const AkunKaryawan = lazy(() => import('./admin/dataKaryawan/AkunKaryawan'))
const LokasiKantor = lazy(() => import('./admin/pengaturan/LokasiKantor'))
const AdminCuti = lazy(() => import('./admin/operasional/AdminCuti'))
const AdminPayroll = lazy(() => import('./admin/payroll/AdminPayroll'))
const AdminKelolaHariLibur = lazy(() => import('./admin/pengaturan/AdminKelolaHariLibur'))
const AdminSalaryConfig = lazy(() => import('./admin/payroll/AdminSalaryConfig'))
const AdminInventaris = lazy(() => import('./admin/operasional/AdminInventaris'))
const AdminReimbursement = lazy(() => import('./admin/operasional/AdminReimbursement'))
const AdminBonus = lazy(() => import('./admin/payroll/AdminBonus'))
const AdminOvertime = lazy(() => import('./admin/operasional/AdminOvertime'))

import AddEmployeeModal from './admin/dataKaryawan/AddEmployeeModal'
import EditEmployeeModal from './admin/dataKaryawan/EditEmployeeModal'
import ViewEmployeeModal from './admin/dataKaryawan/ViewEmployeeModal'
import DetailAttendanceModal from './admin/absensi/DetailAttendanceModal'
import EditTimeModal from './admin/absensi/EditTimeModal'

interface Employee {
  id: number
  name: string
  email: string
  password_plain?: string
  photo?: string | null
  employee_number?: string | null
  division?: string | null
  no_rekening?: string | null
  company?: string | null
  whatsapp?: string | null
  saturday_off?: boolean | number
  sunday_off?: boolean | number
  created_at: string
  updated_at: string
  status?: 'active' | 'pending' | 'pending_delete'
}

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
  }
}

interface AdminDashboardProps {
  user: {
    id: number
    name: string
    email: string
    role: 'admin' | 'employee'
    photo?: string | null
  }
  token: string
  onLogout: () => void
  onProfileUpdate?: (updatedFields: { name: string; email: string; photo?: string | null }) => void
}

export default function AdminDashboard({ user, token, onLogout, onProfileUpdate }: AdminDashboardProps) {
  const location = useLocation()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [sidebarCounts, setSidebarCounts] = useState({
    pendingKaryawanCount: 0,
    pendingCutiCount: 0,
    pendingLemburCount: 0,
    pendingReimburseCount: 0,
    unpaidPayrollCount: 0,
    operasionalCount: 0,
  })
  
  const [loading, setLoading] = useState(true)
  const [attendanceLoading, setAttendanceLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [time, setTime] = useState(new Date())

  // Admin's own attendance & leaves states
  const [leaves, setLeaves] = useState<any[]>([])

  const fetchProfile = async () => {
    try {
      await axios.get('http://localhost:8000/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (err) {
      console.error('Gagal mengambil data profil admin:', err)
    }
  }

  // Details Modal States
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null)

  // Edit Time Modal States
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null)
  const [editClockIn, setEditClockIn] = useState('')
  const [editClockOut, setEditClockOut] = useState('')
  const [updating, setUpdating] = useState(false)

  // Office Location Configuration States
  const [officeLatitude, setOfficeLatitude] = useState('-6.2088')
  const [officeLongitude, setOfficeLongitude] = useState('106.8456')
  const [officeRadius, setOfficeRadius] = useState(100)
  const [savingOffice, setSavingOffice] = useState(false)

  // New Employee Form States
  const [submitting, setSubmitting] = useState(false)

  // View Biodata Modal States
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewProfile, setViewProfile] = useState<any | null>(null)

  // Edit Employee Form States
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editNoRekening, setEditNoRekening] = useState('')
  const [editCompany, setEditCompany] = useState('')
  const [editWhatsapp, setEditWhatsapp] = useState('')
  const [editSaturdayOff, setEditSaturdayOff] = useState(false)
  const [editSundayOff, setEditSundayOff] = useState(true)
  const [submittingEdit, setSubmittingEdit] = useState(false)

  useEffect(() => {
    const clock = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(clock)
  }, [])

  const fetchLeaves = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/admin/leaves', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setLeaves(response.data.data)
      }
    } catch (err) {
      console.error('Gagal mengambil data cuti:', err)
    }
  }

  const fetchSidebarCounts = async () => {
    if (document.hidden) return
    try {
      const response = await axios.get('http://localhost:8000/api/sidebar/notification-counts', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setSidebarCounts(response.data.data)
      }
    } catch (err) {
      console.error('Gagal mengambil data counts sidebar:', err)
    }
  }

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:8000/api/employees', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setEmployees(response.data.data)
      }
    } catch (err: any) {
      console.error(err)
      Swal.fire({
        title: 'Gagal Memuat Karyawan',
        text: 'Tidak dapat terhubung ke server API.',
        icon: 'error',
        background: '#1e293b',
        color: '#f8fafc'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendances = async () => {
    setAttendanceLoading(true)
    try {
      const response = await axios.get('http://localhost:8000/api/admin/attendances', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setAttendances(response.data.data)
      }
    } catch (err: any) {
      console.error(err)
      Swal.fire({
        title: 'Gagal Memuat Absensi',
        text: 'Gagal memuat rekam jejak absensi karyawan.',
        icon: 'error',
        background: '#1e293b',
        color: '#f8fafc'
      })
    } finally {
      setAttendanceLoading(false)
    }
  }

  const fetchOfficeSetting = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/office-setting', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success' && response.data.data) {
        setOfficeLatitude(response.data.data.latitude)
        setOfficeLongitude(response.data.data.longitude)
        setOfficeRadius(response.data.data.radius)
      }
    } catch (err) {
      console.error('Gagal memuat lokasi kantor:', err)
    }
  }

  useEffect(() => {
    fetchEmployees()
    fetchAttendances()
    fetchOfficeSetting()
    fetchLeaves()
    fetchProfile()
  }, [])

  useEffect(() => {
    fetchSidebarCounts()
    const interval = setInterval(fetchSidebarCounts, 60000)
    return () => clearInterval(interval)
  }, [token])

  const handleLogoutClick = async () => {
    try {
      await axios.post(
        'http://localhost:8000/api/logout',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
    } catch (err) {
      console.error('API logout error', err)
    } finally {
      onLogout()
      Swal.fire({
        title: 'Logged Out',
        text: 'Anda telah keluar dari aplikasi.',
        icon: 'info',
        timer: 1500,
        showConfirmButton: false,
        background: '#1e293b',
        color: '#f8fafc'
      })
    }
  }

  const handleAddEmployee = async (formData: FormData) => {
    setSubmitting(true)
    try {
      const response = await axios.post(
        'http://localhost:8000/api/employees',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      if (response.data.status === 'success') {
        const emp = response.data.data
        let salutation = 'Halo Pak/Bu,'
        let phoneNum = ''

        // Fetch director's phone number dynamically from database
        try {
          const directorsRes = await axios.get('http://localhost:8000/api/admin/directors', {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (directorsRes.data.status === 'success' && Array.isArray(directorsRes.data.data)) {
            const directorsList = directorsRes.data.data
            const matchedDirector = directorsList.find((d: any) => d.company === emp.company)
            if (matchedDirector) {
              salutation = `Halo Pak/Bu ${matchedDirector.name},`
              if (matchedDirector.whatsapp) {
                let cleanPhone = matchedDirector.whatsapp.trim().replace(/\D/g, '')
                if (cleanPhone.startsWith('0')) {
                  cleanPhone = '62' + cleanPhone.substring(1)
                }
                phoneNum = cleanPhone
              }
            }
          }
        } catch (err) {
          console.error('Gagal mengambil data direktur dari database, menggunakan data statis.', err)
        }

        // Fallback to static numbers if no database match is found
        if (!phoneNum) {
          if (emp.company === 'PT Yasodana Parvez Internasional') {
            salutation = 'Halo Pak Andre,'
            phoneNum = '6289656931184'
          } else if (emp.company === 'PT Cakrawala Parama Internasional') {
            salutation = 'Halo Bu Dian,'
            phoneNum = '628170038421'
          }
        }

        const messageText = `${salutation} mohon persetujuan untuk pengajuan pendaftaran karyawan baru:

Nama: ${emp.name}
Email: ${emp.email}
WhatsApp: ${emp.whatsapp || '-'}
Divisi: ${emp.division || '-'}
Perusahaan: ${emp.company || '-'}

Persetujuan dapat dilakukan langsung melalui tautan berikut:
${window.location.origin}/director/karyawan`

        const encodedText = encodeURIComponent(messageText)
        const waUrl = phoneNum
          ? `https://api.whatsapp.com/send?phone=${phoneNum}&text=${encodedText}`
          : `https://api.whatsapp.com/send?text=${encodedText}`

        Swal.fire({
          title: 'Berhasil Dibuat!',
          text: 'Akun karyawan baru berhasil dibuat. Klik tombol di bawah untuk mengirim data persetujuan ke WhatsApp Direktur.',
          icon: 'success',
          // showCancelButton: true,
          confirmButtonText: 'Kirim ke WhatsApp',
          // cancelButtonText: 'Tutup',
          confirmButtonColor: '#ea580c',
          cancelButtonColor: '#64748b',
          background: '#fffdfb',
          color: '#3c1105'
        }).then((result) => {
          if (result.isConfirmed) {
            window.open(waUrl, '_blank')
          }
        })

        setShowModal(false)
        fetchEmployees()
      }
    } catch (err: any) {
      console.error(err)
      const msg =
        err.response?.data?.errors
          ? Object.values(err.response.data.errors as Record<string, string[]>).flat().join('\n')
          : err.response?.data?.message || 'Gagal menyimpan data karyawan.'
      Swal.fire({
        title: 'Registrasi Gagal',
        text: msg,
        icon: 'error',
        background: '#fffdfb',
        color: '#3c1105'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewBiodata = async (id: number) => {
    setShowViewModal(true)
    setViewProfile(null)
    try {
      const res = await axios.get(`http://localhost:8000/api/employees/${id}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data.status === 'success') {
        setViewProfile(res.data.data)
      }
    } catch (err) {
      console.error('Gagal memuat profil:', err)
      Swal.fire({
        title: 'Gagal Memuat',
        text: 'Tidak dapat memuat biodata.',
        icon: 'error',
        background: '#fffdfb',
        color: '#3c1105'
      })
      setShowViewModal(false)
    }
  }

  const handleDeleteEmployee = (id: number, name: string) => {
    Swal.fire({
      title: 'Hapus Akun Karyawan?',
      text: `Apakah Anda yakin ingin menghapus akun ${name}? Tindakan ini tidak dapat dibatalkan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      background: '#1e293b',
      color: '#f8fafc'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(`http://localhost:8000/api/employees/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })

          if (response.data.status === 'success') {
            Swal.fire({
              title: 'Berhasil!',
              text: response.data.message || 'Akun karyawan berhasil diproses.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false,
              background: '#1e293b',
              color: '#f8fafc'
            })
            fetchEmployees()
          }
        } catch (err: any) {
          console.error(err)
          Swal.fire({
            title: 'Penghapusan Gagal',
            text: 'Tidak dapat menghapus karyawan ini.',
            icon: 'error',
            background: '#1e293b',
            color: '#f8fafc'
          })
        }
      }
    })
  }

  const handleOpenEditEmployeeModal = (employee: Employee) => {
    setEditingEmployee(employee)
    setEditName(employee.name)
    setEditEmail(employee.email)
    setEditPassword('')
    setEditNoRekening(employee.no_rekening || '')
    setEditCompany(employee.company || '')
    setEditWhatsapp(employee.whatsapp || '')
    setEditSaturdayOff(!!employee.saturday_off)
    setEditSundayOff(employee.sunday_off !== false)
    setShowEditEmployeeModal(true)
  }

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEmployee) return

    if (!editName) {
      Swal.fire({
        title: 'Form Belum Lengkap',
        text: 'Silakan isi nama karyawan.',
        icon: 'warning',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#6366f1'
      })
      return
    }

    if (editPassword && editPassword.length < 6) {
      Swal.fire({
        title: 'Password Terlalu Pendek',
        text: 'Kata sandi minimal harus terdiri dari 6 karakter.',
        icon: 'warning',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#6366f1'
      })
      return
    }

    setSubmittingEdit(true)
    try {
      const response = await axios.put(
        `http://localhost:8000/api/employees/${editingEmployee.id}`,
        {
          name: editName,
          password: editPassword || null,
          no_rekening: editNoRekening,
          company: editCompany,
          whatsapp: editWhatsapp,
          saturday_off: editSaturdayOff ? '1' : '0',
          sunday_off: editSundayOff ? '1' : '0'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.status === 'success') {
        Swal.fire({
          title: 'Berhasil!',
          text: 'Akun karyawan berhasil diperbarui.',
          icon: 'success',
          background: '#1e293b',
          color: '#f8fafc',
          timer: 1500,
          showConfirmButton: false
        })

        setShowEditEmployeeModal(false)
        setEditingEmployee(null)
        setEditName('')
        setEditEmail('')
        setEditPassword('')
        setEditWhatsapp('')
        setEditSaturdayOff(false)
        setEditSundayOff(true)
        fetchEmployees() // Refresh employees list
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal memperbarui data karyawan.'
      Swal.fire({
        title: 'Pembaruan Gagal',
        text: msg,
        icon: 'error',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#ef4444'
      })
    } finally {
      setSubmittingEdit(false)
    }
  }

  // Open edit time modal
  const handleOpenEditModal = (attendance: Attendance) => {
    setEditingAttendance(attendance)
    setEditClockIn(attendance.clock_in ? attendance.clock_in.substring(0, 5) : '')
    setEditClockOut(attendance.clock_out ? attendance.clock_out.substring(0, 5) : '')
    setShowEditModal(true)
  }

  // Submit edit time
  const handleEditTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAttendance) return

    setUpdating(true)
    try {
      const response = await axios.put(
        `http://localhost:8000/api/admin/attendances/${editingAttendance.id}`,
        {
          clock_in: editClockIn || null,
          clock_out: editClockOut || null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.status === 'success') {
        Swal.fire({
          title: 'Berhasil!',
          text: 'Data jam presensi berhasil diperbarui.',
          icon: 'success',
          background: '#1e293b',
          color: '#f8fafc',
          timer: 1500,
          showConfirmButton: false
        })
        setShowEditModal(false)
        fetchAttendances() // Refresh log data
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal memperbarui jam presensi.'
      Swal.fire({
        title: 'Gagal Mengubah',
        text: msg,
        icon: 'error',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#ef4444'
      })
    } finally {
      setUpdating(false)
    }
  }

  // Submit office setting (latitude, longitude, radius)
  const handleOfficeSettingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingOffice(true)
    try {
      const response = await axios.put(
        'http://localhost:8000/api/admin/office-setting',
        {
          latitude: officeLatitude,
          longitude: officeLongitude,
          radius: officeRadius
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.status === 'success') {
        Swal.fire({
          title: 'Pengaturan Tersimpan!',
          text: response.data.message,
          icon: 'success',
          background: '#1e293b',
          color: '#f8fafc',
          timer: 2000,
          showConfirmButton: false
        })
        fetchOfficeSetting()
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal menyimpan pengaturan lokasi kantor.'
      Swal.fire({
        title: 'Gagal Menyimpan',
        text: msg,
        icon: 'error',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#ef4444'
      })
    } finally {
      setSavingOffice(false)
    }
  }

  // Filter lists
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get current date string (YYYY-MM-DD) local time
  const todayStr = new Date().toLocaleDateString('en-CA')

  // Get list of employees present today
  const presentToday = attendances.filter(
    (att) => att.date === todayStr && att.clock_in !== null
  )

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) return '-'
    const textMap: Record<string, string> = {
      early: 'Datang Lebih Awal',
      normal: 'Normal',
      late: 'Terlambat',
      early_departure: 'Pulang Cepat',
      overtime: 'Lembur'
    }
    const colorMap: Record<string, string> = {
      early: 'text-amber-700 bg-amber-50 border-amber-200',
      normal: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      late: 'text-rose-700 bg-rose-50 border-rose-200',
      early_departure: 'text-rose-700 bg-rose-50 border-rose-200',
      overtime: 'text-amber-700 bg-amber-50 border-amber-200'
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${colorMap[status] || 'text-slate-600 bg-slate-50 border-slate-200'}`}>
        {textMap[status] || status}
      </span>
    )
  }

  // Get current route info for headers
  const getRouteInfo = () => {
    const path = location.pathname
    if (path.includes('absen-mandiri')) {
      return { title: 'Presensi Mandiri Admin', subtitle: 'Self Check-In / Check-Out' }
    }
    if (path.includes('rekapAbsensi')) {
      return { title: 'Rekap Absensi Karyawan', subtitle: 'Attendance Logs' }
    }
    if (path.includes('cuti')) {
      return { title: 'Persetujuan Cuti', subtitle: 'Leave Requests' }
    }
    if (path.includes('akunKaryawan')) {
      return { title: 'Kelola Akun Karyawan', subtitle: 'Accounts Management' }
    }
    if (path.includes('inventaris')) {
      return { title: 'Daftar Inventaris Barang Kantor', subtitle: 'Office Inventory' }
    }
    if (path.includes('lokasiKantor')) {
      return { title: 'Konfigurasi Lokasi & Radius', subtitle: 'Location Configuration' }
    }
    if (path.includes('keamanan')) {
      return { title: 'Akun & Keamanan Admin', subtitle: 'Account Security' }
    }
    if (path.includes('biodata')) {
      return { title: 'Biodata Pribadi Admin', subtitle: 'Admin Profile' }
    }
    if (path.includes('hariLibur')) {
      return { title: 'Kelola Hari Libur', subtitle: 'Holiday Settings' }
    }
    if (path.includes('payroll-config')) {
      return { title: 'Setelan Gaji Karyawan', subtitle: 'Salary Configuration' }
    }
    if (path.includes('payroll')) {
      return { title: 'Kelola Payroll Karyawan', subtitle: 'Payroll Management' }
    }
    if (path.includes('reimbursement')) {
      return { title: 'Kelola Klaim Reimbursement', subtitle: 'Reimbursement Claims' }
    }
    if (path.includes('bonus')) {
      return { title: 'Pemberian Bonus Karyawan', subtitle: 'Employee Bonuses' }
    }
    if (path.includes('lembur')) {
      return { title: 'Manajemen Lembur Karyawan', subtitle: 'Employee Overtime' }
    }
    return { title: 'Dashboard Monitoring', subtitle: 'Overview' }
  }

  const routeInfo = getRouteInfo()
  const totalPending = sidebarCounts.pendingKaryawanCount + sidebarCounts.operasionalCount + sidebarCounts.unpaidPayrollCount

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
      
      {/* Mobile Top Navbar Header */}
      <AdminMobileNavbar onMenuClick={() => setMobileSidebarOpen(true)} pendingCount={totalPending} />

      {/* Floating Toggle Button on Left Middle Edge */}
      <button
        onClick={() => setMobileSidebarOpen(true)}
        className={`md:hidden fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white p-2.5 py-3.5 rounded-r-2xl shadow-lg shadow-red-500/20 border border-l-0 border-orange-200/20 transition-all duration-300 cursor-pointer flex items-center active:scale-95 active:translate-x-1 ${
          mobileSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        title="Buka Menu"
      >
        <ChevronRight className="w-5 h-5 animate-pulse" />
        {totalPending > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full text-[9px] font-black w-4.5 h-4.5 flex items-center justify-center border border-white animate-pulse">
            {totalPending}
          </span>
        )}
      </button>

      {/* Desktop Left Sidebar (Fixed) */}
      <aside className="hidden md:block w-64 bg-white border-r border-slate-100 p-6 flex-shrink-0 shadow-sm">
        <AdminSidebar user={user} onLogout={handleLogoutClick} counts={sidebarCounts} />
      </aside>

      {/* Mobile Sidebar (Slide-over drawer) */}
      <div 
        className={`fixed inset-0 z-50 md:hidden bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          mobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } flex`}
      >
        <div 
          className={`w-64 bg-white border-r border-slate-200 p-6 h-full flex-shrink-0 relative transition-transform duration-300 ease-out ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="absolute top-4 right-4 p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition-all cursor-pointer active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
          <AdminSidebar user={user} onLogout={handleLogoutClick} onClose={() => setMobileSidebarOpen(false)} counts={sidebarCounts} />
        </div>
        <div className="flex-grow h-full" onClick={() => setMobileSidebarOpen(false)}></div>
      </div>

      {/* Main Area Wrapper */}
      <div className="flex-grow flex flex-col min-h-screen min-w-0">
        
        {/* Desktop Navbar Header */}
        <AdminNavbar user={user} title={routeInfo.title} />

        {/* Main page content container */}
        <main className="flex-grow p-6 md:p-8 overflow-y-auto">
          {/* Nested Routing Views */}
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 font-sans text-xs">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-2 text-orange-500"></div>
              Memuat halaman...
            </div>
          }>
            <Routes>
            <Route 
              path="dashboard" 
              element={
                <DashboardOverview
                  loading={loading}
                  attendanceLoading={attendanceLoading}
                  employees={employees}
                  presentTodayCount={presentToday.length}
                  presentTodayList={presentToday}
                  todayStr={todayStr}
                  user={user}
                  token={token}
                  time={time}
                  officeSetting={
                    officeLatitude && officeLongitude 
                      ? { latitude: officeLatitude, longitude: officeLongitude, radius: officeRadius }
                      : null
                  }
                  leaves={leaves}
                  fetchAttendances={fetchAttendances}
                />
              } 
            />
            <Route 
              path="absen-mandiri" 
              element={
                <AbsenMandiriAdmin 
                  token={token} 
                  user={user} 
                />
              } 
            />
            <Route 
              path="rekapAbsensi" 
              element={
                <RekapAbsensi
                  token={token}
                  employees={employees}
                  attendanceLoading={attendanceLoading}
                  attendances={attendances}
                  fetchAttendances={fetchAttendances}
                  formatDate={formatDate}
                  getStatusBadge={getStatusBadge}
                  setSelectedAttendance={setSelectedAttendance}
                  officeLatitude={officeLatitude}
                  officeLongitude={officeLongitude}
                  leaves={leaves}
                />
              } 
            />
            <Route 
              path="akunKaryawan" 
              element={
                <AkunKaryawan
                  loading={loading}
                  filteredEmployees={filteredEmployees}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  handleDeleteEmployee={handleDeleteEmployee}
                  onEditClick={handleOpenEditEmployeeModal}
                  setShowModal={setShowModal}
                  formatDate={formatDate}
                  token={token}
                  onRefresh={fetchEmployees}
                />
              } 
            />
            <Route 
              path="lokasiKantor" 
              element={
                <LokasiKantor
                  officeLatitude={officeLatitude}
                  setOfficeLatitude={setOfficeLatitude}
                  officeLongitude={officeLongitude}
                  setOfficeLongitude={setOfficeLongitude}
                  officeRadius={officeRadius}
                  setOfficeRadius={setOfficeRadius}
                  savingOffice={savingOffice}
                  handleOfficeSettingSubmit={handleOfficeSettingSubmit}
                  user={user}
                  token={token}
                  onProfileUpdate={onProfileUpdate}
                  initialTab="lokasi"
                />
              } 
            />
            <Route 
              path="keamanan" 
              element={
                <LokasiKantor
                  officeLatitude={officeLatitude}
                  setOfficeLatitude={setOfficeLatitude}
                  officeLongitude={officeLongitude}
                  setOfficeLongitude={setOfficeLongitude}
                  officeRadius={officeRadius}
                  setOfficeRadius={setOfficeRadius}
                  savingOffice={savingOffice}
                  handleOfficeSettingSubmit={handleOfficeSettingSubmit}
                  user={user}
                  token={token}
                  onProfileUpdate={onProfileUpdate}
                  initialTab="akun"
                />
              } 
            />
            <Route 
              path="biodata" 
              element={
                <LokasiKantor
                  officeLatitude={officeLatitude}
                  setOfficeLatitude={setOfficeLatitude}
                  officeLongitude={officeLongitude}
                  setOfficeLongitude={setOfficeLongitude}
                  officeRadius={officeRadius}
                  setOfficeRadius={setOfficeRadius}
                  savingOffice={savingOffice}
                  handleOfficeSettingSubmit={handleOfficeSettingSubmit}
                  user={user}
                  token={token}
                  onProfileUpdate={onProfileUpdate}
                  initialTab="biodata"
                />
              } 
            />
            <Route 
              path="hariLibur" 
              element={
                <AdminKelolaHariLibur
                  token={token}
                />
              } 
            />
            <Route 
              path="cuti" 
              element={
                <AdminCuti
                  token={token}
                />
              } 
            />
            <Route 
              path="inventaris" 
              element={
                <AdminInventaris
                  token={token}
                />
              } 
            />
            <Route 
              path="payroll" 
              element={
                <AdminPayroll
                  token={token}
                />
              } 
            />
            <Route 
              path="payroll-config" 
              element={
                <AdminSalaryConfig
                  token={token}
                />
              } 
            />
            <Route 
              path="reimbursement" 
              element={
                <AdminReimbursement
                  token={token}
                />
              } 
            />
            <Route 
              path="bonus" 
              element={
                <AdminBonus
                  token={token}
                />
              } 
            />
            <Route 
              path="lembur" 
              element={
                <AdminOvertime
                  token={token}
                />
              } 
            />
            {/* Default fallback route */}
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </Suspense>
      </main>
      </div>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAddEmployee}
        submitting={submitting}
      />

      {/* Edit Employee Modal */}
      <EditEmployeeModal
        show={showEditEmployeeModal}
        onClose={() => setShowEditEmployeeModal(false)}
        onSubmit={handleEditEmployee}
        name={editName}
        setName={setEditName}
        email={editEmail}
        password={editPassword}
        setPassword={setEditPassword}
        noRekening={editNoRekening}
        setNoRekening={setEditNoRekening}
        company={editCompany}
        setCompany={setEditCompany}
        whatsapp={editWhatsapp}
        setWhatsapp={setEditWhatsapp}
        saturdayOff={editSaturdayOff}
        setSaturdayOff={setEditSaturdayOff}
        sundayOff={editSundayOff}
        setSundayOff={setEditSundayOff}
        submitting={submittingEdit}
        onViewBiodata={editingEmployee ? () => handleViewBiodata(editingEmployee.id) : undefined}
      />

      {/* View Biodata Modal (Admin) */}
      <ViewEmployeeModal
        show={showViewModal}
        onClose={() => setShowViewModal(false)}
        profile={viewProfile}
        onRefresh={() => {
          fetchEmployees()
          setShowEditEmployeeModal(false)
        }}
        token={token}
      />

      {/* Detail Attendance Modal */}
      <DetailAttendanceModal
        attendance={selectedAttendance}
        onClose={() => setSelectedAttendance(null)}
        formatDate={formatDate}
        getStatusBadge={getStatusBadge}
        token={token}
        officeLatitude={officeLatitude}
        officeLongitude={officeLongitude}
        onEditClick={selectedAttendance ? () => {
          handleOpenEditModal(selectedAttendance)
          setSelectedAttendance(null)
        } : undefined}
      />

      {/* Edit Time Modal */}
      <EditTimeModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditTimeSubmit}
        attendance={editingAttendance}
        editClockIn={editClockIn}
        setEditClockIn={setEditClockIn}
        editClockOut={editClockOut}
        setEditClockOut={setEditClockOut}
        updating={updating}
        formatDate={formatDate}
      />
    </div>
  )
}
