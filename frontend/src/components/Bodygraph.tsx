/**
 * SVG Bodygraph — renders the 9 centers, 36 channels with gate numbers,
 * and natal/transit overlay visualization matching standard HD bodygraph layout.
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

// Center positions — standard HD bodygraph proportions
const C: Record<string, { x: number; y: number }> = {
  Head:          { x: 250, y: 36 },
  Ajna:          { x: 250, y: 112 },
  Throat:        { x: 250, y: 202 },
  G:             { x: 250, y: 320 },
  Heart:         { x: 148, y: 278 },
  Spleen:        { x: 115, y: 420 },
  'Solar Plexus':{ x: 385, y: 420 },
  Sacral:        { x: 250, y: 448 },
  Root:          { x: 250, y: 558 },
}

// All 36 channels: [gateA, gateB, centerA, centerB]
// Each channel draws a line between its two centers with gate numbers along it
const CHANNELS: [number, number, string, string][] = [
  [64, 47, 'Head', 'Ajna'],
  [61, 24, 'Head', 'Ajna'],
  [63, 4,  'Head', 'Ajna'],
  [17, 62, 'Ajna', 'Throat'],
  [43, 23, 'Ajna', 'Throat'],
  [11, 56, 'Ajna', 'Throat'],
  [16, 48, 'Throat', 'Spleen'],
  [20, 57, 'Throat', 'Spleen'],
  [20, 34, 'Throat', 'Sacral'],
  [31, 7,  'Throat', 'G'],
  [8, 1,   'Throat', 'G'],
  [33, 13, 'Throat', 'G'],
  [10, 20, 'Throat', 'G'],
  [35, 36, 'Throat', 'Solar Plexus'],
  [12, 22, 'Throat', 'Solar Plexus'],
  [45, 21, 'Throat', 'Heart'],
  [10, 34, 'G', 'Sacral'],
  [15, 5,  'G', 'Sacral'],
  [46, 29, 'G', 'Sacral'],
  [2, 14,  'G', 'Sacral'],
  [10, 57, 'G', 'Spleen'],
  [25, 51, 'G', 'Heart'],
  [26, 44, 'Heart', 'Spleen'],
  [40, 37, 'Heart', 'Solar Plexus'],
  [50, 27, 'Spleen', 'Sacral'],
  [57, 34, 'Spleen', 'Sacral'],
  [18, 58, 'Spleen', 'Root'],
  [28, 38, 'Spleen', 'Root'],
  [32, 54, 'Spleen', 'Root'],
  [48, 16, 'Spleen', 'Throat'],  // duplicate path, skip in render
  [6, 59,  'Solar Plexus', 'Sacral'],
  [49, 19, 'Solar Plexus', 'Root'],
  [55, 39, 'Solar Plexus', 'Root'],
  [30, 41, 'Solar Plexus', 'Root'],
  [42, 53, 'Sacral', 'Root'],
  [3, 60,  'Sacral', 'Root'],
  [9, 52,  'Sacral', 'Root'],
]

// Deduplicate channels (some share the same center pair)
// We need per-channel offsets so lines don't overlap
function getChannelOffset(centerA: string, centerB: string, index: number, total: number): number {
  if (total <= 1) return 0
  const spread = Math.min(total * 6, 24)
  return (index - (total - 1) / 2) * (spread / total)
}

// Group channels by center pair for offset calculation
function groupByCenterPair(channels: typeof CHANNELS) {
  const groups: Record<string, number[]> = {}
  channels.forEach((ch, i) => {
    const key = [ch[2], ch[3]].sort().join('|')
    if (!groups[key]) groups[key] = []
    groups[key].push(i)
  })
  return groups
}

const centerPairGroups = groupByCenterPair(CHANNELS)

function getGateStatus(gate: number, natalGates: number[], transitGates: number[], reinforcedGates: number[]): 'natal' | 'transit' | 'reinforced' | 'inactive' {
  if (reinforcedGates.includes(gate)) return 'reinforced'
  if (natalGates.includes(gate)) return 'natal'
  if (transitGates.includes(gate)) return 'transit'
  return 'inactive'
}

function gateColor(status: string): string {
  switch (status) {
    case 'natal': return '#c084fc'      // violet-400
    case 'transit': return '#38bdf8'     // sky-400
    case 'reinforced': return '#fbbf24'  // amber-400
    default: return '#334155'            // slate-700
  }
}

// Standard HD center colors when defined
const CENTER_COLORS: Record<string, string> = {
  Head: '#f5d742',
  Ajna: '#4ade80',
  Throat: '#a78bfa',
  G: '#f59e0b',
  Heart: '#ef4444',
  Spleen: '#a78bfa',
  'Solar Plexus': '#f97316',
  Sacral: '#ef4444',
  Root: '#f97316',
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
  const allActive = new Set([...natalGates, ...transitGates])
  const completedGatePairs = new Set(completedChannels.map(c => `${c.gates[0]}-${c.gates[1]}`))

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 500 620" className="w-full max-w-md">

        {/* Channel lines with gate numbers */}
        {CHANNELS.map(([gA, gB, cA, cB], i) => {
          const pairKey = [cA, cB].sort().join('|')
          const group = centerPairGroups[pairKey]
          const idxInGroup = group.indexOf(i)
          const offset = getChannelOffset(cA, cB, idxInGroup, group.length)

          const a = C[cA]
          const b = C[cB]

          // Perpendicular offset
          const dx = b.x - a.x
          const dy = b.y - a.y
          const len = Math.sqrt(dx * dx + dy * dy)
          const nx = -dy / len * offset
          const ny = dx / len * offset

          const x1 = a.x + nx
          const y1 = a.y + ny
          const x2 = b.x + nx
          const y2 = b.y + ny

          const statusA = getGateStatus(gA, natalGates, transitGates, reinforcedGates)
          const statusB = getGateStatus(gB, natalGates, transitGates, reinforcedGates)
          const isActive = statusA !== 'inactive' && statusB !== 'inactive'
          const isNatalChannel = statusA === 'natal' && statusB === 'natal'
          const channelKey = `${Math.min(gA, gB)}-${Math.max(gA, gB)}`
          const isCompleted = completedGatePairs.has(`${gA}-${gB}`) || completedGatePairs.has(`${gB}-${gA}`)

          // Channel line color
          let strokeColor = '#1e293b'
          if (isActive) {
            if (isCompleted) strokeColor = '#38bdf8'
            else if (isNatalChannel) strokeColor = '#c084fc'
            else strokeColor = '#64748b'
          }

          // Gate label positions (1/4 and 3/4 along the line)
          const gAx = x1 + (x2 - x1) * 0.22
          const gAy = y1 + (y2 - y1) * 0.22
          const gBx = x1 + (x2 - x1) * 0.78
          const gBy = y1 + (y2 - y1) * 0.78

          return (
            <g key={`ch-${i}`}>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={strokeColor}
                strokeWidth={isActive ? 2 : 0.8}
                strokeDasharray={isActive && !isNatalChannel && !isCompleted ? '4 2' : undefined}
                opacity={isActive ? 0.9 : 0.2}
              />
              {/* Gate number near center A */}
              <text
                x={gAx} y={gAy}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={7} fontWeight={500}
                fill={gateColor(statusA)}
                opacity={statusA === 'inactive' ? 0.3 : 1}
              >
                {gA}
              </text>
              {/* Gate number near center B */}
              <text
                x={gBx} y={gBy}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={7} fontWeight={500}
                fill={gateColor(statusB)}
                opacity={statusB === 'inactive' ? 0.3 : 1}
              >
                {gB}
              </text>
            </g>
          )
        })}

        {/* Centers */}
        {Object.entries(C).map(([name, pos]) => {
          const isDefined = allDefinedCenters.includes(name)
          const isNatal = natalCenters.includes(name)
          const isTransit = newlyDefinedCenters.includes(name)
          const fillColor = isDefined ? (isNatal ? CENTER_COLORS[name] : '#38bdf8') : 'transparent'
          const strokeColor = isDefined ? (isNatal ? CENTER_COLORS[name] : '#38bdf8') : '#334155'
          const size = 26

          return (
            <g key={name}>
              {/* Head + Ajna: triangles */}
              {name === 'Head' ? (
                <polygon
                  points={`${pos.x},${pos.y - size} ${pos.x - size},${pos.y + size * 0.6} ${pos.x + size},${pos.y + size * 0.6}`}
                  fill={fillColor} stroke={strokeColor} strokeWidth={2}
                  strokeDasharray={isTransit ? '4 2' : undefined}
                />
              ) : name === 'Ajna' ? (
                <polygon
                  points={`${pos.x - size},${pos.y - size * 0.6} ${pos.x + size},${pos.y - size * 0.6} ${pos.x},${pos.y + size}`}
                  fill={fillColor} stroke={strokeColor} strokeWidth={2}
                  strokeDasharray={isTransit ? '4 2' : undefined}
                />
              ) : name === 'G' ? (
                /* G center: diamond */
                <polygon
                  points={`${pos.x},${pos.y - size} ${pos.x + size},${pos.y} ${pos.x},${pos.y + size} ${pos.x - size},${pos.y}`}
                  fill={fillColor} stroke={strokeColor} strokeWidth={2}
                  strokeDasharray={isTransit ? '4 2' : undefined}
                />
              ) : name === 'Heart' ? (
                /* Heart: small triangle pointing right */
                <polygon
                  points={`${pos.x - 18},${pos.y - 18} ${pos.x + 18},${pos.y} ${pos.x - 18},${pos.y + 18}`}
                  fill={fillColor} stroke={strokeColor} strokeWidth={2}
                  strokeDasharray={isTransit ? '4 2' : undefined}
                />
              ) : (
                /* All others: rounded rectangles */
                <rect
                  x={pos.x - size} y={pos.y - size * 0.7}
                  width={size * 2} height={size * 1.4}
                  rx={5}
                  fill={fillColor} stroke={strokeColor} strokeWidth={2}
                  strokeDasharray={isTransit ? '4 2' : undefined}
                />
              )}
              <text
                x={pos.x} y={pos.y + 1}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={9} fontWeight={700}
                fill={isDefined ? '#0f172a' : '#64748b'}
              >
                {name === 'Solar Plexus' ? 'SP' : name}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-2 justify-center">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm inline-block bg-violet-400" /> Natal
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm inline-block bg-sky-400" /> Transit
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm inline-block bg-amber-400" /> Reinforced
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm inline-block bg-slate-700" /> Open
        </span>
      </div>
    </div>
  )
}
