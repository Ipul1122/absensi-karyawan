import { CalendarCheck } from 'lucide-react'

export default function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${className} rounded-xl bg-gradient-to-tr from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/25 transition-transform hover:scale-105 duration-300`}>
        <CalendarCheck className="w-5 h-5 text-white" />
      </div>
      <div>
        <h2 className="text-base font-black tracking-tight text-slate-900 leading-none font-sans uppercase">
          Karya<span className="text-red-500">Absen</span>
        </h2>
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest font-quicksand">
          Presensi Digital
        </span>
      </div>
    </div>
  )
}
