import { CalendarCheck } from 'lucide-react'

interface LogoProps {
  className?: string
  company?: string
}

export default function Logo({ className = "w-10 h-10", company }: LogoProps) {
  const isYPI = company === 'PT Yasodana Parvez Internasional'
  const isCPI = company === 'PT Cakrawala Parama Internasional'

  if (isYPI || isCPI) {
    const logoSrc = isYPI ? '/logo/LOGO-YPI.png' : '/logo/LOGO-CPI.png'
    return (
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center transition-transform hover:scale-105 duration-300">
          <img src={logoSrc} alt={company} className={`${className} object-contain`} style={{ maxHeight: '100%', maxWidth: '100%' }} />
        </div>
        <div>
          <h2 className="text-xs font-black tracking-tight text-slate-900 leading-none font-sans uppercase">
            {isYPI ? 'Yasodana Parvez' : 'Cakrawala Parama'}
          </h2>
          <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest font-quicksand">
            Internasional
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${className} rounded-xl bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25 transition-transform hover:scale-105 duration-300`}>
        <CalendarCheck className="w-5 h-5 text-white" />
      </div>
      <div>
        <h2 className="text-base font-black tracking-tight text-slate-900 leading-none font-sans uppercase">
          goodpeople<span className="text-amber-600">-hcms</span>
        </h2>
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest font-quicksand">
          HCMS Portal
        </span>
      </div>
    </div>
  )
}
