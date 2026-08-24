import { NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { 
  LogOut, 
  LayoutDashboard, 
  ChevronRight, 
  CalendarCheck,
  History,
  ShieldCheck,
  Settings,
  CalendarDays,
  ReceiptText,
  Gift,
  Coins,
  Clock,
  Building,
  Compass,
  UserCheck,
  ChevronDown,
  Briefcase,
  ClipboardList,
  User,
  Headphones
} from 'lucide-react'
import Logo from './Logo'
import { getAssetUrl } from '../../utils/api'
import { useEmployeeFaq } from '../employee/layanan/EmployeeFaqContext'

interface SubMenuItem {
  to: string
  label: string
  icon: any
}

interface MenuItem {
  to?: string
  label: string
  icon: any
  subItems?: SubMenuItem[]
}

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
  counts?: {
    pendingCutiCount: number
    pendingIzinCount: number
    pendingLemburCount: number
    pendingReimburseCount: number
    unpaidPayrollCount: number
    operasionalCount: number
  }
  company?: string
  division?: string | null
  photo?: string | null
}

export default function EmployeeSidebar({ user, onLogout, onClose, counts, company, division, photo }: EmployeeSidebarProps) {
  const location = useLocation()
  const { openEmployeeFaq } = useEmployeeFaq()
  
  const [isAbsenDropdownOpen, setIsAbsenDropdownOpen] = useState(() => {
    return location.pathname.startsWith('/employee/absen') || 
           location.pathname.startsWith('/employee/sales') || 
           location.pathname.startsWith('/employee/client')
  })
  const [isOperasionalDropdownOpen, setIsOperasionalDropdownOpen] = useState(() => {
    return location.pathname.startsWith('/employee/cuti') || 
           location.pathname.startsWith('/employee/izin') || 
           location.pathname.startsWith('/employee/reimbursement') || 
           location.pathname.startsWith('/employee/bonus') || 
           location.pathname.startsWith('/employee/lembur')
  })
  const [isPengaturanDropdownOpen, setIsPengaturanDropdownOpen] = useState(() => {
    return location.pathname.startsWith('/employee/pengaturan') || 
           location.pathname.startsWith('/employee/biodata')
  })

  useEffect(() => {
    if (
      location.pathname.startsWith('/employee/absen') || 
      location.pathname.startsWith('/employee/sales') || 
      location.pathname.startsWith('/employee/client')
    ) {
      setIsAbsenDropdownOpen(true)
    }
  }, [location.pathname])

  useEffect(() => {
    if (
      location.pathname.startsWith('/employee/cuti') || 
      location.pathname.startsWith('/employee/izin') || 
      location.pathname.startsWith('/employee/reimbursement') || 
      location.pathname.startsWith('/employee/bonus') || 
      location.pathname.startsWith('/employee/lembur')
    ) {
      setIsOperasionalDropdownOpen(true)
    }
  }, [location.pathname])

  useEffect(() => {
    if (
      location.pathname.startsWith('/employee/pengaturan') || 
      location.pathname.startsWith('/employee/biodata')
    ) {
      setIsPengaturanDropdownOpen(true)
    }
  }, [location.pathname])

  const menuItems: MenuItem[] = [
    { to: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      label: 'Absen Mandiri',
      icon: CalendarCheck,
      subItems: [
        { to: '/employee/absen', label: 'Absen Kantor', icon: Building },
        { to: '/employee/sales', label: 'Kunjungan Sales', icon: Compass },
        { to: '/employee/client', label: 'Kunjungan Klien', icon: UserCheck }
      ]
    },
    { to: '/employee/riwayat', label: 'Riwayat Absen', icon: History },
    {
      label: 'Operasional',
      icon: Briefcase,
      subItems: [
        { to: '/employee/cuti', label: 'Pengajuan Cuti', icon: CalendarDays },
        { to: '/employee/izin', label: 'Pengajuan Izin', icon: ClipboardList },
        { to: '/employee/lembur', label: 'Pengajuan Lembur', icon: Clock },
        { to: '/employee/reimbursement', label: 'Reimbursement', icon: ReceiptText },
        { to: '/employee/bonus', label: 'Bonus Saya', icon: Gift }
      ]
    },
    { to: '/employee/payroll', label: 'Slip Gaji', icon: Coins },
    {
      label: 'Pengaturan',
      icon: Settings,
      subItems: [
        { to: '/employee/pengaturan', label: 'Atur Akun', icon: User },
        { to: '/employee/biodata', label: 'Atur Biodata', icon: ClipboardList }
      ]
    }
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
          <Logo company={company} />
        </div>

        {/* Scrollable Container for Profile & Menu Items */}
        <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-6 min-h-0 sidebar-scrollbar">
          {/* User profile — mobile drawer (tetap) */}
          <div className="md:hidden bg-orange-50/40 border border-orange-100/60 rounded-2xl p-4 flex items-center gap-3 shadow-sm shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-orange-500/10">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-slate-800 truncate font-quicksand">{user.name}</h4>
              <p className="text-[10px] text-slate-500 truncate font-medium">{user.email}</p>
            </div>
          </div>

          {/* User profile — desktop sidebar (mockup) */}
          <div className="hidden md:flex bg-slate-50 border border-slate-100 rounded-2xl p-4 flex-col gap-3 shadow-sm shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0 border-2 border-white shadow-sm">
                {photo ? (
                  <img src={getAssetUrl(photo)} alt="" className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-[13px] font-bold text-slate-800 truncate leading-tight">{user.name}</h4>
                <p className="text-[11px] text-slate-500 truncate">{division || 'Karyawan'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </div>
          </div>

          {/* Menu Items */}
          <nav className="space-y-1.5 font-quicksand">
            {menuItems.map((item) => {
              if (item.subItems) {
                const IconComponent = item.icon
                const isSubActive = item.subItems?.some(sub => location.pathname === sub.to) || false
                const isOpen = 
                  item.label === 'Absen Mandiri' ? isAbsenDropdownOpen :
                  item.label === 'Operasional' ? isOperasionalDropdownOpen :
                  isPengaturanDropdownOpen
                
                let parentBadge = 0
                if (item.label === 'Operasional') {
                  parentBadge = counts?.operasionalCount || 0
                }
                
                return (
                  <div key={item.label} className="space-y-1">
                    <button
                      onClick={() => {
                        if (item.label === 'Absen Mandiri') {
                          setIsAbsenDropdownOpen(!isAbsenDropdownOpen)
                        } else if (item.label === 'Operasional') {
                          setIsOperasionalDropdownOpen(!isOperasionalDropdownOpen)
                        } else if (item.label === 'Pengaturan') {
                          setIsPengaturanDropdownOpen(!isPengaturanDropdownOpen)
                        }
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer group active:scale-[0.97] ${
                        isSubActive 
                          ? 'bg-gradient-to-r from-amber-50/60 to-orange-50/60 border border-orange-100/80 text-amber-700 shadow-sm' 
                          : 'text-slate-600 hover:text-amber-650 hover:bg-orange-50/30 border border-transparent'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <IconComponent className={`w-4 h-4 transition-colors ${isSubActive ? 'text-amber-700' : 'text-slate-400 group-hover:text-amber-600'}`} />
                        <span>{item.label}</span>
                        {parentBadge > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-red-500 text-white leading-none min-w-[16px] h-4 flex items-center justify-center">
                            {parentBadge}
                          </span>
                        )}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${isSubActive ? 'text-amber-700' : 'text-slate-400 group-hover:text-amber-600'}`} />
                    </button>
                    {isOpen && (
                      <div className="pl-6 space-y-1.5 pt-0.5 animate-fade-in">
                        {item.subItems?.map((subItem) => {
                          const SubIcon = subItem.icon
                          
                          let childBadge = 0
                          if (subItem.to === '/employee/cuti') {
                            childBadge = counts?.pendingCutiCount || 0
                          } else if (subItem.to === '/employee/izin') {
                            childBadge = counts?.pendingIzinCount || 0
                          } else if (subItem.to === '/employee/lembur') {
                            childBadge = counts?.pendingLemburCount || 0
                          } else if (subItem.to === '/employee/reimbursement') {
                            childBadge = counts?.pendingReimburseCount || 0
                          }
                          
                          return (
                            <NavLink
                              key={subItem.to}
                              to={subItem.to}
                              onClick={handleLinkClick}
                              className={({ isActive }) => `w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer group active:scale-[0.97] duration-150 ${
                                isActive 
                                  ? 'bg-gradient-to-r from-amber-50/40 to-orange-50/40 border border-orange-100/60 text-amber-700 shadow-sm scale-[1.01]' 
                                  : 'text-slate-500 hover:text-amber-600 hover:bg-orange-50/20 border border-transparent'
                              }`}
                            >
                              {({ isActive }) => (
                                <>
                                  <span className="flex items-center gap-2.5">
                                    <SubIcon className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-amber-700' : 'text-slate-400 group-hover:text-amber-600'}`} />
                                    <span>{subItem.label}</span>
                                    {childBadge > 0 && (
                                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-red-500 text-white leading-none min-w-[16px] h-4 flex items-center justify-center">
                                        {childBadge}
                                      </span>
                                    )}
                                  </span>
                                  <ChevronRight className={`w-3 h-3 transition-all ${isActive ? 'opacity-100 text-amber-700' : 'opacity-0 group-hover:opacity-100 text-slate-400'}`} />
                                </>
                              )}
                            </NavLink>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              const IconComponent = item.icon
              
              let itemBadge = 0
              if (item.to === '/employee/payroll') {
                itemBadge = counts?.unpaidPayrollCount || 0
              }
              
              return (
                <NavLink
                  key={item.to || ''}
                  to={item.to || ''}
                  onClick={handleLinkClick}
                  className={({ isActive }) => `w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer group active:scale-[0.97] duration-150 ${
                    isActive 
                      ? 'bg-gradient-to-r from-amber-50/60 to-orange-50/60 border border-orange-100/80 text-amber-700 shadow-sm md:bg-[#FF5A00] md:from-[#FF5A00] md:to-[#E04800] md:border-[#FF5A00] md:text-white md:shadow-md md:shadow-orange-500/20 scale-[1.01]' 
                      : 'text-slate-600 hover:text-amber-650 hover:bg-orange-50/30 border border-transparent'
                  }`}
                >
                  {({ isActive }) => (
                    <>
                      <span className="flex items-center gap-3">
                        <IconComponent className={`w-4 h-4 transition-colors ${isActive ? 'text-amber-700 md:text-white' : 'text-slate-400 group-hover:text-amber-600'}`} />
                        <span>{item.label}</span>
                        {itemBadge > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-red-500 text-white leading-none min-w-[16px] h-4 flex items-center justify-center">
                            {itemBadge}
                          </span>
                        )}
                      </span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-all ${isActive ? 'opacity-100 text-amber-700 md:text-white/90' : 'opacity-0 group-hover:opacity-100 text-slate-400'}`} />
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
        <div className="hidden md:block rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-orange-100 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5 text-[#FF5A00]" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-slate-800">Butuh bantuan?</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Tim HR siap membantu kendala absensi &amp; layanan.</p>
              <button
                type="button"
                onClick={() => openEmployeeFaq()}
                className="mt-2 text-[12px] font-bold text-[#FF5A00] hover:underline cursor-pointer bg-transparent border-none p-0 inline-flex items-center gap-0.5"
              >
                Hubungi Sekarang
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold px-3 md:hidden">
          <ShieldCheck className="w-4 h-4 text-amber-700" />
          <span className="font-quicksand uppercase tracking-wider text-[9px]">Akses Karyawan</span>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-100 text-slate-600 hover:text-red-600 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm font-quicksand active:scale-95 duration-150"
        >
          <LogOut className="w-4 h-4" />
          Keluar Aplikasi
        </button>
      </div>
    </div>

  )
}
