import type { Attendance, AttendanceState } from '../overviewTypes'

export function getTimeGreeting(time: Date, firstName: string): string {
  const h = time.getHours()
  let part = 'Selamat siang'
  if (h < 11) part = 'Selamat pagi'
  else if (h >= 18) part = 'Selamat malam'
  return `${part}, ${firstName}! 👋`
}

export function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName
}

export function formatClockTime(isoOrTime: string | null): string {
  if (!isoOrTime) return '—'
  const d = new Date(isoOrTime)
  if (Number.isNaN(d.getTime())) {
    return isoOrTime.slice(0, 5)
  }
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
}

/** API mengirim clock_in/out sering sebagai "HH:mm:ss" tanpa tanggal — gabungkan dengan hari referensi. */
export function parseClockTimestamp(clockStr: string, refDate: Date): number | null {
  const trimmed = clockStr.trim()
  if (!trimmed) return null

  const asDate = new Date(trimmed)
  if (!Number.isNaN(asDate.getTime())) return asDate.getTime()

  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/)
  if (!match) return null

  const h = parseInt(match[1], 10)
  const m = parseInt(match[2], 10)
  const s = match[3] ? parseInt(match[3], 10) : 0
  if (h > 23 || m > 59 || s > 59) return null

  const combined = new Date(refDate)
  combined.setHours(h, m, s, 0)
  return combined.getTime()
}

export function computeDayProgress(time: Date, clockIn: string | null, clockOut: string | null): number {
  if (!clockIn) return 0

  const start = parseClockTimestamp(clockIn, time)
  if (start == null) return 0

  const endTarget = new Date(time)
  endTarget.setHours(17, 30, 0, 0)

  const now =
    clockOut != null && clockOut !== ''
      ? parseClockTimestamp(clockOut, time) ?? time.getTime()
      : time.getTime()

  const total = endTarget.getTime() - start
  if (!Number.isFinite(total) || total <= 0) return 100

  const pct = Math.round(((now - start) / total) * 100)
  if (!Number.isFinite(pct)) return 0
  return Math.min(100, Math.max(0, pct))
}

const statusInLabel: Record<string, string> = {
  early: 'Datang Lebih Awal',
  normal: 'Tepat Waktu',
  late: 'Terlambat'
}

export function checkInStatusLabel(statusIn: string | null | undefined, fallback: string): string {
  if (statusIn && statusInLabel[statusIn]) return statusInLabel[statusIn]
  return fallback
}

export function getStatusHint(state: AttendanceState): { text: string; tone: 'success' | 'warn' | 'muted' | 'default' } {
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

export function computeMonthStats(history: Attendance[], ref: Date) {
  const y = ref.getFullYear()
  const m = ref.getMonth()
  const inMonth = history.filter((row) => {
    const d = new Date(row.date)
    return d.getFullYear() === y && d.getMonth() === m && row.clock_in
  })

  const hadir = inMonth.length
  const targetDays = 22
  const hadirPct = Math.min(100, Math.round((hadir / targetDays) * 1000) / 10)

  let overtimeMinutes = 0
  inMonth.forEach((row) => {
    if (row.status_out === 'overtime' && row.clock_in && row.clock_out) {
      const rowDay = row.date ? new Date(row.date) : ref
      const end = parseClockTimestamp(row.clock_out, rowDay)
      if (end == null) return
      const normalEnd = new Date(rowDay)
      normalEnd.setHours(17, 0, 0, 0)
      const extra = (end - normalEnd.getTime()) / 60000
      if (Number.isFinite(extra)) {
        overtimeMinutes += Math.max(0, extra)
      }
    }
  })
  const jamLemburRaw = Math.round((overtimeMinutes / 60) * 10) / 10
  const jamLembur = Number.isFinite(jamLemburRaw) ? jamLemburRaw : 0

  return { hadir, hadirPct, targetDays, jamLembur }
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
