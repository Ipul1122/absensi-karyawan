import { useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { CalendarDays, Clock, FileText, Users } from 'lucide-react'
import type { Attendance } from '../overviewTypes'
import { computeMonthStats } from './overviewDesktopUtils'
import { overviewTypography } from '../overviewTheme'

interface DesktopStatsRowProps {
  history: Attendance[]
  time: Date
  izinDays: number
  cutiDays: number
}

function StatCard({
  icon: Icon,
  iconWrapClass,
  iconClass,
  count,
  label,
  sub,
  barPct,
  barClass
}: {
  icon: LucideIcon
  iconWrapClass: string
  iconClass: string
  count: number | string
  label: string
  sub: string
  barPct: number
  barClass: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm min-w-0 flex flex-col">
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconWrapClass}`}
        >
          <Icon className={`w-5 h-5 ${iconClass}`} strokeWidth={2} />
        </div>
        <div className="min-w-0 pt-0.5">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[26px] font-black text-slate-800 tabular-nums leading-none">
              {count}
            </span>
            <span className="text-[13px] font-bold text-slate-600">{label}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">{sub}</p>
        </div>
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClass}`}
          style={{ width: `${Math.min(100, Math.max(0, barPct))}%` }}
        />
      </div>
    </div>
  )
}

export default function DesktopStatsRow({ history, time, izinDays, cutiDays }: DesktopStatsRowProps) {
  const navigate = useNavigate()
  const { hadir, hadirPct, targetDays, jamLembur } = computeMonthStats(history, time)
  const izinPct = targetDays > 0 ? Math.round((izinDays / targetDays) * 1000) / 10 : 0
  const cutiPct = targetDays > 0 ? Math.round((cutiDays / targetDays) * 1000) / 10 : 0

  const monthYear = time.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  const monthTitle = monthYear.charAt(0).toUpperCase() + monthYear.slice(1)

  const jamDisplay = Number.isFinite(jamLembur)
    ? Number.isInteger(jamLembur)
      ? jamLembur
      : jamLembur.toFixed(1)
    : '0'
  const lemburBarPct = Number.isFinite(jamLembur) ? Math.min(100, (jamLembur / 40) * 100) : 0

  return (
    <section aria-label="Statistik saya">
      <div className="flex items-center justify-between gap-3 min-h-6">
        <h2 className="text-[15px] font-bold text-slate-800 tracking-tight">
          Statistik Saya ({monthTitle})
        </h2>
        <button
          type="button"
          onClick={() => navigate('/employee/riwayat')}
          className={overviewTypography.sectionLink}
        >
          Lihat Semua <span className="text-base leading-none">›</span>
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mt-4">
        <StatCard
          icon={Users}
          iconWrapClass="bg-emerald-50"
          iconClass="text-emerald-600"
          count={hadir}
          label="Hadir"
          sub={`${hadirPct}% dari target`}
          barPct={hadirPct}
          barClass="bg-emerald-500"
        />
        <StatCard
          icon={FileText}
          iconWrapClass="bg-blue-50"
          iconClass="text-blue-600"
          count={izinDays}
          label="Izin"
          sub={`${izinPct}% dari total hari`}
          barPct={izinPct}
          barClass="bg-blue-500"
        />
        <StatCard
          icon={CalendarDays}
          iconWrapClass="bg-orange-50"
          iconClass="text-[#FF5A00]"
          count={cutiDays}
          label="Cuti"
          sub={`${cutiPct}% dari total hari`}
          barPct={cutiPct}
          barClass="bg-[#FF5A00]"
        />
        <StatCard
          icon={Clock}
          iconWrapClass="bg-violet-50"
          iconClass="text-violet-600"
          count={jamDisplay}
          label="Jam"
          sub="Total lembur bulan ini"
          barPct={lemburBarPct}
          barClass="bg-violet-500"
        />
      </div>
    </section>
  )
}
