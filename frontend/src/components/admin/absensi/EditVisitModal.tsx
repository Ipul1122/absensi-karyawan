import React, { useState, useEffect } from 'react'
import { X, Clock, Loader2, MapPin } from 'lucide-react'
import axios from 'axios'
import Swal from 'sweetalert2'

interface User {
  id: number
  name: string
  email: string
}

interface Visit {
  id: number
  user_id: number
  date: string
  visit_time: string
  client_name: string
  latitude: string
  longitude: string
  notes?: string | null
  visit_time_out?: string | null
  latitude_out?: string | null
  longitude_out?: string | null
  notes_out?: string | null
  user: User
}

interface EditVisitModalProps {
  show: boolean
  onClose: () => void
  onSuccess: () => void
  visit: Visit | null
  token: string
  formatDate: (d: string) => string
}

export default function EditVisitModal({
  show,
  onClose,
  onSuccess,
  visit,
  token,
}: EditVisitModalProps) {
  const [clientName, setClientName] = useState('')
  const [date, setDate] = useState('')
  const [visitTime, setVisitTime] = useState('')
  const [visitTimeOut, setVisitTimeOut] = useState('')
  const [notes, setNotes] = useState('')
  const [notesOut, setNotesOut] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (show && visit) {
      setClientName(visit.client_name || '')
      setDate(visit.date || '')
      setVisitTime(visit.visit_time ? visit.visit_time.substring(0, 5) : '')
      setVisitTimeOut(visit.visit_time_out ? visit.visit_time_out.substring(0, 5) : '')
      setNotes(visit.notes || '')
      setNotesOut(visit.notes_out || '')
    }
  }, [show, visit])

  if (!show || !visit) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName) {
      Swal.fire({
        title: 'Formulir Belum Lengkap',
        text: 'Nama klien / tujuan wajib diisi.',
        icon: 'warning',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#6366f1',
      })
      return
    }

    setUpdating(true)
    try {
      const response = await axios.put(
        `http://localhost:8000/api/admin/sales-visits/${visit.id}`,
        {
          client_name: clientName,
          date: date,
          visit_time: visitTime,
          visit_time_out: visitTimeOut || null,
          notes: notes || null,
          notes_out: notesOut || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (response.data.status === 'success') {
        Swal.fire({
          title: 'Berhasil!',
          text: response.data.message || 'Laporan kunjungan berhasil diperbarui.',
          icon: 'success',
          background: '#1e293b',
          color: '#f8fafc',
          timer: 2000,
          showConfirmButton: false,
        })
        onSuccess()
        onClose()
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal memperbarui laporan kunjungan.'
      Swal.fire({
        title: 'Gagal',
        text: msg,
        icon: 'error',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#ef4444',
      })
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-950/20 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white border border-orange-100 rounded-3xl p-6 max-w-md w-full relative shadow-xl overflow-hidden animate-zoom-in my-8 max-h-[90vh] overflow-y-auto font-quicksand">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-red-500 via-orange-500 to-transparent"></div>

        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" /> Edit Laporan Kunjungan
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-orange-50/50 rounded-lg transition-all cursor-pointer text-slate-400 hover:text-red-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <span className="block text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1 font-mono">Karyawan</span>
            <p className="text-sm font-bold text-slate-800">{visit.user.name}</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{visit.user.email}</p>
          </div>

          {/* Date Input */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Tanggal Kunjungan *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-semibold"
              required
            />
          </div>

          {/* Client Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Nama Klien / Tujuan *
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Misal: PT Maju Jaya"
              className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-semibold"
              required
            />
          </div>

          {/* Times Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Jam Masuk *
              </label>
              <input
                type="time"
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
                className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-mono font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Jam Keluar
              </label>
              <input
                type="time"
                value={visitTimeOut}
                onChange={(e) => setVisitTimeOut(e.target.value)}
                className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 text-slate-800 rounded-xl py-2.5 px-4 outline-none transition-all text-xs font-mono font-semibold"
              />
            </div>
          </div>

          {/* Notes In */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Catatan Masuk
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan ketika sampai..."
              rows={2}
              className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 text-slate-805 placeholder-slate-400 rounded-xl py-2.5 px-4 outline-none transition-all text-xs resize-none font-semibold"
            />
          </div>

          {/* Notes Out */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Catatan Keluar
            </label>
            <textarea
              value={notesOut}
              onChange={(e) => setNotesOut(e.target.value)}
              placeholder="Catatan ketika pulang / checkout..."
              rows={2}
              className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 text-slate-850 placeholder-slate-400 rounded-xl py-2.5 px-4 outline-none transition-all text-xs resize-none font-semibold"
            />
          </div>

          {/* GPS Coordinates Alert (Info) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-[10px] font-mono">
            <span className="text-slate-500 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-orange-500" />
              Koordinat GPS:
            </span>
            <span className="text-slate-700 font-bold">
              {visit.latitude ? parseFloat(visit.latitude).toFixed(4) : '0.0000'}, {visit.longitude ? parseFloat(visit.longitude).toFixed(4) : '0.0000'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-orange-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-orange-50/50 border border-orange-100 hover:bg-orange-50 text-slate-600 rounded-xl transition-all cursor-pointer text-xs font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={updating}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
