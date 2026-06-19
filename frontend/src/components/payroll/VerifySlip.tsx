import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { 
  XCircle, 
  Loader2, 
  ShieldCheck, 
  Building2, 
  User, 
  Hash, 
  Calendar, 
  Coins, 
  CalendarCheck2
} from 'lucide-react'

interface VerifiedData {
  id: number
  employee_name: string
  employee_number: string | null
  company: string
  division: string | null
  period_month: string
  net_salary: number
  status: 'draft' | 'unpaid' | 'paid'
  verified_at: string
}

export default function VerifySlip() {
  const { id, hash } = useParams<{ id: string; hash: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<VerifiedData | null>(null)

  const fetchVerification = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(`http://localhost:8000/api/payroll/verify/${id}/${hash}`)
      if (response.data.status === 'success') {
        setData(response.data.data)
      } else {
        setError(response.data.message || 'Verifikasi gagal.')
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Tidak dapat memvalidasi tanda tangan digital slip gaji ini.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id && hash) {
      fetchVerification()
    } else {
      setError('Parameter verifikasi tidak lengkap.')
      setLoading(false)
    }
  }, [id, hash])

  useEffect(() => {
    if (data) {
      const titleEl = document.querySelector('title')
      const faviconEl = document.getElementById('favicon') as HTMLLinkElement | null

      let titleText = 'goodpeople-hcms - Verifikasi Slip Gaji'
      let faviconHref = '/favicon.svg'

      if (data.company === 'PT Yasodana Parvez Internasional') {
        titleText = 'goodpeople-hcms - Verifikasi Slip - PT Yasodana Parvez Internasional'
        faviconHref = '/logo/LOGO-YPI.png'
      } else if (data.company === 'PT Cakrawala Parama Internasional') {
        titleText = 'goodpeople-hcms - Verifikasi Slip - PT Cakrawala Parama Internasional'
        faviconHref = '/logo/LOGO-CPI.png'
      }

      if (titleEl) titleEl.innerText = titleText
      if (faviconEl) {
        faviconEl.type = faviconHref.endsWith('.png') ? 'image/png' : 'image/svg+xml'
        faviconEl.href = faviconHref
      }
    }
  }, [data])

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number)
  }

  const getIndonesianMonthLabel = (periodMonth: string) => {
    if (!periodMonth) return ''
    const [year, month] = periodMonth.split('-')
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    return `${monthNames[parseInt(month, 10) - 1]} ${year}`
  }

  const isYPI = data?.company === 'PT Yasodana Parvez Internasional'
  const logoSrc = isYPI ? '/logo/LOGO-YPI.png' : '/logo/LOGO-CPI.png'
  const logoAlt = data?.company || 'PT Cakrawala Parama Internasional'

  return (
    <div className="min-h-screen bg-[#fcf9f5] flex items-center justify-center p-4 font-quicksand">
      <div className="max-w-md w-full bg-white border border-orange-100 rounded-3xl p-6 shadow-xl shadow-orange-950/5 relative overflow-hidden">
        {/* Top Decorative bar */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-red-500 via-orange-500 to-amber-500"></div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-xs">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-3" />
            <p className="font-bold">Memverifikasi keaslian dokumen...</p>
            <p className="text-[10px] text-slate-400 mt-1">Menghubungkan ke secure server absensi</p>
          </div>
        ) : error ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center text-red-500 mx-auto shadow-sm animate-bounce">
              <XCircle className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Verifikasi Gagal</h3>
              <p className="text-xs text-rose-600 font-semibold mt-1">Slip Gaji Tidak Valid / Palsu</p>
              <p className="text-[11px] text-slate-400 mt-2 px-4 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl py-3 italic">
                "{error}"
              </p>
            </div>
            <div className="pt-4">
              <Link 
                to="/" 
                className="inline-flex items-center justify-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Kembali ke Portal Login
              </Link>
            </div>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Header Logo & Verification Badge */}
            <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-orange-50">
              <div className="h-12 flex items-center justify-center">
                <img 
                  src={logoSrc} 
                  alt={logoAlt} 
                  className="max-h-full w-auto object-contain"
                  onError={(e) => {
                    // Fallback if logo image fails to load
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800 font-montserrat uppercase tracking-wide">
                  {data.company}
                </h4>
              </div>

              {/* Status Verification Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm mt-1 animate-fade-in">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Slip Gaji Terverifikasi Resmi
              </div>
            </div>

            {/* Validation Details */}
            <div className="space-y-3.5 bg-orange-50/10 border border-orange-100/30 rounded-2xl p-4 font-semibold text-xs text-slate-600 font-quicksand">
              {/* Employee info */}
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Nama Penerima</span>
                  <span className="text-slate-800 font-bold text-sm block">{data.employee_name}</span>
                </div>
              </div>

              {/* NIP */}
              <div className="flex items-start gap-3">
                <Hash className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">NIP / Karyawan ID</span>
                  <span className="text-slate-800 font-bold block">{data.employee_number || '-'}</span>
                </div>
              </div>

              {/* Division */}
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Divisi / Jabatan</span>
                  <span className="text-slate-800 font-bold block">{data.division || '-'}</span>
                </div>
              </div>

              {/* Period */}
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Bulan Periode</span>
                  <span className="text-slate-800 font-bold block">{getIndonesianMonthLabel(data.period_month)}</span>
                </div>
              </div>

              {/* Net Salary */}
              <div className="flex items-start gap-3 pt-2 border-t border-dashed border-orange-100">
                <Coins className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                <div className="flex-1">
                  <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Gaji Bersih Diterima</span>
                  <span className="text-slate-900 font-black text-base font-montserrat block">
                    {formatRupiah(data.net_salary)}
                  </span>
                </div>
              </div>

              {/* Payment Status */}
              <div className="flex items-start gap-3">
                <CalendarCheck2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Status Pembayaran</span>
                  <div className="mt-1">
                    {data.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        LUNAS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                        PENDING / DRAFT
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Digital Seal / Date of Validation */}
            <div className="text-center space-y-2 pt-2 border-t border-orange-50 text-[10px] text-slate-400 font-bold">
              <p>Diverifikasi secara aman via tanda tangan digital kriptografi.</p>
              <p className="text-[9px] text-slate-300">
                Waktu Validasi: {new Date(data.verified_at).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
              <div className="pt-2">
                <Link 
                  to="/" 
                  className="inline-flex items-center justify-center px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold rounded-xl text-xs transition-all cursor-pointer border border-orange-100"
                >
                  Masuk ke Portal Absensi
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
