import { useState, useEffect } from 'react'
import { api } from '../api/client'

const GATE_COLORS = [
  'bg-violet-900/60', 'bg-blue-900/60', 'bg-cyan-900/60', 'bg-teal-900/60',
  'bg-emerald-900/60', 'bg-amber-900/60', 'bg-orange-900/60', 'bg-rose-900/60',
]

function gateColor(gate: number): string {
  return GATE_COLORS[gate % GATE_COLORS.length]
}

const PLANET_ICONS: Record<string, string> = {
  Sun: '\u2609', Earth: '\u2295', Moon: '\u263D',
  'North Node': '\u260A', 'South Node': '\u260B',
  Mercury: '\u263F', Venus: '\u2640', Mars: '\u2642',
  Jupiter: '\u2643', Saturn: '\u2644', Uranus: '\u2645',
  Neptune: '\u2646', Pluto: '\u2647',
}

interface EphemerisDay {
  date: string
  planets: Record<string, { gate: number; line: number }>
  has_channel_completion: boolean
  completed_channels: string[]
}

export default function EphemerisCalendar() {
  const [days, setDays] = useState<EphemerisDay[]>([])
  const [planetOrder, setPlanetOrder] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedCell, setSelectedCell] = useState<{
    planet: string; gate: number; line: number; date: string
  } | null>(null)
  const [cellInterp, setCellInterp] = useState('')
  const [interpLoading, setInterpLoading] = useState(false)

  const getStartDate = (offset: number) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() + offset)
    return d.toISOString().split('T')[0]
  }

  const getDaysInMonth = (offset: number) => {
    const d = new Date()
    d.setMonth(d.getMonth() + offset + 1, 0)
    return d.getDate()
  }

  useEffect(() => {
    setLoading(true)
    const start = getStartDate(monthOffset)
    const numDays = getDaysInMonth(monthOffset)
    api.getEphemeris(start, numDays)
      .then(data => {
        setDays(data.days)
        setPlanetOrder(data.planet_order)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [monthOffset])

  const handleCellClick = async (planet: string, gate: number, line: number, date: string) => {
    setSelectedCell({ planet, gate, line, date })
    setCellInterp('')
    setInterpLoading(true)
    try {
      const result = await api.interpretCell(planet, gate, line, date)
      setCellInterp(result.interpretation)
    } catch (err: any) {
      setCellInterp('Could not load interpretation.')
    } finally {
      setInterpLoading(false)
    }
  }

  const monthLabel = () => {
    const d = new Date()
    d.setMonth(d.getMonth() + monthOffset)
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  if (error) return <div className="text-red-400 text-center py-8">{error}</div>

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setMonthOffset(m => m - 1)}
          className="text-slate-400 hover:text-white transition px-2 py-1"
        >
          ← Prev
        </button>
        <span className="text-slate-200 font-medium">{monthLabel()}</span>
        <button
          onClick={() => setMonthOffset(m => m + 1)}
          className="text-slate-400 hover:text-white transition px-2 py-1"
        >
          Next →
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500 text-center py-8">Loading ephemeris...</div>
      ) : (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto">
          <table className="text-xs min-w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-2 py-2 text-left text-slate-500 sticky left-0 bg-slate-900 z-10 min-w-[80px]">Planet</th>
                {days.map(d => {
                  const dayNum = new Date(d.date + 'T12:00:00Z').getUTCDate()
                  return (
                    <th key={d.date} className="px-1 py-2 text-center text-slate-500 min-w-[42px]">
                      <div>{dayNum}</div>
                      {d.has_channel_completion && (
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mx-auto mt-0.5" title={d.completed_channels.join(', ')} />
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {planetOrder.map(planet => (
                <tr key={planet} className="border-b border-slate-800/50">
                  <td className="px-2 py-1.5 text-slate-300 sticky left-0 bg-slate-900 z-10">
                    <span className="text-slate-500 mr-1">{PLANET_ICONS[planet]}</span>
                    {planet}
                  </td>
                  {days.map(d => {
                    const cell = d.planets[planet]
                    if (!cell) return <td key={d.date} className="px-1 py-1.5" />
                    const isSelected = selectedCell?.planet === planet &&
                      selectedCell?.date === d.date
                    return (
                      <td
                        key={d.date}
                        className={`px-1 py-1.5 text-center font-mono cursor-pointer transition
                          ${gateColor(cell.gate)}
                          ${isSelected ? 'ring-1 ring-violet-400' : 'hover:ring-1 hover:ring-slate-600'}
                        `}
                        onClick={() => handleCellClick(planet, cell.gate, cell.line, d.date)}
                      >
                        <span className="text-slate-200">{cell.gate}</span>
                        <span className="text-slate-500">.{cell.line}</span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Interpretation panel */}
      {selectedCell && (
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-slate-400">{PLANET_ICONS[selectedCell.planet]}</span>
            <span className="text-slate-200 font-medium">
              {selectedCell.planet} in Gate {selectedCell.gate}.{selectedCell.line}
            </span>
            <span className="text-slate-500 text-xs">— {selectedCell.date}</span>
            <button
              onClick={() => setSelectedCell(null)}
              className="ml-auto text-slate-500 hover:text-slate-300 text-xs"
            >
              close
            </button>
          </div>
          {interpLoading ? (
            <p className="text-slate-500 text-sm">Loading interpretation...</p>
          ) : (
            <p className="text-sm text-slate-300 leading-relaxed">{cellInterp}</p>
          )}
        </div>
      )}
    </div>
  )
}
