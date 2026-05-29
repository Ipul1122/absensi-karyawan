import { useState, useEffect } from 'react'
import axios from 'axios'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Server, Database, CheckCircle2, XCircle, RefreshCw, Layers } from 'lucide-react'
import Login from './components/Login'
import AdminDashboard from './components/AdminDashboard'
import EmployeeDashboard from './components/EmployeeDashboard'
import Logo from './components/layout/Logo'

interface HealthResponse {
  status: string
  message: string
  database: string
}

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'employee'
}

function App() {
  const [backendStatus, setBackendStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle')
  const [dbStatus, setDbStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle')
  const [healthData, setHealthData] = useState<HealthResponse | null>(null)
  
  // Auth state
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'))
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('auth_user')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return null
      }
    }
    return null
  })

  const checkConnection = async () => {
    setBackendStatus('checking')
    setDbStatus('checking')

    try {
      const response = await axios.get<HealthResponse>('http://localhost:8000/api/health-check')
      setHealthData(response.data)
      setBackendStatus('connected')
      
      if (response.data.database === 'Connected') {
        setDbStatus('connected')
      } else {
        setDbStatus('error')
      }
    } catch (error) {
      setBackendStatus('error')
      setDbStatus('error')
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  const handleLoginSuccess = (newToken: string, newUser: User) => {
    localStorage.setItem('auth_token', newToken)
    localStorage.setItem('auth_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setToken(null)
    setUser(null)
  }

  // Helper to show indicator color classes
  const getStatusBadge = () => {
    if (backendStatus === 'connected' && dbStatus === 'connected') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider font-quicksand">Sistem Online</span>
        </div>
      )
    }
    if (backendStatus === 'checking') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider font-quicksand">Menghubungkan...</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-55 border border-rose-200">
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
        <span className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider font-quicksand">Backend Offline</span>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {token && user ? (
          user.role === 'admin' ? (
            <>
              <Route 
                path="/admin/*" 
                element={
                  <div className="min-h-screen bg-[#fcf9f5] text-slate-800 flex flex-col">
                    <AdminDashboard user={user} token={token} onLogout={handleLogout} />
                  </div>
                } 
                />
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </>
          ) : (
            <>
              <Route 
                path="/employee/*" 
                element={
                  <EmployeeDashboard user={user} token={token} onLogout={handleLogout} />
                } 
              />
              <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
            </>
          )
        ) : (
          <>
            <Route 
              path="/" 
              element={
                <div className="min-h-screen flex flex-col justify-between p-6 md:p-12 bg-transparent">
                  {/* Top Header */}
                  <header className="max-w-6xl mx-auto w-full flex items-center justify-between mb-8 pb-5 border-b border-orange-100/80">
                    <Logo />
                    <div>
                      {getStatusBadge()}
                    </div>
                  </header>

                  {/* Main Container */}
                  <main className="max-w-6xl mx-auto w-full flex-grow flex items-center justify-center my-6">
                    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                      {/* Left Column: Greeting and Backend Info */}
                      <div className="lg:col-span-7 space-y-8">
                        <div className="space-y-4">
                          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl leading-tight">
                            Sistem Informasi <span className="bg-gradient-to-r from-red-500 to-orange-600 bg-clip-text text-transparent">Absensi Karyawan</span>
                          </h2>
                          <p className="text-slate-655 text-sm md:text-base max-w-xl leading-relaxed font-quicksand font-semibold">
                            Selamat datang di platform pencatatan presensi digital karyawan terintegrasi. Masuk menggunakan akun Anda untuk mengelola karyawan (Admin) atau mencatat kehadiran harian (Karyawan).
                          </p>
                        </div>

                        {/* Status Indicator Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-xl">
                          {/* Backend Card */}
                          <div className="bg-white/90 border border-orange-100/80 rounded-3xl p-5 shadow-lg shadow-orange-500/2 hover:shadow-orange-500/5 hover:border-orange-200/90 transition-all duration-300 group">
                            <div className="flex items-start justify-between">
                              <div className="p-2.5 bg-red-50 rounded-xl text-red-500 border border-red-100">
                                <Server className="w-5 h-5" />
                              </div>
                              <div>
                                {backendStatus === 'connected' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 font-quicksand">
                                    <CheckCircle2 className="w-3 h-3" /> Online
                                  </span>
                                ) : backendStatus === 'checking' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 font-quicksand">
                                    <RefreshCw className="w-3 h-3 animate-spin" /> Check...
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 font-quicksand">
                                    <XCircle className="w-3 h-3" /> Offline
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="mt-4">
                              <h3 className="text-sm font-bold text-slate-800 font-quicksand">Backend API</h3>
                              <code className="block mt-1 text-[11px] font-mono text-red-600 bg-red-50/50 py-0.5 px-1.5 rounded w-max">http://localhost:8000</code>
                            </div>
                          </div>

                          {/* Database Card */}
                          <div className="bg-white/90 border border-orange-100/80 rounded-3xl p-5 shadow-lg shadow-orange-500/2 hover:shadow-orange-500/5 hover:border-orange-200/90 transition-all duration-300 group">
                            <div className="flex items-start justify-between">
                              <div className="p-2.5 bg-orange-50 rounded-xl text-orange-655 border border-orange-100">
                                <Database className="w-5 h-5" />
                              </div>
                              <div>
                                {dbStatus === 'connected' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 font-quicksand">
                                    <CheckCircle2 className="w-3 h-3" /> Connected
                                  </span>
                                ) : dbStatus === 'checking' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 font-quicksand">
                                    <RefreshCw className="w-3 h-3 animate-spin" /> Check...
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 font-quicksand">
                                    <XCircle className="w-3 h-3" /> Offline
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="mt-4">
                              <h3 className="text-sm font-bold text-slate-800 font-quicksand">Database</h3>
                              <code className="block mt-1 text-[11px] font-mono text-orange-600 bg-orange-50/50 py-0.5 px-1.5 rounded w-max">MySQL: {healthData?.database || 'absen_karyawan'}</code>
                            </div>
                          </div>
                        </div>

                        {backendStatus !== 'connected' && (
                          <div className="p-4.5 bg-rose-50 border border-rose-150 rounded-2xl max-w-xl text-xs text-rose-700 flex items-start gap-3 shadow-sm leading-relaxed">
                            <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
                            <div>
                              <strong className="block mb-1 font-bold">API Server Offline:</strong> Pastikan Anda telah menjalankan perintah <code className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-mono text-[10px] border border-rose-200">php artisan serve</code> di folder backend Laravel dan mengaktifkan database MySQL di XAMPP Anda.
                              <button 
                                onClick={checkConnection}
                                className="mt-3 block px-3.5 py-2 bg-white border border-rose-250 text-rose-700 rounded-xl font-bold hover:bg-rose-100 hover:border-rose-300 transition-all cursor-pointer shadow-sm text-[11px]"
                              >
                                Segarkan Koneksi
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Column: Login Card */}
                      <div className="lg:col-span-5 w-full flex justify-center">
                        <Login onLoginSuccess={handleLoginSuccess} />
                      </div>
                    </div>
                  </main>

                  {/* Footer */}
                  <footer className="max-w-6xl mx-auto w-full text-center mt-8 border-t border-orange-100/80 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-[11px] text-slate-500 font-bold font-quicksand">
                      Portal Absensi Karyawan &copy; 2026. All rights reserved.
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-bold font-quicksand">
                      <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-red-500" /> Laravel 12 API</span>
                      <span>&bull;</span>
                      <span>React 19 SPA</span>
                    </div>
                  </footer>
                </div>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}

export default App

