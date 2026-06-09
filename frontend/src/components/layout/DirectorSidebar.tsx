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
    <div className="flex flex-col h-full justify-between" style={{ fontFamily: "'Inter', 'system-ui', sans-serif" }}>
      {/* Header Brand */}
      <div className="space-y-5">
        <div className="flex items-center gap-3 pb-5 border-b border-white/10">
          <Logo />
        </div>

        {/* Director Profile Card */}
        <div
          className="relative overflow-hidden rounded-2xl p-4"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-base shadow-lg shrink-0"
              style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="flex items-center gap-1.5">
                <Crown className="w-3 h-3 text-amber-300 shrink-0" />
                <p className="text-[9px] font-black text-amber-300 uppercase tracking-widest truncate">Direktur Utama</p>
              </div>
              <h4 className="text-xs font-bold text-white truncate mt-0.5">{user.name}</h4>
              <p className="text-[10px] text-white/50 truncate font-medium">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest px-3 mb-2">Menu Persetujuan</p>
          {menuItems.map((item) => {
            const IconComponent = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleLinkClick}
                end={item.to === '/director/dashboard'}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'text-white shadow-lg'
                      : 'text-white/60 hover:text-white hover:bg-white/8'
                  }`
                }
                style={({ isActive }) => isActive ? {
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.10) 100%)',
                  border: '1px solid rgba(255,255,255,0.20)',
                  backdropFilter: 'blur(10px)'
                } : {}}
              >
                {({ isActive }) => (
                  <>
                    <span className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg transition-all duration-200 ${isActive ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <span className="leading-tight">{item.label}</span>
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-all duration-200 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1 group-hover:opacity-40 group-hover:translate-x-0'}`} />
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-white/10 space-y-3">
        <div className="flex items-center gap-2 px-3">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Akses Terautentikasi</span>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer text-white/60 hover:text-white hover:bg-white/8"
        >
          <LogOut className="w-3.5 h-3.5" />
          Keluar dari Aplikasi
        </button>
      </div>
    </div>
  )
}
