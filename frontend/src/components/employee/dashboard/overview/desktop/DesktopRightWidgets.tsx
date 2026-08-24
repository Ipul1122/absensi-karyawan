import { useMemo, useState } from 'react'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Video,
  Wallet
} from 'lucide-react'
import type { Attendance } from '../overviewTypes'
import { formatClockTime } from './overviewDesktopUtils'
import { DESKTOP_AGENDA } from '../overviewData'

interface DesktopRightWidgetsProps {
  time: Date
  todayAttendance: Attendance | null
  officeName?: string | null
}

const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export default function DesktopRightWidgets({ time, todayAttendance, officeName }: DesktopRightWidgetsProps) {
  const [viewMonth, setViewMonth] = useState(() => new Date(time.getFullYear(), time.getMonth(), 1))

  const calendarCells = useMemo(() => {
    const y = viewMonth.getFullYear()
    const m = viewMonth.getMonth()
    const first = new Date(y, m, 1)
    const startPad = first.getDay()
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const cells: (number | null)[] = []
    for (let i = 0; i < startPad; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    return cells
  }, [viewMonth])

  const monthLabel = viewMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  const today = time.getDate()
  const isCurrentMonth =
    viewMonth.getMonth() === time.getMonth() && viewMonth.getFullYear() === time.getFullYear()

  const clockIn = todayAttendance?.clock_in ?? null
  const clockOut = todayAttendance?.clock_out ?? null
  const hadir = !!clockIn

  const shiftMonth = (delta: number) => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }

  const agendaIcon = (type: string) => {
    if (type === 'payroll') return Wallet
    if (type === 'training') return Video
    return Clock
  }

  return (
    <aside className="space-y-5" aria-label="Widget kanan">
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#FF5A00]" />
            Kalender
          </h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="p-1 rounded-md hover:bg-slate-100 cursor-pointer border-none bg-transparent"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="p-1 rounded-md hover:bg-slate-100 cursor-pointer border-none bg-transparent"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
        <p className="text-sm font-bold text-slate-800 capitalize mb-3">{monthLabel}</p>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
          {WEEKDAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[12px]">
          {calendarCells.map((day, i) => {
            const isToday = isCurrentMonth && day === today
            return (
              <span
                key={i}
                className={`aspect-square flex items-center justify-center rounded-lg tabular-nums ${
                  day == null
                    ? ''
                    : isToday
                      ? 'bg-[#FF5A00] text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {day ?? ''}
              </span>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
        <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-3">Hari Ini</h3>
        <ul className="space-y-2.5 text-[13px]">
          <li className="flex justify-between gap-2">
            <span className="text-slate-500">Check-in</span>
            <span className="font-semibold text-slate-800 tabular-nums">
              {clockIn ? formatClockTime(clockIn) : '—'}
            </span>
          </li>
          <li className="flex justify-between gap-2">
            <span className="text-slate-500">Check-out</span>
            <span className="font-semibold text-slate-800 tabular-nums">
              {clockOut ? formatClockTime(clockOut) : 'Belum'}
            </span>
          </li>
          <li className="flex justify-between gap-2">
            <span className="text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Lokasi
            </span>
            <span className="font-semibold text-slate-800 text-right truncate max-w-[140px]">
              {officeName || 'Kantor Pusat'}
            </span>
          </li>
          <li className="flex justify-between gap-2">
            <span className="text-slate-500">Status</span>
            <span
              className={`font-bold ${hadir ? 'text-emerald-600' : 'text-amber-600'}`}
            >
              {hadir ? 'Hadir' : 'Belum absen'}
            </span>
          </li>
        </ul>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
        <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-3">
          Agenda Mendatang
        </h3>
        <ul className="space-y-3">
          {DESKTOP_AGENDA.map((item) => {
            const Icon = agendaIcon(item.type)
            return (
              <li key={item.title} className="flex gap-3 items-start">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[#FF5A00]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-slate-800 leading-snug">{item.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.time}</p>
                  <p className="text-[11px] font-semibold text-[#FF5A00] mt-0.5">{item.when}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
