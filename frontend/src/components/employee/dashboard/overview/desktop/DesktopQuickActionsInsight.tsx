import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock3, Lightbulb, Wallet } from 'lucide-react'
import { QUICK_ACTIONS } from '../overviewData'
import OverviewSectionHeader from '../OverviewSectionHeader'
import type { AttendanceState } from '../overviewTypes'

interface DesktopQuickActionsInsightProps {
  attendanceState: AttendanceState
}

export default function DesktopQuickActionsInsight({ attendanceState }: DesktopQuickActionsInsightProps) {
  const navigate = useNavigate()

  const insights = [
    {
      icon: CheckCircle2,
      color: 'text-emerald-600',
      text:
        attendanceState === 'needs_checkin'
          ? 'Belum ada check-in hari ini — absen sebelum jam kerja dimulai.'
          : 'Anda sudah check in — pertahankan disiplin waktu.'
    },
    {
      icon: Clock3,
      color: 'text-blue-600',
      text:
        attendanceState === 'completed'
          ? 'Presensi hari ini sudah lengkap. Sampai jumpa besok!'
          : 'Estimasi sisa jam kerja mengikuti jadwal kantor (08:30–17:30).'
    },
    {
      icon: Wallet,
      color: 'text-[#FF5A00]',
      text: 'Payroll periode bulan berjalan akan diproses sesuai jadwal HR.'
    },
    {
      icon: Lightbulb,
      color: 'text-amber-600',
      text: 'Ajukan cuti/izin minimal H-3 agar persetujuan lebih cepat.'
    }
  ]

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <section aria-label="Aksi cepat">
        <OverviewSectionHeader title="Aksi Cepat" />
        <div className="grid grid-cols-4 gap-3 mt-3">
          {QUICK_ACTIONS.map(({ label, icon: Icon, iconClass, path }) => (
            <button
              key={label}
              type="button"
              onClick={() => navigate(path)}
              className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col items-center gap-2.5 hover:shadow-md hover:border-orange-100 transition-all cursor-pointer min-h-[7.5rem]"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                <Icon className={`w-5 h-5 ${iconClass}`} />
              </div>
              <span className="text-[12px] font-bold text-slate-600 text-center leading-snug">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section aria-label="Insight hari ini">
        <OverviewSectionHeader title="Insight Hari Ini" />
        <div className="mt-3 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/90 to-white p-4 space-y-3">
          {insights.map((item, i) => {
            const Icon = item.icon
            return (
              <div key={i} className="flex gap-3 items-start">
                <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${item.color}`} />
                <p className="text-[13px] text-slate-600 leading-snug">{item.text}</p>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
