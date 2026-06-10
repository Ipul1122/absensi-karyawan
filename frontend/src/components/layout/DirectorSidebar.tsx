import { NavLink } from 'react-router-dom'
import { 
  LogOut, 
  UserCheck, 
  ShieldCheck, 
  LayoutDashboard, 
  FileCheck,
  Wallet,
  Coins,
  ChevronRight,
  Crown
} from 'lucide-react'
import Logo from './Logo'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'employee' | 'director'
}

interface DirectorSidebarProps {
  user: User
  onLogout: () => void
  onClose?: () => void
}

const menuItems = [
  { to: '/director/dashboard', label: 'Overview', icon: LayoutDashboard, description: 'Ringkasan persetujuan' },
  { to: '/director/karyawan', label: 'Persetujuan Karyawan', icon: UserCheck, description: 'Registrasi & hapus akun' },
  { to: '/director/gaji', label: 'Persetujuan Gaji', icon: Wallet, description: 'Penyesuaian kompensasi' },
  { to: '/director/payroll', label: 'Persetujuan Payroll', icon: Coins, description: 'Rollout gaji bulanan' },
  { to: '/director/operasional', label: 'Persetujuan Operasional', icon: FileCheck, description: 'Cuti, lembur & klaim' },
]

export default function DirectorSidebar({ user, onLogout, onClose }: DirectorSidebarProps) {
  const handleLinkClick = () => { if (onClose) onClose() }

  return (
    <div className="flex flex-col h-full justify-between font-quicksand">
      {/* Header Brand */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-3 py-2 border-b border-orange-100 pb-5">
          <Logo />
        </div>

        {/* Director Profile Card */}
        <div className="bg-orange-50/40 border border-orange-100/60 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-orange-500/10 shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden flex-1">
            <div className="flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest truncate">Direktur Utama</p>
            </div>
            <h4 className="text-xs font-bold text-slate-800 truncate mt-0.5">{user.name}</h4>
            <p className="text-[10px] text-slate-500 truncate font-medium">{user.email}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">Menu Persetujuan</p>
          {menuItems.map((item) => {
            const IconComponent = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleLinkClick}
                end={item.to === '/director/dashboard'}
                className={({ isActive }) =>
                  `w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer group ${
                    isActive
                      ? 'bg-gradient-to-r from-red-65/60 to-orange-55/60 border border-orange-100/80 text-red-600 shadow-sm'
                      : 'text-slate-600 hover:text-red-500 hover:bg-orange-50/30 border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="flex items-center gap-3">
                      <IconComponent className={`w-4 h-4 transition-colors ${isActive ? 'text-red-500' : 'text-slate-400 group-hover:text-red-500'}`} />
                      <span>{item.label}</span>
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-all duration-200 ${isActive ? 'opacity-100 text-red-500' : 'opacity-0 group-hover:opacity-100 text-slate-400'}`} />
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="pt-6 border-t border-orange-100 space-y-3">
        <div className="flex items-center gap-2 px-3 font-quicksand text-[10px] text-slate-500 font-bold">
          <ShieldCheck className="w-4 h-4 text-red-500" />
          <span className="uppercase tracking-wider text-[9px]">Akses Direktur Utama</span>
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
