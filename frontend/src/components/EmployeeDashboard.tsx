import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import L from 'leaflet'
import { 
  LogOut, 
  User as UserIcon, 
  Calendar, 
  Clock, 
  Sparkles, 
  Building, 
  CheckCircle2, 
  ShieldAlert,
  Camera,
  MapPin,
  RefreshCw,
  AlertCircle,
  FileText,
  Check,
  Eye,
  AlertTriangle
} from 'lucide-react'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'employee'
}

interface EmployeeDashboardProps {
  user: User
  token: string
  onLogout: () => void
}

interface Attendance {
  id: number
  date: string
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
  id: number
  latitude: string
  longitude: string
  radius: number
}

export default function EmployeeDashboard({ user, token, onLogout }: EmployeeDashboardProps) {
  const [time, setTime] = useState(new Date())
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null)
  const [officeSetting, setOfficeSetting] = useState<OfficeSetting | null>(null)
  const [history, setHistory] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'in' | 'out'>('in')

  // Camera & Location States
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  // Refs for DOM nodes
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstance = useRef<L.Map | null>(null)
  
  // Track Leaflet layers for dynamic updates
  const employeeMarkerRef = useRef<L.Marker | null>(null)
  const officeMarkerRef = useRef<L.Marker | null>(null)
  const boundaryCircleRef = useRef<L.Circle | null>(null)

  // Determine current step
  const getAttendanceState = () => {
    if (loading) return 'loading'
    if (!todayAttendance || !todayAttendance.clock_in) return 'needs_checkin'
    if (!todayAttendance.clock_out) return 'needs_checkout'
    return 'completed'
  }

  const attendanceState = getAttendanceState()

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch today's attendance, office setting & history
  const fetchTodayAttendance = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/attendance/today', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        const att = response.data.data
        setTodayAttendance(att)
        // Auto set active tab based on status
        if (!att || !att.clock_in) {
          setSelectedTab('in')
        } else if (!att.clock_out) {
          setSelectedTab('out')
        } else {
          setSelectedTab('in')
        }
      }
    } catch (err) {
      console.error('Gagal mengambil data absensi hari ini:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchOfficeSetting = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/office-setting', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setOfficeSetting(response.data.data)
      }
    } catch (err) {
      console.error('Gagal mengambil data lokasi kantor:', err)
    }
  }

  const fetchHistory = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/attendance/history', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setHistory(response.data.data)
      }
    } catch (err) {
      console.error('Gagal mengambil riwayat absensi:', err)
    }
  }

  useEffect(() => {
    fetchTodayAttendance()
    fetchOfficeSetting()
    fetchHistory()
  }, [])

  // Geolocation Handler
  const fetchLocation = () => {
    setLocationLoading(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError('Geolokasi tidak didukung oleh browser Anda.')
      setLocationLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude)
        setLongitude(position.coords.longitude)
        setLocationLoading(false)
      },
      (err) => {
        console.error('Geolocation error:', err)
        setLocationError('Gagal mendeteksi lokasi. Pastikan izin lokasi aktif di browser.')
        setLocationLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const showFormForIn = selectedTab === 'in' && (!todayAttendance || !todayAttendance.clock_in)
  const showFormForOut = selectedTab === 'out' && todayAttendance && todayAttendance.clock_in && !todayAttendance.clock_out
  const needsForm = showFormForIn || showFormForOut

  // Reset camera/photo states when tab changes
  useEffect(() => {
    setCapturedPhoto(null)
    setNotes('')
  }, [selectedTab])

  // Fetch location when form is active and page is loaded
  useEffect(() => {
    if (needsForm && !loading) {
      fetchLocation()
    }
  }, [needsForm, loading])

  // Camera Handler
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
    } catch (err: any) {
      console.error('Camera access error:', err)
      setCameraError('Gagal mengakses kamera. Mohon berikan izin kamera di browser Anda.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }

  // Control camera startup and shutdown
  useEffect(() => {
    if (!capturedPhoto && needsForm && !loading) {
      startCamera()
    }
    return () => {
      stopCamera()
    }
  }, [capturedPhoto, needsForm, loading])

  // Memoized ref callback to bind camera stream and avoid flickering on updates
  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && stream && el.srcObject !== stream) {
      el.srcObject = stream;
    }
  }, [stream]);

  // Monitor stream changes and bind to videoRef
  useEffect(() => {
    if (videoRef.current && stream && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg')
        setCapturedPhoto(dataUrl)
        stopCamera()
      }
    }
  }

  const retakePhoto = () => {
    setCapturedPhoto(null)
  }

  // Calculate distance between employee and office (in meters)
  const getEmployeeDistance = () => {
    if (!latitude || !longitude || !officeSetting) return null
    try {
      const employeeLatLng = L.latLng(latitude, longitude)
      const officeLatLng = L.latLng(parseFloat(officeSetting.latitude), parseFloat(officeSetting.longitude))
      return employeeLatLng.distanceTo(officeLatLng)
    } catch {
      return null
    }
  }

  const currentDistance = getEmployeeDistance()
  const isWithinRadius = currentDistance !== null && officeSetting !== null && currentDistance <= officeSetting.radius

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!latitude || !longitude || !mapRef.current) return

    // Fix default marker icon path issue in Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })

    // Custom Icon for Office
    const officeIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })

    // Setup map instance if not exists or if container changed
    if (mapInstance.current) {
      const currentContainer = mapInstance.current.getContainer()
      if (currentContainer !== mapRef.current) {
        mapInstance.current.remove()
        mapInstance.current = null
        employeeMarkerRef.current = null
        officeMarkerRef.current = null
        boundaryCircleRef.current = null
      }
    }

    if (!mapInstance.current) {
      const map = L.map(mapRef.current).setView([latitude, longitude], 15)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map)
      mapInstance.current = map
    }

    const map = mapInstance.current

    // Update Employee Marker
    if (employeeMarkerRef.current) {
      employeeMarkerRef.current.setLatLng([latitude, longitude])
    } else {
      employeeMarkerRef.current = L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup('Lokasi GPS Anda')
        .openPopup()
    }

    // Handle Office Location boundary circle and marker
    if (officeSetting) {
      const officeLat = parseFloat(officeSetting.latitude)
      const officeLng = parseFloat(officeSetting.longitude)

      // Update/Create Office Marker
      if (officeMarkerRef.current) {
        officeMarkerRef.current.setLatLng([officeLat, officeLng])
      } else {
        officeMarkerRef.current = L.marker([officeLat, officeLng], { icon: officeIcon })
          .addTo(map)
          .bindPopup('Lokasi Kantor')
      }

      // Update/Create Boundary Circle
      if (boundaryCircleRef.current) {
        boundaryCircleRef.current.setLatLng([officeLat, officeLng])
        boundaryCircleRef.current.setRadius(officeSetting.radius)
      } else {
        boundaryCircleRef.current = L.circle([officeLat, officeLng], {
          color: '#6366f1',
          fillColor: '#818cf8',
          fillOpacity: 0.15,
          radius: officeSetting.radius
        }).addTo(map)
      }

      // Auto zoom to show both points
      try {
        const bounds = L.latLngBounds([
          [latitude, longitude],
          [officeLat, officeLng]
        ])
        map.fitBounds(bounds.pad(0.2))
      } catch (e) {
        map.setView([latitude, longitude], 15)
      }
    } else {
      map.setView([latitude, longitude], 15)
    }

    return () => {
      // Don't destroy on state updates, only cleanup on unmount
    }
  }, [latitude, longitude, officeSetting, selectedTab])

  // Cleanup map instance on unmount
  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
        employeeMarkerRef.current = null
        officeMarkerRef.current = null
        boundaryCircleRef.current = null
      }
    }
  }, [])

  // Timer-based status evaluation for visual guidelines
  const getLiveCheckInStatus = () => {
    const hrs = time.getHours()
    const mins = time.getMinutes()
    const timeVal = hrs * 60 + mins

    const startNormal = 8 * 60 + 30 // 08:30
    const endNormal = 9 * 60 // 09:00

    if (timeVal < startNormal) {
      return { text: 'Datang Lebih Awal', colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
    } else if (timeVal >= startNormal && timeVal <= endNormal) {
      return { text: 'Normal (Sesuai Jadwal)', colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }
    } else {
      return { text: 'Terlambat', colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20' }
    }
  }

  const getLiveCheckOutStatus = () => {
    const hrs = time.getHours()
    const mins = time.getMinutes()
    const timeVal = hrs * 60 + mins

    const startNormal = 17 * 60 // 17:00
    const endNormal = 18 * 60 // 18:00

    if (timeVal < startNormal) {
      return { text: 'Pulang Cepat', colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20' }
    } else if (timeVal >= startNormal && timeVal <= endNormal) {
      return { text: 'Normal (Sesuai Jadwal)', colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }
    } else {
      return { text: 'Lembur', colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
    }
  }

  // Submission handler
  const handleAttendanceSubmit = async (type: 'check-in' | 'check-out') => {
    if (!capturedPhoto) {
      Swal.fire({
        title: 'Foto Wajib',
        text: 'Silakan ambil foto wajah Anda terlebih dahulu sebelum mengirim absensi.',
        icon: 'warning',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#6366f1'
      })
      return
    }

    if (!latitude || !longitude) {
      Swal.fire({
        title: 'Lokasi Wajib',
        text: 'Sistem memerlukan koordinat GPS Anda. Aktifkan lokasi dan klik Cari Ulang.',
        icon: 'warning',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#6366f1'
      })
      return
    }

    if (officeSetting && !isWithinRadius) {
      Swal.fire({
        title: 'Di Luar Radius Kantor',
        text: `Anda tidak diizinkan melakukan absensi karena berada di luar radius batas kantor (Jarak Anda: ${Math.round(currentDistance || 0)} meter, Radius diizinkan: ${officeSetting.radius} meter).`,
        icon: 'error',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#ef4444'
      })
      return
    }

    setSubmitting(true)
    try {
      const url = `http://localhost:8000/api/attendance/${type}`
      const response = await axios.post(
        url,
        {
          latitude: String(latitude),
          longitude: String(longitude),
          photo: capturedPhoto,
          notes: notes
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.status === 'success') {
        Swal.fire({
          title: 'Berhasil!',
          text: response.data.message,
          icon: 'success',
          background: '#1e293b',
          color: '#f8fafc',
          timer: 2000,
          showConfirmButton: false
        })
        
        // Reset states
        setCapturedPhoto(null)
        setNotes('')
        
        // Refresh data
        setLoading(true)
        await fetchTodayAttendance()
        await fetchHistory()
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal memproses absensi.'
      Swal.fire({
        title: 'Kesalahan Absensi',
        text: msg,
        icon: 'error',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#ef4444'
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Logout Click
  const handleLogoutClick = async () => {
    try {
      await axios.post(
        'http://localhost:8000/api/logout',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
    } catch (err) {
      console.error('API logout error', err)
    } finally {
      onLogout()
      Swal.fire({
        title: 'Logged Out',
        text: 'Anda telah keluar dari aplikasi.',
        icon: 'info',
        timer: 1500,
        showConfirmButton: false,
        background: '#1e293b',
        color: '#f8fafc'
      })
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getGreeting = () => {
    const hrs = time.getHours()
    if (hrs < 12) return 'Selamat Pagi'
    if (hrs < 15) return 'Selamat Siang'
    if (hrs < 18) return 'Selamat Sore'
    return 'Selamat Malam'
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) return '-'
    const textMap: Record<string, string> = {
      early: 'Datang Lebih Awal',
      normal: 'Normal',
      late: 'Terlambat',
      early_departure: 'Pulang Cepat',
      overtime: 'Lembur'
    }
    const colorMap: Record<string, string> = {
      early: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      normal: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      late: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      early_departure: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      overtime: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${colorMap[status] || 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>
        {textMap[status] || status}
      </span>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header Panel */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20 text-white font-bold text-xl">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded border border-violet-400/20 font-quicksand">
                Karyawan
              </span>
              <span className="text-xs text-slate-500 font-bold font-quicksand">ID: #{user.id}</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-0.5">{user.name}</h1>
            <p className="text-sm text-slate-400">{user.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogoutClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-950 border border-slate-800 hover:bg-rose-500/10 hover:border-rose-500/30 text-slate-300 hover:text-rose-400 rounded-xl transition-all cursor-pointer font-bold text-sm self-start md:self-auto font-quicksand"
        >
          <LogOut className="w-4 h-4" />
          Keluar Aplikasi
        </button>
      </header>

      {/* Grid Clock & Live Status */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Dynamic Clock Card */}
        <section className="md:col-span-5 bg-gradient-to-tr from-slate-900/60 to-slate-900/20 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-violet-500/10 rounded-2xl text-violet-400 border border-violet-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-quicksand">
              Waktu Online
            </span>
          </div>
          
          <div className="my-4">
            <h2 className="text-4xl font-extrabold tracking-tight text-white font-mono">
              {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </h2>
            <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-1 font-bold font-quicksand">
              <Calendar className="w-4 h-4 text-slate-500" />
              {formatDate(time)}
            </p>
          </div>
          
          <div className="border-t border-slate-800/60 pt-3 text-xs text-slate-500 font-bold flex items-center gap-1 font-quicksand">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin duration-3000" />
            {getGreeting()}, {user.name.split(' ')[0]}!
          </div>
        </section>

        {/* Info & Status Cards */}
        <section className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Card 1: Attendance status */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between hover:border-slate-700/60 transition-all group">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-quicksand">Hari Ini</span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-extrabold text-slate-200 font-quicksand">Status Kehadiran</h3>
              <p className="text-xs text-slate-400 mt-1">Status Anda pada tanggal hari ini.</p>
              <div className="mt-3 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-450">Masuk:</span>
                  {todayAttendance?.clock_in ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white font-mono">{todayAttendance.clock_in}</span>
                      {getStatusBadge(todayAttendance.status_in)}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic font-semibold">Belum Absen</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-450">Keluar:</span>
                  {todayAttendance?.clock_out ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white font-mono">{todayAttendance.clock_out}</span>
                      {getStatusBadge(todayAttendance.status_out)}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic font-semibold">Belum Absen</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Live Evaluation Indicator */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-between hover:border-slate-700/60 transition-all group">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
                <Building className="w-6 h-6" />
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-quicksand">Indikator</span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-extrabold text-slate-200 font-quicksand">Evaluasi Waktu</h3>
              <p className="text-xs text-slate-400 mt-1">Status jika Anda mengirim absensi sekarang:</p>
              <div className="mt-3">
                {attendanceState === 'needs_checkin' ? (
                  <div className="space-y-1">
                    <span className="text-xs text-indigo-400 font-semibold">Estimasi Absen Masuk:</span>
                    <div>
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold border ${getLiveCheckInStatus().colorClass}`}>
                        {getLiveCheckInStatus().text}
                      </span>
                    </div>
                  </div>
                ) : attendanceState === 'needs_checkout' ? (
                  <div className="space-y-1">
                    <span className="text-xs text-indigo-400 font-semibold">Estimasi Absen Keluar:</span>
                    <div>
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold border ${getLiveCheckOutStatus().colorClass}`}>
                        {getLiveCheckOutStatus().text}
                      </span>
                    </div>
                  </div>
                ) : attendanceState === 'completed' ? (
                  <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl text-center">
                    Absensi Hari Ini Selesai
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 animate-pulse">Menghubungkan...</span>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Main Attendance Activity Panel */}
      {loading ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-12 text-center text-slate-400">
          <div className="flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
            <p className="font-semibold text-sm">Memuat status kehadiran...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tab Selector */}
          <div className="flex bg-slate-900/20 border border-slate-800/80 rounded-2xl p-1.5 backdrop-blur-xl">
            <button
              onClick={() => setSelectedTab('in')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                selectedTab === 'in'
                  ? 'bg-gradient-to-r from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 text-indigo-400 font-extrabold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Clock className="w-4.5 h-4.5" />
              Absen Masuk (Check-In)
              {todayAttendance?.clock_in && (
                <span className="w-2 h-2 rounded-full bg-emerald-550 animate-pulse"></span>
              )}
            </button>
            <button
              onClick={() => setSelectedTab('out')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                selectedTab === 'out'
                  ? 'bg-gradient-to-r from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 text-indigo-400 font-extrabold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Clock className="w-4.5 h-4.5" />
              Absen Keluar (Check-Out)
              {todayAttendance?.clock_out && (
                <span className="w-2 h-2 rounded-full bg-emerald-550 animate-pulse"></span>
              )}
            </button>
          </div>

          {/* Tab Content */}
          {selectedTab === 'in' ? (
            // Check-In Tab
            !todayAttendance || !todayAttendance.clock_in ? (
              // Form for Check-In
              <section className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-6">
                <div className="border-b border-slate-800/60 pb-3 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Camera className="w-5 h-5 text-indigo-400" />
                      Formulir Presensi: Masuk (Check-In)
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Harap ambil foto wajah dan aktifkan lokasi GPS Anda.</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 font-quicksand">
                      Belum Masuk
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Column 1: Kamera */}
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider font-quicksand">
                      1. Foto Kamera Webcam
                    </label>
                    <div className="relative aspect-video w-full rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden flex items-center justify-center shadow-inner">
                      {capturedPhoto ? (
                        <img src={capturedPhoto} alt="Foto Presensi" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <video 
                            ref={setVideoRef}
                            autoPlay 
                            playsInline 
                            muted 
                            className="w-full h-full object-cover transform -scale-x-100" 
                          />
                          {cameraError && (
                            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center text-rose-400 gap-2">
                              <AlertCircle className="w-8 h-8" />
                              <p className="text-xs font-semibold leading-relaxed">{cameraError}</p>
                              <button onClick={startCamera} className="px-4 py-2 mt-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer">
                                Coba Lagi
                              </button>
                            </div>
                          )}
                        </>
                      )}
                      <canvas ref={canvasRef} className="hidden" />
                    </div>

                    <div className="flex gap-3 justify-center">
                      {capturedPhoto ? (
                        <button onClick={retakePhoto} className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer font-quicksand">
                          <RefreshCw className="w-3.5 h-3.5" /> Ambil Ulang Foto
                        </button>
                      ) : (
                        <button onClick={capturePhoto} disabled={!!cameraError} className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-quicksand">
                          <Camera className="w-4 h-4" /> Tangkap Foto Wajah
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Peta */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider font-quicksand">
                        2. Lokasi Geolocation (GPS)
                      </label>
                      <button onClick={fetchLocation} disabled={locationLoading} className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer font-quicksand">
                        <RefreshCw className={`w-3.5 h-3.5 ${locationLoading ? 'animate-spin' : ''}`} /> Cari Ulang
                      </button>
                    </div>

                    <div className="relative w-full h-[220px] rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden flex items-center justify-center">
                      <div ref={mapRef} id="employee-map" className="w-full h-full z-10" />
                      {locationLoading && (
                        <div className="absolute inset-0 bg-slate-950/80 z-20 flex flex-col items-center justify-center text-slate-400 text-center gap-2">
                          <RefreshCw className="w-7 h-7 animate-spin text-indigo-400" />
                          <p className="text-xs font-semibold">Mengunci sinyal koordinat GPS...</p>
                        </div>
                      )}
                      {locationError && !latitude && (
                        <div className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center p-6 text-center text-rose-400 gap-2">
                          <MapPin className="w-8 h-8" />
                          <p className="text-xs font-semibold leading-relaxed">{locationError}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex justify-between items-center text-xs font-mono">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Koordinat:</span>
                        </div>
                        {latitude && longitude ? (
                          <span className="text-slate-200 text-[11px] font-semibold">{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
                        ) : (
                          <span className="text-slate-550 italic">Lokasi belum dikunci</span>
                        )}
                      </div>

                      {latitude && longitude && officeSetting && currentDistance !== null && (
                        <div className={`p-3 rounded-xl border text-[11px] font-bold flex items-start gap-2 leading-relaxed ${isWithinRadius ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-450 bg-rose-500/10 border-rose-500/25'}`}>
                          {isWithinRadius ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span>Anda berada di dalam radius absensi kantor (Jarak: {Math.round(currentDistance)}m, Maksimal: {officeSetting.radius}m).</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
                              <span>Anda berada DI LUAR radius batas kantor (Jarak: {Math.round(currentDistance)}m, Maksimal: {officeSetting.radius}m). Absensi akan ditolak.</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 font-quicksand">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    3. Catatan Presensi (Opsional)
                  </label>
                  <textarea placeholder="Tambahkan pesan atau keterangan jika diperlukan..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-white placeholder-slate-555 rounded-xl py-2.5 px-4 outline-none transition-all text-xs resize-none" />
                </div>

                <div className="pt-2 flex justify-end">
                  <button onClick={() => handleAttendanceSubmit('check-in')} disabled={submitting || !capturedPhoto || !latitude || !longitude || !isWithinRadius} className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/10 cursor-pointer text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed font-quicksand">
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Mengirim Presensi...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Kirim Absensi Masuk Sekarang
                      </>
                    )}
                  </button>
                </div>
              </section>
            ) : (
              // Check-In Complete Details
              <section className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-transparent"></div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white font-quicksand">Absen Masuk Tercatat!</h2>
                      <p className="text-xs text-slate-400">Anda sudah melakukan absen masuk (check-in) untuk hari ini.</p>
                    </div>
                  </div>
                  {getStatusBadge(todayAttendance.status_in)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                  <div className="md:col-span-7 space-y-4">
                    <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Waktu Presensi Masuk</span>
                        <span className="text-3xl font-extrabold text-white font-mono">{todayAttendance.clock_in}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/40">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Latitude GPS</span>
                          <span className="text-xs text-slate-300 font-mono">{todayAttendance.latitude_in}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Longitude GPS</span>
                          <span className="text-xs text-slate-300 font-mono">{todayAttendance.longitude_in}</span>
                        </div>
                      </div>
                      {todayAttendance.notes_in && (
                        <div className="pt-2 border-t border-slate-800/40">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Catatan Anda</span>
                          <p className="text-xs text-slate-300 mt-1">{todayAttendance.notes_in}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-5">
                    {todayAttendance.photo_in && (
                      <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
                        <img src={`http://localhost:8000${todayAttendance.photo_in}`} alt="Foto Check In" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )
          ) : (
            // Check-Out Tab
            !todayAttendance || !todayAttendance.clock_in ? (
              // Check-Out Blocked (Need Check-In First)
              <section className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-12 text-center backdrop-blur-xl flex flex-col items-center justify-center gap-4">
                <div className="p-4 bg-rose-500/10 rounded-full border border-rose-500/20 text-rose-450">
                  <AlertTriangle className="w-10 h-10 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-quicksand">Absen Keluar Belum Tersedia</h3>
                  <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                    Anda harus melakukan **Absen Masuk (Check-In)** terlebih dahulu pada hari ini sebelum dapat mencatat Absen Keluar (Check-Out).
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTab('in')}
                  className="mt-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 cursor-pointer font-quicksand"
                >
                  Buka Absen Masuk
                </button>
              </section>
            ) : !todayAttendance.clock_out ? (
              // Form for Check-Out
              <section className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-6">
                <div className="border-b border-slate-800/60 pb-3 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Camera className="w-5 h-5 text-indigo-400" />
                      Formulir Presensi: Keluar (Check-Out)
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Harap ambil foto wajah dan aktifkan lokasi GPS Anda.</p>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 font-quicksand">
                      Belum Keluar
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Column 1: Kamera */}
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider font-quicksand">
                      1. Foto Kamera Webcam
                    </label>
                    <div className="relative aspect-video w-full rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden flex items-center justify-center shadow-inner">
                      {capturedPhoto ? (
                        <img src={capturedPhoto} alt="Foto Presensi" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <video 
                            ref={setVideoRef}
                            autoPlay 
                            playsInline 
                            muted 
                            className="w-full h-full object-cover transform -scale-x-100" 
                          />
                          {cameraError && (
                            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center text-rose-450 gap-2">
                              <AlertCircle className="w-8 h-8" />
                              <p className="text-xs font-semibold leading-relaxed">{cameraError}</p>
                              <button onClick={startCamera} className="px-4 py-2 mt-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer">
                                Coba Lagi
                              </button>
                            </div>
                          )}
                        </>
                      )}
                      <canvas ref={canvasRef} className="hidden" />
                    </div>

                    <div className="flex gap-3 justify-center">
                      {capturedPhoto ? (
                        <button onClick={retakePhoto} className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer font-quicksand">
                          <RefreshCw className="w-3.5 h-3.5" /> Ambil Ulang Foto
                        </button>
                      ) : (
                        <button onClick={capturePhoto} disabled={!!cameraError} className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-quicksand">
                          <Camera className="w-4 h-4" /> Tangkap Foto Wajah
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Peta */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider font-quicksand">
                        2. Lokasi Geolocation (GPS)
                      </label>
                      <button onClick={fetchLocation} disabled={locationLoading} className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer font-quicksand">
                        <RefreshCw className={`w-3.5 h-3.5 ${locationLoading ? 'animate-spin' : ''}`} /> Cari Ulang
                      </button>
                    </div>

                    <div className="relative w-full h-[220px] rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden flex items-center justify-center">
                      <div ref={mapRef} id="employee-map" className="w-full h-full z-10" />
                      {locationLoading && (
                        <div className="absolute inset-0 bg-slate-950/80 z-20 flex flex-col items-center justify-center text-slate-400 text-center gap-2">
                          <RefreshCw className="w-7 h-7 animate-spin text-indigo-400" />
                          <p className="text-xs font-semibold">Mengunci sinyal koordinat GPS...</p>
                        </div>
                      )}
                      {locationError && !latitude && (
                        <div className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center p-6 text-center text-rose-400 gap-2">
                          <MapPin className="w-8 h-8" />
                          <p className="text-xs font-semibold leading-relaxed">{locationError}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex justify-between items-center text-xs font-mono">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Koordinat:</span>
                        </div>
                        {latitude && longitude ? (
                          <span className="text-slate-200 text-[11px] font-semibold">{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
                        ) : (
                          <span className="text-slate-550 italic">Lokasi belum dikunci</span>
                        )}
                      </div>

                      {latitude && longitude && officeSetting && currentDistance !== null && (
                        <div className={`p-3 rounded-xl border text-[11px] font-bold flex items-start gap-2 leading-relaxed ${isWithinRadius ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-450 bg-rose-500/10 border-rose-500/25'}`}>
                          {isWithinRadius ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span>Anda berada di dalam radius absensi kantor (Jarak: {Math.round(currentDistance)}m, Maksimal: {officeSetting.radius}m).</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
                              <span>Anda berada DI LUAR radius batas kantor (Jarak: {Math.round(currentDistance)}m, Maksimal: {officeSetting.radius}m). Absensi akan ditolak.</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 font-quicksand">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    3. Catatan Presensi (Opsional)
                  </label>
                  <textarea placeholder="Tambahkan pesan atau keterangan jika diperlukan..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-white placeholder-slate-550 rounded-xl py-2.5 px-4 outline-none transition-all text-xs resize-none" />
                </div>

                <div className="pt-2 flex justify-end">
                  <button onClick={() => handleAttendanceSubmit('check-out')} disabled={submitting || !capturedPhoto || !latitude || !longitude || !isWithinRadius} className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/10 cursor-pointer text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed font-quicksand">
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Mengirim Presensi...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Kirim Absensi Keluar Sekarang
                      </>
                    )}
                  </button>
                </div>
              </section>
            ) : (
              // Check-Out Complete Details
              <section className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 via-teal-550 to-transparent"></div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white font-quicksand">Absen Keluar Tercatat!</h2>
                      <p className="text-xs text-slate-400">Anda sudah melakukan absen keluar (check-out) untuk hari ini.</p>
                    </div>
                  </div>
                  {getStatusBadge(todayAttendance.status_out)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                  <div className="md:col-span-7 space-y-4">
                    <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Waktu Presensi Keluar</span>
                        <span className="text-3xl font-extrabold text-white font-mono">{todayAttendance.clock_out}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/40">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Latitude GPS</span>
                          <span className="text-xs text-slate-300 font-mono">{todayAttendance.latitude_out}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Longitude GPS</span>
                          <span className="text-xs text-slate-300 font-mono">{todayAttendance.longitude_out}</span>
                        </div>
                      </div>
                      {todayAttendance.notes_out && (
                        <div className="pt-2 border-t border-slate-800/40">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Catatan Anda</span>
                          <p className="text-xs text-slate-300 mt-1">{todayAttendance.notes_out}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-5">
                    {todayAttendance.photo_out && (
                      <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
                        <img src={`http://localhost:8000${todayAttendance.photo_out}`} alt="Foto Check Out" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )
          )}
        </div>
      )}

      {/* Profile Details Card */}
      <section className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl">
        <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2 pb-3 border-b border-slate-800/60 font-quicksand">
          <UserIcon className="w-5 h-5 text-indigo-400" /> Profil Akun Karyawan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 uppercase font-bold font-quicksand">Nama Lengkap</span>
            <p className="text-sm font-bold text-slate-300 font-quicksand">{user.name}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-500 uppercase font-bold font-quicksand">Alamat Email</span>
            <p className="text-sm font-bold text-slate-300 font-quicksand">{user.email}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-slate-500 uppercase font-bold font-quicksand">Tipe Akun</span>
            <p className="text-sm font-bold text-slate-300 font-quicksand">Akses Karyawan Umum</p>
          </div>
        </div>
      </section>

      {/* Attendance History Section */}
      <section className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-200 font-quicksand">Riwayat Presensi Mandiri</h3>
          <p className="text-xs text-slate-400 font-quicksand mt-1">Daftar rekaman absensi Anda selama 30 hari terakhir.</p>
        </div>

        <div className="border border-slate-800/60 rounded-2xl overflow-hidden bg-slate-950/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/60 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800/80 font-quicksand">
                  <th className="py-4 px-6">Tanggal</th>
                  <th className="py-4 px-6">Masuk (Check-In)</th>
                  <th className="py-4 px-6">Keluar (Check-Out)</th>
                  <th className="py-4 px-6 text-center">Foto Presensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm text-slate-300">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 font-semibold">
                      Belum ada riwayat absensi yang tercatat.
                    </td>
                  </tr>
                ) : (
                  history.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-300 font-quicksand">
                        {new Date(record.date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-6">
                        {record.clock_in ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-xs font-bold text-slate-200">{record.clock_in}</span>
                            <div>{getStatusBadge(record.status_in)}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Tidak ada data</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {record.clock_out ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-xs font-bold text-slate-200">{record.clock_out}</span>
                            <div>{getStatusBadge(record.status_out)}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Tidak ada data</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {record.photo_in && (
                            <button
                              onClick={() => {
                                Swal.fire({
                                  title: 'Foto Masuk',
                                  imageUrl: `http://localhost:8000${record.photo_in}`,
                                  imageAlt: 'Foto Masuk',
                                  background: '#1e293b',
                                  color: '#f8fafc',
                                  confirmButtonColor: '#6366f1'
                                })
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 rounded-lg text-xs font-bold transition-all cursor-pointer font-quicksand"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Masuk
                            </button>
                          )}
                          {record.photo_out && (
                            <button
                              onClick={() => {
                                Swal.fire({
                                  title: 'Foto Keluar',
                                  imageUrl: `http://localhost:8000${record.photo_out}`,
                                  imageAlt: 'Foto Keluar',
                                  background: '#1e293b',
                                  color: '#f8fafc',
                                  confirmButtonColor: '#6366f1'
                                })
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 hover:border-violet-500 text-slate-400 hover:text-violet-400 rounded-lg text-xs font-bold transition-all cursor-pointer font-quicksand"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Keluar
                            </button>
                          )}
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

      {/* Notification banner */}
      <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0" />
        <p className="text-xs text-slate-400 leading-relaxed">
          <strong>Lokasi dan Kamera Wajib:</strong> Kehadiran Anda divalidasi menggunakan koordinat GPS nyata serta foto selfie kamera instan. Memanipulasi lokasi atau kamera adalah pelanggaran disiplin.
        </p>
      </div>
    </div>
  )
}
