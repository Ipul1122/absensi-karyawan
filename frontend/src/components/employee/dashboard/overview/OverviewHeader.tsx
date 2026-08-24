import { Bell, Building2, Menu } from 'lucide-react'
import Swal from 'sweetalert2'
import { getAssetUrl } from '../../../../utils/api'
import { BRAND_ORANGE, PAGE_BG } from './overviewTheme'

type LogoPlacement = 'center' | 'start'

function HeaderLogo({ company, placement = 'center' }: { company?: string | null; placement?: LogoPlacement }) {
  const isYPI = company === 'PT Yasodana Parvez Internasional'
  const isCPI = company === 'PT Cakrawala Parama Internasional'
  const align = placement === 'start' ? 'items-center' : 'items-center justify-center'
  const textAlign = placement === 'start' ? 'text-left' : 'text-center sm:text-left'

  if (isYPI || isCPI) {
    const logoSrc = isYPI ? '/logo/LOGO-YPI.png' : '/logo/LOGO-CPI.png'
    const line1 = isYPI ? 'Yasodana Parvez' : 'Cakrawala Parama'
    return (
      <div className={`flex ${align} gap-2 min-w-0 max-w-full pointer-events-none`}>
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/25 flex items-center justify-center shrink-0 p-0.5">
          <img src={logoSrc} alt="" className="w-full h-full object-contain brightness-0 invert" />
        </div>
        <div className={`min-w-0 ${textAlign} leading-[1.15]`}>
          <p className="text-[9px] sm:text-[10px] md:text-xs font-black text-white uppercase tracking-wide truncate">
            {line1}
          </p>
          <p className="text-[8px] sm:text-[9px] md:text-[10px] font-semibold text-white/75 uppercase tracking-widest truncate">
            Internasional
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${align} gap-2 min-w-0 pointer-events-none`}>
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/25 flex items-center justify-center shrink-0">
        <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </div>
      <p className="text-[10px] sm:text-[11px] md:text-xs font-black text-white uppercase tracking-wide truncate">
        HCMS Portal
      </p>
    </div>
  )
}

export interface OverviewPageContext {
  title: string
  subtitle?: string
}

export type OverviewHeaderVariant = 'home' | 'main' | 'feature'

interface OverviewHeaderProps {
  userName: string
  division?: string | null
  company?: string | null
  photo?: string | null
  onOpenMenu?: () => void
  variant?: OverviewHeaderVariant
  /** Judul halaman di bawah sapaan (main) atau sebagai judul utama (feature) */
  pageContext?: OverviewPageContext | null
}

function HeaderAvatar({ photo, name }: { photo?: string | null; name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  return (
    <div
      className="w-12 h-12 sm:w-14 sm:h-14 md:w-[3.75rem] md:h-[3.75rem] rounded-full border-2 border-white/50 bg-white/20 shrink-0 overflow-hidden shadow-lg shadow-black/10 flex items-center justify-center"
      aria-hidden
    >
      {photo ? (
        <img src={getAssetUrl(photo)} alt={`Foto ${name}`} className="w-full h-full object-cover" />
      ) : (
        <span className="text-lg sm:text-xl font-bold text-white">{initial}</span>
      )}
    </div>
  )
}

function formatDivisionLabel(division?: string | null) {
  if (!division) return 'IT Department'
  const trimmed = division.trim()
  if (trimmed.length <= 4 && !trimmed.includes(' ')) {
    return trimmed.toUpperCase() === trimmed ? `${trimmed} Department` : trimmed
  }
  return trimmed
}

export default function OverviewHeader({
  userName,
  division,
  company,
  photo,
  onOpenMenu,
  variant = 'home',
  pageContext
}: OverviewHeaderProps) {
  return (
    <header
      className="relative w-full overflow-hidden text-white select-none shrink-0 md:rounded-t-2xl"
      style={{ background: `linear-gradient(140deg, #FF7020 0%, ${BRAND_ORANGE} 55%, #E84000 100%)` }}
    >
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none bg-white/12 md:w-64 md:h-64" />
      <div className="absolute top-6 right-4 w-28 h-28 rounded-full pointer-events-none bg-white/8" />

      <div className="relative mx-auto w-full max-w-md md:max-w-4xl px-4 pt-6 pb-5 sm:pt-7 sm:pb-6 md:px-8 md:pt-8 md:pb-7">
        {/* Toolbar responsif: mobile = menu | logo tengah | bell · desktop = logo kiri | bell kanan */}
        <div className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center gap-1 sm:gap-2 min-h-11 md:flex md:justify-between md:gap-4">
          <div className="flex justify-start md:min-w-0 md:flex-1">
            <button
              type="button"
              onClick={onOpenMenu}
              className="md:hidden p-2 -ml-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer active:scale-95 bg-transparent border-none text-white"
              aria-label="Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex min-w-0 max-w-full">
              <HeaderLogo company={company} placement="start" />
            </div>
          </div>

          <div className="flex justify-center min-w-0 px-0.5 sm:px-1 md:hidden">
            <HeaderLogo company={company} placement="center" />
          </div>

          <div className="flex justify-end md:shrink-0">
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
              className="relative p-2 -mr-2 md:mr-0 hover:bg-white/10 rounded-xl transition-colors cursor-pointer active:scale-95 bg-transparent border-none text-white"
              aria-label="Notifikasi"
            >
              <Bell className="w-6 h-6" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full border border-white/80" />
            </button>
          </div>
        </div>

        {variant === 'feature' && pageContext ? (
          <div className="mt-4 sm:mt-5 md:mt-6 flex items-start gap-3 sm:gap-4 min-w-0 max-w-full md:max-w-2xl">
            <HeaderAvatar photo={photo} name={userName} />
            <div className="min-w-0 flex-1 space-y-1 pt-0.5">
              <h1 className="text-[20px] sm:text-[22px] md:text-[24px] font-bold leading-snug tracking-tight text-white">
                {pageContext.title}
              </h1>
              {pageContext.subtitle ? (
                <p className="text-[12px] sm:text-[13px] font-medium text-white/75 leading-snug">
                  {pageContext.subtitle}
                </p>
              ) : null}
              <p className="text-[13px] text-white/85 pt-1 truncate">{userName}</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 sm:mt-5 md:mt-6 space-y-2 max-w-full md:max-w-2xl">
            <p className="text-[14px] md:text-[15px] font-normal text-white/85">Hello,</p>
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <HeaderAvatar photo={photo} name={userName} />
              <h1 className="text-[22px] sm:text-[24px] md:text-[28px] font-bold leading-snug tracking-tight line-clamp-2 md:line-clamp-none min-w-0 flex-1">
                {userName}
              </h1>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 max-w-full">
              <Building2 className="w-3.5 h-3.5 text-white/90 shrink-0" />
              <p className="text-[13px] md:text-[14px] font-medium text-white/95 truncate">
                {formatDivisionLabel(division)}
              </p>
            </div>
            {variant === 'main' && pageContext && (
              <div className="pt-3 mt-1 border-t border-white/15 space-y-0.5">
                <p className="text-[16px] sm:text-[17px] font-bold text-white leading-snug">{pageContext.title}</p>
                {pageContext.subtitle ? (
                  <p className="text-[12px] sm:text-[13px] font-medium text-white/75">{pageContext.subtitle}</p>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="h-3 sm:h-4 pointer-events-none md:h-5">
        <svg viewBox="0 0 375 16" preserveAspectRatio="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 16 Q93.75 4 187.5 10 Q281.25 16 375 8 L375 16 Z" fill={PAGE_BG} />
        </svg>
      </div>
    </header>
  )
}
