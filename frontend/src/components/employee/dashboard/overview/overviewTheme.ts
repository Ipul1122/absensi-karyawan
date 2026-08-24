export const PAGE_BG = '#F5F6FA'
export const BRAND_ORANGE = '#FF5A00'

/** Latar desktop shell karyawan — banner & main memakai warna sama */
export const EMPLOYEE_DESKTOP_SURFACE = PAGE_BG

export const overviewLayout = {
  /** Mobile: sempit & full-bleed header · Desktop: lebar penuh area main (sidebar terpisah) */
  page: 'w-full max-w-md md:max-w-none mx-auto font-sans min-h-screen md:min-h-0 pb-8 md:pb-0 flex flex-col w-full',
  content:
    'px-4 md:px-0 flex flex-col gap-6 flex-1 w-full max-w-md md:max-w-none mx-auto md:max-w-6xl lg:max-w-[72rem]',
  contentBlock: 'flex flex-col gap-6 md:gap-8',
  section: 'flex flex-col gap-3',
  card: 'bg-white rounded-[20px] border border-slate-100',
  cardShadow: '0 4px 24px rgba(0,0,0,0.07)',
  cardShadowSoft: '0 4px 16px rgba(0,0,0,0.05)',
  /** 2 kolom di mobile/tablet sempit (max-w-md), 4 kolom saat lebar konten md+ */
  iconGrid: 'grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4',
  iconGridButton:
    'w-full min-h-[6.75rem] sm:min-h-[7rem] md:min-h-[7.5rem] p-3 sm:p-4 flex flex-col items-center justify-center gap-2 sm:gap-2.5',
  iconGridLabel:
    'w-full text-[11px] sm:text-[12px] font-bold text-slate-600 text-center leading-snug line-clamp-2 min-h-[2.5rem] flex items-center justify-center px-1',
} as const

export const overviewTypography = {
  sectionLabel: 'text-[12px] font-bold text-slate-500 uppercase tracking-wider',
  sectionLink: 'text-[14px] font-bold text-[#FF5A00] hover:underline cursor-pointer bg-transparent border-none inline-flex items-center gap-0.5',
} as const
