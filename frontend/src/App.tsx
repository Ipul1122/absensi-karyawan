import { useState, useEffect } from 'react'
import axios from 'axios'
import { Server, Database, CheckCircle2, XCircle, RefreshCw, Layers, LayoutDashboard } from 'lucide-react'
import Login from './components/Login'
import AdminDashboard from './components/AdminDashboard'
import EmployeeDashboard from './components/EmployeeDashboard'

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
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider font-quicksand">Sistem Online</span>
        </div>
      )
    }
    if (backendStatus === 'checking') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider font-quicksand">Menghubungkan...</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20">
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
        <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-wider font-quicksand">Backend Offline</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 md:p-12">
      {/* Top Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between mb-8 pb-4 border-b border-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Portal Absensi Karyawan
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-quicksand">Sistem Presensi Digital</p>
          </div>
        </div>
        <div>
          {getStatusBadge()}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full flex-grow flex items-center justify-center my-6">
        {token && user ? (
          // Authenticated View
          user.role === 'admin' ? (
            <AdminDashboard user={user} token={token} onLogout={handleLogout} />
          ) : (
            <EmployeeDashboard user={user} token={token} onLogout={handleLogout} />
          )
        ) : (
          // Unauthenticated view (Login Form & Connection check panel)
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Greeting and Backend Info */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-3">
                <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                  Sistem Informasi <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Absensi Karyawan</span>
                </h2>
                <p className="text-slate-400 text-sm md:text-base max-w-xl leading-relaxed font-quicksand font-medium">
                  Selamat datang di platform pencatatan presensi digital karyawan terintegrasi. Masuk menggunakan akun Anda untuk mengelola karyawan (Admin) atau mencatat kehadiran harian (Karyawan).
                </p>
              </div>

              {/* Status Indicator Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                {/* Backend Card */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-lg flex flex-col justify-between hover:border-slate-700/60 transition-all group">
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      {backendStatus === 'connected' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-quicksand">
                          <CheckCircle2 className="w-3 h-3" /> Online
                        </span>
                      ) : backendStatus === 'checking' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-quicksand">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Check...
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 font-quicksand">
                          <XCircle className="w-3 h-3" /> Offline
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-sm font-bold text-slate-200 font-quicksand">Backend API</h3>
                    <code className="block mt-1 text-[10px] font-mono text-indigo-300">http://localhost:8000</code>
                  </div>
                </div>

                {/* Database Card */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-lg flex flex-col justify-between hover:border-slate-700/60 transition-all group">
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 bg-violet-500/10 rounded-xl text-violet-400 border border-violet-500/20">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      {dbStatus === 'connected' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-quicksand">
                          <CheckCircle2 className="w-3 h-3" /> Connected
                        </span>
                      ) : dbStatus === 'checking' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-quicksand">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Check...
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 font-quicksand">
                          <XCircle className="w-3 h-3" /> Offline
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-sm font-bold text-slate-200 font-quicksand">Database</h3>
                    <code className="block mt-1 text-[10px] font-mono text-violet-300">MySQL: {healthData?.database || 'absen_karyawan'}</code>
                  </div>
                </div>
              </div>

              {backendStatus !== 'connected' && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl max-w-xl text-xs text-rose-300 flex items-start gap-2.5">
                  <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <strong>API Server Offline:</strong> Pastikan Anda telah menjalankan perintah <code className="bg-slate-950 px-1 py-0.5 rounded text-white font-mono text-[10px]">php artisan serve</code> di folder backend Laravel dan mengaktifkan database MySQL di XAMPP Anda.
                    <button 
                      onClick={checkConnection}
                      className="mt-2 block px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg font-semibold hover:text-white transition-all cursor-pointer"
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
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center mt-8 border-t border-slate-900/60 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-[10px] text-slate-650 font-bold font-quicksand">
          Portal Absensi Karyawan &copy; 2026. All rights reserved.
        </p>
        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold font-quicksand">
          <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> Laravel 12 API</span>
          <span>&bull;</span>
          <span>React 19 SPA</span>
        </div>
      </footer>
    </div>
  )
}

export default App
