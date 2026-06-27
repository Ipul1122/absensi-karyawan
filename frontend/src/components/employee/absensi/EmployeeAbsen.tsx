import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import L from 'leaflet'
import { getAssetUrl } from '../../../utils/api'
import { NavLink } from 'react-router-dom'
import { 
  Clock, 
  Camera, 
  RefreshCw, 
  AlertCircle, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Check,
  Building,
  Upload,
  X,
  SwitchCamera,
  Circle
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
}

interface OfficeSetting {
  id: number
  latitude: string
  longitude: string
  radius: number
}

interface EmployeeAbsenProps {
  token: string
  todayAttendance: Attendance | null
  officeSetting: OfficeSetting | null
  fetchTodayAttendance: () => Promise<void>
  fetchHistory: () => Promise<void>
  getStatusBadge: (status: string | null) => React.ReactNode
}

export default function EmployeeAbsen({
  token,
  todayAttendance,
  officeSetting,
  fetchTodayAttendance,
  fetchHistory,
  getStatusBadge
}: EmployeeAbsenProps) {
  const [selectedTab, setSelectedTab] = useState<'in' | 'out'>('in')
  const [submitting, setSubmitting] = useState(false)

  // Camera & Location States
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [isCameraActive, setIsCameraActive] = useState(false)

  // Fullscreen camera modal state
  const [showCameraModal, setShowCameraModal] = useState(false)
  const modalVideoRef = useRef<HTMLVideoElement | null>(null)
  const modalCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const modalStreamRef = useRef<MediaStream | null>(null)
  const [modalCameraError, setModalCameraError] = useState<string | null>(null)
  const [modalFacingMode, setModalFacingMode] = useState<'user' | 'environment'>('user')
  const [isCapturing, setIsCapturing] = useState(false)
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null)

  // Refs for DOM nodes
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  // Track Leaflet layers for dynamic updates
  const employeeMarkerRef = useRef<L.Marker | null>(null)
  const officeMarkerRef = useRef<L.Marker | null>(null)
  const boundaryCircleRef = useRef<L.Circle | null>(null)

  // Memoized callback ref for the map container to ensure cleanup on unmount
  const setMapRef = useCallback((el: HTMLDivElement | null) => {
    mapRef.current = el
    if (!el) {
      if (mapInstance.current) {
        try {
          mapInstance.current.remove()
        } catch (err) {
          console.error('Error removing map instance:', err)
        }
        mapInstance.current = null
        employeeMarkerRef.current = null
        officeMarkerRef.current = null
        boundaryCircleRef.current = null
      }
    }
  }, [])

  // Auto set active tab based on today's attendance status on mount
  useEffect(() => {
    if (!todayAttendance || !todayAttendance.clock_in) {
      setSelectedTab('in')
    } else if (!todayAttendance.clock_out) {
      setSelectedTab('out')
    } else {
      setSelectedTab('in')
    }
  }, [todayAttendance])

  const showFormForIn = selectedTab === 'in' && (!todayAttendance || !todayAttendance.clock_in)
  const showFormForOut = selectedTab === 'out' && todayAttendance && todayAttendance.clock_in && !todayAttendance.clock_out
  const needsForm = showFormForIn || showFormForOut

  if (todayAttendance && todayAttendance.clock_in && todayAttendance.attendance_type !== 'kantor') {
    return (
      <div className="space-y-6">
        <section className="bg-white border border-orange-100 rounded-3xl p-8 text-center shadow-sm flex flex-col items-center justify-center gap-4">
          <div className="p-4 bg-amber-50 rounded-full border border-amber-200 text-amber-600">
            <Building className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 font-quicksand">Absen Kantor Tidak Aktif</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed font-medium font-quicksand">
              Hari ini Anda tercatat melakukan absensi tipe <strong className="capitalize">{todayAttendance.attendance_type === 'kunjungan' ? 'Kunjungan Kerja / Lapangan' : 'Kunjungan Klien'}</strong>.
              <br />
              Silakan buka halaman absensi yang sesuai untuk melihat detail atau melakukan absen keluar.
            </p>
          </div>
          <NavLink
            to={todayAttendance.attendance_type === 'kunjungan' ? '/employee/sales' : '/employee/client'}
            className="mt-2 px-5 py-2.5 bg-gradient-to-r from-orange-50 to-red-500 hover:from-orange-600 hover:to-red-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer font-quicksand font-semibold"
          >
            Buka Absen {todayAttendance.attendance_type === 'kunjungan' ? 'Kunjungan Kerja' : 'Kunjungan Klien'}
          </NavLink>
        </section>
      </div>
    )
  }

  // Reset camera/photo states when tab changes
  useEffect(() => {
    setCapturedPhoto(null)
    setNotes('')
    setIsCameraActive(false)
  }, [selectedTab])

  // Geolocation Handler
  const fetchLocation = () => {
    setLocationLoading(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError('Geolokasi tidak didukung oleh browser Anda.')
      setLocationLoading(false)
      return
    }

    try {
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
    } catch (err: any) {
      console.error('Geolocation synchronous access error:', err)
      setLocationError('Gagal mendeteksi lokasi (Kesalahan Keamanan/Origin).')
      setLocationLoading(false)
    }
  }

  // Fetch location when form is active
  useEffect(() => {
    if (needsForm) {
      fetchLocation()
    }
  }, [needsForm])

  // Camera Handler
  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: { ideal: 'user' } }
      })
      streamRef.current = mediaStream
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err: any) {
      console.error('Camera access error:', err)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  // Control camera startup and shutdown
  useEffect(() => {
    if (isCameraActive && !capturedPhoto && needsForm) {
      startCamera()
    } else {
      stopCamera()
    }
    return () => {
      stopCamera()
    }
  }, [isCameraActive, capturedPhoto, needsForm])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        title: 'Ukuran File Terlalu Besar',
        text: 'Ukuran foto maksimal adalah 5MB.',
        icon: 'warning',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#6366f1'
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setCapturedPhoto(dataUrl)
      stopCamera()
    }
    reader.onerror = (err) => {
      console.error('File reading error:', err)
      Swal.fire({
        title: 'Gagal Membaca File',
        text: 'Terjadi kesalahan saat membaca file gambar.',
        icon: 'error',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#ef4444'
      })
    }
    reader.readAsDataURL(file)
  }

  // ============================================================
  // FULLSCREEN CAMERA MODAL HANDLERS
  // ============================================================
  const startModalCamera = async (mode?: 'user' | 'environment') => {
    const currentMode = mode ?? modalFacingMode
    setModalCameraError(null)
    try {
      if (modalStreamRef.current) {
        modalStreamRef.current.getTracks().forEach((t) => t.stop())
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: { ideal: currentMode },
        },
        audio: false,
      })
      modalStreamRef.current = mediaStream
      if (modalVideoRef.current) {
        modalVideoRef.current.srcObject = mediaStream
      }
    } catch (err: any) {
      console.error('Modal camera error:', err)
      setModalCameraError('Gagal mengakses kamera. Pastikan izin kamera telah diberikan di browser.')
    }
  }

  const stopModalCamera = () => {
    if (modalStreamRef.current) {
      modalStreamRef.current.getTracks().forEach((t) => t.stop())
      modalStreamRef.current = null
    }
    if (modalVideoRef.current) {
      modalVideoRef.current.srcObject = null
    }
  }

  const openCameraModal = async () => {
    setShowCameraModal(true)
    // Prevent background scrolling
    document.body.style.overflow = 'hidden'
    // Small delay to let the modal DOM mount before starting camera
    setTimeout(() => startModalCamera(), 150)
  }

  const closeCameraModal = () => {
    stopModalCamera()
    setShowCameraModal(false)
    document.body.style.overflow = ''
  }

  const flipModalCamera = async () => {
    const newMode = modalFacingMode === 'user' ? 'environment' : 'user'
    setModalFacingMode(newMode)
    await startModalCamera(newMode)
  }

  const captureModalPhoto = () => {
    if (!modalVideoRef.current || !modalCanvasRef.current) return
    setIsCapturing(true)
    const video = modalVideoRef.current
    const canvas = modalCanvasRef.current
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    if (ctx) {
      // Mirror if front-facing camera
      if (modalFacingMode === 'user') {
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
      // Pause camera, show preview — don't close modal yet
      stopModalCamera()
      setPreviewPhoto(dataUrl)
    }
    setTimeout(() => setIsCapturing(false), 200)
  }

  const confirmModalPhoto = () => {
    if (!previewPhoto) return
    setCapturedPhoto(previewPhoto)
    setPreviewPhoto(null)
    setShowCameraModal(false)
    document.body.style.overflow = ''
  }

  const retakeModalPhoto = () => {
    setPreviewPhoto(null)
    // Restart camera after a brief moment
    setTimeout(() => startModalCamera(), 150)
  }

  // Cleanup modal stream on unmount
  useEffect(() => {
    return () => {
      stopModalCamera()
      document.body.style.overflow = ''
    }
  }, [])

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

    try {
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
          try {
            mapInstance.current.remove()
          } catch (err) {
            console.error('Error removing old map instance:', err)
          }
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

        if (!isNaN(officeLat) && !isNaN(officeLng)) {
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
      } else {
        map.setView([latitude, longitude], 15)
      }
    } catch (err) {
      console.error('Error initializing or updating Leaflet map:', err)
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

    const isKantor = true;
    if (isKantor && officeSetting && !isWithinRadius) {
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
          notes: notes,
          attendance_type: type === 'check-in' ? 'kantor' : undefined
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
        setIsCameraActive(false)
        
        // Refresh parent data
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

  return (
    <>
    <div className="space-y-6">
      {/* Tab Selector */}
      <div className="flex bg-orange-50/30 border border-orange-100 rounded-2xl p-1.5 backdrop-blur-xl">
        <button
          onClick={() => setSelectedTab('in')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            selectedTab === 'in'
              ? 'bg-gradient-to-r from-red-50 to-orange-50 border border-orange-200/50 text-red-600 font-extrabold shadow-sm'
              : 'text-slate-500 hover:text-red-500 border border-transparent'
          }`}
        >
          <Clock className="w-4.5 h-4.5" />
          Absen Masuk
          {todayAttendance?.clock_in && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          )}
        </button>
        <button
          onClick={() => setSelectedTab('out')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            selectedTab === 'out'
              ? 'bg-gradient-to-r from-red-50 to-orange-50 border border-orange-200/50 text-red-600 font-extrabold shadow-sm'
              : 'text-slate-500 hover:text-red-500 border border-transparent'
          }`}
        >
          <Clock className="w-4.5 h-4.5" />
          Absen Keluar 
          {todayAttendance?.clock_out && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {selectedTab === 'in' ? (
        // Check-In Tab
        !todayAttendance || !todayAttendance.clock_in ? (
          // Form for Check-In
          <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="border-b border-orange-100 pb-3 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 font-quicksand">
                  <Camera className="w-5 h-5 text-red-500" />
                  Formulir Presensi: Masuk (Check-In)
                </h2>
                <p className="text-xs text-slate-500 mt-1">Harap ambil foto wajah dan aktifkan lokasi GPS Anda.</p>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-quicksand">
                  Belum Masuk
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Column 1: Foto Presensi */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-quicksand">
                  1. Foto Wajah
                </label>

                {capturedPhoto ? (
                  /* Thumbnail + actions after photo taken */
                  <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-md">
                    <img
                      src={capturedPhoto}
                      alt="Foto Presensi"
                      className="w-full aspect-video object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-between p-3">
                      <span className="inline-flex items-center gap-1 text-white text-[10px] font-bold bg-emerald-500/80 backdrop-blur-sm px-2 py-1 rounded-lg">
                        <CheckCircle2 className="w-3 h-3" /> Foto Berhasil
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={openCameraModal}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" /> Ulangi
                        </button>
                        <label className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer">
                          <Upload className="w-3 h-3" /> Galeri
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* No photo yet — show camera launcher */
                  <div className="rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/30 aspect-video flex flex-col items-center justify-center gap-4 p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/25">
                      <Camera className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 font-quicksand">Ambil Foto Wajah</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Kamera akan terbuka penuh di perangkat Anda</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
                      <button
                        type="button"
                        onClick={openCameraModal}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md shadow-red-500/25 active:scale-95"
                      >
                        <Camera className="w-4 h-4" /> Buka Kamera
                      </button>
                      <label className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95">
                        <Upload className="w-4 h-4 text-slate-500" /> Galeri
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Column 2: Peta */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-quicksand">
                    2. Lokasi Geolocation (GPS)
                  </label>
                  <button onClick={fetchLocation} disabled={locationLoading} className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-700 cursor-pointer font-quicksand">
                    <RefreshCw className={`w-3.5 h-3.5 ${locationLoading ? 'animate-spin' : ''}`} /> Cari Ulang
                  </button>
                </div>

                <div className="relative w-full h-[220px] rounded-2xl bg-slate-50 border border-orange-100/60 overflow-hidden flex items-center justify-center">
                  <div ref={setMapRef} id="employee-map-in" className="w-full h-full z-10" />
                  {locationLoading && (
                    <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center text-slate-600 text-center gap-2">
                      <RefreshCw className="w-7 h-7 animate-spin text-red-500" />
                      <p className="text-xs font-semibold">Mengunci sinyal koordinat GPS...</p>
                    </div>
                  )}
                  {locationError && !latitude && (
                    <div className="absolute inset-0 bg-slate-50 z-20 flex flex-col items-center justify-center p-6 text-center text-rose-700 gap-2">
                      <MapPin className="w-8 h-8 text-rose-500" />
                      <p className="text-xs font-semibold leading-relaxed">{locationError}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs font-mono">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      <span className="font-quicksand font-bold">Koordinat:</span>
                    </div>
                    {latitude && longitude ? (
                      <span className="text-slate-700 text-[11px] font-bold">{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
                    ) : (
                      <span className="text-slate-400 italic font-quicksand font-semibold">Lokasi belum dikunci</span>
                    )}
                  </div>

                  {latitude && longitude && officeSetting && currentDistance !== null && (
                    <div className={`p-3 rounded-xl border text-[11px] font-bold flex items-start gap-2 leading-relaxed ${isWithinRadius ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-250'}`}>
                      {isWithinRadius ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>Anda berada di dalam radius absensi kantor (Jarak: {Math.round(currentDistance)}m, Maksimal: {officeSetting.radius}m).</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5 animate-bounce" />
                          <span>Anda berada DI LUAR radius batas kantor (Jarak: {Math.round(currentDistance)}m, Maksimal: {officeSetting.radius}m). Absensi akan ditolak.</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-orange-100">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 font-quicksand">
                <FileText className="w-3.5 h-3.5 text-red-500" />
                3. Catatan Presensi (Opsional)
              </label>
              <textarea placeholder="Tambahkan pesan atau keterangan jika diperlukan..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 px-4 outline-none transition-all text-xs resize-none font-medium font-quicksand" />
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => handleAttendanceSubmit('check-in')} disabled={submitting || !capturedPhoto || !latitude || !longitude || (officeSetting !== null && !isWithinRadius)} className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-orange-600/10 cursor-pointer text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed font-quicksand">
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
          <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 via-teal-500 to-transparent"></div>
            <div className="flex justify-between items-center pb-3 border-b border-orange-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 font-quicksand">Absen Masuk Tercatat!</h2>
                  <p className="text-xs text-slate-500">Anda sudah melakukan absen masuk (check-in) untuk hari ini.</p>
                </div>
              </div>
              {getStatusBadge(todayAttendance.status_in)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
              <div className="md:col-span-7 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-quicksand">Waktu Presensi Masuk</span>
                    <span className="text-3xl font-extrabold text-slate-800 font-mono">{todayAttendance.clock_in}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-quicksand">Tipe Presensi</span>
                      <span className="text-xs text-slate-700 font-extrabold capitalize">{todayAttendance.attendance_type || 'kantor'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-quicksand">Lokasi Absensi</span>
                      <span className="text-xs text-slate-700 font-extrabold">Thamrin City Lantai 7</span>
                    </div>
                  </div>
                  {todayAttendance.notes_in && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-quicksand">Catatan Anda</span>
                      <p className="text-xs text-slate-600 mt-1 font-medium font-quicksand">{todayAttendance.notes_in}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-5">
                {todayAttendance.photo_in && (
                  <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner">
                    <img src={getAssetUrl(todayAttendance.photo_in)} alt="Foto Check In" className="w-full h-full object-cover" />
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
          <section className="bg-white border border-orange-100 rounded-3xl p-12 text-center shadow-sm flex flex-col items-center justify-center gap-4">
            <div className="p-4 bg-rose-50 rounded-full border border-rose-200 text-rose-600">
              <AlertTriangle className="w-10 h-10 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 font-quicksand">Absen Keluar Belum Tersedia</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed font-medium">
                Anda harus melakukan **Absen Masuk (Check-In)** terlebih dahulu pada hari ini sebelum dapat mencatat Absen Keluar (Check-Out).
              </p>
            </div>
            <button
              onClick={() => setSelectedTab('in')}
              className="mt-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-red-500/10 cursor-pointer font-quicksand"
            >
              Buka Absen Masuk
            </button>
          </section>
        ) : !todayAttendance.clock_out ? (
          // Form for Check-Out
          <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="border-b border-orange-100 pb-3 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 font-quicksand">
                  <Camera className="w-5 h-5 text-red-500" />
                  Formulir Presensi: Keluar (Check-Out)
                </h2>
                <p className="text-xs text-slate-500 mt-1">Harap ambil foto wajah and aktifkan lokasi GPS Anda.</p>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-quicksand">
                  Belum Keluar
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Column 1: Foto Presensi */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-quicksand">
                  1. Foto Wajah
                </label>

                {capturedPhoto ? (
                  /* Thumbnail + actions after photo taken */
                  <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-md">
                    <img
                      src={capturedPhoto}
                      alt="Foto Presensi"
                      className="w-full aspect-video object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-between p-3">
                      <span className="inline-flex items-center gap-1 text-white text-[10px] font-bold bg-emerald-500/80 backdrop-blur-sm px-2 py-1 rounded-lg">
                        <CheckCircle2 className="w-3 h-3" /> Foto Berhasil
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={openCameraModal}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Ulangi
                        </button>
                        <label className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer">
                          <Upload className="w-3.5 h-3.5" /> Galeri
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* No photo yet — show camera launcher */
                  <div className="rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/30 aspect-video flex flex-col items-center justify-center gap-4 p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/25">
                      <Camera className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 font-quicksand">Ambil Foto Wajah</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Kamera akan terbuka penuh di perangkat Anda</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
                      <button
                        type="button"
                        onClick={openCameraModal}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md shadow-red-500/25 active:scale-95"
                      >
                        <Camera className="w-4 h-4" /> Buka Kamera
                      </button>
                      <label className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95">
                        <Upload className="w-4 h-4 text-slate-500" /> Galeri
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Column 2: Peta */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-quicksand">
                    2. Lokasi Geolocation (GPS)
                  </label>
                  <button onClick={fetchLocation} disabled={locationLoading} className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-700 cursor-pointer font-quicksand">
                    <RefreshCw className={`w-3.5 h-3.5 ${locationLoading ? 'animate-spin' : ''}`} /> Cari Ulang
                  </button>
                </div>

                <div className="relative w-full h-[220px] rounded-2xl bg-slate-50 border border-orange-100/60 overflow-hidden flex items-center justify-center">
                  <div ref={setMapRef} id="employee-map-out" className="w-full h-full z-10" />
                  {locationLoading && (
                    <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center text-slate-600 text-center gap-2">
                      <RefreshCw className="w-7 h-7 animate-spin text-red-500" />
                      <p className="text-xs font-semibold">Mengunci sinyal koordinat GPS...</p>
                    </div>
                  )}
                  {locationError && !latitude && (
                    <div className="absolute inset-0 bg-slate-50 z-20 flex flex-col items-center justify-center p-6 text-center text-rose-700 gap-2">
                      <MapPin className="w-8 h-8 text-rose-500" />
                      <p className="text-xs font-semibold leading-relaxed">{locationError}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs font-mono">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      <span className="font-quicksand font-bold">Koordinat:</span>
                    </div>
                    {latitude && longitude ? (
                      <span className="text-slate-700 text-[11px] font-bold">{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
                    ) : (
                      <span className="text-slate-400 italic font-quicksand font-semibold">Lokasi belum dikunci</span>
                    )}
                  </div>

                  {latitude && longitude && officeSetting && currentDistance !== null && (
                    <div className={`p-3 rounded-xl border text-[11px] font-bold flex items-start gap-2 leading-relaxed ${isWithinRadius ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-250'}`}>
                      {isWithinRadius ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>Anda berada di dalam radius absensi kantor (Jarak: {Math.round(currentDistance)}m, Maksimal: {officeSetting.radius}m).</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5 animate-bounce" />
                          <span>Anda berada DI LUAR radius batas kantor (Jarak: {Math.round(currentDistance)}m, Maksimal: {officeSetting.radius}m). Absensi akan ditolak.</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-orange-100">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 font-quicksand">
                <FileText className="w-3.5 h-3.5 text-red-500" />
                3. Catatan Presensi (Opsional)
              </label>
              <textarea placeholder="Tambahkan pesan atau keterangan jika diperlukan..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 px-4 outline-none transition-all text-xs resize-none font-medium font-quicksand" />
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => handleAttendanceSubmit('check-out')} disabled={submitting || !capturedPhoto || !latitude || !longitude || (officeSetting !== null && !isWithinRadius)} className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-orange-600/10 cursor-pointer text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed font-quicksand">
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
          <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 via-teal-500 to-transparent"></div>
            <div className="flex justify-between items-center pb-3 border-b border-orange-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 font-quicksand">Absen Keluar Tercatat!</h2>
                  <p className="text-xs text-slate-500">Anda sudah melakukan absen keluar (check-out) untuk hari ini.</p>
                </div>
              </div>
              {getStatusBadge(todayAttendance.status_out)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
              <div className="md:col-span-7 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-quicksand">Waktu Presensi Keluar</span>
                    <span className="text-3xl font-extrabold text-slate-800 font-mono">{todayAttendance.clock_out}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-quicksand">Tipe Presensi</span>
                      <span className="text-xs text-slate-700 font-extrabold capitalize">{todayAttendance.attendance_type || 'kantor'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-quicksand">Lokasi Absensi</span>
                      <span className="text-xs text-slate-700 font-extrabold">Thamrin City Lantai 7</span>
                    </div>
                  </div>
                  {todayAttendance.notes_out && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-quicksand">Catatan Anda</span>
                      <p className="text-xs text-slate-600 mt-1 font-medium font-quicksand">{todayAttendance.notes_out}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-5">
                {todayAttendance.photo_out && (
                  <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner">
                    <img src={getAssetUrl(todayAttendance.photo_out)} alt="Foto Check Out" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </section>
        )
      )}
    </div>

    {/* ================================================================
        FULLSCREEN CAMERA MODAL
        Opens like a native phone camera — fullscreen black viewfinder
        with shutter button at the bottom and flip button at the top right.
        After capture, shows a fullscreen preview before confirming.
    ================================================================ */}
    {showCameraModal && (
      <div
        className="fixed inset-0 z-[9999] bg-black flex flex-col"
        style={{ touchAction: 'none' }}
      >
        {/* ---- PREVIEW MODE ---- */}
        {previewPhoto ? (
          <>
            {/* Preview image — fills screen, object-contain so nothing is cropped */}
            <img
              src={previewPhoto}
              alt="Preview Foto"
              className="absolute inset-0 w-full h-full object-contain"
            />

            {/* Top bar */}
            <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-4 pt-safe-top pt-4">
              <button
                type="button"
                onClick={closeCameraModal}
                className="p-2.5 bg-black/50 backdrop-blur-sm text-white rounded-full transition-all active:scale-90 cursor-pointer"
                title="Batal"
              >
                <X className="w-6 h-6" />
              </button>
              <span className="text-white text-sm font-bold font-quicksand tracking-wide drop-shadow px-3 py-1 bg-black/40 rounded-full backdrop-blur-sm">
                Pratinjau Foto
              </span>
              <div className="w-10" />
            </div>

            {/* Bottom action bar */}
            <div className="absolute bottom-0 inset-x-0 z-10 pb-safe-bottom pb-8 px-6 flex items-center justify-between gap-4">
              {/* Retake */}
              <button
                type="button"
                onClick={retakeModalPhoto}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-black/50 backdrop-blur-md border border-white/20 text-white font-bold rounded-2xl text-sm transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Ambil Ulang
              </button>

              {/* Confirm */}
              <button
                type="button"
                onClick={confirmModalPhoto}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-extrabold rounded-2xl text-sm shadow-lg shadow-emerald-500/30 transition-all active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Gunakan Foto
              </button>
            </div>
          </>
        ) : (
          /* ---- VIEWFINDER MODE ---- */
          <>
            {/* Top Controls */}
            <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-4 pt-safe-top pt-4">
              {/* Close Button */}
              <button
                type="button"
                onClick={closeCameraModal}
                className="p-2.5 bg-black/50 backdrop-blur-sm text-white rounded-full transition-all active:scale-90 cursor-pointer"
                title="Tutup Kamera"
              >
                <X className="w-6 h-6" />
              </button>

              <span className="text-white text-sm font-bold font-quicksand tracking-wide drop-shadow">
                Foto Wajah Presensi
              </span>

              {/* Flip Camera Button */}
              <button
                type="button"
                onClick={flipModalCamera}
                className="p-2.5 bg-black/50 backdrop-blur-sm text-white rounded-full transition-all active:scale-90 cursor-pointer"
                title={modalFacingMode === 'user' ? 'Ganti ke Kamera Belakang' : 'Ganti ke Kamera Depan'}
              >
                <SwitchCamera className="w-6 h-6" />
              </button>
            </div>

            {/* Camera Viewfinder — fills the entire screen */}
            {modalCameraError ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                <AlertCircle className="w-12 h-12 text-rose-400" />
                <p className="text-white text-sm font-semibold leading-relaxed">{modalCameraError}</p>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <button
                    onClick={() => startModalCamera()}
                    className="px-6 py-3 bg-white text-slate-800 font-bold rounded-2xl text-sm transition-all cursor-pointer active:scale-95"
                  >
                    Coba Lagi
                  </button>
                  <label className="px-6 py-3 bg-white/20 text-white font-bold rounded-2xl text-sm transition-all cursor-pointer active:scale-95 text-center">
                    <Upload className="w-4 h-4 inline mr-2" /> Pilih dari Galeri
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { handleImageUpload(e); closeCameraModal() }} />
                  </label>
                </div>
              </div>
            ) : (
              <video
                ref={modalVideoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover ${
                  modalFacingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />
            )}

            {/* Face guide overlay */}
            {!modalCameraError && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div
                  className="rounded-full border-4 border-white/60"
                  style={{ width: '60vw', height: '60vw', maxWidth: 280, maxHeight: 280 }}
                />
              </div>
            )}

            {/* Bottom Controls — Shutter + Gallery */}
            <div className="absolute bottom-0 inset-x-0 z-10 pb-safe-bottom pb-8 flex flex-col items-center gap-4">
              {/* Gallery fallback button */}
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-sm text-white rounded-full text-xs font-bold cursor-pointer active:scale-95 transition-all">
                <Upload className="w-4 h-4" />
                Pilih dari Galeri
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { handleImageUpload(e); closeCameraModal() }}
                />
              </label>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={captureModalPhoto}
                disabled={!!modalCameraError || isCapturing}
                className="relative w-20 h-20 rounded-full bg-white border-4 border-white/30 shadow-2xl flex items-center justify-center transition-all active:scale-90 cursor-pointer disabled:opacity-40"
                title="Ambil Foto"
              >
                <div className={`w-14 h-14 rounded-full bg-white border-4 border-slate-200 flex items-center justify-center shadow-inner ${
                  isCapturing ? 'scale-75 bg-slate-200' : ''
                } transition-all`}>
                  <Circle className="w-6 h-6 text-red-500 fill-red-500" />
                </div>
              </button>
            </div>
          </>
        )}

        {/* Hidden canvas for capture */}
        <canvas ref={modalCanvasRef} className="hidden" />
      </div>
    )}
    </>
  )
}
