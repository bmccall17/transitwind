import { useState, useEffect } from 'react'
import { api } from '../api/client'
import Bodygraph from './Bodygraph'

export default function DailyView() {
  const [chart, setChart] = useState<any>(null)
  const [overlay, setOverlay] = useState<any>(null)
  const [interpretation, setInterpretation] = useState<any>(null)
  const [loadingInterp, setLoadingInterp] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.getChart(), api.getOverlay()])
      .then(([c, o]) => {
        setChart(c)
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

  if (!chart || !overlay) {
    return <div className="text-slate-500 text-center py-8">Loading your transit weather...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-100">Today's Transit Weather</h2>
        <p className="text-slate-500 text-sm mt-1">
          {chart.type} · {chart.authority} Authority · Profile {chart.profile}
        </p>
      </div>

      {/* Bodygraph */}
      <Bodygraph
        natalGates={chart.defined_gates}
        transitGates={overlay.transit_gates}
        reinforcedGates={overlay.reinforced_gates}
        completedChannels={overlay.completed_channels}
        natalCenters={chart.defined_centers}
        allDefinedCenters={overlay.all_defined_centers}
        newlyDefinedCenters={overlay.newly_defined_centers}
      />

      {/* Transit Highlights */}
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
