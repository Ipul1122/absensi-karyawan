import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  User,
  Mail,
  Lock,
  Loader2,
  UserPlus,
  Hash,
  Calendar,
  MapPin,
  Briefcase,
  Camera,
  FileText,
  FileUp,
  Building2,
  Phone
} from 'lucide-react'
import Swal from 'sweetalert2'

interface AddEmployeeModalProps {
  show: boolean
  onClose: () => void
  onSubmit: (formData: FormData) => void
  submitting: boolean
}

export default function AddEmployeeModal({
  show,
  onClose,
  onSubmit,
  submitting,
}: AddEmployeeModalProps) {
  // Local Form States
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

  const photoInputRef = useRef<HTMLInputElement>(null)
  const cvInputRef = useRef<HTMLInputElement>(null)

  // Reset form when modal opens
  useEffect(() => {
    if (show) {
      setName('')
      setEmail('')
      setPassword('')
      setEmployeeNumber('')
      setGender('')
      setDateOfBirth('')
      setJoinDate('')
      setAddress('')
      setDivision('')
      setDivisionCustom('')
      setPhotoFile(null)
      setPhotoPreview(null)
      setCvFile(null)
    }
  }, [show])

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !email || !password) {
      Swal.fire({
        title: 'Form Belum Lengkap',
        text: 'Silakan isi Nama Lengkap, Email, dan Password.',
        icon: 'warning',
        background: '#fffdfb',
        color: '#3c1105'
      })
      return
    }

    if (password.length < 6) {
      Swal.fire({
        title: 'Password Terlalu Pendek',
        text: 'Kata sandi minimal harus terdiri dari 6 karakter.',
        icon: 'warning',
        background: '#fffdfb',
        color: '#3c1105'
      })
      return
    }

    const formData = new FormData()
    formData.append('name', name)
    formData.append('email', email)
    formData.append('password', password)
    
    if (employeeNumber) formData.append('employee_number', employeeNumber)
    if (gender) formData.append('gender', gender)
    if (dateOfBirth) formData.append('date_of_birth', dateOfBirth)
    if (joinDate) formData.append('join_date', joinDate)
    if (address) formData.append('address', address)
    const finalDivision = division === '__custom__' ? divisionCustom.trim() : division
    if (finalDivision) formData.append('division', finalDivision)
    if (photoFile) formData.append('photo', photoFile)
    if (cvFile) formData.append('cv', cvFile)

    onSubmit(formData)
  }

  if (!show) return null

  const inputClass = "w-full bg-slate-50 border border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2 pl-9 pr-4 outline-none transition-all text-xs"
  const labelClass = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-quicksand"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-950/20 backdrop-blur-md animate-fade-in">
      <div className="bg-white border border-orange-100 rounded-3xl p-6 max-w-lg w-full relative shadow-xl overflow-hidden animate-zoom-in flex flex-col max-h-[90vh]">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
        
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2 font-quicksand">
            <UserPlus className="w-5 h-5 text-red-500" /> Tambah Karyawan Baru
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-orange-50 rounded-lg transition-all cursor-pointer text-slate-400 hover:text-red-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-grow">
          {/* AKUN LOGIN */}
          <div className="border-b border-orange-50 pb-1.5">
            <h4 className="text-[10px] font-extrabold text-red-600 uppercase tracking-wider font-quicksand">
              Informasi Kredensial Login
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="col-span-1 sm:col-span-2">
              <label className={labelClass}>Nama Lengkap *</label>
              <div className="relative">
                <User className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-orange-400/80" />
                <input
                  type="text"
                  required
                  placeholder=""
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="col-span-1">
              <label className={labelClass}>Email Karyawan *</label>
              <div className="relative">
                <Mail className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-orange-400/80" />
                <input
                  type="email"
                  required
                  placeholder=""
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="col-span-1">
              <label className={labelClass}>Password Login *</label>
              <div className="relative">
                <Lock className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-orange-400/80" />
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* BIODATA KARYAWAN */}
          <div className="border-b border-orange-50 pb-1.5 pt-1">
            <h4 className="text-[10px] font-extrabold text-red-600 uppercase tracking-wider font-quicksand">
              Biodata Lengkap & Berkas
            </h4>
          </div>

          {/* Photo upload */}
          <div className="flex items-center gap-4 p-3 bg-orange-50/20 border border-orange-100 rounded-2xl">
            <div className="relative shrink-0">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview"
                  className="w-12 h-12 rounded-xl object-cover border border-orange-200 shadow-sm" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-100 to-orange-100 border border-orange-200 flex items-center justify-center">
                  <User className="w-5 h-5 text-orange-300" />
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700 font-quicksand">Foto Karyawan</p>
              <p className="text-[9px] text-slate-400 font-quicksand">JPG, PNG, WEBP · Maks. 2MB</p>
              <button type="button" onClick={() => photoInputRef.current?.click()}
                className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-orange-200 hover:border-red-300 text-slate-600 text-[10px] font-bold rounded-lg transition-all cursor-pointer font-quicksand">
                <Camera className="w-3 h-3" /> {photoPreview ? 'Ganti Foto' : 'Unggah Foto'}
              </button>
            </div>
            <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>No. Karyawan (NIP)</label>
              <div className="relative">
                <Hash className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-orange-400/80" />
                <input
                  type="text"
                  placeholder="Contoh: EMP-009"
                  value={employeeNumber}
                  onChange={(e) => setEmployeeNumber(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Jenis Kelamin</label>
              <div className="relative">
                <User className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-orange-400/80" />
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

            <div>
              <label className={labelClass}>Tanggal Lahir</label>
              <div className="relative">
                <Calendar className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-orange-400/80" />
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Tanggal Bergabung</label>
              <div className="relative">
                <Briefcase className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-orange-400/80" />
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
                <Building2 className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-orange-400/80" />
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
                  <Building2 className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-orange-400/80" />
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

            <div className="col-span-1 sm:col-span-2">
              <label className={labelClass}>Alamat Rumah</label>
              <div className="relative">
                <MapPin className="absolute top-2.5 left-0 pl-3 w-4 h-4 text-orange-400/80" />
                <textarea
                  rows={2}
                  placeholder="Alamat lengkap karyawan..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2 pl-9 pr-4 outline-none transition-all text-xs resize-none"
                />
              </div>
            </div>
          </div>


          {/* CV File picker */}
          <div>
            <label className={labelClass}>Curriculum Vitae (CV)</label>
            <div className="p-3 bg-orange-50/20 border border-dashed border-orange-200 rounded-xl flex items-center justify-between gap-3 font-quicksand">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-orange-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">
                    {cvFile ? cvFile.name : 'Belum ada CV terpilih'}
                  </p>
                  <p className="text-[9px] text-slate-400">PDF, DOC, DOCX · Maks. 5MB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => cvInputRef.current?.click()}
                className="px-2.5 py-1.5 bg-white border border-red-200 hover:border-red-350 text-red-600 rounded-lg text-[10px] font-bold transition-all cursor-pointer font-quicksand flex items-center gap-1 shrink-0 shadow-sm"
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

          {/* Footer buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-orange-50/50 border border-orange-100 hover:bg-orange-50 text-slate-600 rounded-xl transition-all cursor-pointer text-xs font-bold font-quicksand"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed font-quicksand"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Mengirim Pengajuan...
                </>
              ) : (
                'Kirim Pengajuan ke Direktur'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
