import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { Server, Database, CheckCircle2, XCircle, RefreshCw, Cpu, Layers, ExternalLink, Activity } from 'lucide-react'

interface HealthResponse {
  status: string
  message: string
  database: string
}

function App() {
  const [backendStatus, setBackendStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle')
  const [dbStatus, setDbStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle')
  const [healthData, setHealthData] = useState<HealthResponse | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)

  const checkConnection = async (showSwal = false) => {
    setBackendStatus('checking')
    setDbStatus('checking')
    setErrorDetails(null)

    try {
      // Connect to the Laravel API endpoint
      const response = await axios.get<HealthResponse>('http://localhost:8000/api/health-check')
      
      setHealthData(response.data)
      setBackendStatus('connected')
      
      if (response.data.database === 'Connected') {
        setDbStatus('connected')
      } else {
        setDbStatus('error')
      }

      if (showSwal) {
        Swal.fire({
          title: 'Koneksi Sukses!',
          text: response.data.message || 'Frontend dan Backend Laravel 12 berhasil terhubung.',
          icon: 'success',
          background: '#1e293b',
          color: '#f8fafc',
          confirmButtonColor: '#6366f1',
          customClass: {
            popup: 'border border-slate-700 rounded-2xl shadow-xl'
          }
        })
      }
    } catch (error: any) {
      setBackendStatus('error')
      setDbStatus('error')
      const msg = error.message || 'Gagal menghubungi backend.'
      setErrorDetails(msg)

      if (showSwal) {
        Swal.fire({
          title: 'Koneksi Gagal!',
          html: `<p class="text-sm text-slate-300">Gagal terhubung ke Backend Laravel 12.</p>
                 <code class="block mt-2 p-2 text-xs bg-slate-950 text-rose-400 rounded text-left overflow-auto">${msg}</code>
                 <p class="text-xs text-slate-400 mt-3">Pastikan Anda sudah menjalankan <strong>php artisan serve</strong> di folder backend.</p>`,
          icon: 'error',
          background: '#1e293b',
          color: '#f8fafc',
          confirmButtonColor: '#ef4444',
          customClass: {
            popup: 'border border-slate-700 rounded-2xl shadow-xl'
          }
        })
      }
    }
  }

  useEffect(() => {
    checkConnection(false)
  }, [])

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 md:p-12">
      {/* Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              React TS + Laravel 12 Setup
            </h1>
            <p className="text-xs text-slate-500">Decoupled Architecture</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-slate-400">Environment Ready</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-auto">
        {/* Status Area */}
        <section className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Sistem Informasi <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Absensi Karyawan</span>
            </h2>
            <p className="text-slate-400 text-base max-w-xl">
              Template ini telah dikonfigurasi menggunakan arsitektur non-monolith. Frontend React TS berkomunikasi dengan Backend Laravel 12 secara langsung melalui REST API.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Backend Card */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-lg flex flex-col justify-between hover:border-slate-700/60 transition-all group">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/15 transition-all text-indigo-400">
                  <Server className="w-6 h-6" />
                </div>
                <div className="text-right">
                  {backendStatus === 'connected' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Connected
                    </span>
                  )}
                  {backendStatus === 'checking' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Checking
                    </span>
                  )}
                  {(backendStatus === 'error' || backendStatus === 'idle') && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
                      <XCircle className="w-3 h-3" /> Offline
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-bold text-slate-200">Backend API</h3>
                <p className="text-xs text-slate-400 mt-1">Laravel 12 API Server</p>
                <code className="block mt-2 text-xs font-mono text-indigo-300">http://localhost:8000</code>
              </div>
            </div>

            {/* Database Card */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-lg flex flex-col justify-between hover:border-slate-700/60 transition-all group">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-violet-500/10 rounded-xl group-hover:bg-violet-500/15 transition-all text-violet-400">
                  <Database className="w-6 h-6" />
                </div>
                <div className="text-right">
                  {dbStatus === 'connected' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Connected
                    </span>
                  )}
                  {dbStatus === 'checking' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Checking
                    </span>
                  )}
                  {(dbStatus === 'error' || dbStatus === 'idle') && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <XCircle className="w-3 h-3" /> Disconnected
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-bold text-slate-200">MySQL Database</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Database: <strong className="text-slate-300 font-semibold">{healthData?.database || 'absen_karyawan'}</strong>
                </p>
                <code className="block mt-2 text-xs font-mono text-violet-300">127.0.0.1:3306</code>
              </div>
            </div>
          </div>

          {/* Action and Error Panel */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => checkConnection(true)}
                disabled={backendStatus === 'checking'}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
              >
                <Activity className="w-4 h-4" /> Tes Koneksi API
              </button>
              
              <button
                onClick={() => {
                  Swal.fire({
                    title: 'Tentang Project',
                    html: `
                      <div class="text-left space-y-2 text-sm text-slate-300">
                        <p><strong>Frontend:</strong> React 19, TypeScript, Vite, Tailwind CSS v4, SweetAlert2, Axios, Lucide React.</p>
                        <p><strong>Backend:</strong> Laravel 12 API, MySQL.</p>
                        <p><strong>Arsitektur:</strong> Non-monolith (decoupled), terpisah folder <code>frontend/</code> dan <code>backend/</code>.</p>
                      </div>
                    `,
                    background: '#1e293b',
                    color: '#f8fafc',
                    confirmButtonColor: '#6366f1',
                  })
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl transition-all cursor-pointer"
              >
                <Cpu className="w-4 h-4" /> Info Dependensi
              </button>
            </div>

            {errorDetails && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-sm font-mono overflow-auto">
                <strong>Error:</strong> {errorDetails}
              </div>
            )}
          </div>
        </section>

        {/* Documentation / Instructions Panel */}
        <section className="lg:col-span-5 bg-slate-900/25 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-6">
          <h3 className="text-xl font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800/60 pb-3">
            <Cpu className="w-5 h-5 text-indigo-400" /> Panduan Menjalankan Project
          </h3>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold tracking-wider uppercase text-indigo-400 block mb-2">
                1. Backend (Laravel 12)
              </span>
              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-850 font-mono text-xs text-slate-300 space-y-2">
                <div>
                  <span className="text-slate-500"># Buka folder backend</span>
                  <div className="text-indigo-300 font-semibold">cd backend</div>
                </div>
                <div>
                  <span className="text-slate-500"># Jalankan Server</span>
                  <div className="text-indigo-300 font-semibold">php artisan serve</div>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  Server akan berjalan di http://127.0.0.1:8000
                </div>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold tracking-wider uppercase text-violet-400 block mb-2">
                2. Frontend (React TS)
              </span>
              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-850 font-mono text-xs text-slate-300 space-y-2">
                <div>
                  <span className="text-slate-500"># Buka folder frontend</span>
                  <div className="text-violet-300 font-semibold">cd frontend</div>
                </div>
                <div>
                  <span className="text-slate-500"># Jalankan Dev Server</span>
                  <div className="text-violet-300 font-semibold">npm run dev</div>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  Aplikasi akan berjalan di http://localhost:5173
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-xl">
              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                <ExternalLink className="w-3.5 h-3.5" /> Konfigurasi MySQL
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Sebelum memulai backend, pastikan MySQL di XAMPP aktif dan buat database bernama <code className="text-amber-300 bg-amber-900/20 px-1 rounded">absen_karyawan</code>. Cek file <code className="text-slate-300">backend/.env</code> untuk menyesuaikan user/password database Anda.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center mt-12 border-t border-slate-900/60 pt-6">
        <p className="text-xs text-slate-600">
          Developer Boilerplate &copy; 2026. Absensi Karyawan App.
        </p>
      </footer>
    </div>
  )
}

export default App
