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

// Center positions — matching MyBodyGraph spatial layout
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

// Curve offsets to ensure channels that bypass centers cleanly bow outwards around them
const CHANNEL_BENDS: Record<string, number> = {
  '20-34': 50,  // Throat to Sacral (integration) curves heavily left
  '16-48': 30,  // curves left around Ajna/G
  '35-36': -30, // curves right around G
  '12-22': -15, // slight right curve
  '21-45': -15,
  '25-51': -10,
  '10-57': 25,  // curves left (Integration)
}

// Geometrically precise local mappings for Gates inside the Center
const GATE_OFFSETS: Record<number, { dx: number, dy: number, center: string }> = {
  // Head
  64: { dx: -14, dy: 14, center: 'Head' },
  61: { dx: 0, dy: 14, center: 'Head' },
  63: { dx: 14, dy: 14, center: 'Head' },
  // Ajna
  47: { dx: -14, dy: -14, center: 'Ajna' },
  24: { dx: 0, dy: -14, center: 'Ajna' },
  4: { dx: 14, dy: -14, center: 'Ajna' },
  17: { dx: -10, dy: 10, center: 'Ajna' },
  43: { dx: 0, dy: 18, center: 'Ajna' },
  11: { dx: 10, dy: 10, center: 'Ajna' },
  // Throat
  62: { dx: -14, dy: -14, center: 'Throat' },
  23: { dx: 0, dy: -14, center: 'Throat' },
  56: { dx: 14, dy: -14, center: 'Throat' },
  16: { dx: -14, dy: -4, center: 'Throat' },
  20: { dx: -14, dy: 6, center: 'Throat' },
  31: { dx: -10, dy: 14, center: 'Throat' },
  8: { dx: 0, dy: 14, center: 'Throat' },
  33: { dx: 10, dy: 14, center: 'Throat' },
  35: { dx: 14, dy: -10, center: 'Throat' }, 
  12: { dx: 14, dy: 0, center: 'Throat' }, 
  45: { dx: 14, dy: 10, center: 'Throat' },
  // G
  1: { dx: 0, dy: -18, center: 'G' },
  7: { dx: -10, dy: -10, center: 'G' },
  13: { dx: 10, dy: -10, center: 'G' },
  10: { dx: -18, dy: 0, center: 'G' },
  25: { dx: 18, dy: 0, center: 'G' },
  15: { dx: -10, dy: 10, center: 'G' },
  46: { dx: 10, dy: 10, center: 'G' },
  2: { dx: 0, dy: 18, center: 'G' },
  // Heart (Triangle pointing LEFT)
  21: { dx: -5, dy: -8, center: 'Heart' },
  51: { dx: -10, dy: 0, center: 'Heart' },
  26: { dx: -5, dy: 8, center: 'Heart' },
  40: { dx: 10, dy: 0, center: 'Heart' },
  // Spleen (Triangle pointing RIGHT)
  48: { dx: -10, dy: -15, center: 'Spleen' },
  57: { dx: -2, dy: -8, center: 'Spleen' },
  44: { dx: 6, dy: -2, center: 'Spleen' },
  50: { dx: 18, dy: 0, center: 'Spleen' },
  32: { dx: 6, dy: 6, center: 'Spleen' },
  28: { dx: -2, dy: 12, center: 'Spleen' },
  18: { dx: -10, dy: 18, center: 'Spleen' },
  // Solar Plexus (Triangle pointing LEFT)
  36: { dx: 10, dy: -15, center: 'Solar Plexus' },
  22: { dx: 2, dy: -8, center: 'Solar Plexus' },
  37: { dx: -6, dy: -2, center: 'Solar Plexus' },
  6: { dx: -18, dy: 0, center: 'Solar Plexus' },
  49: { dx: -6, dy: 6, center: 'Solar Plexus' },
  55: { dx: 2, dy: 12, center: 'Solar Plexus' },
  30: { dx: 10, dy: 18, center: 'Solar Plexus' },
  // Sacral
  5: { dx: -12, dy: -14, center: 'Sacral' },
  14: { dx: 0, dy: -14, center: 'Sacral' },
  29: { dx: 12, dy: -14, center: 'Sacral' },
  34: { dx: -14, dy: -6, center: 'Sacral' },
  27: { dx: -14, dy: 6, center: 'Sacral' },
  59: { dx: 14, dy: 0, center: 'Sacral' },
  42: { dx: -12, dy: 14, center: 'Sacral' },
  3: { dx: 0, dy: 14, center: 'Sacral' },
  9: { dx: 12, dy: 14, center: 'Sacral' },
  // Root
  53: { dx: -14, dy: -14, center: 'Root' },
  60: { dx: 0, dy: -14, center: 'Root' },
  52: { dx: 14, dy: -14, center: 'Root' },
  54: { dx: -14, dy: -4, center: 'Root' },
  38: { dx: -14, dy: 4, center: 'Root' },
  58: { dx: -14, dy: 12, center: 'Root' },
  19: { dx: 14, dy: -4, center: 'Root' },
  39: { dx: 14, dy: 4, center: 'Root' },
  41: { dx: 14, dy: 12, center: 'Root' }
}

const CENTER_COLORS: Record<string, string> = {
  Head: '#facc15',
  Ajna: '#84cc16',
  Throat: '#b45309',
  G: '#facc15',
  Heart: '#dc2626',
  Spleen: '#b45309',
  'Solar Plexus': '#b45309',
  Sacral: '#dc2626',
  Root: '#b45309',
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
        
        {/* Silhouette Background: Accurately wide enough to map the human dimensions */}
        <path 
          d="M 250 10 
             C 210 10, 190 50, 190 100 
             C 190 130, 210 150, 210 170 
             C 210 190, 120 200, 90 260 
             C 60 320, 40 400, 40 480 
             C 40 580, 150 620, 250 620 
             C 350 620, 460 580, 460 480 
             C 460 400, 440 320, 410 260 
             C 380 200, 290 190, 290 170 
             C 290 150, 310 130, 310 100 
             C 310 50, 290 10, 250 10 Z" 
          fill="#1e293b" 
          opacity="0.5" 
        />

        {/* 1. Underlying Channels Drawn Gate-to-Gate */}
        {CHANNELS.map(([gA, gB, cA, cB], i) => {
          const offA = GATE_OFFSETS[gA]
          const offB = GATE_OFFSETS[gB]
          if (!offA || !offB) return null

          const x1 = C[cA].x + offA.dx
          const y1 = C[cA].y + offA.dy
          const x2 = C[cB].x + offB.dx
          const y2 = C[cB].y + offB.dy

          const channelKey = `${Math.min(gA, gB)}-${Math.max(gA, gB)}`
          const bend = CHANNEL_BENDS[channelKey] || 0

          let cx = (x1 + x2) / 2
          let cy = (y1 + y2) / 2

          // Use the mathematical normal vector to curve paths outwards perfectly
          if (bend !== 0) {
            const dx = x2 - x1
            const dy = y2 - y1
            const len = Math.sqrt(dx * dx + dy * dy)
            const nx = -dy / len
            const ny = dx / len
            cx += nx * bend
            cy += ny * bend
          }

          const statusA = getGateStatus(gA, natalGates, transitGates, reinforcedGates)
          const statusB = getGateStatus(gB, natalGates, transitGates, reinforcedGates)
          const isCompleted = completedGatePairs.has(`${gA}-${gB}`) || completedGatePairs.has(`${gB}-${gA}`)
          
          const getMidpoint = (t: number) => ({
            x: (1-t)*(1-t)*x1 + 2*(1-t)*t*cx + t*t*x2,
            y: (1-t)*(1-t)*y1 + 2*(1-t)*t*cy + t*t*y2
          })
          
          const mid = getMidpoint(0.5)
          const pathA = `M ${x1} ${y1} Q ${cx} ${cy} ${mid.x} ${mid.y}`
          const pathB = `M ${x2} ${y2} Q ${cx} ${cy} ${mid.x} ${mid.y}`
          const fullPath = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`

          return (
            <g key={`ch-${i}`}>
              <path d={fullPath} stroke="#334155" strokeWidth={6} fill="none" opacity={0.4} />
              
              {statusA !== 'inactive' && (
                <path d={pathA} stroke={gateColor(statusA, isCompleted)} strokeWidth={6} fill="none" />
              )}
              {statusB !== 'inactive' && (
                <path d={pathB} stroke={gateColor(statusB, isCompleted)} strokeWidth={6} fill="none" />
              )}
            </g>
          )
        })}

        {/* 2. Geometric Centers Drawn ON TOP of Channels */}
        {Object.entries(C).map(([name, pos]) => {
          const isDefined = allDefinedCenters.includes(name)
          const isTransit = newlyDefinedCenters.includes(name)
          const isNatal = natalCenters.includes(name)
          const fillColor = isDefined ? CENTER_COLORS[name] : '#475569'
          const strokeColor = isTransit ? '#34d399' : (isNatal ? '#f1f5f9' : '#1e293b')
          
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
                // Small Triangle pointing LEFT 
                <polygon points="15,-15 -15,0 15,15" fill={fillColor} stroke={strokeColor} strokeWidth={isDefined ? 2 : 1} />
              ) : name === 'Spleen' ? (
                // Triangle pointing RIGHT
                <polygon points="-25,-25 25,0 -25,25" fill={fillColor} stroke={strokeColor} strokeWidth={isDefined ? 2 : 1} />
              ) : name === 'Solar Plexus' ? (
                // Triangle pointing LEFT
                <polygon points="25,-25 -25,0 25,25" fill={fillColor} stroke={strokeColor} strokeWidth={isDefined ? 2 : 1} />
              ) : (
                // Squares (Throat, Sacral, Root)
                <rect x={-22} y={-22} width={44} height={44} rx={6} fill={fillColor} stroke={strokeColor} strokeWidth={isDefined ? 2 : 1} />
              )}
            </g>
          )
        })}

        {/* 3. Gate Number Circles ON TOP of Centers */}
        {Object.entries(GATE_OFFSETS).map(([gateStr, { dx, dy, center }]) => {
          const gate = parseInt(gateStr)
          const status = getGateStatus(gate, natalGates, transitGates, reinforcedGates)
          const x = C[center].x + dx
          const y = C[center].y + dy

          return (
            <g key={`gate-${gate}`}>
              <circle 
                cx={x} cy={y} r={6.5} 
                fill={status !== 'inactive' ? '#f8fafc' : '#64748b'} 
                stroke={status !== 'inactive' ? '#0f172a' : 'transparent'} 
                strokeWidth={1} 
              />
              <text 
                x={x} y={y + 0.5} 
                textAnchor="middle" dominantBaseline="middle" 
                fontSize={6} fontWeight={700} 
                fill="#0f172a"
              >
                {gate}
              </text>
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

