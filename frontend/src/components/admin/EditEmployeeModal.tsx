import React from 'react'
import { X, User, Mail, Lock, Loader2, Edit3 } from 'lucide-react'

interface EditEmployeeModalProps {
  show: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  name: string
  setName: (v: string) => void
  email: string
  password: string
  setPassword: (v: string) => void
  submitting: boolean
}

export default function EditEmployeeModal({
  show,
  onClose,
  onSubmit,
  name,
  setName,
  email,
  password,
  setPassword,
  submitting,
}: EditEmployeeModalProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-950/20 backdrop-blur-md animate-fade-in">
      <div className="bg-white border border-orange-100 rounded-3xl p-6 max-w-md w-full relative shadow-xl overflow-hidden animate-zoom-in">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
        
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2 font-quicksand">
            <Edit3 className="w-5 h-5 text-red-500" /> Edit Akun Karyawan
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-orange-50 rounded-lg transition-all cursor-pointer text-slate-400 hover:text-red-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-quicksand">
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-orange-400/80" />
              <input
                type="text"
                required
                placeholder="Contoh: Syaiful"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 pl-9 pr-4 outline-none transition-all text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-quicksand">
              Email Karyawan (Tidak dapat diubah)
            </label>
            <div className="relative">
              <Mail className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-slate-400" />
              <input
                type="email"
                disabled
                value={email}
                className="w-full bg-slate-100 border border-slate-200 text-slate-400 rounded-xl py-2.5 pl-9 pr-4 outline-none text-xs cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-quicksand">
              Password Login Baru
            </label>
            <div className="relative">
              <Lock className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-orange-400/80" />
              <input
                type="password"
                placeholder="Kosongkan jika tidak ingin diubah"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 pl-9 pr-4 outline-none transition-all text-xs"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-orange-50/50 border border-orange-100 hover:bg-orange-50 text-slate-600 rounded-xl transition-all cursor-pointer text-xs font-bold font-quicksand"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed font-quicksand"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
