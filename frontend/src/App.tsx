import { useState, useEffect, lazy, Suspense } from 'react'
import axios from 'axios'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Lazy load dashboards to enable Code Splitting (optimizes production bundle size)
const Login = lazy(() => import('./components/Login'))
const AdminDashboard = lazy(() => import('./components/AdminDashboard'))
const EmployeeDashboard = lazy(() => import('./components/EmployeeDashboard'))
const DirectorDashboard = lazy(() => import('./components/direktur/DirectorDashboard'))

interface HealthResponse {
  status: string
  message: string
  database: string
}

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'employee' | 'director'
}

function App() {
  const [backendStatus, setBackendStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle')
  
  // Auth state
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('auth_token'))
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('auth_user')
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

    try {
      await axios.get<HealthResponse>('http://localhost:8000/api/health-check')
      setBackendStatus('connected')
    } catch (error) {
      setBackendStatus('error')
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  const handleLoginSuccess = (newToken: string, newUser: User) => {
    sessionStorage.setItem('auth_token', newToken)
    sessionStorage.setItem('auth_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_user')
    setToken(null)
    setUser(null)
  }

  return (
    <BrowserRouter>
      <Suspense fallback={
        <div className="min-h-screen bg-[#fcf9f5] flex flex-col items-center justify-center text-slate-500 font-sans text-xs">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          Memuat modul aplikasi...
        </div>
      }>
        <Routes>
          {token && user ? (
            user.role === 'admin' ? (
              <>
                <Route 
                  path="/admin/*" 
                  element={
                    <div className="min-h-screen bg-[#fcf9f5] text-slate-800 flex flex-col">
                      <AdminDashboard user={user as any} token={token} onLogout={handleLogout} />
                    </div>
                  } 
                  />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </>
            ) : user.role === 'director' ? (
              <>
                <Route 
                  path="/director/*" 
                  element={
                    <DirectorDashboard user={user as any} token={token} onLogout={handleLogout} />
                  } 
                  />
                <Route path="*" element={<Navigate to="/director/dashboard" replace />} />
              </>
            ) : (
              <>
                <Route 
                  path="/employee/*" 
                  element={
                    <EmployeeDashboard user={user as any} token={token} onLogout={handleLogout} />
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
      </Suspense>
    </BrowserRouter>
  )
}

export default App

