import { useState, useRef, useEffect } from 'react'
import { Menu, Bell, ChevronDown, LogOut, Shield } from 'lucide-react'
import Logo from './Logo'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'employee' | 'director'
  photo?: string | null
}

interface DirectorNavbarProps {
  user: User
  title: string
  subtitle?: string
}

export default function DirectorNavbar({ user, title, subtitle }: DirectorNavbarProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header
      className="hidden md:flex items-center justify-between px-8 py-4 sticky top-0 z-30 border-b"
      style={{
        background: 'rgba(253, 251, 247, 0.90)',
        backdropFilter: 'blur(20px)',
        borderColor: 'rgba(251, 146, 60, 0.15)',
        fontFamily: "'Inter', 'system-ui', sans-serif"
      }}
    >
      {/* Page Title */}
      <div>
        <div className="flex items-center gap-2">
          <div
            className="w-1 h-5 rounded-full shrink-0"
            style={{ background: 'linear-gradient(180deg, #ea580c, #c2410c)' }}
          />
          <h1 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h1>
        </div>
        {subtitle && (
          <p className="text-[11px] text-slate-400 font-medium mt-0.5 pl-3">{subtitle}</p>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-all cursor-pointer"
          title="Notifikasi"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(prev => !prev)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-orange-200 hover:bg-white transition-all cursor-pointer"
          >
            {user.photo ? (
              <img
                src={user.photo.startsWith('http') ? user.photo : `http://localhost:8000/storage/${user.photo}`}
                alt="Avatar"
                className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                style={{ background: 'linear-gradient(135deg, #ea580c, #c2410c)' }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</p>
              <p className="text-[9px] text-orange-600 font-bold uppercase tracking-wider">Direktur Utama</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDropdown && (
            <div
              className="absolute right-0 top-full mt-2 w-52 rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
              style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)' }}
            >
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Shield className="w-3 h-3 text-orange-500" />
                  <span className="text-[9px] font-black text-orange-600 uppercase tracking-wider">Direktur Utama</span>
                </div>
              </div>
              <div className="p-2">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                  onClick={() => { window.location.href = '/' }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Keluar dari Aplikasi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

interface DirectorMobileNavbarProps {
  onMenuClick: () => void
  pendingCount?: number
}

export function DirectorMobileNavbar({ onMenuClick, pendingCount = 0 }: DirectorMobileNavbarProps) {
  return (
    <header
      className="md:hidden flex items-center justify-between px-5 py-3.5 border-b"
      style={{
        background: 'rgba(253, 251, 247, 0.95)',
        backdropFilter: 'blur(20px)',
        borderColor: 'rgba(251, 146, 60, 0.15)',
        fontFamily: "'Inter', 'system-ui', sans-serif"
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all cursor-pointer"
        >
          <Menu className="w-4.5 h-4.5" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[9px] font-black w-4.5 h-4.5 flex items-center justify-center border border-white animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>
        <Logo />
      </div>
    </header>
  )
}
