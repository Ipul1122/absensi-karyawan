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
  Building2,
  Phone,
  Users,
  UserCheck,
  Clock,
  Copy,
  ExternalLink
} from 'lucide-react'
import { getAssetUrl } from '../../../utils/api'

interface Employee {
  id: number
  name: string
  email: string
  role?: string
  password_plain?: string
  photo?: string | null
  employee_number?: string | null
  division?: string | null
  no_rekening?: string | null
  company?: string | null
  join_date?: string | null
  whatsapp?: string | null
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
  whatsapp: string | null
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
      formData.append('whatsapp', editProfile.whatsapp || '')
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

  const getDivisionBadgeStyle = (division: string | null | undefined) => {
    if (!division) return 'bg-slate-50 text-slate-500 border-slate-100'
    const div = division.toLowerCase()
    if (div.includes('it') || div.includes('tekno') || div.includes('dev')) return 'bg-indigo-50 text-indigo-700 border-indigo-100'
    if (div.includes('keuangan') || div.includes('akuntan') || div.includes('finance')) return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    if (div.includes('sdm') || div.includes('hr')) return 'bg-violet-50 text-violet-750 border-violet-100'
    if (div.includes('pemasaran') || div.includes('sales') || div.includes('marketing') || div.includes('pemasar')) return 'bg-blue-50 text-blue-700 border-blue-100'
    if (div.includes('operasional') || div.includes('ops')) return 'bg-amber-50 text-amber-700 border-amber-100'
    if (div.includes('produksi')) return 'bg-rose-50 text-rose-700 border-rose-100'
    if (div.includes('hukum') || div.includes('legal')) return 'bg-slate-100 text-slate-700 border-slate-200'
    return 'bg-slate-50 text-slate-650 border-slate-200'
  }

  const getWhatsAppUrl = (phone: string | null | undefined) => {
    if (!phone) return '#'
    let clean = phone.replace(/[^0-9]/g, '')
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1)
    }
    return `https://wa.me/${clean}`
  }

  const handleCopyPassword = (password: string | undefined) => {
    if (!password) return
    navigator.clipboard.writeText(password)
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Kata sandi disalin',
      showConfirmButton: false,
      timer: 1500,
      background: '#fffdfb',
      color: '#3c1105'
    })
  }

  // Stats calculations based on current employees
  const totalEmployees = filteredEmployees.length
  const activeEmployees = filteredEmployees.filter(emp => !emp.status || emp.status === 'active').length
  const pendingEmployees = filteredEmployees.filter(emp => emp.status === 'pending').length
  const totalDivisions = new Set(filteredEmployees.map(emp => emp.division).filter(Boolean)).size

  const inputClass = "w-full bg-slate-50 border border-slate-200 hover:border-orange-200 focus:border-red-400 text-slate-800 placeholder-slate-400 rounded-xl py-2 pl-9 pr-3 outline-none transition-all text-xs font-medium font-quicksand focus:ring-2 focus:ring-red-100"
  const labelClass = "block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 font-quicksand"

  return (
    <>
      <section className="bg-white/80 border border-orange-100 rounded-3xl p-4 sm:p-6 shadow-sm backdrop-blur-md space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 font-quicksand">Daftar Akun Karyawan</h3>
            <p className="text-xs text-slate-500 font-quicksand font-medium">Total karyawan yang memiliki hak akses login ke sistem portal.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-slate-400" />
              <input
                type="text"
                placeholder="Cari karyawan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2 pl-9 pr-4 outline-none transition-all text-xs"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all shadow-sm cursor-pointer text-xs font-quicksand disabled:opacity-50 shrink-0"
                >
                  <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Segarkan
                </button>
              )}
              <button
                onClick={() => setShowModal(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer text-xs font-quicksand shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                Tambah Karyawan
              </button>
            </div>
          </div>
        </div>

        {/* Panel Statistik Ringkasan */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Karyawan */}
          <div className="bg-white/95 border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300 group border-l-4 border-l-red-500">
            <div className="w-12 h-12 rounded-xl bg-red-550/5 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-quicksand block">Total Karyawan</span>
              <h4 className="text-xl font-bold text-slate-800 font-montserrat mt-0.5 leading-none">{totalEmployees}</h4>
              <p className="text-[9px] text-slate-400 font-quicksand mt-1 font-medium">Pengguna terdaftar</p>
            </div>
          </div>
          
          {/* Card 2: Karyawan Aktif */}
          <div className="bg-white/95 border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300 group border-l-4 border-l-emerald-500">
            <div className="w-12 h-12 rounded-xl bg-emerald-550/5 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform shadow-inner">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-quicksand block">Karyawan Aktif</span>
              <h4 className="text-xl font-bold text-slate-800 font-montserrat mt-0.5 leading-none">{activeEmployees}</h4>
              <p className="text-[9px] text-emerald-600 font-quicksand mt-1 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-550 animate-pulse block"></span>
                Siap presensi
              </p>
            </div>
          </div>

          {/* Card 3: Pending Approval */}
          <div className="bg-white/95 border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300 group border-l-4 border-l-amber-500">
            <div className="w-12 h-12 rounded-xl bg-amber-550/5 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform shadow-inner">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-quicksand block">Pending Approval</span>
              <h4 className="text-xl font-bold text-slate-800 font-montserrat mt-0.5 leading-none">{pendingEmployees}</h4>
              <p className="text-[9px] text-amber-600 font-quicksand mt-1 font-semibold flex items-center gap-1">
                {pendingEmployees > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping block"></span>}
                Menunggu aktivasi
              </p>
            </div>
          </div>

          {/* Card 4: Total Divisi */}
          <div className="bg-white/95 border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300 group border-l-4 border-l-blue-500">
            <div className="w-12 h-12 rounded-xl bg-blue-550/5 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-quicksand block">Departemen/Divisi</span>
              <h4 className="text-xl font-bold text-slate-800 font-montserrat mt-0.5 leading-none">{totalDivisions}</h4>
              <p className="text-[9px] text-slate-400 font-quicksand mt-1 font-medium">Struktur operasional</p>
            </div>
          </div>
        </div>

        {/* Table Container (Desktop View) */}
        <div className="hidden md:block border border-orange-100/80 rounded-2xl overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-600 text-[10px] font-extrabold uppercase tracking-wider font-quicksand">
                  <th className="py-3.5 px-5">Karyawan</th>
                  <th className="py-3.5 px-5">Penempatan</th>
                  <th className="py-3.5 px-5">Hubungi &amp; WA</th>
                  <th className="py-3.5 px-5">Keuangan &amp; Masuk</th>
                  <th className="py-3.5 px-5">Kredensial</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                        Memuat data karyawan...
                      </div>
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold font-quicksand">
                      {searchQuery ? 'Karyawan tidak ditemukan.' : 'Belum ada akun karyawan yang terdaftar.'}
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/60 hover:shadow-[inset_4px_0_0_0_#dc2626] transition-all duration-200">
                      {/* Column 1: Karyawan (Name, Avatar, NIK) */}
                      <td className="py-4 px-5 font-semibold text-slate-800">
                        <div className="flex items-center gap-3">
                          {emp.photo ? (
                            <img
                              src={getAssetUrl(emp.photo)}
                              alt={emp.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-orange-100 shadow-sm shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-white flex items-center justify-center font-bold text-sm uppercase font-quicksand shrink-0 border border-orange-200/50 shadow-md">
                              {emp.name.substring(0, 2)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-quicksand text-sm font-bold text-slate-800 block truncate leading-snug">
                              {emp.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono tracking-wider block mt-0.5">
                              {emp.employee_number || 'NIK: -'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Penempatan (Division, Company) */}
                      <td className="py-4 px-5">
                        <div className="min-w-0 flex flex-col gap-1">
                          <span className={`inline-block py-0.5 px-2.5 rounded-full text-[10px] font-extrabold border w-fit font-quicksand ${getDivisionBadgeStyle(emp.division)}`}>
                            {emp.division || 'Umum / Divisi -'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold block truncate max-w-[180px]">
                            {emp.company ? emp.company.replace('PT ', '') : 'Tanpa Perusahaan'}
                          </span>
                        </div>
                      </td>

                      {/* Column 3: Hubungi (Email, WhatsApp Link) */}
                      <td className="py-4 px-5">
                        <div className="min-w-0 flex flex-col gap-1">
                          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {emp.email}
                          </span>
                          {emp.whatsapp ? (
                            <a
                              href={getWhatsAppUrl(emp.whatsapp)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 hover:text-emerald-800 transition-colors w-fit font-quicksand"
                              title="Hubungi via WhatsApp"
                            >
                              <Phone className="w-2.5 h-2.5 shrink-0" />
                              {emp.whatsapp}
                              <ExternalLink className="w-2 h-2 opacity-50 ml-0.5" />
                            </a>
                          ) : (
                            <span className="text-[9px] text-slate-400 font-medium block italic pl-4">
                              WhatsApp: -
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 4: Keuangan & Masuk (No. Rekening, Tgl Masuk) */}
                      <td className="py-4 px-5">
                        <div className="min-w-0 flex flex-col gap-0.5">
                          <span className="text-xs text-slate-600 block truncate font-mono font-medium flex items-center gap-1">
                            <Hash className="w-3.5 h-3.5 text-slate-400" />
                            Rek: {emp.no_rekening || '-'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            Masuk: {emp.join_date ? formatDate(emp.join_date) : '-'}
                          </span>
                        </div>
                      </td>

                      {/* Column 5: Kata Sandi (Credentials) */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-xl px-2 py-1 max-w-[145px]">
                          <span className="font-mono text-xs text-slate-600 select-all block truncate max-w-[80px]">
                            {showPasswords[emp.id] ? emp.password_plain || 'N/A' : '••••••••'}
                          </span>
                          <div className="flex items-center">
                            <button
                              onClick={() => togglePassword(emp.id)}
                              className="p-1 hover:bg-slate-200/70 rounded-lg text-slate-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                              title={showPasswords[emp.id] ? 'Sembunyikan' : 'Tampilkan'}
                            >
                              {showPasswords[emp.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            {emp.password_plain && (
                              <button
                                onClick={() => handleCopyPassword(emp.password_plain)}
                                className="p-1 hover:bg-slate-200/70 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                                title="Salin Sandi"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 6: Status */}
                      <td className="py-4 px-5">
                        {(!emp.status || emp.status === 'active') && (
                          <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm font-quicksand">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Aktif
                          </span>
                        )}
                        {emp.status === 'pending' && (
                          <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-100 shadow-sm font-quicksand">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Pending
                          </span>
                        )}
                        {emp.status === 'pending_delete' && (
                          <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-100 shadow-sm font-quicksand">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                            Proses Hapus
                          </span>
                        )}
                      </td>

                      {/* Column 7: Aksi */}
                      <td className="py-4 px-5">
                        <div className="flex items-center justify-center gap-1">
                          {/* Edit Akun Credentials */}
                          <button
                            onClick={() => onEditClick(emp)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer inline-flex items-center"
                            title="Edit Akun Login"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {/* Edit Biodata */}
                          <button
                            onClick={() => handleOpenEditBio(emp)}
                            className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all cursor-pointer inline-flex items-center"
                            title="Edit Biodata Lengkap"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          {/* Hapus */}
                          <button
                            onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                            className="p-2 text-slate-400 hover:text-red-750 hover:bg-red-50 rounded-xl transition-all cursor-pointer inline-flex items-center"
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

        {/* Card Container (Mobile View) */}
        <div className="block md:hidden space-y-4">
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-medium bg-white border border-orange-100 rounded-2xl">
              <div className="flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                <span className="text-xs font-quicksand font-bold">Memuat data karyawan...</span>
              </div>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-bold bg-white border border-orange-100 rounded-2xl font-quicksand text-xs">
              {searchQuery ? 'Karyawan tidak ditemukan.' : 'Belum ada akun karyawan yang terdaftar.'}
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <div key={emp.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-red-200 transition-all duration-300 space-y-3.5 relative overflow-hidden">
                {/* Accent Top Bar */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 to-orange-500" />
                
                {/* Header: Photo, Name & Status */}
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3">
                    {emp.photo ? (
                      <img
                        src={getAssetUrl(emp.photo)}
                        alt={emp.name}
                        className="w-11 h-11 rounded-xl object-cover border border-orange-100 shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 text-white flex items-center justify-center font-bold text-xs uppercase font-quicksand shrink-0 border border-orange-100 shadow-sm">
                        {emp.name.substring(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-quicksand text-sm font-bold text-slate-800 truncate block max-w-[150px]">{emp.name}</span>
                        {emp.role === 'admin' && (
                          <span className="inline-block text-[8px] font-black px-1.5 py-0.5 bg-red-50 text-red-650 border border-red-150 rounded shrink-0 font-quicksand uppercase">
                            Admin HR
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate">{emp.email}</p>
                    </div>
                  </div>
 
                  {/* Status */}
                  <div className="shrink-0">
                    {(!emp.status || emp.status === 'active') && (
                      <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 font-quicksand shadow-sm">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                        Aktif
                      </span>
                    )}
                    {emp.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-100 font-quicksand shadow-sm">
                        <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></span>
                        Pending
                      </span>
                    )}
                    {emp.status === 'pending_delete' && (
                      <span className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-[9px] font-extrabold bg-rose-50 text-rose-700 border border-rose-100 font-quicksand shadow-sm">
                        <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse"></span>
                        Hapus
                      </span>
                    )}
                  </div>
                </div>
 
                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-50 py-3 font-quicksand">
                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide block">Penempatan</span>
                    <span className={`inline-block py-0.5 px-2 rounded-full text-[9px] font-bold border mt-1 ${getDivisionBadgeStyle(emp.division)}`}>
                      {emp.division || 'Umum'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block mt-1 truncate">
                      {emp.company ? emp.company.replace('PT ', '') : 'Tanpa Perusahaan'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide block">Kontak & WA</span>
                    {emp.whatsapp ? (
                      <a
                        href={getWhatsAppUrl(emp.whatsapp)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 hover:text-emerald-800 transition-colors mt-1 font-quicksand"
                      >
                        <Phone className="w-2.5 h-2.5 shrink-0" />
                        {emp.whatsapp}
                        <ExternalLink className="w-2 h-2 opacity-50" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-405 font-medium block mt-1 italic">WA: -</span>
                    )}
                  </div>

                  <div className="mt-1">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide block font-quicksand">No. Rekening</span>
                    <span className="text-[10px] text-slate-600 font-mono font-bold block mt-1">
                      {emp.no_rekening || '-'}
                    </span>
                  </div>

                  <div className="mt-1">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide block font-quicksand">Tanggal Masuk</span>
                    <span className="text-[10px] text-slate-600 font-bold block mt-1">
                      {emp.join_date ? formatDate(emp.join_date) : '-'}
                    </span>
                  </div>
                </div>
 
                {/* Password block */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center justify-between text-xs font-quicksand">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">Kredensial:</span>
                    <span className="font-mono text-xs text-slate-700 font-bold select-all">
                      {showPasswords[emp.id] ? emp.password_plain || 'N/A' : '••••••••'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => togglePassword(emp.id)}
                      className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      {showPasswords[emp.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    {emp.password_plain && (
                      <button
                        onClick={() => handleCopyPassword(emp.password_plain)}
                        className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
 
                {/* Actions & Registered Date */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-50 font-quicksand">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Reg: {formatDate(emp.created_at)}</span>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditClick(emp)}
                      className="p-2 text-slate-400 hover:text-red-650 hover:bg-red-550/5 rounded-xl transition-all cursor-pointer"
                      title="Edit Akun Login"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEditBio(emp)}
                      className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all cursor-pointer"
                      title="Edit Biodata Lengkap"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                      className="p-2 text-slate-400 hover:text-red-750 hover:bg-red-550/5 rounded-xl transition-all cursor-pointer"
                      title="Hapus Karyawan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
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
                    <img src={getAssetUrl(photoPreview)} alt="Foto"
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
                <div className="col-span-1">
                  <label className={labelClass}>Nama Lengkap *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400"><User className="w-3.5 h-3.5" /></div>
                    <input type="text" required value={editProfile.name}
                      onChange={e => setEditProfile(p => p ? { ...p, name: e.target.value } : p)}
                      placeholder="Nama lengkap" className={inputClass} />
                  </div>
                </div>
                {/* Email */}
                <div className="col-span-1">
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

                {/* WhatsApp */}
                <div className="col-span-1 sm:col-span-2">
                  <label className={labelClass}>No. WhatsApp / Telepon</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400"><Phone className="w-3.5 h-3.5" /></div>
                    <input type="text" value={editProfile.whatsapp ?? ''}
                      onChange={e => setEditProfile(p => p ? { ...p, whatsapp: e.target.value } : p)}
                      placeholder="Contoh: 08123456789" className={inputClass} />
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
                          href={getAssetUrl(editProfile.cv)}
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
