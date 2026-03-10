import { useState, useEffect } from 'react'
import { api } from '../api/client'

export default function Profile() {
  const [chart, setChart] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getChart()
      .then(setChart)
      .catch(err => setError(err.message))
  }, [])

  if (error) return <div className="text-red-400 text-center py-8">{error}</div>
  if (!chart) return <div className="text-slate-500 text-center py-8">Loading chart...</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-100">Your Chart</h2>

      <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 space-y-4">
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
              <span key={c} className="bg-violet-900/50 text-violet-300 text-xs px-2 py-1 rounded">
                {c}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-slate-400 mb-1">Open Centers</p>
          <div className="flex flex-wrap gap-2">
            {chart.undefined_centers.map((c: string) => (
              <span key={c} className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded">
                {c}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-slate-400 mb-1">Defined Gates ({chart.defined_gates.length})</p>
          <p className="text-sm text-slate-300">
            {chart.defined_gates.join(', ')}
          </p>
        </div>

        <div>
          <p className="text-sm text-slate-400 mb-1">Defined Channels ({chart.defined_channels.length})</p>
          {chart.defined_channels.map((ch: number[], i: number) => (
            <span key={i} className="text-sm text-slate-300 mr-3">
              {ch[0]}-{ch[1]}
            </span>
          ))}
          {chart.defined_channels.length === 0 && (
            <p className="text-sm text-slate-500">No defined channels</p>
          )}
        </div>
      </div>

      {/* Planetary Activations */}
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
        <h3 className="font-semibold text-slate-200 mb-3">Planetary Activations</h3>
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
