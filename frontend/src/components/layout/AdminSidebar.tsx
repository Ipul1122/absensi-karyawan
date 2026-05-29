import { NavLink } from 'react-router-dom'
import { 
  LogOut, 
  Users, 
  ShieldCheck, 
  LayoutDashboard, 
  ClipboardList, 
  MapPin, 
  ChevronRight 
} from 'lucide-react'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'employee'
}

interface AdminSidebarProps {
  user: User
  onLogout: () => void
  onClose?: () => void
}

export default function AdminSidebar({ user, onLogout, onClose }: AdminSidebarProps) {
  const menuItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/rekapAbsensi', label: 'Rekap Absensi', icon: ClipboardList },
    { to: '/admin/akunKaryawan', label: 'Akun Karyawan', icon: Users },
    { to: '/admin/lokasiKantor', label: 'Lokasi Kantor', icon: MapPin }
  ]

  const handleLinkClick = () => {
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-800/60 pb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-lg">
            A
          </div>
          <div>
            <h2 className="text-sm font-bold text-white leading-none font-quicksand">Portal Admin</h2>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Absensi App</span>
          </div>
        </div>

        {/* User profile brief */}
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-850 flex items-center justify-center text-slate-300 font-bold text-sm">
            AD
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-slate-200 truncate font-quicksand">{user.name}</h4>
            <p className="text-[10px] text-slate-500 font-mono truncate">{user.email}</p>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const IconComponent = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleLinkClick}
                className={({ isActive }) => `w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-600/10 to-violet-600/10 border border-indigo-500/20 text-indigo-400' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-3">
                  <IconComponent className="w-4 h-4 text-slate-500 group-hover:text-slate-350" />
                  {item.label}
                </span>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all text-slate-600" />
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="pt-6 border-t border-slate-800/60 space-y-3">
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold font-mono px-3">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Super Admin Access</span>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-950 border border-slate-850 hover:bg-rose-500/10 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-bold transition-all cursor-pointer font-quicksand"
        >
          <LogOut className="w-4 h-4" />
          Keluar Aplikasi
        </button>
      </div>
    </div>
  )
}
