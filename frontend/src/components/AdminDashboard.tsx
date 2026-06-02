import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { 
  Routes, 
  Route, 
  Navigate, 
  useLocation 
} from 'react-router-dom'
import { 
  Clock,
  Menu,
  X,
  ChevronRight
} from 'lucide-react'

// Import layout component
import AdminSidebar from './layout/AdminSidebar'
import Logo from './layout/Logo'

// Import sub-components
import DashboardOverview from './admin/DashboardOverview'
import RekapAbsensi from './admin/RekapAbsensi'
import AkunKaryawan from './admin/AkunKaryawan'
import LokasiKantor from './admin/LokasiKantor'
import AdminCuti from './admin/AdminCuti'
import AddEmployeeModal from './admin/AddEmployeeModal'
import EditEmployeeModal from './admin/EditEmployeeModal'
import DetailAttendanceModal from './admin/DetailAttendanceModal'
import EditTimeModal from './admin/EditTimeModal'

interface Employee {
  id: number
  name: string
  email: string
  password_plain?: string
  created_at: string
  updated_at: string
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
  }
}

interface AdminDashboardProps {
  user: {
    id: number
    name: string
    email: string
    role: 'admin' | 'employee'
  }
  token: string
  onLogout: () => void
}

export default function AdminDashboard({ user, token, onLogout }: AdminDashboardProps) {
  const location = useLocation()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  
  const [loading, setLoading] = useState(true)
  const [attendanceLoading, setAttendanceLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [time, setTime] = useState(new Date())

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
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Edit Employee Form States
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [submittingEdit, setSubmittingEdit] = useState(false)

  useEffect(() => {
    const clock = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(clock)
  }, [])

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
  }, [])

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

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newName || !newEmail || !newPassword) {
      Swal.fire({
        title: 'Form Belum Lengkap',
        text: 'Silakan isi semua kolom.',
        icon: 'warning',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#6366f1'
      })
      return
    }

    if (newPassword.length < 6) {
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

    setSubmitting(true)

    try {
      const response = await axios.post(
        'http://localhost:8000/api/employees',
        {
          name: newName,
          email: newEmail,
          password: newPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.status === 'success') {
        Swal.fire({
          title: 'Berhasil!',
          text: response.data.message || 'Akun karyawan baru berhasil dibuat.',
          icon: 'success',
          background: '#1e293b',
          color: '#f8fafc',
          confirmButtonColor: '#6366f1'
        })

        // Reset form & close modal
        setNewName('')
        setNewEmail('')
        setNewPassword('')
        setShowModal(false)
        
        // Refresh list
        fetchEmployees()
      }
    } catch (err: any) {
      console.error(err)
      let msg = 'Gagal menyimpan data karyawan.'
      if (err.response && err.response.data && err.response.data.message) {
        msg = err.response.data.message
      }
      Swal.fire({
        title: 'Registrasi Gagal',
        text: msg,
        icon: 'error',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#ef4444'
      })
    } finally {
      setSubmitting(false)
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
              title: 'Dihapus!',
              text: 'Akun karyawan berhasil dihapus.',
              icon: 'success',
              timer: 1500,
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
          password: editPassword || null
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

  // Get current date string (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0]

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
    if (path.includes('rekapAbsensi')) {
      return { title: 'Rekap Absensi Karyawan', subtitle: 'Attendance Logs' }
    }
    if (path.includes('cuti')) {
      return { title: 'Persetujuan Cuti', subtitle: 'Leave Requests' }
    }
    if (path.includes('akunKaryawan')) {
      return { title: 'Kelola Akun Karyawan', subtitle: 'Accounts Management' }
    }
    if (path.includes('lokasiKantor')) {
      return { title: 'Konfigurasi Lokasi & Radius', subtitle: 'Location Configuration' }
    }
    return { title: 'Dashboard Monitoring', subtitle: 'Overview' }
  }

  const routeInfo = getRouteInfo()

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row bg-[#fdfaf7]">
      
      {/* Mobile Top Navbar Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-orange-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 bg-slate-50 border border-slate-200 hover:bg-orange-50/50 rounded-xl text-slate-600 hover:text-red-500 transition-all cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Logo className="w-8 h-8" />
        </div>
      </header>

      {/* Floating Toggle Button on Left Middle Edge */}
      {!mobileSidebarOpen && (
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="md:hidden fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-650 hover:to-orange-700 text-white p-2.5 py-3.5 rounded-r-2xl shadow-lg shadow-red-500/20 border border-l-0 border-orange-200/20 transition-all cursor-pointer flex items-center"
          title="Buka Menu"
        >
          <ChevronRight className="w-5 h-5 animate-pulse" />
        </button>
      )}

      {/* Desktop Left Sidebar (Fixed) */}
      <aside className="hidden md:block w-64 bg-white border-r border-orange-100/80 p-6 flex-shrink-0 shadow-sm">
        <AdminSidebar user={user} onLogout={handleLogoutClick} />
      </aside>

      {/* Mobile Sidebar (Slide-over drawer) */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-900/40 backdrop-blur-sm animate-fade-in flex">
          <div className="w-64 bg-white border-r border-orange-100 p-6 h-full flex-shrink-0 relative animate-slide-right">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <AdminSidebar user={user} onLogout={handleLogoutClick} onClose={() => setMobileSidebarOpen(false)} />
          </div>
          <div className="flex-grow h-full" onClick={() => setMobileSidebarOpen(false)}></div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow p-6 md:p-10 min-h-screen overflow-y-auto">
        {/* Dynamic header with page title & clock */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-orange-100 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest font-mono">
                Admin Panel
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] text-slate-500 font-bold font-mono">
                {routeInfo.subtitle}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-800 mt-1 font-quicksand capitalize">
              {routeInfo.title}
            </h1>
          </div>

          {/* Clock widget */}
          <div className="flex items-center gap-3 bg-white border border-orange-100 px-4 py-2.5 rounded-2xl shadow-sm">
            <Clock className="w-4.5 h-4.5 text-red-550 animate-pulse" />
            <div>
              <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider font-quicksand">Jam Digital</span>
              <span className="text-xs font-bold text-slate-800 font-mono">{time.toLocaleTimeString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Nested Routing Views */}
        <Routes>
          <Route 
            path="dashboard" 
            element={
              <DashboardOverview
                loading={loading}
                attendanceLoading={attendanceLoading}
                employeesCount={employees.length}
                presentTodayCount={presentToday.length}
                normalTodayCount={presentToday.filter(a => a.status_in === 'normal').length}
                presentTodayList={presentToday}
                formatDate={formatDate}
                getStatusBadge={getStatusBadge}
                setSelectedAttendance={setSelectedAttendance}
                todayStr={todayStr}
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
                handleOpenEditModal={handleOpenEditModal}
                officeLatitude={officeLatitude}
                officeLongitude={officeLongitude}
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
          {/* Default fallback route */}
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </main>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleAddEmployee}
        newName={newName}
        setNewName={setNewName}
        newEmail={newEmail}
        setNewEmail={setNewEmail}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
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
        submitting={submittingEdit}
      />

      {/* Detail Attendance Modal */}
      <DetailAttendanceModal
        attendance={selectedAttendance}
        onClose={() => setSelectedAttendance(null)}
        formatDate={formatDate}
        getStatusBadge={getStatusBadge}
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
