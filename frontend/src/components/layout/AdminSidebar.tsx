import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  LogOut, 
  Users, 
  ShieldCheck, 
  LayoutDashboard, 
  ChevronRight,
  ChevronDown,
  Clock,
  CalendarDays,
  Package,
  ReceiptText,
  Settings,
  Gift,
  Coins,
  Wallet,
  ClipboardList
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
  counts?: {
    pendingCutiCount: number
    pendingReimburseCount: number
    pendingLemburCount: number
    unpaidPayrollCount: number
    operasionalCount: number
    pendingKaryawanCount: number
  }
}

export default function AdminSidebar({ user, onLogout, onClose, counts }: AdminSidebarProps) {
  const location = useLocation()
  
  const [isDataKaryawanOpen, setIsDataKaryawanOpen] = useState(() => {
    return (
      location.pathname === '/admin/akunKaryawan' ||
      location.pathname === '/admin/rekapAbsensi'
    )
  })

  const [isOperasionalOpen, setIsOperasionalOpen] = useState(() => {
    return [
      '/admin/cuti',
      '/admin/inventaris',
      '/admin/reimbursement',
      '/admin/bonus',
      '/admin/lembur'
    ].includes(location.pathname)
  })

  const [isGajiOpen, setIsGajiOpen] = useState(() => {
    return [
      '/admin/payroll-config',
      '/admin/payroll'
    ].includes(location.pathname)
  })

  useEffect(() => {
    if (
      location.pathname === '/admin/akunKaryawan' ||
      location.pathname === '/admin/rekapAbsensi'
    ) {
      setIsDataKaryawanOpen(true)
    }
    if (
      [
        '/admin/cuti',
        '/admin/inventaris',
        '/admin/reimbursement',
        '/admin/bonus',
        '/admin/lembur'
      ].includes(location.pathname)
    ) {
      setIsOperasionalOpen(true)
    }
    if (
      [
        '/admin/payroll-config',
        '/admin/payroll'
      ].includes(location.pathname)
    ) {
      setIsGajiOpen(true)
    }
  }, [location.pathname])

  const menuItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      label: 'Data Karyawan',
      icon: Users,
      children: [
        { to: '/admin/akunKaryawan', label: 'Akun', icon: Users },
        { to: '/admin/rekapAbsensi', label: 'Rekap Absensi', icon: Clock },
      ]
    },
    {
      label: 'Operasional',
      icon: ClipboardList,
      children: [
        { to: '/admin/cuti', label: 'Cuti', icon: CalendarDays },
        { to: '/admin/inventaris', label: 'Inventaris', icon: Package },
        { to: '/admin/reimbursement', label: 'Reimburse', icon: ReceiptText },
        { to: '/admin/bonus', label: 'Bonus', icon: Gift },
        { to: '/admin/lembur', label: 'Lembur', icon: Clock },
      ]
    },
    {
      label: 'Gaji',
      icon: Wallet,
      children: [
        { to: '/admin/payroll-config', label: 'Setelan Gaji', icon: Wallet },
        { to: '/admin/payroll', label: 'Bayar Gaji', icon: Coins },
      ]
    },
    { to: '/admin/lokasiKantor', label: 'Pengaturan', icon: Settings },
  ]

  const handleLinkClick = () => {
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-3 py-2 border-b border-orange-100 pb-5 shrink-0">
          <Logo />
        </div>

        {/* Scrollable Container for Profile & Menu Items */}
        <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-6 min-h-0 sidebar-scrollbar">
          {/* User profile brief */}
          <div className="bg-gradient-to-tr from-red-500/5 to-orange-500/5 border border-orange-100/60 rounded-2xl p-4 flex items-center gap-3 shadow-sm shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-orange-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-red-500/10">
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
              if (item.children) {
                const IconComponent = item.icon
                const isChildActive = item.children.some(child => location.pathname === child.to)
                
                let isOpen = false
                let toggleOpen = () => {}
                
                if (item.label === 'Data Karyawan') {
                  isOpen = isDataKaryawanOpen
                  toggleOpen = () => setIsDataKaryawanOpen(!isDataKaryawanOpen)
                } else if (item.label === 'Operasional') {
                  isOpen = isOperasionalOpen
                  toggleOpen = () => setIsOperasionalOpen(!isOperasionalOpen)
                } else if (item.label === 'Gaji') {
                  isOpen = isGajiOpen
                  toggleOpen = () => setIsGajiOpen(!isGajiOpen)
                }
                
                return (
                  <div key={item.label} className="space-y-1">
                    <button
                      onClick={toggleOpen}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer group border border-transparent ${
                        isChildActive
                          ? 'text-red-600 bg-orange-50/30'
                          : 'text-slate-600 hover:text-red-600 hover:bg-orange-50/40'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <IconComponent className={`w-4.5 h-4.5 transition-colors ${isChildActive ? 'text-red-600' : 'text-slate-400 group-hover:text-red-500'}`} />
                        <span>{item.label}</span>
                        {item.label === 'Data Karyawan' && (counts?.pendingKaryawanCount ?? 0) > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-red-500 text-white leading-none min-w-[16px] h-4 flex items-center justify-center">
                            {counts?.pendingKaryawanCount}
                          </span>
                        )}
                        {item.label === 'Operasional' && (counts?.operasionalCount ?? 0) > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-red-500 text-white leading-none min-w-[16px] h-4 flex items-center justify-center">
                            {counts?.operasionalCount}
                          </span>
                        )}
                        {item.label === 'Gaji' && (counts?.unpaidPayrollCount ?? 0) > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-red-500 text-white leading-none min-w-[16px] h-4 flex items-center justify-center">
                            {counts?.unpaidPayrollCount}
                          </span>
                        )}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${isChildActive ? 'text-red-600' : 'text-slate-400 group-hover:text-red-500'}`} />
                    </button>
                    
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                      }`}
                    >
                      <div className="pl-6 border-l border-orange-100 ml-6 mt-1 space-y-1">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon
                          
                          let childBadge = 0
                          if (child.to === '/admin/akunKaryawan') {
                            childBadge = counts?.pendingKaryawanCount ?? 0
                          } else if (child.to === '/admin/cuti') {
                            childBadge = counts?.pendingCutiCount ?? 0
                          } else if (child.to === '/admin/reimbursement') {
                            childBadge = counts?.pendingReimburseCount ?? 0
                          } else if (child.to === '/admin/lembur') {
                            childBadge = counts?.pendingLemburCount ?? 0
                          } else if (child.to === '/admin/payroll') {
                            childBadge = counts?.unpaidPayrollCount ?? 0
                          }
                          
                          return (
                            <NavLink
                              key={child.to}
                              to={child.to}
                              onClick={handleLinkClick}
                              className={({ isActive }) => `w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                                isActive 
                                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md shadow-red-500/15' 
                                  : 'text-slate-600 hover:text-red-600 hover:bg-orange-50/40 border border-transparent'
                              }`}
                            >
                              {({ isActive }) => (
                                <>
                                  <span className="flex items-center gap-2.5">
                                    <ChildIcon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-red-500'}`} />
                                    <span>{child.label}</span>
                                    {childBadge > 0 && (
                                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none min-w-[16px] h-4 flex items-center justify-center ${
                                        isActive ? 'bg-white text-red-600' : 'bg-red-500 text-white'
                                      }`}>
                                        {childBadge}
                                      </span>
                                    )}
                                  </span>
                                  <ChevronRight className={`w-3.5 h-3.5 transition-all ${isActive ? 'opacity-100 text-white' : 'opacity-0 group-hover:opacity-100 text-slate-400'}`} />
                                </>
                              )}
                            </NavLink>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              }

              const IconComponent = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to!}
                  onClick={handleLinkClick}
                  className={({ isActive }) => `w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                    isActive 
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md shadow-red-500/15' 
                      : 'text-slate-600 hover:text-red-600 hover:bg-orange-50/40 border border-transparent'
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
      </div>

      {/* Bottom Actions */}
      <div className="pt-4 border-t border-orange-100 space-y-3 shrink-0">
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold px-3 font-quicksand">
          <ShieldCheck className="w-4.5 h-4.5 text-red-600 animate-pulse" />
          <span className="uppercase tracking-wider text-[9px]">Akses Admin Utama</span>
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
