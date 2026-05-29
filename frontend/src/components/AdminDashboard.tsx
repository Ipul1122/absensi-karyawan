import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { 
  LogOut, 
  Users, 
  UserPlus, 
  Trash2, 
  Search, 
  Loader2, 
  ShieldCheck,
  Mail, 
  Lock, 
  User, 
  X, 
  Calendar,
  Clock
} from 'lucide-react'

interface Employee {
  id: number
  name: string
  email: string
  created_at: string
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
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [time, setTime] = useState(new Date())

  // New Employee Form States
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

  useEffect(() => {
    fetchEmployees()
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
        confirmButtonColor: '#ef4444'
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
        confirmButtonColor: '#ef4444'
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
          confirmButtonColor: '#ef4444'
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

  // Search filter
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      
      {/* Top Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-xl">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded border border-indigo-400/20 flex items-center gap-1 font-quicksand">
                <ShieldCheck className="w-3 h-3" /> Admin
              </span>
              <span className="text-xs text-slate-500 font-bold font-quicksand">Super User Access</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-0.5">{user.name}</h1>
            <p className="text-sm text-slate-400">{user.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogoutClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-950 border border-slate-800 hover:bg-rose-500/10 hover:border-rose-500/30 text-slate-300 hover:text-rose-400 rounded-xl transition-all cursor-pointer font-bold text-sm self-start md:self-auto font-quicksand"
        >
          <LogOut className="w-4 h-4" />
          Keluar Aplikasi
        </button>
      </header>

      {/* Grid Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Total Employees */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl flex items-center gap-4">
          <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-quicksand">Total Karyawan</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">
              {loading ? (
                <span className="inline-block w-8 h-8 rounded bg-slate-800 animate-pulse"></span>
              ) : (
                employees.length
              )}
            </h3>
          </div>
        </div>

        {/* Card 2: Admin Account Status */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl flex items-center gap-4">
          <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-quicksand">Status Akses</p>
            <h3 className="text-lg font-bold text-white mt-1 font-quicksand">Akses Penuh (Full Control)</h3>
          </div>
        </div>

        {/* Card 3: Clock */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl flex items-center gap-4 sm:col-span-2 lg:col-span-1">
          <div className="p-4 bg-violet-500/10 rounded-2xl text-violet-400 border border-violet-500/20">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 font-quicksand">
              <Calendar className="w-3.5 h-3.5" /> Live Clock
            </p>
            <h3 className="text-xl font-bold text-white mt-1 font-mono">
              {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </h3>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <section className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-6">
        
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-200 font-quicksand">Daftar Akun Karyawan</h3>
            <p className="text-xs text-slate-400 font-quicksand font-medium">Total karyawan yang memiliki hak akses login ke sistem portal.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative max-w-xs w-full sm:w-64">
              <Search className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-slate-500" />
              <input
                type="text"
                placeholder="Cari karyawan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-white placeholder-slate-500 rounded-xl py-2 pl-9 pr-4 outline-none transition-all text-xs"
              />
            </div>

            {/* Create Account Trigger Button */}
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer text-xs shrink-0 font-quicksand"
            >
              <UserPlus className="w-4 h-4" />
              Tambah Karyawan
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="border border-slate-800/60 rounded-2xl overflow-hidden bg-slate-950/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/60 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800/80 font-quicksand">
                  <th className="py-4 px-6">Nama</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Tanggal Dibuat</th>
                  <th className="py-4 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-450 font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                        Memuat data karyawan...
                      </div>
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 font-semibold">
                      {searchQuery ? 'Karyawan tidak ditemukan.' : 'Belum ada akun karyawan yang terdaftar.'}
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs uppercase">
                            {emp.name.substring(0, 2)}
                          </div>
                          <span>{emp.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs">{emp.email}</td>
                      <td className="py-4 px-6 text-xs text-slate-400">{formatDate(emp.created_at)}</td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer inline-flex items-center"
                          title="Hapus Karyawan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Slide / Overlay Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full relative shadow-2xl overflow-hidden animate-zoom-in">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
            
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2 font-quicksand">
                <UserPlus className="w-5 h-5 text-indigo-400" /> Tambah Akun Karyawan
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg transition-all cursor-pointer text-slate-450 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-quicksand">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Syaiful"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-white placeholder-slate-550 rounded-xl py-2.5 pl-9 pr-4 outline-none transition-all text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-quicksand">
                  Email Karyawan
                </label>
                <div className="relative">
                  <Mail className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="syaiful@perusahaan.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-white placeholder-slate-550 rounded-xl py-2.5 pl-9 pr-4 outline-none transition-all text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-quicksand">
                  Password Login
                </label>
                <div className="relative">
                  <Lock className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-white placeholder-slate-550 rounded-xl py-2.5 pl-9 pr-4 outline-none transition-all text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-white rounded-xl transition-all cursor-pointer text-xs font-bold font-quicksand"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed font-quicksand"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Buat Akun'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
