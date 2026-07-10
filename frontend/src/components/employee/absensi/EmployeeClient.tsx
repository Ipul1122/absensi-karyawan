import { useState, useEffect, useRef, } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { getAssetUrl } from '../../../utils/api'
// import { NavLink } from 'react-router-dom'
import { 
  Camera, 
  RefreshCw, 
  AlertCircle, 
  MapPin, 
  
  Compass,
  Upload,
  // UserCheck,
  Plus,
  X,
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
}

interface OfficeSetting {
  id: number
  latitude: string
  longitude: string
  radius: number
}

interface EmployeeClientProps {
  token: string
  todayAttendance: Attendance | null
  officeSetting: OfficeSetting | null
  fetchTodayAttendance: () => Promise<void>
  fetchHistory: () => Promise<void>
  getStatusBadge: (status: string | null) => React.ReactNode
}

export default function EmployeeClient({
  token,
  todayAttendance,  
  fetchTodayAttendance,
}: EmployeeClientProps) {
  // Client Visit States
  const [visitClientName, setVisitClientName] = useState('')
  const [visitNotes, setVisitNotes] = useState('')
  const [visitSubmitting, setVisitSubmitting] = useState(false)
  const [visitsList, setVisitsList] = useState<any[]>([])
  const [visitsLoading, setVisitsLoading] = useState(false)

  // Checkout States
  const [checkoutVisitId, setCheckoutVisitId] = useState<number | null>(null)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [checkoutNotes, setCheckoutNotes] = useState('')
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false)
  const [checkoutLatitude, setCheckoutLatitude] = useState<number | null>(null)
  const [checkoutLongitude, setCheckoutLongitude] = useState<number | null>(null)
  const [checkoutLocationLoading, setCheckoutLocationLoading] = useState(false)
  const [checkoutLocationError, setCheckoutLocationError] = useState<string | null>(null)
  const [checkoutCapturedPhoto, setCheckoutCapturedPhoto] = useState<string | null>(null)
  const [cameraMode, setCameraMode] = useState<'checkin' | 'checkout'>('checkin')

  // Client suggestions states
  const [recentClients, setRecentClients] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('recent_visit_clients')
    if (saved) {
      try {
        setRecentClients(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse recent clients', e)
      }
    }
  }, [])

  const saveNewClientName = (name: string) => {
    if (!name.trim()) return
    const cleaned = name.trim()
    const updated = [cleaned, ...recentClients.filter(c => c.toLowerCase() !== cleaned.toLowerCase())].slice(0, 15)
    setRecentClients(updated)
    localStorage.setItem('recent_visit_clients', JSON.stringify(updated))
  }

  // Camera & Geolocation for Client Visits
  const [visitLatitude, setVisitLatitude] = useState<number | null>(null)
  const [visitLongitude, setVisitLongitude] = useState<number | null>(null)
  const [visitLocationLoading, setVisitLocationLoading] = useState(false)
  const [visitLocationError, setVisitLocationError] = useState<string | null>(null)
  const [visitCapturedPhoto, setVisitCapturedPhoto] = useState<string | null>(null)
  const [visitStream, setVisitStream] = useState<MediaStream | null>(null)
  const [visitCameraError, setVisitCameraError] = useState<string | null>(null)
  const [showVisitModal, setShowVisitModal] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const visitVideoRef = useRef<HTMLVideoElement | null>(null)
  const visitCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const visitStreamRef = useRef<MediaStream | null>(null)

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

  const startVisitCamera = async (mode?: 'user' | 'environment') => {
    const currentMode = mode ?? facingMode
    setVisitCameraError(null)
    try {
      if (visitStreamRef.current) {
        visitStreamRef.current.getTracks().forEach((track) => track.stop())
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: { ideal: currentMode } }
      })
      visitStreamRef.current = mediaStream
      setVisitStream(mediaStream)
      if (visitVideoRef.current) {
        visitVideoRef.current.srcObject = mediaStream
      }
    } catch (err: any) {
      console.error('Visit camera access error:', err)
      setVisitCameraError('Gagal mengakses kamera. Mohon berikan izin kamera.')
    }
  }

  const flipVisitCamera = async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newMode)
    await startVisitCamera(newMode)
  }

  const stopVisitCamera = () => {
    if (visitStreamRef.current) {
      visitStreamRef.current.getTracks().forEach((track) => track.stop())
      visitStreamRef.current = null
    }
    setVisitStream(null)
  }

  const captureVisitPhoto = () => {
    if (visitVideoRef.current && visitCanvasRef.current) {
      const video = visitVideoRef.current
      const canvas = visitCanvasRef.current
      
      // Tentukan ukuran maksimal gambar di sisi client (lebar maks 640px)
      const maxClientWidth = 640
      const originalWidth = video.videoWidth || 640
      const originalHeight = video.videoHeight || 480
      const scaleFactor = originalWidth > maxClientWidth ? maxClientWidth / originalWidth : 1
      canvas.width = originalWidth * scaleFactor
      canvas.height = originalHeight * scaleFactor

      const ctx = canvas.getContext('2d')
      if (ctx) {
        if (facingMode === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1) }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        // Kompresi gambar langsung di client dengan kualitas 0.6 (60%)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6)
        if (cameraMode === 'checkout') {
          setCheckoutCapturedPhoto(dataUrl)
        } else {
          setVisitCapturedPhoto(dataUrl)
        }
        stopVisitCamera()
      }
    }
  }

  const handleVisitImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          if (cameraMode === 'checkout') {
            setCheckoutCapturedPhoto(compressedDataUrl)
          } else {
            setVisitCapturedPhoto(compressedDataUrl)
          }
          stopVisitCamera()
        }
      }
    }
    reader.readAsDataURL(file)
  }

  const retakeVisitPhoto = () => {
    if (cameraMode === 'checkout') {
      setCheckoutCapturedPhoto(null)
    } else {
      setVisitCapturedPhoto(null)
    }
    setIsCameraActive(true)
  }

  const fetchTodayVisits = async () => {
    setVisitsLoading(true)
    try {
      const response = await axios.get('http://localhost:8000/api/sales-visits/today', {
        headers: { Authorization: `Bearer ${token}` },
        params: { visit_type: 'client' }
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
    if (showVisitModal && isCameraActive && !visitCapturedPhoto) {
      startVisitCamera()
    } else {
      stopVisitCamera()
    }
    return () => {
      stopVisitCamera()
    }
  }, [showVisitModal, isCameraActive, visitCapturedPhoto])

  useEffect(() => {
    if (showVisitModal) {
      fetchVisitLocation()
    } else {
      setIsCameraActive(false)
      setVisitCapturedPhoto(null)
      setVisitClientName('')
      setVisitNotes('')
      setVisitLatitude(null)
      setVisitLongitude(null)
      setVisitCameraError(null)
      setVisitLocationError(null)
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
          visit_type: 'client'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.status === 'success') {
        saveNewClientName(visitClientName)
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
        if (fetchTodayAttendance) {
          await fetchTodayAttendance()
        }
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal melaporkan kunjungan klien.'
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

  const fetchCheckoutLocation = () => {
    setCheckoutLocationLoading(true)
    setCheckoutLocationError(null)

    if (!navigator.geolocation) {
      setCheckoutLocationError('Geolokasi tidak didukung oleh browser Anda.')
      setCheckoutLocationLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCheckoutLatitude(position.coords.latitude)
        setCheckoutLongitude(position.coords.longitude)
        setCheckoutLocationLoading(false)
      },
      (err) => {
        console.error('Checkout geolocation error:', err)
        setCheckoutLocationError('Gagal mendeteksi lokasi. Pastikan izin lokasi aktif.')
        setCheckoutLocationLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleCheckoutSubmit = async () => {
    if (!checkoutVisitId) return

    if (!checkoutCapturedPhoto) {
      Swal.fire({
        title: 'Foto Wajib',
        text: 'Silakan ambil foto bukti check-out terlebih dahulu.',
        icon: 'warning',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#6366f1'
      })
      return
    }

    if (!checkoutLatitude || !checkoutLongitude) {
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

    setCheckoutSubmitting(true)
    try {
      const response = await axios.put(
        `http://localhost:8000/api/sales-visits/${checkoutVisitId}/checkout`,
        {
          latitude: String(checkoutLatitude),
          longitude: String(checkoutLongitude),
          photo: checkoutCapturedPhoto,
          notes: checkoutNotes,
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
        
        setShowCheckoutModal(false)
        await fetchTodayVisits()
        if (fetchTodayAttendance) {
          await fetchTodayAttendance()
        }
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal melaporkan check-out kunjungan.'
      Swal.fire({
        title: 'Kesalahan Pelaporan',
        text: msg,
        icon: 'error',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#ef4444'
      })
    } finally {
      setCheckoutSubmitting(false)
    }
  }

  useEffect(() => {
    if (showCheckoutModal) {
      fetchCheckoutLocation()
    } else {
      setCheckoutCapturedPhoto(null)
      setCheckoutNotes('')
      setCheckoutLatitude(null)
      setCheckoutLongitude(null)
      setCheckoutLocationError(null)
      setCheckoutVisitId(null)
    }
  }, [showCheckoutModal])

  const formatDayDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const clientVisits = visitsList.filter(v => (v.visit_type || 'sales') === 'client')

  return (
    <div className="space-y-6">
      {/* Client Visit Section */}
          <div className="border-b border-orange-100 pb-3 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 font-quicksand">
                <Compass className="w-5 h-5 text-orange-500" />
                Laporan Kunjungan Klien (Client Visit)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Gunakan formulir ini untuk melaporkan setiap kunjungan ke klien selama jam kerja.
              </p>
            </div>
            <button
              onClick={() => {
                setCameraMode('checkin')
                setShowVisitModal(true)
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-700 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/10 cursor-pointer transition-all flex items-center gap-1.5 font-quicksand"
            >
              <Plus className="w-4 h-4" /> Lapor Kunjungan Baru
            </button>
          </div>

          {/* Visits Timeline / List */}
          {visitsLoading ? (
            <div className="flex justify-center py-6">
              <RefreshCw className="w-6 h-6 text-orange-500 animate-spin" />
            </div>
          ) : clientVisits.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Compass className="w-12 h-12 mx-auto text-slate-300 animate-pulse mb-2" />
              <p className="text-sm font-semibold">Belum ada kunjungan yang dilaporkan hari ini.</p>
              <p className="text-xs">Klik "Lapor Kunjungan Baru" untuk menambahkan laporan.</p>
            </div>
          ) : (
            <div className="relative border-l border-orange-150 ml-4 space-y-6 py-2">
              {clientVisits.map((visit) => (
                <div key={visit.id} className="relative pl-6">
                  {/* Timeline dot */}
                  <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center shadow-sm"></div>
                  
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-start justify-between shadow-sm">
                    <div className="space-y-2 flex-grow">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-quicksand">
                        {formatDayDate(visit.date)}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-800 font-quicksand">
                          {visit.client_name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-100 font-bold font-mono">
                            Masuk: {visit.visit_time.substring(0, 5)}
                          </span>
                          {visit.visit_time_out ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold font-mono">
                              Keluar: {visit.visit_time_out.substring(0, 5)}
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 font-bold">
                              Aktif
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {visit.notes && (
                        <p className="text-xs text-slate-650 font-medium font-quicksand leading-relaxed">
                          <strong>Catatan Masuk:</strong> {visit.notes}
                        </p>
                      )}

                      {visit.notes_out && (
                        <p className="text-xs text-slate-655 font-medium font-quicksand leading-relaxed">
                          <strong>Catatan Keluar:</strong> {visit.notes_out}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 font-mono">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-red-500" />
                          <span>Masuk: {parseFloat(visit.latitude).toFixed(6)}, {parseFloat(visit.longitude).toFixed(6)}</span>
                        </div>
                        {visit.latitude_out && (
                          <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Keluar: {parseFloat(visit.latitude_out).toFixed(6)}, {parseFloat(visit.longitude_out).toFixed(6)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row items-center gap-3 shrink-0 w-full md:w-auto justify-between md:justify-end mt-4 md:mt-0 pt-3 md:pt-0 border-t border-slate-100 md:border-t-0">
                      <div className="flex gap-2">
                        {visit.photo_path && (
                          <div className="flex flex-col items-center gap-1 shrink-0">
                            <div className="w-20 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer hover:opacity-90 transition-all shadow-sm" onClick={() => {
                              Swal.fire({
                                imageUrl: getAssetUrl(visit.photo_path),
                                imageAlt: `Foto Kunjungan Masuk ${visit.client_name}`,
                                background: '#1e293b',
                                color: '#f8fafc',
                                showConfirmButton: false,
                              })
                            }}>
                              <img src={getAssetUrl(visit.photo_path)} alt="Bukti Masuk" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Masuk</span>
                          </div>
                        )}

                        {visit.photo_path_out && (
                          <div className="flex flex-col items-center gap-1 shrink-0">
                            <div className="w-20 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer hover:opacity-90 transition-all shadow-sm" onClick={() => {
                              Swal.fire({
                                imageUrl: getAssetUrl(visit.photo_path_out),
                                imageAlt: `Foto Kunjungan Keluar ${visit.client_name}`,
                                background: '#1e293b',
                                color: '#f8fafc',
                                showConfirmButton: false,
                              })
                            }}>
                              <img src={getAssetUrl(visit.photo_path_out)} alt="Bukti Keluar" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Keluar</span>
                          </div>
                        )}
                      </div>

                      {!visit.visit_time_out && (
                        <button
                          onClick={() => {
                            setCheckoutVisitId(visit.id)
                            setCameraMode('checkout')
                            setShowCheckoutModal(true)
                          }}
                          className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/10 cursor-pointer transition-all flex items-center gap-1 font-quicksand shrink-0 active:scale-95"
                        >
                          Absen Keluar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

      {/* Client Visit Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-950/20 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white border border-orange-100 rounded-3xl p-6 max-w-md w-full relative shadow-xl overflow-hidden animate-zoom-in my-8 max-h-[90vh] overflow-y-auto font-quicksand">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-transparent"></div>

            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-500" /> Absen Keluar Kunjungan Klien
              </h3>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="p-1.5 hover:bg-orange-50/50 rounded-lg transition-all cursor-pointer text-slate-400 hover:text-red-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Photo Input (Webcam / Upload) */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Ambil Foto Bukti Keluar *
                </label>
                <div className="relative aspect-video w-full rounded-2xl bg-slate-100 border border-orange-100/60 overflow-hidden flex items-center justify-center shadow-inner">
                  {checkoutCapturedPhoto ? (
                    <img src={checkoutCapturedPhoto} alt="Foto Bukti Keluar" className="w-full h-full object-cover" />
                  ) : isCameraActive ? (
                    <>
                      <video 
                        ref={visitVideoRef}
                        autoPlay 
                        playsInline 
                        muted 
                        className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform -scale-x-100' : ''}`}
                      />
                      {/* Flip Camera Button */}
                      {!visitCameraError && (
                        <button
                          type="button"
                          onClick={flipVisitCamera}
                          title={facingMode === 'user' ? 'Ganti ke Kamera Belakang' : 'Ganti ke Kamera Depan'}
                          className="absolute top-2 right-2 z-10 p-2 bg-black/40 hover:bg-black/60 text-white rounded-xl transition-all cursor-pointer backdrop-blur-sm"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400 p-4 text-center">
                      <Camera className="w-8 h-8 text-slate-300" />
                      <span className="text-xs font-semibold">Kamera Belum Aktif</span>
                    </div>
                  )}

                  {visitCameraError && (
                    <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-4 text-center text-white gap-2">
                      <AlertCircle className="w-8 h-8 text-rose-500" />
                      <p className="text-xs font-bold">{visitCameraError}</p>
                    </div>
                  )}
                </div>

                {/* Photo Actions */}
                <div className="flex gap-2 mt-3">
                  {!checkoutCapturedPhoto ? (
                    isCameraActive ? (
                      <button
                        type="button"
                        onClick={captureVisitPhoto}
                        className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md shadow-emerald-500/10 active:scale-98"
                      >
                        Ambil Foto
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setCameraMode('checkout')
                          setIsCameraActive(true)
                        }}
                        className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md shadow-emerald-500/10 active:scale-98"
                      >
                        Aktifkan Kamera
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={retakeVisitPhoto}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Ambil Ulang
                    </button>
                  )}

                  <label className="flex-1 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm text-center">
                    Pilih File Galeri
                    <input type="file" accept="image/*" className="hidden" onChange={handleVisitImageUpload} />
                  </label>
                </div>
              </div>

              {/* Location Tracker */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Koordinat Geolocation (GPS) *
                  </label>
                  <button onClick={fetchCheckoutLocation} disabled={checkoutLocationLoading} className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer font-quicksand">
                    <RefreshCw className={`w-3.5 h-3.5 ${checkoutLocationLoading ? 'animate-spin' : ''}`} /> Cari Ulang
                  </button>
                </div>
                
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-quicksand font-bold">Koordinat:</span>
                  </div>
                  {checkoutLatitude && checkoutLongitude ? (
                    <span className="text-slate-700 text-[11px] font-bold">{checkoutLatitude.toFixed(6)}, {checkoutLongitude.toFixed(6)}</span>
                  ) : (
                    <span className="text-slate-400 italic font-quicksand font-semibold">
                      {checkoutLocationLoading ? 'Mengunci GPS...' : 'Lokasi belum dikunci'}
                    </span>
                  )}
                </div>
                {checkoutLocationError && (
                  <p className="text-[10px] text-rose-600 font-semibold leading-relaxed mt-1">
                    {checkoutLocationError}
                  </p>
                )}
              </div>

              {/* Notes input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Catatan / Laporan Hasil Kunjungan Keluar (Opsional)
                </label>
                <textarea
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  placeholder="Misal: Selesai berdiskusi dengan Pak Budi, kesepakatan harga disetujui..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 px-4 outline-none transition-all text-xs resize-none font-medium font-quicksand"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-orange-50">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="px-4 py-2.5 bg-orange-50/50 border border-orange-100 hover:bg-orange-50 text-slate-600 rounded-xl transition-all cursor-pointer text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleCheckoutSubmit}
                  disabled={checkoutSubmitting || !checkoutCapturedPhoto || !checkoutLatitude || !checkoutLongitude}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkoutSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    'Absen Keluar Kunjungan'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Client Visit Modal */}
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
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nama Klien / Instansi / Toko *
                </label>
                <input
                  type="text"
                  value={visitClientName}
                  onChange={(e) => {
                    setVisitClientName(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => {
                    // Timeout allows onMouseDown selection of suggestion before closing dropdown
                    setTimeout(() => setShowSuggestions(false), 200)
                  }}
                  placeholder="PT. Sumber Makmur"
                  className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-semibold"
                  required
                />
                {showSuggestions && recentClients.filter(c => c.toLowerCase().includes(visitClientName.toLowerCase()) && c.toLowerCase() !== visitClientName.toLowerCase()).length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-orange-100 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {recentClients
                      .filter(c => c.toLowerCase().includes(visitClientName.toLowerCase()) && c.toLowerCase() !== visitClientName.toLowerCase())
                      .map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onMouseDown={() => {
                            setVisitClientName(suggestion)
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-orange-50/50 text-slate-700 text-xs font-semibold transition-colors border-b border-orange-50 last:border-b-0 cursor-pointer"
                        >
                          {suggestion}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Photo Input (Webcam / Upload) */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Ambil Foto Bukti Kunjungan *
                </label>
                <div className="relative aspect-video w-full rounded-2xl bg-slate-100 border border-orange-100/60 overflow-hidden flex items-center justify-center shadow-inner">
                  {visitCapturedPhoto ? (
                    <img src={visitCapturedPhoto} alt="Foto Bukti Kunjungan" className="w-full h-full object-cover" />
                  ) : isCameraActive ? (
                    <>
                      <video 
                        ref={visitVideoRef}
                        autoPlay 
                        playsInline 
                        muted 
                        className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform -scale-x-100' : ''}`}
                      />
                      {/* Flip Camera Button */}
                      {!visitCameraError && (
                        <button
                          type="button"
                          onClick={flipVisitCamera}
                          title={facingMode === 'user' ? 'Ganti ke Kamera Belakang' : 'Ganti ke Kamera Depan'}
                          className="absolute top-2 right-2 z-10 p-2 bg-black/40 hover:bg-black/60 text-white rounded-xl transition-all cursor-pointer backdrop-blur-sm"
                        >
                          <FlipHorizontal2 className="w-4 h-4" />
                        </button>
                      )}
                      {visitCameraError && (
                        <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-rose-700 gap-2 font-quicksand">
                          <AlertCircle className="w-8 h-8 text-rose-500" />
                          <p className="text-xs font-semibold leading-relaxed">{visitCameraError}</p>
                          <div className="flex flex-wrap gap-2 justify-center mt-2">
                            <button onClick={() => startVisitCamera()} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer">
                              Coba Lagi
                            </button>
                            <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm">
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
                  ) : (
                    <div className="absolute inset-0 bg-slate-50/50 flex flex-col items-center justify-center p-6 text-center text-slate-500 gap-3 font-quicksand">
                      <div className="p-3 bg-orange-50 rounded-full border border-orange-100 text-orange-600">
                        <Camera className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">Kamera Belum Aktif</p>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-[220px] mx-auto">Klik tombol "Aktifkan Kamera" untuk mengambil foto bukti kunjungan.</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setIsCameraActive(true)} 
                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer hover:brightness-110 shadow-sm"
                      >
                        Aktifkan Kamera
                      </button>
                    </div>
                  )}
                  <canvas ref={visitCanvasRef} className="hidden" />
                </div>

                <div className="flex gap-3 justify-center mt-3">
                  {visitCapturedPhoto ? (
                    <button onClick={retakeVisitPhoto} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer font-quicksand shadow-sm">
                      <RefreshCw className="w-3.5 h-3.5" /> Ambil Ulang Foto
                    </button>
                  ) : isCameraActive ? (
                    <>
                      <button onClick={captureVisitPhoto} disabled={!!visitCameraError} className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-red-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-quicksand">
                        <Camera className="w-4 h-4" /> Tangkap Foto Bukti
                      </button>
                      <button onClick={() => setIsCameraActive(false)} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer font-quicksand shadow-sm">
                        Matikan Kamera
                      </button>
                    </>
                  ) : (
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
                </div>
              </div>

              {/* Location Tracker */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Koordinat Geolocation (GPS) *
                  </label>
                  <button onClick={fetchVisitLocation} disabled={visitLocationLoading} className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-700 cursor-pointer font-quicksand">
                    <RefreshCw className={`w-3.5 h-3.5 ${visitLocationLoading ? 'animate-spin' : ''}`} /> Cari Ulang
                  </button>
                </div>
                
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span className="font-quicksand font-bold">Koordinat:</span>
                  </div>
                  {visitLatitude && visitLongitude ? (
                    <span className="text-slate-700 text-[11px] font-bold">{visitLatitude.toFixed(6)}, {visitLongitude.toFixed(6)}</span>
                  ) : (
                    <span className="text-slate-400 italic font-quicksand font-semibold">
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
                  placeholder="Misal: Bertemu dengan mitra kerja, membicarakan kontrak kerjasama baru..."
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
