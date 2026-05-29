import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import L from 'leaflet'
import { 
  Clock, 
  Camera, 
  RefreshCw, 
  AlertCircle, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Check
} from 'lucide-react'


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

  // Reset camera/photo states when tab changes
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

  // Fetch location when form is active
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

  // Control camera startup and shutdown
  useEffect(() => {
    if (!capturedPhoto && needsForm) {
      startCamera()
    }
    return () => {
      stopCamera()
    }
  }, [capturedPhoto, needsForm])

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
          Absen Masuk (Check-In)
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
          Absen Keluar (Check-Out)
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
                        <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-rose-700 gap-2">
                          <AlertCircle className="w-8 h-8 text-rose-500" />
                          <p className="text-xs font-semibold leading-relaxed">{cameraError}</p>
                          <button onClick={startCamera} className="px-4 py-2 mt-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer">
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
                    <button onClick={retakePhoto} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer font-quicksand shadow-sm">
                      <RefreshCw className="w-3.5 h-3.5" /> Ambil Ulang Foto
                    </button>
                  ) : (
                    <button onClick={capturePhoto} disabled={!!cameraError} className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-red-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-quicksand">
                      <Camera className="w-4 h-4" /> Tangkap Foto Wajah
                    </button>
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
                    <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center text-slate-650 text-center gap-2">
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
                      <span className="text-slate-450 italic font-quicksand font-semibold">Lokasi belum dikunci</span>
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
              <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider flex items-center gap-1 font-quicksand">
                <FileText className="w-3.5 h-3.5 text-red-500" />
                3. Catatan Presensi (Opsional)
              </label>
              <textarea placeholder="Tambahkan pesan atau keterangan jika diperlukan..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 px-4 outline-none transition-all text-xs resize-none font-medium font-quicksand" />
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => handleAttendanceSubmit('check-in')} disabled={submitting || !capturedPhoto || !latitude || !longitude || !isWithinRadius} className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/10 cursor-pointer text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed font-quicksand">
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
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
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
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-quicksand">Catatan Anda</span>
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
              className="mt-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-650 hover:to-orange-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-red-500/10 cursor-pointer font-quicksand"
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
                        <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-rose-700 gap-2">
                          <AlertCircle className="w-8 h-8 text-rose-500" />
                          <p className="text-xs font-semibold leading-relaxed">{cameraError}</p>
                          <button onClick={startCamera} className="px-4 py-2 mt-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer">
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
                    <button onClick={retakePhoto} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer font-quicksand shadow-sm">
                      <RefreshCw className="w-3.5 h-3.5" /> Ambil Ulang Foto
                    </button>
                  ) : (
                    <button onClick={capturePhoto} disabled={!!cameraError} className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-red-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-quicksand">
                      <Camera className="w-4 h-4" /> Tangkap Foto Wajah
                    </button>
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
                    <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center text-slate-650 text-center gap-2">
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
                      <span className="text-slate-450 italic font-quicksand font-semibold">Lokasi belum dikunci</span>
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
              <label className="block text-xs font-bold text-slate-555 uppercase tracking-wider flex items-center gap-1 font-quicksand">
                <FileText className="w-3.5 h-3.5 text-red-500" />
                3. Catatan Presensi (Opsional)
              </label>
              <textarea placeholder="Tambahkan pesan atau keterangan jika diperlukan..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 px-4 outline-none transition-all text-xs resize-none font-medium font-quicksand" />
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => handleAttendanceSubmit('check-out')} disabled={submitting || !capturedPhoto || !latitude || !longitude || !isWithinRadius} className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/10 cursor-pointer text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed font-quicksand">
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
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-quicksand">Latitude GPS</span>
                      <span className="text-xs text-slate-655 font-mono">{todayAttendance.latitude_out}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-quicksand">Longitude GPS</span>
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
    </div>
  )
}
