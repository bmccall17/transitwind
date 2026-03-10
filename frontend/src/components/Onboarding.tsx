import { useState } from 'react'
import { api } from '../api/client'

interface Props {
  onComplete: () => void
}

interface LocationResult {
  display_name: string
  lat: string
  lon: string
}

export default function Onboarding({ onComplete }: Props) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [locationResults, setLocationResults] = useState<LocationResult[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null)
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const searchLocation = async () => {
    if (!location.trim()) return
    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=5`,
        { headers: { 'User-Agent': 'TransitWind/0.1' } }
      )
      const data = await res.json()
      setLocationResults(data)
    } catch {
      setError('Location search failed')
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !time) {
      setError('Please enter your birth date and time')
      return
    }
    setLoading(true)
    setError('')

    try {
      // Combine date + time as UTC (simplified — timezone handling would be more precise)
      const birth_datetime_utc = `${date}T${time}:00Z`

      await api.createChart({
        birth_datetime_utc,
        birth_location: selectedLocation?.display_name || location,
        birth_latitude: selectedLocation ? parseFloat(selectedLocation.lat) : undefined,
        birth_longitude: selectedLocation ? parseFloat(selectedLocation.lon) : undefined,
      })
      onComplete()
    } catch (err: any) {
      setError(err.message || 'Failed to calculate chart')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Welcome to TransitWind
          </h1>
          <p className="text-slate-400 mt-2">Enter your birth details to calculate your Human Design chart</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-xl p-6 border border-slate-800 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Birth Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Birth Time (UTC)</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
            />
            <p className="text-xs text-slate-600 mt-1">Accurate birth time is important for correct chart calculation</p>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Birth Location</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={location}
                onChange={e => { setLocation(e.target.value); setSelectedLocation(null) }}
                placeholder="City, Country"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
              <button
                type="button"
                onClick={searchLocation}
                disabled={searching}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg px-3 py-2 text-sm transition"
              >
                {searching ? '...' : 'Search'}
              </button>
            </div>

            {locationResults.length > 0 && !selectedLocation && (
              <ul className="mt-2 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                {locationResults.map((r, i) => (
                  <li
                    key={i}
                    onClick={() => {
                      setSelectedLocation(r)
                      setLocation(r.display_name)
                      setLocationResults([])
                    }}
                    className="px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 cursor-pointer border-b border-slate-700 last:border-0"
                  >
                    {r.display_name}
                  </li>
                ))}
              </ul>
            )}

            {selectedLocation && (
              <p className="text-xs text-green-400 mt-1">
                Selected: {parseFloat(selectedLocation.lat).toFixed(2)}°, {parseFloat(selectedLocation.lon).toFixed(2)}°
              </p>
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-50"
          >
            {loading ? 'Calculating your chart...' : 'Calculate My Chart'}
          </button>
        </form>
      </div>
    </div>
  )
}
