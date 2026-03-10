import { useState, useEffect } from 'react'
import { api } from '../api/client'

export default function Journal() {
  const [entries, setEntries] = useState<any[]>([])
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    api.getJournalEntries()
      .then(setEntries)
      .catch(err => setError(err.message))
  }, [])

  const saveEntry = async () => {
    if (!content.trim()) return
    setSaving(true)
    setError('')
    try {
      const entry = await api.createJournalEntry(content, today)
      setEntries(prev => {
        const filtered = prev.filter(e => e.date !== today)
        return [entry, ...filtered]
      })
      setContent('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-100">Transit Journal</h2>

      {/* New Entry */}
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 space-y-3">
        <p className="text-sm text-slate-400">What are you noticing today? ({today})</p>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Reflect on today's energies..."
          rows={4}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          onClick={saveEntry}
          disabled={saving || !content.trim()}
          className="bg-violet-600 hover:bg-violet-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Entry'}
        </button>
      </div>

      {/* Past Entries */}
      <div className="space-y-3">
        {entries.map(entry => (
          <div key={entry.id} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-400">{entry.date}</span>
              <button
                onClick={async () => {
                  await api.deleteJournalEntry(entry.date)
                  setEntries(prev => prev.filter(e => e.id !== entry.id))
                }}
                className="text-xs text-slate-600 hover:text-red-400 transition"
              >
                Delete
              </button>
            </div>
            <p className="text-sm text-slate-300 whitespace-pre-line">{entry.content}</p>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-sm text-slate-600 text-center py-4">No journal entries yet. Start reflecting!</p>
        )}
      </div>
    </div>
  )
}
