interface RobotMascotProps {
  state: 'loading' | 'needs_checkin' | 'needs_checkout' | 'completed' | 'day_off'
}

export default function RobotMascot({ state }: RobotMascotProps) {
  // Styles & Animations definition
  const svgStyle = `
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-8px); }
    }
    @keyframes wave {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(-35deg); }
    }
    @keyframes type-left {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-4px) rotate(10deg); }
    }
    @keyframes type-right {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-4px) rotate(-10deg); }
    }
    @keyframes spin-gear {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes dance {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-4px) rotate(5deg); }
    }
    @keyframes pulse-holo {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.85; }
    }
    @keyframes sparkle {
      0%, 100% { transform: scale(0.6) rotate(0deg); opacity: 0.3; }
      50% { transform: scale(1.2) rotate(45deg); opacity: 1; }
    }
    
    .animate-float { animation: float 3s ease-in-out infinite; }
    .animate-wave { animation: wave 1.2s ease-in-out infinite; transform-origin: 135px 105px; }
    .animate-type-l { animation: type-left 0.2s ease-in-out infinite; transform-origin: 60px 105px; }
    .animate-type-r { animation: type-right 0.2s ease-in-out infinite 0.1s; transform-origin: 140px 105px; }
    .animate-gear { animation: spin-gear 4s linear infinite; transform-origin: 100px 30px; }
    .animate-dance { animation: dance 1.6s ease-in-out infinite; }
    .animate-holo { animation: pulse-holo 2s ease-in-out infinite; }
    .animate-sparkle-1 { animation: sparkle 2s ease-in-out infinite; transform-origin: 40px 50px; }
    .animate-sparkle-2 { animation: sparkle 2s ease-in-out infinite 0.7s; transform-origin: 160px 70px; }
  `

  return (
    <div className="relative w-32 h-32 flex items-center justify-center select-none">
      <style>{svgStyle}</style>

      {/* Speech Bubble (only for needs_checkin) */}
      {state === 'needs_checkin' && (
        <div className="absolute -top-3 bg-orange-500 text-white text-[9px] font-black py-1 px-2.5 rounded-full shadow-md animate-bounce tracking-wide border border-orange-400 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-orange-500 z-30">
          AYO ABSEN MASUK!
        </div>
      )}

      {/* Speech Bubble (only for needs_checkout) */}
      {state === 'needs_checkout' && (
        <div className="absolute -top-3 bg-blue-600 text-white text-[9px] font-black py-1 px-2.5 rounded-full shadow-md animate-pulse tracking-wide border border-blue-500 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-blue-600 z-30">
          SEMANGAT KERJA!
        </div>
      )}

      {/* Speech Bubble (only for completed) */}
      {state === 'completed' && (
        <div className="absolute -top-3 bg-emerald-600 text-white text-[9px] font-black py-1 px-2.5 rounded-full shadow-md tracking-wide border border-emerald-500 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-emerald-600 z-30">
          SELESAI KERJA! 🎉
        </div>
      )}

      {/* Speech Bubble (only for day_off) */}
      {state === 'day_off' && (
        <div className="absolute -top-3 bg-indigo-600 text-white text-[9px] font-black py-1 px-2.5 rounded-full shadow-md tracking-wide border border-indigo-500 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-indigo-600 z-30">
          SELAMAT LIBUR! ☕
        </div>
      )}

      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          {/* Gradients */}
          <linearGradient id="body-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
          <linearGradient id="body-dark-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          <linearGradient id="screen-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="holo-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ea580c" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="eyes-glow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>

          {/* Shadow Filter */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Decorative Sparkles (completed or day_off state) */}
        {(state === 'completed' || state === 'day_off') && (
          <>
            <path className="animate-sparkle-1" d="M 40 45 L 42 40 L 40 35 L 38 40 Z" fill="#eab308" filter="url(#glow)" />
            <path className="animate-sparkle-1" d="M 35 40 L 40 40 L 45 40 Z" stroke="#eab308" strokeWidth="1" />
            
            <path className="animate-sparkle-2" d="M 160 65 L 162 60 L 160 55 L 158 60 Z" fill="#eab308" filter="url(#glow)" />
            <path className="animate-sparkle-2" d="M 155 60 L 160 60 L 165 60 Z" stroke="#eab308" strokeWidth="1" />
          </>
        )}

        {/* Main Floating Group */}
        <g className={(state === 'completed' || state === 'day_off') ? 'animate-float animate-dance' : 'animate-float'}>

          {/* Antennas / Gear */}
          {state === 'needs_checkout' ? (
            /* Brain Gear in Working State */
            <g className="animate-gear">
              <circle cx="100" cy="30" r="10" fill="none" stroke="#64748b" strokeWidth="2.5" strokeDasharray="4,2" />
              <circle cx="100" cy="30" r="4" fill="#64748b" />
            </g>
          ) : (
            /* Regular Antennas */
            <>
              {/* Left Antenna */}
              <line x1="75" y1="45" x2="65" y2="28" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
              <circle cx="65" cy="28" r="4" fill={state === 'completed' ? '#f43f5e' : state === 'day_off' ? '#6366f1' : '#ea580c'} />
              {/* Right Antenna */}
              <line x1="125" y1="45" x2="135" y2="28" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
              <circle cx="135" cy="28" r="4" fill={state === 'completed' ? '#f43f5e' : state === 'day_off' ? '#6366f1' : '#ea580c'} />
            </>
          )}

          {/* Ears (Left & Right) */}
          <rect x="52" y="65" width="8" height="20" rx="4" fill="#94a3b8" />
          <rect x="140" y="65" width="8" height="20" rx="4" fill="#94a3b8" />

          {/* HEAD (Base) */}
          <rect x="58" y="45" width="84" height="60" rx="28" fill="url(#body-grad)" stroke="#cbd5e1" strokeWidth="1.5" />

          {/* Screen Display Face */}
          <rect x="68" y="53" width="64" height="42" rx="16" fill="url(#screen-grad)" />

          {/* Eyes based on State */}
          {(state === 'needs_checkin' || state === 'day_off') && (
            /* Waving/Calm eyes (happy Senyum arcs) */
            <g filter="url(#glow)">
              <path d="M 78 74 Q 85 64 92 74" fill="none" stroke={state === 'day_off' ? '#818cf8' : 'url(#eyes-glow)'} strokeWidth="3.5" strokeLinecap="round" />
              <path d="M 108 74 Q 115 64 122 74" fill="none" stroke={state === 'day_off' ? '#818cf8' : 'url(#eyes-glow)'} strokeWidth="3.5" strokeLinecap="round" />
            </g>
          )}

          {/* Working State: Focused Eyes + Orange Glasses */}
          {state === 'needs_checkout' && (
            <>
              <g filter="url(#glow)">
                <ellipse cx="85" cy="74" rx="7" ry="2" fill="url(#eyes-glow)" />
                <ellipse cx="115" cy="74" rx="7" ry="2" fill="url(#eyes-glow)" />
              </g>
              {/* Sleek Glasses */}
              <path d="M 70 70 L 130 70" stroke="#f97316" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
              <rect x="73" y="66" width="22" height="12" rx="3" fill="none" stroke="#f97316" strokeWidth="2.5" opacity="0.9" />
              <rect x="105" y="66" width="22" height="12" rx="3" fill="none" stroke="#f97316" strokeWidth="2.5" opacity="0.9" />
            </>
          )}

          {/* Completed State: Happy Curved Eyes + Retro Sunglasses */}
          {state === 'completed' && (
            <>
              <g filter="url(#glow)">
                <path d="M 77 75 Q 85 65 93 75" fill="none" stroke="#facc15" strokeWidth="4" strokeLinecap="round" />
                <path d="M 107 75 Q 115 65 123 75" fill="none" stroke="#facc15" strokeWidth="4" strokeLinecap="round" />
              </g>
              {/* Retro Cool Sunglasses */}
              <path d="M 70 72 Q 100 68 130 72" stroke="#1e293b" strokeWidth="2" />
              <path d="M 72 70 C 75 85, 93 85, 96 70 Z" fill="#1e293b" opacity="0.95" />
              <path d="M 104 70 C 107 85, 125 85, 128 70 Z" fill="#1e293b" opacity="0.95" />
            </>
          )}

          {/* Loading / Fallback State */}
          {state === 'loading' && (
            <g filter="url(#glow)">
              <circle cx="85" cy="74" r="4.5" fill="url(#eyes-glow)" />
              <circle cx="115" cy="74" r="4.5" fill="url(#eyes-glow)" />
            </g>
          )}

          {/* Neck */}
          <rect x="92" y="102" width="16" height="10" rx="3" fill="#cbd5e1" />

          {/* BODY */}
          <path d="M 80 110 L 120 110 Q 135 110 130 140 L 70 140 Q 65 110 80 110 Z" fill="url(#body-grad)" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* Logo on Body */}
          <circle cx="100" cy="123" r="7.5" fill={state === 'completed' ? '#059669' : state === 'day_off' ? '#4f46e5' : '#ea580c'} />
          <path d="M 100 118.5 L 100 127.5 M 95.5 123 L 104.5 123" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />

          {/* Hologram Projector & Laptop (only for needs_checkout) */}
          {state === 'needs_checkout' && (
            <>
              {/* Holographic Projection Screen */}
              <polygon className="animate-holo" points="70,148 130,148 150,118 50,118" fill="url(#holo-grad)" />
              {/* Hologram Line Chart */}
              <path className="animate-holo" d="M 60 132 L 80 124 L 100 138 L 120 122 L 140 128" fill="none" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" filter="url(#glow)" />
              
              {/* Keyboard laptop base */}
              <rect x="68" y="145" width="64" height="6" rx="2" fill="#94a3b8" />
              <polygon points="72,145 128,145 124,139 76,139" fill="#e2e8f0" />
            </>
          )}

          {/* ARMS */}
          {state === 'needs_checkin' && (
            <>
              {/* Left Arm - Floating */}
              <rect x="52" y="112" width="10" height="24" rx="5" fill="url(#body-dark-grad)" stroke="#cbd5e1" strokeWidth="1" transform="rotate(15, 57, 112)" />
              {/* Right Arm - Waving Animation */}
              <g className="animate-wave">
                <rect x="138" y="100" width="10" height="28" rx="5" fill="url(#body-dark-grad)" stroke="#cbd5e1" strokeWidth="1" />
              </g>
            </>
          )}

          {/* Working State: Rapid Alternating Typing Arms */}
          {state === 'needs_checkout' && (
            <>
              {/* Typing Left Arm */}
              <g className="animate-type-l">
                <rect x="52" y="105" width="10" height="30" rx="5" fill="url(#body-dark-grad)" stroke="#cbd5e1" strokeWidth="1" />
              </g>
              {/* Typing Right Arm */}
              <g className="animate-type-r">
                <rect x="138" y="105" width="10" height="30" rx="5" fill="url(#body-dark-grad)" stroke="#cbd5e1" strokeWidth="1" />
              </g>
            </>
          )}

          {/* Completed / Day Off State: Relaxed Arm + Cup Straw */}
          {(state === 'completed' || state === 'day_off') && (
            <>
              {/* Left Arm holding a drink */}
              <g transform="rotate(35, 57, 112)">
                <rect x="52" y="112" width="10" height="24" rx="5" fill="url(#body-dark-grad)" stroke="#cbd5e1" strokeWidth="1" />
                {/* Cocktail Drink / Coffee Cup */}
                <path d="M 46 132 L 58 132 L 56 142 Q 52 145 48 142 Z" fill={state === 'day_off' ? '#4f46e5' : '#f43f5e'} />
                <line x1="52" y1="132" x2="48" y2="122" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
              </g>
              {/* Right Arm Waving Santai */}
              <rect x="138" y="112" width="10" height="24" rx="5" fill="url(#body-dark-grad)" stroke="#cbd5e1" strokeWidth="1" transform="rotate(-15, 143, 112)" />
            </>
          )}

          {/* Fallback / Loading Arms */}
          {(state === 'loading' || !state) && (
            <>
              <rect x="52" y="112" width="10" height="24" rx="5" fill="url(#body-dark-grad)" stroke="#cbd5e1" strokeWidth="1" />
              <rect x="138" y="112" width="10" height="24" rx="5" fill="url(#body-dark-grad)" stroke="#cbd5e1" strokeWidth="1" />
            </>
          )}

        </g>
      </svg>
    </div>
  )
}
