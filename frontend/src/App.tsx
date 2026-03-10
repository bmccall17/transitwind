import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { isAuthenticated, clearToken, api, setToken } from './api/client'
import Onboarding from './components/Onboarding'
import DailyView from './components/DailyView'
import Journal from './components/Journal'
import Profile from './components/Profile'
import Login from './components/Login'

function App() {
  const [authed, setAuthed] = useState(isAuthenticated())
  const [hasChart, setHasChart] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (authed) {
      api.getMe()
        .then(user => {
          setHasChart(user.has_chart)
          setLoading(false)
        })
        .catch(() => {
          clearToken()
          setAuthed(false)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [authed])

  const handleLogin = async (email: string, password: string) => {
    const res = await api.login(email, password)
    setToken(res.access_token)
    setAuthed(true)
  }

  const handleRegister = async (email: string, password: string, name?: string) => {
    const res = await api.register(email, password, name)
    setToken(res.access_token)
    setAuthed(true)
  }

  const handleLogout = () => {
    clearToken()
    setAuthed(false)
    setHasChart(null)
    navigate('/')
  }

  const handleChartCreated = () => {
    setHasChart(true)
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-lg">Loading...</div>
      </div>
    )
  }

  if (!authed) {
    return <Login onLogin={handleLogin} onRegister={handleRegister} />
  }

  if (hasChart === false) {
    return <Onboarding onComplete={handleChartCreated} />
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <h1
          className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent cursor-pointer"
          onClick={() => navigate('/')}
        >
          TransitWind
        </h1>
        <div className="flex gap-4 items-center text-sm">
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white transition">Today</button>
          <button onClick={() => navigate('/journal')} className="text-slate-400 hover:text-white transition">Journal</button>
          <button onClick={() => navigate('/profile')} className="text-slate-400 hover:text-white transition">Profile</button>
          <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition">Logout</button>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<DailyView />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <footer className="text-center text-xs text-slate-600 py-4 border-t border-slate-800">
        TransitWind is an awareness tool, not a prediction service. Your experience is your own authority.
      </footer>
    </div>
  )
}

export default App
