import { ArrowRight, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getAssetUrl } from '../../../utils/api'
import { getFirstName } from '../dashboard/overview/desktop/overviewDesktopUtils'
import { BRAND_ORANGE, EMPLOYEE_DESKTOP_SURFACE } from '../dashboard/overview/overviewTheme'

interface EmployeeDesktopDashboardBannerProps {
  time: Date
  userName: string
  photo?: string | null
}

function getGreeting(time: Date): string {
  const hrs = time.getHours()
  if (hrs < 12) return 'Selamat Pagi'
  if (hrs < 15) return 'Selamat Siang'
  if (hrs < 18) return 'Selamat Sore'
  return 'Selamat Malam'
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

export default function EmployeeDesktopDashboardBanner({
  time,
  userName,
  photo
}: EmployeeDesktopDashboardBannerProps) {
  const navigate = useNavigate()
  const firstName = getFirstName(userName)
  const weekday = time.toLocaleDateString('id-ID', { weekday: 'long' })
  const dateLong = time.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <div
      className="hidden md:block relative overflow-hidden rounded-[24px] px-5 py-5 lg:px-6 lg:py-6 mb-6 lg:mb-8 border border-slate-200/60 select-none"
      style={{ backgroundColor: EMPLOYEE_DESKTOP_SURFACE }}
      aria-label="Banner dashboard karyawan"
    >
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div className="flex items-center gap-4 lg:gap-5 min-w-0 flex-1">
          <div className="relative shrink-0">
            {photo ? (
              <img
                src={getAssetUrl(photo)}
                alt=""
                className="w-14 h-14 lg:w-16 lg:h-16 rounded-full border-2 border-white shadow-md object-cover"
              />
            ) : (
              <div
                className="w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center text-white font-black text-lg lg:text-xl shadow-md"
                style={{ backgroundColor: BRAND_ORANGE }}
              >
                {getInitials(userName)}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-4 h-4 lg:w-5 lg:h-5 bg-[#22C55E] border-2 border-white rounded-full flex items-center justify-center shadow-sm">
              <span className="w-1.5 h-1.5 bg-white rounded-full" />
            </span>
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <h1 className="text-lg lg:text-[22px] xl:text-2xl font-black text-[#0F172A] capitalize leading-tight tracking-tight">
              {getGreeting(time)}, {firstName}! 👋
            </h1>
            <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
              Kelola dan pantau absensi, cuti, izin, serta layanan HR Anda secara realtime dengan mudah.
            </p>
            <button
              type="button"
              onClick={() => navigate('/employee/absen')}
              className="mt-3 px-5 py-2.5 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all shadow-[0_4px_12px_rgba(255,90,0,0.22)] cursor-pointer active:scale-95 hover:opacity-95"
              style={{ backgroundColor: BRAND_ORANGE }}
            >
              Absen Anda
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[20px] p-4 lg:p-5 flex items-center gap-4 w-full sm:w-[236px] xl:w-[240px] shadow-sm shrink-0">
          <div className="p-2.5 lg:p-3 bg-orange-50 rounded-xl shrink-0" style={{ color: BRAND_ORANGE }}>
            <Calendar className="w-5 h-5 lg:w-6 lg:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-none">
              Hari Ini
            </span>
            <span className="text-sm lg:text-base font-extrabold text-slate-800 block mt-2 leading-none capitalize">
              {weekday},
            </span>
            <span
              className="text-sm lg:text-base font-black block mt-1.5 leading-snug capitalize"
              style={{ color: BRAND_ORANGE }}
            >
              {dateLong}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
