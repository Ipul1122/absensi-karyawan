import { Link } from 'react-router-dom'
import { HelpCircle, ArrowLeft } from 'lucide-react'

export default function Error404() {
  // Determine where to redirect based on user role in storage
  const getHomePath = (): string => {
    const savedUser = sessionStorage.getItem('auth_user') || localStorage.getItem('auth_user')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        if (user.role === 'admin') return '/admin/dashboard'
        if (user.role === 'director') return '/director/dashboard'
        return '/employee/dashboard'
      } catch {
        return '/'
      }
    }
    return '/'
  }

  const homePath = getHomePath()

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center p-4 sm:p-8 font-quicksand relative overflow-hidden">
      {/* Decorative Blur Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-orange-100/30 blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-red-50/20 blur-3xl translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="max-w-md w-full bg-white border border-orange-100 rounded-3xl p-8 sm:p-10 shadow-xl shadow-orange-950/5 relative overflow-hidden z-10 text-center animate-in fade-in zoom-in-95 duration-300">
        {/* Top Decorative Line */}
        <div className="absolute top-0 left-0 w-full h-[4px] bg-[#dc2626]" />

        {/* Large Styled Error Code */}
        <div className="relative inline-block mb-6">
          <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-orange-600 font-montserrat tracking-tighter">
            404
          </h1>
          <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-orange-100/60 text-[#dc2626] flex items-center justify-center animate-bounce">
            <HelpCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Header Title */}
        <h2 className="text-xl font-bold text-slate-800 font-montserrat uppercase tracking-wide mb-3">
          Halaman Tidak Ditemukan
        </h2>
        
        {/* Description */}
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          Maaf, halaman yang Anda cari tidak tersedia, telah dihapus, atau alamat URL yang Anda masukkan salah.
        </p>

        {/* Action Button */}
        <div className="flex justify-center">
          <Link
            to={homePath}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-sm font-bold rounded-2xl shadow-lg shadow-red-600/10 hover:shadow-red-600/20 transition-all duration-250 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
        </div>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-orange-100/60 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          goodpeople-hcms • Portal Absensi & Payroll
        </div>
      </div>
    </div>
  )
}
