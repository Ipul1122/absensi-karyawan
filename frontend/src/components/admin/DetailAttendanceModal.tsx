import React, { useState, useEffect } from 'react'
import { X, Clock, MapPin, FileText, Compass, RefreshCw } from 'lucide-react'
import axios from 'axios'
import AttendanceMap from './AttendanceMap'

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
  user: {
    id: number
    name: string
    email: string
    photo?: string | null
  }
}

interface DetailAttendanceModalProps {
  attendance: Attendance | null
  onClose: () => void
  formatDate: (d: string) => string
  getStatusBadge: (s: string | null) => React.ReactNode
  token: string
  officeLatitude?: string
  officeLongitude?: string
}

export default function DetailAttendanceModal({
  attendance,
  onClose,
  formatDate,
  getStatusBadge,
  token,
  officeLatitude = '-6.2088',
  officeLongitude = '106.8456',
}: DetailAttendanceModalProps) {
  const [visits, setVisits] = useState<any[]>([])
  const [visitsLoading, setVisitsLoading] = useState(false)
  const [resolvedAddresses, setResolvedAddresses] = useState<Record<number, string>>({})

  // Address Resolver Function (Nominatim Reverse Geocoding)
  const resolveAddress = async (id: number, lat: string, lng: string) => {
    if (resolvedAddresses[id]) return
    
    // Check presets first
    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)
    if (Math.abs(latitude - (-6.1942189)) < 0.0001 && Math.abs(longitude - 106.815998) < 0.0001) {
      setResolvedAddresses(prev => ({ ...prev, [id]: 'Mall Thamrin City' }))
      return
    }
    const officeLat = parseFloat(officeLatitude)
    const officeLng = parseFloat(officeLongitude)
    if (!isNaN(officeLat) && !isNaN(officeLng)) {
      if (Math.abs(latitude - officeLat) < 0.0005 && Math.abs(longitude - officeLng) < 0.0005) {
        setResolvedAddresses(prev => ({ ...prev, [id]: 'Kantor Pusat' }))
        return
      }
    }

    // Call Nominatim API for reverse geocoding
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`,
        { headers: { 'Accept-Language': 'id-ID' } }
      )
      if (response.data && response.data.display_name) {
        const addressObj = response.data.address;
        const street = addressObj.road || addressObj.suburb || addressObj.village || '';
        const city = addressObj.city || addressObj.town || addressObj.municipality || addressObj.county || '';
        const displayName = street && city ? `${street}, ${city}` : response.data.display_name.split(',').slice(0, 3).join(',');
        setResolvedAddresses(prev => ({ ...prev, [id]: displayName }))
      } else {
        setResolvedAddresses(prev => ({ ...prev, [id]: `Luar Kantor` }))
      }
    } catch (err) {
      setResolvedAddresses(prev => ({ ...prev, [id]: `Luar Kantor` }))
    }
  }

  // Fetch addresses for visible visits
  useEffect(() => {
    if (visits.length > 0) {
      visits.forEach(visit => {
        resolveAddress(visit.id, visit.latitude, visit.longitude)
      })
    }
  }, [visits])

  const fetchVisitsForDay = async () => {
    if (!attendance) return
    setVisitsLoading(true)
    try {
      const response = await axios.get(
        `http://localhost:8000/api/admin/sales-visits?user_id=${attendance.user.id}&date=${attendance.date}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      if (response.data.status === 'success') {
        setVisits(response.data.data)
      }
    } catch (err) {
      console.error('Gagal mengambil data kunjungan sales karyawan:', err)
    } finally {
      setVisitsLoading(false)
    }
  }

  useEffect(() => {
    if (attendance) {
      fetchVisitsForDay()
    } else {
      setVisits([])
    }
  }, [attendance])
  if (!attendance) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-950/20 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white border border-orange-100 rounded-3xl p-6 max-w-4xl w-full relative shadow-xl overflow-hidden animate-zoom-in my-8 max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-red-500 via-orange-500 to-transparent"></div>

        {/* Header */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b border-orange-100">
          <div>
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest font-quicksand">Detail Log Kehadiran</span>
            <h3 className="text-xl font-bold text-slate-800 mt-1 font-quicksand">{attendance.user.name}</h3>
            <p className="text-xs text-slate-500 font-mono flex flex-wrap items-center gap-2 mt-1">
              <span>{attendance.user.email}</span>
              <span>&bull;</span>
              <span>Tanggal: {formatDate(attendance.date)}</span>
              <span>&bull;</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                attendance.attendance_type === 'kunjungan' 
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-250' 
                  : attendance.attendance_type === 'client' 
                  ? 'text-amber-700 bg-amber-50 border-amber-250' 
                  : 'text-indigo-700 bg-indigo-50 border-indigo-250'
              }`}>
                Tipe: {attendance.attendance_type || 'kantor'}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-orange-50 rounded-lg transition-all cursor-pointer text-slate-400 hover:text-red-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grid Check-In and Check-Out Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Check-In Details Card */}
          <div className="bg-orange-50/10 border border-orange-100/70 rounded-2xl p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider font-quicksand">Absen Masuk (Check-In)</span>
                {getStatusBadge(attendance.status_in)}
              </div>
              
              {attendance.clock_in ? (
                <>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <span className="text-2xl font-extrabold text-slate-800 font-mono">{attendance.clock_in}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-orange-400" />
                    {attendance.latitude_in && isNaN(parseFloat(attendance.latitude_in)) ? (
                      <span>Lokasi: {attendance.latitude_in}</span>
                    ) : (
                      <span>GPS: {attendance.latitude_in}, {attendance.longitude_in}</span>
                    )}
                  </div>

                  {attendance.notes_in && (
                    <div className="text-xs text-slate-600 bg-orange-50/30 p-2.5 rounded-xl border border-orange-100/50 flex gap-1.5">
                      <FileText className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-[10px] uppercase text-orange-655 block">Catatan:</span>
                        {attendance.notes_in}
                      </div>
                    </div>
                  )}

                  {/* Check-In Map */}
                  {attendance.latitude_in && attendance.longitude_in && !isNaN(parseFloat(attendance.latitude_in)) && !isNaN(parseFloat(attendance.longitude_in)) && (
                    <div className="mt-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Peta Check-In</span>
                      <AttendanceMap 
                        lat={attendance.latitude_in} 
                        lng={attendance.longitude_in} 
                        title={`Masuk: ${attendance.user.name}`} 
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="py-6 text-center text-slate-400 italic text-xs font-semibold">
                  Belum melakukan absen masuk
                </div>
              )}
            </div>

            {attendance.clock_in && attendance.photo_in && (
              <div className="aspect-video w-full rounded-xl overflow-hidden border border-orange-100 bg-orange-50/20 mt-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Foto Selfie Masuk</span>
                <img 
                  src={`http://localhost:8000${attendance.photo_in}`} 
                  alt="Selfie Check-In" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Check-Out Details Card */}
          <div className="bg-orange-50/10 border border-orange-100/70 rounded-2xl p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider font-quicksand">Absen Keluar (Check-Out)</span>
                {getStatusBadge(attendance.status_out)}
              </div>
              
              {attendance.clock_out ? (
                <>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <span className="text-2xl font-extrabold text-slate-800 font-mono">{attendance.clock_out}</span>
                  </div>
                  
                   <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-orange-400" />
                    {attendance.latitude_out && isNaN(parseFloat(attendance.latitude_out)) ? (
                      <span>Lokasi: {attendance.latitude_out}</span>
                    ) : (
                      <span>GPS: {attendance.latitude_out}, {attendance.longitude_out}</span>
                    )}
                  </div>

                  {attendance.notes_out && (
                    <div className="text-xs text-slate-600 bg-orange-50/30 p-2.5 rounded-xl border border-orange-100/50 flex gap-1.5">
                      <FileText className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-[10px] uppercase text-orange-655 block">Catatan:</span>
                        {attendance.notes_out}
                      </div>
                    </div>
                  )}

                  {/* Check-Out Map */}
                  {attendance.latitude_out && attendance.longitude_out && !isNaN(parseFloat(attendance.latitude_out)) && !isNaN(parseFloat(attendance.longitude_out)) && (
                    <div className="mt-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Peta Check-Out</span>
                      <AttendanceMap 
                        lat={attendance.latitude_out} 
                        lng={attendance.longitude_out} 
                        title={`Keluar: ${attendance.user.name}`} 
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="py-6 text-center text-slate-400 italic text-xs font-semibold">
                  Belum melakukan absen keluar
                </div>
              )}
            </div>

            {attendance.clock_out && attendance.photo_out && (
              <div className="aspect-video w-full rounded-xl overflow-hidden border border-orange-100 bg-orange-50/20 mt-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Foto Selfie Keluar</span>
                <img 
                  src={`http://localhost:8000${attendance.photo_out}`} 
                  alt="Selfie Check-Out" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

        </div>

        {/* Sales / Field Visits Timeline Section */}
        {attendance.clock_in && (
          <div className="mt-8 border-t border-orange-100 pt-6 space-y-4">
            <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 font-quicksand">
              <Compass className="w-5 h-5 text-orange-500" />
              Laporan Kunjungan Sales / Lapangan Hari Ini
            </h4>

            {visitsLoading ? (
              <div className="text-center py-4 text-xs font-semibold text-slate-500 flex justify-center items-center gap-2">
                <RefreshCw className="animate-spin h-4.5 w-4.5 text-orange-500" />
                <span>Memuat data kunjungan sales...</span>
              </div>
            ) : visits.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Karyawan tidak melaporkan kunjungan lapangan/sales pada hari ini.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visits.map((visit) => (
                  <div key={visit.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-4 items-start shadow-sm">
                    {visit.photo_path && (
                      <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                        <img 
                          src={`http://localhost:8000${visit.photo_path}`} 
                          alt="Selfie Kunjungan" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="space-y-1.5 flex-grow overflow-hidden">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-slate-800 block truncate" title={visit.client_name}>
                          {visit.client_name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-55 text-orange-600 border border-orange-100 font-bold font-mono shrink-0">
                          {visit.visit_time.substring(0, 5)}
                        </span>
                      </div>
                      
                      {visit.notes && (
                        <p className="text-[11px] text-slate-655 leading-relaxed font-medium line-clamp-2" title={visit.notes}>
                          {visit.notes}
                        </p>
                      )}

                      <div className="flex flex-col gap-1 mt-2">
                        <span className="text-xs font-bold text-slate-700 leading-tight">
                          {resolvedAddresses[visit.id] ? (
                            resolvedAddresses[visit.id]
                          ) : (
                            <span className="text-slate-400 italic text-[11px] font-medium flex items-center gap-1">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-500" />
                              Mencari nama lokasi...
                            </span>
                          )}
                        </span>
                        
                        <div className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-700 font-mono font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${visit.latitude},${visit.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                            title="Buka di Google Maps"
                          >
                            Buka Peta
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-orange-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-orange-50/50 border border-orange-100 hover:bg-orange-50 text-slate-600 rounded-xl transition-all cursor-pointer text-xs font-bold font-quicksand"
          >
            Tutup Detail
          </button>
        </div>
      </div>
    </div>
  )
}
