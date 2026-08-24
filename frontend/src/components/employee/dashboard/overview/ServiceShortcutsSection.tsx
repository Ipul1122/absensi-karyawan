import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { useEmployeeFaq } from '../../layanan/EmployeeFaqContext'
import { BRAND_ORANGE, overviewLayout } from './overviewTheme'
import { SERVICE_SHORTCUTS } from './overviewData'
import OverviewSectionHeader from './OverviewSectionHeader'

export default function ServiceShortcutsSection() {
  const navigate = useNavigate()
  const { openEmployeeFaq } = useEmployeeFaq()

  const handleShortcut = (item: (typeof SERVICE_SHORTCUTS)[number]) => {
    if (item.faq) {
      openEmployeeFaq()
      return
    }
    if (item.path) {
      navigate(item.path)
      return
    }
    if (item.swal) {
      Swal.fire({ ...item.swal, confirmButtonColor: BRAND_ORANGE })
    }
  }

  return (
    <section className={overviewLayout.section} aria-label="Pintasan layanan">
      <OverviewSectionHeader title="Pintasan Layanan" />
      <div className={overviewLayout.iconGrid}>
        {SERVICE_SHORTCUTS.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => handleShortcut(item)}
            className={`${overviewLayout.card} ${overviewLayout.iconGridButton} hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer`}
            style={{ boxShadow: overviewLayout.cardShadowSoft }}
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
              <item.icon className="w-5 h-5 sm:w-[22px] sm:h-[22px] text-[#FF5A00]" />
            </div>
            <span className={overviewLayout.iconGridLabel}>{item.label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
