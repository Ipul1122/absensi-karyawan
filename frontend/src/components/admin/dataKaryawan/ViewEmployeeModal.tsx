import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import {
  X,
  User,
  Mail,
  Loader2,
  BookUser,
  Calendar,
  MapPin,
  Briefcase,
  Hash,
  FileText,
  CheckCircle2,
  AlertCircle,
  Edit,
  Save,
  Camera,
  FileUp,
  Building2,
  Phone
} from 'lucide-react'
import { getAssetUrl } from '../../../utils/api'

interface EmployeeProfile {
  id: number
  name: string
  email: string
  photo: string | null
  date_of_birth: string | null
  address: string | null
  employee_number: string | null
  join_date: string | null
  gender: string | null
  division: string | null
  cv: string | null
  no_rekening: string | null
  company: string | null
  whatsapp: string | null
  created_at: string
}

interface ViewEmployeeModalProps {
  show: boolean
  onClose: () => void
  profile: EmployeeProfile | null
  onRefresh: () => void
  token: string
}

export default function ViewEmployeeModal({
  show,
  onClose,
  profile,
  onRefresh,
  token
}: ViewEmployeeModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [localProfile, setLocalProfile] = useState<EmployeeProfile>(
    profile || {
      id: 0,
      name: '',
      email: '',
      photo: null,
      date_of_birth: null,
      address: null,
      employee_number: null,
      join_date: null,
      gender: null,
      division: null,
      cv: null,
      no_rekening: null,
      company: null,
      whatsapp: null,
      created_at: ''
    }
  )

  // Form Fields State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [employeeNumber, setEmployeeNumber] = useState('')
  const [gender, setGender] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [joinDate, setJoinDate] = useState('')
  const [address, setAddress] = useState('')
  const [division, setDivision] = useState('')
  const [divisionCustom, setDivisionCustom] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [noRekening, setNoRekening] = useState('')
  const [company, setCompany] = useState('')
  const [whatsapp, setWhatsapp] = useState('')

  const photoInputRef = useRef<HTMLInputElement>(null)
  const cvInputRef = useRef<HTMLInputElement>(null)

  // Sync profile when opened
  useEffect(() => {
    if (show && profile) {
      setLocalProfile(profile)
      setIsEditing(false)
    }
  }, [show, profile])

  // Initialize form fields when entering edit mode
  const enterEditMode = () => {
    setName(localProfile.name || '')
    setEmail(localProfile.email || '')
    setEmployeeNumber(localProfile.employee_number || '')
    setGender(localProfile.gender || '')
    setDateOfBirth(localProfile.date_of_birth || '')
    setJoinDate(localProfile.join_date || '')
    setAddress(localProfile.address || '')
    const knownDivisions = ['IT', 'Keuangan', 'SDM', 'Pemasaran', 'Operasional', 'Produksi', 'Hukum']
    const existingDiv = localProfile.division || ''
    if (!existingDiv || knownDivisions.includes(existingDiv)) {
      setDivision(existingDiv)
      setDivisionCustom('')
    } else {
      setDivision('__custom__')
      setDivisionCustom(existingDiv)
    }
    setPhotoFile(null)
    setPhotoPreview(localProfile.photo)
    setCvFile(null)
    setNoRekening(localProfile.no_rekening || '')
    setCompany(localProfile.company || '')
    setWhatsapp(localProfile.whatsapp || '')
    setIsEditing(true)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        title: 'Foto Terlalu Besar',
        text: 'Ukuran foto maksimal adalah 2MB.',
        icon: 'warning',
        background: '#fffdfb',
        color: '#3c1105'
      })
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
        text: 'Hanya berkas PDF, DOC, atau DOCX yang diperbolehkan.',
        icon: 'warning',
        background: '#fffdfb',
        color: '#3c1105'
      })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        title: 'File Terlalu Besar',
        text: 'Ukuran CV maksimal adalah 5MB.',
        icon: 'warning',
        background: '#fffdfb',
        color: '#3c1105'
      })
      return
    }
    setCvFile(file)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      Swal.fire({
        title: 'Form Belum Lengkap',
        text: 'Nama dan Email wajib diisi.',
        icon: 'warning',
        background: '#fffdfb',
        color: '#3c1105'
      })
      return
    }

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('email', email)
      if (employeeNumber) formData.append('employee_number', employeeNumber)
      if (gender) formData.append('gender', gender)
      if (dateOfBirth) formData.append('date_of_birth', dateOfBirth)
      if (joinDate) formData.append('join_date', joinDate)
      if (address) formData.append('address', address)
      const finalDivision = division === '__custom__' ? divisionCustom.trim() : division
      if (finalDivision) formData.append('division', finalDivision)
      formData.append('no_rekening', noRekening)
      formData.append('company', company)
      formData.append('whatsapp', whatsapp || '')
      if (photoFile) formData.append('photo', photoFile)
      if (cvFile) formData.append('cv', cvFile)

      const res = await axios.post(
        `http://localhost:8000/api/employees/${localProfile.id}/profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      if (res.data.status === 'success') {
        Swal.fire({
          title: 'Biodata Diperbarui!',
          text: 'Biodata karyawan berhasil disimpan.',
          icon: 'success',
          background: '#fffdfb',
          color: '#3c1105',
          timer: 2000,
          showConfirmButton: false
        })

        // Update local state to reflect changes immediately
        setLocalProfile(res.data.data)
        setIsEditing(false)
        onRefresh() // Refresh the employee list in background
        onClose() // Auto-close modal after successful save
      }
    } catch (err: any) {
      console.error(err)
      Swal.fire({
        title: 'Gagal Menyimpan',
        text: err.response?.data?.message || 'Gagal menyimpan perubahan biodata.',
        icon: 'error',
        background: '#fffdfb',
        color: '#3c1105'
      })
    } finally {
      setSaving(false)
    }
  }

  if (!show) return null

  if (!profile) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-quicksand">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6 text-center">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-800">Memuat Biodata...</h3>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-xs text-slate-400">Sedang mengambil data dari server...</p>
          </div>
        </div>
      </div>
    )
  }

  const genderLabel = (g: string | null) =>
    g === 'male' ? 'Laki-laki' : g === 'female' ? 'Perempuan' : '-'

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const inputClass =
    'w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 placeholder-slate-400 rounded-xl py-2 pl-9 pr-4 outline-none transition-all text-xs font-semibold'
  const labelClass =
    'block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-quicksand'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in font-quicksand overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md my-8 overflow-hidden animate-zoom-in flex flex-col max-h-[90vh]">
        {/* Header gradient bar */}
        <div
          className={`h-1 bg-gradient-to-r ${
            isEditing
              ? 'from-orange-500 via-red-500 to-orange-400'
              : 'from-blue-500 via-indigo-500 to-blue-400'
          }`}
        />
        <div className="p-6 flex flex-col flex-grow overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between mb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md ${
                  isEditing
                    ? 'bg-gradient-to-br from-orange-500 to-red-600'
                    : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                }`}
              >
                {isEditing ? (
                  <Edit className="w-4 h-4 text-white" />
                ) : (
                  <BookUser className="w-4 h-4 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {isEditing ? 'Edit Biodata Karyawan' : 'Biodata Karyawan'}
                </h3>
                <p className="text-[10px] text-slate-400">
                  {isEditing
                    ? 'Ubah berkas dan data diri karyawan'
                    : 'Data pribadi & informasi kerja'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          {isEditing ? (
            /* EDIT VIEW MODE */
            <form onSubmit={handleSave} className="space-y-4 overflow-y-auto pr-1 flex-grow">
              {/* Photo Upload */}
              <div className="flex items-center gap-4 p-3 bg-orange-50/20 border border-orange-100 rounded-2xl">
                <div className="relative shrink-0">
                  {photoPreview ? (
                    <img
                      src={getAssetUrl(photoPreview)}
                      alt="Foto"
                      className="w-14 h-14 rounded-xl object-cover border border-orange-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-red-100 to-orange-100 border border-orange-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-orange-300" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-gradient-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center text-white shadow-sm cursor-pointer hover:scale-110 transition-transform"
                  >
                    <Camera className="w-2.5 h-2.5" />
                  </button>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Foto Profil</p>
                  <p className="text-[9px] text-slate-400">JPG, PNG, WEBP · Maks. 2MB</p>
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-orange-200 hover:border-red-300 text-slate-600 text-[9px] font-bold rounded-lg transition-all cursor-pointer"
                  >
                    Ubah Foto
                  </button>
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nama */}
                <div className="col-span-1 sm:col-span-2">
                  <label className={labelClass}>Nama Lengkap *</label>
                  <div className="relative">
                    <User className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama lengkap"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="col-span-1 sm:col-span-2">
                  <label className={labelClass}>Email *</label>
                  <div className="relative">
                    <Mail className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@perusahaan.com"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* NIP */}
                <div>
                  <label className={labelClass}>No. Karyawan (NIP)</label>
                  <div className="relative">
                    <Hash className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-slate-400" />
                    <input
                      type="text"
                      value={employeeNumber}
                      onChange={(e) => setEmployeeNumber(e.target.value)}
                      placeholder="EMP-001"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className={labelClass}>Jenis Kelamin</label>
                  <div className="relative">
                    <User className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-slate-400" />
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className={`${inputClass} appearance-none cursor-pointer`}
                    >
                      <option value="">-- Pilih --</option>
                      <option value="male">Laki-laki</option>
                      <option value="female">Perempuan</option>
                    </select>
                  </div>
                </div>

                {/* Birth date */}
                <div>
                  <label className={labelClass}>Tanggal Lahir</label>
                  <div className="relative">
                    <Calendar className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-slate-400" />
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Join date */}
                <div>
                  <label className={labelClass}>Tanggal Bergabung</label>
                  <div className="relative">
                    <Briefcase className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-slate-400" />
                    <input
                      type="date"
                      value={joinDate}
                      onChange={(e) => setJoinDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Division */}
                <div className="col-span-1 sm:col-span-2">
                  <label className={labelClass}>Divisi / Departemen</label>
                  <div className="relative">
                    <Building2 className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-slate-400" />
                    <select
                      value={division}
                      onChange={(e) => { setDivision(e.target.value); if (e.target.value !== '__custom__') setDivisionCustom('') }}
                      className={`${inputClass} appearance-none cursor-pointer`}
                    >
                      <option value="">-- Pilih Divisi --</option>
                      <option value="IT">IT / Teknologi</option>
                      <option value="Keuangan">Keuangan &amp; Akuntansi</option>
                      <option value="SDM">SDM / HR</option>
                      <option value="Pemasaran">Pemasaran &amp; Sales</option>
                      <option value="Operasional">Operasional</option>
                      <option value="Produksi">Produksi</option>
                      <option value="Hukum">Hukum &amp; Kepatuhan</option>
                      <option value="__custom__">Lainnya (isi manual)</option>
                    </select>
                  </div>
                  {division === '__custom__' && (
                    <div className="relative mt-2">
                      <Building2 className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-slate-400" />
                      <input
                        type="text"
                        placeholder="Ketik nama divisi..."
                        value={divisionCustom}
                        onChange={(e) => setDivisionCustom(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>

                {/* No. Rekening */}
                <div>
                  <label className={labelClass}>No. Rekening</label>
                  <div className="relative">
                    <Hash className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-slate-400" />
                    <input
                      type="text"
                      placeholder="Nomor rekening bank..."
                      value={noRekening}
                      onChange={(e) => setNoRekening(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Perusahaan */}
                <div>
                  <label className={labelClass}>Perusahaan</label>
                  <div className="relative">
                    <Building2 className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-slate-400" />
                    <select
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className={`${inputClass} appearance-none cursor-pointer`}
                    >
                      <option value="">-- Pilih Perusahaan --</option>
                      <option value="PT Cakrawala Parama Internasional">PT Cakrawala Parama Internasional</option>
                      <option value="PT Yasodana Parvez Internasional">PT Yasodana Parvez Internasional</option>
                    </select>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="col-span-1 sm:col-span-2">
                  <label className={labelClass}>No. WhatsApp / Telepon</label>
                  <div className="relative">
                    <Phone className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-slate-400" />
                    <input
                      type="text"
                      placeholder="Contoh: 08123456789"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="col-span-1 sm:col-span-2">
                  <label className={labelClass}>Alamat</label>
                  <div className="relative">
                    <MapPin className="absolute top-2.5 left-0 pl-3 w-4 h-4 text-slate-400" />
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Alamat lengkap..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 placeholder-slate-400 rounded-xl py-2 pl-9 pr-4 outline-none transition-all text-xs resize-none font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* CV File Upload */}
              <div>
                <label className={labelClass}>Curriculum Vitae (CV)</label>
                <div className="p-3 bg-orange-50/10 border border-dashed border-orange-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-orange-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">
                        {cvFile
                          ? cvFile.name
                          : localProfile.cv
                          ? 'CV Terunggah'
                          : 'Belum ada CV'}
                      </p>
                      <p className="text-[9px] text-slate-400">PDF, DOC, DOCX · Maks. 5MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => cvInputRef.current?.click()}
                    className="px-2 py-1.5 bg-white border border-red-200 hover:border-red-300 text-red-600 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-sm"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    Pilih CV
                  </button>
                  <input
                    ref={cvInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={handleCvChange}
                  />
                </div>
              </div>

              {/* Edit Mode Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-100 shrink-0">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Simpan
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          ) : (
            /* READ ONLY VIEW MODE */
            <div className="space-y-4 overflow-y-auto pr-1 flex-grow text-slate-700">
              {/* Photo + Name */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 shrink-0">
                {localProfile.photo ? (
                  <img
                    src={getAssetUrl(localProfile.photo)}
                    alt="Foto"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-center justify-center shrink-0 border-2 border-slate-200">
                    <User className="w-7 h-7 text-blue-300" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate">{localProfile.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono truncate">
                    {localProfile.email}
                  </p>
                  {localProfile.employee_number && (
                    <span className="inline-block mt-1 text-[10px] font-bold font-mono px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full">
                      #{localProfile.employee_number}
                    </span>
                  )}
                  {localProfile.division && (
                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-full">
                      <Building2 className="w-2.5 h-2.5" />
                      {localProfile.division}
                    </span>
                  )}
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
                {[
                  {
                    label: 'Jenis Kelamin',
                    value: genderLabel(localProfile.gender),
                    icon: <User className="w-3 h-3" />
                  },
                  {
                    label: 'Tanggal Lahir',
                    value: localProfile.date_of_birth
                      ? formatDate(localProfile.date_of_birth)
                      : '-',
                    icon: <Calendar className="w-3 h-3" />
                  },
                  {
                    label: 'Tanggal Bergabung',
                    value: localProfile.join_date ? formatDate(localProfile.join_date) : '-',
                    icon: <Briefcase className="w-3 h-3" />
                  },
                  {
                    label: 'Terdaftar Sistem',
                    value: formatDate(localProfile.created_at),
                    icon: <Hash className="w-3 h-3" />
                  },
                  {
                    label: 'No. Rekening',
                    value: localProfile.no_rekening || '-',
                    icon: <Hash className="w-3 h-3" />
                  },
                  {
                    label: 'Perusahaan',
                    value: localProfile.company || '-',
                    icon: <Building2 className="w-3 h-3" />
                  },
                  {
                    label: 'No. WhatsApp / Telepon',
                    value: localProfile.whatsapp || '-',
                    icon: <Phone className="w-3 h-3" />
                  }
                ].map((item) => (
                  <div key={item.label} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1 text-slate-400 mb-1">
                      {item.icon}
                      <span className="text-[9px] uppercase tracking-wider font-extrabold">
                        {item.label}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-700">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Alamat */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 shrink-0">
                <div className="flex items-center gap-1 text-slate-400 mb-1">
                  <MapPin className="w-3 h-3" />
                  <span className="text-[9px] uppercase tracking-wider font-extrabold">Alamat</span>
                </div>
                <p className="text-xs font-semibold text-slate-705 leading-relaxed">
                  {localProfile.address || <span className="italic text-slate-400">Belum diisi</span>}
                </p>
              </div>

              {/* CV Document */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 shrink-0">
                <div className="flex items-center gap-1 text-slate-400 mb-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="text-[9px] uppercase tracking-wider font-extrabold">
                    Curriculum Vitae (CV)
                  </span>
                </div>
                {localProfile.cv ? (
                  <div className="flex items-center justify-between gap-3 bg-white p-2 border border-slate-100 rounded-lg">
                    <span className="text-xs font-semibold text-slate-600 truncate flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-orange-500" />
                      Dokumen CV Karyawan
                    </span>
                    <a
                      href={getAssetUrl(localProfile.cv)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-lg text-[10px] font-bold transition-all hover:brightness-110 cursor-pointer"
                    >
                      Lihat / Unduh
                    </a>
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-slate-400 italic">
                    Belum diunggah oleh karyawan
                  </p>
                )}
              </div>

              {/* Completeness indicator */}
              {(() => {
                const fields = [
                  localProfile.photo,
                  localProfile.date_of_birth,
                  localProfile.address,
                  localProfile.employee_number,
                  localProfile.join_date,
                  localProfile.gender,
                  localProfile.cv,
                  localProfile.no_rekening,
                  localProfile.company,
                  localProfile.whatsapp
                ]
                const filled = fields.filter(Boolean).length
                const pct = Math.round((filled / fields.length) * 100)
                return (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 shrink-0">
                    {pct === 100 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <div className="flex-grow">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-500">Kelengkapan</span>
                        <span
                          className={`text-[10px] font-bold font-mono ${
                            pct === 100 ? 'text-emerald-600' : 'text-amber-500'
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct === 100
                              ? 'bg-emerald-500'
                              : 'bg-gradient-to-r from-amber-400 to-orange-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Read Only Footer Actions */}
              <div className="flex gap-2 pt-2 border-t border-slate-100 shrink-0">
                <button
                  onClick={enterEditMode}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-750 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit Biodata
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
