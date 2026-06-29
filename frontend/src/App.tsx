import { useState, useEffect, lazy, Suspense } from 'react'
import axios from 'axios'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Lazy load dashboards to enable Code Splitting (optimizes production bundle size)
const Login = lazy(() => import('./components/Login'))
const AdminDashboard = lazy(() => import('./components/AdminDashboard'))
const EmployeeDashboard = lazy(() => import('./components/EmployeeDashboard'))
const DirectorDashboard = lazy(() => import('./components/direktur/DirectorDashboard'))
const VerifySlip = lazy(() => import('./components/payroll/VerifySlip'))
const PrivacyPolicy = lazy(() => import('./components/public/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./components/public/TermsOfService'))
const SecurityCompliance = lazy(() => import('./components/public/SecurityCompliance'))


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
  photo?: string | null
  company?: string | null
}

// Capture requested path for redirect after login synchronously before React Router redirects to "/"
const initialPath = window.location.pathname
if (initialPath && initialPath !== '/' && !initialPath.startsWith('/verify-slip')) {
  if (!sessionStorage.getItem('auth_token') && !localStorage.getItem('auth_token')) {
    sessionStorage.setItem('redirect_to', initialPath)
  }
}

function App() {
  const [backendStatus, setBackendStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle')
  
  // Auth state
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token')
  })
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('auth_user') || localStorage.getItem('auth_user')
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


  useEffect(() => {
    if (token) {
      axios.get('http://localhost:8000/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (res.data.status === 'success') {
          const d = res.data.data
          setUser(prevUser => {
            if (!prevUser) return null
            const updatedUser = {
              ...prevUser,
              name: d.name,
              email: d.email,
              photo: d.photo,
              company: d.company
            }
            const isLocal = !!localStorage.getItem('auth_user')
            const storage = isLocal ? localStorage : sessionStorage
            storage.setItem('auth_user', JSON.stringify(updatedUser))
            return updatedUser
          })
        }
      })
      .catch(err => {
        console.error('Gagal menyinkronkan profil pengguna:', err)
      })
    }
  }, [token])

  // Dynamic tab title and favicon based on logged in user's company or default
  useEffect(() => {
    const titleEl = document.querySelector('title')
    const faviconEl = document.getElementById('favicon') as HTMLLinkElement | null

    let titleText = 'goodpeople-hcms'
    let faviconHref = '/logo/LOGO-CPI.png'

    if (user) {
      if (user.role === 'admin') {
        titleText = 'goodpeople-hcms - Portal Admin'
        faviconHref = '/logo/LOGO-CPI.png'
      } else if (user.company) {
        if (user.company === 'PT Yasodana Parvez Internasional') {
          titleText = 'goodpeople-hcms - PT Yasodana Parvez Internasional'
          faviconHref = '/logo/LOGO-YPI.png'
        } else if (user.company === 'PT Cakrawala Parama Internasional') {
          titleText = 'goodpeople-hcms - PT Cakrawala Parama Internasional'
          faviconHref = '/logo/LOGO-CPI.png'
        }
      }
    }

    if (titleEl) titleEl.innerText = titleText
    if (faviconEl) {
      faviconEl.type = faviconHref.endsWith('.png') ? 'image/png' : 'image/svg+xml'
      faviconEl.href = faviconHref
    }
  }, [user])

  const handleLoginSuccess = (newToken: string, newUser: User, remember: boolean) => {
    const storage = remember ? localStorage : sessionStorage
    
    if (remember) {
      sessionStorage.removeItem('auth_token')
      sessionStorage.removeItem('auth_user')
    } else {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
    
    storage.setItem('auth_token', newToken)
    storage.setItem('auth_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)

    const redirectTo = sessionStorage.getItem('redirect_to')
    if (redirectTo) {
      sessionStorage.removeItem('redirect_to')
      window.location.pathname = redirectTo
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_user')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setToken(null)
    setUser(null)
  }

  const handleProfileUpdate = (updatedFields: { name: string; email: string; photo?: string | null }) => {
    setUser(prevUser => {
      if (!prevUser) return null
      const updatedUser = { ...prevUser, ...updatedFields }
      const isLocal = !!localStorage.getItem('auth_user')
      const storage = isLocal ? localStorage : sessionStorage
      storage.setItem('auth_user', JSON.stringify(updatedUser))
      return updatedUser
    })
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
          <Route path="/verify-slip/:id/:hash" element={<VerifySlip />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/security-compliance" element={<SecurityCompliance />} />

          {token && user ? (
            user.role === 'admin' ? (
              <>
                <Route 
                  path="/admin/*" 
                  element={
                    <div className="min-h-screen bg-[#fcf9f5] text-slate-800 flex flex-col">
                      <AdminDashboard user={user as any} token={token} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate} />
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
                    <DirectorDashboard user={user as any} token={token} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate} />
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

