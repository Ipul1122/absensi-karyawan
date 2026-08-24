import { useNavigate } from 'react-router-dom'
import { QUICK_ACTIONS } from './overviewData'
import { overviewLayout } from './overviewTheme'
import OverviewSectionHeader from './OverviewSectionHeader'

export default function QuickActionsSection() {
  const navigate = useNavigate()

  return (
    <section className={overviewLayout.section} aria-label="Aksi cepat">
      <OverviewSectionHeader
        title="Aksi Cepat"
        actionLabel="Lihat Semua"
        onAction={() => navigate('/employee/riwayat')}
      />
      <div className={overviewLayout.iconGrid}>
        {QUICK_ACTIONS.map(({ label, icon: Icon, iconClass, path }) => (
          <button
            key={label}
            type="button"
            onClick={() => navigate(path)}
            className={`${overviewLayout.card} ${overviewLayout.iconGridButton} hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer`}
            style={{ boxShadow: overviewLayout.cardShadowSoft }}
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[14px] bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
              <Icon className={`w-5 h-5 sm:w-[22px] sm:h-[22px] ${iconClass}`} />
            </div>
            <span className={overviewLayout.iconGridLabel}>{label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
