import { useState, useEffect, useRef,  } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
// import { NavLink } from 'react-router-dom'
import { 
  Camera, 
  RefreshCw, 
  AlertCircle, 
  MapPin, 
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
}: EmployeeSalesProps) {
  // Sales/Field Visit States
  const [visitClientName, setVisitClientName] = useState('')
  const [visitNotes, setVisitNotes] = useState('')
  const [visitSubmitting, setVisitSubmitting] = useState(false)
  const [visitsList, setVisitsList] = useState<any[]>([])
  const [visitsLoading, setVisitsLoading] = useState(false)

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
    setVisitsLoading(true)
    try {
      const response = await axios.get('http://localhost:8000/api/sales-visits/today', {
        headers: { Authorization: `Bearer ${token}` },
        params: { visit_type: 'sales' }
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
          visit_type: 'sales'
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



  const salesVisits = visitsList.filter(v => (v.visit_type || 'sales') === 'sales')

  return (
    <div className="space-y-6">
      {/* Sales Visit Section */}
      <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="border-b border-orange-100 pb-3 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 font-quicksand">
              <Compass className="w-5 h-5 text-orange-500" />
              Dokumentasi Sales
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan formulir ini untuk melaporkan setiap kunjungan ke klien atau lapangan selama jam kerja.
            </p>
          </div>
          <button
            onClick={() => setShowVisitModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-700 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/10 cursor-pointer transition-all flex items-center gap-1.5 font-quicksand"
          >
            <Plus className="w-4 h-4" /> Buat Baru
          </button>
        </div>

        {/* Visits Timeline / List */}
        {visitsLoading ? (
          <div className="flex justify-center py-6">
            <RefreshCw className="w-6 h-6 text-orange-500 animate-spin" />
          </div>
        ) : salesVisits.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Compass className="w-12 h-12 mx-auto text-slate-300 animate-pulse mb-2" />
            <p className="text-sm font-semibold">Belum ada kunjungan yang dilaporkan hari ini.</p>
            <p className="text-xs">Klik "Lapor Kunjungan Baru" untuk menambahkan laporan.</p>
          </div>
        ) : (
          <div className="relative border-l border-orange-150 ml-4 space-y-6 py-2">
            {salesVisits.map((visit) => (
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
                        <p className="text-xs text-slate-600 font-medium font-quicksand leading-relaxed">
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
                  placeholder="Misal: PT. Sumber Makmur"
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
