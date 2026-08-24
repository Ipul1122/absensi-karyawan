import Swal from 'sweetalert2'
import {
  Building2,
  Briefcase,
  Camera,
  ExternalLink,
  FileText,
  Handshake,
  Home,
  Loader2,
  MapPin,
  Users,
} from 'lucide-react'
import {
  getAttendanceLocationDetail,
  getAttendanceLocationLabel,
  getAttendanceTypeBadgeClass,
  resolveAttendanceTypeKey,
} from '../../../utils/attendanceLocation'

interface MonitoringUser {
  id: number
  name: string
  email: string
  photo?: string | null
  division?: string | null
}

interface PresentRecord {
  id: number
  attendance_type?: string | null
  clock_in: string | null
  photo_in?: string | null
  notes_in?: string | null
  latitude_in?: string | null
  longitude_in?: string | null
  status_in?: string | null
  user?: MonitoringUser | null
}

interface LeaveRecord {
  id: number
  reason?: string
  leave_type?: string
  employee?: MonitoringUser | null
}

interface MonitoringMobileCardsProps {
  loading: boolean
  activeTab: 'hadir' | 'cuti' | 'belum_hadir'
  presentList: PresentRecord[]
  leaveList: LeaveRecord[]
  absentList: MonitoringUser[]
  todayStr: string
  getFullPhotoUrl: (path: string | null | undefined) => string | null
  getDivisionBadgeStyle: (division: string | null | undefined) => string
  getBadgeStyle: (status: string | null) => string
  getStatusText: (status: string | null) => string
  getIndonesianDate: (d: Date) => string
}

function LocationTypeIcon({ type }: { type?: string | null }) {
  const key = resolveAttendanceTypeKey(type)
  const className = 'w-3.5 h-3.5 shrink-0'
  if (key === 'wfh') return <Home className={className} />
  if (key === 'client') return <Handshake className={className} />
  if (key === 'kunjungan') return <Briefcase className={className} />
  if (key === 'kantor') return <Building2 className={className} />
  return <MapPin className={className} />
}

function EmployeeAvatar({
  name,
  photoUrl,
}: {
  name?: string
  photoUrl: string | null
}) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name || 'Karyawan'}
        className="w-11 h-11 rounded-full object-cover border border-slate-100 shadow-inner shrink-0"
      />
    )
  }
  return (
    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#E53935] to-[#C62828] flex items-center justify-center text-white font-extrabold text-xs shrink-0">
      {name ? name.substring(0, 2).toUpperCase() : '?'}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center">
      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
      <p className="text-[13px] font-semibold text-slate-500 leading-relaxed">{message}</p>
    </div>
  )
}

export default function MonitoringMobileCards({
  loading,
  activeTab,
  presentList,
  leaveList,
  absentList,
  todayStr,
  getFullPhotoUrl,
  getDivisionBadgeStyle,
  getBadgeStyle,
  getStatusText,
  getIndonesianDate,
}: MonitoringMobileCardsProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-14 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-[#E53935]" />
        <p className="text-[13px] font-semibold">Memuat data monitoring…</p>
      </div>
    )
  }

  if (activeTab === 'hadir') {
    if (presentList.length === 0) {
      return <EmptyState message="Belum ada karyawan yang hadir hari ini atau nama tidak ditemukan." />
    }

    return (
      <div className="space-y-3">
        {presentList.map((att) => {
          const photoUrl = getFullPhotoUrl(att.user?.photo)
          const checkinPhoto = getFullPhotoUrl(att.photo_in ?? null)
          const division = att.user?.division || 'Umum'
          const locationLabel = getAttendanceLocationLabel(att.attendance_type)
          const locationDetail = getAttendanceLocationDetail(att)

          return (
            <article
              key={att.id}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm active:scale-[0.99] transition-transform"
            >
              <div className="flex items-start gap-3">
                <EmployeeAvatar name={att.user?.name} photoUrl={photoUrl} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-[14px] font-bold text-slate-800 leading-snug truncate">
                        {att.user?.name || 'Karyawan'}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{att.user?.email}</p>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide ${getBadgeStyle(att.status_in ?? null)}`}
                    >
                      {getStatusText(att.status_in ?? null)}
                    </span>
                  </div>
                  <span
                    className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wide ${getDivisionBadgeStyle(division)}`}
                  >
                    {division}
                  </span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Masuk</p>
                  <p className="text-[15px] font-black text-slate-800 tabular-nums mt-0.5">
                    {att.clock_in ? att.clock_in.substring(0, 5) : '--:--'}
                    <span className="text-[10px] font-semibold text-slate-400 ml-1">WIB</span>
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Lokasi</p>
                  <span
                    className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold border max-w-full ${getAttendanceTypeBadgeClass(att.attendance_type)}`}
                  >
                    <LocationTypeIcon type={att.attendance_type} />
                    <span className="truncate">{locationLabel}</span>
                  </span>
                </div>
              </div>

              {locationDetail && (
                <p className="mt-2 text-[11px] text-slate-500 leading-snug line-clamp-2" title={locationDetail}>
                  {locationDetail}
                </p>
              )}

              {checkinPhoto && (
                <button
                  type="button"
                  onClick={() => {
                    Swal.fire({
                      title: `Absen Masuk: ${att.user?.name}`,
                      imageUrl: checkinPhoto,
                      imageAlt: 'Foto absen masuk',
                      confirmButtonColor: '#E53935',
                      confirmButtonText: 'Tutup',
                      background: '#ffffff',
                    })
                  }}
                  className="mt-3 w-full h-10 inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 text-[#E53935] border border-red-100 text-[12px] font-bold cursor-pointer active:scale-[0.98]"
                >
                  <Camera className="w-4 h-4" />
                  Lihat Foto Absen
                </button>
              )}
            </article>
          )
        })}
      </div>
    )
  }

  if (activeTab === 'cuti') {
    if (leaveList.length === 0) {
      return <EmptyState message="Tidak ada karyawan cuti/izin hari ini." />
    }

    return (
      <div className="space-y-3">
        {leaveList.map((leave) => {
          const photoUrl = getFullPhotoUrl(leave.employee?.photo)
          const division = leave.employee?.division || 'Umum'

          return (
            <article
              key={leave.id}
              className="rounded-2xl border border-amber-100 bg-amber-50/30 p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <EmployeeAvatar name={leave.employee?.name} photoUrl={photoUrl} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-[14px] font-bold text-slate-800 leading-snug truncate">
                    {leave.employee?.name || 'Karyawan'}
                  </h4>
                  <span
                    className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wide ${getDivisionBadgeStyle(division)}`}
                  >
                    {division}
                  </span>
                  <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wide bg-blue-50 text-blue-700 border border-blue-100">
                    {leave.leave_type ? leave.leave_type.toUpperCase() : 'CUTI / IZIN'}
                  </span>
                </div>
              </div>

              {leave.reason && (
                <p className="mt-3 text-[12px] text-slate-600 bg-white/70 rounded-xl px-3 py-2 leading-relaxed line-clamp-3">
                  {leave.reason}
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  Swal.fire({
                    title: `Cuti & Izin: ${leave.employee?.name}`,
                    html: `<strong>Keterangan:</strong><br/><p class="mt-2 text-slate-600">${leave.reason || '-'}</p>`,
                    confirmButtonColor: '#E53935',
                    confirmButtonText: 'Tutup',
                    background: '#ffffff',
                  })
                }}
                className="mt-3 w-full h-10 inline-flex items-center justify-center gap-2 rounded-xl bg-white text-slate-700 border border-slate-200 text-[12px] font-bold cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                Lihat Detail
              </button>
            </article>
          )
        })}
      </div>
    )
  }

  if (absentList.length === 0) {
    return <EmptyState message="Semua karyawan aktif sudah tercatat hadir atau cuti." />
  }

  return (
    <div className="space-y-3">
      {absentList.map((emp) => {
        const photoUrl = getFullPhotoUrl(emp.photo)
        const division = emp.division || 'Umum'
        const mailSubject = encodeURIComponent(`Pemberitahuan Absensi Hari Ini - ${todayStr}`)
        const mailBody = encodeURIComponent(
          `Halo ${emp.name},\n\nKami mendeteksi Anda belum melakukan absensi masuk pada hari ini tanggal ${getIndonesianDate(new Date())}.\n\nMohon lakukan absensi segera atau hubungi HR jika berhalangan hadir.\n\nTerima kasih,\nTim HR`
        )

        return (
          <article
            key={emp.id}
            className="rounded-2xl border border-rose-100 bg-rose-50/20 p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <EmployeeAvatar name={emp.name} photoUrl={photoUrl} />
              <div className="flex-1 min-w-0">
                <h4 className="text-[14px] font-bold text-slate-800 leading-snug truncate">{emp.name}</h4>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{emp.email}</p>
                <span
                  className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wide ${getDivisionBadgeStyle(division)}`}
                >
                  {division}
                </span>
                <span className="mt-2 ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wide bg-red-50 text-[#E53935] border border-red-100">
                  BELUM HADIR
                </span>
              </div>
            </div>

            <a
              href={`mailto:${emp.email}?subject=${mailSubject}&body=${mailBody}`}
              className="mt-3 w-full h-10 inline-flex items-center justify-center gap-2 rounded-xl bg-[#E53935] text-white text-[12px] font-bold cursor-pointer active:scale-[0.98]"
            >
              <ExternalLink className="w-4 h-4" />
              Kirim Reminder Email
            </a>
          </article>
        )
      })}
    </div>
  )
}
