import { NavLink } from 'react-router-dom'
import { 
  LogOut, 
  LayoutDashboard, 
  ChevronRight, 
  CalendarCheck,
  History,
  ShieldCheck,
  Settings,
  CalendarDays,
  // ReceiptText
} from 'lucide-react'
import Logo from './Logo'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'employee'
}

interface EmployeeSidebarProps {
  user: User
  onLogout: () => void
  onClose?: () => void
}

export default function EmployeeSidebar({ user, onLogout, onClose }: EmployeeSidebarProps) {
  const menuItems = [
    { to: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/employee/absen', label: 'Absen Mandiri', icon: CalendarCheck },
    { to: '/employee/cuti', label: 'Pengajuan Cuti', icon: CalendarDays },
    { to: '/employee/riwayat', label: 'Riwayat Absen', icon: History },
    // { to: '/employee/payroll', label: 'Slip Gaji', icon: ReceiptText },
    { to: '/employee/pengaturan', label: 'Atur Akun', icon: Settings }
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
        <div className="bg-orange-50/40 border border-orange-100/60 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-500 to-orange-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-red-500/10">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-slate-800 truncate font-quicksand">{user.name}</h4>
            <p className="text-[10px] text-slate-500 truncate font-medium">{user.email}</p>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="space-y-1.5 font-quicksand">
          {menuItems.map((item) => {
            const IconComponent = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleLinkClick}
                className={({ isActive }) => `w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                  isActive 
                    ? 'bg-gradient-to-r from-red-55/60 to-orange-55/60 border border-orange-100/80 text-red-600 shadow-sm' 
                    : 'text-slate-600 hover:text-red-500 hover:bg-orange-50/30 border border-transparent'
                }`}
              >
                {({ isActive }) => (
                  <>
                    <span className="flex items-center gap-3">
                      <IconComponent className={`w-4 h-4 transition-colors ${isActive ? 'text-red-500' : 'text-slate-400 group-hover:text-red-500'}`} />
                      {item.label}
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-all ${isActive ? 'opacity-100 text-red-500' : 'opacity-0 group-hover:opacity-100 text-slate-400'}`} />
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="pt-6 border-t border-orange-100 space-y-3">
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold px-3">
          <ShieldCheck className="w-4 h-4 text-red-500" />
          <span className="font-quicksand uppercase tracking-wider text-[9px]">Akses Karyawan</span>
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

