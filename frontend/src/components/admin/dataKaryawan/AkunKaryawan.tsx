  import { useState, useRef } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import {
  Search,
  UserPlus,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  Edit,
  X,
  User,
  Mail,
  MapPin,
  Calendar,
  Hash,
  Briefcase,
  Camera,
  Save,
  FileText,
  FileUp,
  Building2
} from 'lucide-react'

interface Employee {
  id: number
  name: string
  email: string
  password_plain?: string
  photo?: string | null
  division?: string | null
  no_rekening?: string | null
  company?: string | null
  created_at: string
  updated_at: string
  status?: 'active' | 'pending' | 'pending_delete'
}

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
  created_at: string
}

interface AkunKaryawanProps {
  loading: boolean
  filteredEmployees: Employee[]
  searchQuery: string
  setSearchQuery: (v: string) => void
  handleDeleteEmployee: (id: number, name: string) => void
  onEditClick: (employee: Employee) => void
  setShowModal: (b: boolean) => void
  formatDate: (d: string) => string
  token: string
  onRefresh?: () => void
}

export default function AkunKaryawan({
  loading,
  filteredEmployees,
  searchQuery,
  setSearchQuery,
  handleDeleteEmployee,
  onEditClick,
  setShowModal,
  formatDate,
  token,
  onRefresh,
}: AkunKaryawanProps) {
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({})



  // ---- Edit Biodata Modal ----
  const [showEditBioModal, setShowEditBioModal] = useState(false)
  const [editProfile, setEditProfile] = useState<EmployeeProfile | null>(null)
  const [divisionSelect, setDivisionSelect] = useState('')
  const [divisionCustom, setDivisionCustom] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [savingBio, setSavingBio] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cvInputRef = useRef<HTMLInputElement>(null)

  const togglePassword = (id: number) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const fetchEmployeeProfile = async (id: number) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/employees/${id}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data.status === 'success') {
        return res.data.data as EmployeeProfile
      }
    } catch (err) {
      console.error('Gagal memuat profil karyawan:', err)
      Swal.fire({ title: 'Gagal Memuat', text: 'Tidak dapat memuat biodata karyawan.', icon: 'error', background: '#fffdfb', color: '#3c1105' })
    }
    return null
  }

  const handleOpenEditBio = async (emp: Employee) => {
    const profile = await fetchEmployeeProfile(emp.id)
    if (profile) {
      setEditProfile(profile)
      // Resolve division selection
      const knownDivisions = ['IT', 'Keuangan', 'SDM', 'Pemasaran', 'Operasional', 'Produksi', 'Hukum']
      const existingDiv = profile.division || ''
      if (!existingDiv || knownDivisions.includes(existingDiv)) {
        setDivisionSelect(existingDiv)
        setDivisionCustom('')
      } else {
        setDivisionSelect('__custom__')
        setDivisionCustom(existingDiv)
      }
      setPhotoPreview(profile.photo)
      setPhotoFile(null)
      setCvFile(null)
      setShowEditBioModal(true)
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

  const handleSaveBiodata = async () => {
    if (!editProfile) return
    if (!editProfile.name.trim() || !editProfile.email.trim()) {
      Swal.fire({ title: 'Form Belum Lengkap', text: 'Nama dan email wajib diisi.', icon: 'warning', background: '#fffdfb', color: '#3c1105' })
      return
    }

    setSavingBio(true)
    try {
      const formData = new FormData()
      formData.append('name', editProfile.name)
      formData.append('email', editProfile.email)
      if (editProfile.date_of_birth) formData.append('date_of_birth', editProfile.date_of_birth)
      if (editProfile.address) formData.append('address', editProfile.address)
      if (editProfile.employee_number) formData.append('employee_number', editProfile.employee_number)
      if (editProfile.join_date) formData.append('join_date', editProfile.join_date)
      if (editProfile.gender) formData.append('gender', editProfile.gender)
      const finalDivision = divisionSelect === '__custom__' ? divisionCustom.trim() : divisionSelect
      if (finalDivision) formData.append('division', finalDivision)
      formData.append('no_rekening', editProfile.no_rekening || '')
      formData.append('company', editProfile.company || '')
      if (photoFile) formData.append('photo', photoFile)
      if (cvFile) formData.append('cv', cvFile)

      const res = await axios.post(`http://localhost:8000/api/employees/${editProfile.id}/profile`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      })

      if (res.data.status === 'success') {
        Swal.fire({ title: 'Biodata Diperbarui!', text: 'Biodata karyawan berhasil disimpan.', icon: 'success', background: '#fffdfb', color: '#3c1105', timer: 2000, showConfirmButton: false })
        setShowEditBioModal(false)
        setEditProfile(null)
        setPhotoFile(null)
        setCvFile(null)
        onRefresh?.()
      }
    } catch (err: any) {
      Swal.fire({ title: 'Gagal Menyimpan', text: err.response?.data?.message || 'Gagal menyimpan biodata.', icon: 'error', background: '#fffdfb', color: '#3c1105' })
    } finally {
      setSavingBio(false)
    }
  }



  const inputClass = "w-full bg-slate-50 border border-slate-200 hover:border-orange-200 focus:border-red-400 text-slate-800 placeholder-slate-400 rounded-xl py-2 pl-9 pr-3 outline-none transition-all text-xs font-medium font-quicksand focus:ring-2 focus:ring-red-100"
  const labelClass = "block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 font-quicksand"

  return (
    <>
      <section className="bg-white/80 border border-orange-100 rounded-3xl p-6 shadow-sm backdrop-blur-md space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 font-quicksand">Daftar Akun Karyawan</h3>
            <p className="text-xs text-slate-500 font-quicksand font-medium">Total karyawan yang memiliki hak akses login ke sistem portal.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative max-w-xs w-full sm:w-64">
              <Search className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-slate-400" />
              <input
                type="text"
                placeholder="Cari karyawan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2 pl-9 pr-4 outline-none transition-all text-xs"
              />
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all shadow-sm cursor-pointer text-xs shrink-0 font-quicksand disabled:opacity-50"
              >
                <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Segarkan
              </button>
            )}
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer text-xs shrink-0 font-quicksand"
            >
              <UserPlus className="w-4 h-4" />
              Tambah Karyawan
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="border border-orange-100 rounded-2xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-orange-50/40 text-orange-950/80 text-xs font-bold uppercase tracking-wider border-b border-orange-100 font-quicksand">
                  <th className="py-4 px-5">Nama</th>
                  <th className="py-4 px-5">Email</th>
                  <th className="py-4 px-5">Kata Sandi</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">Terdaftar</th>
                  <th className="py-4 px-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-50 text-sm text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                        Memuat data karyawan...
                      </div>
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold">
                      {searchQuery ? 'Karyawan tidak ditemukan.' : 'Belum ada akun karyawan yang terdaftar.'}
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-orange-50/20 transition-colors">
                      <td className="py-4 px-5 font-semibold text-slate-800">
                        <div className="flex items-center gap-3">
                          {emp.photo ? (
                            <img
                              src={emp.photo}
                              alt={emp.name}
                              className="w-9 h-9 rounded-xl object-cover border-2 border-orange-100 shadow-sm shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-100 to-orange-100 text-red-500 flex items-center justify-center font-bold text-xs uppercase font-quicksand shrink-0 border border-orange-100">
                              {emp.name.substring(0, 2)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-quicksand text-sm font-semibold text-slate-800 block truncate">{emp.name}</span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {emp.division && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-50 text-violet-600 border border-violet-100">
                                  <Building2 className="w-2.5 h-2.5" />
                                  {emp.division}
                                </span>
                              )}
                              {emp.company && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                  <Building2 className="w-2.5 h-2.5" />
                                  {emp.company}
                                </span>
                              )}
                              {emp.no_rekening && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                  <Hash className="w-2.5 h-2.5" />
                                  {emp.no_rekening}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 font-mono text-xs text-slate-600">{emp.email}</td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2 max-w-[140px]">
                          <span className="font-mono text-xs text-slate-700 select-all block truncate">
                            {showPasswords[emp.id] ? emp.password_plain || 'N/A' : '••••••••'}
                          </span>
                          <button
                            onClick={() => togglePassword(emp.id)}
                            className="p-1 hover:bg-orange-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                            title={showPasswords[emp.id] ? 'Sembunyikan' : 'Tampilkan'}
                          >
                            {showPasswords[emp.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      {/* Status */}
                      <td className="py-4 px-5">
                        {(!emp.status || emp.status === 'active') && (
                          <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-100">
                            Aktif
                          </span>
                        )}
                        {emp.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-600 border border-amber-100 animate-pulse">
                            Menunggu Direktur
                          </span>
                        )}
                        {emp.status === 'pending_delete' && (
                          <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-600 border border-rose-100 animate-pulse">
                            Proses Hapus
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-xs text-slate-500 font-quicksand">{formatDate(emp.created_at)}</td>
                      <td className="py-4 px-5">
                        <div className="flex items-center justify-center gap-1">

                          {/* Edit Akun Credentials */}
                          <button
                            onClick={() => onEditClick(emp)}
                            className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer inline-flex items-center"
                            title="Edit Akun Login"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {/* Edit Biodata */}
                          <button
                            onClick={() => handleOpenEditBio(emp)}
                            className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all cursor-pointer inline-flex items-center"
                            title="Edit Biodata Lengkap"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          {/* Hapus */}
                          <button
                            onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer inline-flex items-center"
                            title="Hapus Karyawan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===========================
          MODAL: EDIT BIODATA
          =========================== */}
      {showEditBioModal && editProfile && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-8 overflow-hidden animate-zoom-in flex flex-col">
            <div className="h-1 bg-gradient-to-r from-red-500 via-orange-500 to-orange-400" />
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-md">
                    <Edit className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 font-quicksand">Edit Biodata Karyawan</h3>
                    <p className="text-[10px] text-slate-400 font-quicksand">{editProfile.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowEditBioModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Photo Upload */}
              <div className="flex items-center gap-4 p-4 bg-orange-50/30 border border-orange-100 rounded-2xl">
                <div className="relative shrink-0">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Foto"
                      className="w-16 h-16 rounded-xl object-cover border-2 border-orange-200 shadow-sm" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-red-100 to-orange-100 border-2 border-orange-200 flex items-center justify-center">
                      <User className="w-6 h-6 text-orange-300" />
                    </div>
                  )}
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-gradient-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center text-white shadow-md cursor-pointer hover:scale-110 transition-transform">
                    <Camera className="w-3 h-3" />
                  </button>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700 font-quicksand">Foto Profil</p>
                  <p className="text-[10px] text-slate-400 font-quicksand">JPG, PNG, WEBP · Maks. 2MB</p>
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="mt-1.5 inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-orange-200 hover:border-red-300 text-slate-600 hover:text-red-600 rounded-lg text-[11px] font-bold transition-all cursor-pointer font-quicksand">
                    <Camera className="w-3 h-3" /> {photoPreview ? 'Ganti Foto' : 'Unggah Foto'}
                  </button>
                  {photoFile && <p className="mt-0.5 text-[10px] text-emerald-600 font-semibold font-quicksand">✓ {photoFile.name}</p>}
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nama */}
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelClass}>Nama Lengkap *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400"><User className="w-3.5 h-3.5" /></div>
                    <input type="text" required value={editProfile.name}
                      onChange={e => setEditProfile(p => p ? { ...p, name: e.target.value } : p)}
                      placeholder="Nama lengkap" className={inputClass} />
                  </div>
                </div>
                {/* Email */}
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelClass}>Email *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400"><Mail className="w-3.5 h-3.5" /></div>
                    <input type="email" required value={editProfile.email}
                      onChange={e => setEditProfile(p => p ? { ...p, email: e.target.value } : p)}
                      placeholder="email@..." className={inputClass} />
                  </div>
                </div>
                {/* No Karyawan */}
                <div>
                  <label className={labelClass}>No. Karyawan</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400"><Hash className="w-3.5 h-3.5" /></div>
                    <input type="text" value={editProfile.employee_number ?? ''}
                      onChange={e => setEditProfile(p => p ? { ...p, employee_number: e.target.value } : p)}
                      placeholder="EMP-001" className={inputClass} />
                  </div>
                </div>
                {/* Jenis Kelamin */}
                <div>
                  <label className={labelClass}>Jenis Kelamin</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400"><User className="w-3.5 h-3.5" /></div>
                    <select value={editProfile.gender ?? ''}
                      onChange={e => setEditProfile(p => p ? { ...p, gender: e.target.value } : p)}
                      className={`${inputClass} appearance-none cursor-pointer`}>
                      <option value="">-- Pilih --</option>
                      <option value="male">Laki-laki</option>
                      <option value="female">Perempuan</option>
                    </select>
                  </div>
                </div>
                {/* Divisi */}
                <div className="col-span-1 sm:col-span-2">
                  <label className={labelClass}>Divisi / Departemen</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400"><Building2 className="w-3.5 h-3.5" /></div>
                    <select value={divisionSelect}
                      onChange={e => { setDivisionSelect(e.target.value); if (e.target.value !== '__custom__') setDivisionCustom('') }}
                      className={`${inputClass} appearance-none cursor-pointer`}>
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
                  {divisionSelect === '__custom__' && (
                    <div className="relative mt-2">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400"><Building2 className="w-3.5 h-3.5" /></div>
                      <input type="text" placeholder="Ketik nama divisi..."
                        value={divisionCustom}
                        onChange={e => setDivisionCustom(e.target.value)}
                        className={inputClass} />
                    </div>
                  )}
                </div>
                {/* Tgl Lahir */}
                <div>
                  <label className={labelClass}>Tgl. Lahir</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400"><Calendar className="w-3.5 h-3.5" /></div>
                    <input type="date" value={editProfile.date_of_birth ?? ''}
                      onChange={e => setEditProfile(p => p ? { ...p, date_of_birth: e.target.value } : p)}
                      className={inputClass} />
                  </div>
                </div>
                {/* Join Date */}
                <div>
                  <label className={labelClass}>Tgl. Bergabung</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400"><Briefcase className="w-3.5 h-3.5" /></div>
                    <input type="date" value={editProfile.join_date ?? ''}
                      onChange={e => setEditProfile(p => p ? { ...p, join_date: e.target.value } : p)}
                      className={inputClass} />
                  </div>
                </div>
                {/* Alamat */}
                <div className="col-span-1 sm:col-span-2">
                  <label className={labelClass}>Alamat</label>
                  <div className="relative">
                    <div className="absolute top-2.5 left-0 pl-2.5 pointer-events-none text-slate-400"><MapPin className="w-3.5 h-3.5" /></div>
                    <textarea rows={2} value={editProfile.address ?? ''}
                      onChange={e => setEditProfile(p => p ? { ...p, address: e.target.value } : p)}
                      placeholder="Alamat lengkap karyawan..."
                      className="w-full bg-slate-50 border border-slate-200 hover:border-orange-200 focus:border-red-400 text-slate-800 placeholder-slate-400 rounded-xl py-2 pl-9 pr-3 outline-none transition-all text-xs font-medium font-quicksand focus:ring-2 focus:ring-red-100 resize-none" />
                  </div>
                </div>

                {/* No. Rekening */}
                <div>
                  <label className={labelClass}>No. Rekening</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400"><Hash className="w-3.5 h-3.5" /></div>
                    <input type="text" value={editProfile.no_rekening ?? ''}
                      onChange={e => setEditProfile(p => p ? { ...p, no_rekening: e.target.value } : p)}
                      placeholder="Nomor rekening bank..." className={inputClass} />
                  </div>
                </div>
                {/* Perusahaan */}
                <div>
                  <label className={labelClass}>Perusahaan</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400"><Building2 className="w-3.5 h-3.5" /></div>
                    <select value={editProfile.company ?? ''}
                      onChange={e => setEditProfile(p => p ? { ...p, company: e.target.value } : p)}
                      className={`${inputClass} appearance-none cursor-pointer`}>
                      <option value="">-- Pilih Perusahaan --</option>
                      <option value="PT Cakrawala Parama Internasional">PT Cakrawala Parama Internasional</option>
                      <option value="PT Yasodana Parvez Internasional">PT Yasodana Parvez Internasional</option>
                    </select>
                  </div>
                </div>

                {/* CV Upload */}
                <div className="col-span-1 sm:col-span-2">
                  <label className={labelClass}>Dokumen CV (Curriculum Vitae)</label>
                  <div className="p-3 bg-orange-50/20 border border-dashed border-orange-200 rounded-xl flex items-center justify-between gap-3 font-quicksand">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-orange-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">
                          {cvFile ? cvFile.name : (editProfile.cv ? 'CV saat ini terunggah' : 'Belum ada CV')}
                        </p>
                        <p className="text-[9px] text-slate-400">PDF, DOC, DOCX · Maks. 5MB</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      {editProfile.cv && (
                        <a
                          href={editProfile.cv}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-white border border-orange-200 text-orange-600 rounded-lg text-[10px] font-bold hover:bg-orange-50 transition-all font-quicksand"
                          title="Lihat CV Saat Ini"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => cvInputRef.current?.click()}
                        className="px-2.5 py-1.5 bg-white border border-red-200 hover:border-red-300 text-red-600 rounded-lg text-[10px] font-bold transition-all cursor-pointer font-quicksand flex items-center gap-1 shrink-0"
                      >
                        <FileUp className="w-3 h-3" />
                        Pilih File
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
                  {cvFile && (
                    <p className="mt-1 text-[9px] text-emerald-600 font-bold font-quicksand flex items-center gap-1 ml-1">
                      <span>✓</span> Terpilih: {cvFile.name} ({Math.round(cvFile.size / 1024)} KB)
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button onClick={handleSaveBiodata} disabled={savingBio}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm font-quicksand disabled:opacity-50 disabled:cursor-not-allowed">
                  {savingBio
                    ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />Menyimpan...</>
                    : <><Save className="w-3.5 h-3.5" />Simpan Biodata</>}
                </button>
                <button onClick={() => setShowEditBioModal(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs transition-all cursor-pointer font-quicksand">
                  <X className="w-3.5 h-3.5" /> Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
