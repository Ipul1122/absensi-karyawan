import { useState, useEffect } from 'react'
import axios from 'axios'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
                <Login
                  onLoginSuccess={handleLoginSuccess}
                  isOnline={backendStatus === 'connected'}
                />
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

