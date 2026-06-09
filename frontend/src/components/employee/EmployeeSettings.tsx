import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import {
  Lock,
  Save,
  ShieldAlert,
  KeyRound,
  User,
  Mail,
  MapPin,
  Calendar,
  Hash,
  Briefcase,
  Camera,
  Loader2,
  UserCircle2,
  Settings,
  ClipboardList,
  CheckCircle2,
  FileText,
  FileUp
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
  date_of_birth: string
  address: string
  employee_number: string
  join_date: string
  gender: string
  cv: string | null
}

interface EmployeeSettingsProps {
  user: UserProp
  token: string
  onProfileUpdate?: () => void
}

type ActiveTab = 'account' | 'biodata'

export default function EmployeeSettings({ user, token, onProfileUpdate }: EmployeeSettingsProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('account')

  // ---------- Profile / Biodata States ----------
  const [profile, setProfile] = useState<ProfileData>({
    name: user.name,
    email: user.email,
    photo: null,
    date_of_birth: '',
    address: '',
    employee_number: '',
    join_date: '',
    gender: '',
    cv: null
  })
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ---------- Password States ----------
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

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
          photo: d.photo ?? null,
          date_of_birth: d.date_of_birth ?? '',
          address: d.address ?? '',
          employee_number: d.employee_number ?? '',
          join_date: d.join_date ?? '',
          gender: d.gender ?? '',
          cv: d.cv ?? null
        })
        if (d.photo) setPhotoPreview(d.photo)
      }
    } catch (err) {
      console.error('Gagal memuat profil:', err)
    } finally {
      setLoadingProfile(false)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({ title: 'Foto Terlalu Besar', text: 'Ukuran foto maksimal 2MB.', icon: 'warning', background: '#fffdfb', color: '#3c1105' })
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const isAllowedExt = ['pdf', 'doc', 'docx'].includes(fileExtension || '')
    
    if (!allowedTypes.includes(file.type) && !isAllowedExt) {
      Swal.fire({
        title: 'Format File Salah',
        text: 'Hanya file PDF, DOC, atau DOCX yang diperbolehkan.',
        icon: 'warning',
        background: '#fffdfb',
        color: '#3c1105'
      })
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        title: 'File Terlalu Besar',
        text: 'Ukuran CV maksimal 5MB.',
        icon: 'warning',
        background: '#fffdfb',
        color: '#3c1105'
      })
      return
    }
    setCvFile(file)
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile.name.trim() || !profile.email.trim()) {
      Swal.fire({ title: 'Form Belum Lengkap', text: 'Nama dan email wajib diisi.', icon: 'warning', background: '#fffdfb', color: '#3c1105' })
      return
    }
    setSavingProfile(true)
    try {
      const formData = new FormData()
      formData.append('name', profile.name)
      formData.append('email', profile.email)
      if (profile.date_of_birth) formData.append('date_of_birth', profile.date_of_birth)
      if (profile.address) formData.append('address', profile.address)
      if (profile.employee_number) formData.append('employee_number', profile.employee_number)
      if (profile.join_date) formData.append('join_date', profile.join_date)
      if (profile.gender) formData.append('gender', profile.gender)
      if (photoFile) formData.append('photo', photoFile)
      if (cvFile) formData.append('cv', cvFile)

      const res = await axios.post('http://localhost:8000/api/user/profile', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      })
      if (res.data.status === 'success') {
        Swal.fire({ title: 'Biodata Diperbarui!', text: 'Data profil Anda berhasil disimpan.', icon: 'success', background: '#fffdfb', color: '#3c1105', timer: 2000, showConfirmButton: false })
        setPhotoFile(null)
        setCvFile(null)
        if (res.data.data.photo) setPhotoPreview(res.data.data.photo)
        if (res.data.data.cv) {
          setProfile(p => ({ ...p, cv: res.data.data.cv }))
        }
        if (onProfileUpdate) {
          onProfileUpdate()
        }
      }
    } catch (err: any) {
      Swal.fire({ title: 'Gagal Menyimpan', text: err.response?.data?.message || 'Gagal menyimpan profil.', icon: 'error', background: '#fffdfb', color: '#3c1105' })
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      Swal.fire({ title: 'Form Belum Lengkap', text: 'Silakan isi semua kolom kata sandi.', icon: 'warning', background: '#fffdfb', color: '#3c1105' })
      return
    }
    if (newPassword.length < 6) {
      Swal.fire({ title: 'Sandi Terlalu Pendek', text: 'Kata sandi baru minimal 6 karakter.', icon: 'warning', background: '#fffdfb', color: '#3c1105' })
      return
    }
    if (newPassword !== confirmPassword) {
      Swal.fire({ title: 'Konfirmasi Sandi Salah', text: 'Konfirmasi kata sandi tidak cocok.', icon: 'warning', background: '#fffdfb', color: '#3c1105' })
      return
    }
    setSavingPassword(true)
    try {
      const res = await axios.put('http://localhost:8000/api/user/change-password',
        { current_password: currentPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.data.status === 'success') {
        Swal.fire({ title: 'Berhasil!', text: 'Kata sandi berhasil diperbarui.', icon: 'success', background: '#fffdfb', color: '#3c1105', timer: 2000, showConfirmButton: false })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err: any) {
      Swal.fire({ title: 'Gagal Mengubah Sandi', text: err.response?.data?.message || 'Gagal mengubah kata sandi.', icon: 'error', background: '#fffdfb', color: '#3c1105' })
    } finally {
      setSavingPassword(false)
    }
  }

  const inputClass = "w-full bg-slate-50 border border-slate-200 hover:border-orange-200 focus:border-red-400 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 pl-10 pr-4 outline-none transition-all text-xs font-medium font-quicksand focus:ring-2 focus:ring-red-100"
  const labelClass = "block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 font-quicksand"

  const tabs: { key: ActiveTab; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      key: 'account',
      label: 'Atur Akun',
      icon: <Settings className="w-4 h-4" />,
      desc: 'Email & Kata Sandi'
    },
    {
      key: 'biodata',
      label: 'Atur Biodata',
      icon: <ClipboardList className="w-4 h-4" />,
      desc: 'Data Pribadi & Foto'
    }
  ]

  // Biodata completeness indicator
  const biodataFields = [profile.photo, profile.date_of_birth, profile.address, profile.employee_number, profile.join_date, profile.gender, profile.cv]
  const filled = biodataFields.filter(Boolean).length
  const totalFields = biodataFields.length
  const percent = Math.round((filled / totalFields) * 100)

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">

      {/* ===== TAB SWITCHER ===== */}
      <div className="grid grid-cols-2 gap-3">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all cursor-pointer group ${
              activeTab === tab.key
                ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-300 shadow-md shadow-red-100'
                : 'bg-white border-orange-100 hover:border-orange-200 hover:bg-orange-50/30'
            }`}
          >
            {/* Icon bubble */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              activeTab === tab.key
                ? 'bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-md shadow-red-300'
                : 'bg-orange-50 text-orange-400 group-hover:bg-orange-100'
            }`}>
              {tab.icon}
            </div>
            <div className="flex-grow min-w-0">
              <p className={`text-xs font-extrabold font-quicksand truncate ${activeTab === tab.key ? 'text-red-700' : 'text-slate-700'}`}>
                {tab.label}
              </p>
              <p className="text-[10px] text-slate-400 font-quicksand truncate">{tab.desc}</p>
            </div>
            {/* Active indicator dot */}
            {activeTab === tab.key && (
              <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
            {/* Biodata completion badge */}
            {tab.key === 'biodata' && (
              <div className={`absolute bottom-2 right-3 text-[9px] font-bold font-mono ${percent === 100 ? 'text-emerald-600' : 'text-orange-500'}`}>
                {percent}%
              </div>
            )}
          </button>
        ))}
      </div>

      {/* ===== TAB: ATUR AKUN ===== */}
      {activeTab === 'account' && (
        <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-5 animate-fade-in">
          <div className="border-b border-orange-100 pb-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-md shadow-red-200">
              <KeyRound className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 font-quicksand">Pengaturan Akun</h2>
              <p className="text-[11px] text-slate-500 font-quicksand">Ubah kata sandi login Anda secara berkala.</p>
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

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className={labelClass}>Kata Sandi Saat Ini</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan kata sandi aktif" className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Kata Sandi Baru</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Lock className="w-4 h-4" /></div>
                  <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 6 karakter" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Konfirmasi Sandi Baru</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Lock className="w-4 h-4" /></div>
                  <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang sandi baru" className={inputClass} />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button type="submit" disabled={savingPassword}
                className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-md shadow-red-500/15 cursor-pointer text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed font-quicksand">
                {savingPassword
                  ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />Menyimpan...</>
                  : <><Save className="w-4 h-4" />Perbarui Kata Sandi</>}
              </button>
            </div>
          </form>

          {/* Safety notice */}
          <div className="flex items-start gap-3 p-3.5 bg-orange-50/30 border border-orange-100 rounded-xl">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-500 leading-relaxed font-quicksand">
              <strong className="text-slate-700">Tips Keamanan:</strong> Jangan gunakan kata sandi yang mudah ditebak. Selalu logout dari perangkat publik setelah presensi.
            </p>
          </div>
        </section>
      )}

      {/* ===== TAB: ATUR BIODATA ===== */}
      {activeTab === 'biodata' && (
        <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-5 animate-fade-in">
          <div className="border-b border-orange-100 pb-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-md shadow-red-200">
                <UserCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800 font-quicksand">Data Biodata</h2>
                <p className="text-[11px] text-slate-500 font-quicksand">Informasi pribadi untuk administrasi perusahaan.</p>
              </div>
            </div>
            {/* Completion progress */}
            <div className="shrink-0 flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5">
                {percent === 100 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                <span className={`text-xs font-bold font-mono ${percent === 100 ? 'text-emerald-600' : 'text-orange-500'}`}>{percent}%</span>
              </div>
              <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${percent === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-red-400 to-orange-500'}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-400 font-quicksand">Kelengkapan Data</span>
            </div>
          </div>

          {loadingProfile ? (
            <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-red-400" />
              <span className="text-xs font-semibold font-quicksand">Memuat data...</span>
            </div>
          ) : (
            <form onSubmit={handleProfileSubmit} className="space-y-5">

              {/* ---- Photo Upload ---- */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-orange-50/30 border border-orange-100 rounded-2xl">
                <div className="relative shrink-0">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Foto Profil"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-orange-200 shadow-md shadow-orange-100" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-red-100 to-orange-100 border-2 border-orange-200 flex items-center justify-center shadow-sm">
                      <User className="w-8 h-8 text-orange-300" />
                    </div>
                  )}
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-7 h-7 bg-gradient-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center text-white shadow-md cursor-pointer hover:scale-110 transition-transform">
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-grow text-center sm:text-left">
                  <p className="text-sm font-bold text-slate-700 font-quicksand">Foto Profil Karyawan</p>
                  <p className="text-[11px] text-slate-500 font-quicksand mt-0.5">Format: JPG, PNG, WEBP · Maks. 2MB</p>
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-orange-200 hover:border-red-300 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-sm font-quicksand">
                    <Camera className="w-3.5 h-3.5" />
                    {photoPreview ? 'Ganti Foto' : 'Unggah Foto'}
                  </button>
                  {photoFile && <p className="mt-1 text-[10px] text-emerald-600 font-semibold font-quicksand">✓ {photoFile.name}</p>}
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
              </div>

              {/* ---- Nama & Email ---- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nama Lengkap <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><User className="w-4 h-4" /></div>
                    <input type="text" required value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                      placeholder="Nama lengkap karyawan" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Alamat Email <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Mail className="w-4 h-4" /></div>
                    <input type="email" required value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                      placeholder="email@perusahaan.com" className={inputClass} />
                  </div>
                </div>
              </div>

              {/* ---- No Karyawan & Jenis Kelamin ---- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nomor Karyawan</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Hash className="w-4 h-4" /></div>
                    <input type="text" value={profile.employee_number} onChange={e => setProfile(p => ({ ...p, employee_number: e.target.value }))}
                      placeholder="Contoh: EMP-001" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Jenis Kelamin</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><User className="w-4 h-4" /></div>
                    <select value={profile.gender} onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))}
                      className={`${inputClass} appearance-none cursor-pointer`}>
                      <option value="">-- Pilih Jenis Kelamin --</option>
                      <option value="male">Laki-laki</option>
                      <option value="female">Perempuan</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ---- Tanggal Lahir & Join Date ---- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Tanggal Lahir</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Calendar className="w-4 h-4" /></div>
                    <input type="date" value={profile.date_of_birth} onChange={e => setProfile(p => ({ ...p, date_of_birth: e.target.value }))}
                      className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Tanggal Bergabung</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Briefcase className="w-4 h-4" /></div>
                    <input type="date" value={profile.join_date} onChange={e => setProfile(p => ({ ...p, join_date: e.target.value }))}
                      className={inputClass} />
                  </div>
                </div>
              </div>

              {/* ---- Alamat ---- */}
              <div>
                <label className={labelClass}>Alamat Lengkap</label>
                <div className="relative">
                  <div className="absolute top-3 left-0 pl-3.5 pointer-events-none text-slate-400"><MapPin className="w-4 h-4" /></div>
                  <textarea rows={3} value={profile.address} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
                    placeholder="Jl. Contoh No. 123, Kota, Provinsi..."
                    className="w-full bg-slate-50 border border-slate-200 hover:border-orange-200 focus:border-red-400 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 pl-10 pr-4 outline-none transition-all text-xs font-medium font-quicksand focus:ring-2 focus:ring-red-100 resize-none" />
                </div>
              </div>

              {/* ---- CV (Curriculum Vitae) ---- */}
              <div>
                <label className={labelClass}>Dokumen CV (Curriculum Vitae)</label>
                <div className="p-4 bg-orange-50/20 border border-dashed border-orange-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 font-quicksand">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="w-10 h-10 rounded-xl bg-orange-100/50 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 font-quicksand">Unggah Curriculum Vitae Anda</p>
                      <p className="text-[10px] text-slate-400 font-quicksand mt-0.5">Format: PDF, DOC, DOCX · Maks. 5MB</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    {profile.cv && (
                      <a
                        href={profile.cv}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 rounded-xl text-[10px] font-bold transition-all font-quicksand flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Lihat CV Saat Ini
                      </a>
                    )}
                    
                    <label className="px-3.5 py-1.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-xl text-[10px] transition-all cursor-pointer shadow-sm font-quicksand flex items-center gap-1.5 select-none">
                      <FileUp className="w-3.5 h-3.5" />
                      {profile.cv ? 'Ganti CV' : 'Unggah CV'}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="hidden"
                        onChange={handleCvChange}
                      />
                    </label>
                  </div>
                </div>
                {cvFile && (
                  <p className="mt-1.5 text-[10px] text-emerald-600 font-bold font-quicksand flex items-center gap-1 ml-1">
                    <span>✓</span> Terpilih: {cvFile.name} ({Math.round(cvFile.size / 1024)} KB)
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <button type="submit" disabled={savingProfile}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-md shadow-red-500/15 cursor-pointer text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed font-quicksand">
                  {savingProfile
                    ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />Menyimpan...</>
                    : <><Save className="w-4 h-4" />Simpan Biodata</>}
                </button>
              </div>
            </form>
          )}
        </section>
      )}
    </div>
  )
}
