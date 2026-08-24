import { useRef, useState } from 'react'
import Swal from 'sweetalert2'
import { CalendarDays } from 'lucide-react'
import { BRAND_ORANGE, overviewLayout } from './overviewTheme'
import { COMPANY_NEWS } from './overviewData'
import OverviewSectionHeader from './OverviewSectionHeader'

const NEWS_CARD_WIDTH = 200
const NEWS_GAP = 16

export default function CompanyNewsSection() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const index = Math.round(el.scrollLeft / (NEWS_CARD_WIDTH + NEWS_GAP))
    setActiveIndex(Math.min(Math.max(index, 0), COMPANY_NEWS.length - 1))
  }

  return (
    <section className={overviewLayout.section} aria-label="Berita perusahaan">
      <OverviewSectionHeader
        title="Berita Perusahaan"
        actionLabel="Lihat Semua"
        onAction={() =>
          Swal.fire({
            title: 'Berita Perusahaan',
            text: 'Kanal berita lengkap akan dimuat.',
            icon: 'info',
            confirmButtonColor: BRAND_ORANGE
          })
        }
      />
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto pb-1 no-scrollbar snap-x snap-mandatory -mx-0.5 px-0.5"
      >
        {COMPANY_NEWS.map((item) => (
          <article
            key={item.title}
            className={`shrink-0 snap-start ${overviewLayout.card} overflow-hidden w-[200px]`}
            style={{ boxShadow: overviewLayout.cardShadowSoft }}
          >
            <div className="relative h-28">
              <img src={item.image} alt="" className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
                <CalendarDays className="w-3 h-3 text-slate-500" />
                <time className="text-[12px] font-bold text-slate-600">{item.date}</time>
              </div>
            </div>
            <div className="p-3">
              <h3 className="text-[14px] font-bold text-slate-800 leading-snug line-clamp-3">
                {item.title}
              </h3>
            </div>
          </article>
        ))}
      </div>
      <div className="flex justify-center gap-1.5" role="tablist" aria-label="Indikator berita">
        {COMPANY_NEWS.map((_, index) => (
          <span
            key={index}
            role="presentation"
            className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'w-4 bg-[#FF5A00]' : 'w-1.5 bg-slate-300'}`}
          />
        ))}
      </div>
    </section>
  )
}
