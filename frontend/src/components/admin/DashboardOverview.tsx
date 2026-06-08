import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
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
  UserCheck
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

interface DashboardOverviewProps {
  loading: boolean
  attendanceLoading: boolean
  employeesCount: number
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
  allAttendances: Attendance[]
}

export default function DashboardOverview({
  loading,
  attendanceLoading,
  employeesCount,
  presentTodayCount,
  presentTodayList,
  todayStr,
  user,
  token,
  time,
  officeSetting,
  todayAttendance,
  fetchTodayAttendance,
  leaves,
  allAttendances
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

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Live seconds for the clock circular progress
  const seconds = time.getSeconds()
  const circumference = 2 * Math.PI * 70 // radius 70 = 439.8px
  const strokeDashoffset = circumference - (seconds / 60) * circumference

  // Calculate statistics
  const lateTodayCount = allAttendances.filter(
    (att) => att.date === todayStr && att.status_in === 'late'
  ).length

  const cutiTodayCount = leaves.filter(
    (l) => l.status === 'approved' && todayStr >= l.start_date && todayStr <= l.end_date
  ).length

  const presencePercentage = employeesCount > 0 
    ? Math.round((presentTodayCount / employeesCount) * 100)
    : 0

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
  const startCamera = async () => {
    setCameraError(null)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error(err)
      setCameraError('Gagal mengakses kamera. Mohon berikan izin kamera.')
    }
  }

  // Stop Camera Stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  // Bind video stream
  useEffect(() => {
    if (showCheckInModal && videoRef.current && stream && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream
    }
  }, [showCheckInModal, stream])

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
    if (!status) return 'bg-slate-100 text-slate-700'
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
      
      {/* 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (Check-In Widget & 2x2 Stats) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Circular Check-In Card */}
          <section className="relative bg-white border border-slate-100/80 rounded-[32px] p-8 shadow-sm flex flex-col md:flex-row items-center gap-8 overflow-hidden hover:shadow-md transition-all duration-300">
            {/* Soft decorative light gradient glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            {/* SVG dial & live clock on the left */}
            <div className="relative flex-shrink-0 flex items-center justify-center">
              <svg className="w-44 h-44 transform -rotate-90">
                <circle
                  cx="88"
                  cy="88"
                  r="70"
                  className="stroke-slate-100"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="88"
                  cy="88"
                  r="70"
                  className="stroke-[url(#orangeRedGradient)] transition-all duration-1000 ease-out"
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
                <defs>
                  <linearGradient id="orangeRedGradient" x1="1" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#dc2626" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                </defs>
              </svg>
              
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black text-slate-800 tracking-tight font-mono">
                  {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  WIB
                </span>
              </div>
            </div>

            {/* Check-In Details and Action Button on the right */}
            <div className="flex-grow flex flex-col justify-between items-center md:items-start text-center md:text-left space-y-4">
              <div>
                <span className="text-[10px] font-black tracking-widest text-orange-600 uppercase">
                  {getGreeting()}, {user.name.split(' ')[0]}!
                </span>
                <h2 className="text-xl font-black text-slate-800 mt-0.5">
                  {todayAttendance?.clock_in ? 'CHECK-IN BERHASIL' : 'BELUM PRESENSI'}
                </h2>
                <p className="text-xs text-slate-500 font-bold flex items-center justify-center md:justify-start gap-1.5 mt-1 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-slate-450" />
                  {getIndonesianDate(time)}
                </p>
              </div>

              {/* Status and Location Details */}
              <div className="text-xs text-slate-600 font-semibold space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-bold">Waktu Sekarang:</span>
                  <span className="font-mono font-bold text-slate-700">
                    {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-bold">Tipe Lokasi:</span>
                  <span className="font-bold text-slate-700 capitalize">
                    {todayAttendance?.attendance_type || 'Kantor Pusat'}
                  </span>
                </div>
                {todayAttendance?.clock_in && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-bold">Jam Masuk:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {todayAttendance.clock_in}
                    </span>
                  </div>
                )}
              </div>

              {/* Functional check-in button */}
              <div className="pt-2 w-full">
                {todayAttendance?.clock_in && todayAttendance?.clock_out ? (
                  <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-xs rounded-xl shadow-xs">
                    <Check className="w-4 h-4" /> Presensi Hari Ini Selesai
                  </div>
                ) : todayAttendance?.clock_in ? (
                  <button
                    onClick={() => handleOpenCheckInModal('check-out')}
                    className="px-6 py-3 bg-gradient-to-r from-red-650 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-extrabold rounded-2xl transition-all shadow-md shadow-red-500/20 cursor-pointer text-xs uppercase tracking-wider hover:scale-103 active:scale-98"
                  >
                    Check-Out Sekarang
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenCheckInModal('check-in')}
                    className="px-6 py-3 bg-gradient-to-r from-red-650 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-extrabold rounded-2xl transition-all shadow-md shadow-red-500/20 cursor-pointer text-xs uppercase tracking-wider hover:scale-103 active:scale-98"
                  >
                    Check-In Sekarang
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* 2x2 Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Stat 1: Total Karyawan */}
            <div className="relative bg-white border border-slate-100/80 rounded-[28px] p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Karyawan</p>
                  <h3 className="text-3xl font-black text-slate-800 mt-2 font-mono">
                    {loading ? (
                      <Loader2 className="w-7 h-7 animate-spin text-slate-350 mt-1" />
                    ) : (
                      employeesCount
                    )}
                  </h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Stat 2: Hadir Hari Ini */}
            <div className="relative bg-white border border-slate-100/80 rounded-[28px] p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Hadir Hari Ini</p>
                  <h3 className="text-3xl font-black text-slate-800 mt-2 font-mono flex items-baseline gap-2">
                    {attendanceLoading ? (
                      <Loader2 className="w-7 h-7 animate-spin text-slate-350 mt-1" />
                    ) : (
                      <>
                        {presentTodayCount}
                        <span className="text-xs font-bold text-slate-400 font-quicksand">({presencePercentage}%)</span>
                      </>
                    )}
                  </h3>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
              
              {/* Progress bar matching layout */}
              <div className="mt-4 w-full">
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-1000"
                    style={{ width: `${presencePercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Stat 3: Terlambat */}
            <div className="relative bg-white border border-slate-100/80 rounded-[28px] p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Terlambat</p>
                  <h3 className="text-3xl font-black text-slate-800 mt-2 font-mono">
                    {attendanceLoading ? (
                      <Loader2 className="w-7 h-7 animate-spin text-slate-350 mt-1" />
                    ) : (
                      lateTodayCount
                    )}
                  </h3>
                </div>
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Stat 4: Izin/Cuti */}
            <div className="relative bg-white border border-slate-100/80 rounded-[28px] p-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Izin / Cuti</p>
                  <h3 className="text-3xl font-black text-slate-800 mt-2 font-mono">
                    {loading ? (
                      <Loader2 className="w-7 h-7 animate-spin text-slate-350 mt-1" />
                    ) : (
                      cutiTodayCount
                    )}
                  </h3>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                  <FileText className="w-6 h-6" />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column (Recent Attendance Logs) */}
        <section className="lg:col-span-5 bg-white border border-slate-100/80 rounded-[32px] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 min-h-[480px]">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">
                  Log Kehadiran Terbaru
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Realtime Attendance
                </p>
              </div>
              <button className="text-slate-400 hover:text-red-500 font-bold text-lg p-1.5 transition-colors cursor-pointer leading-none">
                •••
              </button>
            </div>

            {/* Attendance list container */}
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {attendanceLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-450 font-bold text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                  Memuat log kehadiran...
                </div>
              ) : presentTodayList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-bold text-xs italic">
                  Belum ada karyawan yang presensi hari ini.
                </div>
              ) : (
                presentTodayList.slice(0, 8).map((att) => {
                  const userPhoto = att.user.photo
                  const photoUrl = userPhoto
                    ? (userPhoto.startsWith('http') ? userPhoto : `http://localhost:8000/storage/${userPhoto}`)
                    : null
                  const gradients = [
                    'from-orange-400 to-red-500',
                    'from-amber-400 to-orange-500',
                    'from-rose-400 to-red-650',
                    'from-red-400 to-orange-600'
                  ]
                  const gradientClass = gradients[att.user.id % gradients.length]

                  return (
                    <div key={att.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-50 hover:bg-slate-50/50 transition-colors duration-200">
                      <div className="flex items-center gap-3">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={att.user.name}
                            className="w-10 h-10 rounded-full border border-slate-100 object-cover shadow-inner shrink-0"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full border border-slate-100 bg-gradient-to-tr ${gradientClass} flex items-center justify-center text-white font-extrabold text-sm shadow-inner shrink-0`}>
                            {att.user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-black text-slate-800">{att.user.name}</h4>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {att.clock_in ? att.clock_in.substring(0, 5) + ' WIB' : '-'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black font-mono tracking-wider ${getBadgeStyle(att.status_in)}`}>
                          {getStatusText(att.status_in)}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold capitalize">
                          {att.attendance_type === 'kantor' ? 'Kantor Pusat' : att.attendance_type === 'client' ? 'Client' : 'Dinas Lapangan'}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </section>

      </div>

      {/* Check-In / Check-Out Video Camera Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white border border-slate-100 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-base font-black text-slate-800 capitalize">
                  Formulir Presensi: {modalType === 'check-in' ? 'Masuk' : 'Keluar'}
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
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Camera Section */}
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
                          className="w-full h-full object-cover transform -scale-x-100"
                        />
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-350 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Foto Ulang
                      </button>
                    ) : (
                      <button
                        onClick={capturePhoto}
                        disabled={!!cameraError}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-650 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-red-500/15 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Camera className="w-4 h-4" /> Ambil Foto Wajah
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Geolocation Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      2. Sinyal Koordinat GPS
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
                          <span>Koordinat aman untuk tipe {activeTab === 'kunjungan' ? 'Kunjungan Kerja' : 'Kunjungan Klien'}. Radius bebas.</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Tipe Presensi (check-in only) */}
              {modalType === 'check-in' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    3. Kategori Tipe Presensi
                  </label>
                  
                  <div className="grid grid-cols-3 gap-3">
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
                              <span className="text-[9px] text-slate-450 font-bold">{tab.desc}</span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 4. Notes */}
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
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
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
                className="px-5 py-2.5 bg-gradient-to-r from-red-650 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-red-500/10 flex items-center gap-1.5"
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
