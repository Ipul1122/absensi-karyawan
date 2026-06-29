import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import axios from 'axios'
import Swal from 'sweetalert2'
import { getAssetUrl } from '../../../utils/api'
import {
  Loader2,
  MapPin,
  KeyRound,
  UserCircle2,
  Save,
  User,
  Mail,
  Calendar,
  Hash,
  Briefcase,
  Camera,
  FileText,
  FileUp,
  Lock,
  ShieldAlert,
  CheckCircle2,
  CreditCard,
  Phone,
  Database,
  UploadCloud,
  DownloadCloud,
  Info
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
  whatsapp: string
}

type ActiveTab = 'lokasi' | 'akun' | 'biodata' | 'backup'

interface LokasiKantorProps {
  officeLatitude: string
  setOfficeLatitude: (v: string) => void
  officeLongitude: string
  setOfficeLongitude: (v: string) => void
  officeRadius: number
  setOfficeRadius: (v: number) => void
  bogorLatitude: string
  setBogorLatitude: (v: string) => void
  bogorLongitude: string
  setBogorLongitude: (v: string) => void
  bogorRadius: number
  setBogorRadius: (v: number) => void
  savingOffice: boolean
  handleOfficeSettingSubmit: (e: React.FormEvent) => void
  user: UserProp
  token: string
  onProfileUpdate?: (updatedFields: { name: string; email: string; photo?: string | null }) => void
  initialTab?: ActiveTab
}

export default function LokasiKantor({
  officeLatitude,
  setOfficeLatitude,
  officeLongitude,
  setOfficeLongitude,
  officeRadius,
  setOfficeRadius,
  bogorLatitude,
  setBogorLatitude,
  bogorLongitude,
  setBogorLongitude,
  bogorRadius,
  setBogorRadius,
  savingOffice,
  handleOfficeSettingSubmit,
  user,
  token,
  onProfileUpdate,
  initialTab = 'lokasi'
}: LokasiKantorProps) {
  const activeTab: ActiveTab = initialTab

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
    whatsapp: ''
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

  // ---------- Backup & Restore States ----------
  const [importing, setImporting] = useState(false)
  const [backupFile, setBackupFile] = useState<File | null>(null)
  const fileInputBackupRef = useRef<HTMLInputElement>(null)

  const handleExportBackup = async () => {
    Swal.fire({
      title: 'Unduh Backup Database?',
      text: 'Proses ini akan mengunduh semua data tabel saat ini ke dalam file .sql.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Unduh',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#ea580c',
      cancelButtonColor: '#64748b',
      background: '#fffdfb',
      color: '#3c1105'
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Memproses...',
          text: 'Sedang menyiapkan berkas backup...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading()
          }
        })
        
        try {
          const response = await axios.get('http://localhost:8000/api/admin/backup/export', {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob'
          })
          
          const url = window.URL.createObjectURL(new Blob([response.data]))
          const link = document.createElement('a')
          link.href = url
          
          const filename = `backup_goodpeople_hcms_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}_${Math.floor(Date.now() / 1000)}.sql`
          link.setAttribute('download', filename)
          document.body.appendChild(link)
          link.click()
          
          link.parentNode?.removeChild(link)
          window.URL.revokeObjectURL(url)
          
          Swal.fire({
            title: 'Berhasil!',
            text: 'File backup basis data berhasil diunduh.',
            icon: 'success',
            background: '#fffdfb',
            color: '#3c1105',
            confirmButtonColor: '#ea580c'
          })
        } catch (err: any) {
          console.error(err)
          Swal.fire({
            title: 'Ekspor Gagal',
            text: 'Gagal mengunduh file backup basis data.',
            icon: 'error',
            background: '#fffdfb',
            color: '#3c1105',
            confirmButtonColor: '#ef4444'
          })
        }
      }
    })
  }

  const handleImportBackup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!backupFile) {
      Swal.fire({
        title: 'File Belum Dipilih',
        text: 'Silakan pilih file backup .sql terlebih dahulu.',
        icon: 'warning',
        background: '#fffdfb',
        color: '#3c1105',
        confirmButtonColor: '#ea580c'
      })
      return
    }

    Swal.fire({
      title: 'Pulihkan Basis Data?',
      text: 'PERINGATAN: Tindakan ini akan menghapus semua data tabel saat ini dan menggantinya dengan data dari file backup. Tindakan ini tidak dapat dibatalkan!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Pulihkan!',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569',
      background: '#fffdfb',
      color: '#3c1105'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setImporting(true)
        Swal.fire({
          title: 'Memulihkan Data...',
          text: 'Harap tunggu, jangan menutup halaman ini.',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading()
          }
        })

        const formData = new FormData()
        formData.append('backup_file', backupFile)

        try {
          const res = await axios.post('http://localhost:8000/api/admin/backup/import', formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          })

          if (res.data.status === 'success') {
            setBackupFile(null)
            if (fileInputBackupRef.current) {
              fileInputBackupRef.current.value = ''
            }
            
            Swal.fire({
              title: 'Pemulihan Berhasil!',
              text: 'Basis data berhasil dipulihkan ke kondisi backup.',
              icon: 'success',
              background: '#fffdfb',
              color: '#3c1105',
              confirmButtonColor: '#ea580c'
            }).then(() => {
              window.location.reload()
            })
          }
        } catch (err: any) {
          console.error(err)
          const msg = err.response?.data?.message || 'Gagal memulihkan basis data dari file SQL.'
          Swal.fire({
            title: 'Pemulihan Gagal',
            text: msg,
            icon: 'error',
            background: '#fffdfb',
            color: '#3c1105',
            confirmButtonColor: '#ef4444'
          })
        } finally {
          setImporting(false)
        }
      }
    })
  }

  const handleBackupFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'sql') {
      Swal.fire({
        title: 'Format File Salah',
        text: 'Hanya file dengan ekstensi .sql yang diperbolehkan.',
        icon: 'warning',
        background: '#fffdfb',
        color: '#3c1105',
        confirmButtonColor: '#ea580c'
      })
      if (fileInputBackupRef.current) {
        fileInputBackupRef.current.value = ''
      }
      return
    }

    setBackupFile(file)
  }


  // Leaflet Map Refs
  const configMapRef = useRef<HTMLDivElement | null>(null)
  const configMapInstance = useRef<L.Map | null>(null)
  const configMarkerRef = useRef<L.Marker | null>(null)
  const configCircleRef = useRef<L.Circle | null>(null)

  const bogorMapRef = useRef<HTMLDivElement | null>(null)
  const bogorMapInstance = useRef<L.Map | null>(null)
  const bogorMarkerRef = useRef<L.Marker | null>(null)
  const bogorCircleRef = useRef<L.Circle | null>(null)

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
          whatsapp: d.whatsapp ?? ''
        })
        if (d.photo) setPhotoPreview(d.photo)
      }
    } catch (err) {
      console.error('Gagal memuat profil admin:', err)
    } finally {
      setLoadingProfile(false)
    }
  }

  // Initialize and update Office Settings Config Map
  useEffect(() => {
    if (initialTab !== 'lokasi') {
      if (configMapInstance.current) {
        configMapInstance.current.remove()
        configMapInstance.current = null
        configMarkerRef.current = null
        configCircleRef.current = null
      }
      return
    }

    if (!configMapRef.current) return

    const lat = parseFloat(officeLatitude)
    const lng = parseFloat(officeLongitude)
    if (isNaN(lat) || isNaN(lng)) return

    // Fix default marker icon path issue in Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })

    // Setup map instance if not exists
    if (!configMapInstance.current) {
      const map = L.map(configMapRef.current).setView([lat, lng], 16)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map)

      configMapInstance.current = map

      // Map click handler to relocate office
      map.on('click', (e) => {
        setOfficeLatitude(e.latlng.lat.toFixed(6))
        setOfficeLongitude(e.latlng.lng.toFixed(6))
      })
    }

    const map = configMapInstance.current

    // Update/Create config marker
    if (configMarkerRef.current) {
      configMarkerRef.current.setLatLng([lat, lng])
    } else {
      configMarkerRef.current = L.marker([lat, lng], { draggable: true })
        .addTo(map)
        .bindPopup('Lokasi Kantor (Seret pin atau klik peta untuk memindahkan)')
        .openPopup()

      configMarkerRef.current.on('dragend', (e) => {
        const latLng = e.target.getLatLng()
        setOfficeLatitude(latLng.lat.toFixed(6))
        setOfficeLongitude(latLng.lng.toFixed(6))
      })
    }

    // Update/Create config radius circle
    if (configCircleRef.current) {
      configCircleRef.current.setLatLng([lat, lng])
      configCircleRef.current.setRadius(officeRadius)
    } else {
      configCircleRef.current = L.circle([lat, lng], {
        color: '#ef4444',
        fillColor: '#ea580c',
        fillOpacity: 0.15,
        radius: officeRadius
      }).addTo(map)
    }

    map.setView([lat, lng])

    // Workaround to draw Leaflet correctly on render
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 200)

    return () => {
      clearTimeout(timer)
    }
  }, [officeLatitude, officeLongitude, officeRadius, initialTab])

  // Initialize and update Bogor Settings Map
  useEffect(() => {
    if (initialTab !== 'lokasi') {
      if (bogorMapInstance.current) {
        bogorMapInstance.current.remove()
        bogorMapInstance.current = null
        bogorMarkerRef.current = null
        bogorCircleRef.current = null
      }
      return
    }

    if (!bogorMapRef.current) return

    const lat = parseFloat(bogorLatitude)
    const lng = parseFloat(bogorLongitude)
    if (isNaN(lat) || isNaN(lng)) return

    // Setup map instance if not exists
    if (!bogorMapInstance.current) {
      const map = L.map(bogorMapRef.current).setView([lat, lng], 16)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map)

      bogorMapInstance.current = map

      // Map click handler to relocate office
      map.on('click', (e) => {
        setBogorLatitude(e.latlng.lat.toFixed(6))
        setBogorLongitude(e.latlng.lng.toFixed(6))
      })
    }

    const map = bogorMapInstance.current

    // Update/Create config marker
    if (bogorMarkerRef.current) {
      bogorMarkerRef.current.setLatLng([lat, lng])
    } else {
      bogorMarkerRef.current = L.marker([lat, lng], { draggable: true })
        .addTo(map)
        .bindPopup('Lokasi Kantor Bogor (Seret pin atau klik peta untuk memindahkan)')
        .openPopup()

      bogorMarkerRef.current.on('dragend', (e) => {
        const latLng = e.target.getLatLng()
        setBogorLatitude(latLng.lat.toFixed(6))
        setBogorLongitude(latLng.lng.toFixed(6))
      })
    }

    // Update/Create config radius circle
    if (bogorCircleRef.current) {
      bogorCircleRef.current.setLatLng([lat, lng])
      bogorCircleRef.current.setRadius(bogorRadius)
    } else {
      bogorCircleRef.current = L.circle([lat, lng], {
        color: '#3b82f6', // blue color for Bogor
        fillColor: '#60a5fa',
        fillOpacity: 0.15,
        radius: bogorRadius
      }).addTo(map)
    }

    map.setView([lat, lng])

    // Workaround to draw Leaflet correctly on render
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 200)

    return () => {
      clearTimeout(timer)
    }
  }, [bogorLatitude, bogorLongitude, bogorRadius, initialTab])

  // Cleanup config map on unmount
  useEffect(() => {
    return () => {
      if (configMapInstance.current) {
        configMapInstance.current.remove()
        configMapInstance.current = null
        configMarkerRef.current = null
        configCircleRef.current = null
      }
      if (bogorMapInstance.current) {
        bogorMapInstance.current.remove()
        bogorMapInstance.current = null
        bogorMarkerRef.current = null
        bogorCircleRef.current = null
      }
    }
  }, [])

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
      formData.append('no_rekening', profile.no_rekening)
      formData.append('whatsapp', profile.whatsapp || '')

      const res = await axios.post('http://localhost:8000/api/user/profile', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      })
      if (res.data.status === 'success') {
        Swal.fire({ title: 'Biodata Diperbarui!', text: 'Profil Admin berhasil disimpan.', icon: 'success', background: '#fffdfb', color: '#3c1105', timer: 2000, showConfirmButton: false })
        setPhotoFile(null)
        setCvFile(null)
        if (res.data.data.photo) setPhotoPreview(res.data.data.photo)
        setProfile(p => ({
          ...p,
          cv: res.data.data.cv ?? p.cv,
          no_rekening: res.data.data.no_rekening ?? '',
          whatsapp: res.data.data.whatsapp ?? ''
        }))
        if (onProfileUpdate) {
          onProfileUpdate({
            name: res.data.data.name,
            email: res.data.data.email,
            photo: res.data.data.photo
          })
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

  const inputClass = "w-full bg-slate-50 border border-slate-200 hover:border-orange-200 focus:border-red-400 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 pl-10 pr-4 outline-none transition-all text-xs font-semibold focus:ring-2 focus:ring-red-100 font-quicksand"
  const labelClass = "block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 font-quicksand"

  // Completeness indicator calculation
  const biodataFields = [profile.photo, profile.date_of_birth, profile.address, profile.employee_number, profile.join_date, profile.gender, profile.cv, profile.no_rekening, profile.whatsapp]
  const filled = biodataFields.filter(Boolean).length
  const percent = Math.round((filled / biodataFields.length) * 100)

  return (
    <div className="space-y-6">

      {/* ===== SETTINGS TAB SWITCHER ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-orange-50/20 border border-orange-100 p-2 rounded-2xl font-quicksand shadow-xs shrink-0 max-w-3xl mx-auto">
        <Link
          to="/admin/lokasiKantor"
          className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-3 py-3 rounded-xl text-center text-[10px] sm:text-xs font-bold transition-all duration-200 cursor-pointer group active:scale-[0.98] ${activeTab === 'lokasi'
              ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-md shadow-orange-500/15'
              : 'text-slate-600 hover:text-amber-700 hover:bg-orange-50/40 bg-white/70 border border-orange-100/40'
            }`}
        >
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="truncate">Lokasi & Radius</span>
        </Link>
        <Link
          to="/admin/keamanan"
          className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-3 py-3 rounded-xl text-center text-[10px] sm:text-xs font-bold transition-all duration-200 cursor-pointer group active:scale-[0.98] ${activeTab === 'akun'
              ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-md shadow-orange-500/15'
              : 'text-slate-600 hover:text-amber-700 hover:bg-orange-50/40 bg-white/70 border border-orange-100/40'
            }`}
        >
          <KeyRound className="w-4 h-4 shrink-0" />
          <span className="truncate">Akun & Keamanan</span>
        </Link>
        <Link
          to="/admin/biodata"
          className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-3 py-3 rounded-xl text-center text-[10px] sm:text-xs font-bold transition-all duration-200 cursor-pointer group active:scale-[0.98] relative ${activeTab === 'biodata'
              ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-md shadow-orange-500/15'
              : 'text-slate-600 hover:text-amber-700 hover:bg-orange-50/40 bg-white/70 border border-orange-100/40'
            }`}
        >
          <UserCircle2 className="w-4 h-4 shrink-0" />
          <span className="truncate">Biodata Pribadi</span>
          {percent < 100 && (
            <span className={`absolute top-1.5 right-1.5 sm:relative sm:top-0 sm:right-0 px-1 py-0.5 rounded text-[8px] font-black leading-none ${activeTab === 'biodata' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-700'
              }`}>
              {percent}%
            </span>
          )}
        </Link>
        <Link
          to="/admin/backup"
          className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-3 py-3 rounded-xl text-center text-[10px] sm:text-xs font-bold transition-all duration-200 cursor-pointer group active:scale-[0.98] ${activeTab === 'backup'
              ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-md shadow-orange-500/15'
              : 'text-slate-600 hover:text-amber-700 hover:bg-orange-50/40 bg-white/70 border border-orange-100/40'
            }`}
        >
          <Database className="w-4 h-4 shrink-0" />
          <span className="truncate">Backup Data</span>
        </Link>
      </div>

      {/* ===== TAB: LOKASI KANTOR ===== */}
      {activeTab === 'lokasi' && (
        <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in font-quicksand">
          <div className="border-b border-orange-100 pb-3">
            <h3 className="text-base font-bold text-slate-800">Konfigurasi Lokasi Absensi Kantor</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tentukan koordinat pusat lokasi kantor Anda dan radius jangkauan absensi bagi karyawan (dalam meter).
            </p>
          </div>

          <form onSubmit={handleOfficeSettingSubmit} className="space-y-8">
            {/* KANTOR JAKARTA */}
            <div className="border-b border-orange-100/60 pb-8">
              <h4 className="text-sm font-extrabold text-red-650 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span> Kantor Jakarta (Pusat)
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Config */}
                <div className="lg:col-span-4 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-quicksand">
                      Latitude Kantor
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="-6.2088"
                      value={officeLatitude}
                      onChange={(e) => setOfficeLatitude(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-red-400 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-quicksand">
                      Longitude Kantor
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="106.8456"
                      value={officeLongitude}
                      onChange={(e) => setOfficeLongitude(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-red-400 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-quicksand">
                      Radius Jangkauan (Meter)
                    </label>
                    <input
                      type="number"
                      required
                      min="5"
                      max="1000000"
                      placeholder="100"
                      value={officeRadius}
                      onChange={(e) => setOfficeRadius(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-red-400 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-mono font-semibold"
                    />
                  </div>
                </div>

                {/* Map Config View */}
                <div className="lg:col-span-8 space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-quicksand">
                    Visualisasi Peta Kantor Jakarta & Radius Batas Absen
                  </label>
                  <div className="relative w-full h-[320px] rounded-3xl bg-white border border-orange-100 overflow-hidden shadow-inner">
                    <div
                      ref={configMapRef}
                      id="office-map-config"
                      className="w-full h-full z-10"
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* KANTOR BOGOR */}
            <div className="border-b border-orange-100/60 pb-8">
              <h4 className="text-sm font-extrabold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span> Kantor Bogor (Cabang)
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Config */}
                <div className="lg:col-span-4 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-quicksand">
                      Latitude Kantor
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="-6.5971"
                      value={bogorLatitude}
                      onChange={(e) => setBogorLatitude(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-red-400 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-quicksand">
                      Longitude Kantor
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="106.7973"
                      value={bogorLongitude}
                      onChange={(e) => setBogorLongitude(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-red-400 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Radius Jangkauan (Meter)
                    </label>
                    <input
                      type="number"
                      required
                      min="5"
                      max="500000"
                      placeholder="100"
                      value={bogorRadius}
                      onChange={(e) => setBogorRadius(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-red-400 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-mono font-semibold"
                    />
                  </div>
                </div>

                {/* Map Config View */}
                <div className="lg:col-span-8 space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-quicksand">
                    Visualisasi Peta Kantor Bogor & Radius Batas Absen
                  </label>
                  <div className="relative w-full h-[320px] rounded-3xl bg-white border border-orange-100 overflow-hidden shadow-inner">
                    <div
                      ref={bogorMapRef}
                      id="bogor-map-config"
                      className="w-full h-full z-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button & Guide */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 border-t border-orange-100">
              <div className="lg:col-span-4">
                <button
                  type="submit"
                  disabled={savingOffice}
                  className="w-full px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-md shadow-red-500/10 cursor-pointer text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed font-quicksand font-semibold"
                >
                  {savingOffice ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Lokasi & Radius'
                  )}
                </button>
              </div>

              <div className="lg:col-span-8 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl space-y-2 text-[11px] text-slate-600 leading-normal font-quicksand font-semibold">
                <p className="font-bold text-red-650 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0" /> Petunjuk Penggunaan Peta:
                </p>
                <ul className="list-disc pl-4 space-y-1 font-medium text-slate-550">
                  <li>Klik di bagian mana pun pada peta untuk memindahkan lokasi pin kantor Jakarta atau Bogor secara instan.</li>
                  <li>Atau, seret (drag) pin untuk menyempurnakan posisi koordinat.</li>
                  <li>Sesuaikan jangkauan radius dengan memasukkan nilai meter (misal: 100).</li>
                </ul>
              </div>
            </div>
          </form>
        </section>
      )}

      {/* ===== TAB: AKUN & KEAMANAN ===== */}
      {activeTab === 'akun' && (
        <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-5 animate-fade-in font-quicksand">
          <div className="border-b border-orange-100 pb-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-md shadow-red-200">
              <KeyRound className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Pengaturan Akun Admin</h2>
              <p className="text-[11px] text-slate-500">Ubah kata sandi login Admin Utama Anda secara berkala.</p>
            </div>
          </div>

          {/* User info summary */}
          <div className="flex items-center gap-4 p-3.5 bg-orange-50/40 border border-orange-100 rounded-2xl">
            {photoPreview ? (
              <img
                src={photoPreview.startsWith('http') || photoPreview.startsWith('blob:') || photoPreview.startsWith('data:') ? photoPreview : getAssetUrl(photoPreview)}
                alt="Foto"
                className="w-10 h-10 rounded-xl object-cover border-2 border-orange-200 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-grow min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{profile.name || user.name}</p>
              <p className="text-[11px] text-slate-500 font-mono truncate">{profile.email || user.email}</p>
            </div>
            <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 bg-red-50 text-red-750 border border-red-100 rounded-full">
              HR Admin
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
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan kata sandi aktif"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Kata Sandi Baru</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Lock className="w-4 h-4" /></div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min. 6 karakter"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Konfirmasi Sandi Baru</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Lock className="w-4 h-4" /></div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang sandi baru"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={savingPassword}
                className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-md shadow-red-500/15 cursor-pointer text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingPassword ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />Menyimpan...</>
                ) : (
                  <><Save className="w-4 h-4" />Perbarui Kata Sandi</>
                )}
              </button>
            </div>
          </form>

          {/* Safety notice */}
          <div className="flex items-start gap-3 p-3.5 bg-orange-50/30 border border-orange-100 rounded-xl">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
              <strong className="text-slate-700">Peringatan Keamanan:</strong> Gunakan kata sandi unik yang berbeda dari akun media sosial pribadi Anda. Jangan bagikan akses kredensial Admin HR dengan siapa pun.
            </p>
          </div>
        </section>
      )}

      {/* ===== TAB: BIODATA PRIBADI ADMIN ===== */}
      {activeTab === 'biodata' && (
        <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-5 animate-fade-in font-quicksand">
          <div className="border-b border-orange-100 pb-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-md shadow-red-200">
                <UserCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Biodata Pribadi Admin</h2>
                <p className="text-[11px] text-slate-500">Informasi profil lengkap Admin HR untuk keperluan administrasi internal.</p>
              </div>
            </div>

            {/* Completeness indicator */}
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
              <span className="text-[9px] text-slate-400">Kelengkapan Profil</span>
            </div>
          </div>

          {loadingProfile ? (
            <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-red-400" />
              <span className="text-xs font-semibold">Memuat profil...</span>
            </div>
          ) : (
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              {/* ---- Photo Upload ---- */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-orange-50/30 border border-orange-100 rounded-2xl">
                <div className="relative shrink-0">
                  {photoPreview ? (
                    <img
                      src={photoPreview.startsWith('http') || photoPreview.startsWith('blob:') || photoPreview.startsWith('data:') ? photoPreview : getAssetUrl(photoPreview)}
                      alt="Foto Profil"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-orange-200 shadow-md shadow-orange-100"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-red-100 to-orange-100 border-2 border-orange-200 flex items-center justify-center shadow-sm">
                      <User className="w-8 h-8 text-orange-300" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-7 h-7 bg-gradient-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center text-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-grow text-center sm:text-left">
                  <p className="text-sm font-bold text-slate-700">Foto Profil Admin HR</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Format: JPG, PNG, WEBP · Maks. 2MB</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-orange-200 hover:border-red-300 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {photoPreview ? 'Ganti Foto' : 'Unggah Foto'}
                  </button>
                  {photoFile && <p className="mt-1 text-[10px] text-emerald-600 font-semibold">✓ {photoFile.name}</p>}
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
                  <label className={labelClass}>Nama Admin HR <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><User className="w-4 h-4" /></div>
                    <input
                      type="text"
                      required
                      value={profile.name}
                      onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                      placeholder="Nama lengkap admin"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Alamat Email <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Mail className="w-4 h-4" /></div>
                    <input
                      type="email"
                      required
                      value={profile.email}
                      onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                      placeholder="email@perusahaan.com"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* ---- No Karyawan (NIP) & Divisi & Jenis Kelamin ---- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nomor Karyawan (NIP)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Hash className="w-4 h-4" /></div>
                    <input
                      type="text"
                      value={profile.employee_number}
                      onChange={e => setProfile(p => ({ ...p, employee_number: e.target.value }))}
                      placeholder="Belum Diatur"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Divisi Kerja</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Briefcase className="w-4 h-4" /></div>
                    <input
                      type="text"
                      value={profile.division || 'HR / Admin'}
                      className={inputClass}
                      disabled={true}
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Jenis Kelamin</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><User className="w-4 h-4" /></div>
                    <select
                      value={profile.gender}
                      onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))}
                      className={`${inputClass} appearance-none cursor-pointer`}
                    >
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
                    <input
                      type="date"
                      value={profile.date_of_birth}
                      onChange={e => setProfile(p => ({ ...p, date_of_birth: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Tanggal Bergabung</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Briefcase className="w-4 h-4" /></div>
                    <input
                      type="date"
                      value={profile.join_date}
                      onChange={e => setProfile(p => ({ ...p, join_date: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* ---- Nomor Rekening ---- */}
              <div>
                <label className={labelClass}>Nomor Rekening</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={profile.no_rekening}
                    onChange={e => setProfile(p => ({ ...p, no_rekening: e.target.value }))}
                    placeholder="Masukkan nomor rekening bank..."
                    className={inputClass}
                  />
                </div>
              </div>

              {/* ---- Nomor WhatsApp ---- */}
              <div>
                <label className={labelClass}>Nomor WhatsApp</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={profile.whatsapp}
                    onChange={e => setProfile(p => ({ ...p, whatsapp: e.target.value }))}
                    placeholder="Contoh: 08123456789"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* ---- Alamat ---- */}
              <div>
                <label className={labelClass}>Alamat Lengkap</label>
                <div className="relative">
                  <div className="absolute top-3 left-0 pl-3.5 pointer-events-none text-slate-400"><MapPin className="w-4 h-4" /></div>
                  <textarea
                    rows={3}
                    value={profile.address}
                    onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
                    placeholder="Alamat domisili lengkap..."
                    className="w-full bg-slate-50 border border-slate-200 hover:border-orange-200 focus:border-red-400 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 pl-10 pr-4 outline-none transition-all text-xs font-semibold focus:ring-2 focus:ring-red-100 resize-none"
                  />
                </div>
              </div>

              {/* ---- CV ---- */}
              <div>
                <label className={labelClass}>Dokumen CV (Curriculum Vitae)</label>
                <div className="p-4 bg-orange-50/20 border border-dashed border-orange-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 font-quicksand">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="w-10 h-10 rounded-xl bg-orange-100/50 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-orange-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700">Curriculum Vitae Admin</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Format: PDF, DOC, DOCX · Maks. 5MB</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    {profile.cv && (
                      <a
                        href={profile.cv}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 hover:border-red-300 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Lihat CV
                      </a>
                    )}

                    <label className="px-3.5 py-1.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold rounded-xl text-[10px] transition-all cursor-pointer shadow-sm flex items-center gap-1.5 select-none">
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
                  <p className="mt-1.5 text-[10px] text-emerald-600 font-bold flex items-center gap-1 ml-1">
                    <span>✓</span> Terpilih: {cvFile.name} ({Math.round(cvFile.size / 1024)} KB)
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-md shadow-red-500/15 cursor-pointer text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingProfile ? (
                    <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />Menyimpan...</>
                  ) : (
                    <><Save className="w-4 h-4" />Simpan Biodata</>
                  )}
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* ===== TAB: BACKUP & RESTORE DATA ===== */}
      {activeTab === 'backup' && (
        <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in font-quicksand">
          <div className="border-b border-orange-100 pb-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-md shadow-red-200">
              <Database className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 font-quicksand">Backup & Restore Basis Data</h2>
              <p className="text-[11px] text-slate-500">Ekspor basis data Anda untuk pengamanan, atau pulihkan data dari berkas cadangan (.sql).</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export Section */}
            <div className="border border-orange-100/70 rounded-2xl p-5 space-y-4 bg-orange-50/5 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <DownloadCloud className="w-4 h-4 text-orange-600" /> Ekspor Data (Backup)
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  Buat cadangan data lengkap dari sistem HCMS GoodPeople. Sistem akan mengumpulkan data seluruh tabel dan mengunduh berkas berupa SQL file.
                </p>
                <div className="p-3 bg-orange-50/40 rounded-xl border border-orange-100/50 text-[10px] text-slate-550 font-medium space-y-1">
                  <div className="flex justify-between"><span>Sistem Database:</span> <span className="font-bold text-slate-700">MySQL</span></div>
                  <div className="flex justify-between"><span>Format File:</span> <span className="font-bold text-slate-700">.sql</span></div>
                  <div className="flex justify-between"><span>Kompresi:</span> <span className="font-bold text-slate-700">Tidak ada (Raw SQL)</span></div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full mt-3 py-2.5 px-4 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-650 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-md shadow-orange-500/10 cursor-pointer text-xs flex items-center justify-center gap-1.5"
              >
                <DownloadCloud className="w-4 h-4" /> Unduh Backup Database (.sql)
              </button>
            </div>

            {/* Import Section */}
            <div className="border border-orange-100/70 rounded-2xl p-5 space-y-4 bg-orange-50/5 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-red-650" /> Pulihkan Data (Restore)
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  Unggah file cadangan `.sql` yang telah diunduh sebelumnya untuk mengembalikan basis data ke keadaan semula.
                </p>
                <div className="flex items-start gap-2.5 p-3.5 bg-rose-50/30 border border-rose-100/50 rounded-xl">
                  <Info className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[9.5px] text-red-700 font-semibold leading-normal">
                    <strong>PERHATIAN:</strong> Tindakan ini bersifat destruktif. Data saat ini akan diganti seluruhnya oleh isi berkas backup. Pastikan berkas SQL valid dan tidak korup.
                  </p>
                </div>
              </div>

              <form onSubmit={handleImportBackup} className="space-y-3">
                <div className="relative">
                  <input
                    ref={fileInputBackupRef}
                    type="file"
                    accept=".sql"
                    onChange={handleBackupFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputBackupRef.current?.click()}
                    className="w-full py-2 bg-slate-50 border border-dashed border-slate-350 hover:border-orange-300 rounded-xl text-[11px] font-bold text-slate-600 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    {backupFile ? 'Ganti File Backup' : 'Pilih File Backup (.sql)'}
                  </button>
                </div>
                {backupFile && (
                  <p className="text-[10px] text-emerald-600 font-bold text-center bg-emerald-50 border border-emerald-100 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1">
                    <span>✓</span> Terpilih: {backupFile.name} ({Math.round(backupFile.size / 1024)} KB)
                  </p>
                )}
                <button
                  type="submit"
                  disabled={importing || !backupFile}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-red-650 to-orange-700 hover:from-red-700 hover:to-orange-850 text-white font-bold rounded-xl transition-all shadow-md shadow-orange-500/10 cursor-pointer text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? (
                    <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" /> Memulihkan...</>
                  ) : (
                    <><UploadCloud className="w-4 h-4" /> Pulihkan Database sekarang</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
