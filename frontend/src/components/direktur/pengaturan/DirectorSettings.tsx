import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import {
  Lock,
  Save,
  ShieldCheck,
  KeyRound,
  User,
  Mail,
  Camera,
  Loader2,
  UserCircle2,
  Info,
  Eye,
  EyeOff
} from 'lucide-react'

interface UserProp {
  id: number
  name: string
  email: string
  role: 'admin' | 'employee' | 'director'
}

interface ProfileData {
  name: string
  email: string
  photo: string | null
}

interface DirectorSettingsProps {
  user: UserProp
  token: string
  onProfileUpdate: (updatedFields: { name: string; email: string; photo?: string | null }) => void
}

export default function DirectorSettings({ user, token, onProfileUpdate }: DirectorSettingsProps) {
  // ---------- Profile / Biodata States ----------
  const [profile, setProfile] = useState<ProfileData>({
    name: user.name,
    email: user.email,
    photo: null
  })
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ---------- Password States ----------
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
      console.error('Gagal memuat profil Direktur:', err)
    } finally {
      setLoadingProfile(false)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({ 
        title: 'Foto Terlalu Besar', 
        text: 'Ukuran foto maksimal 2MB.', 
        icon: 'warning', 
        background: '#fffdfb', 
        color: '#3c1105' 
      })
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile.name || !profile.email) {
      Swal.fire({ 
        title: 'Form Belum Lengkap', 
        text: 'Nama dan Email wajib diisi.', 
        icon: 'warning', 
        background: '#fffdfb', 
        color: '#3c1105' 
      })
      return
    }

    setSavingProfile(true)
    try {
      const formData = new FormData()
      formData.append('name', profile.name)
      formData.append('email', profile.email)
      if (photoFile) formData.append('photo', photoFile)

      const res = await axios.post('http://localhost:8000/api/user/profile', formData, {
        headers: { 
          Authorization: `Bearer ${token}`, 
          'Content-Type': 'multipart/form-data' 
        }
      })

      if (res.data.status === 'success') {
        Swal.fire({ 
          title: 'Berhasil!', 
          text: 'Nama dan foto profil Anda berhasil diperbarui.', 
          icon: 'success', 
          background: '#fffdfb', 
          color: '#3c1105', 
          timer: 2000, 
          showConfirmButton: false 
        })
        setPhotoFile(null)
        const updatedData = res.data.data
        setProfile({
          name: updatedData.name ?? '',
          email: updatedData.email ?? '',
          photo: updatedData.photo ?? null
        })
        if (updatedData.photo) setPhotoPreview(updatedData.photo)
        
        // Sync changes with Navbar/Sidebar state in App.tsx
        onProfileUpdate({
          name: updatedData.name,
          email: updatedData.email,
          photo: updatedData.photo
        })
      }
    } catch (err: any) {
      let msg = 'Gagal menyimpan data profil.'
      if (err.response?.data?.errors) {
        msg = Object.values(err.response.data.errors).flat().join('\n')
      } else if (err.response?.data?.message) {
        msg = err.response.data.message
      }
      Swal.fire({ 
        title: 'Gagal Menyimpan', 
        text: msg, 
        icon: 'error', 
        background: '#fffdfb', 
        color: '#3c1105' 
      })
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      Swal.fire({ 
        title: 'Form Belum Lengkap', 
        text: 'Silakan isi semua kolom kata sandi.', 
        icon: 'warning', 
        background: '#fffdfb', 
        color: '#3c1105' 
      })
      return
    }
    if (newPassword.length < 6) {
      Swal.fire({ 
        title: 'Sandi Terlalu Pendek', 
        text: 'Kata sandi baru minimal 6 karakter.', 
        icon: 'warning', 
        background: '#fffdfb', 
        color: '#3c1105' 
      })
      return
    }
    if (newPassword !== confirmPassword) {
      Swal.fire({ 
        title: 'Konfirmasi Sandi Salah', 
        text: 'Konfirmasi kata sandi tidak cocok.', 
        icon: 'warning', 
        background: '#fffdfb', 
        color: '#3c1105' 
      })
      return
    }

    setSavingPassword(true)
    try {
      const res = await axios.put('http://localhost:8000/api/user/change-password',
        { current_password: currentPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.data.status === 'success') {
        Swal.fire({ 
          title: 'Berhasil!', 
          text: 'Kata sandi Anda berhasil diperbarui.', 
          icon: 'success', 
          background: '#fffdfb', 
          color: '#3c1105', 
          timer: 2000, 
          showConfirmButton: false 
        })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err: any) {
      let msg = 'Gagal mengubah kata sandi.'
      if (err.response?.data?.errors) {
        msg = Object.values(err.response.data.errors).flat().join('\n')
      } else if (err.response?.data?.message) {
        msg = err.response.data.message
      }
      Swal.fire({ 
        title: 'Gagal Mengubah Sandi', 
        text: msg, 
        icon: 'error', 
        background: '#fffdfb', 
        color: '#3c1105' 
      })
    } finally {
      setSavingPassword(false)
    }
  }

  const inputClass = "w-full bg-slate-50 border border-slate-200 hover:border-orange-200 focus:border-orange-500 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 pl-10 pr-4 outline-none transition-all text-xs font-semibold font-quicksand focus:ring-2 focus:ring-orange-100"
  const passwordInputClass = "w-full bg-slate-50 border border-slate-200 hover:border-orange-200 focus:border-orange-500 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 pl-10 pr-10 outline-none transition-all text-xs font-semibold font-quicksand focus:ring-2 focus:ring-orange-100"
  const labelClass = "block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 font-quicksand"

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in font-quicksand">

      {/* Welcome Banner */}
      <div className="flex items-start gap-3.5 p-4.5 bg-gradient-to-r from-amber-50 to-orange-50/50 border border-orange-100/70 rounded-2xl text-orange-950 shadow-sm">
        <Info className="w-5 h-5 shrink-0 text-orange-600 mt-0.5" />
        <div className="text-xs font-semibold leading-relaxed">
          Sebagai <strong>Direktur Utama</strong>, Anda memiliki hak penuh untuk memperbarui nama, alamat email, foto profil, dan kata sandi login Anda secara mandiri di sini.
        </div>
      </div>

      {loadingProfile ? (
        <div className="flex items-center justify-center py-12 gap-2 text-slate-400 bg-white border border-orange-100/80 rounded-3xl p-6 shadow-sm">
          <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
          <span className="text-xs font-bold">Memuat profil Direktur...</span>
        </div>
      ) : (
        <>
          {/* SECTION 1: BIODATA FORM */}
          <section className="bg-white border border-orange-100/80 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="border-b border-orange-100 pb-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-200">
                <UserCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Biodata Direktur</h2>
                <p className="text-[11px] text-slate-500">Perbarui nama dan foto profil Anda sebagai Direktur Utama.</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-5">
              {/* ---- Photo Upload ---- */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4.5 bg-orange-50/20 border border-orange-100/50 rounded-2xl">
                <div className="relative shrink-0">
                  {photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt="Foto Profil"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-orange-200 shadow-md shadow-orange-100" 
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-100 to-orange-100 border-2 border-orange-200 flex items-center justify-center shadow-sm">
                      <User className="w-8 h-8 text-orange-300" />
                    </div>
                  )}
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-7 h-7 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-grow text-center sm:text-left">
                  <p className="text-sm font-bold text-slate-700">Foto Profil Direktur</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Format: JPG, PNG, WEBP · Maks. 2MB</p>
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-orange-200 hover:border-orange-300 hover:bg-orange-50 text-slate-600 hover:text-orange-600 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {photoPreview ? 'Ganti Foto' : 'Unggah Foto'}
                  </button>
                  {photoFile && (
                    <p className="mt-1.5 text-[10px] text-emerald-600 font-bold">
                      ✓ Siap diunggah: {photoFile.name}
                    </p>
                  )}
                </div>
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp" 
                  className="hidden" 
                  onChange={handlePhotoChange} 
                />
              </div>

              {/* ---- Nama & Email ---- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nama Lengkap</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input 
                      type="text" 
                      required
                      value={profile.name} 
                      onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                      placeholder="Masukkan nama lengkap Anda" 
                      className={inputClass} 
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Alamat Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input 
                      type="email" 
                      required
                      value={profile.email} 
                      onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                      placeholder="nama@perusahaan.com" 
                      className={inputClass} 
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button 
                  type="submit" 
                  disabled={savingProfile}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-md shadow-orange-500/15 cursor-pointer text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingProfile ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Simpan Biodata
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* SECTION 2: PASSWORD CHANGE FORM */}
          <section className="bg-white border border-orange-100/80 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="border-b border-orange-100 pb-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-200">
                <KeyRound className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Keamanan & Sandi</h2>
                <p className="text-[11px] text-slate-500">Ubah kata sandi login Anda secara berkala untuk keamanan akun.</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className={labelClass}>Kata Sandi Saat Ini</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input 
                    type={showCurrentPassword ? "text" : "password"} 
                    required 
                    value={currentPassword} 
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan kata sandi login aktif" 
                    className={passwordInputClass} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-orange-500 transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Kata Sandi Baru</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-sans">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input 
                      type={showNewPassword ? "text" : "password"} 
                      required 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min. 6 karakter" 
                      className={passwordInputClass} 
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-orange-500 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Konfirmasi Sandi Baru</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-sans">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      required 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang sandi baru" 
                      className={passwordInputClass} 
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-orange-500 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button 
                  type="submit" 
                  disabled={savingPassword}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-md shadow-orange-500/15 cursor-pointer text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingPassword ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                      Memperbarui...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Perbarui Kata Sandi
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Security tips */}
            <div className="flex items-start gap-3 p-4 bg-orange-50/20 border border-orange-100/50 rounded-2xl">
              <ShieldCheck className="w-4.5 h-4.5 text-orange-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-500 leading-relaxed">
                <strong className="text-slate-700">Rekomendasi Keamanan:</strong> Gunakan kombinasi huruf besar-kecil, angka, dan simbol unik. Ganti kata sandi secara berkala minimal 3-6 bulan sekali, dan hindari menggunakan kata sandi yang sama dengan situs web lain.
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
