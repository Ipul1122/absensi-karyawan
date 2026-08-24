import { useNavigate } from 'react-router-dom'
import { Building2, CalendarDays, ChevronRight, Clock, HelpCircle, History, Home } from 'lucide-react'
import { useEmployeeFaq } from '../../layanan/EmployeeFaqContext'
import type { AttendanceState } from './overviewTypes'
import { overviewLayout } from './overviewTheme'

interface OverviewQuickAccessProps {
  time: Date
  attendanceState: AttendanceState
}

const QUICK_LINKS = [
  { label: 'Absen Kantor', path: '/employee/absen', icon: Building2 },
  { label: 'Absen WFH', path: '/employee/absen?mode=wfh', icon: Home },
  { label: 'Riwayat', path: '/employee/riwayat', icon: History },
  { label: 'Ajukan Cuti', path: '/employee/cuti', icon: CalendarDays },
  { label: 'FAQ', action: 'faq' as const, icon: HelpCircle }
] as const

function getStatusHint(state: AttendanceState): { text: string; tone: 'default' | 'success' | 'warn' | 'muted' } {
  switch (state) {
    case 'needs_checkin':
      return { text: 'Anda belum absen masuk hari ini.', tone: 'warn' }
    case 'needs_checkout':
      return { text: 'Sudah check in — jangan lupa check out saat pulang.', tone: 'success' }
    case 'completed':
      return { text: 'Presensi hari ini sudah lengkap.', tone: 'muted' }
    case 'day_off':
      return { text: 'Jadwal libur — gunakan absen lembur jika Anda bekerja.', tone: 'default' }
    default:
      return { text: 'Kelola absensi dan layanan karyawan dari sini.', tone: 'default' }
  }
}

const hintStyles = {
  warn: 'bg-amber-50 text-amber-800 border-amber-100',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-100',
  muted: 'bg-slate-50 text-slate-600 border-slate-100',
  default: 'bg-orange-50 text-[#C2410C] border-orange-100'
}

export default function OverviewQuickAccess({ time, attendanceState }: OverviewQuickAccessProps) {
  const navigate = useNavigate()
  const { openEmployeeFaq } = useEmployeeFaq()
  const dateLabel = time.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  const hint = getStatusHint(attendanceState)

  return (
    <section
      className={`${overviewLayout.card} p-4 sm:p-5 space-y-4`}
      style={{ boxShadow: overviewLayout.cardShadowSoft }}
      aria-label="Akses cepat dashboard"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-[#FF5A00]" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide">Hari ini</p>
            <p className="text-[14px] sm:text-[15px] font-bold text-slate-800 leading-snug capitalize">{dateLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-slate-500 shrink-0 tabular-nums">
          <Clock className="w-4 h-4" />
          <span className="text-[13px] font-semibold">
            {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      <p className={`text-[13px] leading-snug px-3 py-2 rounded-xl border ${hintStyles[hint.tone]}`}>{hint.text}</p>

      <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar -mx-0.5 px-0.5">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon
          const key = 'path' in link ? link.path : link.label
          return (
          <button
            key={key}
            type="button"
            onClick={() => ('action' in link && link.action === 'faq' ? openEmployeeFaq() : navigate((link as { path: string }).path))}
            className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#F8FAFC] border border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-orange-50 hover:border-orange-200 hover:text-[#FF5A00] transition-colors cursor-pointer active:scale-[0.98]"
          >
            <Icon className="w-4 h-4 shrink-0" />
            {link.label}
          </button>
        )})}
      </div>

      {(attendanceState === 'needs_checkin' || attendanceState === 'needs_checkout') && (
        attendanceState === 'needs_checkin' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => navigate('/employee/absen')}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl bg-[#FF5A00] hover:bg-[#E04800] text-white text-[14px] font-bold transition-colors cursor-pointer border-none active:scale-[0.98]"
            >
              <Building2 className="w-4 h-4" />
              Absen Kantor
            </button>
            <button
              type="button"
              onClick={() => navigate('/employee/absen?mode=wfh')}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl bg-white hover:bg-sky-50 text-sky-800 text-[14px] font-bold transition-colors cursor-pointer border border-sky-200 active:scale-[0.98]"
            >
              <Home className="w-4 h-4" />
              Absen WFH
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/employee/absen')}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl bg-[#FF5A00] hover:bg-[#E04800] text-white text-[14px] font-bold transition-colors cursor-pointer border-none active:scale-[0.98]"
          >
            Lanjut ke Check Out
            <ChevronRight className="w-4 h-4" />
          </button>
        )
      )}
    </section>
  )
}
