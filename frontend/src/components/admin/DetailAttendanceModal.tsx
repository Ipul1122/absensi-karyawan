import React from 'react'
import { X, Clock, MapPin, FileText } from 'lucide-react'
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
  }
}

interface DetailAttendanceModalProps {
  attendance: Attendance | null
  onClose: () => void
  formatDate: (d: string) => string
  getStatusBadge: (s: string | null) => React.ReactNode
}

export default function DetailAttendanceModal({
  attendance,
  onClose,
  formatDate,
  getStatusBadge,
}: DetailAttendanceModalProps) {
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
