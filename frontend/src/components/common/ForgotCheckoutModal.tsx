import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Swal from 'sweetalert2'
import {
  X,
  Camera,
  Upload,
  Clock,
  Calendar,
  CheckCircle2,
  RefreshCw,
  SwitchCamera,
  Loader2,
  Check,
  Building,
  Home,
  Briefcase,
  Handshake,
  MapPin
} from 'lucide-react'
import { API_BASE_URL } from '../../utils/api'

const BRAND_ORANGE = '#FF5A00'

export interface UncompletedAttendanceItem {
  id: number | string
  type?: string
  date: string
  clock_in: string | null
  clock_out?: string | null
  attendance_type?: string | null
  shift_name?: string | null
  shift_start_time?: string | null
  shift_end_time?: string | null
  notes_in?: string | null
  photo_in?: string | null
}

interface ForgotCheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  token: string
  isAdmin?: boolean
  preselectedRecord?: UncompletedAttendanceItem | null
}

function formatIndonesianDate(dateStr: string) {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}

export default function ForgotCheckoutModal({
  isOpen,
  onClose,
  onSuccess,
  token,
  isAdmin = false,
  preselectedRecord = null
}: ForgotCheckoutModalProps) {
  const navigate = useNavigate()

  // Uncompleted items list
  const [uncompletedList, setUncompletedList] = useState<UncompletedAttendanceItem[]>([])
  const [loadingList, setLoadingList] = useState<boolean>(false)

  // Selected item / form states
  const [selectedRecord, setSelectedRecord] = useState<UncompletedAttendanceItem | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [clockOutTime, setClockOutTime] = useState<string>('17:30')
  const [notes, setNotes] = useState<string>('')

  // Photo states
  const [photoMode, setPhotoMode] = useState<'camera' | 'gallery'>('camera')
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [cameraError, setCameraError] = useState<string | null>(null)

  // Location states
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)

  // Processing states
  const [submitting, setSubmitting] = useState<boolean>(false)

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)

  // 1. Fetch uncompleted attendances on mount or when opened
  const fetchUncompletedList = async () => {
    setLoadingList(true)
    try {
      const res = await axios.get(`${API_BASE_URL}/api/attendance/uncompleted-checkouts`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data && res.data.status === 'success') {
        const items: UncompletedAttendanceItem[] = res.data.data || []
        setUncompletedList(items)

        // Select record
        if (preselectedRecord) {
          const match = items.find((it) => String(it.id) === String(preselectedRecord.id) || it.date === preselectedRecord.date)
          setSelectedRecord(match || preselectedRecord)
          setSelectedDate(preselectedRecord.date)
        } else if (items.length > 0) {
          setSelectedRecord(items[0])
          setSelectedDate(items[0].date)
        }
      }
    } catch (err) {
      console.error('Gagal mengambil daftar presensi belum checkout:', err)
      if (preselectedRecord) {
        setSelectedRecord(preselectedRecord)
        setSelectedDate(preselectedRecord.date)
      }
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      fetchUncompletedList()
      fetchLocation()
    } else {
      stopCamera()
      document.body.style.overflow = ''
      setCapturedPhoto(null)
      setIsCameraActive(false)
    }
  }, [isOpen, preselectedRecord])

  // Automatically suggest checkout time based on shift end time or default
  useEffect(() => {
    if (selectedRecord?.shift_end_time) {
      const timePart = selectedRecord.shift_end_time.substring(0, 5)
      setClockOutTime(timePart)
    } else {
      const isSat = selectedDate ? new Date(selectedDate + 'T00:00:00').getDay() === 6 : false
      setClockOutTime(isSat ? '14:00' : '17:30')
    }
  }, [selectedRecord, selectedDate])

  // GPS Location fetch
  const fetchLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude)
          setLongitude(pos.coords.longitude)
        },
        (err) => {
          console.warn('GPS location not accessible:', err.message)
        },
        { enableHighAccuracy: true, timeout: 8000 }
      )
    }
  }

  // Camera Management
  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    setCameraError(null)
    setIsCameraActive(true)
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err: any) {
      console.error('Camera access failed:', err)
      setCameraError('Kamera tidak dapat diakses. Silakan beri izin kamera atau gunakan tombol Upload Galeri.')
      setIsCameraActive(false)
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
    setIsCameraActive(false)
  }

  const flipCamera = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(nextMode)
    await startCamera(nextMode)
  }

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const maxDimension = 720
    const w = video.videoWidth || 640
    const h = video.videoHeight || 480
    const scale = Math.min(maxDimension / w, maxDimension / h, 1)

    canvas.width = w * scale
    canvas.height = h * scale

    const ctx = canvas.getContext('2d')
    if (ctx) {
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75)
      setCapturedPhoto(dataUrl)
      stopCamera()
    }
  }

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      Swal.fire({
        title: 'File Tidak Valid',
        text: 'Harap pilih file gambar (JPG, PNG, atau WEBP).',
        icon: 'warning',
        confirmButtonColor: BRAND_ORANGE
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxDim = 800
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          const compressed = canvas.toDataURL('image/jpeg', 0.8)
          setCapturedPhoto(compressed)
          stopCamera()
        }
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // Handle Select Change
  const handleSelectRecord = (idOrDate: string) => {
    const found = uncompletedList.find((it) => String(it.id) === idOrDate || it.date === idOrDate)
    if (found) {
      setSelectedRecord(found)
      setSelectedDate(found.date)
    } else {
      setSelectedDate(idOrDate)
    }
  }

  // Submit Handler
  const handleSubmit = async () => {
    if (!selectedDate) {
      Swal.fire({
        title: 'Pilih Tanggal',
        text: 'Pilih tanggal presensi yang ingin diselesaikan checkout-nya.',
        icon: 'warning',
        confirmButtonColor: BRAND_ORANGE
      })
      return
    }

    if (!clockOutTime) {
      Swal.fire({
        title: 'Tentukan Jam Checkout',
        text: 'Silakan pilih jam checkout (waktu selesai kerja).',
        icon: 'warning',
        confirmButtonColor: BRAND_ORANGE
      })
      return
    }

    if (selectedRecord?.clock_in && clockOutTime <= selectedRecord.clock_in) {
      Swal.fire({
        title: 'Jam Tidak Valid',
        text: `Jam checkout (${clockOutTime}) harus lebih besar dari jam check-in (${selectedRecord.clock_in.substring(0, 5)}).`,
        icon: 'warning',
        confirmButtonColor: BRAND_ORANGE
      })
      return
    }

    if (!capturedPhoto) {
      Swal.fire({
        title: 'Foto Wajib',
        text: 'Ambil foto wajah Anda melalui kamera atau upload dari galeri.',
        icon: 'warning',
        confirmButtonColor: BRAND_ORANGE
      })
      return
    }

    // 1. Validasi Pre-flight KPI: Pastikan user sudah punya To-Do List pada tanggal tersebut
    try {
      const kpiCheck = await axios.get(`${API_BASE_URL}/api/kpi/today-status?date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (kpiCheck.data && !kpiCheck.data.has_kpi) {
        Swal.fire({
          title: 'Wajib Isi To-Do List / KPI!',
          text: `Anda belum mengisi To-Do List / KPI harian untuk tanggal ${formatIndonesianDate(selectedDate)}. Silakan buat To-Do List terlebih dahulu sebelum melakukan checkout susulan.`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Isi To-Do List Sekarang',
          cancelButtonText: 'Batal',
          confirmButtonColor: BRAND_ORANGE,
          cancelButtonColor: '#64748b'
        }).then((res) => {
          if (res.isConfirmed) {
            onClose()
            navigate(isAdmin ? '/admin/todo' : '/employee/kpi')
          }
        })
        return
      }
    } catch (e) {
      console.warn('Gagal cek status KPI sebelum checkout susulan:', e)
    }

    // 2. Submit to backend
    setSubmitting(true)
    try {
      const payload = {
        date: selectedDate,
        clock_out_time: clockOutTime,
        photo: capturedPhoto,
        notes: notes || undefined,
        latitude: latitude ? String(latitude) : undefined,
        longitude: longitude ? String(longitude) : undefined,
        attendance_id: selectedRecord?.id
      }

      const res = await axios.post(`${API_BASE_URL}/api/attendance/check-out-forgotten`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.data && res.data.status === 'success') {
        Swal.fire({
          title: 'Berhasil!',
          text: res.data.message || 'Checkout susulan berhasil dicatat.',
          icon: 'success',
          timer: 2200,
          showConfirmButton: false
        })
        onSuccess()
        onClose()
      }
    } catch (err: any) {
      console.error('Error submitting forgotten checkout:', err)
      const isKpiError =
        err.response?.data?.code === 'KPI_REQUIRED' ||
        (err.response?.data?.message && /kpi|to-do/i.test(err.response.data.message))

      if (isKpiError) {
        Swal.fire({
          title: 'Wajib Isi To-Do List / KPI!',
          text: err.response?.data?.message || 'Anda wajib mengisi To-Do List / KPI harian untuk tanggal tersebut terlebih dahulu.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Isi To-Do List Sekarang',
          cancelButtonText: 'Batal',
          confirmButtonColor: BRAND_ORANGE,
          cancelButtonColor: '#64748b'
        }).then((res) => {
          if (res.isConfirmed) {
            onClose()
            navigate(isAdmin ? '/admin/todo' : '/employee/kpi')
          }
        })
        return
      }

      Swal.fire({
        title: 'Gagal Checkout Susulan',
        text: err.response?.data?.message || 'Terjadi kesalahan saat memproses checkout susulan.',
        icon: 'error',
        confirmButtonColor: BRAND_ORANGE
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-sm overflow-y-auto animate-fade-in font-quicksand">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20 shadow-sm">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                Lupa Checkout / Susulan
              </h3>
              <p className="text-[11px] text-orange-100 font-medium mt-0.5">
                Pilih tanggal yang belum checkout, tentukan jamnya & sertakan foto
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto no-scrollbar">

          {/* 1. Pilih Tanggal yang Belum Checkout */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-black text-slate-700 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-orange-500" />
                1. Pilih Tanggal yang Belum Checkout
              </span>
              {uncompletedList.length > 0 && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {uncompletedList.length} belum checkout
                </span>
              )}
            </label>

            {loadingList ? (
              <div className="flex items-center gap-2 p-3.5 bg-slate-50 rounded-2xl text-xs font-semibold text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                <span>Memeriksa daftar riwayat presensi yang belum checkout...</span>
              </div>
            ) : uncompletedList.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={selectedRecord ? String(selectedRecord.id) : selectedDate}
                  onChange={(e) => handleSelectRecord(e.target.value)}
                  className="w-full h-11.5 bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-2xl px-4 text-xs font-bold text-slate-800 outline-none transition-all cursor-pointer"
                >
                  {uncompletedList.map((item) => {
                    const typeLabel =
                      item.attendance_type === 'wfh'
                        ? 'WFH'
                        : item.attendance_type === 'client'
                        ? 'Klien'
                        : item.attendance_type === 'kunjungan'
                        ? 'Sales'
                        : 'Kantor'
                    return (
                      <option key={String(item.id)} value={String(item.id)}>
                        {formatIndonesianDate(item.date)} — Masuk: {item.clock_in ? item.clock_in.substring(0, 5) : '--:--'} ({typeLabel})
                      </option>
                    )
                  })}
                </select>

                {/* Info Card Selected Date */}
                {selectedRecord && (
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                        {selectedRecord.attendance_type === 'wfh' ? (
                          <Home className="w-4 h-4" />
                        ) : selectedRecord.attendance_type === 'client' ? (
                          <Handshake className="w-4 h-4" />
                        ) : selectedRecord.attendance_type === 'kunjungan' ? (
                          <Briefcase className="w-4 h-4" />
                        ) : (
                          <Building className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-extrabold text-amber-950">
                          {formatIndonesianDate(selectedRecord.date)}
                        </p>
                        <p className="text-[11px] text-amber-800 font-medium">
                          Jam Masuk:{' '}
                          <strong className="text-amber-950 font-bold">
                            {selectedRecord.clock_in ? selectedRecord.clock_in.substring(0, 5) : '--:--'} WIB
                          </strong>
                          {selectedRecord.shift_name ? ` • Shift: ${selectedRecord.shift_name}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-amber-200/80 text-amber-900 shrink-0">
                      Belum Selesai
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    setSelectedRecord(null)
                  }}
                  className="w-full h-11.5 bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-2xl px-4 text-xs font-bold text-slate-800 outline-none transition-all cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 font-medium pl-1">
                  Semua presensi Anda tercatat lengkap. Anda dapat memilih tanggal tertentu di atas jika ada yang terlewat.
                </p>
              </div>
            )}
          </div>

          {/* 2. Tentukan Jam Checkout */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-orange-500" />
              2. Jam Checkout (Waktu Pulang / Selesai Kerja)
            </label>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <input
                type="time"
                value={clockOutTime}
                onChange={(e) => setClockOutTime(e.target.value)}
                className="h-11.5 w-full sm:w-44 bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-2xl px-4 text-sm font-black text-slate-800 outline-none transition-all"
              />
              <div className="flex flex-wrap gap-1.5">
                {['17:00', '17:30', '18:00', '18:30'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setClockOutTime(preset)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      clockOutTime === preset
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date()
                    const hh = String(now.getHours()).padStart(2, '0')
                    const mm = String(now.getMinutes()).padStart(2, '0')
                    setClockOutTime(`${hh}:${mm}`)
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                >
                  Sekarang
                </button>
              </div>
            </div>
            {selectedRecord?.clock_in && (
              <p className="text-[11px] text-slate-500 pl-1 font-medium">
                * Pastikan jam checkout berada setelah jam masuk ({selectedRecord.clock_in.substring(0, 5)} WIB).
              </p>
            )}
          </div>

          {/* 3. Foto Bukti Presensi (Kamera & Galeri) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wider">
                <Camera className="w-4 h-4 text-orange-500" />
                3. Foto Presensi Keluar (Kamera / Galeri)
              </label>

              {/* Mode Selector */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setPhotoMode('camera')
                    if (!capturedPhoto) startCamera()
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    photoMode === 'camera' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Camera className="w-3 h-3" />
                  Kamera
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhotoMode('gallery')
                    stopCamera()
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    photoMode === 'gallery' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  Galeri
                </button>
              </div>
            </div>

            {/* Photo Preview or Capture Area */}
            {capturedPhoto ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-sm bg-black min-h-[220px] sm:min-h-[260px] aspect-[4/3] sm:aspect-video flex items-center justify-center">
                <img
                  src={capturedPhoto}
                  alt="Foto Checkout Susulan"
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-3 left-3 bg-emerald-500/90 backdrop-blur-md text-white px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Foto Siap
                </div>
                <div className="absolute bottom-3 right-3 flex flex-wrap gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedPhoto(null)
                      if (photoMode === 'camera') startCamera()
                    }}
                    className="px-3 py-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Ambil Ulang
                  </button>
                  <label className="px-3 py-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    Ganti dari Galeri
                    <input
                      type="file"
                      accept="image/*"
                      ref={galleryInputRef}
                      onChange={handleGalleryUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : photoMode === 'camera' ? (
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[220px] sm:min-h-[260px] flex flex-col items-center justify-center">
                {isCameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full min-h-[220px] sm:min-h-[260px] object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    <div className="absolute bottom-3 inset-x-3 flex items-center justify-between z-10 px-2">
                      <button
                        type="button"
                        onClick={flipCamera}
                        className="p-2.5 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white rounded-full transition-all cursor-pointer active:scale-95"
                        title="Ganti Kamera Depan/Belakang"
                      >
                        <SwitchCamera className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={takeSnapshot}
                        className="px-5 py-2.5 bg-[#FF5A00] hover:bg-[#E04800] text-white font-extrabold text-xs sm:text-sm rounded-full shadow-lg flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                      >
                        <Camera className="w-4 h-4" />
                        Jepret Foto
                      </button>
                      <div className="w-9" />
                    </div>
                  </>
                ) : (
                  <div className="w-full flex flex-col items-center justify-center py-7 px-4 sm:py-8 sm:px-6 text-center text-white space-y-3 sm:space-y-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-orange-500/15 border border-orange-500/20 text-orange-400 flex items-center justify-center shadow-inner">
                      <Camera className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    {cameraError ? (
                      <p className="text-xs text-rose-300 max-w-xs leading-relaxed">{cameraError}</p>
                    ) : (
                      <p className="text-xs sm:text-sm text-slate-300 max-w-xs sm:max-w-sm leading-relaxed font-medium">
                        Kamera siap digunakan untuk mengambil foto bukti check-out
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="mt-2 px-6 py-2.5 sm:px-7 sm:py-3 bg-[#FF5A00] hover:bg-[#E04800] text-white font-extrabold text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-lg shadow-orange-500/25 cursor-pointer transition-all active:scale-95 hover:scale-102 flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Aktifkan Kamera</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => galleryInputRef.current?.click()}
                className="rounded-2xl border-2 border-dashed border-orange-200 hover:border-orange-400 bg-orange-50/40 p-6 sm:p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all min-h-[220px] sm:min-h-[260px]"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                  <Upload className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800">
                    Pilih Foto dari Galeri / Dokumen
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Format file gambar JPG, PNG, atau WEBP
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={galleryInputRef}
                  onChange={handleGalleryUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* 4. Keterangan / Alasan Lupa Checkout */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
              4. Keterangan Catatan (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Lupa checkout karena buru-buru ada keperluan mendesak..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-2xl p-3 text-xs font-semibold text-slate-800 outline-none transition-all resize-none"
            />
          </div>

          {/* GPS Location status */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl">
            <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
            <span>
              {latitude && longitude
                ? `Lokasi GPS terdeteksi (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
                : 'Mendeteksi lokasi saat ini... (checkout susulan bebas radius kantor)'}
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-black shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Checkout...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Kirim Checkout Susulan</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
