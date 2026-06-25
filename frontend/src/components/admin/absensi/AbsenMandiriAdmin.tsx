import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import L from 'leaflet'
import { 
  Camera, 
  RefreshCw, 
  AlertCircle, 
  Check, 
  Upload, 
  X, 
  AlertTriangle, 
  Building, 
  Compass, 
  UserCheck, 
  FlipHorizontal2, 
  CheckCircle, 
  Loader2, 
  CalendarCheck2,
  Navigation,
  CheckCircle2
} from 'lucide-react'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'employee'
  photo?: string | null
}

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
}

interface OfficeSetting {
  latitude: string
  longitude: string
  radius: number
}

interface AbsenMandiriAdminProps {
  token: string
  user: User
}

export default function AbsenMandiriAdmin({ token, user }: AbsenMandiriAdminProps) {
  // Time state
  const [time, setTime] = useState(new Date())
  
  // Core data states
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null)
  const [officeSetting, setOfficeSetting] = useState<OfficeSetting | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  // Camera & GPS active states
  const [isConsoleActive, setIsConsoleActive] = useState(false)
  const [modalType, setModalType] = useState<'check-in' | 'check-out'>('check-in')
  const [activeTab, setActiveTab] = useState<'kantor' | 'kunjungan' | 'client'>('kantor')
  const [submitting, setSubmitting] = useState(false)

  // Camera & GPS values
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

  // Map elements
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const officeMarkerRef = useRef<L.Marker | null>(null)
  const userMarkerRef = useRef<L.Marker | null>(null)
  const radiusCircleRef = useRef<L.Circle | null>(null)

  // Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Load initial data
  const fetchData = async () => {
    setLoadingData(true)
    try {
      const [attRes, officeRes] = await Promise.all([
        axios.get('http://localhost:8000/api/attendance/today', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:8000/api/office-setting', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      
      if (attRes.data.status === 'success') {
        setTodayAttendance(attRes.data.data)
      }
      
      if (officeRes.data.status === 'success' && officeRes.data.data) {
        setOfficeSetting(officeRes.data.data)
      }
    } catch (err) {
      console.error('Gagal memuat data awal absensi mandiri:', err)
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [token])

  // Map Initialization & Updates
  useEffect(() => {
    if (!isConsoleActive || !mapContainerRef.current || !latitude || !longitude) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        officeMarkerRef.current = null
        userMarkerRef.current = null
        radiusCircleRef.current = null
      }
      return
    }

    // Fix marker icons in Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })

    const userLoc: L.LatLngExpression = [latitude, longitude]

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView(userLoc, 16)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map)
      mapInstanceRef.current = map
    } else {
      mapInstanceRef.current.setView(userLoc, 16)
    }

    const map = mapInstanceRef.current

    // Clear old layers
    if (officeMarkerRef.current) map.removeLayer(officeMarkerRef.current)
    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current)
    if (radiusCircleRef.current) map.removeLayer(radiusCircleRef.current)

    // User marker
    const userMarkerColorIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34]
    })

    userMarkerRef.current = L.marker(userLoc, { icon: userMarkerColorIcon })
      .addTo(map)
      .bindPopup('Lokasi Anda')
      .openPopup()

    // Office marker & circle
    if (officeSetting) {
      const officeLat = parseFloat(officeSetting.latitude)
      const officeLng = parseFloat(officeSetting.longitude)
      const officeLoc: L.LatLngExpression = [officeLat, officeLng]

      const officeMarkerColorIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
      })

      officeMarkerRef.current = L.marker(officeLoc, { icon: officeMarkerColorIcon })
        .addTo(map)
        .bindPopup('Lokasi Kantor')

      // Draw Radius Circle
      const isKantor = modalType === 'check-in' ? activeTab === 'kantor' : todayAttendance?.attendance_type === 'kantor'
      const circleColor = (isKantor && isWithinRadius) || !isKantor ? '#10b981' : '#ef4444'

      radiusCircleRef.current = L.circle(officeLoc, {
        color: circleColor,
        fillColor: circleColor,
        fillOpacity: 0.15,
        radius: officeSetting.radius
      }).addTo(map)

      // Fit bounds to show both user and office location
      const bounds = L.latLngBounds([userLoc, officeLoc])
      map.fitBounds(bounds, { padding: [40, 40] })
    }

  }, [isConsoleActive, latitude, longitude, officeSetting, activeTab, modalType])

  // GPS Location Handler
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
        setGpsError('Gagal mendeteksi lokasi. Harap berikan izin GPS pada browser.')
        setGpsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Camera Management
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
      setCameraError('Gagal mengakses kamera. Mohon berikan izin kamera pada browser.')
    }
  }

  const flipCamera = async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newMode)
    await startCamera(newMode)
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setStream(null)
  }

  // Bind video element to camera stream
  useEffect(() => {
    if (isConsoleActive && videoRef.current && stream && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream
    }
  }, [isConsoleActive, stream])

  // Cleanup camera on unmount
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

  // Open Console (check-in / check-out page form)
  const openConsole = (type: 'check-in' | 'check-out') => {
    setModalType(type)
    setCapturedPhoto(null)
    setNotes('')
    setCameraError(null)
    setGpsError(null)
    setIsConsoleActive(true)
    fetchLocation()
    startCamera()
  }

  // Close Console
  const closeConsole = () => {
    stopCamera()
    setIsConsoleActive(false)
  }

  // Distance calculator helper
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

  // Form Submit Handler
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
          timer: 2000,
          showConfirmButton: false,
          background: '#ffffff',
        })
        closeConsole()
        await fetchData()
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal memproses absensi.'
      Swal.fire({ title: 'Gagal', text: msg, icon: 'error', confirmButtonColor: '#dc2626' })
    } finally {
      setSubmitting(false)
    }
  }

  // Format Helper
  const getIndonesianDate = (d: Date) => {
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getAttendanceTypeLabel = (type: string | null | undefined) => {
    if (!type) return '-'
    const map: Record<string, string> = {
      kantor: 'Kantor Utama',
      kunjungan: 'Dinas Luar',
      client: 'Ke Klien'
    }
    return map[type] || type
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) return '-'
    const textMap: Record<string, string> = {
      early: 'Datang Cepat',
      normal: 'On Time',
      late: 'Terlambat',
      early_departure: 'Pulang Cepat',
      overtime: 'Lembur'
    }
    const colorMap: Record<string, string> = {
      early: 'text-amber-700 bg-amber-50 border-amber-200',
      normal: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      late: 'text-rose-700 bg-rose-50 border-rose-200',
      early_departure: 'text-rose-700 bg-rose-50 border-rose-200',
      overtime: 'text-amber-700 bg-amber-50 border-amber-200'
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${colorMap[status] || 'text-slate-650 bg-slate-50 border-slate-200'}`}>
        {textMap[status] || status}
      </span>
    )
  }

  if (loadingData) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-orange-500" />
        <span className="text-sm font-bold text-slate-500 font-quicksand">Memuat data absensi...</span>
      </div>
    )
  }

  // Circular clock metrics
  const seconds = time.getSeconds()

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-quicksand">
      
      {/* 1. Header Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-500 to-orange-600 rounded-[32px] p-6 text-white shadow-lg shadow-red-500/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-white/80 text-[10px] font-black uppercase tracking-widest bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 select-none">
              Akses Absensi
            </span>
            <h1 className="text-2xl font-black mt-2 leading-tight">
              Presensi Admin HR
            </h1>
            <p className="text-xs text-orange-50 font-medium mt-1">
              Halaman khusus untuk melakukan absensi harian (absen masuk / absen keluar) menggunakan verifikasi kamera webcam & GPS.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex items-center gap-3">
            <CalendarCheck2 className="w-5 h-5 text-orange-100" />
            <div className="text-right">
              <span className="block text-[10px] text-white/70 font-bold uppercase tracking-wider">Tanggal Hari Ini</span>
              <span className="text-xs font-black">{getIndonesianDate(new Date())}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Digital Clock Dial & Today Summary Card (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Circular Clock Card */}
          <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm flex flex-col items-center text-center space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-full blur-xl pointer-events-none"></div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1.5 w-full select-none">Waktu Server</span>
            
            {/* Interactive Clock Circle */}
            <div className="relative flex-shrink-0 flex items-center justify-center select-none">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle cx="80" cy="80" r="64" className="stroke-slate-100/60" strokeWidth="6" fill="transparent" />
                <circle
                  cx="80"
                  cy="80"
                  r="64"
                  className="stroke-[url(#absenGrad)] transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 64}
                  strokeDashoffset={2 * Math.PI * 64 - (seconds / 60) * (2 * Math.PI * 64)}
                  strokeLinecap="round"
                  fill="transparent"
                />
                <defs>
                  <linearGradient id="absenGrad" x1="1" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#dc2626" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800 font-mono tracking-tight leading-none">
                  {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[10px] text-slate-500 font-extrabold font-mono mt-1">
                  {time.toLocaleTimeString('id-ID', { second: '2-digit' })} WIB
                </span>
              </div>
            </div>
            
            <div className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-xs font-semibold space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100/80 pb-2">
                <span className="text-slate-450 font-bold">Status Presensi Hari Ini</span>
                <span className={`inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full text-[9px] font-black font-mono tracking-wider border ${
                  todayAttendance?.clock_in && todayAttendance?.clock_out 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : todayAttendance?.clock_in 
                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                      : 'bg-rose-50 text-rose-700 border-rose-100'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    todayAttendance?.clock_in && todayAttendance?.clock_out 
                      ? 'bg-emerald-500' 
                      : todayAttendance?.clock_in 
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-rose-500 animate-pulse'
                  }`}></span>
                  {todayAttendance?.clock_in && todayAttendance?.clock_out 
                    ? 'LENGKAP' 
                    : todayAttendance?.clock_in 
                      ? 'SUDAH ABSEN MASUK' 
                      : 'BELUM ABSEN'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-xs">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Absen Masuk</span>
                  <span className="font-mono text-sm font-black text-slate-800 block mt-0.5">
                    {todayAttendance?.clock_in || '--:--'}
                  </span>
                  {todayAttendance?.status_in && (
                    <div className="mt-1">{getStatusBadge(todayAttendance.status_in)}</div>
                  )}
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-xs">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Absen Keluar</span>
                  <span className="font-mono text-sm font-black text-slate-800 block mt-0.5">
                    {todayAttendance?.clock_out || '--:--'}
                  </span>
                  {todayAttendance?.status_out && (
                    <div className="mt-1">{getStatusBadge(todayAttendance.status_out)}</div>
                  )}
                </div>
              </div>

              {todayAttendance?.attendance_type && (
                <div className="flex justify-between items-center pt-1 border-t border-slate-100/60">
                  <span className="text-slate-400 text-[10px] font-bold">Kategori Kunjungan:</span>
                  <span className="font-bold text-slate-800 text-[11px] bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                    {getAttendanceTypeLabel(todayAttendance.attendance_type)}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Action buttons */}
            {!isConsoleActive && (
              <div className="w-full">
                {todayAttendance?.clock_in && todayAttendance?.clock_out ? (
                  <div className="w-full py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black rounded-2xl shadow-xs flex items-center justify-center gap-1.5 select-none">
                    <CheckCircle className="w-4 h-4 text-emerald-600 animate-bounce" /> Presensi Hari Ini Selesai
                  </div>
                ) : todayAttendance?.clock_in ? (
                  <button
                    onClick={() => openConsole('check-out')}
                    className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-black rounded-2xl transition-all shadow-md shadow-red-500/10 cursor-pointer text-xs uppercase tracking-widest hover:scale-102 active:scale-98"
                  >
                    Absen Keluar Sekarang
                  </button>
                ) : (
                  <button
                    onClick={() => openConsole('check-in')}
                    className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-black rounded-2xl transition-all shadow-md shadow-red-500/10 cursor-pointer text-xs uppercase tracking-widest hover:scale-102 active:scale-98"
                  >
                    Absen Masuk Sekarang
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Profile Card */}
          <div className="bg-white border border-slate-100 rounded-[32px] p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-orange-500/10 shrink-0">
                {user.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm font-quicksand leading-tight">{user.name}</h4>
                <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider mt-0.5">{user.role} HR Portal</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{user.email}</p>
              </div>
            </div>
            
            <div className="border-t border-slate-50 pt-3 flex justify-between text-center gap-2">
              <div className="flex-1 p-2 bg-slate-50/50 rounded-2xl border border-slate-100">
                <span className="text-[9px] text-slate-400 font-bold block">Office Radius</span>
                <span className="font-black text-xs text-slate-800">{officeSetting?.radius || 0} meters</span>
              </div>
              <div className="flex-1 p-2 bg-slate-50/50 rounded-2xl border border-slate-100">
                <span className="text-[9px] text-slate-400 font-bold block">Status Akun</span>
                <span className="font-black text-xs text-emerald-600 inline-flex items-center gap-0.5 justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Console Area (8 columns) */}
        <div className="lg:col-span-8">
          
          {!isConsoleActive ? (
            /* Welcome / Idle State */
            <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm text-center space-y-6 relative overflow-hidden min-h-[400px] flex flex-col justify-center items-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-500/5 to-transparent pointer-events-none"></div>
              
              <div className="w-20 h-20 rounded-[28px] bg-gradient-to-tr from-orange-500/10 to-red-500/10 border border-orange-100 flex items-center justify-center text-orange-600 shadow-sm relative">
                <UserCheck className="w-10 h-10 animate-pulse" />
              </div>
              
              <div className="max-w-md space-y-2">
                <h2 className="text-lg font-black text-slate-800">
                  Konsol Presensi Siap Digunakan
                </h2>
                <p className="text-xs text-slate-550 leading-relaxed font-semibold">
                  {todayAttendance?.clock_in && todayAttendance?.clock_out 
                    ? 'Anda telah merekam data absensi masuk dan keluar hari ini. Tidak ada tindakan lebih lanjut yang diperlukan.'
                    : 'Gunakan panel ini untuk mengunci absensi masuk (clock-in) sebelum memulai kerja, atau absensi keluar (clock-out) di akhir hari kerja.'}
                </p>
              </div>

              {!todayAttendance?.clock_out && (
                <button
                  onClick={() => openConsole(todayAttendance?.clock_in ? 'check-out' : 'check-in')}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-black rounded-2xl transition-all shadow-md shadow-red-500/15 cursor-pointer text-xs uppercase tracking-wider flex items-center gap-2"
                >
                  <Navigation className="w-4 h-4" /> Buka Formulir Absen
                </button>
              )}
            </div>
          ) : (
            /* Active Checkin/Checkout Console */
            <div className="bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden flex flex-col animate-fade-in">
              
              {/* Console Header */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    Formulir Presensi: <span className="text-orange-600 capitalize">{modalType === 'check-in' ? 'Absen Masuk' : 'Absen Keluar'}</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Verifikasi Biometrik & GPS Koordinat</p>
                </div>
                <button 
                  onClick={closeConsole}
                  className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 rounded-xl hover:border-rose-100 transition-all cursor-pointer"
                  title="Tutup Formulir"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Console Body */}
              <div className="p-6 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Left component: Camera preview (md:col-span-6) */}
                  <div className="md:col-span-6 space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      1. Kamera Webcam
                    </label>
                    
                    <div className="relative aspect-video w-full rounded-2xl bg-slate-50 border border-slate-250/60 overflow-hidden flex items-center justify-center shadow-inner group">
                      {capturedPhoto ? (
                        <img src={capturedPhoto} alt="Captured Profile" className="w-full h-full object-cover animate-scale-up" />
                      ) : (
                        <>
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform -scale-x-100' : ''}`}
                          />
                          {!cameraError && (
                            <button
                              type="button"
                              onClick={flipCamera}
                              title={facingMode === 'user' ? 'Ganti ke Kamera Belakang' : 'Ganti ke Kamera Depan'}
                              className="absolute top-2.5 right-2.5 z-10 p-2 bg-black/40 hover:bg-black/60 text-white rounded-xl transition-all cursor-pointer backdrop-blur-md opacity-0 group-hover:opacity-100"
                            >
                              <FlipHorizontal2 className="w-4 h-4" />
                            </button>
                          )}
                          
                          {cameraError && (
                            <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-4 text-center text-rose-600 gap-2">
                              <AlertCircle className="w-7 h-7 text-rose-500" />
                              <p className="text-xs font-black leading-relaxed">{cameraError}</p>
                              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm">
                                <Upload className="w-3.5 h-3.5" /> Unggah Foto Manual
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                              </label>
                            </div>
                          )}
                        </>
                      )}
                      <canvas ref={canvasRef} className="hidden" />
                    </div>

                    <div className="flex justify-center">
                      {capturedPhoto ? (
                        <button
                          onClick={retakePhoto}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 hover:border-slate-350 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Ambil Ulang Foto
                        </button>
                      ) : (
                        <button
                          onClick={capturePhoto}
                          disabled={!!cameraError}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-red-500/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Camera className="w-4 h-4" /> Capture Wajah
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right component: Map & Location details (md:col-span-6) */}
                  <div className="md:col-span-6 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        2. Peta Geolocation GPS
                      </label>
                      <button 
                        onClick={fetchLocation} 
                        disabled={gpsLoading}
                        className="inline-flex items-center gap-1 text-[10px] font-extrabold text-red-600 hover:text-red-700 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} /> Refresh GPS
                      </button>
                    </div>

                    {/* Leaflet map container */}
                    <div className="w-full h-[180px] rounded-2xl overflow-hidden border border-slate-200/80 shadow-inner bg-slate-100 relative z-10">
                      <div ref={mapContainerRef} className="w-full h-full" />
                      {gpsLoading && (
                        <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center p-4 text-center text-slate-650 z-20 gap-1.5">
                          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                          <span className="text-[10px] font-bold">Mencari koordinat satelit...</span>
                        </div>
                      )}
                    </div>

                    {/* Coordinates details & verification status */}
                    <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3.5 space-y-2 text-xs font-semibold">
                      <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                        <div>
                          <span className="text-slate-400 text-[9px] block">Latitude</span>
                          <span className="font-mono text-slate-800 font-bold">{latitude?.toFixed(6) || 'Mencari...'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[9px] block">Longitude</span>
                          <span className="font-mono text-slate-800 font-bold">{longitude?.toFixed(6) || 'Mencari...'}</span>
                        </div>
                      </div>

                      {gpsError && (
                        <div className="text-[10px] text-rose-600 font-black flex items-center gap-1.5 py-1 leading-normal">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          {gpsError}
                        </div>
                      )}

                      {latitude && longitude && officeSetting && currentDistance !== null && (
                        modalType === 'check-in' && activeTab === 'kantor' ? (
                          <div className={`p-2.5 rounded-xl border text-[11px] font-bold leading-normal flex items-start gap-2 ${
                            isWithinRadius 
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                              : 'text-rose-700 bg-rose-50 border-rose-200'
                          }`}>
                            {isWithinRadius ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <span>Radius Terpenuhi (Jarak: {Math.round(currentDistance)}m, Batas: {officeSetting.radius}m). Absen Diizinkan.</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                <span>Di Luar Batas Radius (Jarak: {Math.round(currentDistance)}m, Batas: {officeSetting.radius}m). Absen ditolak.</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl border text-[11px] font-bold leading-normal text-emerald-700 bg-emerald-50 border-emerald-200 flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>Bebas Radius (Tipe: {activeTab === 'kunjungan' ? 'Dinas Luar' : 'Klien'}). Koordinat Berhasil Diverifikasi.</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                </div>

                {/* 3. Category Type selector (only on check-in) */}
                {modalType === 'check-in' && (
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      3. Kategori Tempat Absen
                    </label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'kantor', label: 'Kantor Utama', icon: Building, desc: 'Wajib radius kantor' },
                        { id: 'kunjungan', label: 'Dinas Luar', icon: Compass, desc: 'Bebas radius kantor' },
                        { id: 'client', label: 'Ke Lokasi Klien', icon: UserCheck, desc: 'Bebas radius kantor' }
                      ].map((tab) => {
                        const Icon = tab.icon
                        const active = activeTab === tab.id
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                              active 
                                ? 'border-orange-500 bg-orange-50/10 shadow-xs' 
                                : 'border-slate-200 hover:border-orange-250 bg-white'
                            }`}
                          >
                            <div className={`p-2 rounded-xl shrink-0 ${active ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="overflow-hidden">
                              <span className="block text-xs font-bold text-slate-800 truncate">{tab.label}</span>
                              <span className="text-[9px] text-slate-400 font-bold block">{tab.desc}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Notes area */}
                <div className="space-y-1.5 pt-3 border-t border-slate-100">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Keterangan Catatan
                  </label>
                  <textarea
                    placeholder="Tambahkan catatan keterangan absen Anda (opsional)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 focus:bg-white text-slate-850 placeholder-slate-400 rounded-2xl py-2 px-4 outline-none transition-all text-xs font-bold resize-none"
                  />
                </div>

              </div>

              {/* Console Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeConsole}
                  className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !capturedPhoto || !latitude || !longitude || (modalType === 'check-in' && activeTab === 'kantor' && officeSetting !== null && !isWithinRadius)}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-black rounded-xl text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-red-500/10 flex items-center gap-1.5"
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
          )}

        </div>

      </div>

    </div>
  )
}
