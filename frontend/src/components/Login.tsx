import React, { useState } from 'react'
import { Link } from 'react-router-dom'
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
  X,
} from 'lucide-react'
import { API_BASE_URL } from '../utils/api'

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

export default function Login({ onLoginSuccess, isOnline }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'standard' | 'director'>('standard')
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  // Forgot password states
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOtp, setForgotOtp] = useState('')
  const [forgotNewPassword, setForgotNewPassword] = useState('')
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('')
  const [forgotStep, setForgotStep] = useState<number>(1)
  const [forgotLoading, setForgotLoading] = useState(false)

  const currentAccentColor = BRAND_ORANGE

  const handleTabChange = (tab: 'standard' | 'director') => {
    setActiveTab(tab)
    setEmail('')
    setPassword('')
  }

  const handleCloseForgotModal = () => {
    setShowForgotModal(false)
    setForgotEmail('')
    setForgotOtp('')
    setForgotNewPassword('')
    setForgotConfirmPassword('')
    setForgotStep(1)
  }

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) return
    
    setForgotLoading(true)
    try {
      const res = await axios.post(`${API_BASE_URL}/api/forgot-password`, { email: forgotEmail })
      if (res.data.status === 'success') {
        Swal.fire({
          title: 'OTP Terkirim!',
          text: res.data.message,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          background: '#fff7f5',
          color: '#3c1105'
        })
        setForgotStep(2)
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal mengirim kode OTP.'
      Swal.fire({
        title: 'Gagal',
        text: msg,
        icon: 'error',
        background: '#fff7f5',
        color: '#3c1105'
      })
    } finally {
      setForgotLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotOtp || !forgotNewPassword || !forgotConfirmPassword) {
      Swal.fire({
        title: 'Form Belum Lengkap',
        text: 'Silakan isi semua bidang.',
        icon: 'warning',
        background: '#fff7f5',
        color: '#3c1105'
      })
      return
    }

    if (forgotNewPassword.length < 6) {
      Swal.fire({
        title: 'Password Terlalu Pendek',
        text: 'Kata sandi minimal harus terdiri dari 6 karakter.',
        icon: 'warning',
        background: '#fff7f5',
        color: '#3c1105'
      })
      return
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      Swal.fire({
        title: 'Password Tidak Cocok',
        text: 'Konfirmasi kata sandi tidak cocok dengan kata sandi baru.',
        icon: 'warning',
        background: '#fff7f5',
        color: '#3c1105'
      })
      return
    }

    setForgotLoading(true)
    try {
      const res = await axios.post(`${API_BASE_URL}/api/reset-password`, {
        email: forgotEmail,
        otp: forgotOtp,
        password: forgotNewPassword
      })
      if (res.data.status === 'success') {
        Swal.fire({
          title: 'Berhasil!',
          text: res.data.message,
          icon: 'success',
          background: '#fff7f5',
          color: '#3c1105',
          timer: 2000,
          showConfirmButton: false
        })
        handleCloseForgotModal()
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal mengatur ulang kata sandi.'
      Swal.fire({
        title: 'Gagal',
        text: msg,
        icon: 'error',
        background: '#fff7f5',
        color: '#3c1105'
      })
    } finally {
      setForgotLoading(false)
    }
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
            <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-white/60 shadow-[0_20px_50px_rgba(234,88,12,0.06)] rounded-3xl p-6 sm:p-8 md:p-10 animate-fade-in relative z-20 transition-all duration-300">

              {/* Dual Company Logos Header Stack */}
              <div className="flex items-center justify-center gap-6 mb-7 mx-auto select-none">
                <div className="flex flex-col items-center group/logo transition-all duration-350 hover:translate-y-[-2px] cursor-pointer">
                  <img src="/logo/LOGO-CPI.png" alt="PT Cakrawala Parama Internasional" className="h-10 w-auto object-contain shrink-0 transition-transform duration-300 group-hover/logo:scale-[1.03]" />
                  <span className="text-[10px] font-black text-slate-800 tracking-[0.15em] uppercase mt-2">CAKRAWALA</span>
                </div>
                <div className="w-[1px] h-9 bg-slate-200/90 self-center" />
                <div className="flex flex-col items-center group/logo transition-all duration-350 hover:translate-y-[-2px] cursor-pointer">
                  <img src="/logo/LOGO-YPI.png" alt="PT Yasodana Parvez Internasional" className="h-10 w-auto object-contain shrink-0 transition-transform duration-300 group-hover/logo:scale-[1.03]" />
                  <span className="text-[10px] font-black text-slate-800 tracking-[0.15em] uppercase mt-2">YASODANA</span>
                </div>
              </div>

              {/* Mobile Welcome Title — only shown on small screens */}
              <div className="lg:hidden flex flex-col items-center mb-6">
                <h2 className="text-xl font-black text-slate-900 tracking-tight font-sans">
                  {activeTab === 'director' ? (
                    <span className="bg-gradient-to-r from-orange-600 to-red-650 bg-clip-text text-transparent font-extrabold">Portal Direksi</span>
                  ) : (
                    <>
                      <span className="text-slate-800 font-extrabold">goodpeople</span>
                      <span className="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent font-medium">-hcms</span>
                    </>
                  )}
                </h2>
                <p className="text-xs text-slate-450 mt-1.5 font-semibold text-center max-w-xs leading-relaxed">
                  {activeTab === 'director'
                    ? 'Silakan masuk dengan kredensial Direktur Utama Anda.'
                    : 'Portal presensi digital terintegrasi untuk karyawan.'}
                </p>
              </div>

              {/* TABS SIDE SWITCHER FOR DIRECTOR */}
              <div className="relative flex bg-slate-100 p-1.5 rounded-2xl mb-6 font-quicksand font-bold text-xs select-none border border-slate-200/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]">
                {/* Sliding active capsule indicator */}
                <div 
                  className="absolute top-1.5 bottom-1.5 left-1.5 rounded-xl bg-white shadow-[0_3px_8px_rgba(0,0,0,0.06)] border border-slate-200/30 transition-all duration-300 ease-out"
                  style={{
                    width: 'calc(50% - 6px)',
                    transform: activeTab === 'director' ? 'translateX(100%)' : 'translateX(0%)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleTabChange('standard')}
                  className={`relative z-10 flex-1 py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer font-extrabold active:scale-[0.95] ${
                    activeTab === 'standard'
                      ? 'text-orange-655'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <ShieldCheck className={`w-4 h-4 transition-all duration-300 ${activeTab === 'standard' ? 'scale-110 text-orange-500' : 'text-slate-400'}`} />
                  Karyawan & Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('director')}
                  className={`relative z-10 flex-1 py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer font-extrabold active:scale-[0.95] ${
                    activeTab === 'director'
                      ? 'text-orange-655'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <LogIn className={`w-4 h-4 transition-all duration-300 ${activeTab === 'director' ? 'scale-110 text-orange-500' : 'text-slate-400'}`} />
                  Direktur Utama
                </button>
              </div>

              {/* Desktop Heading — only shown on large screens */}
              <div className="mb-6 hidden lg:block">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight transition-all duration-300">
                  {activeTab === 'director' ? (
                    <span className="bg-gradient-to-r from-orange-600 to-red-650 bg-clip-text text-transparent font-extrabold">Portal Direksi</span>
                  ) : (
                    <span className="text-slate-800 font-extrabold">Selamat Datang</span>
                  )}
                </h2>
                <p className="text-xs text-slate-455 mt-1 font-semibold leading-relaxed transition-all duration-300">
                  {activeTab === 'director'
                    ? 'Silakan masuk dengan kredensial Direktur Utama Anda.'
                    : 'Silakan masuk untuk mengakses portal karyawan Anda.'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider transition-colors duration-300" style={emailFocused ? { color: BRAND_ORANGE } : {}}>
                    Alamat Email
                  </label>
                  <div className={`relative flex items-center border transition-all duration-350 ${
                    emailFocused 
                      ? 'border-orange-500 bg-white shadow-[0_0_0_4px_rgba(234,88,12,0.12)] scale-[1.01]' 
                      : 'border-slate-200 bg-slate-50/20 hover:border-slate-300/85'
                  }`} style={{ borderRadius: '16px' }}>
                    <div className={`absolute left-4 transition-all duration-300 ${emailFocused ? 'text-orange-500 scale-110' : 'text-slate-400'}`}>
                      <Mail className="w-4 h-4" />
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
                      className="w-full bg-transparent text-slate-800 placeholder-slate-400/70 rounded-2xl py-3.5 pl-12 pr-4 outline-none transition-all text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider transition-colors duration-300" style={passwordFocused ? { color: BRAND_ORANGE } : {}}>
                      Kata Sandi
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setShowForgotModal(true)}
                      className="text-[10.5px] font-extrabold hover:text-orange-700 cursor-pointer transition-all duration-200 font-quicksand active:scale-95 origin-right hover:underline hover:underline-offset-2" 
                      style={{ color: currentAccentColor }}
                    >
                      Lupa Sandi?
                    </button>
                  </div>
                  <div className={`relative flex items-center border transition-all duration-350 ${
                    passwordFocused 
                      ? 'border-orange-500 bg-white shadow-[0_0_0_4px_rgba(234,88,12,0.12)] scale-[1.01]' 
                      : 'border-slate-200 bg-slate-50/20 hover:border-slate-300/85'
                  }`} style={{ borderRadius: '16px' }}>
                    <div className={`absolute left-4 transition-all duration-300 ${passwordFocused ? 'text-orange-500 scale-110' : 'text-slate-400'}`}>
                      <Lock className="w-4 h-4" />
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
                      className="w-full bg-transparent text-slate-800 placeholder-slate-400/70 rounded-2xl py-3.5 pl-12 pr-12 outline-none transition-all text-xs font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-4 text-slate-400 hover:text-slate-600 transition-all cursor-pointer active:scale-75 duration-150"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <button
                  type="button"
                  onClick={() => setRememberMe(v => !v)}
                  className="flex items-center gap-2.5 cursor-pointer group w-fit select-none active:scale-[0.97] transition-all duration-150"
                >
                  <div className={`w-[18px] h-[18px] rounded-md border transition-all duration-200 flex items-center justify-center shrink-0 ${
                    rememberMe 
                      ? 'bg-gradient-to-tr from-orange-500 to-red-650 border-transparent text-white shadow-sm shadow-orange-500/20 scale-105' 
                      : 'border-slate-300 bg-white group-hover:border-slate-450'
                  }`}>
                    <svg className={`w-2.5 h-2.5 stroke-[3] transition-all duration-200 ${rememberMe ? 'scale-100 opacity-100 rotate-0' : 'scale-50 opacity-0 -rotate-12'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition-colors">
                    Tetap masuk selama 30 hari
                  </span>
                </button>

                {/* Submit */}
                <button
                  id="login-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 flex items-center justify-center gap-2.5 text-white font-extrabold rounded-2xl transition-all duration-350 text-xs uppercase tracking-widest cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transform active:scale-[0.97] hover:translate-y-[-1.5px] hover:shadow-[0_8px_20px_-6px_rgba(234,88,12,0.4)] active:translate-y-[0px] group relative overflow-hidden bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  style={{
                    boxShadow: loading 
                      ? 'none'
                      : '0 6px 16px -4px rgba(234,88,12,0.25)'
                  }}
                >
                  {loading ? (
                    <div className="flex items-center gap-2 animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span className="font-extrabold tracking-widest">MEMPROSES...</span>
                    </div>
                  ) : (
                    <>
                      <span className="font-black">Masuk Ke Portal</span>
                      <LogIn className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
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
                    <p className="text-[11px] text-rose-650/90 font-medium mt-0.5 leading-relaxed">
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
      <footer className="w-full border-t border-slate-200/45 bg-white/60 backdrop-blur-md px-6 sm:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 z-10">
        <p className="text-[11px] text-slate-400 font-semibold text-center sm:text-left">
          © 2025 Portal Absensi Karyawan. All rights reserved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-slate-400 font-semibold">
          <Link to="/privacy-policy" className="hover:text-slate-600 transition-colors active:scale-95 duration-150">Privacy Policy</Link>
          <span className="hidden sm:inline text-slate-300">•</span>
          <Link to="/terms-of-service" className="hover:text-slate-600 transition-colors active:scale-95 duration-150">Terms of Service</Link>
          <span className="hidden sm:inline text-slate-300">•</span>
          <Link to="/security-compliance" className="hover:text-slate-600 transition-colors active:scale-95 duration-150">Security Compliance</Link>
        </div>
      </footer>

      {/* ══════════════════════════════════════
          MODAL: LUPA SANDI
      ══════════════════════════════════════ */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in flex flex-col border border-slate-100">
            <div className="h-1.5 bg-gradient-to-r from-orange-600 to-red-650" />
            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-655 flex items-center justify-center shadow-inner">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 font-quicksand">Pemulihan Kata Sandi</h3>
                    <p className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase font-quicksand">Portal Karyawan</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleCloseForgotModal()}
                  className="p-1.5 text-slate-450 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {forgotStep === 1 ? (
                /* Step 1: Input Email */
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Masukkan alamat email terdaftar Anda. Kami akan mengirimkan kode verifikasi OTP 6-digit untuk mengatur ulang kata sandi Anda.
                  </p>
                  
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Alamat Email
                    </label>
                    <div className="relative flex items-center border border-slate-205 rounded-2xl bg-slate-50/20 hover:border-slate-350 focus-within:border-orange-550 transition-all duration-300">
                      <div className="absolute left-4 text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        placeholder="nama@perusahaan.com"
                        className="w-full bg-transparent text-slate-800 placeholder-slate-400/70 rounded-2xl py-3.5 pl-12 pr-4 outline-none text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-3.5 px-4 flex items-center justify-center gap-2 text-white font-extrabold rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 transition-all text-xs uppercase tracking-widest cursor-pointer disabled:opacity-60"
                  >
                    {forgotLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      'Kirim Kode OTP'
                    )}
                  </button>
                </form>
              ) : (
                /* Step 2: Verification and Reset */
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="bg-orange-50/50 border border-orange-100 p-3 rounded-2xl flex items-start gap-2.5">
                    <CheckSquare className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                    <p className="text-[10.5px] text-orange-850 font-semibold leading-relaxed">
                      Kode OTP telah dikirim ke email <strong className="text-orange-950">{forgotEmail}</strong>. Silakan periksa kotak masuk (atau Mailtrap) Anda.
                    </p>
                  </div>

                  {/* OTP Code */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Kode OTP 6-Digit
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={forgotOtp}
                      onChange={e => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="E.g. 123456"
                      className="w-full text-center bg-slate-50 border border-slate-205 focus:border-orange-500 rounded-2xl py-3 text-lg font-black tracking-[0.4em] outline-none transition-all"
                    />
                  </div>

                  {/* Password Baru */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      required
                      value={forgotNewPassword}
                      onChange={e => setForgotNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full bg-slate-50 border border-slate-205 focus:border-orange-500 rounded-2xl py-3 px-4 outline-none text-xs font-semibold"
                    />
                  </div>

                  {/* Konfirmasi Password */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      required
                      value={forgotConfirmPassword}
                      onChange={e => setForgotConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi baru"
                      className="w-full bg-slate-50 border border-slate-205 focus:border-orange-500 rounded-2xl py-3 px-4 outline-none text-xs font-semibold"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="flex-1 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-750 font-bold rounded-2xl text-xs transition-all cursor-pointer text-center"
                    >
                      Kembali
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-[2] py-3.5 px-4 flex items-center justify-center gap-2 text-white font-extrabold rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 transition-all text-xs uppercase tracking-widest cursor-pointer disabled:opacity-60"
                    >
                      {forgotLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        'Reset Password'
                      )}
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
