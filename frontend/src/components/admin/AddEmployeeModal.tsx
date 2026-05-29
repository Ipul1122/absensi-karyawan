import React from 'react'
import { X, User, Mail, Lock, Loader2, UserPlus } from 'lucide-react'

interface AddEmployeeModalProps {
  show: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  newName: string
  setNewName: (v: string) => void
  newEmail: string
  setNewEmail: (v: string) => void
  newPassword: string
  setNewPassword: (v: string) => void
  submitting: boolean
}

export default function AddEmployeeModal({
  show,
  onClose,
  onSubmit,
  newName,
  setNewName,
  newEmail,
  setNewEmail,
  newPassword,
  setNewPassword,
  submitting,
}: AddEmployeeModalProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full relative shadow-2xl overflow-hidden animate-zoom-in">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
        
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-extrabold text-white flex items-center gap-2 font-quicksand">
            <UserPlus className="w-5 h-5 text-indigo-400" /> Tambah Akun Karyawan
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-all cursor-pointer text-slate-455 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-quicksand">
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-slate-550" />
              <input
                type="text"
                required
                placeholder="Contoh: Syaiful"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-white placeholder-slate-550 rounded-xl py-2.5 pl-9 pr-4 outline-none transition-all text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-quicksand">
              Email Karyawan
            </label>
            <div className="relative">
              <Mail className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-slate-550" />
              <input
                type="email"
                required
                placeholder="syaiful@perusahaan.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-white placeholder-slate-550 rounded-xl py-2.5 pl-9 pr-4 outline-none transition-all text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-quicksand">
              Password Login
            </label>
            <div className="relative">
              <Lock className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-slate-550" />
              <input
                type="password"
                required
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-white placeholder-slate-550 rounded-xl py-2.5 pl-9 pr-4 outline-none transition-all text-xs"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-950 border border-slate-850 hover:bg-slate-800 text-slate-350 hover:text-white rounded-xl transition-all cursor-pointer text-xs font-bold font-quicksand"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed font-quicksand"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Buat Akun'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
