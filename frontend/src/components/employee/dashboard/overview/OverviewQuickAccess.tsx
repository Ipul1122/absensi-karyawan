import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  CalendarDays,
  ChevronRight,
  Clock,
  HelpCircle,
  History,
  Home,
  Briefcase,
  TrendingUp,
  ClipboardCheck,
  Target,
  Mail,
  Wallet,
  ChevronDown
} from 'lucide-react'
import { useEmployeeFaq } from '../../layanan/EmployeeFaqContext'
import type { AttendanceState } from './overviewTypes'
import { overviewLayout } from './overviewTheme'

interface OverviewQuickAccessProps {
  time: Date
  attendanceState: AttendanceState
}

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
  default: 'bg-red-50 text-red-700 border-red-100'
}

export default function OverviewQuickAccess({ time, attendanceState }: OverviewQuickAccessProps) {
  const navigate = useNavigate()
  const { openEmployeeFaq } = useEmployeeFaq()

  // State Accordion - default terbuka kategori Presensi agar akses cepat langsung tampak
  const [openAccordion, setOpenAccordion] = useState<string | null>('presensi')

  const dateLabel = time.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  const hint = getStatusHint(attendanceState)

  const menuCategories = [
    {
      id: 'presensi',
      title: 'Presensi & Kunjungan',
      subtitle: 'Kantor, Client, Sales, WFH & Riwayat',
      badge: '5 Menu',
      icon: Building2,
      items: [
        {
          label: 'Absen Kantor',
          desc: 'Presensi masuk & pulang di kantor utama',
          path: '/employee/absen',
          icon: Building2
        },
        {
          label: 'Absen Client',
          desc: 'Presensi meeting / dinas di lokasi klien luar kantor',
          path: '/employee/client',
          icon: Briefcase
        },
        {
          label: 'Absen Sales',
          desc: 'Presensi kanvasing, toko cabang & penjualan lapangan',
          path: '/employee/sales',
          icon: TrendingUp
        },
        {
          label: 'Absen WFH',
          desc: 'Presensi kerja remote dari rumah',
          path: '/employee/absen?mode=wfh',
          icon: Home
        },
        {
          label: 'Riwayat Absensi',
          desc: 'Rekapitulasi jam presensi & riwayat kehadiran lengkap',
          path: '/employee/riwayat',
          icon: History
        }
      ]
    },
    {
      id: 'kpi',
      title: 'Kinerja & Laporan Kerja (KPI)',
      subtitle: 'To-do list harian & tanggung jawab kerja',
      badge: '2 Menu',
      icon: ClipboardCheck,
      items: [
        {
          label: 'Laporan Kerja Harian',
          desc: 'To-do list tugas, unggah foto bukti kerja & capaian',
          path: '/employee/kpi',
          icon: ClipboardCheck
        },
        {
          label: 'Target & Tanggung Jawab',
          desc: 'Daftar tanggung jawab & acuan target KPI dari Admin',
          path: '/employee/kpi',
          icon: Target
        }
      ]
    },
    {
      id: 'layanan',
      title: 'Layanan & Operasional',
      subtitle: 'Cuti, Izin, Lembur, Payroll & FAQ',
      badge: '5 Menu',
      icon: CalendarDays,
      items: [
        {
          label: 'Ajukan Cuti',
          desc: 'Permohonan cuti tahunan atau cuti bersama',
          path: '/employee/cuti',
          icon: CalendarDays
        },
        {
          label: 'Pengajuan Izin',
          desc: 'Izin sakit atau keperluan mendesak',
          path: '/employee/izin',
          icon: Mail
        },
        {
          label: 'Absen Lembur',
          desc: 'Form pengajuan dan presensi jam lembur',
          path: '/employee/lembur',
          icon: Clock
        },
        {
          label: 'Slip Gaji Digital',
          desc: 'Rincian gaji bulanan dan unduh slip gaji',
          path: '/employee/payroll',
          icon: Wallet
        },
        {
          label: 'Bantuan & FAQ',
          desc: 'Pusat bantuan sistem dan tanya jawab absensi',
          action: 'faq' as const,
          icon: HelpCircle
        }
      ]
    }
  ]

  return (
    <section
      className={`${overviewLayout.card} p-4 sm:p-5 space-y-4`}
      style={{ boxShadow: overviewLayout.cardShadowSoft }}
      aria-label="Akses cepat dashboard"
    >
      {/* ── HEADER TANGGAL & JAM ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-red-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide">Hari ini</p>
            <p className="text-[14px] sm:text-[15px] font-bold text-slate-800 leading-snug capitalize">{dateLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-slate-500 shrink-0 tabular-nums">
          <Clock className="w-4 h-4 text-red-500" />
          <span className="text-[13px] font-semibold">
            {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* ── STATUS PRESENSI HINT ── */}
      <p className={`text-[13px] leading-snug px-3 py-2 rounded-xl border ${hintStyles[hint.tone]}`}>{hint.text}</p>

      {/* ── TOMBOL UTAMA ABSEN (CHECK IN / CHECK OUT) ── */}
      {(attendanceState === 'needs_checkin' || attendanceState === 'needs_checkout') && (
        attendanceState === 'needs_checkin' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => navigate('/employee/absen')}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-[14px] font-bold shadow-sm shadow-red-600/20 transition-all cursor-pointer border-none active:scale-[0.98]"
            >
              <Building2 className="w-4 h-4" />
              Absen Kantor
            </button>
            <button
              type="button"
              onClick={() => navigate('/employee/absen?mode=wfh')}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 text-[14px] font-bold transition-all cursor-pointer border border-slate-200 active:scale-[0.98]"
            >
              <Home className="w-4 h-4" />
              Absen WFH
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/employee/absen')}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-[14px] font-bold shadow-sm shadow-red-600/20 transition-all cursor-pointer border-none active:scale-[0.98]"
          >
            Lanjut ke Check Out
            <ChevronRight className="w-4 h-4" />
          </button>
        )
      )}

      {/* ── ACCORDION MENU NAVIGASI (BEBAS SWIPE / GESER HORIZONTAL) ── */}
      <div className="space-y-2 pt-1 border-t border-slate-100">
        <div className="flex items-center justify-between px-0.5 pt-1">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Menu Pilihan Karyawan
          </p>
          <span className="text-[10px] text-slate-400 font-semibold">
            Klik kategori untuk membuka
          </span>
        </div>

        {menuCategories.map((cat) => {
          const isOpen = openAccordion === cat.id
          const CatIcon = cat.icon

          return (
            <div
              key={cat.id}
              className="border border-slate-200/90 rounded-2xl bg-white overflow-hidden shadow-2xs transition-all"
            >
              {/* Accordion Trigger Header */}
              <button
                type="button"
                onClick={() => setOpenAccordion(isOpen ? null : cat.id)}
                className={`w-full flex items-center justify-between p-3 sm:p-3.5 text-left transition-colors cursor-pointer ${
                  isOpen ? 'bg-red-50/70 border-b border-red-100' : 'bg-slate-50/60 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                      isOpen
                        ? 'bg-red-600 text-white border-red-600 shadow-xs shadow-red-600/20'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <CatIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 truncate">
                      {cat.title}
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                      {cat.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                      isOpen
                        ? 'bg-red-100/80 text-red-700 border-red-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {cat.badge}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-red-600' : 'text-slate-400'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {/* Accordion Expanded Options List */}
              {isOpen && (
                <div className="divide-y divide-slate-100 p-1.5 sm:p-2 bg-white animate-fadeIn">
                  {cat.items.map((item) => {
                    const ItemIcon = item.icon
                    const handleClick = () => {
                      if ('action' in item && item.action === 'faq') {
                        openEmployeeFaq()
                      } else if ('path' in item && item.path) {
                        navigate(item.path)
                      }
                    }

                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={handleClick}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-red-50/60 active:bg-red-50 active:scale-[0.99] transition-all cursor-pointer text-left group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-red-50 group-hover:bg-red-100/80 border border-red-100 flex items-center justify-center shrink-0 transition-colors">
                            <ItemIcon className="w-4 h-4 text-red-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 group-hover:text-red-700 transition-colors truncate">
                              {item.label}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium truncate">
                              {item.desc}
                            </p>
                          </div>
                        </div>

                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-red-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
