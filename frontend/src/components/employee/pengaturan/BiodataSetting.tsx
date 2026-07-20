import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import {
  User,
  Mail,
  MapPin,
  Calendar,
  Hash,
  Briefcase,
  Loader2,
  UserCircle2,
  CheckCircle2,
  FileText,
  Building2,
  CreditCard,
  ShieldAlert,
  Save,
  MessageSquare
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
  division: string
  no_rekening: string
  company: string
  whatsapp?: string | null
}

interface BiodataSettingProps {
  user: UserProp
  token: string
}

export default function BiodataSetting({ user, token }: BiodataSettingProps) {
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
    cv: null,
    division: '',
    no_rekening: '',
    company: '',
    whatsapp: ''
  })
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)

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
          cv: d.cv ?? null,
          division: d.division ?? '',
          no_rekening: d.no_rekening ?? '',
          company: d.company ?? '',
          whatsapp: d.whatsapp ?? ''
        })
        if (d.photo) setPhotoPreview(d.photo)
      }
    } catch (err) {
      console.error('Gagal memuat profil:', err)
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleProfileSubmit = async () => {
    setSavingProfile(true)
    try {
      const formData = new FormData()
      formData.append('name', profile.name)
      formData.append('email', profile.email)
      formData.append('whatsapp', profile.whatsapp ?? '')

      const res = await axios.post('http://localhost:8000/api/user/profile', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      })
      if (res.data.status === 'success') {
        Swal.fire({ title: 'Berhasil!', text: 'Nomor WhatsApp berhasil diperbarui.', icon: 'success', background: '#fffdfb', color: '#3c1105', timer: 2000, showConfirmButton: false })
        setProfile(p => ({
          ...p,
          whatsapp: res.data.data.whatsapp ?? p.whatsapp
        }))
      }
    } catch (err: any) {
      Swal.fire({ title: 'Gagal Menyimpan', text: err.response?.data?.message || 'Gagal menyimpan.', icon: 'error', background: '#fffdfb', color: '#3c1105' })
    } finally {
      setSavingProfile(false)
    }
  }

  const labelClass = "block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 font-quicksand"

  // Biodata completeness indicator
  const biodataFields = [profile.photo, profile.date_of_birth, profile.address, profile.employee_number, profile.join_date, profile.gender, profile.cv]
  const filled = biodataFields.filter(Boolean).length
  const totalFields = biodataFields.length
  const percent = Math.round((filled / totalFields) * 100)

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-5">
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
          <div className="space-y-5">
            {/* ---- Photo Preview (Read-only) ---- */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="relative shrink-0">
                {photoPreview ? (
                  <img src={photoPreview} alt="Foto Profil"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 shadow-sm" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
                    <User className="w-8 h-8 text-slate-400" />
                  </div>
                )}
              </div>
              <div className="flex-grow text-center sm:text-left">
                <p className="text-sm font-bold text-slate-700 font-quicksand">Foto Profil Karyawan</p>
                <p className="text-[11px] text-slate-500 font-quicksand mt-0.5">Perubahan foto profil hanya dapat dilakukan oleh Administrator.</p>
              </div>
            </div>

            {/* ---- Read-only notice ---- */}
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
              <p className="text-[11px] text-slate-500 font-quicksand">Data pribadi, foto, dan CV hanya dapat diubah oleh <strong className="text-slate-700">Administrator</strong>. Anda hanya dapat memperbarui nomor WhatsApp di bawah ini.</p>
            </div>

            {/* ---- Nama & Email (read-only) ---- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nama Lengkap</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><User className="w-4 h-4" /></div>
                  <input type="text" value={profile.name} readOnly
                    className="w-full bg-slate-100 border border-slate-200 text-slate-650 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold font-quicksand cursor-not-allowed" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Alamat Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Mail className="w-4 h-4" /></div>
                  <input type="email" value={profile.email} readOnly
                    className="w-full bg-slate-100 border border-slate-200 text-slate-650 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold font-quicksand cursor-not-allowed" />
                </div>
              </div>
            </div>

            {/* ---- No Karyawan, Divisi, Jenis Kelamin (read-only) ---- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nomor Karyawan (NIP)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Hash className="w-4 h-4" /></div>
                  <input type="text" value={profile.employee_number || 'Belum diatur'} readOnly
                    className="w-full bg-slate-100 border border-slate-200 text-slate-650 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold font-quicksand cursor-not-allowed" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Divisi Kerja</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Briefcase className="w-4 h-4" /></div>
                  <input type="text" value={profile.division || 'Belum diatur'} readOnly
                    className="w-full bg-slate-100 border border-slate-200 text-slate-650 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold font-quicksand cursor-not-allowed" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Jenis Kelamin</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><User className="w-4 h-4" /></div>
                  <input type="text"
                    value={profile.gender === 'male' ? 'Laki-laki' : profile.gender === 'female' ? 'Perempuan' : 'Belum diatur'}
                    readOnly
                    className="w-full bg-slate-100 border border-slate-200 text-slate-650 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold font-quicksand cursor-not-allowed" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Tanggal Bergabung</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Briefcase className="w-4 h-4" /></div>
                  <input type="text" value={profile.join_date || 'Belum diatur'} readOnly
                    className="w-full bg-slate-100 border border-slate-200 text-slate-650 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold font-quicksand cursor-not-allowed" />
                </div>
              </div>
            </div>

            {/* ---- Tanggal Lahir (read-only) ---- */}
            <div>
              <label className={labelClass}>Tanggal Lahir</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Calendar className="w-4 h-4" /></div>
                <input type="text" value={profile.date_of_birth || 'Belum diatur'} readOnly
                  className="w-full bg-slate-100 border border-slate-200 text-slate-650 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold font-quicksand cursor-not-allowed" />
              </div>
            </div>

            {/* ---- Alamat (read-only) ---- */}
            <div>
              <label className={labelClass}>Alamat Lengkap</label>
              <div className="relative">
                <div className="absolute top-3 left-0 pl-3.5 pointer-events-none text-slate-400"><MapPin className="w-4 h-4" /></div>
                <textarea rows={3} value={profile.address || 'Belum diisi'} readOnly
                  className="w-full bg-slate-100 border border-slate-200 text-slate-650 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold font-quicksand cursor-not-allowed resize-none" />
              </div>
            </div>

            {/* ---- Nomor WhatsApp ---- */}
            <div>
              <label className={labelClass}>Nomor WhatsApp</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  value={profile.whatsapp || ''} 
                  onChange={e => setProfile(p => ({ ...p, whatsapp: e.target.value }))}
                  placeholder="Contoh: 08123456789"
                  className="w-full bg-slate-50 border border-slate-200 hover:border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 text-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold font-quicksand outline-none transition-all" 
                />
              </div>
            </div>

            {/* ---- Nama PT & No. Rekening ---- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nama PT / Perusahaan</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Building2 className="w-4 h-4" /></div>
                  <input type="text" value={profile.company || 'Belum diatur'} readOnly
                    className="w-full bg-slate-100 border border-slate-200 text-slate-650 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold font-quicksand cursor-not-allowed" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Nomor Rekening</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><CreditCard className="w-4 h-4" /></div>
                  <input type="text" value={profile.no_rekening || 'Belum diatur'} readOnly
                    className="w-full bg-slate-100 border border-slate-200 text-slate-650 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold font-quicksand cursor-not-allowed" />
                </div>
              </div>
            </div>

            {/* ---- CV Document (Read-only) ---- */}
            <div>
              <label className={labelClass}>Dokumen CV (Curriculum Vitae)</label>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 font-quicksand">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-10 h-10 rounded-xl bg-slate-200/50 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700 font-quicksand">Curriculum Vitae Anda</p>
                    <p className="text-[10px] text-slate-400 font-quicksand mt-0.5">Perubahan dokumen CV hanya dapat dilakukan oleh Administrator.</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                  {profile.cv ? (
                    <a href={profile.cv} target="_blank" rel="noreferrer"
                      className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-xl text-[10px] font-bold transition-all font-quicksand flex items-center gap-1 cursor-pointer shadow-sm">
                      <FileText className="w-3.5 h-3.5" />
                      Lihat CV Saat Ini
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-semibold italic">Belum ada CV yang diunggah</span>
                  )}
                </div>
              </div>
            </div>

            {/* Save button untuk WhatsApp */}
            <div className="flex justify-end pt-1">
              <button type="button" onClick={handleProfileSubmit} disabled={savingProfile}
                className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-md shadow-red-500/15 cursor-pointer text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed font-quicksand">
                {savingProfile
                  ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />Menyimpan...</>
                  : <><Save className="w-4 h-4" />Simpan Nomor WhatsApp</>}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
