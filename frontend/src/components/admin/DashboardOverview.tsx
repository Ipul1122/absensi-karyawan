import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Swal from 'sweetalert2'
import { API_BASE_URL } from '../../utils/api'
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  Camera, 
  RefreshCw, 
  AlertCircle, 
  Check, 
  Upload, 
  X,
  FileText,
  Calendar,
  AlertTriangle,
  Building,
  Compass,
  UserCheck,
  TrendingUp,
  DollarSign,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Search,
  CheckCircle,
  FlipHorizontal2
} from 'lucide-react'

interface Attendance {
  id: number
  date: string
  attendance_type?: string | null
  clock_in: string | null
  clock_out: string | null
  latitude_in: string | null
  longitude_in: string | null
  latitude_out: string | null
  longitude_out: string | null
  photo_in: string | null
  photo_out: string | null
  notes_in: string | null
  notes_out: string | null
  status_in: string | null
  status_out: string | null
  shift_start_time?: string | null
  shift_end_time?: string | null
  user: {
    id: number
    name: string
    email: string
    photo?: string | null
  }
}

interface OfficeSetting {
  latitude: string
  longitude: string
  radius: number
}

interface Employee {
  id: number
  name: string
  email: string
  password_plain?: string
  photo?: string | null
  division?: string | null
  created_at: string
  updated_at: string
  status?: 'active' | 'pending' | 'pending_delete'
}

interface DashboardOverviewProps {
  loading: boolean
  attendanceLoading: boolean
  employees: Employee[]
  presentTodayCount: number
  presentTodayList: Attendance[]
  todayStr: string
  user: {
    id: number
    name: string
    email: string
    role: 'admin' | 'employee'
    photo?: string | null
  }
  token: string
  time: Date
  officeSetting: OfficeSetting | null
  todayAttendance: Attendance | null
  fetchTodayAttendance: () => Promise<void>
  leaves: any[]
}

export default function DashboardOverview({
  loading,
  attendanceLoading,
  employees,
  presentTodayCount,
  presentTodayList,
  todayStr,
  user,
  token,
  time,
  officeSetting,
  todayAttendance,
  fetchTodayAttendance,
  leaves
}: DashboardOverviewProps) {
  // Modal State for Check-In/Check-Out Camera
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [modalType, setModalType] = useState<'check-in' | 'check-out'>('check-in')
  const [activeTab, setActiveTab] = useState<'kantor' | 'kunjungan' | 'client'>('kantor')
  const [submitting, setSubmitting] = useState(false)
  
  // Camera & Location Local States
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // ---------- Additional Local States for Monitoring & Sync ----------
  const navigate = useNavigate()
  const [reimbursements, setReimbursements] = useState<any[]>([])
  const [overtimes, setOvertimes] = useState<any[]>([])
  const [activeAttendanceTab, setActiveAttendanceTab] = useState<'hadir' | 'cuti' | 'belum_hadir'>('hadir')
  const [searchEmployeeQuery, setSearchEmployeeQuery] = useState('')

  useEffect(() => {
    fetchReimbursementsAndOvertimes()
  }, [])

  const fetchReimbursementsAndOvertimes = async () => {
    try {
      const [reimResponse, otResponse] = await Promise.all([
        axios.get('http://localhost:8000/api/admin/reimbursements', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:8000/api/admin/overtimes', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      if (reimResponse.data.status === 'success') {
        setReimbursements(reimResponse.data.data)
      }
      if (otResponse.data.status === 'success') {
        setOvertimes(otResponse.data.data)
      }
    } catch (err) {
      console.error('Gagal mengambil data reimbursement/lembur:', err)
    }
  }

  // Live seconds for the clock circular progress
  const seconds = time.getSeconds()

  // Standarize photo URLs
  const getFullPhotoUrl = (path: string | null | undefined) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    if (path.startsWith('/storage/')) return `${API_BASE_URL}${path}`
    if (path.startsWith('storage/')) return `${API_BASE_URL}/${path}`
    return `${API_BASE_URL}/storage/${path}`
  }

  // Dynamic statistics calculations (fully synced!)
  const activeEmployees = employees.filter(e => e.status === 'active')
  const employeesCount = activeEmployees.length

  // presentTodayList and presentTodayCount are passed down as props

  const lateTodayCount = presentTodayList.filter(
    (att) => att.status_in === 'late'
  ).length

  const cutiTodayList = leaves.filter(
    (l) => l.status === 'approved' && todayStr >= l.start_date && todayStr <= l.end_date
  )
  const cutiTodayCount = cutiTodayList.length

  const absentTodayList = activeEmployees.filter(
    (emp) => 
      !presentTodayList.some(att => att.user.id === emp.id) &&
      !cutiTodayList.some(l => l.user_id === emp.id)
  )
  const absentTodayCount = absentTodayList.length

  const presencePercentage = employeesCount > 0 
    ? Math.round((presentTodayCount / employeesCount) * 100)
    : 0

  // Pending items count
  const pendingLeavesCount = leaves.filter(l => l.status === 'pending').length
  const pendingReimbursementsCount = reimbursements.filter(r => r.status === 'pending').length
  const pendingOvertimesCount = overtimes.filter(o => o.status === 'pending').length
  const pendingRegistrationsCount = employees.filter(e => e.status === 'pending' || e.status === 'pending_delete').length

  // Filtered lists for the tabs based on query search
  const filteredPresentList = presentTodayList.filter(att => 
    att.user.name.toLowerCase().includes(searchEmployeeQuery.toLowerCase())
  )

  const filteredCutiList = cutiTodayList.map(l => {
    const emp = employees.find(e => e.id === l.user_id)
    return { ...l, employee: emp }
  }).filter(l => 
    l.employee?.name?.toLowerCase().includes(searchEmployeeQuery.toLowerCase())
  )

  const filteredAbsentList = absentTodayList.filter(emp =>
    emp.name.toLowerCase().includes(searchEmployeeQuery.toLowerCase())
  )

  // Format date helper
  const getIndonesianDate = (d: Date) => {
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // Get dynamic greeting
  const getGreeting = () => {
    const hrs = time.getHours()
    if (hrs < 12) return 'Selamat Pagi'
    if (hrs < 15) return 'Selamat Siang'
    if (hrs < 18) return 'Selamat Sore'
    return 'Selamat Malam'
  }

  // Open modal handler
  const handleOpenCheckInModal = (type: 'check-in' | 'check-out') => {
    setModalType(type)
    setCapturedPhoto(null)
    setNotes('')
    setCameraError(null)
    setGpsError(null)
    setShowCheckInModal(true)
    fetchLocation()
    startCamera()
  }

  // Close modal handler
  const handleCloseCheckInModal = () => {
    stopCamera()
    setShowCheckInModal(false)
  }

  // Fetch Geolocation
  const fetchLocation = () => {
    setGpsLoading(true)
    setGpsError(null)
    if (!navigator.geolocation) {
      setGpsError('Browser tidak mendukung lokasi GPS.')
      setGpsLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude)
        setLongitude(pos.coords.longitude)
        setGpsLoading(false)
      },
      (err) => {
        console.error(err)
        setGpsError('Gagal mendeteksi lokasi. Harap berikan izin GPS.')
        setGpsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Start Camera Stream
  const startCamera = async (mode?: 'user' | 'environment') => {
    const currentMode = mode ?? facingMode
    setCameraError(null)
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: { ideal: currentMode } }
      })
      streamRef.current = mediaStream
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error(err)
      setCameraError('Gagal mengakses kamera. Mohon berikan izin kamera.')
    }
  }

  const flipCamera = async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newMode)
    await startCamera(newMode)
  }

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setStream(null)
  }

  // Bind video stream
  useEffect(() => {
    if (showCheckInModal && videoRef.current && stream && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream
    }
  }, [showCheckInModal, stream])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        setCapturedPhoto(canvas.toDataURL('image/jpeg'))
        stopCamera()
      }
    }
  }

  const retakePhoto = () => {
    setCapturedPhoto(null)
    startCamera()
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setCapturedPhoto(event.target?.result as string)
      stopCamera()
    }
    reader.readAsDataURL(file)
  }

  // Calculate distance between employee and office (in meters)
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const earthRadius = 6371000 // meters
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return earthRadius * c
  }

  const currentDistance = latitude && longitude && officeSetting
    ? getDistance(latitude, longitude, parseFloat(officeSetting.latitude), parseFloat(officeSetting.longitude))
    : null

  const isWithinRadius = currentDistance !== null && officeSetting !== null && currentDistance <= officeSetting.radius

  // Submit check-in/check-out to server API
  const handleSubmit = async () => {
    if (!capturedPhoto) {
      Swal.fire({ title: 'Foto Wajib', text: 'Ambil foto wajah Anda terlebih dahulu.', icon: 'warning', confirmButtonColor: '#ea580c' })
      return
    }
    if (!latitude || !longitude) {
      Swal.fire({ title: 'Lokasi Wajib', text: 'Sinyal GPS belum didapatkan.', icon: 'warning', confirmButtonColor: '#ea580c' })
      return
    }

    const isKantor = modalType === 'check-in' ? activeTab === 'kantor' : todayAttendance?.attendance_type === 'kantor'
    if (isKantor && officeSetting && !isWithinRadius) {
      Swal.fire({
        title: 'Di Luar Radius Kantor',
        text: `Jarak Anda ${Math.round(currentDistance || 0)}m melebihi batas radius ${officeSetting.radius}m.`,
        icon: 'error',
        confirmButtonColor: '#dc2626'
      })
      return
    }

    setSubmitting(true)
    try {
      const url = `http://localhost:8000/api/attendance/${modalType}`
      const response = await axios.post(
        url,
        {
          latitude: String(latitude),
          longitude: String(longitude),
          photo: capturedPhoto,
          notes: notes,
          attendance_type: modalType === 'check-in' ? activeTab : undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.status === 'success') {
        Swal.fire({
          title: 'Berhasil!',
          text: response.data.message,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: '#ffffff',
        })
        handleCloseCheckInModal()
        await fetchTodayAttendance()
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal memproses absensi.'
      Swal.fire({ title: 'Gagal', text: msg, icon: 'error', confirmButtonColor: '#dc2626' })
    } finally {
      setSubmitting(false)
    }
  }

  // Format single recent attendance log status badge
  const getBadgeStyle = (status: string | null) => {
    if (!status) return 'bg-slate-100 text-slate-700 border border-slate-200'
    if (status === 'early' || status === 'normal') {
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    }
    if (status === 'late' || status === 'early_departure') {
      return 'bg-rose-50 text-rose-700 border border-rose-200'
    }
    return 'bg-amber-50 text-amber-700 border border-amber-200'
  }

  const getStatusText = (status: string | null) => {
    if (!status) return 'HADIR'
    if (status === 'early') return 'DATANG CEPAT'
    if (status === 'normal') return 'ON TIME'
    if (status === 'late') return 'TERLAMBAT'
    if (status === 'early_departure') return 'PULANG CEPAT'
    return status.toUpperCase()
  }

  return (
    <div className="space-y-6 animate-fade-in font-quicksand">
      
      {/* 1. GREETING BANNER */}
      <div className="relative overflow-hidden rounded-[32px] p-8 text-white shadow-lg shadow-orange-500/5 transition-all duration-500"
        style={{ background: 'linear-gradient(135deg, #7c2d12 0%, #b45309 60%, #d97706 100%)' }}>
        
        {/* Abstract futuristic glowing elements */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full opacity-20 blur-3xl bg-amber-500 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full opacity-15 blur-3xl bg-orange-500 pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full opacity-15 blur-2xl bg-yellow-400 pointer-events-none animate-pulse" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-white/80 text-[10px] font-black uppercase tracking-widest bg-black/10 px-3.5 py-1.5 rounded-full border border-white/20 select-none">
              Akses Admin Utama HR
            </span>
            <h1 className="text-3xl font-black mt-3 font-quicksand capitalize">
              {getGreeting()}, {user.name}!
            </h1>
            <p className="text-xs text-white/90 font-medium mt-1">
              Kelola dan pantau seluruh aktivitas absensi serta perizinan staf Anda secara realtime.
            </p>
          </div>
        </div>
      </div>

      {/* 2. STATS KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Employees */}
        <div className="bg-white border border-orange-100/60 rounded-[28px] p-6 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Staf Aktif</p>
              <h3 className="text-3xl font-black text-slate-800 mt-2 font-mono">
                {loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : employeesCount}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 group-hover:scale-110 transition-transform">
              <Users className="w-5.5 h-5.5" />
            </div>
          </div>
          <div className="mt-3 text-[10px] text-slate-500 font-semibold flex items-center gap-1 select-none">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" /> Karyawan terdaftar aktif
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-white border border-orange-100/60 rounded-[28px] p-6 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Hadir Hari Ini</p>
              <h3 className="text-3xl font-black text-slate-800 mt-2 font-mono flex items-baseline gap-1.5">
                {attendanceLoading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : presentTodayCount}
                <span className="text-xs text-slate-400 font-bold font-quicksand">({presencePercentage}%)</span>
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5.5 h-5.5" />
            </div>
          </div>
          <div className="mt-3.5 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden select-none">
            <div className="h-full bg-gradient-to-r from-amber-600 to-orange-500 rounded-full transition-all duration-1000" style={{ width: `${presencePercentage}%` }}></div>
          </div>
        </div>

        {/* Late Today */}
        <div className="bg-white border border-orange-100/60 rounded-[28px] p-6 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Datang Terlambat</p>
              <h3 className="text-3xl font-black text-rose-600 mt-2 font-mono">
                {attendanceLoading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : lateTodayCount}
              </h3>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 group-hover:scale-110 transition-transform">
              <Clock className="w-5.5 h-5.5" />
            </div>
          </div>
          <div className="mt-3 text-[10px] text-slate-500 font-semibold flex items-center gap-1 select-none">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Check-in setelah jam 09:00 WIB
          </div>
        </div>

        {/* On Leave / Cuti */}
        <div className="bg-white border border-orange-100/60 rounded-[28px] p-6 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Izin & Cuti Aktif</p>
              <h3 className="text-3xl font-black text-slate-800 mt-2 font-mono">
                {loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : cutiTodayCount}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 group-hover:scale-110 transition-transform">
              <FileText className="w-5.5 h-5.5" />
            </div>
          </div>
          <div className="mt-3 text-[10px] text-slate-500 font-semibold flex items-center gap-1 select-none">
            <Calendar className="w-3.5 h-3.5 text-amber-500" /> Berdasarkan persetujuan Admin
          </div>
        </div>
      </div>

      {/* 3. PENDING ACTION PANEL */}
      <div className="bg-white border border-orange-100/60 rounded-[32px] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-orange-50 pb-3">
          <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Permintaan Menunggu Tindakan (HR Verifikasi)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Leaves */}
          <button
            onClick={() => navigate('/admin/cuti')}
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group select-none ${
              pendingLeavesCount > 0
                ? 'bg-red-50/40 border-red-200 hover:border-red-300 shadow-sm shadow-red-500/5 hover:scale-101'
                : 'bg-slate-50/40 border-slate-100 hover:border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${pendingLeavesCount > 0 ? 'bg-red-500 text-white shadow-md shadow-red-300' : 'bg-slate-100 text-slate-400'}`}>
                <Calendar className="w-4.5 h-4.5" />
              </div>
              <div className="text-left min-w-0">
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Persetujuan Cuti</span>
                <span className={`text-[11px] font-black truncate block ${pendingLeavesCount > 0 ? 'text-red-700' : 'text-slate-600'}`}>
                  {pendingLeavesCount > 0 ? `${pendingLeavesCount} Berkas` : 'Selesai'}
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform animate-pulse" />
          </button>

          {/* Reimbursement */}
          <button
            onClick={() => navigate('/admin/reimbursement')}
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group select-none ${
              pendingReimbursementsCount > 0
                ? 'bg-orange-50/40 border-orange-200 hover:border-orange-300 shadow-sm shadow-orange-500/5 hover:scale-101'
                : 'bg-slate-50/40 border-slate-100 hover:border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${pendingReimbursementsCount > 0 ? 'bg-orange-500 text-white shadow-md shadow-orange-300' : 'bg-slate-100 text-slate-400'}`}>
                <DollarSign className="w-4.5 h-4.5" />
              </div>
              <div className="text-left min-w-0">
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Klaim Biaya</span>
                <span className={`text-[11px] font-black truncate block ${pendingReimbursementsCount > 0 ? 'text-orange-700' : 'text-slate-600'}`}>
                  {pendingReimbursementsCount > 0 ? `${pendingReimbursementsCount} Berkas` : 'Selesai'}
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Overtimes */}
          <button
            onClick={() => navigate('/admin/lembur')}
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group select-none ${
              pendingOvertimesCount > 0
                ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300 shadow-sm shadow-amber-500/5 hover:scale-101'
                : 'bg-slate-50/40 border-slate-100 hover:border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${pendingOvertimesCount > 0 ? 'bg-amber-500 text-white shadow-md shadow-amber-300' : 'bg-slate-100 text-slate-400'}`}>
                <Clock className="w-4.5 h-4.5" />
              </div>
              <div className="text-left min-w-0">
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Verifikasi Lembur</span>
                <span className={`text-[11px] font-black truncate block ${pendingOvertimesCount > 0 ? 'text-amber-700' : 'text-slate-600'}`}>
                  {pendingOvertimesCount > 0 ? `${pendingOvertimesCount} Berkas` : 'Selesai'}
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Account Verification */}
          <button
            onClick={() => navigate('/admin/akunKaryawan')}
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group select-none ${
              pendingRegistrationsCount > 0
                ? 'bg-blue-50/40 border-blue-200 hover:border-blue-300 shadow-sm shadow-blue-500/5 hover:scale-101'
                : 'bg-slate-50/40 border-slate-100 hover:border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${pendingRegistrationsCount > 0 ? 'bg-blue-500 text-white shadow-md shadow-blue-300' : 'bg-slate-100 text-slate-400'}`}>
                <Users className="w-4.5 h-4.5" />
              </div>
              <div className="text-left min-w-0">
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Pendaftaran Karyawan</span>
                <span className={`text-[11px] font-black truncate block ${pendingRegistrationsCount > 0 ? `${pendingRegistrationsCount} Akun` : 'Selesai'}`}>
                  {pendingRegistrationsCount > 0 ? `${pendingRegistrationsCount} Akun` : 'Selesai'}
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* 4. MAIN MONITORING & SELF CHECK-IN GRID (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Workforce Presence Monitor (7 Columns) - Appears second on mobile */}
        <section className="lg:col-span-7 order-2 lg:order-1 bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-all duration-300 min-h-[520px] flex flex-col justify-between">
          <div className="space-y-5">
            {/* Header + Search bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Pusat Pemantauan Kehadiran</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Real-time Employee Status</p>
              </div>
              
              {/* Simple Search Input */}
              <div className="relative shrink-0 w-full sm:w-48">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  placeholder="Cari nama..."
                  value={searchEmployeeQuery}
                  onChange={(e) => setSearchEmployeeQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-orange-200 focus:border-red-400 text-slate-800 placeholder-slate-400 rounded-xl py-1.5 pl-9 pr-3 outline-none transition-all text-xs font-semibold"
                />
              </div>
            </div>

            {/* Tab controls */}
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl">
              {[
                { id: 'hadir', label: 'Hadir', count: presentTodayCount, color: 'text-emerald-600 bg-white border-slate-200 shadow-xs' },
                { id: 'cuti', label: 'Izin/Cuti', count: cutiTodayCount, color: 'text-amber-600 bg-white border-slate-200 shadow-xs' },
                { id: 'belum_hadir', label: 'Belum Hadir', count: absentTodayCount, color: 'text-rose-600 bg-white border-slate-200 shadow-xs' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveAttendanceTab(tab.id as any)}
                  className={`flex-grow flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                    activeAttendanceTab === tab.id
                      ? 'bg-white text-slate-800 border border-orange-100 shadow-xs shadow-orange-500/5'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                  }`}
                >
                  {tab.label}
                  <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold font-mono ${
                    activeAttendanceTab === tab.id
                      ? (tab.id === 'hadir' ? 'bg-emerald-50 text-emerald-700' : tab.id === 'cuti' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700')
                      : 'bg-slate-200/60 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Tab content lists */}
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {attendanceLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400 font-bold text-xs">
                  <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                  Memproses data pemantauan...
                </div>
              ) : activeAttendanceTab === 'hadir' ? (
                filteredPresentList.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 font-bold text-xs italic">
                    {searchEmployeeQuery ? 'Nama tidak ditemukan.' : 'Belum ada karyawan yang hadir hari ini.'}
                  </div>
                ) : (
                  filteredPresentList.map((att) => {
                    const photoUrl = getFullPhotoUrl(att.user.photo)
                    const checkinPhoto = getFullPhotoUrl(att.photo_in)

                    return (
                      <div key={att.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-50 hover:bg-slate-50/50 transition-colors duration-150 animate-fade-in">
                        <div className="flex items-center gap-3">
                          {photoUrl ? (
                            <img src={photoUrl} alt="Foto" className="w-10 h-10 rounded-full border border-slate-100 object-cover shrink-0 shadow-inner" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-400 to-red-500 border border-slate-100 flex items-center justify-center text-white font-extrabold text-xs shadow-inner shrink-0 select-none">
                              {att.user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-black text-slate-800">{att.user.name}</h4>
                              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-500 rounded text-[8px] font-bold uppercase font-mono tracking-wider">
                                {employees.find(e => e.id === att.user.id)?.division || 'Umum'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                                {att.clock_in ? att.clock_in.substring(0, 5) : '-'} WIB
                              </span>
                              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                              <span className="text-[9px] text-slate-400 font-extrabold capitalize">
                                {att.attendance_type === 'kantor' ? 'Kantor Utama' : att.attendance_type === 'client' ? 'Visit Klien' : 'Dinas Luar'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black font-mono tracking-wider ${getBadgeStyle(att.status_in)}`}>
                            {getStatusText(att.status_in)}
                          </span>
                          {checkinPhoto && (
                            <button
                              onClick={() => {
                                Swal.fire({
                                  title: `Bukti Foto Check-In: ${att.user.name}`,
                                  imageUrl: checkinPhoto,
                                  imageAlt: 'Check-In Foto Wajah',
                                  confirmButtonColor: '#ea580c',
                                  confirmButtonText: 'Tutup',
                                  background: '#ffffff',
                                })
                              }}
                              className="p-1 text-slate-400 hover:text-orange-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Lihat Foto Absen"
                            >
                              <Camera className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )
              ) : activeAttendanceTab === 'cuti' ? (
                filteredCutiList.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 font-bold text-xs italic">
                    {searchEmployeeQuery ? 'Nama tidak ditemukan.' : 'Tidak ada karyawan yang izin/cuti hari ini.'}
                  </div>
                ) : (
                  filteredCutiList.map((l) => {
                    const photoUrl = getFullPhotoUrl(l.employee?.photo)
                    return (
                      <div key={l.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-50 hover:bg-slate-50/50 transition-colors duration-150 animate-fade-in">
                        <div className="flex items-center gap-3 min-w-0">
                          {photoUrl ? (
                            <img src={photoUrl} alt="Foto" className="w-10 h-10 rounded-full border border-slate-100 object-cover shrink-0 shadow-inner" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 border border-slate-100 flex items-center justify-center text-white font-extrabold text-xs shadow-inner shrink-0 select-none">
                              {l.employee?.name ? l.employee.name.charAt(0).toUpperCase() : '?'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-black text-slate-800 truncate">{l.employee?.name || 'Karyawan'}</h4>
                              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-500 rounded text-[8px] font-bold uppercase font-mono tracking-wider shrink-0">
                                {l.employee?.division || 'Umum'}
                              </span>
                            </div>
                            <p className="text-[9px] text-slate-400 font-medium truncate mt-0.5">
                              Alasan: <strong className="text-slate-600 font-bold">{l.reason}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black font-mono tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                            {l.leave_type ? l.leave_type.toUpperCase() : 'CUTI'}
                          </span>
                          <span className="block text-[8px] text-slate-400 font-semibold font-mono mt-1 select-none">
                            {l.start_date.substring(5)} s/d {l.end_date.substring(5)}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )
              ) : (
                filteredAbsentList.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 font-bold text-xs italic">
                    {searchEmployeeQuery ? 'Nama tidak ditemukan.' : 'Seluruh staf telah melakukan absensi masuk.'}
                  </div>
                ) : (
                  filteredAbsentList.map((emp) => {
                    const photoUrl = getFullPhotoUrl(emp.photo)
                    const mailSubject = encodeURIComponent("Pemberitahuan Absensi Hari Ini - " + todayStr)
                    const mailBody = encodeURIComponent(`Halo ${emp.name},\n\nKami mendeteksi Anda belum melakukan absensi masuk (check-in) pada hari ini tanggal ${getIndonesianDate(new Date())} di aplikasi E-Absensi Karyawan.\n\nMohon lakukan absensi masuk segera atau hubungi pihak HR/Admin jika ada kendala atau jika Anda berhalangan hadir.\n\nTerima kasih,\nTim HR / Admin`)
                    return (
                      <div key={emp.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-50 hover:bg-slate-50/50 transition-colors duration-150 animate-fade-in">
                        <div className="flex items-center gap-3">
                          {photoUrl ? (
                            <img src={photoUrl} alt="Foto" className="w-10 h-10 rounded-full border border-slate-100 object-cover shrink-0 shadow-inner" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-300 to-slate-500 border border-slate-100 flex items-center justify-center text-white font-extrabold text-xs shadow-inner shrink-0 select-none">
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h4 className="text-xs font-black text-slate-800">{emp.name}</h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono mt-0.5">
                              {emp.division || 'Umum'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black font-mono tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                            BELUM PRESENSI
                          </span>
                          <a
                            href={`mailto:${emp.email}?subject=${mailSubject}&body=${mailBody}`}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Kirim Email Pengingat"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    )
                  })
                )
              )}
            </div>
          </div>
        </section>

        {/* Right Column: Admin Self Presence & Radius Widget (5 Columns) - Appears first on mobile */}
        <section className="lg:col-span-5 order-1 lg:order-2 space-y-6">
          
          {/* Admin Self Check-In Circular Dial */}
          <div className="relative bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex flex-col items-center text-center space-y-5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-orange-50 pb-1.5 w-full select-none">Presensi Mandiri Admin HR</span>
              
              {/* Circular Clock Dial */}
              <div className="relative flex-shrink-0 flex items-center justify-center select-none">
                <svg className="w-36 h-36 transform -rotate-90">
                  <circle cx="72" cy="72" r="56" className="stroke-slate-50" strokeWidth="6" fill="transparent" />
                  <circle
                    cx="72"
                    cy="72"
                    r="56"
                    className="stroke-[url(#adminGrad)] transition-all duration-1000 ease-out"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 56}
                    strokeDashoffset={2 * Math.PI * 56 - (seconds / 60) * (2 * Math.PI * 56)}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                  <defs>
                    <linearGradient id="adminGrad" x1="1" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#dc2626" />
                      <stop offset="100%" stopColor="#ea580c" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-slate-800 font-mono tracking-tight">
                    {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider font-mono">WIB</span>
                </div>
              </div>

              {/* Status details */}
              <div className="w-full bg-slate-50/50 rounded-2xl p-4 border border-slate-100 space-y-2 text-left text-xs font-semibold text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400">Status Absen:</span>
                  <span className={`px-2 py-0.2 rounded-md text-[9px] font-black font-mono tracking-wider ${todayAttendance?.clock_in ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {todayAttendance?.clock_in ? 'HADIR' : 'BELUM HADIR'}
                  </span>
                </div>
                {todayAttendance?.clock_in && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Jam Masuk:</span>
                    <span className="font-mono text-emerald-600 font-bold">{todayAttendance.clock_in}</span>
                  </div>
                )}
                {todayAttendance?.clock_out && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Jam Keluar:</span>
                    <span className="font-mono text-orange-600 font-bold">{todayAttendance.clock_out}</span>
                  </div>
                )}
              </div>

              {/* Checkin button */}
              <div className="w-full">
                {todayAttendance?.clock_in && todayAttendance?.clock_out ? (
                  <div className="w-full text-center py-2.5 bg-emerald-50 border border-emerald-250 text-emerald-700 text-xs font-extrabold rounded-2xl shadow-xs flex items-center justify-center gap-1.5 select-none">
                    <CheckCircle className="w-4 h-4 text-emerald-600 animate-pulse" /> Presensi Hari Ini Lengkap
                  </div>
                ) : todayAttendance?.clock_in ? (
                  <button
                    onClick={() => handleOpenCheckInModal('check-out')}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-extrabold rounded-2xl transition-all shadow-md shadow-red-500/10 cursor-pointer text-xs uppercase tracking-wider hover:scale-102 active:scale-98"
                  >
                    Check-Out Mandiri
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenCheckInModal('check-in')}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-extrabold rounded-2xl transition-all shadow-md shadow-red-500/10 cursor-pointer text-xs uppercase tracking-wider hover:scale-102 active:scale-98"
                  >
                    Check-In Mandiri
                  </button>
                )}
              </div>

            </div>
          </div>

        </section>

      </div>

      {/* 5. WEBCAM CAMERA MODAL */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white border border-slate-100 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-scale-up max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-800 capitalize">
                  Formulir Presensi Mandiri Admin: {modalType === 'check-in' ? 'Masuk' : 'Keluar'}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Webcam & Geolocation</p>
              </div>
              <button 
                onClick={handleCloseCheckInModal}
                className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 rounded-lg hover:border-rose-100 transition-all cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Camera Section */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    1. Foto Wajah Webcam
                  </label>
                  
                  <div className="relative aspect-video w-full rounded-2xl bg-slate-50 border border-slate-200/60 overflow-hidden flex items-center justify-center shadow-inner">
                    {capturedPhoto ? (
                      <img src={capturedPhoto} alt="Captured Profile" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform -scale-x-100' : ''}`}
                        />
                        {/* Flip Camera Button */}
                        {!cameraError && (
                          <button
                            type="button"
                            onClick={flipCamera}
                            title={facingMode === 'user' ? 'Ganti ke Kamera Belakang' : 'Ganti ke Kamera Depan'}
                            className="absolute top-2 right-2 z-10 p-2 bg-black/40 hover:bg-black/60 text-white rounded-xl transition-all cursor-pointer backdrop-blur-sm"
                          >
                            <FlipHorizontal2 className="w-4 h-4" />
                          </button>
                        )}
                        {cameraError && (
                          <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-4 text-center text-rose-600 gap-2">
                            <AlertCircle className="w-7 h-7 text-rose-500" />
                            <p className="text-xs font-bold leading-relaxed">{cameraError}</p>
                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm">
                              <Upload className="w-3.5 h-3.5" /> Pilih File
                              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </label>
                          </div>
                        )}
                      </>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>

                  <div className="flex justify-center pt-1">
                    {capturedPhoto ? (
                      <button
                        onClick={retakePhoto}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Foto Ulang
                      </button>
                    ) : (
                      <button
                        onClick={capturePhoto}
                        disabled={!!cameraError}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-red-500/15 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Camera className="w-4 h-4" /> Ambil Foto Wajah
                      </button>
                    )}
                  </div>
                </div>

                {/* Geolocation Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      2. Koordinat Lokasi GPS
                    </label>
                    <button 
                      onClick={fetchLocation} 
                      disabled={gpsLoading}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 hover:text-red-700 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-400 font-bold">Latitude:</span>
                      <span className="text-slate-700 font-bold">{latitude?.toFixed(6) || 'Locking...'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-400 font-bold">Longitude:</span>
                      <span className="text-slate-700 font-bold">{longitude?.toFixed(6) || 'Locking...'}</span>
                    </div>

                    {gpsLoading && (
                      <div className="text-[11px] text-slate-400 font-bold flex items-center justify-center gap-1.5 py-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                        Mendeteksi lokasi satelit...
                      </div>
                    )}

                    {gpsError && (
                      <div className="text-[11px] text-rose-600 font-bold flex items-center gap-1.5 py-1">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        {gpsError}
                      </div>
                    )}

                    {latitude && longitude && officeSetting && currentDistance !== null && (
                      modalType === 'check-in' && activeTab === 'kantor' ? (
                        <div className={`p-2.5 rounded-xl border text-[11px] font-bold leading-relaxed flex items-start gap-1.5 ${isWithinRadius ? 'text-emerald-700 bg-emerald-50 border-emerald-250' : 'text-rose-700 bg-rose-50 border-rose-250'}`}>
                          {isWithinRadius ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>Di dalam radius kantor (Jarak: {Math.round(currentDistance)}m, Radius: {officeSetting.radius}m).</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                              <span>Di luar radius batas kantor (Jarak: {Math.round(currentDistance)}m, Batas: {officeSetting.radius}m). Absen ditolak.</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl border text-[11px] font-bold leading-relaxed text-emerald-700 bg-emerald-50 border-emerald-250 flex items-start gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>Koordinat aman untuk tipe {activeTab === 'kunjungan' ? 'Dinas Luar' : 'Visit Klien'}. Radius bebas.</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Tipe Presensi (check-in only) */}
              {modalType === 'check-in' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    3. Kategori Tipe Presensi
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'kantor', label: 'Kantor Utama', icon: Building, desc: 'Radius GPS dihitung' },
                      { id: 'kunjungan', label: 'Dinas Luar', icon: Compass, desc: 'Bebas radius kantor' },
                      { id: 'client', label: 'Ke Klien', icon: UserCheck, desc: 'Bebas radius kantor' }
                    ].map((tab) => {
                      const Icon = tab.icon
                      const active = activeTab === tab.id
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            active 
                              ? 'border-orange-500 bg-orange-50/10 shadow-xs' 
                              : 'border-slate-200 hover:border-orange-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${active ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="block text-xs font-bold text-slate-800">{tab.label}</span>
                              <span className="text-[9px] text-slate-400 font-bold">{tab.desc}</span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Keterangan Catatan
                </label>
                <textarea
                  placeholder="Tambahkan pesan keterangan absen (opsional)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200/80 focus:border-red-500 text-slate-800 placeholder-slate-400 rounded-2xl py-2 px-4 outline-none transition-all text-xs resize-none font-semibold"
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={handleCloseCheckInModal}
                className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !capturedPhoto || !latitude || !longitude || (modalType === 'check-in' && activeTab === 'kantor' && officeSetting !== null && !isWithinRadius)}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-red-500/10 flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengirim...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" /> Kirim Absensi
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
