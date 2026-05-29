import React, { useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { Mail, Lock, Loader2, LogIn, ShieldAlert } from 'lucide-react'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'employee'
}

interface LoginProps {
  onLoginSuccess: (token: string, user: User) => void
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      Swal.fire({
        title: 'Form Belum Lengkap',
        text: 'Silakan isi email dan password Anda.',
        icon: 'warning',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#ef4444'
      })
      return
    }

    setLoading(true)

    try {
      const response = await axios.post('http://localhost:8000/api/login', {
        email,
        password
      })

      if (response.data.status === 'success') {
        const { token, user } = response.data
        
        Swal.fire({
          title: 'Login Berhasil!',
          text: `Selamat datang kembali, ${user.name}!`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: '#1e293b',
          color: '#f8fafc'
        })

        // Pass authentication credentials upward
        onLoginSuccess(token, user)
      }
    } catch (err: any) {
      console.error(err)
      let errorMessage = 'Terjadi kesalahan saat menghubungi server.'
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message
      } else if (err.response && err.response.data && err.response.data.errors) {
        // Validation errors
        const errors = err.response.data.errors
        errorMessage = Object.values(errors).flat().join('\n')
      }

      Swal.fire({
        title: 'Login Gagal',
        text: errorMessage,
        icon: 'error',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#ef4444'
      })
    } finally {
      setLoading(false)
    }
  }

  // Quick fill helper
  const handleQuickFill = (role: 'admin' | 'employee') => {
    if (role === 'admin') {
      setEmail('admin@absen.com')
      setPassword('password')
    } else {
      setEmail('karyawan@absen.com')
      setPassword('password')
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Background decoration elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-500/5 rounded-full blur-3xl -z-10 animate-pulse duration-[8000ms]"></div>
      <div className="absolute top-1/3 left-1/3 w-60 h-60 bg-orange-500/5 rounded-full blur-3xl -z-10 animate-pulse duration-[6000ms]"></div>

      <div className="bg-white/95 border border-orange-100/90 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[2.5px] bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
        
        {/* Title */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/20 mb-4">
            <LogIn className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">Selamat Datang</h2>
          <p className="text-sm text-slate-500 mt-1.5 font-quicksand font-semibold">Silakan masuk ke portal Absensi Karyawan</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-extrabold text-slate-550 uppercase tracking-wider mb-2 font-quicksand">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-red-500">
                <Mail className="w-4.5 h-4.5 transition-colors" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
                className="w-full bg-slate-50 border border-slate-200 hover:border-orange-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-3 pl-10 pr-4 outline-none transition-all text-sm font-medium font-quicksand"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-550 uppercase tracking-wider mb-2 font-quicksand">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-red-500">
                <Lock className="w-4.5 h-4.5 transition-colors" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 hover:border-orange-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-3 pl-10 pr-4 outline-none transition-all text-sm font-medium font-quicksand"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-3 font-quicksand duration-300 transform active:scale-98"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Masuk
              </>
            )}
          </button>
        </form>

        {/* Quick Fills */}
        <div className="mt-8 pt-6 border-t border-orange-100">
          <div className="flex items-center gap-1.5 mb-3 text-xs text-red-500 font-bold font-quicksand">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <span>Mode Demo (Klik untuk Isi Instan)</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleQuickFill('admin')}
              className="text-xs py-2.5 px-3 rounded-xl bg-orange-50/10 hover:bg-red-50 border border-orange-100 hover:border-red-200 text-slate-700 font-bold transition-all text-left flex flex-col cursor-pointer font-quicksand shadow-sm"
            >
              <span className="text-[9px] text-red-500 font-extrabold uppercase">Akun Admin</span>
              <span className="truncate font-semibold mt-0.5 text-slate-800">admin@absen.com</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('employee')}
              className="text-xs py-2.5 px-3 rounded-xl bg-orange-50/10 hover:bg-orange-50 border border-orange-100 hover:border-orange-200 text-slate-700 font-bold transition-all text-left flex flex-col cursor-pointer font-quicksand shadow-sm"
            >
              <span className="text-[9px] text-orange-600 font-extrabold uppercase">Akun Karyawan</span>
              <span className="truncate font-semibold mt-0.5 text-slate-800">karyawan@absen.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
