import { Bell } from 'lucide-react'
import Swal from 'sweetalert2'
import { getAssetUrl } from '../../../utils/api'
import { BRAND_ORANGE } from '../dashboard/overview/overviewTheme'
import { getFirstName, getTimeGreeting } from '../dashboard/overview/desktop/overviewDesktopUtils'

interface EmployeeDesktopPageHeaderProps {
  title: string
  subtitle?: string
  time: Date
  formatDate: (date: Date) => string
  userName: string
  division?: string | null
  photo?: string | null
  variant?: 'default' | 'dashboard'
  notificationCount?: number
}

export default function EmployeeDesktopPageHeader({
  title,
  subtitle,
  time,
  formatDate,
  userName,
  division,
  photo,
  variant = 'default',
  notificationCount = 0
}: EmployeeDesktopPageHeaderProps) {
  const initial = userName.trim().charAt(0).toUpperCase() || '?'
  const isDashboard = variant === 'dashboard'
  const firstName = getFirstName(userName)

  return (
    <header className="hidden md:flex items-center justify-between gap-6 pb-6 mb-2 border-b border-slate-200/80">
      <div className="min-w-0">
        {!isDashboard && (
          <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
            {formatDate(time)}
            <span className="mx-2 text-slate-300">·</span>
            <span className="tabular-nums normal-case text-slate-500">
              {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </p>
        )}
        <h1 className="text-2xl lg:text-[28px] font-bold text-slate-800 tracking-tight leading-snug truncate">
          {title}
        </h1>
        {isDashboard ? (
          <>
            <p className="text-base font-semibold text-slate-700 mt-1.5">{getTimeGreeting(time, firstName)}</p>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Berikut ringkasan absensi, statistik, dan informasi penting untuk Anda hari ini.
            </p>
          </>
        ) : subtitle ? (
          <p className="text-sm text-slate-500 mt-1 truncate">{subtitle}</p>
        ) : (
          <p className="text-sm text-slate-500 mt-1 truncate">
            Halo, <span className="font-semibold text-slate-700">{userName}</span>
            {division ? ` · ${division}` : ''}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() =>
            Swal.fire({
              title: 'Notifikasi',
              text: 'Tidak ada pengumuman mendesak baru.',
              icon: 'info',
              confirmButtonColor: BRAND_ORANGE
            })
          }
          className="relative p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:bg-orange-50/50 hover:text-[#FF5A00] transition-colors cursor-pointer"
          aria-label="Notifikasi"
        >
          <Bell className="w-5 h-5" />
          {notificationCount > 0 ? (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          ) : (
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF5A00] rounded-full border border-white" />
          )}
        </button>

        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="text-right hidden lg:block max-w-[200px]">
            <p className="text-sm font-bold text-slate-800 truncate">{userName}</p>
            {division ? (
              <p className="text-[11px] text-slate-500 truncate">{division}</p>
            ) : null}
          </div>
          <div className="w-11 h-11 rounded-full border-2 border-orange-100 bg-orange-50 overflow-hidden flex items-center justify-center shrink-0">
            {photo ? (
              <img src={getAssetUrl(photo)} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-[#FF5A00]">{initial}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
