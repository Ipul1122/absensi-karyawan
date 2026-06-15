import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import L from 'leaflet'
import { Clock, X, MapPin, Loader2, Image, Upload } from 'lucide-react'

interface Employee {
  id: number
  name: string
  email: string
}

interface ManualAttendanceModalProps {
  isOpen: boolean
  onClose: () => void
  token: string
  employees: Employee[]
  fetchAttendances: () => void
  officeLatitude?: string
  officeLongitude?: string
}

export default function ManualAttendanceModal({
  isOpen,
  onClose,
  token,
  employees,
  fetchAttendances,
  officeLatitude = '-6.2088',
  officeLongitude = '106.8456',
}: ManualAttendanceModalProps) {
  // Manual Attendance Modal States
  const [selectedUserId, setSelectedUserId] = useState('')
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split('T')[0])
  const [manualType, setManualType] = useState<'kantor' | 'kunjungan' | 'client'>('kantor')
  const [manualClockIn, setManualClockIn] = useState('08:00') // default jam masuk
  const [manualClockOut, setManualClockOut] = useState('17:00') // default jam keluar
  const [manualLat, setManualLat] = useState(-6.1942189)
  const [manualLng, setManualLng] = useState(106.815998)
  const [manualLocationPreset, setManualLocationPreset] = useState('thamrin_city')
  const [manualNotes, setManualNotes] = useState('Input absensi manual oleh Admin')
  const [manualPhoto, setManualPhoto] = useState<string | null>(null)
  const [photoName, setPhotoName] = useState('')
  const [submittingManual, setSubmittingManual] = useState(false)

  // Map refs for manual check-in
  const manualMapContainerRef = useRef<HTMLDivElement | null>(null)
  const manualMapInstanceRef = useRef<L.Map | null>(null)
  const manualMarkerRef = useRef<L.Marker | null>(null)

  // Reset states when modal is opened or closed
  const resetForm = () => {
    setSelectedUserId('')
    setManualDate(new Date().toISOString().split('T')[0])
    setManualType('kantor')
    setManualClockIn('08:00')
    setManualClockOut('17:00')
    setManualLat(-6.1942189)
    setManualLng(106.815998)
    setManualLocationPreset('thamrin_city')
    setManualNotes('Input absensi manual oleh Admin')
    setManualPhoto(null)
    setPhotoName('')
  }

  // Handle Close
  const handleClose = () => {
    resetForm()
    onClose()
  }

  // Initialize Leaflet Map inside manual check-in modal
  useEffect(() => {
    if (!isOpen || !manualMapContainerRef.current) {
      if (manualMapInstanceRef.current) {
        manualMapInstanceRef.current.remove()
        manualMapInstanceRef.current = null
        manualMarkerRef.current = null
      }
      return
    }

    // Fix default marker icon path issue in Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })

    const defaultLat = manualLat
    const defaultLng = manualLng

    const map = L.map(manualMapContainerRef.current).setView([defaultLat, defaultLng], 15)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map)

    manualMapInstanceRef.current = map

    const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map)
    manualMarkerRef.current = marker

    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      setManualLat(pos.lat)
      setManualLng(pos.lng)
      setManualLocationPreset('custom')
    })

    map.on('click', (e) => {
      marker.setLatLng(e.latlng)
      setManualLat(e.latlng.lat)
      setManualLng(e.latlng.lng)
      setManualLocationPreset('custom')
    })

    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 300)

    return () => {
      clearTimeout(timer)
      if (manualMapInstanceRef.current) {
        manualMapInstanceRef.current.remove()
        manualMapInstanceRef.current = null
        manualMarkerRef.current = null
      }
    }
  }, [isOpen])

  const handlePresetChange = (preset: string) => {
    setManualLocationPreset(preset)
    let newLat = -6.1942189
    let newLng = 106.815998

    if (preset === 'office') {
      newLat = parseFloat(officeLatitude)
      newLng = parseFloat(officeLongitude)
    } else if (preset === 'custom') {
      return
    }

    setManualLat(newLat)
    setManualLng(newLng)

    if (manualMarkerRef.current) {
      manualMarkerRef.current.setLatLng([newLat, newLng])
    }
    if (manualMapInstanceRef.current) {
      manualMapInstanceRef.current.setView([newLat, newLng], 15)
    }
  }

  // Handle gallery photo input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 5MB validation limit
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
      reader.onloadend = () => {
        setManualPhoto(reader.result as string)
        setPhotoName(file.name)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemovePhoto = () => {
    setManualPhoto(null)
    setPhotoName('')
  }

  // Handle Manual Attendance Submission
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) {
      Swal.fire({
        title: 'Pilih Karyawan',
        text: 'Silakan pilih karyawan terlebih dahulu.',
        icon: 'warning',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#6366f1'
      })
      return
    }

    setSubmittingManual(true)
    try {
      const response = await axios.post(
        'http://localhost:8000/api/admin/attendances',
        {
          user_id: parseInt(selectedUserId, 10),
          date: manualDate,
          attendance_type: manualType,
          clock_in: manualClockIn,
          clock_out: manualClockOut || null,
          latitude: String(manualLat),
          longitude: String(manualLng),
          notes: manualNotes,
          photo: manualPhoto || null, // send photo base64 string
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.status === 'success') {
        Swal.fire({
          title: 'Berhasil!',
          text: response.data.message || 'Absensi manual karyawan berhasil dibuat.',
          icon: 'success',
          background: '#1e293b',
          color: '#f8fafc',
          timer: 2000,
          showConfirmButton: false
        })
        
        // Refresh log table
        fetchAttendances()
        
        // Close modal and reset
        handleClose()
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal membuat absensi manual.'
      Swal.fire({
        title: 'Gagal',
        text: msg,
        icon: 'error',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#ef4444'
      })
    } finally {
      setSubmittingManual(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-950/20 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white border border-orange-100 rounded-3xl p-6 max-w-md w-full relative shadow-xl overflow-hidden animate-zoom-in my-8 max-h-[90vh] overflow-y-auto font-quicksand">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-red-500 via-orange-500 to-transparent"></div>

        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" /> Absensikan Karyawan
          </h3>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-orange-50/50 rounded-lg transition-all cursor-pointer text-slate-400 hover:text-red-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleManualSubmit} className="space-y-4">
          {/* Employee Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Karyawan *
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-semibold"
              required
            >
              <option value="">-- Pilih Karyawan --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
              ))}
            </select>
          </div>

          {/* Date Input */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Tanggal Absensi *
            </label>
            <input
              type="date"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-semibold"
              required
            />
          </div>

          {/* Attendance Type */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Tipe Presensi *
            </label>
            <select
              value={manualType}
              onChange={(e) => setManualType(e.target.value as any)}
              className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 text-slate-700 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-semibold"
              required
            >
              <option value="kantor">Absen Kantor</option>
              <option value="kunjungan">Kunjungan Kerja / Lapangan</option>
              <option value="client">Kunjungan Klien (Client Visit)</option>
            </select>
          </div>

          {/* Photo Input (Gallery Upload) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Image className="w-3.5 h-3.5 text-orange-500" />
              Foto Bukti / Selfie (Galeri)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="manual-photo-upload"
            />
            <div className="flex flex-col gap-2">
              <label
                htmlFor="manual-photo-upload"
                className="flex items-center justify-center gap-2 w-full bg-orange-50/20 border border-dashed border-orange-200 hover:border-orange-500 rounded-xl py-3 px-4 outline-none transition-all text-xs font-bold text-orange-700 cursor-pointer text-center"
              >
                <Upload className="w-4 h-4 text-orange-500" />
                {photoName ? 'Ubah Foto' : 'Pilih Foto dari Galeri'}
              </label>
              {photoName && (
                <span className="text-[10px] text-slate-500 truncate font-semibold">
                  Terpilih: {photoName}
                </span>
              )}
              {manualPhoto && (
                <div className="relative w-full h-[150px] rounded-2xl overflow-hidden border border-orange-100 shadow-sm mt-1">
                  <img
                    src={manualPhoto}
                    alt="Preview Bukti"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-lg transition-all shadow cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Lokasi Selector & Map */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Lokasi Presensi *
              </label>
              <select
                value={manualLocationPreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="bg-transparent border-none text-[11px] font-bold text-orange-600 outline-none cursor-pointer"
              >
                <option value="thamrin_city">Mall Thamrin City</option>
                <option value="office">Kantor Pusat</option>
                <option value="custom">Kustom (Arahkan di Peta)</option>
              </select>
            </div>
            
            {/* Leaflet Map Div */}
            <div className="relative w-full h-[180px] rounded-2xl bg-slate-50 border border-orange-100/60 overflow-hidden shadow-inner">
              <div ref={manualMapContainerRef} className="w-full h-full z-10" />
            </div>
            
            {/* Coordinates Badge */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex justify-between items-center text-[10px] font-mono">
              <span className="text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                Koordinat Peta:
              </span>
              <span className="text-slate-700 font-bold">
                {manualLat.toFixed(6)}, {manualLng.toFixed(6)}
              </span>
            </div>
          </div>

          {/* Clock In & Clock Out Times */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Jam Masuk *
              </label>
              <input
                type="time"
                value={manualClockIn}
                onChange={(e) => setManualClockIn(e.target.value)}
                className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Jam Keluar (Opsional)
              </label>
              <input
                type="time"
                value={manualClockOut}
                onChange={(e) => setManualClockOut(e.target.value)}
                className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Catatan / Keterangan
            </label>
            <textarea
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              placeholder="Keterangan absensi manual..."
              rows={2}
              className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 px-4 outline-none transition-all text-xs resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-orange-50">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 bg-orange-50/50 border border-orange-100 hover:bg-orange-50 text-slate-600 rounded-xl transition-all cursor-pointer text-xs font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submittingManual}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingManual ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Absensikan Karyawan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
