import { useState, useEffect } from 'react'
import { Menu, Bell, RefreshCw, Clock } from 'lucide-react'
import Swal from 'sweetalert2'
import Logo from './Logo'

import { getAssetUrl } from '../../utils/api'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'employee'
  photo?: string | null
}

interface AdminNavbarProps {
  user: User
  title: string
}

export default function AdminNavbar({ user, title }: AdminNavbarProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const isDashboard = title.toLowerCase().includes('dashboard') || title.toLowerCase() === 'beranda'

  return (
    <header className="hidden md:flex items-center justify-between bg-white border-b border-slate-100 px-8 py-4 shadow-[0_4px_20px_rgba(15,23,42,0.02)] sticky top-0 z-30 font-quicksand">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-[18px] font-black text-slate-800 tracking-tight font-sans">
          {title === 'Dashboard' ? 'Dashboard Monitoring' : title}
        </h1>
        <p className="text-[11px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">
          {isDashboard 
            ? "Welcome back, monitor today's employee activities." 
            : "Kelola dan tinjau modul sistem secara komprehensif."}
        </p>
      </div>

      {/* Sync, Clock, Date, Notification, Profile */}
      <div className="flex items-center gap-6">
        
        {/* Info Grid */}
        <div className="flex items-center gap-4 border-r border-slate-200 pr-5">
          {/* Live Time */}
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="w-4 h-4 text-[#E53935]" />
            <span className="text-[11px] font-bold text-slate-800 font-mono">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
            </span>
          </div>

          <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>

          {/* Synchronization status */}
          <div className="flex items-center gap-1.5 text-slate-500" title="Sinkronisasi otomatis aktif">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-500 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150 uppercase tracking-wide">
              Aktif
            </span>
          </div>
        </div>

        {/* Action Widgets */}
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <button 
            type="button"
            className="relative p-2 bg-slate-50 hover:bg-red-50/40 text-slate-500 hover:text-[#E53935] border border-slate-150 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
            onClick={() => Swal.fire({
              title: 'Notifikasi',
              text: 'Tidak ada notifikasi mendesak saat ini.',
              icon: 'info',
              confirmButtonColor: '#E53935',
              background: '#ffffff'
            })}
          >
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#E53935] rounded-full border-2 border-white animate-pulse"></span>
          </button>

          {/* Divider */}
          <span className="w-px h-6 bg-slate-200"></span>

          {/* Profile Widget */}
          <div className="flex items-center gap-3">
            {user.photo ? (
              <img
                src={getAssetUrl(user.photo.startsWith('http') ? user.photo : `storage/${user.photo}`)}
                alt="Avatar"
                className="w-10 h-10 rounded-full border-2 border-[#E53935]/20 object-cover shadow-sm shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#E53935] to-[#C62828] flex items-center justify-center text-white font-extrabold text-sm shadow-sm shrink-0">
                {user.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="text-left">
              <h4 className="text-xs font-black text-slate-800 leading-tight">{user.name}</h4>
              <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider font-mono">
                {user.role === 'admin' ? 'HR Manager' : 'Staff'}
              </p>
            </div>
          </div>
        </div>

      </div>
    </header>
  )
}

interface AdminMobileNavbarProps {
  onMenuClick: () => void
  pendingCount?: number
}

export function AdminMobileNavbar({ onMenuClick, pendingCount = 0 }: AdminMobileNavbarProps) {
  return (
    <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-orange-100 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="relative p-2 bg-slate-50 border border-slate-200 hover:bg-orange-50/50 rounded-xl text-slate-600 hover:text-red-500 transition-all cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[9px] font-black w-4.5 h-4.5 flex items-center justify-center border border-white animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>
        <Logo className="w-8 h-8" company="PT Cakrawala Parama Internasional" />
      </div>
    </header>
  )
}
