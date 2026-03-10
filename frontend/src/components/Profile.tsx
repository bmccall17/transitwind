import { useState, useEffect } from 'react'
import { api, clearToken } from '../api/client'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const [chart, setChart] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  // Profile form
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  // Password form
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [passSaving, setPassSaving] = useState(false)

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDeleteChart, setShowDeleteChart] = useState(false)

  useEffect(() => {
    Promise.all([api.getMe(), api.getChart().catch(() => null)])
      .then(([u, c]) => {
        setUser(u)
        setChart(c)
        setEditName(u.name || '')
        setEditEmail(u.email)
      })
      .catch(err => setError(err.message))
  }, [])

  const flash = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleProfileSave = async () => {
    setProfileSaving(true)
    setError('')
    try {
      const updated = await api.updateMe({ name: editName, email: editEmail })
      setUser(updated)
      flash('Profile updated')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (newPass !== confirmPass) {
      setError('Passwords do not match')
      return
    }
    setPassSaving(true)
    setError('')
    try {
      await api.changePassword(oldPass, newPass)
      setOldPass('')
      setNewPass('')
      setConfirmPass('')
      flash('Password changed')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPassSaving(false)
    }
  }

  const handleDeleteChart = async () => {
    try {
      await api.deleteChart()
      setChart(null)
      setShowDeleteChart(false)
      flash('Chart deleted. You can re-enter your birth data.')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      await api.deleteAccount()
      clearToken()
      window.location.href = '/'
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (!user) return <div className="text-slate-500 text-center py-8">Loading profile...</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-100">Profile & Settings</h2>

      {error && <div className="text-red-400 text-sm bg-red-950/30 border border-red-800/50 rounded-lg px-4 py-2">{error}</div>}
      {success && <div className="text-emerald-400 text-sm bg-emerald-950/30 border border-emerald-800/50 rounded-lg px-4 py-2">{success}</div>}

      {/* Account Info */}
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 space-y-4">
        <h3 className="font-semibold text-slate-200">Account</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Name</label>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Email</label>
            <input
              type="email"
              value={editEmail}
              onChange={e => setEditEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
            />
          </div>
          <button
            onClick={handleProfileSave}
            disabled={profileSaving}
            className="bg-violet-600 hover:bg-violet-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50"
          >
            {profileSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 space-y-4">
        <h3 className="font-semibold text-slate-200">Change Password</h3>
        <div className="space-y-3">
          <input
            type="password"
            placeholder="Current password"
            value={oldPass}
            onChange={e => setOldPass(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
          />
          <input
            type="password"
            placeholder="New password"
            value={newPass}
            onChange={e => setNewPass(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPass}
            onChange={e => setConfirmPass(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
          />
          <button
            onClick={handlePasswordChange}
            disabled={passSaving || !oldPass || !newPass}
            className="bg-violet-600 hover:bg-violet-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50"
          >
            {passSaving ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </div>

      {/* Chart Display */}
      {chart ? (
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-200">Your Chart</h3>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/')}
                className="text-xs text-slate-400 hover:text-white transition"
              >
                Edit Birth Data
              </button>
              {!showDeleteChart ? (
                <button
                  onClick={() => setShowDeleteChart(true)}
                  className="text-xs text-red-400 hover:text-red-300 transition"
                >
                  Delete Chart
                </button>
              ) : (
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-red-400">Are you sure?</span>
                  <button onClick={handleDeleteChart} className="text-xs bg-red-600 text-white px-2 py-1 rounded">Yes, delete</button>
                  <button onClick={() => setShowDeleteChart(false)} className="text-xs text-slate-400">Cancel</button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InfoCard label="Type" value={chart.type} />
            <InfoCard label="Strategy" value={chart.strategy} />
            <InfoCard label="Authority" value={chart.authority} />
            <InfoCard label="Profile" value={chart.profile} />
          </div>

          <div>
            <p className="text-sm text-slate-400 mb-1">Incarnation Cross</p>
            <p className="text-sm text-slate-200">{chart.incarnation_cross}</p>
          </div>

          <div>
            <p className="text-sm text-slate-400 mb-1">Defined Centers</p>
            <div className="flex flex-wrap gap-2">
              {chart.defined_centers.map((c: string) => (
                <span key={c} className="bg-violet-900/50 text-violet-300 text-xs px-2 py-1 rounded">{c}</span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-slate-400 mb-1">Open Centers</p>
            <div className="flex flex-wrap gap-2">
              {chart.undefined_centers.map((c: string) => (
                <span key={c} className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded">{c}</span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-slate-400 mb-1">Defined Gates ({chart.defined_gates.length})</p>
            <p className="text-sm text-slate-300">{chart.defined_gates.join(', ')}</p>
          </div>

          <div>
            <p className="text-sm text-slate-400 mb-1">Defined Channels ({chart.defined_channels.length})</p>
            {chart.defined_channels.map((ch: number[], i: number) => (
              <span key={i} className="text-sm text-slate-300 mr-3">{ch[0]}-{ch[1]}</span>
            ))}
            {chart.defined_channels.length === 0 && (
              <p className="text-sm text-slate-500">No defined channels</p>
            )}
          </div>

          {/* Planetary Activations */}
          <h3 className="font-semibold text-slate-200 pt-2">Planetary Activations</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-violet-400 font-medium mb-2">Personality (Conscious)</p>
              {chart.personality.map((p: any) => (
                <div key={p.planet} className="flex justify-between text-xs text-slate-400 py-0.5">
                  <span>{p.planet}</span>
                  <span className="text-slate-300">Gate {p.gate}.{p.line}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm text-red-400 font-medium mb-2">Design (Unconscious)</p>
              {chart.design.map((p: any) => (
                <div key={p.planet} className="flex justify-between text-xs text-slate-400 py-0.5">
                  <span>{p.planet}</span>
                  <span className="text-slate-300">Gate {p.gate}.{p.line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-center">
          <p className="text-slate-400 text-sm">No chart yet.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-2 text-violet-400 hover:text-violet-300 text-sm transition"
          >
            Enter your birth data
          </button>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-slate-900 rounded-xl p-5 border border-red-900/50 space-y-3">
        <h3 className="font-semibold text-red-400">Danger Zone</h3>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-sm text-red-400 border border-red-800 rounded-lg px-4 py-2 hover:bg-red-950/30 transition"
          >
            Delete Account
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-red-300">This will permanently delete your account, chart, journal entries, and all cached data. This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={handleDeleteAccount} className="bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-medium">
                Yes, delete my account
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-slate-400 text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-800 rounded-lg p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-200">{value}</p>
    </div>
  )
}
