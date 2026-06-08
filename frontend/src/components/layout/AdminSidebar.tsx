import { NavLink } from 'react-router-dom'
import { 
  LogOut, 
  Users, 
  ShieldCheck, 
  LayoutDashboard, 
  ChevronRight,
  Clock,
  CalendarDays,
  Package,
  // ReceiptText,
  Settings
} from 'lucide-react'
import Logo from './Logo'

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
    { to: '/admin/akunKaryawan', label: 'Karyawan', icon: Users },
    { to: '/admin/rekapAbsensi', label: 'Kehadiran', icon: Clock },
    { to: '/admin/cuti', label: 'Cuti', icon: CalendarDays },
    { to: '/admin/inventaris', label: 'Inventaris', icon: Package },
    // { to: '/admin/payroll', label: 'Penggajian', icon: ReceiptText },
    { to: '/admin/lokasiKantor', label: 'Pengaturan', icon: Settings },
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
        <div className="flex items-center gap-3 px-3 py-2 border-b border-orange-100 pb-5">
          <Logo />
        </div>

        {/* User profile brief */}
        <div className="bg-gradient-to-tr from-red-500/5 to-orange-500/5 border border-orange-100/60 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-650 to-orange-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-red-500/10">
            AD
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-slate-800 truncate font-quicksand">{user.name}</h4>
            <p className="text-[10px] text-slate-500 truncate font-medium">{user.email}</p>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="space-y-1 font-quicksand">
          {menuItems.map((item) => {
            const IconComponent = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleLinkClick}
                className={({ isActive }) => `w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                  isActive 
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md shadow-red-500/15' 
                    : 'text-slate-655 hover:text-red-600 hover:bg-orange-50/40 border border-transparent'
                }`}
              >
                {({ isActive }) => (
                  <>
                    <span className="flex items-center gap-3">
                      <IconComponent className={`w-4.5 h-4.5 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-red-500'}`} />
                      {item.label}
                    </span>
                    <ChevronRight className={`w-4 h-4 transition-all ${isActive ? 'opacity-100 text-white' : 'opacity-0 group-hover:opacity-100 text-slate-400'}`} />
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="pt-6 border-t border-orange-100 space-y-3">
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold px-3 font-quicksand">
          <ShieldCheck className="w-4.5 h-4.5 text-red-600 animate-pulse" />
          <span className="uppercase tracking-wider text-[9px]">Akses Admin Utama</span>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-100 text-slate-655 hover:text-red-600 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm font-quicksand"
        >
          <LogOut className="w-4 h-4" />
          Keluar Aplikasi
        </button>
      </div>
    </div>
  )
}
