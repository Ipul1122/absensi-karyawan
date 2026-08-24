import { useRef, useState } from 'react'
import Swal from 'sweetalert2'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { BRAND_ORANGE } from '../overviewTheme'
import { COMPANY_NEWS } from '../overviewData'
import OverviewSectionHeader from '../OverviewSectionHeader'

export default function DesktopCompanyNews() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * 320, behavior: 'smooth' })
  }

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const card = 304
    const index = Math.round(el.scrollLeft / card)
    setActiveIndex(Math.min(Math.max(index, 0), COMPANY_NEWS.length - 1))
  }

  return (
    <section aria-label="Berita perusahaan">
      <div className="flex items-center justify-between gap-3">
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
        <div className="flex gap-1 shrink-0 -mt-1">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer"
            aria-label="Berita sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer"
            aria-label="Berita berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto pb-1 no-scrollbar mt-3"
      >
        {COMPANY_NEWS.map((item) => (
          <article
            key={item.title}
            className="shrink-0 w-[288px] bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm"
          >
            <div className="relative h-36">
              <img src={item.image} alt="" className="w-full h-full object-cover" />
              <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
                <CalendarDays className="w-3 h-3 text-slate-500" />
                <time className="text-[11px] font-bold text-slate-600">{item.date}</time>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-[14px] font-bold text-slate-800 leading-snug line-clamp-2 min-h-[2.75rem]">
                {item.title}
              </h3>
              <button
                type="button"
                onClick={() =>
                  Swal.fire({
                    title: item.title,
                    text: 'Artikel lengkap akan segera tersedia.',
                    icon: 'info',
                    confirmButtonColor: BRAND_ORANGE
                  })
                }
                className="mt-3 text-[13px] font-bold text-[#FF5A00] hover:underline cursor-pointer bg-transparent border-none p-0"
              >
                Baca Selengkapnya →
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="flex justify-center gap-1.5 mt-3">
        {COMPANY_NEWS.map((_, index) => (
          <span
            key={index}
            className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'w-4 bg-[#FF5A00]' : 'w-1.5 bg-slate-300'}`}
          />
        ))}
      </div>
    </section>
  )
}
