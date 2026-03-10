import { useState } from 'react'
import UpcomingChanges from './UpcomingChanges'
import GateTracker from './GateTracker'
import EphemerisCalendar from './EphemerisCalendar'

type Tab = 'upcoming' | 'sun' | 'ephemeris'

export default function TransitTools() {
  const [tab, setTab] = useState<Tab>('upcoming')

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-100">Transit Tools</h2>
        <p className="text-slate-500 text-sm mt-1">Track planetary movements through your chart</p>
      </div>

      <div className="flex justify-center gap-1 bg-slate-900 rounded-lg p-1 max-w-md mx-auto">
        {([
          ['upcoming', 'Upcoming'],
          ['sun', 'Sun Tracker'],
          ['ephemeris', 'Ephemeris'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition ${
              tab === key
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'upcoming' && <UpcomingChanges />}
      {tab === 'sun' && <GateTracker />}
      {tab === 'ephemeris' && <EphemerisCalendar />}
    </div>
  )
}
