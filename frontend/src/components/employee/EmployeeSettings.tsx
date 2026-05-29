import React, { useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { Lock, Save, ShieldAlert, KeyRound } from 'lucide-react'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'employee'
}

interface EmployeeSettingsProps {
  user: User
  token: string
}

export default function EmployeeSettings({ user, token }: EmployeeSettingsProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword || !newPassword || !confirmPassword) {
      Swal.fire({
        title: 'Form Belum Lengkap',
        text: 'Silakan isi semua kolom kata sandi.',
        icon: 'warning',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#6366f1'
      })
      return
    }

    if (newPassword.length < 6) {
      Swal.fire({
        title: 'Sandi Terlalu Pendek',
        text: 'Kata sandi baru minimal harus terdiri dari 6 karakter.',
        icon: 'warning',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#6366f1'
      })
      return
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        title: 'Konfirmasi Sandi Salah',
        text: 'Kata sandi baru dan konfirmasi kata sandi tidak cocok.',
        icon: 'warning',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#6366f1'
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await axios.put(
        'http://localhost:8000/api/user/change-password',
        {
          current_password: currentPassword,
          new_password: newPassword
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.status === 'success') {
        Swal.fire({
          title: 'Berhasil!',
          text: response.data.message || 'Kata sandi berhasil diperbarui.',
          icon: 'success',
          background: '#1e293b',
          color: '#f8fafc',
          timer: 2000,
          showConfirmButton: false
        })

        // Clear fields
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal mengubah kata sandi.'
      Swal.fire({
        title: 'Gagal Mengubah Sandi',
        text: msg,
        icon: 'error',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#ef4444'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="border-b border-orange-100 pb-3">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 font-quicksand">
            <KeyRound className="w-5 h-5 text-red-500" />
            Pengaturan Akun & Sandi
          </h2>
          <p className="text-xs text-slate-500 mt-1">Ubah kata sandi login Anda secara berkala untuk menjaga keamanan akun.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* User Info View (Read-Only) */}
          <div className="grid grid-cols-2 gap-4 bg-orange-50/20 border border-orange-100 p-4 rounded-2xl">
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-quicksand">Nama Akun</span>
              <span className="text-sm font-bold text-slate-800 font-quicksand">{user.name}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-quicksand">Alamat Email</span>
              <span className="text-sm font-bold text-slate-800 truncate block font-quicksand">{user.email}</span>
            </div>
          </div>

          {/* Current Password */}
          <div>
            <label className="block text-xs font-extrabold text-slate-550 uppercase tracking-wider mb-2 font-quicksand">
              Kata Sandi Saat Ini
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan kata sandi aktif"
                className="w-full bg-slate-50 border border-slate-200 hover:border-orange-200 focus:border-red-500 focus:ring-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 pl-10 pr-4 outline-none transition-all text-xs font-medium font-quicksand"
              />
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* New Password */}
          <div>
            <label className="block text-xs font-extrabold text-slate-550 uppercase tracking-wider mb-2 font-quicksand">
              Kata Sandi Baru
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Kata sandi baru (min. 6 karakter)"
                className="w-full bg-slate-50 border border-slate-200 hover:border-orange-200 focus:border-red-500 focus:ring-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 pl-10 pr-4 outline-none transition-all text-xs font-medium font-quicksand"
              />
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-extrabold text-slate-550 uppercase tracking-wider mb-2 font-quicksand">
              Konfirmasi Kata Sandi Baru
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang kata sandi baru"
                className="w-full bg-slate-50 border border-slate-200 hover:border-orange-200 focus:border-red-500 focus:ring-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 pl-10 pr-4 outline-none transition-all text-xs font-medium font-quicksand"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-655 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-md shadow-red-500/10 cursor-pointer text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed font-quicksand"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0"></span>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Safety Notice */}
      <div className="p-4 bg-orange-50/20 border border-orange-100 rounded-2xl flex items-center gap-3 shadow-sm">
        <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
        <p className="text-xs text-slate-605 leading-relaxed font-quicksand font-semibold">
          <strong>Perhatian Keamanan:</strong> Jangan gunakan kata sandi yang mudah ditebak (seperti nama sendiri atau tanggal lahir). Selalu pastikan sesi Anda keluar dari perangkat publik setelah melakukan presensi.
        </p>
      </div>
    </div>
  )
}
