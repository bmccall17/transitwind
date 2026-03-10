import { useState, useEffect } from 'react'
import { api } from '../api/client'
import Bodygraph from './Bodygraph'

type ViewMode = 'overlay' | 'natal' | 'transit'

// Planet display order matching HD convention
const PLANET_ORDER = [
  'Sun', 'Earth', 'Moon', 'North Node', 'South Node',
  'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn',
  'Uranus', 'Neptune', 'Pluto',
]

function CombinedNatalColumn({ design, personality }: {
  design: { planet: string; gate: number; line: number }[]
  personality: { planet: string; gate: number; line: number }[]
}) {
  return (
    <div className="text-xs space-y-1.5 min-w-[140px]">
      {/* Header labels */}
      <div className="flex justify-between font-semibold mb-2">
        <span className="text-red-400">Design</span>
        <span className="text-slate-300">Personality</span>
      </div>
      
      {/* Planet rows */}
      {PLANET_ORDER.map(name => {
        const d = design.find(p => p.planet === name)
        const p = personality.find(pl => pl.planet === name)
        if (!d && !p) return null

        return (
          <div key={name} className="flex flex-row items-center justify-between">
            {/* Design side (left, Red) */}
            <span className="text-red-400 font-mono w-[35px] text-right">
              {d ? `${d.gate}.${d.line}` : ''}
            </span>
            
            {/* Planet symbol (center) */}
            <span className="text-slate-500 w-[24px] text-center text-[13px] shrink-0">
              {planetIcon(name)}
            </span>
            
            {/* Personality side (right, Slate/Light) */}
            <span className="text-slate-300 font-mono w-[35px] text-left">
              {p ? `${p.gate}.${p.line}` : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function PlanetColumn({ title, positions, side, color }: {
  title: string
  positions: { planet: string; gate: number; line: number }[]
  side: 'left' | 'right'
  color: string
}) {
  const sorted = PLANET_ORDER
    .map(name => positions.find(p => p.planet === name))
    .filter(Boolean) as typeof positions

  return (
    <div className="text-xs space-y-1.5 min-w-[90px]">
      <p className={`font-semibold mb-2 ${side === 'right' ? 'text-right' : 'text-left'} ${color}`}>{title}</p>
      {sorted.map(p => (
        <div key={p.planet} className={`flex ${side === 'left' ? 'flex-row' : 'flex-row-reverse'} items-center gap-1`}>
          <span className="text-slate-500 w-[18px] text-center shrink-0">{planetIcon(p.planet)}</span>
          <span className="text-slate-300 font-mono">{p.gate}.${p.line}</span>
        </div>
      ))}
    </div>
  )
}

function planetIcon(name: string): string {
  const icons: Record<string, string> = {
    Sun: '\u2609', Earth: '\u2295', Moon: '\u263D',
    'North Node': '\u260A', 'South Node': '\u260B',
    Mercury: '\u263F', Venus: '\u2640', Mars: '\u2642',
    Jupiter: '\u2643', Saturn: '\u2644', Uranus: '\u2645',
    Neptune: '\u2646', Pluto: '\u2647',
  }
  return icons[name] || '?'
}

export default function DailyView() {
  const [chart, setChart] = useState<any>(null)
  const [transit, setTransit] = useState<any>(null)
  const [overlay, setOverlay] = useState<any>(null)
  const [interpretation, setInterpretation] = useState<any>(null)
  const [loadingInterp, setLoadingInterp] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState<ViewMode>('overlay')

  useEffect(() => {
    Promise.all([api.getChart(), api.getCurrentTransit(), api.getOverlay()])
      .then(([c, t, o]) => {
        setChart(c)
        setTransit(t)
        setOverlay(o)
      })
      .catch(err => setError(err.message))
  }, [])

  const loadInterpretation = async () => {
    setLoadingInterp(true)
    try {
      const interp = await api.getDailyInterpretation()
      setInterpretation(interp)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingInterp(false)
    }
  }

  if (error) {
    return <div className="text-red-400 text-center py-8">{error}</div>
  }

  if (!chart || !overlay || !transit) {
    return <div className="text-slate-500 text-center py-8">Loading your transit weather...</div>
  }

  // Compute what gates/centers to show based on view mode
  const bodygraphProps = (() => {
    if (view === 'natal') {
      return {
        natalGates: chart.defined_gates,
        transitGates: [] as number[],
        reinforcedGates: [] as number[],
        completedChannels: [] as any[],
        natalCenters: chart.defined_centers,
        allDefinedCenters: chart.defined_centers,
        newlyDefinedCenters: [] as string[],
      }
    }
    if (view === 'transit') {
      return {
        natalGates: [] as number[],
        transitGates: transit.active_gates,
        reinforcedGates: [] as number[],
        completedChannels: [] as any[],
        natalCenters: [] as string[],
        allDefinedCenters: transit.defined_centers,
        newlyDefinedCenters: transit.defined_centers,
      }
    }
    // overlay
    return {
      natalGates: chart.defined_gates,
      transitGates: overlay.transit_gates,
      reinforcedGates: overlay.reinforced_gates,
      completedChannels: overlay.completed_channels,
      natalCenters: chart.defined_centers,
      allDefinedCenters: overlay.all_defined_centers,
      newlyDefinedCenters: overlay.newly_defined_centers,
    }
  })()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-100">Today's Transit Weather</h2>
        <p className="text-slate-500 text-sm mt-1">
          {chart.type} · {chart.authority} Authority · Profile {chart.profile}
        </p>
      </div>

      {/* View tabs */}
      <div className="flex justify-center gap-1 bg-slate-900 rounded-lg p-1 max-w-xs mx-auto">
        {(['natal', 'overlay', 'transit'] as ViewMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setView(mode)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition capitalize ${
              view === mode
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Main chart area: left column + bodygraph + right column */}
      <div className="flex items-start justify-center gap-2">
        {/* Left: Natal data (personality + design) */}
        <div className={`transition-opacity ${view === 'transit' ? 'opacity-20' : 'opacity-100'} pt-8`}>
          <CombinedNatalColumn
            design={chart.design}
            personality={chart.personality}
          />
        </div>

        {/* Center: Bodygraph */}
        <div className="flex-1 max-w-sm">
          <Bodygraph {...bodygraphProps} />
        </div>

        {/* Right: Transit data */}
        <div className={`transition-opacity ${view === 'natal' ? 'opacity-20' : 'opacity-100'}`}>
          <PlanetColumn
            title="Transit"
            positions={transit.positions}
            side="right"
            color="text-sky-400"
          />
        </div>
      </div>

      {/* Transit Highlights (only in overlay mode) */}
      {view === 'overlay' && (
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 space-y-4">
          <h3 className="font-semibold text-slate-200">Transit Highlights</h3>

          {overlay.completed_channels.length > 0 ? (
            <div>
              <p className="text-sm text-violet-400 font-medium mb-2">Channels Completed by Transit</p>
              {overlay.completed_channels.map((ch: any, i: number) => (
                <div key={i} className="bg-slate-800 rounded-lg p-3 mb-2">
                  <p className="text-sm font-medium text-slate-200">
                    {ch.name} ({ch.gates[0]}-{ch.gates[1]})
                  </p>
                  <p className="text-xs text-slate-400">{ch.centers[0]} ↔ {ch.centers[1]}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No new channels completed by today's transits.</p>
          )}

          {overlay.newly_defined_centers.length > 0 && (
            <div>
              <p className="text-sm text-sky-400 font-medium mb-1">Temporarily Defined Centers</p>
              <p className="text-sm text-slate-400">
                {overlay.newly_defined_centers.join(', ')}
              </p>
            </div>
          )}

          {overlay.reinforced_gates.length > 0 && (
            <div>
              <p className="text-sm text-amber-400 font-medium mb-1">Reinforced Gates</p>
              <p className="text-sm text-slate-400">
                Gates {overlay.reinforced_gates.join(', ')} — transit energy amplifying your natal definition
              </p>
            </div>
          )}
        </div>
      )}

      {/* AI Interpretation */}
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
        {interpretation ? (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-200">Your Daily Reading</h3>
            <div className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
              {interpretation.summary}
            </div>
            {interpretation.prompts?.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-violet-400 font-medium">Reflection Prompts</p>
                {interpretation.prompts.map((p: string, i: number) => (
                  <p key={i} className="text-sm text-slate-400 pl-3 border-l-2 border-violet-800">
                    {p}
                  </p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <button
              onClick={loadInterpretation}
              disabled={loadingInterp}
              className="bg-violet-600 hover:bg-violet-500 text-white rounded-lg px-6 py-2.5 text-sm font-medium transition disabled:opacity-50"
            >
              {loadingInterp ? 'Generating interpretation...' : 'Get AI Interpretation'}
            </button>
            <p className="text-xs text-slate-600 mt-2">powered by Gemini, personalized to your chart</p>
          </div>
        )}
      </div>
    </div>
  )
}
