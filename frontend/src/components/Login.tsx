import React, { useState } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import {
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  LogIn,
  MapPin,
  BarChart2,
  ShieldCheck,
  CheckSquare,
  Square
} from 'lucide-react'
import Logo from './layout/Logo'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'employee' | 'director'
  company?: string | null
}

interface LoginProps {
  onLoginSuccess: (token: string, user: User) => void
  isOnline: boolean
}

const BRAND_ORANGE = '#ea580c'
const BRAND_ORANGE_DARK = '#c2410c'

export default function Login({ onLoginSuccess, isOnline }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'standard' | 'director'>('standard')
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const currentAccentColor = BRAND_ORANGE

  const handleTabChange = (tab: 'standard' | 'director') => {
    setActiveTab(tab)
    setEmail('')
    setPassword('')
  }

  const handleLogin = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault()
    if (!email || !password) {
      Swal.fire({ title: 'Form Belum Lengkap', text: 'Silakan isi email dan kata sandi Anda.', icon: 'warning', background: '#fff7f5', color: '#3c1105', confirmButtonColor: currentAccentColor })
      return
    }
    setLoading(true)
    try {
      const response = await axios.post('http://localhost:8000/api/login', { email, password })
      if (response.data.status === 'success') {
        const { token, user } = response.data
        Swal.fire({ title: 'Login Berhasil!', text: `Selamat datang, ${user.name}!`, icon: 'success', timer: 1500, showConfirmButton: false, background: '#fff7f5', color: '#3c1105' })
        onLoginSuccess(token, user)
      }
    } catch (err: any) {
      let msg = 'Terjadi kesalahan saat menghubungi server.'
      if (err.response?.data?.message) msg = err.response.data.message
      else if (err.response?.data?.errors) msg = Object.values(err.response.data.errors).flat().join('\n')
      Swal.fire({ title: 'Login Gagal', text: msg, icon: 'error', background: '#fff7f5', color: '#3c1105', confirmButtonColor: currentAccentColor })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/30 font-quicksand relative z-0">

      {/* ══════════════════════════════════════
          MAIN CONTENT — Two Columns
      ══════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0">

        {/* ─── LEFT PANEL (hidden on mobile/tablet) ─── */}
        <div className="hidden lg:flex lg:w-[58%] xl:w-[60%] relative flex-col justify-between overflow-hidden"
          style={{
            background: `linear-gradient(145deg, ${BRAND_ORANGE} 0%, #c2410c 100%)`,
            transition: 'background 0.5s ease'
          }}>

          {/* Decorative grid pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
            backgroundSize: '48px 48px'
          }} />

          {/* Abstract building silhouette shapes */}
          <div className="absolute right-0 bottom-0 w-[75%] h-[80%] opacity-10">
            {/* Building shapes */}
            <div className="absolute bottom-0 right-8 w-28 h-64 bg-white rounded-t-sm" />
            <div className="absolute bottom-0 right-40 w-20 h-80 bg-white rounded-t-sm" />
            <div className="absolute bottom-0 right-24 w-16 h-48 bg-white rounded-t-sm" />
            <div className="absolute bottom-0 right-64 w-24 h-56 bg-white rounded-t-sm" />
            <div className="absolute bottom-0 right-80 w-14 h-40 bg-white rounded-t-sm" />
            {/* Window dots */}
            {Array.from({ length: 6 }).map((_, row) =>
              Array.from({ length: 4 }).map((_, col) => (
                <div key={`${row}-${col}`}
                  className="absolute w-2 h-2 bg-white rounded-sm"
                  style={{ bottom: `${40 + row * 48}px`, right: `${50 + col * 32}px`, opacity: Math.random() > 0.4 ? 0.6 : 0 }} />
              ))
            )}
          </div>

          {/* Glow circle */}
          <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
            style={{ background: activeTab === 'director' ? 'radial-gradient(circle, #fbbf24, transparent)' : 'radial-gradient(circle, #fca5a5, transparent)' }} />

          {/* Left panel content */}
          <div className="relative z-10 flex flex-col justify-center h-full px-10 xl:px-14 pb-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 bg-white/10 text-white text-[11px] font-bold uppercase tracking-widest w-fit mb-10">
              <ShieldCheck className={`w-3.5 h-3.5 ${activeTab === 'director' ? 'animate-pulse' : ''}`} />
              {activeTab === 'director' ? 'Directorate Executive Portal' : 'Enterprise Security'}
            </div>

            {/* Heading */}
            <h1 className="text-3xl xl:text-4xl font-black text-white leading-tight mb-5 max-w-sm transition-all duration-300">
              {activeTab === 'director' ? 'Panel Keputusan & Pengawasan Direksi' : 'Sistem Informasi Absensi Karyawan'}
            </h1>

            {/* Description */}
            <p className="text-white/75 text-sm leading-relaxed max-w-sm mb-10 transition-all duration-300">
              {activeTab === 'director'
                ? 'Akses eksklusif untuk jajaran Direktur Utama guna mengambil keputusan strategis, persetujuan administratif, dan pengawasan metrik kinerja secara real-time.'
                : 'Platform pencatatan presensi digital karyawan terintegrasi. Dirancang untuk efisiensi tinggi dan akurasi data dalam ekosistem perusahaan modern.'}
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3">
              {activeTab === 'director' ? (
                <>
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-xs font-semibold backdrop-blur-sm hover:bg-white/20 transition-all cursor-default">
                    <CheckSquare className="w-3.5 h-3.5" />
                    Executive Approvals
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-xs font-semibold backdrop-blur-sm hover:bg-white/20 transition-all cursor-default">
                    <BarChart2 className="w-3.5 h-3.5 animate-bounce" />
                    Operational Overview
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-xs font-semibold backdrop-blur-sm hover:bg-white/20 transition-all cursor-default">
                    <MapPin className="w-3.5 h-3.5 text-orange-300 animate-bounce" />
                    Geofencing Tracking
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-xs font-semibold backdrop-blur-sm hover:bg-white/20 transition-all cursor-default">
                    <BarChart2 className="w-3.5 h-3.5 text-orange-300" />
                    Biometric Auth
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bottom stats bar */}
          <div className="relative z-10 px-10 xl:px-14 pb-8">
            <div className="flex items-center gap-8 text-white/60 text-[11px] font-semibold">
              <div>
                <span className="block text-white text-lg font-black">99.9%</span>
                <span>Uptime</span>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <span className="block text-white text-lg font-black">Real-time</span>
                <span>Data Sync</span>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <span className="block text-white text-lg font-black">AES-256</span>
                <span>Encryption</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT PANEL (Login Form) ─── */}
        <div className="flex-1 flex flex-col bg-transparent relative z-0 overflow-hidden">
          
          {/* Decorative Glow Bubbles on Mobile */}
          <div className="absolute top-[-10%] right-[-10%] w-72 h-72 rounded-full bg-gradient-to-br from-amber-300/20 to-orange-400/20 blur-[80px] -z-10 pointer-events-none lg:hidden animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 rounded-full bg-gradient-to-br from-orange-200/15 to-rose-300/15 blur-[100px] -z-10 pointer-events-none lg:hidden" />

          {/* Form area — scrollable on small screens */}
          <div className="flex-1 flex items-center justify-center px-4 sm:px-10 lg:px-12 xl:px-16 py-8 overflow-y-auto z-10">
            <div className="w-full max-w-md bg-white/80 backdrop-blur-md border border-white/60 shadow-[0_20px_50px_rgba(234,88,12,0.06)] rounded-3xl p-6 sm:p-8 animate-fade-in relative z-20">

              {/* Mobile Logo & Welcome Title — only shown on small screens */}
              <div className="lg:hidden flex flex-col items-center mb-8">
                <Logo className="w-12 h-12" />
                <h2 className="text-xl font-black text-slate-900 mt-4 font-sans tracking-tight">
                  {activeTab === 'director' ? 'Portal Direksi' : 'goodpeople-hcms'}
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium text-center max-w-xs leading-relaxed">
                  {activeTab === 'director'
                    ? 'Silakan masuk dengan kredensial Direktur Utama Anda.'
                    : 'Portal presensi digital terintegrasi untuk karyawan.'}
                </p>
              </div>

              {/* TABS SIDE SWITCHER FOR DIRECTOR */}
              <div className="flex bg-slate-100/80 backdrop-blur-sm p-1 rounded-2xl mb-8 font-quicksand font-bold text-xs select-none border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => handleTabChange('standard')}
                  className={`flex-grow py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer font-bold ${
                    activeTab === 'standard'
                      ? 'bg-white text-orange-600 shadow-[0_4px_12px_rgba(234,88,12,0.08)]'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ShieldCheck className={`w-4 h-4 transition-transform duration-300 ${activeTab === 'standard' ? 'scale-110 text-orange-500' : ''}`} />
                  Karyawan & Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('director')}
                  className={`flex-grow py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer font-bold ${
                    activeTab === 'director'
                      ? 'bg-white text-orange-600 shadow-[0_4px_12px_rgba(234,88,12,0.08)]'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LogIn className={`w-4 h-4 transition-transform duration-300 ${activeTab === 'director' ? 'scale-110 text-orange-500' : ''}`} />
                  Direktur Utama
                </button>
              </div>

              {/* Desktop Heading — only shown on large screens */}
              <div className="mb-8 hidden lg:block">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight transition-all duration-300">
                  {activeTab === 'director' ? 'Portal Direksi' : 'Selamat Datang'}
                </h2>
                <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed transition-all duration-300">
                  {activeTab === 'director'
                    ? 'Silakan masuk dengan kredensial Direktur Utama Anda.'
                    : 'Silakan masuk untuk mengakses portal karyawan Anda.'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-5">

                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest transition-colors duration-300" style={emailFocused ? { color: BRAND_ORANGE } : {}}>
                    Alamat Email
                  </label>
                  <div className={`relative flex items-center border rounded-2xl transition-all duration-300 ${
                    emailFocused 
                      ? 'border-orange-500 bg-white ring-4 ring-orange-100 shadow-[0_4px_12px_rgba(234,88,12,0.05)]' 
                      : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                  }`}>
                    <div className={`absolute left-4 transition-colors duration-300 ${emailFocused ? 'text-orange-500' : 'text-slate-400'}`}>
                      <Mail className="w-4.5 h-4.5" />
                    </div>
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      placeholder="nama@perusahaan.com"
                      className="w-full bg-transparent text-slate-800 placeholder-slate-400 rounded-2xl py-3.5 pl-12 pr-4 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest transition-colors duration-300" style={passwordFocused ? { color: BRAND_ORANGE } : {}}>
                      Kata Sandi
                    </label>
                    <button type="button" className="text-xs font-bold hover:underline cursor-pointer transition-colors duration-300 hover:text-orange-700 font-sans" style={{ color: currentAccentColor }}>
                      Lupa Sandi?
                    </button>
                  </div>
                  <div className={`relative flex items-center border rounded-2xl transition-all duration-300 ${
                    passwordFocused 
                      ? 'border-orange-500 bg-white ring-4 ring-orange-100 shadow-[0_4px_12px_rgba(234,88,12,0.05)]' 
                      : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                  }`}>
                    <div className={`absolute left-4 transition-colors duration-300 ${passwordFocused ? 'text-orange-500' : 'text-slate-400'}`}>
                      <Lock className="w-4.5 h-4.5" />
                    </div>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      placeholder="••••••••"
                      className="w-full bg-transparent text-slate-800 placeholder-slate-400 rounded-2xl py-3.5 pl-12 pr-12 outline-none transition-all text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <button
                  type="button"
                  onClick={() => setRememberMe(v => !v)}
                  className="flex items-center gap-3 cursor-pointer group w-fit"
                >
                  <div className="transition-all duration-300 transform group-hover:scale-110 shrink-0" style={rememberMe ? { color: currentAccentColor } : { color: '#94a3b8' }}>
                    {rememberMe
                      ? <CheckSquare className="w-5 h-5 transition-transform duration-200" />
                      : <Square className="w-5 h-5 text-slate-300 hover:text-slate-400" />}
                  </div>
                  <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-700 transition-colors select-none">
                    Tetap masuk selama 30 hari
                  </span>
                </button>

                {/* Submit */}
                <button
                  id="login-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-4 flex items-center justify-center gap-2.5 text-white font-bold rounded-2xl transition-all duration-300 text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transform active:scale-[0.98] hover:translate-y-[-1px] group relative overflow-hidden"
                  style={{
                    background: loading 
                      ? '#c2410c'
                      : `linear-gradient(135deg, ${BRAND_ORANGE} 0%, ${BRAND_ORANGE_DARK} 100%)`,
                    boxShadow: loading 
                      ? 'none'
                      : '0 10px 25px -5px rgba(234,88,12,0.4), 0 8px 10px -6px rgba(234,88,12,0.4)'
                  }}
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />Memproses...</>
                  ) : (
                    <>
                      <span className="font-bold tracking-wide">Masuk Ke Portal</span>
                      <LogIn className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              {/* Offline warning */}
              {!isOnline && (
                <div className="mt-6 flex items-start gap-3 p-4 bg-rose-50/80 backdrop-blur-sm border border-rose-100 rounded-2xl animate-pulse">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 mt-1 animate-ping" />
                  <div>
                    <p className="text-xs text-rose-800 font-bold">
                      Koneksi Terputus
                    </p>
                    <p className="text-[11px] text-rose-600/90 font-medium mt-0.5 leading-relaxed">
                      Server offline — pastikan backend Laravel berjalan dengan perintah <code className="font-mono bg-rose-100/80 px-1.5 py-0.5 rounded text-[10px]">php artisan serve</code>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="w-full border-t border-slate-200/40 bg-white/50 backdrop-blur-sm px-5 sm:px-8 lg:px-12 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 z-10">
        <p className="text-[11px] text-slate-400 font-semibold">
          © 2024 Portal Absensi Karyawan. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-[11px] text-slate-400 font-semibold">
          <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
          <span>·</span>
          <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
          <span>·</span>
          <a href="#" className="hover:text-slate-600 transition-colors">Security Compliance</a>
        </div>
      </footer>
    </div>
  )
}
