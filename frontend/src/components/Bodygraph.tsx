/**
 * SVG Bodygraph component — renders the 9 centers and channels
 * with natal (solid) and transit (dotted) overlay visualization.
 */

interface Props {
  natalGates: number[]
  transitGates: number[]
  reinforcedGates: number[]
  completedChannels: { gates: number[]; name: string }[]
  natalCenters: string[]
  allDefinedCenters: string[]
  newlyDefinedCenters: string[]
}

// Center positions on the bodygraph SVG (x, y coordinates)
const CENTER_POS: Record<string, { x: number; y: number }> = {
  Head: { x: 200, y: 30 },
  Ajna: { x: 200, y: 100 },
  Throat: { x: 200, y: 180 },
  G: { x: 200, y: 280 },
  Heart: { x: 120, y: 250 },
  Spleen: { x: 80, y: 370 },
  'Solar Plexus': { x: 320, y: 370 },
  Sacral: { x: 200, y: 400 },
  Root: { x: 200, y: 500 },
}

// Channel connections between centers (simplified — shows center-to-center lines)
const CHANNEL_LINES: [string, string][] = [
  ['Head', 'Ajna'],
  ['Ajna', 'Throat'],
  ['Throat', 'G'],
  ['Throat', 'Heart'],
  ['Throat', 'Spleen'],
  ['Throat', 'Solar Plexus'],
  ['G', 'Sacral'],
  ['G', 'Spleen'],
  ['G', 'Heart'],
  ['Heart', 'Solar Plexus'],
  ['Heart', 'Spleen'],
  ['Spleen', 'Sacral'],
  ['Spleen', 'Root'],
  ['Sacral', 'Root'],
  ['Sacral', 'Solar Plexus'],
  ['Solar Plexus', 'Root'],
]

function getCenterColor(center: string, natalCenters: string[], allDefined: string[], newlyDefined: string[]): string {
  if (natalCenters.includes(center)) {
    // Natal defined — solid color based on center type
    const colors: Record<string, string> = {
      Head: '#f5d742',
      Ajna: '#4ade80',
      Throat: '#8b5cf6',
      G: '#f59e0b',
      Heart: '#ef4444',
      Spleen: '#a78bfa',
      'Solar Plexus': '#f97316',
      Sacral: '#ef4444',
      Root: '#ef4444',
    }
    return colors[center] || '#8b5cf6'
  }
  if (newlyDefined.includes(center)) {
    return '#38bdf8' // transit-defined = sky blue
  }
  return '#334155' // undefined = dark slate
}

export default function Bodygraph({
  natalGates,
  transitGates,
  reinforcedGates,
  completedChannels,
  natalCenters,
  allDefinedCenters,
  newlyDefinedCenters,
}: Props) {
  const completedNames = new Set(completedChannels.map(c => c.name))

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 400 560" className="w-full max-w-sm">
        {/* Channel lines */}
        {CHANNEL_LINES.map(([from, to], i) => {
          const a = CENTER_POS[from]
          const b = CENTER_POS[to]
          const isActive = allDefinedCenters.includes(from) && allDefinedCenters.includes(to)
          return (
            <line
              key={i}
              x1={a.x} y1={a.y}
              x2={b.x} y2={b.y}
              stroke={isActive ? '#8b5cf6' : '#1e293b'}
              strokeWidth={isActive ? 2.5 : 1}
              strokeDasharray={natalCenters.includes(from) && natalCenters.includes(to) ? undefined : '6 3'}
              opacity={isActive ? 0.8 : 0.3}
            />
          )
        })}

        {/* Centers */}
        {Object.entries(CENTER_POS).map(([name, pos]) => {
          const fill = getCenterColor(name, natalCenters, allDefinedCenters, newlyDefinedCenters)
          const isNewlyDefined = newlyDefinedCenters.includes(name)
          const isDefined = allDefinedCenters.includes(name)

          return (
            <g key={name}>
              {/* Center shape — triangles for Head/Ajna, squares for motor centers, etc */}
              {name === 'Head' || name === 'Ajna' ? (
                <polygon
                  points={`${pos.x},${pos.y - 20} ${pos.x - 25},${pos.y + 15} ${pos.x + 25},${pos.y + 15}`}
                  fill={isDefined ? fill : 'transparent'}
                  stroke={fill}
                  strokeWidth={2}
                  strokeDasharray={isNewlyDefined ? '4 2' : undefined}
                />
              ) : name === 'Heart' ? (
                <polygon
                  points={`${pos.x},${pos.y - 18} ${pos.x + 22},${pos.y} ${pos.x},${pos.y + 18} ${pos.x - 22},${pos.y}`}
                  fill={isDefined ? fill : 'transparent'}
                  stroke={fill}
                  strokeWidth={2}
                  strokeDasharray={isNewlyDefined ? '4 2' : undefined}
                />
              ) : (
                <rect
                  x={pos.x - 22} y={pos.y - 18}
                  width={44} height={36}
                  rx={6}
                  fill={isDefined ? fill : 'transparent'}
                  stroke={fill}
                  strokeWidth={2}
                  strokeDasharray={isNewlyDefined ? '4 2' : undefined}
                />
              )}
              <text
                x={pos.x} y={pos.y + 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={8}
                fill={isDefined ? '#0f172a' : '#64748b'}
                fontWeight={600}
              >
                {name === 'Solar Plexus' ? 'SP' : name}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-slate-500 mt-2">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-violet-500 rounded-sm inline-block" /> Natal
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-sky-400 rounded-sm inline-block border border-dashed border-sky-400" /> Transit
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-slate-700 rounded-sm inline-block" /> Open
        </span>
      </div>
    </div>
  )
}
