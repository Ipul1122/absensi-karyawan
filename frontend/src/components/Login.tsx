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
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse duration-[8000ms]"></div>
      <div className="absolute top-1/3 left-1/3 w-60 h-60 bg-violet-500/10 rounded-full blur-3xl -z-10 animate-pulse duration-[6000ms]"></div>

      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
        
        {/* Title */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
            <LogIn className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Selamat Datang</h2>
          <p className="text-sm text-slate-400 mt-1 font-quicksand">Silakan masuk ke portal Absensi Karyawan</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-quicksand">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400">
                <Mail className="w-5 h-5 transition-colors" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
                className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-500 rounded-xl py-3 pl-10 pr-4 outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-quicksand">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400">
                <Lock className="w-5 h-5 transition-colors" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-500 rounded-xl py-3 pl-10 pr-4 outline-none transition-all text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2 font-quicksand"
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
        <div className="mt-8 pt-6 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5 mb-3 text-xs text-indigo-400/80 font-semibold font-quicksand">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Mode Demo (Klik untuk Isi Instan)</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => handleQuickFill('admin')}
              className="text-xs py-2 px-3 rounded-lg bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 text-slate-300 font-bold transition-all text-left flex flex-col cursor-pointer font-quicksand"
            >
              <span className="text-[10px] text-indigo-400 font-bold uppercase">Akun Admin</span>
              <span className="truncate font-medium">admin@absen.com</span>
            </button>
            <button
              onClick={() => handleQuickFill('employee')}
              className="text-xs py-2 px-3 rounded-lg bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800 hover:border-violet-500/40 text-slate-300 font-bold transition-all text-left flex flex-col cursor-pointer font-quicksand"
            >
              <span className="text-[10px] text-violet-400 font-bold uppercase">Akun Karyawan</span>
              <span className="truncate font-medium">karyawan@absen.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
