import { useNavigate } from 'react-router-dom'
import { Briefcase, TrendingUp, ClipboardCheck, ArrowRight } from 'lucide-react'
import { overviewLayout } from './overviewTheme'
import OverviewSectionHeader from './OverviewSectionHeader'

export default function WorkShortcutsSection() {
  const navigate = useNavigate()

  const shortcuts = [
    {
      title: 'Absen Client',
      badge: 'Kunjungan Klien',
      description: 'Presensi pertemuan atau meeting langsung di lokasi klien luar kantor.',
      path: '/employee/client',
      icon: Briefcase,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-100 hover:border-red-300',
      badgeColor: 'bg-red-100/70 text-red-700'
    },
    {
      title: 'Absen Sales',
      badge: 'Penjualan & Prospek',
      description: 'Presensi kanvasing, kunjungan toko cabang, dan aktivitas sales lapangan.',
      path: '/employee/sales',
      icon: TrendingUp,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-100 hover:border-rose-300',
      badgeColor: 'bg-rose-100/70 text-rose-700'
    },
    {
      title: 'Laporan Kerja',
      badge: 'To-Do & KPI',
      description: 'Kelola to-do list harian, kirim bukti foto kerja, dan pantau capaian target.',
      path: '/employee/kpi',
      icon: ClipboardCheck,
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-100 hover:border-red-300',
      badgeColor: 'bg-red-100/70 text-red-800'
    }
  ]

  return (
    <section className={overviewLayout.section} aria-label="Pintasan Presensi & Laporan">
      <OverviewSectionHeader
        title="Pintasan Cepat"
        actionLabel="Lihat Semua"
        onAction={() => navigate('/employee/kpi')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-2">
        {shortcuts.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.title}
              type="button"
              onClick={() => navigate(item.path)}
              className={`group text-left bg-white rounded-2xl border ${item.borderColor} p-4 sm:p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden`}
              style={{ boxShadow: overviewLayout.cardShadowSoft }}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className={`w-11 h-11 rounded-xl ${item.bgColor} flex items-center justify-center shrink-0 border border-slate-100 shadow-2xs`}>
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-slate-800 group-hover:text-red-600 transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1 line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 mt-4 pt-3 border-t border-slate-100 group-hover:gap-2 transition-all">
                <span>Buka Menu</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
