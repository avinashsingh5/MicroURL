import { useState, useEffect } from 'react'
import axios from 'axios'
import { useTheme } from './contexts/ThemeContext'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import Shortener from './components/Shortener'
import ThemeToggle from './components/ThemeToggle'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Configure axios to include token in requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function App() {
  const { darkMode } = useTheme()
  const [user, setUser] = useState(null)
  const [showRegister, setShowRegister] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState('shortener') // 'shortener' or 'dashboard'

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const response = await axios.get(`${API_URL}/api/auth/me`)
        setUser(response.data.user)
      } catch (error) {
        localStorage.removeItem('token')
        setUser(null)
      }
    }
    setLoading(false)
  }

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token)
    setUser(userData)
    setShowRegister(false)
    setCurrentView('shortener') // Redirect to shortener after login
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setCurrentView('shortener')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-orange-50 dark:from-dark-bg dark:via-dark-surface dark:to-dark-bg flex items-center justify-center transition-colors duration-200">
        <div className="text-gray-600 dark:text-dark-text">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-orange-50 dark:from-dark-bg dark:via-dark-surface dark:to-dark-bg transition-colors duration-200">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-dark-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">Sink</h1>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {user ? (
                <>
                  <button
                    onClick={() => {
                      setCurrentView('shortener')
                      setShowRegister(false)
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      currentView === 'shortener'
                        ? 'bg-gradient-primary text-white shadow-lg shadow-primary-500/50'
                        : 'text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-card'
                    }`}
                  >
                    Shorten
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView('dashboard')
                      setShowRegister(false)
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      currentView === 'dashboard'
                        ? 'bg-gradient-primary text-white shadow-lg shadow-primary-500/50'
                        : 'text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-card'
                    }`}
                  >
                    My Links
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-card rounded-lg transition-all duration-200 font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowRegister(false)
                      setCurrentView('login')
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-card rounded-lg transition-all duration-200 font-medium"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setShowRegister(true)
                      setCurrentView('login')
                    }}
                    className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-200 font-medium"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        {currentView === 'dashboard' && user ? (
          <Dashboard user={user} />
        ) : currentView === 'login' && !user ? (
          <div className="max-w-md mx-auto">
            {showRegister ? (
              <Register
                onLogin={handleLogin}
                onSwitchToLogin={() => setShowRegister(false)}
              />
            ) : (
              <Login
                onLogin={handleLogin}
                onSwitchToRegister={() => setShowRegister(true)}
              />
            )}
          </div>
        ) : (
          <Shortener user={user} />
        )}
      </div>
    </div>
  )
}

export default App
