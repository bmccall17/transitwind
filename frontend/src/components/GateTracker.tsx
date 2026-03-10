import { useState, useEffect } from 'react'
import { api } from '../api/client'

function formatCountdown(targetTimestamp: number): string {
  const diff = targetTimestamp * 1000 - Date.now()
  if (diff <= 0) return '0:00:00'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

interface SunData {
  current_gate: number
  current_line: number
  longitude: number
  gate_progress: number
  next_line_timestamp: number
  next_gate_timestamp: number
  next_gate: number
  prev_gate: number
  ai_context: string
}

export default function GateTracker() {
  const [data, setData] = useState<SunData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [, setTick] = useState(0)

  const fetchData = () => {
    api.getSunTracker()
      .then(d => { setData(d); setError('') })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
    // Re-fetch every 15 min for correction
    const refetch = setInterval(fetchData, 15 * 60 * 1000)
    return () => clearInterval(refetch)
  }, [])

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1)
      // Re-fetch when a countdown hits zero
      if (data) {
        const now = Date.now() / 1000
        if (now >= data.next_line_timestamp || now >= data.next_gate_timestamp) {
          fetchData()
        }
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [data])

  if (loading) return <div className="text-slate-500 text-center py-8">Loading Sun tracker...</div>
  if (error) return <div className="text-red-400 text-center py-8">{error}</div>
  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Main display */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 text-center">
        <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Sun is in</p>
        <div className="flex items-center justify-center gap-4">
          <span className="text-slate-600 text-lg font-mono">← {data.prev_gate}</span>
          <div>
            <span className="text-5xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              {data.current_gate}.{data.current_line}
            </span>
          </div>
          <span className="text-slate-600 text-lg font-mono">{data.next_gate} →</span>
        </div>

        {/* Progress bar */}
        <div className="mt-4 max-w-xs mx-auto">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
              style={{ width: `${data.gate_progress * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>Gate {data.current_gate} start</span>
            <span>{Math.round(data.gate_progress * 100)}%</span>
            <span>Gate {data.next_gate}</span>
          </div>
        </div>
      </div>

      {/* Countdowns */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-center">
          <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Next Line Change</p>
          <p className="text-2xl font-mono text-slate-200">{formatCountdown(data.next_line_timestamp)}</p>
        </div>
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-center">
          <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Next Gate Change</p>
          <p className="text-2xl font-mono text-slate-200">{formatCountdown(data.next_gate_timestamp)}</p>
        </div>
      </div>

      {/* AI context */}
      {data.ai_context && (
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <p className="text-xs text-amber-400 font-medium mb-2">What this means for you</p>
          <p className="text-sm text-slate-300 leading-relaxed">{data.ai_context}</p>
        </div>
      )}
    </div>
  )
}
