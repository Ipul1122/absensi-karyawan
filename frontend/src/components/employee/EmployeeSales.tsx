import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import L from 'leaflet'
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
  Compass,
  Upload,
  Plus,
  X
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

interface EmployeeSalesProps {
  token: string
  todayAttendance: Attendance | null
  officeSetting: OfficeSetting | null
  fetchTodayAttendance: () => Promise<void>
  fetchHistory: () => Promise<void>
  getStatusBadge: (status: string | null) => React.ReactNode
}

export default function EmployeeSales({
  token,
  todayAttendance,
  officeSetting,
  fetchTodayAttendance,
  fetchHistory,
  getStatusBadge
}: EmployeeSalesProps) {
  const [selectedTab, setSelectedTab] = useState<'in' | 'out'>('in')
  const [submitting, setSubmitting] = useState(false)

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

  // Sales/Field Visit States
  const [visitClientName, setVisitClientName] = useState('')
  const [visitNotes, setVisitNotes] = useState('')
  const [visitSubmitting, setVisitSubmitting] = useState(false)
  const [visitsList, setVisitsList] = useState<any[]>([])
  const [visitsLoading, setVisitsLoading] = useState(false)

  // Visit Status/State for Check-Out Lock
  const [isVisitEnded, setIsVisitEnded] = useState(() => {
    if (!todayAttendance) return false;
    return localStorage.getItem(`visit_ended_${todayAttendance.id}`) === 'true';
  });

  useEffect(() => {
    if (todayAttendance) {
      setIsVisitEnded(localStorage.getItem(`visit_ended_${todayAttendance.id}`) === 'true');
    } else {
      setIsVisitEnded(false);
    }
  }, [todayAttendance]);

  // Camera & Geolocation for Visits
  const [visitLatitude, setVisitLatitude] = useState<number | null>(null)
  const [visitLongitude, setVisitLongitude] = useState<number | null>(null)
  const [visitLocationLoading, setVisitLocationLoading] = useState(false)
  const [visitLocationError, setVisitLocationError] = useState<string | null>(null)
  const [visitCapturedPhoto, setVisitCapturedPhoto] = useState<string | null>(null)
  const [visitStream, setVisitStream] = useState<MediaStream | null>(null)
  const [visitCameraError, setVisitCameraError] = useState<string | null>(null)
  const [showVisitModal, setShowVisitModal] = useState(false)
  const visitVideoRef = useRef<HTMLVideoElement | null>(null)
  const visitCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const fetchVisitLocation = () => {
    setVisitLocationLoading(true)
    setVisitLocationError(null)

    if (!navigator.geolocation) {
      setVisitLocationError('Geolokasi tidak didukung oleh browser Anda.')
      setVisitLocationLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setVisitLatitude(position.coords.latitude)
        setVisitLongitude(position.coords.longitude)
        setVisitLocationLoading(false)
      },
      (err) => {
        console.error('Visit geolocation error:', err)
        setVisitLocationError('Gagal mendeteksi lokasi. Pastikan izin lokasi aktif.')
        setVisitLocationLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const startVisitCamera = async () => {
    setVisitCameraError(null)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      })
      setVisitStream(mediaStream)
      if (visitVideoRef.current) {
        visitVideoRef.current.srcObject = mediaStream
      }
    } catch (err: any) {
      console.error('Visit camera access error:', err)
      setVisitCameraError('Gagal mengakses kamera. Mohon berikan izin kamera.')
    }
  }

  const stopVisitCamera = () => {
    if (visitStream) {
      visitStream.getTracks().forEach((track) => track.stop())
      setVisitStream(null)
    }
  }

  const captureVisitPhoto = () => {
    if (visitVideoRef.current && visitCanvasRef.current) {
      const video = visitVideoRef.current
      const canvas = visitCanvasRef.current
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg')
        setVisitCapturedPhoto(dataUrl)
        stopVisitCamera()
      }
    }
  }

  const handleVisitImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 3 * 1024 * 1024) {
      Swal.fire({
        title: 'Ukuran File Terlalu Besar',
        text: 'Ukuran foto maksimal adalah 3MB.',
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
      setVisitCapturedPhoto(dataUrl)
      stopVisitCamera()
    }
    reader.readAsDataURL(file)
  }

  const retakeVisitPhoto = () => {
    setVisitCapturedPhoto(null)
    startVisitCamera()
  }

  const fetchTodayVisits = async () => {
    if (!todayAttendance || !todayAttendance.clock_in) return
    setVisitsLoading(true)
    try {
      const response = await axios.get('http://localhost:8000/api/sales-visits/today', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setVisitsList(response.data.data)
      }
    } catch (err) {
      console.error('Gagal mengambil data kunjungan hari ini:', err)
    } finally {
      setVisitsLoading(false)
    }
  }

  useEffect(() => {
    fetchTodayVisits()
  }, [todayAttendance])

  useEffect(() => {
    if (showVisitModal) {
      fetchVisitLocation()
      startVisitCamera()
    } else {
      stopVisitCamera()
      setVisitCapturedPhoto(null)
      setVisitClientName('')
      setVisitNotes('')
      setVisitLatitude(null)
      setVisitLongitude(null)
      setVisitCameraError(null)
      setVisitLocationError(null)
    }
    return () => {
      stopVisitCamera()
    }
  }, [showVisitModal])

  useEffect(() => {
    if (visitVideoRef.current && visitStream && visitVideoRef.current.srcObject !== visitStream) {
      visitVideoRef.current.srcObject = visitStream;
    }
  }, [visitStream]);

  const handleVisitSubmit = async () => {
    if (!visitClientName) {
      Swal.fire({
        title: 'Nama Klien Wajib',
        text: 'Silakan isi nama klien atau lokasi kunjungan terlebih dahulu.',
        icon: 'warning',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#6366f1'
      })
      return
    }

    if (!visitCapturedPhoto) {
      Swal.fire({
        title: 'Foto Wajib',
        text: 'Silakan ambil foto bukti kunjungan terlebih dahulu.',
        icon: 'warning',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#6366f1'
      })
      return
    }

    if (!visitLatitude || !visitLongitude) {
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

    setVisitSubmitting(true)
    try {
      const response = await axios.post(
        'http://localhost:8000/api/sales-visits',
        {
          client_name: visitClientName,
          latitude: String(visitLatitude),
          longitude: String(visitLongitude),
          photo: visitCapturedPhoto,
          notes: visitNotes,
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
        
        setShowVisitModal(false)
        await fetchTodayVisits()
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal melaporkan kunjungan sales.'
      Swal.fire({
        title: 'Kesalahan Pelaporan',
        text: msg,
        icon: 'error',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#ef4444'
      })
    } finally {
      setVisitSubmitting(false)
    }
  }

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

  if (todayAttendance && todayAttendance.clock_in && todayAttendance.attendance_type !== 'kunjungan') {
    return (
      <div className="space-y-6">
        <section className="bg-white border border-orange-100 rounded-3xl p-8 text-center shadow-sm flex flex-col items-center justify-center gap-4">
          <div className="p-4 bg-amber-50 rounded-full border border-amber-200 text-amber-600">
            <Compass className="w-10 h-10 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 font-quicksand">Absen Kunjungan Lapangan Tidak Aktif</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed font-medium font-quicksand">
              Hari ini Anda tercatat melakukan absensi tipe <strong className="capitalize">{todayAttendance.attendance_type === 'kantor' ? 'Absen Kantor' : 'Kunjungan Klien'}</strong>.
              <br />
              Silakan buka halaman absensi yang sesuai untuk melihat detail atau melakukan absen keluar.
            </p>
          </div>
          <NavLink
            to={todayAttendance.attendance_type === 'kantor' ? '/employee/absen' : '/employee/client'}
            className="mt-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-655 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer font-quicksand"
          >
            Buka Absen {todayAttendance.attendance_type === 'kantor' ? 'Kantor' : 'Kunjungan Klien'}
          </NavLink>
        </section>
      </div>
    )
  }

  useEffect(() => {
    setCapturedPhoto(null)
    setNotes('')
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

  useEffect(() => {
    if (needsForm) {
      fetchLocation()
    }
  }, [needsForm])

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

  useEffect(() => {
    if (!capturedPhoto && needsForm) {
      startCamera()
    }
    return () => {
      stopCamera()
    }
  }, [capturedPhoto, needsForm])

  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && stream && el.srcObject !== stream) {
      el.srcObject = stream;
    }
  }, [stream]);

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
    reader.readAsDataURL(file)
  }

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

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!latitude || !longitude || !mapRef.current) return

    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })

    const officeIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })

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

    if (employeeMarkerRef.current) {
      employeeMarkerRef.current.setLatLng([latitude, longitude])
    } else {
      employeeMarkerRef.current = L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup('Lokasi GPS Anda')
        .openPopup()
    }

    if (officeSetting) {
      const officeLat = parseFloat(officeSetting.latitude)
      const officeLng = parseFloat(officeSetting.longitude)

      if (officeMarkerRef.current) {
        officeMarkerRef.current.setLatLng([officeLat, officeLng])
      } else {
        officeMarkerRef.current = L.marker([officeLat, officeLng], { icon: officeIcon })
          .addTo(map)
          .bindPopup('Lokasi Kantor')
      }

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
  }, [latitude, longitude, officeSetting, selectedTab])

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

  const handleAttendanceSubmit = async (type: 'check-in' | 'check-out') => {
    if (!capturedPhoto) {
      Swal.fire({
        title: 'Foto Wajib',
        text: 'Silakan ambil foto wajah Anda terlebih dahulu.',
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
          attendance_type: 'kunjungan'
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

        if (type === 'check-out') {
          localStorage.removeItem(`visit_ended_${todayAttendance?.id}`);
          setIsVisitEnded(false);
        }
        
        setCapturedPhoto(null)
        setNotes('')
        
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
    <div className="space-y-6">
      {/* Tab Selector */}
      <div className="flex bg-orange-50/30 border border-orange-100 rounded-2xl p-1.5 backdrop-blur-xl">
        <button
          onClick={() => setSelectedTab('in')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            selectedTab === 'in'
              ? 'bg-gradient-to-r from-red-55 to-orange-55 border border-orange-200/50 text-red-600 font-extrabold shadow-sm'
              : 'text-slate-500 hover:text-red-500 border border-transparent'
          }`}
        >
          <Clock className="w-4.5 h-4.5" />
          Absen Masuk Kunjungan
          {todayAttendance?.clock_in && todayAttendance.attendance_type === 'kunjungan' && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          )}
        </button>
        <button
          onClick={() => setSelectedTab('out')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            selectedTab === 'out'
              ? 'bg-gradient-to-r from-red-55 to-orange-55 border border-orange-200/50 text-red-600 font-extrabold shadow-sm'
              : 'text-slate-500 hover:text-red-500 border border-transparent'
          }`}
        >
          <Clock className="w-4.5 h-4.5" />
          Absen Keluar Kunjungan
          {todayAttendance?.clock_out && todayAttendance.attendance_type === 'kunjungan' && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {selectedTab === 'in' ? (
        !todayAttendance || !todayAttendance.clock_in ? (
          <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="border-b border-orange-100 pb-3 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 font-quicksand">
                  <Camera className="w-5 h-5 text-red-500" />
                  Presensi Masuk: Kunjungan Kerja / Lapangan
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
              {/* Column 1: Kamera */}
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-quicksand">
                  1. Foto Kamera Webcam
                </label>
                <div className="relative aspect-video w-full rounded-2xl bg-slate-100 border border-orange-100/60 overflow-hidden flex items-center justify-center shadow-inner">
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
                        <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-rose-700 gap-2 font-quicksand">
                          <AlertCircle className="w-8 h-8 text-rose-500" />
                          <p className="text-xs font-semibold leading-relaxed">{cameraError}</p>
                          <div className="flex flex-wrap gap-2 justify-center mt-2">
                            <button onClick={startCamera} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer">
                              Coba Lagi
                            </button>
                            <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-650 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm">
                              <Upload className="w-3.5 h-3.5" /> Pilih dari Galeri
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleImageUpload} 
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                <div className="flex gap-3 justify-center">
                  {capturedPhoto ? (
                    <button onClick={retakePhoto} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer font-quicksand shadow-sm">
                      <RefreshCw className="w-3.5 h-3.5" /> Ambil Ulang Foto
                    </button>
                  ) : (
                    <>
                      <button onClick={capturePhoto} disabled={!!cameraError} className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-red-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-quicksand">
                        <Camera className="w-4 h-4" /> Tangkap Foto Wajah
                      </button>
                      {cameraError && (
                        <label className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer font-quicksand shadow-sm">
                          <Upload className="w-4 h-4 text-red-500" /> Pilih dari Galeri
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleImageUpload} 
                          />
                        </label>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Column 2: Peta */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider font-quicksand">
                    2. Lokasi Geolocation (GPS)
                  </label>
                  <button onClick={fetchLocation} disabled={locationLoading} className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-655 cursor-pointer font-quicksand">
                    <RefreshCw className={`w-3.5 h-3.5 ${locationLoading ? 'animate-spin' : ''}`} /> Cari Ulang
                  </button>
                </div>

                <div className="relative w-full h-[220px] rounded-2xl bg-slate-50 border border-orange-100/60 overflow-hidden flex items-center justify-center">
                  <div ref={mapRef} id="employee-map" className="w-full h-full z-10" />
                  {locationLoading && (
                    <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center text-slate-650 text-center gap-2">
                      <RefreshCw className="w-7 h-7 animate-spin text-red-500" />
                      <p className="text-xs font-semibold">Mengunci GPS...</p>
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
                      <span className="text-slate-450 italic font-quicksand font-semibold">Lokasi belum dikunci</span>
                    )}
                  </div>

                  {latitude && longitude && (
                    <div className="p-3 rounded-xl border text-[11px] font-bold flex items-start gap-2 leading-relaxed text-emerald-700 bg-emerald-50 border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Lokasi siap untuk absensi Kunjungan Kerja (Jarak ke kantor: {currentDistance !== null ? `${Math.round(currentDistance)}m` : 'mengalkulasi...'}). Radius kantor dinonaktifkan.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-orange-100">
              <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider flex items-center gap-1 font-quicksand">
                <FileText className="w-3.5 h-3.5 text-red-500" />
                Catatan Presensi (Opsional)
              </label>
              <textarea placeholder="Tambahkan pesan keterangan kunjungan atau tugas dinas lapangan..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 px-4 outline-none transition-all text-xs resize-none font-medium font-quicksand" />
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => handleAttendanceSubmit('check-in')} disabled={submitting || !capturedPhoto || !latitude || !longitude} className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-orange-600/10 cursor-pointer text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed font-quicksand">
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Mengirim...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Kirim Absen Masuk Kunjungan
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
                  <h2 className="text-lg font-bold text-slate-800 font-quicksand">Absen Kunjungan Masuk Tercatat!</h2>
                  <p className="text-xs text-slate-500">Anda sudah absen masuk kunjungan kerja hari ini.</p>
                </div>
              </div>
              {getStatusBadge(todayAttendance.status_in)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
              <div className="md:col-span-7 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-quicksand">Waktu Masuk Kunjungan</span>
                    <span className="text-3xl font-extrabold text-slate-800 font-mono">{todayAttendance.clock_in}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-quicksand">Tipe Presensi</span>
                      <span className="text-xs text-slate-700 font-extrabold capitalize">{todayAttendance.attendance_type}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-quicksand">Latitude GPS</span>
                      <span className="text-xs text-slate-655 font-mono">{todayAttendance.latitude_in}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-quicksand">Longitude GPS</span>
                      <span className="text-xs text-slate-655 font-mono">{todayAttendance.longitude_in}</span>
                    </div>
                  </div>
                  {todayAttendance.notes_in && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-quicksand">Catatan</span>
                      <p className="text-xs text-slate-655 mt-1 font-medium font-quicksand">{todayAttendance.notes_in}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-5">
                {todayAttendance.photo_in && (
                  <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner">
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
          <section className="bg-white border border-orange-100 rounded-3xl p-12 text-center shadow-sm flex flex-col items-center justify-center gap-4">
            <div className="p-4 bg-rose-50 rounded-full border border-rose-200 text-rose-600">
              <AlertTriangle className="w-10 h-10 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 font-quicksand">Absen Keluar Belum Tersedia</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed font-medium">
                Anda harus melakukan **Absen Masuk (Check-In)** Kunjungan terlebih dahulu sebelum dapat mencatat Absen Keluar (Check-Out).
              </p>
            </div>
          </section>
        ) : !todayAttendance.clock_out ? (
          todayAttendance.attendance_type === 'kunjungan' && !isVisitEnded ? (
            <section className="bg-white border border-orange-100 rounded-3xl p-8 text-center shadow-sm flex flex-col items-center justify-center gap-4">
              <div className="p-4 bg-orange-50 rounded-full border border-orange-200 text-orange-600 animate-pulse">
                <Compass className="w-10 h-10 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 font-quicksand">Kunjungan Kerja / Lapangan Sedang Aktif</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed font-medium">
                  Pastikan Anda melaporkan aktivitas kunjungan Anda di menu laporan bawah terlebih dahulu.
                  <br />
                  Jika seluruh agenda dinas luar Anda hari ini telah selesai, silakan tekan tombol **Akhiri Kunjungan** di bawah untuk membuka formulir **Absen Keluar (Check-Out)**.
                </p>
              </div>
              <button
                onClick={() => {
                  localStorage.setItem(`visit_ended_${todayAttendance.id}`, 'true');
                  setIsVisitEnded(true);
                  Swal.fire({
                    title: 'Kunjungan Diakhiri!',
                    text: 'Formulir Absen Keluar (Check-Out) sekarang terbuka.',
                    icon: 'success',
                    background: '#1e293b',
                    color: '#f8fafc',
                    confirmButtonColor: '#6366f1'
                  });
                }}
                className="mt-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-655 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-orange-500/10 cursor-pointer font-quicksand flex items-center gap-2"
              >
                <Compass className="w-4.5 h-4.5" />
                Akhiri Kunjungan Lapangan
              </button>
            </section>
          ) : (
            <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="border-b border-orange-100 pb-3 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 font-quicksand">
                    <Camera className="w-5 h-5 text-red-500" />
                    Formulir Presensi: Keluar Kunjungan (Check-Out)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Harap ambil foto wajah dan aktifkan lokasi GPS Anda.</p>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-quicksand">
                    Belum Keluar
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1: Kamera */}
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-quicksand">
                    1. Foto Kamera Webcam
                  </label>
                  <div className="relative aspect-video w-full rounded-2xl bg-slate-100 border border-orange-100/60 overflow-hidden flex items-center justify-center shadow-inner">
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
                          <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-rose-700 gap-2 font-quicksand">
                            <AlertCircle className="w-8 h-8 text-rose-500" />
                            <p className="text-xs font-semibold leading-relaxed">{cameraError}</p>
                            <div className="flex flex-wrap gap-2 justify-center mt-2">
                              <button onClick={startCamera} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer">
                                Coba Lagi
                              </button>
                              <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm">
                                <Upload className="w-3.5 h-3.5" /> Pilih dari Galeri
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={handleImageUpload} 
                                />
                              </label>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>

                  <div className="flex gap-3 justify-center">
                    {capturedPhoto ? (
                      <button onClick={retakePhoto} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer font-quicksand shadow-sm">
                        <RefreshCw className="w-3.5 h-3.5" /> Ambil Ulang Foto
                      </button>
                    ) : (
                      <>
                        <button onClick={capturePhoto} disabled={!!cameraError} className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-red-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-quicksand">
                          <Camera className="w-4 h-4" /> Tangkap Foto Wajah
                        </button>
                        {cameraError && (
                          <label className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer font-quicksand shadow-sm">
                            <Upload className="w-4 h-4 text-red-500" /> Pilih dari Galeri
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={handleImageUpload} 
                            />
                          </label>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Column 2: Peta */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-quicksand">
                      2. Lokasi Geolocation (GPS)
                    </label>
                    <button onClick={fetchLocation} disabled={locationLoading} className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-655 cursor-pointer font-quicksand">
                      <RefreshCw className={`w-3.5 h-3.5 ${locationLoading ? 'animate-spin' : ''}`} /> Cari Ulang
                    </button>
                  </div>

                  <div className="relative w-full h-[220px] rounded-2xl bg-slate-50 border border-orange-100/60 overflow-hidden flex items-center justify-center">
                    <div ref={mapRef} id="employee-map" className="w-full h-full z-10" />
                    {locationLoading && (
                      <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center text-slate-655 text-center gap-2">
                        <RefreshCw className="w-7 h-7 animate-spin text-red-500" />
                        <p className="text-xs font-semibold">Mengunci GPS...</p>
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
                        <span className="text-slate-450 italic font-quicksand font-semibold">Lokasi belum dikunci</span>
                      )}
                    </div>

                    {latitude && longitude && (
                      <div className="p-3 rounded-xl border text-[11px] font-bold flex items-start gap-2 leading-relaxed text-emerald-700 bg-emerald-50 border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Lokasi siap untuk absensi Keluar Kunjungan. Radius kantor dinonaktifkan.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-orange-100">
                <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider flex items-center gap-1 font-quicksand">
                  <FileText className="w-3.5 h-3.5 text-red-500" />
                  Catatan Presensi (Opsional)
                </label>
                <textarea placeholder="Tambahkan pesan laporan singkat akhir dinas luar..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 px-4 outline-none transition-all text-xs resize-none font-medium font-quicksand" />
              </div>

              <div className="pt-2 flex justify-end">
                <button onClick={() => handleAttendanceSubmit('check-out')} disabled={submitting || !capturedPhoto || !latitude || !longitude} className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-orange-600/10 cursor-pointer text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed font-quicksand">
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Mengirim...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Kirim Absen Keluar Kunjungan
                    </>
                  )}
                </button>
              </div>
            </section>
          )
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
                  <h2 className="text-lg font-bold text-slate-800 font-quicksand">Absen Keluar Kunjungan Tercatat!</h2>
                  <p className="text-xs text-slate-500">Anda sudah melakukan absen keluar kunjungan kerja untuk hari ini.</p>
                </div>
              </div>
              {getStatusBadge(todayAttendance.status_out)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
              <div className="md:col-span-7 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-quicksand">Waktu Keluar Kunjungan</span>
                    <span className="text-3xl font-extrabold text-slate-800 font-mono">{todayAttendance.clock_out}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold text-slate-555 uppercase tracking-wider block font-quicksand">Tipe Presensi</span>
                      <span className="text-xs text-slate-700 font-extrabold capitalize">{todayAttendance.attendance_type}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-555 uppercase tracking-wider block font-quicksand">Latitude GPS</span>
                      <span className="text-xs text-slate-655 font-mono">{todayAttendance.latitude_out}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-555 uppercase tracking-wider block font-quicksand">Longitude GPS</span>
                      <span className="text-xs text-slate-655 font-mono">{todayAttendance.longitude_out}</span>
                    </div>
                  </div>
                  {todayAttendance.notes_out && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-quicksand">Catatan Anda</span>
                      <p className="text-xs text-slate-655 mt-1 font-medium font-quicksand">{todayAttendance.notes_out}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-5">
                {todayAttendance.photo_out && (
                  <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner">
                    <img src={`http://localhost:8000${todayAttendance.photo_out}`} alt="Foto Check Out" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </section>
        )
      )}

      {/* Sales Visit Section */}
      {todayAttendance && todayAttendance.clock_in && todayAttendance.attendance_type === 'kunjungan' && (
        <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="border-b border-orange-100 pb-3 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 font-quicksand">
                <Compass className="w-5 h-5 text-orange-500" />
                Laporan Kunjungan Lapangan / Sales
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Gunakan formulir ini untuk melaporkan setiap kunjungan ke klien atau lapangan selama jam kerja.
              </p>
            </div>
            {!todayAttendance.clock_out && (
              <button
                onClick={() => setShowVisitModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-655 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/10 cursor-pointer transition-all flex items-center gap-1.5 font-quicksand"
              >
                <Plus className="w-4 h-4" /> Lapor Kunjungan Baru
              </button>
            )}
          </div>

          {/* Visits Timeline / List */}
          {visitsLoading ? (
            <div className="flex justify-center py-6">
              <RefreshCw className="w-6 h-6 text-orange-500 animate-spin" />
            </div>
          ) : visitsList.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Compass className="w-12 h-12 mx-auto text-slate-300 animate-pulse mb-2" />
              <p className="text-sm font-semibold">Belum ada kunjungan yang dilaporkan hari ini.</p>
              <p className="text-xs">Klik "Lapor Kunjungan Baru" untuk menambahkan laporan.</p>
            </div>
          ) : (
            <div className="relative border-l border-orange-150 ml-4 space-y-6 py-2">
              {visitsList.map((visit) => (
                <div key={visit.id} className="relative pl-6">
                  {/* Timeline dot */}
                  <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center shadow-sm"></div>
                  
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-start justify-between shadow-sm">
                    <div className="space-y-2 flex-grow">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-800 font-quicksand">
                          {visit.client_name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-100 font-bold font-mono">
                          {visit.visit_time.substring(0, 5)}
                        </span>
                      </div>
                      
                      {visit.notes && (
                        <p className="text-xs text-slate-655 font-medium font-quicksand leading-relaxed">
                          {visit.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                        <span>{parseFloat(visit.latitude).toFixed(6)}, {parseFloat(visit.longitude).toFixed(6)}</span>
                      </div>
                    </div>

                    {visit.photo_path && (
                      <div className="w-24 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100 cursor-pointer hover:opacity-90 transition-all shadow-sm" onClick={() => {
                        Swal.fire({
                          imageUrl: `http://localhost:8000${visit.photo_path}`,
                          imageAlt: `Foto Kunjungan ${visit.client_name}`,
                          background: '#1e293b',
                          color: '#f8fafc',
                          showConfirmButton: false,
                        })
                      }}>
                        <img src={`http://localhost:8000${visit.photo_path}`} alt="Bukti Kunjungan" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Sales Visit Modal */}
      {showVisitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-950/20 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white border border-orange-100 rounded-3xl p-6 max-w-md w-full relative shadow-xl overflow-hidden animate-zoom-in my-8 max-h-[90vh] overflow-y-auto font-quicksand">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-500 via-red-500 to-transparent"></div>

            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <Compass className="w-5 h-5 text-orange-500" /> Laporkan Kunjungan Baru
              </h3>
              <button
                onClick={() => setShowVisitModal(false)}
                className="p-1.5 hover:bg-orange-50/50 rounded-lg transition-all cursor-pointer text-slate-400 hover:text-red-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Client Name Input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nama Klien / Instansi / Toko *
                </label>
                <input
                  type="text"
                  value={visitClientName}
                  onChange={(e) => setVisitClientName(e.target.value)}
                  placeholder="Misal: PT. Sumber Makmur"
                  className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-semibold"
                  required
                />
              </div>

              {/* Photo Input (Webcam / Upload) */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Ambil Foto Bukti Kunjungan *
                </label>
                <div className="relative aspect-video w-full rounded-2xl bg-slate-100 border border-orange-100/60 overflow-hidden flex items-center justify-center shadow-inner">
                  {visitCapturedPhoto ? (
                    <img src={visitCapturedPhoto} alt="Foto Bukti Kunjungan" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <video 
                        ref={visitVideoRef}
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover transform -scale-x-100" 
                      />
                      {visitCameraError && (
                        <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-rose-700 gap-2 font-quicksand">
                          <AlertCircle className="w-8 h-8 text-rose-500" />
                          <p className="text-xs font-semibold leading-relaxed">{visitCameraError}</p>
                          <div className="flex flex-wrap gap-2 justify-center mt-2">
                            <button onClick={startVisitCamera} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer">
                              Coba Lagi
                            </button>
                            <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-650 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm">
                              <Upload className="w-3.5 h-3.5" /> Pilih dari Galeri
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleVisitImageUpload} 
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <canvas ref={visitCanvasRef} className="hidden" />
                </div>

                <div className="flex gap-3 justify-center mt-3">
                  {visitCapturedPhoto ? (
                    <button onClick={retakeVisitPhoto} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer font-quicksand shadow-sm">
                      <RefreshCw className="w-3.5 h-3.5" /> Ambil Ulang Foto
                    </button>
                  ) : (
                    <>
                      <button onClick={captureVisitPhoto} disabled={!!visitCameraError} className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-red-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-quicksand">
                        <Camera className="w-4 h-4" /> Tangkap Foto Bukti
                      </button>
                      {visitCameraError && (
                        <label className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer font-quicksand shadow-sm">
                          <Upload className="w-4 h-4 text-red-500" /> Pilih dari Galeri
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleVisitImageUpload} 
                          />
                        </label>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Location Tracker */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider">
                    Koordinat Geolocation (GPS) *
                  </label>
                  <button onClick={fetchVisitLocation} disabled={visitLocationLoading} className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-655 cursor-pointer font-quicksand">
                    <RefreshCw className={`w-3.5 h-3.5 ${visitLocationLoading ? 'animate-spin' : ''}`} /> Cari Ulang
                  </button>
                </div>
                
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-slate-550">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span className="font-quicksand font-bold">Koordinat:</span>
                  </div>
                  {visitLatitude && visitLongitude ? (
                    <span className="text-slate-700 text-[11px] font-bold">{visitLatitude.toFixed(6)}, {visitLongitude.toFixed(6)}</span>
                  ) : (
                    <span className="text-slate-450 italic font-quicksand font-semibold">
                      {visitLocationLoading ? 'Mengunci GPS...' : 'Lokasi belum dikunci'}
                    </span>
                  )}
                </div>
                {visitLocationError && (
                  <p className="text-[10px] text-rose-600 font-semibold leading-relaxed mt-1">
                    {visitLocationError}
                  </p>
                )}
              </div>

              {/* Notes input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Catatan / Laporan Hasil Kunjungan (Opsional)
                </label>
                <textarea
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="Misal: Bertemu dengan Pak Budi, membicarakan kontrak kerjasama baru..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 px-4 outline-none transition-all text-xs resize-none font-medium font-quicksand"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-orange-50">
                <button
                  type="button"
                  onClick={() => setShowVisitModal(false)}
                  className="px-4 py-2.5 bg-orange-50/50 border border-orange-100 hover:bg-orange-50 text-slate-600 rounded-xl transition-all cursor-pointer text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleVisitSubmit}
                  disabled={visitSubmitting || !visitCapturedPhoto || !visitLatitude || !visitLongitude || !visitClientName}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {visitSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    'Laporkan Kunjungan'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
