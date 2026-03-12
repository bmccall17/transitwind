import React, { useState, useRef, useEffect } from 'react'

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
  "Head": { "x": 250, "y": 60 },
  "Ajna": { "x": 250, "y": 130 },
  "Throat": { "x": 250, "y": 215 },
  "G": { "x": 250, "y": 315 },
  "Heart": { "x": 327, "y": 357 },
  "Spleen": { "x": 130, "y": 424 },
  "Solar Plexus": { "x": 374, "y": 410 },
  "Sacral": { "x": 250, "y": 430 },
  "Root": { "x": 251, "y": 507 }
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
  [20, 10, 'Throat', 'G'],
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
  "20-34": 105,
  "16-48": 73,
  "35-36": -96,
  "12-22": -62,
  "21-45": -32,
  "25-51": -10,
  "10-57": 38,
  "26-44": 33,
  "37-40": -11,
  "18-58": 52,
  "28-38": 36,
  "32-54": 26,
  "30-41": -24,
  "20-57": 49,
  "39-55": -14,
  "19-49": -11,
  "10-34": 15,
  "34-57": -15
}

// Geometrically precise local mappings for Gates inside the Center
const GATE_OFFSETS: Record<number, { dx: number, dy: number, center: string }> = {
  "1": { "dx": 0, "dy": -18, "center": "G" },
  "2": { "dx": 0, "dy": 18, "center": "G" },
  "3": { "dx": 0, "dy": 14, "center": "Sacral" },
  "4": { "dx": 14, "dy": -14, "center": "Ajna" },
  "5": { "dx": -12, "dy": -19, "center": "Sacral" },
  "6": { "dx": -18, "dy": 0, "center": "Solar Plexus" },
  "7": { "dx": -10, "dy": -10, "center": "G" },
  "8": { "dx": 0, "dy": 14, "center": "Throat" },
  "9": { "dx": 12, "dy": 14, "center": "Sacral" },
  "10": { "dx": -20, "dy": -3, "center": "G" },
  "11": { "dx": 10, "dy": 10, "center": "Ajna" },
  "12": { "dx": 14, "dy": 0, "center": "Throat" },
  "13": { "dx": 10, "dy": -10, "center": "G" },
  "14": { "dx": 0, "dy": -21, "center": "Sacral" },
  "15": { "dx": -10, "dy": 10, "center": "G" },
  "16": { "dx": -14, "dy": -4, "center": "Throat" },
  "17": { "dx": -10, "dy": 10, "center": "Ajna" },
  "18": { "dx": -22, "dy": 23, "center": "Spleen" },
  "19": { "dx": 14, "dy": -4, "center": "Root" },
  "20": { "dx": -14, "dy": 6, "center": "Throat" },
  "21": { "dx": 12, "dy": -13, "center": "Heart" },
  "22": { "dx": 11, "dy": -15, "center": "Solar Plexus" },
  "23": { "dx": 0, "dy": -14, "center": "Throat" },
  "24": { "dx": 0, "dy": -14, "center": "Ajna" },
  "25": { "dx": 18, "dy": 0, "center": "G" },
  "26": { "dx": -15, "dy": 1, "center": "Heart" },
  "27": { "dx": -14, "dy": 6, "center": "Sacral" },
  "28": { "dx": -7, "dy": 14, "center": "Spleen" },
  "29": { "dx": 12, "dy": -18, "center": "Sacral" },
  "30": { "dx": 21, "dy": 21, "center": "Solar Plexus" },
  "31": { "dx": -10, "dy": 14, "center": "Throat" },
  "32": { "dx": 6, "dy": 6, "center": "Spleen" },
  "33": { "dx": 10, "dy": 14, "center": "Throat" },
  "34": { "dx": -14, "dy": -6, "center": "Sacral" },
  "35": { "dx": 14, "dy": -10, "center": "Throat" },
  "36": { "dx": 24, "dy": -25, "center": "Solar Plexus" },
  "37": { "dx": -4, "dy": -8, "center": "Solar Plexus" },
  "38": { "dx": -14, "dy": 4, "center": "Root" },
  "39": { "dx": 14, "dy": 4, "center": "Root" },
  "40": { "dx": 13, "dy": 13, "center": "Heart" },
  "41": { "dx": 14, "dy": 12, "center": "Root" },
  "42": { "dx": -12, "dy": 14, "center": "Sacral" },
  "43": { "dx": 0, "dy": 18, "center": "Ajna" },
  "44": { "dx": 2, "dy": -10, "center": "Spleen" },
  "45": { "dx": 14, "dy": 10, "center": "Throat" },
  "46": { "dx": 10, "dy": 10, "center": "G" },
  "47": { "dx": -14, "dy": -14, "center": "Ajna" },
  "48": { "dx": -22, "dy": -27, "center": "Spleen" },
  "49": { "dx": -3, "dy": 9, "center": "Solar Plexus" },
  "50": { "dx": 18, "dy": 0, "center": "Spleen" },
  "51": { "dx": 0, "dy": -7, "center": "Heart" },
  "52": { "dx": 14, "dy": -14, "center": "Root" },
  "53": { "dx": -14, "dy": -14, "center": "Root" },
  "54": { "dx": -14, "dy": -4, "center": "Root" },
  "55": { "dx": 8, "dy": 20, "center": "Solar Plexus" },
  "56": { "dx": 14, "dy": -14, "center": "Throat" },
  "57": { "dx": -12, "dy": -17, "center": "Spleen" },
  "58": { "dx": -14, "dy": 12, "center": "Root" },
  "59": { "dx": 18, "dy": -3, "center": "Sacral" },
  "60": { "dx": 0, "dy": -14, "center": "Root" },
  "61": { "dx": 0, "dy": 14, "center": "Head" },
  "62": { "dx": -14, "dy": -14, "center": "Throat" },
  "63": { "dx": 14, "dy": 14, "center": "Head" },
  "64": { "dx": -14, "dy": 14, "center": "Head" }
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

  // Layout Editor State
  const [centers, setCenters] = useState(C)
  const [gates, setGates] = useState(GATE_OFFSETS)
  const [bends, setBends] = useState(CHANNEL_BENDS)
  
  const [editMode, setEditMode] = useState(false)
  const [selected, setSelected] = useState<{ type: 'center'|'gate'|'channel', id: string | number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragStart, setDragStart] = useState<{ x: number, y: number, initialV: any } | null>(null)

  // Nudging Logic
  useEffect(() => {
    if (!editMode || !selected) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      } else {
        return;
      }
      
      const step = e.shiftKey ? 5 : 1;
      let dx = 0; let dy = 0;
      if (e.key === 'ArrowUp') dy = -step;
      if (e.key === 'ArrowDown') dy = step;
      if (e.key === 'ArrowLeft') dx = -step;
      if (e.key === 'ArrowRight') dx = step;

      if (selected.type === 'center') {
        setCenters((prev: any) => ({
          ...prev,
          [selected.id]: {
            x: prev[selected.id as string].x + dx,
            y: prev[selected.id as string].y + dy
          }
        }))
      } else if (selected.type === 'gate') {
        setGates((prev: any) => ({
          ...prev,
          [selected.id]: {
            ...prev[selected.id as number],
            dx: prev[selected.id as number].dx + dx,
            dy: prev[selected.id as number].dy + dy
          }
        }))
      } else if (selected.type === 'channel') {
        const bendChange = e.key === 'ArrowUp' || e.key === 'ArrowRight' ? step : -step;
        setBends((prev: any) => ({
          ...prev,
          [selected.id]: (prev[selected.id as string] || 0) + bendChange
        }))
      }
    };
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editMode, selected])

  // Dragging Logic
  const handlePointerDown = (e: React.PointerEvent, type: 'center'|'gate'|'channel', id: string | number) => {
    if (!editMode) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setSelected({ type, id });
    
    let initialV;
    if (type === 'center') initialV = centers[id as string];
    else if (type === 'gate') initialV = gates[id as number];
    else if (type === 'channel') initialV = bends[id as string] || 0;
    
    setDragStart({ x: e.clientX, y: e.clientY, initialV });
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!editMode || !dragStart || !selected || !svgRef.current) return;
    e.stopPropagation();
    
    const rect = svgRef.current.getBoundingClientRect();
    const scale = 500 / rect.width; 
    
    const dx = (e.clientX - dragStart.x) * scale;
    const dy = (e.clientY - dragStart.y) * scale;
    
    if (selected.type === 'center') {
      setCenters((prev: any) => ({
        ...prev,
        [selected.id]: {
          x: Math.round(dragStart.initialV.x + dx),
          y: Math.round(dragStart.initialV.y + dy)
        }
      }))
    } else if (selected.type === 'gate') {
       setGates((prev: any) => ({
        ...prev,
        [selected.id]: {
          ...prev[selected.id as number],
          dx: Math.round(dragStart.initialV.dx + dx),
          dy: Math.round(dragStart.initialV.dy + dy)
        }
      }))
    } else if (selected.type === 'channel') {
      setBends((prev: any) => ({
        ...prev,
        [selected.id]: Math.round(dragStart.initialV + dx + dy) 
      }))
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStart) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setDragStart(null);
    }
  }

  return (
    <div className="flex flex-col items-center relative">
      <svg 
        ref={svgRef}
        viewBox="0 0 500 620" 
        className="w-full max-w-md"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        
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
          const offA = gates[gA]
          const offB = gates[gB]
          if (!offA || !offB) return null

          const x1 = centers[cA].x + offA.dx
          const y1 = centers[cA].y + offA.dy
          const x2 = centers[cB].x + offB.dx
          const y2 = centers[cB].y + offB.dy

          const channelKey = `${Math.min(gA, gB)}-${Math.max(gA, gB)}`
          const bend = bends[channelKey] || 0

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

          const isSelected = selected?.type === 'channel' && selected?.id === channelKey;

          return (
            <g key={`ch-${i}`}>
              <path 
                d={fullPath} stroke={isSelected ? "#ec4899" : "#334155"} strokeWidth={isSelected ? 8 : 6} fill="none" opacity={isSelected ? 0.8 : 0.4} 
              />
              
              {statusA !== 'inactive' && (
                <path d={pathA} stroke={gateColor(statusA, isCompleted)} strokeWidth={6} fill="none" />
              )}
              {statusB !== 'inactive' && (
                <path d={pathB} stroke={gateColor(statusB, isCompleted)} strokeWidth={6} fill="none" />
              )}

              {/* Editor Bend Handle */}
              {editMode && (
                <circle 
                  cx={cx} cy={cy} r={8} fill="#ec4899" opacity={0.8}
                  onPointerDown={(e) => handlePointerDown(e, 'channel', channelKey)}
                  style={{ cursor: 'pointer' }}
                />
              )}
            </g>
          )
        })}

        {/* 2. Geometric Centers Drawn ON TOP of Channels */}
        {Object.entries(centers).map(([name, pos]: [string, any]) => {
          const isDefined = allDefinedCenters.includes(name)
          const isTransit = newlyDefinedCenters.includes(name)
          const isNatal = natalCenters.includes(name)
          const fillColor = isDefined ? CENTER_COLORS[name] : '#475569'
          const strokeColor = isTransit ? '#34d399' : (isNatal ? '#f1f5f9' : '#1e293b')
          
          const isSelected = selected?.type === 'center' && selected?.id === name;

          return (
            <g 
              key={name} 
              transform={`translate(${pos.x}, ${pos.y})`}
              onPointerDown={(e) => handlePointerDown(e, 'center', name)}
              style={editMode ? { cursor: 'move' } : {}}
            >
              {isSelected && (
                <circle r={35} fill="rgba(236,72,153, 0.2)" stroke="#ec4899" strokeWidth={2} strokeDasharray="4 4" />
              )}
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
        {Object.entries(gates).map(([gateStr, { dx, dy, center }]) => {
          const gate = parseInt(gateStr)
          const status = getGateStatus(gate, natalGates, transitGates, reinforcedGates)
          const x = centers[center].x + dx
          const y = centers[center].y + dy
          
          const isSelected = selected?.type === 'gate' && selected?.id === gate;

          return (
            <g 
              key={`gate-${gate}`}
              onPointerDown={(e) => handlePointerDown(e, 'gate', gate)}
              style={editMode ? { cursor: 'move' } : {}}
            >
              {isSelected && (
                <circle cx={x} cy={y} r={10} fill="rgba(236,72,153, 0.4)" stroke="#ec4899" strokeWidth={2} strokeDasharray="2 2" />
              )}
              <circle 
                cx={x} cy={y} r={6.5} 
                fill={status !== 'inactive' ? '#f8fafc' : (editMode ? '#94a3b8' : '#64748b')} 
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

      {/* Editor Control Panel */}
      {editMode && (
        <div className="fixed bottom-4 right-4 bg-slate-800 p-4 rounded-xl shadow-2xl border border-violet-500/50 text-xs text-slate-200 z-50 w-80">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-base text-violet-400">Layout Editor</h3>
            <button 
              onClick={() => setEditMode(false)}
              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
            >
              Close
            </button>
          </div>
          <p className="mb-3 text-slate-400">Click any Center, Gate, or red Channel point to select it. Drag it with your mouse, or use Arrow keys to nudge (Shift+Arrow for medium adjustments).</p>
          
          <div className="bg-slate-900 p-2 rounded mb-4">
            <span className="font-semibold text-slate-500">Selected: </span> 
            <span className="text-white font-mono">{selected ? `${selected.type} ${selected.id}` : 'None (Click something)'}</span>
          </div>
          
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => {
                const out = `const C = ${JSON.stringify(centers, null, 2)};\nconst GATE_OFFSETS = ${JSON.stringify(gates, null, 2)};\nconst CHANNEL_BENDS = ${JSON.stringify(bends, null, 2)};`;
                navigator.clipboard.writeText(out);
                alert("Copied config code to clipboard! Please paste this back to the AI.");
              }}
              className="bg-violet-600 hover:bg-violet-500 rounded py-2 text-white font-medium shadow-lg"
            >
              Copy Config to Clipboard
            </button>
          </div>
        </div>
      )}

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

      <div className="mt-6 flex justify-center">
        <button 
          onClick={() => setEditMode(!editMode)}
          className={`text-xs px-4 py-2 rounded-lg border transition ${
            editMode 
              ? 'bg-violet-900/50 border-violet-500 text-violet-300' 
              : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
          }`}
        >
          {editMode ? 'Disable Layout Editor' : '⚡ Enable Layout Editor'}
        </button>
      </div>

    </div>
  )
}
