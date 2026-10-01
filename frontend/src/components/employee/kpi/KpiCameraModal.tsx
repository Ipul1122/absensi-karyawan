import React, { useState, useEffect, useRef } from 'react'
import {
  Camera,
  X,
  RefreshCw,
  CheckCircle2,
  SwitchCamera,
  AlertCircle,
  Upload
} from 'lucide-react'

interface KpiCameraModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File, previewUrl: string) => void
  title?: string
}

export default function KpiCameraModal({
  isOpen,
  onClose,
  onCapture,
  title = 'Tangkap Foto Bukti'
}: KpiCameraModalProps) {
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState<boolean>(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)

  // Start Camera
  const startCamera = async (mode?: 'environment' | 'user') => {
    const currentMode = mode ?? facingMode
    setCameraError(null)

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: { ideal: currentMode }
        },
        audio: false
      })

      streamRef.current = mediaStream
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err: any) {
      console.warn('Gagal mengakses kamera via getUserMedia:', err)
      setCameraError(
        'Tidak dapat mengakses kamera secara langsung. Pastikan izin kamera telah diizinkan atau gunakan opsi kamera bawaan HP di bawah.'
      )
    }
  }

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  // Effect to manage stream lifecycle
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setPreviewPhoto(null)
      const timer = setTimeout(() => {
        startCamera(facingMode)
      }, 150)
      return () => {
        clearTimeout(timer)
        stopCamera()
        document.body.style.overflow = ''
      }
    } else {
      stopCamera()
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Flip Front/Back Camera
  const handleFlipCamera = async () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(newMode)
    await startCamera(newMode)
  }

  // Capture Photo from Video Stream
  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    setIsCapturing(true)

    const video = videoRef.current
    const canvas = canvasRef.current

    const originalWidth = video.videoWidth || 1280
    const originalHeight = video.videoHeight || 720
    const maxDimension = 1280

    let width = originalWidth
    let height = originalHeight
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width)
        width = maxDimension
      } else {
        width = Math.round((width * maxDimension) / height)
        height = maxDimension
      }
    }

    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (ctx) {
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)

      stopCamera()
      setPreviewPhoto(dataUrl)
    }

    setTimeout(() => setIsCapturing(false), 200)
  }

  // Retake Photo
  const handleRetake = () => {
    setPreviewPhoto(null)
    setTimeout(() => {
      startCamera(facingMode)
    }, 100)
  }

  // Helper to convert base64 dataURL to File
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new File([u8arr], filename, { type: mime })
  }

  // Confirm and Pass File to Parent
  const handleConfirmPhoto = () => {
    if (!previewPhoto) return
    const filename = `task_capture_${Date.now()}.jpg`
    const file = dataURLtoFile(previewPhoto, filename)
    onCapture(file, previewPhoto)
    handleClose()
  }

  // Handle fallback file upload (e.g. from Native Camera or Gallery)
  const handleNativeFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // If file is > 2MB, compress it via canvas
    if (file.size > 2 * 1024 * 1024) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img
          const maxDim = 1280
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            } else {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', {
                  type: 'image/jpeg'
                })
                const previewUrl = URL.createObjectURL(compFile)
                onCapture(compFile, previewUrl)
                handleClose()
              } else {
                const previewUrl = URL.createObjectURL(file)
                onCapture(file, previewUrl)
                handleClose()
              }
            },
            'image/jpeg',
            0.75
          )
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    } else {
      const previewUrl = URL.createObjectURL(file)
      onCapture(file, previewUrl)
      handleClose()
    }

    e.target.value = ''
  }

  const handleClose = () => {
    stopCamera()
    setPreviewPhoto(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black flex flex-col select-none"
      style={{ touchAction: 'none' }}
    >
      {/* Hidden file inputs for direct native camera & gallery */}
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleNativeFileInput}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleNativeFileInput}
      />

      {/* Hidden canvas for video frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ══════════════════════════════════════════════════════════════
          MODE 1: PRATINJAU HASIL FOTO (PREVIEW)
      ══════════════════════════════════════════════════════════════ */}
      {previewPhoto ? (
        <>
          {/* Foto Preview Image */}
          <div className="absolute inset-0 flex items-center justify-center p-2">
            <img
              src={previewPhoto}
              alt="Pratinjau Foto Bukti"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
          </div>

          {/* Top Bar */}
          <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            <button
              type="button"
              onClick={handleClose}
              className="p-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-full transition-all active:scale-90 cursor-pointer shadow-lg"
              title="Batal"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="text-white text-xs sm:text-sm font-bold tracking-wide px-3 py-1 bg-black/50 backdrop-blur-md rounded-full border border-white/10 shadow">
              Pratinjau Foto
            </span>
            <div className="w-10" />
          </div>

          {/* Bottom Action Bar */}
          <div className="absolute bottom-0 inset-x-0 z-20 p-5 pb-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-center gap-3 max-w-md mx-auto w-full">
            <button
              type="button"
              onClick={handleRetake}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white font-bold rounded-2xl text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Ambil Ulang</span>
            </button>
            <button
              type="button"
              onClick={handleConfirmPhoto}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-xl shadow-emerald-600/40 transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Gunakan Foto</span>
            </button>
          </div>
        </>
      ) : (
        /* ══════════════════════════════════════════════════════════════
            MODE 2: VIEWFINDER KAMERA (STREAM AKTIF)
        ══════════════════════════════════════════════════════════════ */
        <>
          {/* Top Controls Bar */}
          <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            <button
              type="button"
              onClick={handleClose}
              className="p-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-full transition-all active:scale-90 cursor-pointer shadow-lg"
              title="Tutup Kamera"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-white text-xs sm:text-sm font-bold tracking-wide px-3.5 py-1 bg-black/50 backdrop-blur-md rounded-full border border-white/10 shadow flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-red-400" />
              <span>{title}</span>
            </span>

            <button
              type="button"
              onClick={handleFlipCamera}
              className="p-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-full transition-all active:scale-90 cursor-pointer shadow-lg"
              title={facingMode === 'environment' ? 'Ganti ke Kamera Depan' : 'Ganti ke Kamera Belakang'}
            >
              <SwitchCamera className="w-5 h-5" />
            </button>
          </div>

          {/* Camera Video or Error Notice */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
            {cameraError ? (
              <div className="flex flex-col items-center justify-center gap-3 p-6 text-center max-w-sm mx-auto">
                <AlertCircle className="w-12 h-12 text-rose-400" />
                <p className="text-white text-xs sm:text-sm font-semibold leading-relaxed">
                  {cameraError}
                </p>
                <div className="flex flex-col gap-2.5 w-full mt-2">
                  <button
                    type="button"
                    onClick={() => startCamera(facingMode)}
                    className="px-5 py-2.5 bg-white text-slate-800 font-bold rounded-xl text-xs transition-all cursor-pointer active:scale-95 shadow"
                  >
                    Coba Kamera Browser Lagi
                  </button>
                  <button
                    type="button"
                    onClick={() => nativeCameraInputRef.current?.click()}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer active:scale-95 shadow flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Buka Kamera Bawaan HP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl text-xs transition-all cursor-pointer active:scale-95 border border-white/20 flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Pilih dari Galeri / File</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${
                    facingMode === 'user' ? 'scale-x-[-1]' : ''
                  }`}
                />

                {/* Subtle Reticle / Focus Frame */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-[75vw] h-[75vw] max-w-[360px] max-h-[360px] rounded-3xl border-2 border-white/40 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] relative">
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-xl" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-xl" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-xl" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-xl" />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bottom Controls Bar */}
          <div className="absolute bottom-0 inset-x-0 z-20 pb-8 pt-4 px-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col items-center gap-4">
            {/* Secondary Options: Native Camera & Gallery fallback */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white rounded-full text-[11px] font-bold cursor-pointer active:scale-95 transition-all shadow"
                title="Buka Kamera Sistem Bawaan Ponsel"
              >
                <Camera className="w-3.5 h-3.5 text-red-400" />
                <span>Kamera Bawaan HP</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white rounded-full text-[11px] font-bold cursor-pointer active:scale-95 transition-all shadow"
                title="Pilih foto dari Galeri perangkat"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pilih Galeri</span>
              </button>
            </div>

            {/* Shutter Button */}
            {!cameraError && (
              <button
                type="button"
                onClick={handleCapturePhoto}
                disabled={isCapturing}
                className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-white/20 border-4 border-white/50 backdrop-blur-sm shadow-2xl flex items-center justify-center transition-all active:scale-90 cursor-pointer disabled:opacity-40"
                title="Tekan untuk mengambil foto"
              >
                <div
                  className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shadow-inner transition-transform ${
                    isCapturing ? 'scale-75 bg-red-100' : 'hover:scale-105'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-red-600" />
                </div>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
