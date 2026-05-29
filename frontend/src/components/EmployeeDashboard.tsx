import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { LogOut, User as UserIcon, Calendar, Clock, Sparkles, Building, CheckCircle2, ShieldAlert } from 'lucide-react'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'employee'
}

interface EmployeeDashboardProps {
  user: User
  token: string
  onLogout: () => void
}

export default function EmployeeDashboard({ user, token, onLogout }: EmployeeDashboardProps) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogoutClick = async () => {
    try {
      await axios.post(
        'http://localhost:8000/api/logout',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
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

  // Format date helper
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // Greetings depending on time
  const getGreeting = () => {
    const hrs = time.getHours()
    if (hrs < 12) return 'Selamat Pagi'
    if (hrs < 15) return 'Selamat Siang'
    if (hrs < 18) return 'Selamat Sore'
    return 'Selamat Malam'
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header Panel */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20 text-white font-bold text-xl">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded border border-violet-400/20 font-quicksand">
                Karyawan
              </span>
              <span className="text-xs text-slate-500 font-bold font-quicksand">ID: #{user.id}</span>
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

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Dynamic Clock Card */}
        <section className="md:col-span-5 bg-gradient-to-tr from-slate-900/60 to-slate-900/20 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-violet-500/10 rounded-2xl text-violet-400 border border-violet-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-quicksand">
              Waktu Online
            </span>
          </div>
          
          <div className="my-4">
            <h2 className="text-4xl font-extrabold tracking-tight text-white font-mono">
              {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </h2>
            <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-1 font-bold font-quicksand">
              <Calendar className="w-4 h-4 text-slate-500" />
              {formatDate(time)}
            </p>
          </div>
          
          <div className="border-t border-slate-800/60 pt-3 text-xs text-slate-500 font-bold flex items-center gap-1 font-quicksand">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin duration-3000" />
            {getGreeting()}, {user.name.split(' ')[0]}!
          </div>
        </section>

        {/* Info & Status Cards */}
        <section className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Card 1: Attendance info */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between hover:border-slate-700/60 transition-all group">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-quicksand">Hari Ini</span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-extrabold text-slate-200 font-quicksand">Status Kehadiran</h3>
              <p className="text-xs text-slate-400 mt-1">Status kehadiran Anda saat ini.</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-sm font-bold text-emerald-400 font-quicksand">Hadir (Sesuai Jadwal)</span>
              </div>
            </div>
          </div>

          {/* Card 2: Company Info */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between hover:border-slate-700/60 transition-all group">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
                <Building className="w-6 h-6" />
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-quicksand">Info Kerja</span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-extrabold text-slate-200 font-quicksand">Departemen</h3>
              <p className="text-xs text-slate-400 mt-1">Informasi penugasan divisi.</p>
              <div className="mt-3 text-sm font-bold text-slate-300 font-quicksand">
                Staff Divisi Operasional
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Profile Details Card */}
      <section className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl">
        <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2 pb-3 border-b border-slate-800/60 font-quicksand">
          <UserIcon className="w-5 h-5 text-indigo-400" /> Profil Akun Karyawan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 uppercase font-bold font-quicksand">Nama Lengkap</span>
            <p className="text-sm font-bold text-slate-300 font-quicksand">{user.name}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-500 uppercase font-bold font-quicksand">Alamat Email</span>
            <p className="text-sm font-bold text-slate-300 font-quicksand">{user.email}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-500 uppercase font-bold font-quicksand">Tipe Akun</span>
            <p className="text-sm font-bold text-slate-300 font-quicksand">Akses Karyawan Umum</p>
          </div>
        </div>
      </section>

      {/* Notification banner */}
      <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0" />
        <p className="text-xs text-slate-400 leading-relaxed">
          <strong>Keamanan Akun:</strong> Harap jaga kerahasiaan kata sandi Anda. Akun Anda digunakan untuk mencatat absensi kerja harian di sistem secara terpusat.
        </p>
      </div>
    </div>
  )
}
