import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import L from 'leaflet'
import { getAssetUrl } from '../../../utils/api'
import { NavLink, useSearchParams } from 'react-router-dom'
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
  Upload,
  X,
  SwitchCamera,
  Circle,
  Building,
  Home,
} from 'lucide-react'

const BRAND_ORANGE = '#FF5A00'
const CARD_SHADOW = '0 4px 16px rgba(0,0,0,0.06)'

type AttendanceMode = 'kantor' | 'wfh'

function getAttendanceTypeLabel(type?: string | null) {
  if (type === 'wfh') return 'Work From Home'
  if (type === 'kunjungan') return 'Kunjungan Kerja'
  if (type === 'client') return 'Kunjungan Klien'
  return 'Kantor'
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
  shift_start_time?: string | null
  shift_end_time?: string | null
  shift_id?: number | null
  shift?: {
    id: number
    name: string
    start_time: string
    end_time: string
  } | null
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

const getShiftLabelForAttendance = (att: Attendance | null | undefined) => {
  if (!att) return null
  const isSat = att.date ? new Date(att.date).getDay() === 6 : new Date().getDay() === 6
  
  if (att.shift?.name) {
    const isRegulerSat = att.shift.name === 'Shift Reguler' && isSat
    const endTime = isRegulerSat ? '14:00' : att.shift.end_time.substring(0, 5)
    return `${att.shift.name} (${att.shift.start_time.substring(0, 5)} - ${endTime})`
  }
  if (att.shift_start_time && att.shift_end_time) {
    return `${att.shift_start_time.substring(0, 5)} - ${att.shift_end_time.substring(0, 5)}`
  }
  return isSat ? 'Shift Reguler (08:30 - 14:00)' : 'Shift Reguler (08:30 - 17:30)'
}

export default function EmployeeAbsen({
  token,
  todayAttendance,
  officeSetting,
  fetchTodayAttendance,
  fetchHistory,
  getStatusBadge
}: EmployeeAbsenProps) {
  const [searchParams] = useSearchParams()
  const [selectedTab, setSelectedTab] = useState<'in' | 'out'>('in')
  const [attendanceMode, setAttendanceMode] = useState<AttendanceMode>(() =>
    searchParams.get('mode') === 'wfh' ? 'wfh' : 'kantor'
  )
  const [submitting, setSubmitting] = useState(false)

  // Camera & Location States
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [shifts, setShifts] = useState<any[]>([])
  const [selectedShiftId, setSelectedShiftId] = useState<string>('')

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

  useEffect(() => {
    const mode = searchParams.get('mode')
    if (mode === 'wfh' && (!todayAttendance || !todayAttendance.clock_in)) {
      setAttendanceMode('wfh')
    }
  }, [searchParams, todayAttendance])

  const lockedAttendanceType = todayAttendance?.clock_in
    ? (todayAttendance.attendance_type || 'kantor')
    : null
  const isWfhMode = lockedAttendanceType ? lockedAttendanceType === 'wfh' : attendanceMode === 'wfh'
  const requiresOfficeRadius = !isWfhMode

  const showFormForIn = selectedTab === 'in' && (!todayAttendance || !todayAttendance.clock_in)
  const showFormForOut = selectedTab === 'out' && todayAttendance && todayAttendance.clock_in && !todayAttendance.clock_out
  const needsForm = showFormForIn || showFormForOut

  if (
    todayAttendance &&
    todayAttendance.clock_in &&
    todayAttendance.attendance_type !== 'kantor' &&
    todayAttendance.attendance_type !== 'wfh'
  ) {
    return (
      <div className="w-full max-w-4xl mx-auto pb-4">
        <section
          className="bg-white border border-slate-100 rounded-[20px] p-6 sm:p-8 text-center flex flex-col items-center gap-4"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100">
            <Building className="w-7 h-7 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Absen Kantor Tidak Aktif</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
              Hari ini Anda tercatat absensi{' '}
              <strong>{todayAttendance.attendance_type === 'kunjungan' ? 'kunjungan kerja' : 'kunjungan klien'}</strong>.
              Buka halaman absensi yang sesuai untuk check-out atau detail.
            </p>
          </div>
          <NavLink
            to={todayAttendance.attendance_type === 'kunjungan' ? '/employee/sales' : '/employee/client'}
            className="px-6 h-11 inline-flex items-center justify-center bg-[#FF5A00] hover:bg-[#E04800] text-white font-semibold rounded-2xl text-sm transition-all cursor-pointer"
            style={{ boxShadow: '0 6px 20px rgba(255,90,0,0.25)' }}
          >
            Buka Absen {todayAttendance.attendance_type === 'kunjungan' ? 'Sales' : 'Klien'}
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

  // Fetch shifts list on mount
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/shifts', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (response.data.status === 'success') {
          setShifts(response.data.data)
        }
      } catch (err) {
        console.error('Gagal mengambil daftar shift kerja:', err)
      }
    }
    fetchShifts()
  }, [token])

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

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxClientWidth = 640
        const scaleFactor = img.width > maxClientWidth ? maxClientWidth / img.width : 1
        canvas.width = img.width * scaleFactor
        canvas.height = img.height * scaleFactor
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6)
          setCapturedPhoto(compressedDataUrl)
          stopCamera()
        }
      }
    }
    reader.onerror = (err) => {
      console.error('File reading error:', err)
      Swal.fire({
        title: 'Gagal Membaca File',
        text: 'Terjadi kesalahan saat membaca file gambar.',
        icon: 'error',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: BRAND_ORANGE
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
    
    // Tentukan ukuran maksimal gambar di sisi client (lebar maks 640px)
    const maxClientWidth = 640
    const originalWidth = video.videoWidth || 1280
    const originalHeight = video.videoHeight || 720
    const scaleFactor = originalWidth > maxClientWidth ? maxClientWidth / originalWidth : 1
    canvas.width = originalWidth * scaleFactor
    canvas.height = originalHeight * scaleFactor

    const ctx = canvas.getContext('2d')
    if (ctx) {
      // Mirror if front-facing camera
      if (modalFacingMode === 'user') {
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      // Kompresi gambar langsung di client dengan kualitas 0.6 (60%)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6)
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

      // Handle Office Location boundary circle and marker (kantor mode only)
      if (isWfhMode) {
        if (officeMarkerRef.current) {
          map.removeLayer(officeMarkerRef.current)
          officeMarkerRef.current = null
        }
        if (boundaryCircleRef.current) {
          map.removeLayer(boundaryCircleRef.current)
          boundaryCircleRef.current = null
        }
        map.setView([latitude, longitude], 15)
      } else if (officeSetting) {
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
              color: BRAND_ORANGE,
              fillColor: '#FF5A00',
              fillOpacity: 0.12,
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
  }, [latitude, longitude, officeSetting, selectedTab, isWfhMode])

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
        confirmButtonColor: BRAND_ORANGE
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
        confirmButtonColor: BRAND_ORANGE
      })
      return
    }

    const isKantor = requiresOfficeRadius
    if (isKantor && officeSetting && !isWithinRadius) {
      Swal.fire({
        title: 'Di Luar Radius Kantor',
        text: `Anda tidak diizinkan melakukan absensi karena berada di luar radius batas kantor (Jarak Anda: ${Math.round(currentDistance || 0)} meter, Radius diizinkan: ${officeSetting.radius} meter).`,
        icon: 'error',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: BRAND_ORANGE
      })
      return
    }

    setSubmitting(true)
    try {
      const url = `http://localhost:8000/api/attendance/${type}`
      const payload: any = {
        latitude: String(latitude),
        longitude: String(longitude),
        photo: capturedPhoto,
        notes: notes,
      }
      if (type === 'check-in') {
        payload.attendance_type = isWfhMode ? 'wfh' : 'kantor'
        if (selectedShiftId) {
          payload.shift_id = parseInt(selectedShiftId, 10);
        }
      }
      const response = await axios.post(
        url,
        payload,
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
        confirmButtonColor: BRAND_ORANGE
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
    <div className="w-full space-y-5 sm:space-y-6 pb-4">
      {todayAttendance?.clock_in && (
        <div className="flex flex-wrap gap-2 text-[12px] font-semibold">
          <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
            Masuk: {todayAttendance.clock_in.substring(0, 5)}
          </span>
          {todayAttendance.clock_out ? (
            <span className="px-3 py-1.5 rounded-full bg-orange-50 text-[#C2410C] border border-orange-100">
              Keluar: {todayAttendance.clock_out.substring(0, 5)}
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Belum check-out
            </span>
          )}
        </div>
      )}

      {showFormForIn && !todayAttendance?.clock_in && (
        <div className="flex gap-2 p-1.5 bg-[#F8FAFC] border border-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setAttendanceMode('kantor')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold transition-all cursor-pointer border ${
              !isWfhMode
                ? 'bg-white border-slate-200 text-[#FF5A00] shadow-sm'
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building className="w-4 h-4" />
            Absen Kantor
          </button>
          <button
            type="button"
            onClick={() => setAttendanceMode('wfh')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold transition-all cursor-pointer border ${
              isWfhMode
                ? 'bg-white border-slate-200 text-[#FF5A00] shadow-sm'
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Home className="w-4 h-4" />
            Work From Home
          </button>
        </div>
      )}

      {/* Tab Selector */}
      <div className="flex gap-2 p-1.5 bg-[#F8FAFC] border border-slate-100 rounded-2xl">
        <button
          type="button"
          onClick={() => setSelectedTab('in')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold transition-all cursor-pointer border ${
            selectedTab === 'in'
              ? 'bg-white border-slate-200 text-[#FF5A00] shadow-sm'
              : 'bg-transparent border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          Check In
          {todayAttendance?.clock_in && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
        </button>
        <button
          type="button"
          onClick={() => setSelectedTab('out')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold transition-all cursor-pointer border ${
            selectedTab === 'out'
              ? 'bg-white border-slate-200 text-[#FF5A00] shadow-sm'
              : 'bg-transparent border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          Check Out
          {todayAttendance?.clock_out && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
        </button>
      </div>

      {/* Tab Content */}
      {selectedTab === 'in' ? (
        // Check-In Tab
        !todayAttendance || !todayAttendance.clock_in ? (
          // Form for Check-In
          <section className="bg-white border border-slate-100 rounded-[20px] p-4 sm:p-6 space-y-6" style={{ boxShadow: CARD_SHADOW }}>
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#FF5A00]" />
                  Check-In
                </h2>
                <p className="text-[13px] text-slate-500 mt-1">
                  {isWfhMode
                    ? 'Mode WFH — absensi dari lokasi manapun. Foto wajah dan GPS tetap wajib.'
                    : 'Foto wajah dan lokasi GPS wajib diisi (harus dalam radius kantor).'}
                </p>
              </div>
              <span className="self-start text-[12px] font-semibold uppercase tracking-wide text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                Belum masuk
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Column 1: Foto Presensi */}
              <div className="space-y-3">
                <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wide">
                  1. Foto wajah
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
                  <div className="rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/40 flex flex-col p-5 sm:p-6 min-h-[260px] sm:min-h-[280px]">
                    <div className="flex flex-col items-center justify-center gap-3 flex-1 text-center py-2">
                    <div className="w-16 h-16 rounded-2xl bg-[#FF5A00] flex items-center justify-center shadow-lg shadow-orange-500/20">
                      <Camera className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">Ambil foto wajah</p>
                      <p className="text-[12px] text-slate-400 mt-0.5">Kamera fullscreen di perangkat Anda</p>
                    </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2.5 w-full shrink-0 pt-1">
                      <button
                        type="button"
                        onClick={openCameraModal}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 min-h-[44px] h-11 sm:h-12 w-full bg-[#FF5A00] hover:bg-[#E04800] text-white rounded-2xl text-sm font-semibold transition-all cursor-pointer active:scale-[0.98] shrink-0"
                      >
                        <Camera className="w-4 h-4 shrink-0" /> Buka kamera
                      </button>
                      <label className="flex-1 inline-flex items-center justify-center gap-2 px-4 min-h-[44px] h-11 sm:h-12 w-full bg-white border border-slate-200 text-slate-700 rounded-2xl text-sm font-semibold transition-all cursor-pointer hover:bg-slate-50 active:scale-[0.98] shrink-0">
                        <Upload className="w-4 h-4 text-slate-500 shrink-0" /> Galeri
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Column 2: Peta */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wide">
                    2. Lokasi GPS
                  </label>
                  <button
                    type="button"
                    onClick={fetchLocation}
                    disabled={locationLoading}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#FF5A00] hover:text-[#E04800] cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${locationLoading ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                </div>

                <div className="relative w-full h-[220px] sm:h-[260px] rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden">
                  <div ref={setMapRef} id="employee-map-in" className="w-full h-full z-10" />
                  {locationLoading && (
                    <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center text-slate-600 text-center gap-2">
                      <RefreshCw className="w-7 h-7 animate-spin text-[#FF5A00]" />
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
                      <MapPin className="w-3.5 h-3.5 text-[#FF5A00]" />
                      <span className="font-semibold">Koordinat:</span>
                    </div>
                    {latitude && longitude ? (
                      <span className="text-slate-700 text-[11px] font-bold">{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
                    ) : (
                      <span className="text-slate-400 italic font-medium">Lokasi belum dikunci</span>
                    )}
                  </div>

                  {latitude && longitude && isWfhMode && (
                    <div className="p-3 rounded-xl border text-[11px] font-bold flex items-start gap-2 leading-relaxed text-sky-700 bg-sky-50 border-sky-200">
                      <Home className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                      <span>Mode Work From Home aktif — lokasi GPS dicatat tanpa batas radius kantor.</span>
                    </div>
                  )}

                  {latitude && longitude && !isWfhMode && officeSetting && currentDistance !== null && (
                    <div className={`p-3 rounded-xl border text-[11px] font-bold flex items-start gap-2 leading-relaxed ${isWithinRadius ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'}`}>
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
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#FF5A00]" />
                Shift hari ini
              </label>
              <select
                value={selectedShiftId}
                onChange={(e) => setSelectedShiftId(e.target.value)}
                className="w-full h-11 bg-[#F8FAFC] border border-slate-200 focus:border-[#FF5A00] focus:ring-2 focus:ring-orange-100 text-slate-800 rounded-xl py-2 px-4 outline-none text-sm font-medium cursor-pointer"
              >
                <option value="">
                  {new Date().getDay() === 6 ? 'Shift Reguler (08:30 - 14:00)' : 'Shift Reguler (08:30 - 17:30)'}
                </option>
                {shifts.map((shift) => {
                  const isRegulerSat = shift.name === 'Shift Reguler' && new Date().getDay() === 6
                  const displayEndTime = isRegulerSat ? '14:00' : shift.end_time.substring(0, 5)
                  return (
                    <option key={shift.id} value={shift.id}>
                      {shift.name} ({shift.start_time.substring(0, 5)} - {displayEndTime})
                    </option>
                  )
                })}
              </select>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100">
              <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-[#FF5A00]" />
                Catatan (opsional)
              </label>
              <textarea
                placeholder="Keterangan tambahan jika diperlukan…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-[#F8FAFC] border border-slate-200 focus:border-[#FF5A00] focus:ring-2 focus:ring-orange-100 text-slate-800 placeholder-slate-400 rounded-xl py-3 px-4 outline-none text-sm resize-none"
              />
            </div>

            <button
              type="button"
              onClick={() => handleAttendanceSubmit('check-in')}
              disabled={submitting || !capturedPhoto || !latitude || !longitude || (requiresOfficeRadius && officeSetting !== null && !isWithinRadius)}
              className="w-full sm:w-auto sm:ml-auto flex h-[52px] px-8 bg-[#FF5A00] hover:bg-[#E04800] text-white font-bold rounded-2xl transition-all cursor-pointer text-sm items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ boxShadow: '0 6px 20px rgba(255,90,0,0.25)' }}
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Mengirim…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Kirim check-in
                </>
              )}
            </button>
          </section>
        ) : (
          // Check-In Complete Details
          <section className="bg-white border border-slate-100 rounded-[20px] p-4 sm:p-6 space-y-6 relative overflow-hidden" style={{ boxShadow: CARD_SHADOW }}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Check-in tercatat</h2>
                  <p className="text-[13px] text-slate-500">Presensi masuk hari ini sudah tersimpan.</p>
                </div>
              </div>
              {getStatusBadge(todayAttendance.status_in)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-[#F8FAFC] border border-slate-100 p-4 space-y-4">
                <div>
                  <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide block">Waktu masuk</span>
                  <span className="text-3xl font-bold text-slate-800 tabular-nums">{todayAttendance.clock_in?.substring(0, 5)}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 text-sm">
                  <div>
                    <span className="text-[12px] font-semibold text-slate-500 uppercase block">Tipe</span>
                    <span className="font-semibold text-slate-800">{getAttendanceTypeLabel(todayAttendance.attendance_type)}</span>
                  </div>
                  <div>
                    <span className="text-[12px] font-semibold text-slate-500 uppercase block">Shift</span>
                    <span className="font-semibold text-slate-800 text-[13px] leading-snug">{getShiftLabelForAttendance(todayAttendance)}</span>
                  </div>
                </div>
                {todayAttendance.notes_in && (
                  <div className="pt-3 border-t border-slate-200">
                    <span className="text-[12px] font-semibold text-slate-500 uppercase block">Catatan</span>
                    <p className="text-sm text-slate-600 mt-1">{todayAttendance.notes_in}</p>
                  </div>
                )}
              </div>

              {todayAttendance.photo_in && (
                <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-100 bg-slate-100">
                  <img src={getAssetUrl(todayAttendance.photo_in)} alt="Foto check-in" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </section>
        )
      ) : (
        // Check-Out Tab
        !todayAttendance || !todayAttendance.clock_in ? (
          // Check-Out Blocked (Need Check-In First)
          <section
            className="bg-white border border-slate-100 rounded-[20px] p-8 sm:p-10 text-center flex flex-col items-center gap-4"
            style={{ boxShadow: CARD_SHADOW }}
          >
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100">
              <AlertTriangle className="w-7 h-7 text-rose-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Check-out belum tersedia</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                Lakukan check-in terlebih dahulu hari ini sebelum mencatat check-out.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTab('in')}
              className="h-11 px-6 bg-[#FF5A00] hover:bg-[#E04800] text-white font-semibold rounded-2xl text-sm transition-all cursor-pointer"
            >
              Ke tab Check In
            </button>
          </section>
        ) : !todayAttendance.clock_out ? (
          <section className="bg-white border border-slate-100 rounded-[20px] p-4 sm:p-6 space-y-6" style={{ boxShadow: CARD_SHADOW }}>
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#FF5A00]" />
                  Check-Out
                </h2>
                <p className="text-[13px] text-slate-500 mt-1">
                  {isWfhMode
                    ? 'Check-out WFH — foto wajah dan GPS wajib, tanpa batas radius kantor.'
                    : 'Foto wajah dan lokasi GPS wajib diisi (harus dalam radius kantor).'}
                </p>
              </div>
              <span className="self-start text-[12px] font-semibold uppercase tracking-wide text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                Belum keluar
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Column 1: Foto Presensi */}
              <div className="space-y-3">
                <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wide">
                  1. Foto wajah
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
                  <div className="rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/40 flex flex-col p-5 sm:p-6 min-h-[260px] sm:min-h-[280px]">
                    <div className="flex flex-col items-center justify-center gap-3 flex-1 text-center py-2">
                    <div className="w-16 h-16 rounded-2xl bg-[#FF5A00] flex items-center justify-center shadow-lg shadow-orange-500/20">
                      <Camera className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">Ambil foto wajah</p>
                      <p className="text-[12px] text-slate-400 mt-0.5">Kamera fullscreen di perangkat Anda</p>
                    </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2.5 w-full shrink-0 pt-1">
                      <button
                        type="button"
                        onClick={openCameraModal}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 min-h-[44px] h-11 sm:h-12 w-full bg-[#FF5A00] hover:bg-[#E04800] text-white rounded-2xl text-sm font-semibold transition-all cursor-pointer active:scale-[0.98] shrink-0"
                      >
                        <Camera className="w-4 h-4 shrink-0" /> Buka kamera
                      </button>
                      <label className="flex-1 inline-flex items-center justify-center gap-2 px-4 min-h-[44px] h-11 sm:h-12 w-full bg-white border border-slate-200 text-slate-700 rounded-2xl text-sm font-semibold transition-all cursor-pointer hover:bg-slate-50 active:scale-[0.98] shrink-0">
                        <Upload className="w-4 h-4 text-slate-500 shrink-0" /> Galeri
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Column 2: Peta */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wide">
                    2. Lokasi GPS
                  </label>
                  <button
                    type="button"
                    onClick={fetchLocation}
                    disabled={locationLoading}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#FF5A00] hover:text-[#E04800] cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${locationLoading ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                </div>

                <div className="relative w-full h-[220px] sm:h-[260px] rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden">
                  <div ref={setMapRef} id="employee-map-out" className="w-full h-full z-10" />
                  {locationLoading && (
                    <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center text-slate-600 text-center gap-2">
                      <RefreshCw className="w-7 h-7 animate-spin text-[#FF5A00]" />
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
                      <MapPin className="w-3.5 h-3.5 text-[#FF5A00]" />
                      <span className="font-semibold">Koordinat:</span>
                    </div>
                    {latitude && longitude ? (
                      <span className="text-slate-700 text-[11px] font-bold">{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
                    ) : (
                      <span className="text-slate-400 italic font-medium">Lokasi belum dikunci</span>
                    )}
                  </div>

                  {latitude && longitude && isWfhMode && (
                    <div className="p-3 rounded-xl border text-[11px] font-bold flex items-start gap-2 leading-relaxed text-sky-700 bg-sky-50 border-sky-200">
                      <Home className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                      <span>Mode Work From Home aktif — lokasi GPS dicatat tanpa batas radius kantor.</span>
                    </div>
                  )}

                  {latitude && longitude && !isWfhMode && officeSetting && currentDistance !== null && (
                    <div className={`p-3 rounded-xl border text-[11px] font-bold flex items-start gap-2 leading-relaxed ${isWithinRadius ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'}`}>
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

            <div className="space-y-2 pt-3 border-t border-slate-100">
              <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-[#FF5A00]" />
                Catatan (opsional)
              </label>
              <textarea
                placeholder="Keterangan tambahan jika diperlukan…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-[#F8FAFC] border border-slate-200 focus:border-[#FF5A00] focus:ring-2 focus:ring-orange-100 text-slate-800 placeholder-slate-400 rounded-xl py-3 px-4 outline-none text-sm resize-none"
              />
            </div>

            <button
              type="button"
              onClick={() => handleAttendanceSubmit('check-out')}
              disabled={submitting || !capturedPhoto || !latitude || !longitude || (requiresOfficeRadius && officeSetting !== null && !isWithinRadius)}
              className="w-full sm:w-auto sm:ml-auto flex h-[52px] px-8 bg-[#FF5A00] hover:bg-[#E04800] text-white font-bold rounded-2xl transition-all cursor-pointer text-sm items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ boxShadow: '0 6px 20px rgba(255,90,0,0.25)' }}
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Mengirim…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Kirim check-out
                </>
              )}
            </button>
          </section>
        ) : (
          <section className="bg-white border border-slate-100 rounded-[20px] p-4 sm:p-6 space-y-6 relative overflow-hidden" style={{ boxShadow: CARD_SHADOW }}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Check-out tercatat</h2>
                  <p className="text-[13px] text-slate-500">Presensi keluar hari ini sudah tersimpan.</p>
                </div>
              </div>
              {getStatusBadge(todayAttendance.status_out)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-[#F8FAFC] border border-slate-100 p-4 space-y-4">
                <div>
                  <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide block">Waktu keluar</span>
                  <span className="text-3xl font-bold text-slate-800 tabular-nums">{todayAttendance.clock_out?.substring(0, 5)}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 text-sm">
                  <div>
                    <span className="text-[12px] font-semibold text-slate-500 uppercase block">Tipe</span>
                    <span className="font-semibold text-slate-800">{getAttendanceTypeLabel(todayAttendance.attendance_type)}</span>
                  </div>
                  <div>
                    <span className="text-[12px] font-semibold text-slate-500 uppercase block">Shift</span>
                    <span className="font-semibold text-slate-800 text-[13px] leading-snug">{getShiftLabelForAttendance(todayAttendance)}</span>
                  </div>
                </div>
                {todayAttendance.notes_out && (
                  <div className="pt-3 border-t border-slate-200">
                    <span className="text-[12px] font-semibold text-slate-500 uppercase block">Catatan</span>
                    <p className="text-sm text-slate-600 mt-1">{todayAttendance.notes_out}</p>
                  </div>
                )}
              </div>

              {todayAttendance.photo_out && (
                <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-100 bg-slate-100">
                  <img src={getAssetUrl(todayAttendance.photo_out)} alt="Foto check-out" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </section>
        )
      )}

      <aside
        className="rounded-[20px] border border-orange-100 bg-orange-50/40 p-4 sm:p-5 flex gap-3 items-start"
        style={{ boxShadow: CARD_SHADOW }}
      >
        <div className="w-10 h-10 rounded-xl bg-white border border-orange-100 flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5 text-[#FF5A00]" />
        </div>
        <div className="min-w-0 text-[13px] text-slate-600 leading-relaxed">
          <p className="font-bold text-slate-800 mb-1">Tips absensi kantor</p>
          <p>
            Aktifkan GPS, ambil foto wajah yang jelas, dan pastikan posisi Anda di dalam radius kantor sebelum
            mengirim presensi.
          </p>
          <NavLink
            to="/employee/riwayat"
            className="inline-flex items-center gap-1 mt-2.5 text-[#FF5A00] font-semibold hover:text-[#E04800] transition-colors"
          >
            Lihat riwayat presensi
            <span aria-hidden>→</span>
          </NavLink>
        </div>
      </aside>
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
              <span className="text-white text-sm font-bold tracking-wide drop-shadow px-3 py-1 bg-black/40 rounded-full backdrop-blur-sm">
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
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#FF5A00] hover:bg-[#E04800] text-white font-bold rounded-2xl text-sm shadow-lg shadow-orange-500/25 transition-all active:scale-95 cursor-pointer"
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

              <span className="text-white text-sm font-bold tracking-wide drop-shadow px-3 py-1 bg-black/30 rounded-full backdrop-blur-sm">
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
