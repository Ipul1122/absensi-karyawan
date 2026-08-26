import React, { useState, useEffect, useRef, useMemo } from 'react'
import Swal from 'sweetalert2'
import L from 'leaflet'
import { Clock, X, MapPin, Loader2, Image, Upload, Search, Users, Check } from 'lucide-react'
import { apiClient } from '../../../utils/api'

interface Employee {
  id: number
  name: string
  email: string
  employee_number?: string | null
  division?: string | null
  status?: 'active' | 'pending' | 'pending_delete'
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
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set())
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('')
  const [submitProgress, setSubmitProgress] = useState({ current: 0, total: 0 })
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split('T')[0])
  const [manualType, setManualType] = useState<'kantor' | 'kunjungan' | 'client'>('kantor')
  const [manualClockIn, setManualClockIn] = useState('08:00')
  const [manualClockOut, setManualClockOut] = useState('17:00')
  const [manualLat, setManualLat] = useState(-6.1942189)
  const [manualLng, setManualLng] = useState(106.815998)
  const [manualLocationPreset, setManualLocationPreset] = useState('thamrin_city')
  const [manualNotes, setManualNotes] = useState('')
  const [manualPhoto, setManualPhoto] = useState<string | null>(null)
  const [photoName, setPhotoName] = useState('')
  const [bulkPhotoMode, setBulkPhotoMode] = useState<'none' | 'shared' | 'individual'>('none')
  const [employeePhotos, setEmployeePhotos] = useState<Record<number, { data: string; name: string }>>({})
  const [submittingManual, setSubmittingManual] = useState(false)

  const activeEmployees = useMemo(
    () => employees.filter((emp) => emp.status === 'active'),
    [employees]
  )

  const filteredEmployees = useMemo(() => {
    const query = employeeSearchQuery.trim().toLowerCase()
    if (!query) return activeEmployees

    return activeEmployees.filter((emp) => {
      const haystack = [
        emp.name,
        emp.email,
        emp.employee_number,
        emp.division,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [activeEmployees, employeeSearchQuery])

  const selectedCount = selectedUserIds.size
  const isBulkSelection = selectedCount > 1

  const selectedEmployees = useMemo(
    () => activeEmployees.filter((emp) => selectedUserIds.has(emp.id)),
    [activeEmployees, selectedUserIds]
  )

  const allFilteredSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((emp) => selectedUserIds.has(emp.id))

  const toggleEmployee = (userId: number) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
        setEmployeePhotos((photos) => {
          if (!(userId in photos)) return photos
          const updated = { ...photos }
          delete updated[userId]
          return updated
        })
      } else {
        next.add(userId)
      }
      return next
    })
  }

  const toggleAllFiltered = () => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        filteredEmployees.forEach((emp) => next.delete(emp.id))
      } else {
        filteredEmployees.forEach((emp) => next.add(emp.id))
      }
      return next
    })
  }

  const clearSelection = () => {
    setSelectedUserIds(new Set())
    setEmployeePhotos({})
  }

  useEffect(() => {
    if (!isBulkSelection) {
      setBulkPhotoMode('none')
      setEmployeePhotos({})
    }
  }, [isBulkSelection])

  // Map refs for manual check-in
  const manualMapContainerRef = useRef<HTMLDivElement | null>(null)
  const manualMapInstanceRef = useRef<L.Map | null>(null)
  const manualMarkerRef = useRef<L.Marker | null>(null)

  // Reset states when modal is opened or closed
  const resetForm = () => {
    setSelectedUserIds(new Set())
    setEmployeeSearchQuery('')
    setSubmitProgress({ current: 0, total: 0 })
    setManualDate(new Date().toISOString().split('T')[0])
    setManualType('kantor')
    setManualClockIn('08:00')
    setManualClockOut('17:00')
    setManualLat(-6.1942189)
    setManualLng(106.815998)
    setManualLocationPreset('thamrin_city')
    setManualNotes('')
    setManualPhoto(null)
    setPhotoName('')
    setBulkPhotoMode('none')
    setEmployeePhotos({})
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

  const readImageFile = (file: File, onLoad: (dataUrl: string, name: string) => void) => {
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
      onLoad(reader.result as string, file.name)
    }
    reader.readAsDataURL(file)
  }

  // Handle gallery photo input (single employee or shared bulk photo)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    readImageFile(file, (dataUrl, name) => {
      setManualPhoto(dataUrl)
      setPhotoName(name)
    })

    e.target.value = ''
  }

  const handleIndividualFileChange = (userId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    readImageFile(file, (dataUrl, name) => {
      setEmployeePhotos((prev) => ({
        ...prev,
        [userId]: { data: dataUrl, name },
      }))
    })

    e.target.value = ''
  }

  const handleRemovePhoto = () => {
    setManualPhoto(null)
    setPhotoName('')
  }

  const handleRemoveIndividualPhoto = (userId: number) => {
    setEmployeePhotos((prev) => {
      const updated = { ...prev }
      delete updated[userId]
      return updated
    })
  }

  const getPhotoForUser = (userId: number): string | null => {
    if (!isBulkSelection) {
      return manualPhoto
    }

    if (bulkPhotoMode === 'shared') {
      return manualPhoto
    }

    if (bulkPhotoMode === 'individual') {
      return employeePhotos[userId]?.data ?? null
    }

    return null
  }

  const buildPayload = (userId: number) => {
    const payload: Record<string, unknown> = {
      user_id: userId,
      date: manualDate,
      attendance_type: manualType,
      latitude: String(manualLat),
      longitude: String(manualLng),
      notes: manualNotes,
      photo: getPhotoForUser(userId),
      clock_in: manualClockIn || null,
      clock_out: manualClockOut || null,
    }

    return payload
  }

  // Handle Manual Attendance Submission (single or bulk)
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCount === 0) {
      Swal.fire({
        title: 'Pilih Karyawan',
        text: 'Silakan pilih minimal satu karyawan.',
        icon: 'warning',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#6366f1'
      })
      return
    }

    if (!manualClockIn && !manualClockOut) {
      Swal.fire({
        title: 'Isi Jam Absensi',
        text: 'Minimal isi jam masuk atau jam keluar.',
        icon: 'warning',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#6366f1'
      })
      return
    }

    if (manualClockIn && manualClockOut && manualClockOut <= manualClockIn) {
      Swal.fire({
        title: 'Jam Tidak Valid',
        text: 'Jam keluar harus lebih besar dari jam masuk.',
        icon: 'warning',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#6366f1'
      })
      return
    }

    const userIds = Array.from(selectedUserIds)
    setSubmittingManual(true)
    setSubmitProgress({ current: 0, total: userIds.length })

    const failures: { userId: number; name: string; message: string }[] = []
    let successCount = 0

    try {
      for (let i = 0; i < userIds.length; i++) {
        const userId = userIds[i]
        const employee = activeEmployees.find((emp) => emp.id === userId)
        setSubmitProgress({ current: i + 1, total: userIds.length })

        try {
          const response = await apiClient.post('/admin/attendances', buildPayload(userId), {
            headers: { Authorization: `Bearer ${token}` },
          })

          if (response.data.status === 'success') {
            successCount += 1
          } else {
            failures.push({
              userId,
              name: employee?.name || `ID ${userId}`,
              message: response.data.message || 'Gagal memproses absensi.',
            })
          }
        } catch (err: any) {
          failures.push({
            userId,
            name: employee?.name || `ID ${userId}`,
            message: err.response?.data?.message || 'Gagal membuat absensi manual.',
          })
        }
      }

      fetchAttendances()

      if (failures.length === 0) {
        Swal.fire({
          title: 'Berhasil!',
          text:
            successCount === 1
              ? 'Absensi manual karyawan berhasil dibuat.'
              : `Absensi manual berhasil dibuat untuk ${successCount} karyawan.`,
          icon: 'success',
          background: '#1e293b',
          color: '#f8fafc',
          timer: 2200,
          showConfirmButton: false,
        })
        handleClose()
        return
      }

      const failureList = failures
        .slice(0, 5)
        .map((item) => `• ${item.name}: ${item.message}`)
        .join('\n')
      const extraFailures =
        failures.length > 5 ? `\n...dan ${failures.length - 5} karyawan lainnya.` : ''

      Swal.fire({
        title: successCount > 0 ? 'Selesai Sebagian' : 'Gagal',
        html: `<div class="text-left text-sm whitespace-pre-line">Berhasil: ${successCount} karyawan<br>Gagal: ${failures.length} karyawan<br><br>${failureList}${extraFailures}</div>`,
        icon: successCount > 0 ? 'warning' : 'error',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#6366f1',
      })

      if (successCount > 0) {
        setSelectedUserIds(new Set(failures.map((item) => item.userId)))
      }
    } finally {
      setSubmittingManual(false)
      setSubmitProgress({ current: 0, total: 0 })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-950/20 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white border border-orange-100 rounded-3xl p-6 max-w-lg w-full relative shadow-xl overflow-hidden animate-zoom-in my-8 max-h-[90vh] overflow-y-auto font-quicksand">
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
          {/* Employee Multi-Select */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Karyawan *
              </label>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-100 rounded-full px-2.5 py-0.5">
                <Users className="w-3 h-3" />
                {selectedCount} dipilih
              </span>
            </div>

            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={employeeSearchQuery}
                onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                placeholder="Cari nama, email, NIK, atau divisi..."
                className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 pl-9 pr-4 outline-none transition-all text-xs font-semibold"
              />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={toggleAllFiltered}
                disabled={filteredEmployees.length === 0}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-orange-100 bg-orange-50/40 text-orange-700 hover:bg-orange-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {allFilteredSelected ? 'Batal Pilih Semua' : 'Pilih Semua'}
              </button>
              <button
                type="button"
                onClick={clearSelection}
                disabled={selectedCount === 0}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hapus Pilihan
              </button>
            </div>

            <div className="max-h-44 overflow-y-auto rounded-2xl border border-orange-100 bg-orange-50/10 divide-y divide-orange-50">
              {filteredEmployees.length === 0 ? (
                <div className="py-8 text-center text-xs font-semibold text-slate-400 italic">
                  {employeeSearchQuery ? 'Karyawan tidak ditemukan.' : 'Tidak ada karyawan aktif.'}
                </div>
              ) : (
                filteredEmployees.map((emp) => {
                  const isSelected = selectedUserIds.has(emp.id)
                  return (
                    <label
                      key={emp.id}
                      className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                        isSelected ? 'bg-orange-50/70' : 'hover:bg-white/70'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleEmployee(emp.id)}
                        className="mt-0.5 h-4 w-4 rounded border-orange-200 text-orange-600 focus:ring-orange-500"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 truncate">{emp.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-orange-600 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{emp.email}</p>
                        {(emp.employee_number || emp.division) && (
                          <p className="text-[10px] text-slate-400 truncate">
                            {[emp.employee_number, emp.division].filter(Boolean).join(' • ')}
                          </p>
                        )}
                      </div>
                    </label>
                  )
                })
              )}
            </div>
            <p className="mt-1.5 text-[10px] text-slate-400 font-semibold">
              Pilih satu atau lebih karyawan. Pengaturan tanggal, jam, dan lokasi berlaku untuk semua yang dipilih.
            </p>
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

          {/* Photo Input */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Image className="w-3.5 h-3.5 text-orange-500" />
              {isBulkSelection ? 'Foto Bukti (Opsional)' : 'Foto Bukti / Selfie (Galeri)'}
            </label>

            {isBulkSelection ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'none' as const, label: 'Tanpa Foto' },
                    { id: 'shared' as const, label: '1 Foto untuk Semua' },
                    { id: 'individual' as const, label: 'Foto per Karyawan' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setBulkPhotoMode(mode.id)
                        if (mode.id !== 'shared') {
                          setManualPhoto(null)
                          setPhotoName('')
                        }
                        if (mode.id !== 'individual') {
                          setEmployeePhotos({})
                        }
                      }}
                      className={`py-2 px-3 rounded-xl text-[11px] font-bold transition-all border cursor-pointer text-center ${
                        bulkPhotoMode === mode.id
                          ? 'bg-orange-600 border-orange-600 text-white shadow-sm'
                          : 'bg-white border-orange-100 text-slate-600 hover:bg-orange-50/50'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                {bulkPhotoMode === 'none' && (
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    Absensi massal tanpa foto bukti. Cocok untuk input hadir kantor banyak karyawan sekaligus.
                  </p>
                )}

                {bulkPhotoMode === 'shared' && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-amber-700 font-semibold leading-relaxed bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                      Satu foto yang diupload akan digunakan untuk semua {selectedCount} karyawan terpilih
                      (misalnya foto dokumentasi rapat atau bukti kegiatan bersama).
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="manual-photo-upload-shared"
                    />
                    <label
                      htmlFor="manual-photo-upload-shared"
                      className="flex items-center justify-center gap-2 w-full bg-orange-50/20 border border-dashed border-orange-200 hover:border-orange-500 rounded-xl py-3 px-4 outline-none transition-all text-xs font-bold text-orange-700 cursor-pointer text-center"
                    >
                      <Upload className="w-4 h-4 text-orange-500" />
                      {photoName ? 'Ubah Foto Bersama' : 'Pilih 1 Foto untuk Semua Karyawan'}
                    </label>
                    {photoName && (
                      <span className="text-[10px] text-slate-500 truncate font-semibold block">
                        Terpilih: {photoName}
                      </span>
                    )}
                    {manualPhoto && (
                      <div className="relative w-full h-[150px] rounded-2xl overflow-hidden border border-orange-100 shadow-sm">
                        <img src={manualPhoto} alt="Preview bukti bersama" className="w-full h-full object-cover" />
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
                )}

                {bulkPhotoMode === 'individual' && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                      Upload foto berbeda untuk tiap karyawan. Karyawan tanpa foto tetap bisa diabsenkan.
                    </p>
                    <div className="max-h-52 overflow-y-auto rounded-2xl border border-orange-100 divide-y divide-orange-50">
                      {selectedEmployees.map((emp) => {
                        const photo = employeePhotos[emp.id]
                        return (
                          <div key={emp.id} className="p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">{emp.name}</p>
                                <p className="text-[10px] text-slate-400 truncate">{emp.email}</p>
                              </div>
                              {photo ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveIndividualPhoto(emp.id)}
                                  className="shrink-0 text-[10px] font-bold text-red-600 hover:text-red-700"
                                >
                                  Hapus
                                </button>
                              ) : null}
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleIndividualFileChange(emp.id, e)}
                              className="hidden"
                              id={`manual-photo-upload-${emp.id}`}
                            />
                            {photo ? (
                              <div className="relative w-full h-24 rounded-xl overflow-hidden border border-orange-100">
                                <img src={photo.data} alt={`Foto ${emp.name}`} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <label
                                htmlFor={`manual-photo-upload-${emp.id}`}
                                className="flex items-center justify-center gap-2 w-full bg-white border border-dashed border-orange-200 hover:border-orange-500 rounded-xl py-2 px-3 text-[11px] font-bold text-orange-700 cursor-pointer"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                Pilih Foto
                              </label>
                            )}
                            {photo?.name && (
                              <span className="text-[10px] text-slate-400 truncate font-semibold block">
                                {photo.name}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="manual-photo-upload"
                />
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
            )}
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

          {/* Jam Masuk & Keluar */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Jam Absensi *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Jam Masuk
                </label>
                <input
                  type="time"
                  value={manualClockIn}
                  onChange={(e) => setManualClockIn(e.target.value)}
                  className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Jam Keluar
                </label>
                <input
                  type="time"
                  value={manualClockOut}
                  onChange={(e) => setManualClockOut(e.target.value)}
                  className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-mono"
                />
              </div>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-400 font-semibold">
              Masuk dan keluar diinput sekaligus dalam satu proses absensi.
            </p>
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
                  {submitProgress.total > 1
                    ? `Memproses ${submitProgress.current}/${submitProgress.total}...`
                    : 'Memproses...'}
                </>
              ) : selectedCount > 1 ? (
                `Absensikan ${selectedCount} Karyawan`
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
