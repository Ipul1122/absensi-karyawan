import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import {
  Lock,
  User,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Bell,
  Smartphone
} from 'lucide-react'
import {
  isPushNotificationSupported,
  askNotificationPermission,
  subscribeUserToPush,
  unsubscribeUserFromPush,
  getExistingSubscription
} from '../../../utils/pushNotificationHelper'
import { API_BASE_URL } from '../../../utils/api'


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
  vapid_public_key?: string | null
  password_plain?: string | null
}

interface EmployeeSettingsProps {
  user: UserProp
  token: string
}

export default function EmployeeSettings({ user, token }: EmployeeSettingsProps) {
  const [profile, setProfile] = useState<ProfileData>({
    name: user.name,
    email: user.email,
    photo: null,
    vapid_public_key: null,
    password_plain: null
  })
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  // State untuk Notifikasi Push HP
  const [isSupported, setIsSupported] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [loadingNotification, setLoadingNotification] = useState(false)

  useEffect(() => {
    fetchProfile()
    checkNotificationStatus()
  }, [])

  const checkNotificationStatus = async () => {
    const supported = isPushNotificationSupported()
    setIsSupported(supported)
    if (supported) {
      try {
        const existing = await getExistingSubscription()
        setIsEnabled(!!existing)
      } catch (err) {
        console.error('Gagal mengecek status push notification browser:', err)
      }
    }
  }

  const fetchProfile = async () => {
    setLoadingProfile(true)
    try {
      const res = await axios.get(`${API_BASE_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data.status === 'success') {
        const d = res.data.data
        setProfile({
          name: d.name ?? '',
          email: d.email ?? '',
          photo: d.photo ?? null,
          vapid_public_key: d.vapid_public_key ?? null,
          password_plain: d.password_plain ?? null
        })
        if (d.photo) setPhotoPreview(d.photo)
      }
    } catch (err) {
      console.error('Gagal memuat profil:', err)
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleToggleNotification = async () => {
    if (!isSupported) return
    setLoadingNotification(true)
    try {
      if (isEnabled) {
        await unsubscribeUserFromPush(token)
        setIsEnabled(false)
        Swal.fire({
          title: 'Notifikasi Dinonaktifkan',
          text: 'Anda tidak akan menerima notifikasi pengingat absensi lagi di perangkat ini.',
          icon: 'info',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false,
          background: '#fffdfb',
          color: '#3c1105'
        })
      } else {
        const permission = await askNotificationPermission()
        if (permission === 'granted') {
          if (!profile.vapid_public_key) {
            throw new Error('Kunci VAPID belum terkonfigurasi di server. Harap hubungi Admin.')
          }
          await subscribeUserToPush(token, profile.vapid_public_key)
          setIsEnabled(true)
          Swal.fire({
            title: 'Notifikasi HP Aktif! 🚀',
            text: 'Pengingat absensi masuk & pulang otomatis akan dikirim ke HP Anda sebelum jam 08:30 (sesuai jadwal kerja).',
            icon: 'success',
            confirmButtonText: 'Luar Biasa!',
            background: '#fffdfb',
            color: '#3c1105',
            confirmButtonColor: '#ea580c'
          })
        } else {
          Swal.fire({
            title: 'Izin Notifikasi Ditolak',
            text: 'Harap izinkan notifikasi pada setelan browser HP Anda terlebih dahulu untuk mengaktifkan fitur ini.',
            icon: 'warning',
            confirmButtonText: 'Mengerti',
            background: '#fffdfb',
            color: '#3c1105',
            confirmButtonColor: '#ea580c'
          })
        }
      }
    } catch (err: any) {
      console.error('Gagal mengatur notifikasi push:', err)
      const errMsg = err.message || '';
      const errName = err.name || '';
      const isPermissionDenied = errMsg.includes('permission denied') || 
                                 errMsg.includes('denied') || 
                                 errName === 'AbortError' || 
                                 errName === 'NotAllowedError';

      if (isPermissionDenied) {
        Swal.fire({
          title: 'Izin Notifikasi Ditolak / Dibatasi 🚫',
          text: 'Browser Anda memblokir notifikasi push. Ini biasanya terjadi jika Anda menggunakan Mode Penyamaran (Incognito), memblokir izin notifikasi di setelan browser, atau browser tidak mendukung fitur ini.',
          icon: 'warning',
          confirmButtonText: 'Mengerti',
          background: '#fffdfb',
          color: '#3c1105',
          confirmButtonColor: '#ea580c'
        })
      } else {
        Swal.fire({
          title: 'Kesalahan Sistem',
          text: err.response?.data?.message || err.message || 'Terjadi kegagalan saat menghubungi server.',
          icon: 'error',
          confirmButtonText: 'Tutup',
          background: '#fffdfb',
          color: '#3c1105',
          confirmButtonColor: '#ea580c'
        })
      }
    } finally {
      setLoadingNotification(false)
    }
  }

  const handleTestNotification = async () => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/push-subscriptions/test`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      if (res.data.status === 'success') {
        Swal.fire({
          title: 'Terkirim!',
          text: 'Notifikasi uji coba berhasil dikirim ke handphone Anda.',
          icon: 'success',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false,
          background: '#fffdfb',
          color: '#3c1105'
        })
      }
    } catch (err: any) {
      console.error('Gagal mengirim notifikasi tes:', err)
      Swal.fire({
        title: 'Gagal Mengirim Tes',
        text: err.response?.data?.message || 'Pastikan perangkat ini sudah diizinkan menerima notifikasi.',
        icon: 'error',
        confirmButtonText: 'Tutup',
        background: '#fffdfb',
        color: '#3c1105',
        confirmButtonColor: '#ea580c'
      })
    }
  }


  const labelClass = "block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 font-quicksand"

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5 animate-fade-in">
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
                  value={profile.password_plain || ''}
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

      {/* ========================================================
          SECTION NOTIFIKASI PUSH HANDPHONE
      ======================================================== */}
      <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="border-b border-orange-100 pb-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
            <Bell className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 font-quicksand">Notifikasi Handphone (Push)</h2>
            <p className="text-[11px] text-slate-500 font-quicksand">Menerima pengingat absensi masuk & pulang langsung di bar notifikasi HP Anda.</p>
          </div>
        </div>

        {!isSupported ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <span className="text-amber-600 shrink-0 mt-0.5 text-base">⚠️</span>
            <div>
              <p className="text-xs font-bold text-amber-800 font-quicksand">Perangkat/Browser Tidak Didukung</p>
              <p className="text-[10px] text-amber-700 mt-1 leading-relaxed font-quicksand">
                Browser atau perangkat Anda saat ini tidak mendukung Web Push Notification.
                Untuk pengguna iPhone/iOS, pastikan Anda menggunakan iOS 16.4+ dan telah menambahkan web ini ke Home Screen (Add to Home Screen) melalui browser Safari terlebih dahulu.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl group transition-all duration-300">
              <div className="space-y-1">
                <p className="text-xs font-black text-slate-700 font-quicksand">Aktifkan Pengingat Harian</p>
                <p className="text-[10px] text-slate-500 font-quicksand leading-relaxed max-w-md">
                  Server akan mengirimkan notifikasi push ke HP Anda setiap hari kerja sebelum pukul 08:30 pagi jika Anda belum absen masuk, dan pengingat pulang pukul 17:30.
                </p>
              </div>

              {/* IOS Styled Premium Toggle Switch */}
              <button
                onClick={handleToggleNotification}
                disabled={loadingNotification}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isEnabled ? 'bg-indigo-600' : 'bg-slate-200'
                } ${loadingNotification ? 'opacity-50 cursor-wait' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {isEnabled && (
              <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-indigo-50/30 border border-indigo-100 rounded-2xl animate-fade-in">
                <div className="flex-grow text-center sm:text-left">
                  <p className="text-xs font-bold text-indigo-900 font-quicksand">Notifikasi Berhasil Diaktifkan! 🎉</p>
                  <p className="text-[10px] text-indigo-700 mt-0.5 font-quicksand">Status terdaftar untuk perangkat ini. Anda bisa menguji koneksi notifikasi push sekarang.</p>
                </div>
                <button
                  onClick={handleTestNotification}
                  className="bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 hover:border-indigo-300 text-[11px] font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 shrink-0 cursor-pointer hover:-translate-y-0.5"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Kirim Notifikasi Tes
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
