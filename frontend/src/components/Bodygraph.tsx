// No React import needed since NextJS/Vite handles it with React 17+

interface Props {
  natalGates: number[]
  transitGates: number[]
  reinforcedGates: number[]
  completedChannels: { gates: number[]; name: string }[]
  natalCenters: string[]
  allDefinedCenters: string[]
  newlyDefinedCenters: string[]
}

// Center positions — correctly mapped to a central column with side centers
const C: Record<string, { x: number; y: number }> = {
  Head:          { x: 250, y: 60 },
  Ajna:          { x: 250, y: 130 },
  Throat:        { x: 250, y: 215 },
  G:             { x: 250, y: 315 },
  Heart:         { x: 325, y: 275 }, // Right side
  Spleen:        { x: 130, y: 430 }, // Left side
  'Solar Plexus':{ x: 370, y: 430 }, // Right side
  Sacral:        { x: 250, y: 430 },
  Root:          { x: 250, y: 535 },
}

// All 36 channels: [gateA, gateB, centerA, centerB]
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
  [6, 59,  'Solar Plexus', 'Sacral'],
  [49, 19, 'Solar Plexus', 'Root'],
  [55, 39, 'Solar Plexus', 'Root'],
  [30, 41, 'Solar Plexus', 'Root'],
  [42, 53, 'Sacral', 'Root'],
  [3, 60,  'Sacral', 'Root'],
  [9, 52,  'Sacral', 'Root'],
]

// Determine dynamic offset to separate parallel channels
function getChannelOffset(index: number, total: number): number {
  if (total <= 1) return 0
  const spread = Math.min(total * 8, 32)
  return (index - (total - 1) / 2) * (spread / total)
}

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

// Specific Colors mapping directly to the mandala image provided by user
const CENTER_COLORS: Record<string, string> = {
  Head: '#facc15',          // Yellow
  Ajna: '#84cc16',          // Green
  Throat: '#b45309',        // Brown
  G: '#facc15',             // Yellow
  Heart: '#dc2626',         // Red
  Spleen: '#b45309',        // Brown
  'Solar Plexus': '#b45309',// Brown
  Sacral: '#dc2626',        // Red
  Root: '#b45309',          // Brown
}

function getGateStatus(gate: number, natalGates: number[], transitGates: number[], reinforcedGates: number[]): 'natal' | 'transit' | 'reinforced' | 'inactive' {
  if (reinforcedGates.includes(gate)) return 'reinforced'
  if (natalGates.includes(gate)) return 'natal'
  if (transitGates.includes(gate)) return 'transit'
  return 'inactive'
}

function gateColor(status: string, isCompleted: boolean): string {
  if (isCompleted && status === 'transit') return '#34d399' // Transit complete (Emerald)
  if (isCompleted && status === 'natal') return '#3b82f6'   // Natal complete (Blue)
  
  switch (status) {
    case 'natal': return '#3b82f6'      // Blue
    case 'transit': return '#34d399'     // Green
    case 'reinforced': return '#fbbf24'  // Amber
    default: return '#334155'            // Grey
  }
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
  const completedGatePairs = new Set(completedChannels.map(c => `${c.gates[0]}-${c.gates[1]}`))

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 500 620" className="w-full max-w-md">
        
        {/* Silhouette Background */}
        <path 
          d="M250 20 C220 20, 210 50, 210 70 C210 90, 220 100, 220 120 C220 140, 200 150, 180 180 C150 220, 100 280, 80 340 C60 400, 50 480, 70 550 C90 620, 200 600, 250 600 C300 600, 410 620, 430 550 C450 480, 440 400, 420 340 C400 280, 350 220, 320 180 C300 150, 280 140, 280 120 C280 100, 290 90, 290 70 C290 50, 280 20, 250 20 Z" 
          fill="#334155" 
          opacity="0.3" 
        />

        {/* Channels */}
        {CHANNELS.map(([gA, gB, cA, cB], i) => {
          const pairKey = [cA, cB].sort().join('|')
          const group = centerPairGroups[pairKey]
          const idxInGroup = group.indexOf(i)
          const offset = getChannelOffset(idxInGroup, group.length)

          const a = C[cA]
          const b = C[cB]

          // Add curve control points to expand outward
          const dx = b.x - a.x
          const dy = b.y - a.y
          const len = Math.sqrt(dx * dx + dy * dy)
          const nx = -dy / len * offset
          const ny = dx / len * offset

          const x1 = a.x + nx
          const y1 = a.y + ny
          const x2 = b.x + nx
          const y2 = b.y + ny
          
          // Mid curve point pushing outward
          const cx = (a.x + b.x) / 2 + (nx * 1.5)
          const cy = (a.y + b.y) / 2 + (ny * 1.5)

          const statusA = getGateStatus(gA, natalGates, transitGates, reinforcedGates)
          const statusB = getGateStatus(gB, natalGates, transitGates, reinforcedGates)
          
          // Check if completion is active
          const isCompleted = completedGatePairs.has(`${gA}-${gB}`) || completedGatePairs.has(`${gB}-${gA}`)
          
          // Bezier Half Evaluator function B(t) for quadratics
          const getMidpoint = (t: number) => ({
            x: (1-t)*(1-t)*x1 + 2*(1-t)*t*cx + t*t*x2,
            y: (1-t)*(1-t)*y1 + 2*(1-t)*t*cy + t*t*y2
          })
          
          const mid = getMidpoint(0.5)

          // We draw the full inactive channel underneath first to ensure solid grey connection
          const pathA = `M ${x1} ${y1} Q ${cx} ${cy} ${mid.x} ${mid.y}`
          const pathB = `M ${x2} ${y2} Q ${cx} ${cy} ${mid.x} ${mid.y}`

          // Label coordinates (along the line, close to the center)
          const labelA = getMidpoint(0.15)
          const labelB = getMidpoint(0.85)

          return (
            <g key={`ch-${i}`}>
              {/* Background inactive full line */}
              <path d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`} stroke="#475569" strokeWidth={5} fill="none" opacity={0.3} />
              
              {/* Active half paths */}
              {statusA !== 'inactive' && (
                <path d={pathA} stroke={gateColor(statusA, isCompleted)} strokeWidth={5} fill="none" />
              )}
              {statusB !== 'inactive' && (
                <path d={pathB} stroke={gateColor(statusB, isCompleted)} strokeWidth={5} fill="none" />
              )}

              {/* Gate small circles and numbers */}
              <circle cx={labelA.x} cy={labelA.y} r={7} fill={statusA !== 'inactive' ? '#f8fafc' : '#94a3b8'} stroke={statusA !== 'inactive' ? '#0f172a' : 'transparent'} strokeWidth={1} />
              <text x={labelA.x} y={labelA.y + 0.5} textAnchor="middle" dominantBaseline="middle" fontSize={6.5} fontWeight={700} fill="#0f172a">
                {gA}
              </text>
              
              <circle cx={labelB.x} cy={labelB.y} r={7} fill={statusB !== 'inactive' ? '#f8fafc' : '#94a3b8'} stroke={statusB !== 'inactive' ? '#0f172a' : 'transparent'} strokeWidth={1} />
              <text x={labelB.x} y={labelB.y + 0.5} textAnchor="middle" dominantBaseline="middle" fontSize={6.5} fontWeight={700} fill="#0f172a">
                {gB}
              </text>
            </g>
          )
        })}

        {/* Centers */}
        {Object.entries(C).map(([name, pos]) => {
          const isDefined = allDefinedCenters.includes(name)
          const isTransit = newlyDefinedCenters.includes(name)
          const isNatal = natalCenters.includes(name)
          const fillColor = isDefined ? CENTER_COLORS[name] : '#475569'
          const strokeColor = isTransit ? '#34d399' : (isNatal ? '#f1f5f9' : '#334155')
          
          return (
            <g key={name} transform={`translate(${pos.x}, ${pos.y})`}>
              {name === 'Head' ? (
                // Upward point triangle
                <polygon points="0,-25 -30,20 30,20" fill={fillColor} stroke={strokeColor} strokeWidth={isDefined ? 2 : 1} rx={4} />
              ) : name === 'Ajna' ? (
                // Downward point triangle
                <polygon points="-30,-20 30,-20 0,25" fill={fillColor} stroke={strokeColor} strokeWidth={isDefined ? 2 : 1} />
              ) : name === 'G' ? (
                // Diamond
                <polygon points="0,-25 25,0 0,25 -25,0" fill={fillColor} stroke={strokeColor} strokeWidth={isDefined ? 2 : 1} />
              ) : name === 'Heart' ? (
                // Small Triangle pointing Right 
                <polygon points="-15,-15 15,0 -15,15" fill={fillColor} stroke={strokeColor} strokeWidth={isDefined ? 2 : 1} />
              ) : name === 'Spleen' ? (
                // Triangle pointing Right
                <polygon points="-25,-25 25,0 -25,25" fill={fillColor} stroke={strokeColor} strokeWidth={isDefined ? 2 : 1} />
              ) : name === 'Solar Plexus' ? (
                // Triangle pointing Left
                <polygon points="25,-25 -25,0 25,25" fill={fillColor} stroke={strokeColor} strokeWidth={isDefined ? 2 : 1} />
              ) : (
                // Squares (Throat, Sacral, Root)
                <rect x={-22} y={-22} width={44} height={44} rx={6} fill={fillColor} stroke={strokeColor} strokeWidth={isDefined ? 2 : 1} />
              )}
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-2 justify-center">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm inline-block bg-blue-500" /> Natal Design
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm inline-block bg-emerald-400" /> Transit Overlay
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm inline-block bg-amber-400" /> Reinforced
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm inline-block bg-slate-600" /> Open
        </span>
      </div>
    </div>
  )
}
