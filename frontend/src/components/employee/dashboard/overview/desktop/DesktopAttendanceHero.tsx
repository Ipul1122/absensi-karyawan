import { useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronRight, Clock, Fingerprint, Home } from 'lucide-react'
import type { Attendance, AttendanceState } from '../overviewTypes'
import {
  checkInStatusLabel,
  computeDayProgress,
  formatClockTime,
  getStatusHint
} from './overviewDesktopUtils'

interface DesktopAttendanceHeroProps {
  time: Date
  todayAttendance: Attendance | null
  attendanceState: AttendanceState
  getLiveCheckInStatus: () => { text: string; colorClass: string }
  getLiveCheckOutStatus: () => { text: string; colorClass: string }
}

function ProgressRing({ value }: { value: number }) {
  const safe = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0
  const r = 42
  const c = 2 * Math.PI * r
  const offset = c - (safe / 100) * c
  return (
    <div className="relative w-[104px] h-[104px] shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="#FFE4D6" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#FF5A00"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
        <span className="text-xl font-black text-[#FF5A00] tabular-nums leading-none">{safe}%</span>
        <span className="text-[9px] font-semibold text-slate-500 leading-tight mt-1">Progress Hari Ini</span>
      </div>
    </div>
  )
}

export default function DesktopAttendanceHero({
  time,
  todayAttendance,
  attendanceState,
  getLiveCheckInStatus,
  getLiveCheckOutStatus
}: DesktopAttendanceHeroProps) {
  const navigate = useNavigate()
  const dateLabel = time.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  const hint = getStatusHint(attendanceState)
  const hintBg =
    hint.tone === 'success'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
      : hint.tone === 'warn'
        ? 'bg-amber-50 text-amber-800 border-amber-100'
        : hint.tone === 'muted'
          ? 'bg-slate-50 text-slate-600 border-slate-100'
          : 'bg-orange-50/80 text-[#C2410C] border-orange-100'

  const clockIn = todayAttendance?.clock_in ?? null
  const clockOut = todayAttendance?.clock_out ?? null
  const progress = computeDayProgress(time, clockIn, clockOut)

  const inLabel = clockIn
    ? checkInStatusLabel(todayAttendance?.status_in, getLiveCheckInStatus().text)
    : 'Belum Check In'
  const outLabel = clockOut
    ? checkInStatusLabel(todayAttendance?.status_out, getLiveCheckOutStatus().text)
    : 'Belum Check Out'

  const showCta = attendanceState === 'needs_checkin' || attendanceState === 'needs_checkout'
  const ctaLabel =
    attendanceState === 'needs_checkout' ? 'Absen Pulang (Check Out)' : 'Absen Masuk (Check In)'

  return (
    <section
      className="rounded-2xl border border-slate-100 bg-white p-6 lg:p-7 shadow-sm"
      aria-label="Presensi hari ini"
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-white border border-orange-100 flex items-center justify-center shadow-sm">
                <CalendarDays className="w-5 h-5 text-[#FF5A00]" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-800 capitalize leading-snug">{dateLabel}</p>
                <p className="text-[12px] text-slate-500 flex items-center gap-1.5 mt-0.5 tabular-nums">
                  <Clock className="w-3.5 h-3.5" />
                  {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </p>
              </div>
            </div>
            <ProgressRing value={progress} />
          </div>

          <p className={`text-[13px] leading-snug px-3.5 py-2.5 rounded-xl border ${hintBg}`}>{hint.text}</p>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/90 border border-slate-100 px-4 py-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Check In</p>
              <p className="text-lg font-black text-slate-800 tabular-nums mt-0.5">
                {formatClockTime(clockIn)}
              </p>
              <p className="text-[12px] font-semibold text-emerald-600 mt-0.5">{inLabel}</p>
            </div>
            <div className="rounded-xl bg-white/90 border border-slate-100 px-4 py-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Check Out</p>
              <p className="text-lg font-black text-slate-800 tabular-nums mt-0.5">
                {clockOut ? formatClockTime(clockOut) : '—'}
              </p>
              <p
                className={`text-[12px] font-semibold mt-0.5 ${
                  clockOut ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {outLabel}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showCta && (
        attendanceState === 'needs_checkin' ? (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => navigate('/employee/absen')}
              className="w-full flex items-center justify-center gap-2.5 h-12 rounded-xl bg-[#FF5A00] hover:bg-[#E04800] text-white text-[15px] font-bold transition-colors cursor-pointer border-none shadow-md shadow-orange-500/20"
            >
              <Fingerprint className="w-5 h-5" />
              Absen Kantor
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/employee/absen?mode=wfh')}
              className="w-full flex items-center justify-center gap-2.5 h-12 rounded-xl bg-white hover:bg-sky-50 text-sky-800 text-[15px] font-bold transition-colors cursor-pointer border border-sky-200 shadow-sm"
            >
              <Home className="w-5 h-5" />
              Absen WFH
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/employee/absen')}
            className="mt-5 w-full flex items-center justify-center gap-2.5 h-12 rounded-xl bg-[#FF5A00] hover:bg-[#E04800] text-white text-[15px] font-bold transition-colors cursor-pointer border-none shadow-md shadow-orange-500/20"
          >
            <Fingerprint className="w-5 h-5" />
            {ctaLabel}
            <ChevronRight className="w-5 h-5" />
          </button>
        )
      )}
    </section>
  )
}
