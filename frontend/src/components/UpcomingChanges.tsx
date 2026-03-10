import { useState, useEffect } from 'react'
import { api } from '../api/client'

const PLANET_ICONS: Record<string, string> = {
  Sun: '\u2609', Earth: '\u2295', Moon: '\u263D',
  'North Node': '\u260A', 'South Node': '\u260B',
  Mercury: '\u263F', Venus: '\u2640', Mars: '\u2642',
  Jupiter: '\u2643', Saturn: '\u2644', Uranus: '\u2645',
  Neptune: '\u2646', Pluto: '\u2647',
}

function formatTimeUntil(timestamp: number): string {
  const diff = timestamp * 1000 - Date.now()
  if (diff <= 0) return 'now'
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  if (hours >= 48) {
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
  }
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

interface Change {
  planet: string
  current_gate: number
  current_line: number
  next_gate: number
  next_line: number
  change_timestamp: number
  is_retrograde: boolean
  significance: string
  reason: string
}

export default function UpcomingChanges() {
  const [data, setData] = useState<{ changes: Change[]; ai_summary: string } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getUpcomingChanges()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  // Re-render every minute to update countdowns
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <div className="text-slate-500 text-center py-8">Loading upcoming changes...</div>
  if (error) return <div className="text-red-400 text-center py-8">{error}</div>
  if (!data) return null

  return (
    <div className="space-y-4">
      {data.ai_summary && (
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <p className="text-sm text-slate-300 leading-relaxed">{data.ai_summary}</p>
        </div>
      )}

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
              <th className="px-4 py-3 text-left">Planet</th>
              <th className="px-4 py-3 text-center">Current</th>
              <th className="px-4 py-3 text-center">Next</th>
              <th className="px-4 py-3 text-right">Time Until</th>
            </tr>
          </thead>
          <tbody>
            {data.changes.map((c) => (
              <tr
                key={c.planet}
                className={`border-b border-slate-800/50 ${
                  c.significance === 'high'
                    ? 'border-l-2 border-l-violet-500 bg-violet-950/20'
                    : c.significance === 'medium'
                    ? 'border-l-2 border-l-amber-500/50'
                    : ''
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{PLANET_ICONS[c.planet] || '?'}</span>
                    <span className="text-slate-200">{c.planet}</span>
                    {c.is_retrograde && (
                      <span className="text-red-400 text-xs font-medium" title="Retrograde">℞</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-mono text-slate-300">
                  {c.current_gate}.{c.current_line}
                </td>
                <td className="px-4 py-3 text-center font-mono text-slate-300">
                  {c.next_gate}.{c.next_line}
                </td>
                <td className="px-4 py-3 text-right text-slate-400">
                  {formatTimeUntil(c.change_timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Show reasons for significant changes */}
      {data.changes.filter(c => c.significance !== 'low' && c.reason).length > 0 && (
        <div className="space-y-2">
          {data.changes
            .filter(c => c.significance !== 'low' && c.reason)
            .map(c => (
              <div
                key={c.planet + '-reason'}
                className={`text-xs px-4 py-2 rounded-lg ${
                  c.significance === 'high'
                    ? 'bg-violet-950/30 text-violet-300 border border-violet-800/50'
                    : 'bg-amber-950/20 text-amber-300 border border-amber-800/30'
                }`}
              >
                <span className="font-medium">{c.planet}:</span> {c.reason}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
