import { NavLink } from 'react-router-dom'
import { 
  LogOut, 
  ShieldCheck, 
  LayoutDashboard, 
  FileCheck,
  Wallet,
  Coins,
  ChevronRight,
  Crown,
  Clock,
  Users
} from 'lucide-react'
import Logo from './Logo'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'employee' | 'director'
  company?: string
}

interface DirectorSidebarProps {
  user: User
  onLogout: () => void
  onClose?: () => void
  pendingKaryawanCount?: number
  pendingGajiCount?: number
  pendingPayrollCount?: number
  pendingOperasionalCount?: number
}

const menuItems = [
  { to: '/director/dashboard', label: 'Overview', icon: LayoutDashboard, description: 'Ringkasan persetujuan' },
  { to: '/director/karyawan', label: 'Kelola Karyawan', icon: Users, description: 'Daftar & persetujuan staf' },
  { to: '/director/gaji', label: 'Informasi Gaji', icon: Wallet, description: 'Penyesuaian kompensasi' },
  { to: '/director/payroll', label: 'Bayar Gaji', icon: Coins, description: 'Rollout gaji bulanan' },
  { to: '/director/operasional', label: 'Biaya Operasional', icon: FileCheck, description: 'Cuti, lembur & klaim' },
  { to: '/director/log-kehadiran', label: 'Log Kehadiran', icon: Clock, description: 'Aktivitas absensi staf' },
]

export default function DirectorSidebar({ 
  user, 
  onLogout, 
  onClose, 
  pendingKaryawanCount = 0,
  pendingGajiCount = 0,
  pendingPayrollCount = 0,
  pendingOperasionalCount = 0
}: DirectorSidebarProps) {
  const handleLinkClick = () => { if (onClose) onClose() }

  return (
    <div className="flex flex-col h-full justify-between font-quicksand">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Header Brand */}
        <div className="flex items-center gap-3 px-3 py-2 border-b border-orange-100 pb-5 shrink-0">
          <Logo company={user.company} />
        </div>

        {/* Scrollable Container for Profile & Menu Items */}
        <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-6 min-h-0 sidebar-scrollbar">
          {/* Director Profile Card */}
          <div className="bg-orange-50/40 border border-orange-100/60 rounded-2xl p-4 flex items-center gap-3 shadow-sm shrink-0">
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
              const isEmployeeApproval = item.to === '/director/karyawan'
              const isSalaryApproval = item.to === '/director/gaji'
              const isPayrollApproval = item.to === '/director/payroll'
              const isOperationalApproval = item.to === '/director/operasional'

              const badgeCount = isEmployeeApproval 
                ? pendingKaryawanCount 
                : isSalaryApproval 
                  ? pendingGajiCount 
                  : isPayrollApproval
                    ? pendingPayrollCount
                    : isOperationalApproval
                      ? pendingOperasionalCount
                      : 0

              const showBadge = badgeCount > 0

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={handleLinkClick}
                  end={item.to === '/director/dashboard'}
                  className={({ isActive }) =>
                    `w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer group ${
                      isActive
                        ? 'bg-gradient-to-r from-red-100/60 to-orange-50/60 border border-orange-100/80 text-red-600 shadow-sm'
                        : 'text-slate-600 hover:text-red-500 hover:bg-orange-50/30 border border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="flex items-center gap-3">
                        <IconComponent className={`w-4 h-4 transition-colors ${isActive ? 'text-red-500' : 'text-slate-400 group-hover:text-red-500'}`} />
                        <span>{item.label}</span>
                        {showBadge && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-red-500 text-white leading-none min-w-[16px] h-4 flex items-center justify-center">
                            {badgeCount}
                          </span>
                        )}
                      </span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-all duration-200 ${isActive ? 'opacity-100 text-red-500' : 'opacity-0 group-hover:opacity-100 text-slate-400'}`} />
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-orange-100 space-y-3 shrink-0">
        <div className="flex items-center gap-2 px-3 font-quicksand text-[10px] text-slate-500 font-bold">
          <ShieldCheck className="w-4 h-4 text-red-500" />
          <span className="uppercase tracking-wider text-[9px]">Akses Direktur Utama</span>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-100 text-slate-600 hover:text-red-600 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm font-quicksand"
        >
          <LogOut className="w-4 h-4" />
          Keluar Aplikasi
        </button>
      </div>
    </div>

  )
}
