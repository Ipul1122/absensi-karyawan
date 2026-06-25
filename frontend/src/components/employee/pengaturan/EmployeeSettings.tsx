import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Lock,
  User,
  Mail,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react'

interface UserProp {
  id: number
  name: string
  email: string
  role: 'admin' | 'employee'
}

interface ProfileData {
  name: string
  email: string
  photo: string | null
}

interface EmployeeSettingsProps {
  user: UserProp
  token: string
}

export default function EmployeeSettings({ user, token }: EmployeeSettingsProps) {
  const [profile, setProfile] = useState<ProfileData>({
    name: user.name,
    email: user.email,
    photo: null
  })
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoadingProfile(true)
    try {
      const res = await axios.get('http://localhost:8000/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data.status === 'success') {
        const d = res.data.data
        setProfile({
          name: d.name ?? '',
          email: d.email ?? '',
          photo: d.photo ?? null
        })
        if (d.photo) setPhotoPreview(d.photo)
      }
    } catch (err) {
      console.error('Gagal memuat profil:', err)
    } finally {
      setLoadingProfile(false)
    }
  }

  const labelClass = "block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 font-quicksand"

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="border-b border-orange-100 pb-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-md shadow-red-200">
            <KeyRound className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 font-quicksand">Informasi Kredensial Akun</h2>
            <p className="text-[11px] text-slate-500 font-quicksand">Kredensial login Anda (Nama/Username, Gmail & Sandi).</p>
          </div>
        </div>

        {/* User info summary */}
        <div className="flex items-center gap-4 p-3.5 bg-orange-50/40 border border-orange-100 rounded-2xl">
          {photoPreview ? (
            <img src={photoPreview} alt="Foto" className="w-10 h-10 rounded-xl object-cover border-2 border-orange-200 shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-grow min-w-0">
            <p className="text-xs font-bold text-slate-800 font-quicksand truncate">{profile.name || user.name}</p>
            <p className="text-[11px] text-slate-500 font-mono truncate">{profile.email || user.email}</p>
          </div>
          <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full font-quicksand">
            Karyawan
          </span>
        </div>

        {loadingProfile ? (
          <div className="flex items-center justify-center py-6 gap-2 text-slate-400">
            <span className="w-4 h-4 border-2 border-slate-300 border-t-red-500 rounded-full animate-spin shrink-0" />
            <span className="text-xs font-semibold font-quicksand">Memuat kredensial...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className={labelClass}>Username / Nama</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  readOnly
                  value={profile.name}
                  className="w-full bg-slate-100 border border-slate-200 text-slate-550 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold font-quicksand cursor-not-allowed"
                />
              </div>
            </div>

            {/* Gmail */}
            <div>
              <label className={labelClass}>Gmail / Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  readOnly
                  value={profile.email}
                  className="w-full bg-slate-100 border border-slate-200 text-slate-550 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold font-quicksand cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={labelClass}>Password / Sandi</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  readOnly
                  value="goodpeople123"
                  className="w-full bg-slate-100 border border-slate-200 text-slate-550 rounded-xl py-2.5 pl-10 pr-10 text-xs font-semibold font-quicksand cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Safety notice */}
        <div className="flex items-start gap-3 p-3.5 bg-orange-50/30 border border-orange-100 rounded-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 mt-1 animate-pulse" />
          <p className="text-[11px] text-slate-500 leading-relaxed font-quicksand">
            <strong className="text-slate-700">Tips Keamanan:</strong> Jangan gunakan kata sandi yang mudah ditebak. Selalu logout dari perangkat publik setelah presensi. Jika Anda lupa kata sandi Anda, gunakan opsi "Lupa Sandi" pada halaman login.
          </p>
        </div>
      </section>
    </div>
  )
}
