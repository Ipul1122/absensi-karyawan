export type AttendanceTypeKey = 'kantor' | 'wfh' | 'kunjungan' | 'client' | 'unknown'

export interface AttendanceLocationInput {
  attendance_type?: string | null
  notes_in?: string | null
  latitude_in?: string | null
  longitude_in?: string | null
}

export interface MonitoringAttendance extends AttendanceLocationInput {
  id: number
  date: string
  clock_in: string | null
  clock_out?: string | null
  latitude_out?: string | null
  longitude_out?: string | null
  photo_in?: string | null
  photo_out?: string | null
  notes_out?: string | null
  status_in?: string | null
  status_out?: string | null
  user?: {
    id: number
    name: string
    email: string
    photo?: string | null
  } | null
}

export interface SalesVisitMonitoring {
  id: number
  date: string
  visit_time: string
  visit_time_out?: string | null
  visit_type?: string | null
  client_name?: string | null
  latitude?: string | null
  longitude?: string | null
  latitude_out?: string | null
  longitude_out?: string | null
  photo_path?: string | null
  notes?: string | null
  user?: {
    id: number
    name: string
    email: string
    photo?: string | null
  } | null
}

export function normalizeAttendanceDate(value?: string | null): string {
  if (!value) return ''
  return value.substring(0, 10)
}

export function resolveAttendanceTypeKey(type?: string | null): AttendanceTypeKey {
  const normalized = (type || 'kantor').toLowerCase()
  if (normalized === 'wfh') return 'wfh'
  if (normalized === 'client') return 'client'
  if (normalized === 'kunjungan' || normalized === 'sales') return 'kunjungan'
  if (normalized === 'kantor') return 'kantor'
  return 'unknown'
}

export function extractVisitDetail(notes?: string | null): string | null {
  if (!notes) return null
  const trimmed = notes.trim()
  const patterns = [
    /^Absen Masuk Klien:\s*(.+)$/i,
    /^Absen Masuk via Kunjungan:\s*(.+)$/i,
    /^Klien:\s*(.+)$/i,
    /^Tujuan:\s*(.+)$/i,
  ]
  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match?.[1]) return match[1].trim()
  }
  if (trimmed.length > 0 && trimmed.length <= 80) return trimmed
  return null
}

export function getAttendanceLocationLabel(type?: string | null): string {
  switch (resolveAttendanceTypeKey(type)) {
    case 'wfh':
      return 'WFH'
    case 'client':
      return 'Kunjungan Klien'
    case 'kunjungan':
      return 'Kunjungan Sales'
    case 'kantor':
      return 'Kantor'
    default:
      return 'Lokasi Lain'
  }
}

export function getAttendanceLocationDetail(att: AttendanceLocationInput): string | null {
  const fromNotes = extractVisitDetail(att.notes_in)
  if (fromNotes) return fromNotes

  const type = resolveAttendanceTypeKey(att.attendance_type)
  if (type === 'wfh') return 'Remote / di luar kantor'
  if (type === 'kantor') return 'On-site kantor'

  if (att.latitude_in && att.longitude_in) {
    const lat = Number(att.latitude_in)
    const lng = Number(att.longitude_in)
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    }
  }

  return null
}

export function getAttendanceTypeBadgeClass(type?: string | null): string {
  switch (resolveAttendanceTypeKey(type)) {
    case 'wfh':
      return 'bg-sky-50 text-sky-800 border-sky-200'
    case 'client':
      return 'bg-amber-50 text-amber-800 border-amber-200'
    case 'kunjungan':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200'
    case 'kantor':
      return 'bg-orange-50 text-[#C2410C] border-orange-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

export function buildPresentTodayList(
  attendances: MonitoringAttendance[],
  salesVisits: SalesVisitMonitoring[],
  todayStr: string
): MonitoringAttendance[] {
  const present = attendances.filter(
    (att) => normalizeAttendanceDate(att.date) === todayStr && att.clock_in
  )

  const seenUserIds = new Set(
    present.map((att) => att.user?.id).filter((id): id is number => typeof id === 'number')
  )

  for (const visit of salesVisits) {
    const userId = visit.user?.id
    if (!userId || seenUserIds.has(userId)) continue
    if (normalizeAttendanceDate(visit.date) !== todayStr || !visit.visit_time) continue

    const isClient = visit.visit_type === 'client'
    present.push({
      id: -visit.id,
      date: todayStr,
      attendance_type: isClient ? 'client' : 'kunjungan',
      clock_in: visit.visit_time,
      clock_out: visit.visit_time_out ?? null,
      latitude_in: visit.latitude ?? null,
      longitude_in: visit.longitude ?? null,
      latitude_out: visit.latitude_out ?? null,
      longitude_out: visit.longitude_out ?? null,
      photo_in: visit.photo_path ?? null,
      photo_out: null,
      notes_in: visit.client_name
        ? `${isClient ? 'Klien' : 'Tujuan'}: ${visit.client_name}${visit.notes ? ` (${visit.notes})` : ''}`
        : visit.notes ?? null,
      notes_out: null,
      status_in: 'normal',
      status_out: null,
      user: visit.user ?? null,
    })
    seenUserIds.add(userId)
  }

  return present.sort((a, b) => (a.clock_in || '').localeCompare(b.clock_in || ''))
}
