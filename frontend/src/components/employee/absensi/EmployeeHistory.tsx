import React from 'react'
import Swal from 'sweetalert2'
import axios from 'axios'
import {
  Eye,
  ShieldAlert,
  Filter,
  Loader2,
  Building2,
  Briefcase,
  Handshake,
  Home,
  Layers,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  LogIn,
  LogOut
} from 'lucide-react'
import { getAssetUrl } from '../../../utils/api'

const BRAND_ORANGE = '#FF5A00'
const CARD_SHADOW = '0 4px 16px rgba(0,0,0,0.06)'

interface Attendance {
  id: number | string
  date: string
  attendance_type?: string | null
  clock_in: string | null
  clock_out: string | null
  latitude_in: string | null
  longitude_in: string | null
  latitude_out: string | null
  longitude_out: string | null
  photo_in: string | null
  photo_out: string | null
  notes_in: string | null
  notes_out: string | null
  status_in: string | null
  status_out: string | null
  shift_start_time?: string | null
  shift_end_time?: string | null
  shift?: {
    name: string
    start_time: string
    end_time: string
  } | null
}

interface EmployeeHistoryProps {
  token: string
  getStatusBadge: (status: string | null) => React.ReactNode
}

function formatRecordDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function formatClock(time: string | null | undefined) {
  if (!time) return '--:--'
  return time.length >= 5 ? time.substring(0, 5) : time
}

function renderAttendanceTypeBadge(type?: string | null) {
  const t = (type || 'kantor').toLowerCase()
  if (t === 'wfh') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 border border-sky-200 text-sky-800">
        <Home className="w-3.5 h-3.5 shrink-0" />
        WFH
      </span>
    )
  }
  if (t === 'client') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 border border-amber-200 text-amber-800">
        <Handshake className="w-3.5 h-3.5 shrink-0" />
        Client
      </span>
    )
  }
  if (t === 'kunjungan' || t === 'sales') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800">
        <Briefcase className="w-3.5 h-3.5 shrink-0" />
        Sales
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-50 border border-orange-200 text-[#C2410C]">
      <Building2 className="w-3.5 h-3.5 shrink-0" />
      Kantor
    </span>
  )
}

function pillClass(active: boolean) {
  return active
    ? 'bg-[#FF5A00] border-[#FF5A00] text-white shadow-sm'
    : 'bg-white border-slate-200 text-slate-600 hover:border-orange-200 hover:bg-orange-50/50'
}

function HistoryRecordCard({
  record,
  getStatusBadge
}: {
  record: Attendance
  getStatusBadge: (status: string | null) => React.ReactNode
}) {
  const showPhoto = (title: string, path: string | null) => {
    if (!path) return null
    Swal.fire({
      title,
      imageUrl: getAssetUrl(path),
      imageAlt: title,
      confirmButtonColor: BRAND_ORANGE
    })
  }

  return (
    <article
      className="bg-white rounded-[20px] border border-slate-100 p-4 sm:p-5 space-y-4"
      style={{ boxShadow: CARD_SHADOW }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-slate-800">
            <CalendarDays className="w-4 h-4 text-[#FF5A00] shrink-0" />
            <p className="text-[15px] sm:text-base font-bold capitalize leading-snug">{formatRecordDate(record.date)}</p>
          </div>
          {(record.shift?.name || (record.shift_start_time && record.shift_end_time)) && (
            <p className="text-[12px] text-slate-500 mt-1.5 pl-6">
              {record.shift?.name ||
                `Shift ${formatClock(record.shift_start_time)} – ${formatClock(record.shift_end_time)}`}
            </p>
          )}
        </div>
        <div className="shrink-0">{renderAttendanceTypeBadge(record.attendance_type)}</div>
      </div>

      {record.notes_in && (
        <p className="text-[13px] text-slate-500 bg-slate-50 rounded-xl px-3 py-2 leading-snug line-clamp-2">
          Catatan: {record.notes_in}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 sm:p-4">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
            <LogIn className="w-4 h-4 text-emerald-600" />
            Masuk
          </div>
          {record.clock_in ? (
            <>
              <p className="text-lg font-bold text-slate-800 tabular-nums">{formatClock(record.clock_in)}</p>
              <div className="mt-2">{getStatusBadge(record.status_in)}</div>
            </>
          ) : (
            <p className="text-sm text-slate-400 italic">Tidak ada data</p>
          )}
        </div>
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 sm:p-4">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
            <LogOut className="w-4 h-4 text-[#FF5A00]" />
            Keluar
          </div>
          {record.clock_out ? (
            <>
              <p className="text-lg font-bold text-slate-800 tabular-nums">{formatClock(record.clock_out)}</p>
              <div className="mt-2">{getStatusBadge(record.status_out)}</div>
            </>
          ) : (
            <p className="text-sm text-slate-400 italic">Tidak ada data</p>
          )}
        </div>
      </div>

      {(record.photo_in || record.photo_out) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {record.photo_in && (
            <button
              type="button"
              onClick={() => showPhoto('Foto Masuk', record.photo_in)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-[13px] font-semibold text-slate-700 hover:border-[#FF5A00] hover:text-[#FF5A00] transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              Foto masuk
            </button>
          )}
          {record.photo_out && (
            <button
              type="button"
              onClick={() => showPhoto('Foto Keluar', record.photo_out)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-[13px] font-semibold text-slate-700 hover:border-[#FF5A00] hover:text-[#FF5A00] transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              Foto keluar
            </button>
          )}
        </div>
      )}
    </article>
  )
}

export default function EmployeeHistory({ token, getStatusBadge }: EmployeeHistoryProps) {
  const [history, setHistory] = React.useState<Attendance[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filterType, setFilterType] = React.useState<'all' | 'month-year' | 'date'>('all')
  const [attendanceTypeFilter, setAttendanceTypeFilter] = React.useState<'all' | 'kantor' | 'wfh' | 'client' | 'sales'>('all')
  const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = React.useState('')
  const [currentPage, setCurrentPage] = React.useState(1)
  const [itemsPerPage, setItemsPerPage] = React.useState(10)
  const [totalItems, setTotalItems] = React.useState(0)
  const [totalPages, setTotalPages] = React.useState(1)

  const fetchHistoryData = async () => {
    setLoading(true)
    try {
      let url = `http://localhost:8000/api/attendance/history?page=${currentPage}&limit=${itemsPerPage}`
      if (filterType === 'month-year') {
        url += `&month=${selectedMonth}&year=${selectedYear}`
      } else if (filterType === 'date' && selectedDate) {
        url += `&date=${selectedDate}`
      }
      if (attendanceTypeFilter !== 'all') {
        url += `&attendance_type=${attendanceTypeFilter}`
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setHistory(response.data.data)
        if (response.data.pagination) {
          setTotalItems(response.data.pagination.total)
          setTotalPages(response.data.pagination.last_page)
        } else {
          setTotalItems(response.data.data.length)
          setTotalPages(1)
        }
      }
    } catch (err) {
      console.error('Gagal mengambil data riwayat absensi paginated:', err)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchHistoryData()
  }, [currentPage, itemsPerPage, filterType, attendanceTypeFilter, selectedMonth, selectedYear, selectedDate])

  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1))
  const startIndex = (safeCurrentPage - 1) * itemsPerPage
  const endIndex = startIndex + history.length

  const typeFilters = [
    { id: 'all' as const, label: 'Semua', icon: Layers },
    { id: 'kantor' as const, label: 'Kantor', icon: Building2 },
    { id: 'wfh' as const, label: 'WFH', icon: Home },
    { id: 'client' as const, label: 'Client', icon: Handshake },
    { id: 'sales' as const, label: 'Sales', icon: Briefcase }
  ]

  return (
    <div className="w-full space-y-5 sm:space-y-6 pb-4">
      {/* Filters */}
      <div className="rounded-[20px] border border-slate-100 bg-white p-4 sm:p-5 space-y-4" style={{ boxShadow: CARD_SHADOW }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[12px] font-bold text-slate-500 uppercase tracking-wide">
            <Filter className="w-4 h-4 text-[#FF5A00]" />
            Filter riwayat
          </div>
          <label className="flex items-center gap-2 shrink-0 self-start sm:self-center text-[13px]">
            <span className="text-slate-500 font-medium whitespace-nowrap">Tampilkan</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(parseInt(e.target.value, 10))
                setCurrentPage(1)
              }}
              className="h-10 bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 text-slate-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide">Tipe presensi</p>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-0.5 px-0.5">
            {typeFilters.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setAttendanceTypeFilter(id)
                  setCurrentPage(1)
                }}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[13px] font-semibold transition-colors cursor-pointer ${pillClass(attendanceTypeFilter === id)}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide">Periode</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'all' as const, label: 'Semua tanggal' },
                { id: 'month-year' as const, label: 'Bulan & tahun' },
                { id: 'date' as const, label: 'Tanggal tertentu' }
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setFilterType(id)
                  setCurrentPage(1)
                }}
                className={`px-3.5 py-2 rounded-full border text-[13px] font-semibold transition-colors cursor-pointer ${pillClass(filterType === id)}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filterType === 'month-year' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-[#F8FAFC] border border-slate-100">
            <label className="block">
              <span className="text-[12px] font-semibold text-slate-500 mb-1.5 block">Bulan</span>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(parseInt(e.target.value, 10))
                  setCurrentPage(1)
                }}
                className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-200"
              >
                {[
                  'Januari',
                  'Februari',
                  'Maret',
                  'April',
                  'Mei',
                  'Juni',
                  'Juli',
                  'Agustus',
                  'September',
                  'Oktober',
                  'November',
                  'Desember'
                ].map((name, i) => (
                  <option key={name} value={i + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[12px] font-semibold text-slate-500 mb-1.5 block">Tahun</span>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(parseInt(e.target.value, 10))
                  setCurrentPage(1)
                }}
                className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-200"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 3 + i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {filterType === 'date' && (
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-100">
            <label className="block max-w-xs">
              <span className="text-[12px] font-semibold text-slate-500 mb-1.5 block">Tanggal</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-200"
              />
            </label>
          </div>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div
          className="rounded-[20px] border border-slate-100 bg-white py-16 flex flex-col items-center justify-center gap-3 text-slate-500"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <Loader2 className="w-8 h-8 animate-spin text-[#FF5A00]" />
          <p className="text-sm font-medium">Memuat riwayat presensi…</p>
        </div>
      ) : history.length === 0 ? (
        <div
          className="rounded-[20px] border border-slate-100 bg-white py-14 px-6 text-center"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <p className="text-slate-600 font-semibold">
            {filterType === 'all' && attendanceTypeFilter === 'all'
              ? 'Belum ada riwayat absensi.'
              : 'Tidak ada data sesuai filter.'}
          </p>
          <p className="text-sm text-slate-400 mt-1">Coba ubah filter atau periode waktu.</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {history.map((record) => (
            <HistoryRecordCard key={record.id} record={record} getStatusBadge={getStatusBadge} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalItems > 0 && (
        <div
          className="rounded-[20px] border border-slate-100 bg-white p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <p className="text-[13px] text-slate-500 text-center sm:text-left order-2 sm:order-1">
            Menampilkan{' '}
            <span className="font-semibold text-slate-800">{startIndex + 1}</span>–
            <span className="font-semibold text-slate-800">{Math.min(endIndex, totalItems)}</span> dari{' '}
            <span className="font-semibold text-slate-800">{totalItems}</span>
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto justify-center">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={safeCurrentPage === 1}
                className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-slate-50"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>
              <span className="text-sm font-semibold text-slate-700 tabular-nums min-w-[4.5rem] text-center">
                {safeCurrentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={safeCurrentPage === totalPages}
                className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-slate-50"
                aria-label="Halaman berikutnya"
              >
                <span className="hidden sm:inline">Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="rounded-[20px] border border-orange-100 bg-orange-50/80 p-4 flex gap-3 items-start">
        <ShieldAlert className="w-5 h-5 text-[#FF5A00] shrink-0 mt-0.5" />
        <p className="text-[13px] sm:text-sm text-slate-600 leading-relaxed">
          <strong className="text-slate-800">Lokasi & kamera wajib.</strong> Presensi divalidasi dengan GPS dan foto
          selfie. Manipulasi lokasi atau kamera merupakan pelanggaran disiplin.
        </p>
      </div>
    </div>
  )
}
