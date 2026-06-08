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

