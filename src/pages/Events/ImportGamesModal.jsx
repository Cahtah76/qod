import React, { useState, useRef } from 'react'
import { format } from 'date-fns'
import { Sparkles, Key, AlertCircle, ChevronRight, Check, Loader, Upload, Calendar, Globe } from 'lucide-react'
import { parseScheduleText, getSavedApiKey, saveApiKey } from '../../utils/ai.js'
import { parseIcs } from '../../utils/icsParser.js'
import { fetchBrefSchedule, US_TIMEZONES } from '../../utils/brefParser.js'

export default function ImportGamesModal({ state, dispatch, onClose }) {
  const [tab, setTab] = useState('bref') // 'bref' | 'ics' | 'ai'
  const [step, setStep] = useState('input') // 'input' | 'review'
  const [parsed, setParsed] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [error, setError] = useState(null)

  // bref state
  const [brefUrl, setBrefUrl] = useState('')
  const [brefTz, setBrefTz] = useState('ET')

  // ICS state
  const [icsFile, setIcsFile] = useState(null)
  const fileRef = useRef()

  // AI state
  const [apiKey, setApiKey] = useState(getSavedApiKey)
  const [saveKey, setSaveKey] = useState(!!getSavedApiKey())
  const [aiText, setAiText] = useState('')
  const [loading, setLoading] = useState(false)

  const goToReview = (games) => {
    setParsed(games)
    setSelected(new Set(games.map((_, i) => i)))
    setStep('review')
  }

  const handleBrefFetch = async () => {
    if (!brefUrl.trim()) { setError('Paste a Basketball Reference schedule URL first.'); return }
    if (!brefUrl.includes('basketball-reference.com')) { setError('Must be a basketball-reference.com URL.'); return }
    setError(null)
    setLoading(true)
    try {
      const games = await fetchBrefSchedule(brefUrl.trim(), brefTz)
      if (games.length === 0) { setError('No games found. Make sure the URL is a team season schedule page.'); return }
      goToReview(games)
    } catch (e) {
      setError(e.message || 'Failed to fetch schedule.')
    } finally {
      setLoading(false)
    }
  }

  const handleIcsParse = () => {
    if (!icsFile) { setError('Select an .ics file first.'); return }
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const games = parseIcs(e.target.result)
        if (games.length === 0) { setError('No games found in this file. Make sure it is a valid .ics calendar file.'); return }
        goToReview(games)
      } catch {
        setError('Could not read this file. Make sure it is a valid .ics file.')
      }
    }
    reader.readAsText(icsFile)
  }

  const handleAiParse = async () => {
    if (!apiKey.trim()) { setError('Enter your Anthropic API key.'); return }
    if (!aiText.trim()) { setError('Paste some schedule text first.'); return }
    setError(null)
    setLoading(true)
    try {
      if (saveKey) saveApiKey(apiKey.trim())
      const games = await parseScheduleText(aiText, apiKey.trim())
      if (games.length === 0) { setError('No games detected. Try pasting more detailed schedule text.'); return }
      goToReview(games)
    } catch (e) {
      setError(e.message || 'Failed to parse. Check your API key and try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (i) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const handleAdd = () => {
    parsed.filter((_, i) => selected.has(i)).forEach(game => {
      dispatch({
        type: 'ADD_EVENT',
        payload: {
          ...game,
          venueId: '', kitId: '',
          remoteCallTime: null, fieldCallTime: null,
          surveyRequired: false, surveyType: '',
          crew: { remoteOperator: '', onsiteOperators: [] },
          notes: '',
          setDayChecklistId: null, gameDayChecklistId: null,
          extraChecklistIds: [], reportId: null,
        },
      })
    })
    onClose()
  }

  if (step === 'review') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Found <span className="font-semibold">{parsed.length} games</span>. Select the ones to add.
        </p>

        <div className="flex items-center gap-3 text-xs text-gray-500 pb-1 border-b border-gray-100">
          <button className="hover:text-gray-800" onClick={() => setSelected(new Set(parsed.map((_, i) => i)))}>Select all</button>
          <span>·</span>
          <button className="hover:text-gray-800" onClick={() => setSelected(new Set())}>Deselect all</button>
          <span className="ml-auto">{selected.size} selected</span>
        </div>

        <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
          {parsed.map((game, i) => {
            const isSelected = selected.has(i)
            return (
              <label
                key={i}
                className={`flex items-center gap-3 p-2.5 rounded border cursor-pointer transition-colors ${isSelected ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-blue-600' : 'border border-gray-300 bg-white'}`}>
                  {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                </div>
                <input type="checkbox" className="hidden" checked={isSelected} onChange={() => toggleSelect(i)} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800">{game.name}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                    <span>{game.league} · {game.season}</span>
                    {game.startTime && (
                      <>
                        <ChevronRight size={10} />
                        <span>{format(new Date(game.startTime), 'MMM d, yyyy · h:mm a')}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right text-xs flex-shrink-0">
                  <div className="font-semibold text-gray-700">{game.homeTeam?.abbreviation}</div>
                  <div className="text-gray-400 text-[10px]">vs {game.awayTeam?.abbreviation}</div>
                </div>
              </label>
            )
          })}
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <button className="btn-secondary text-xs" onClick={() => setStep('input')}>← Back</button>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" disabled={selected.size === 0} onClick={handleAdd}>
              Add {selected.size} Game{selected.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded">
        <button
          onClick={() => { setTab('bref'); setError(null) }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded transition-colors ${tab === 'bref' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Globe size={12} /> Basketball Ref
        </button>
        <button
          onClick={() => { setTab('ics'); setError(null) }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded transition-colors ${tab === 'ics' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Calendar size={12} /> .ics File
        </button>
        <button
          onClick={() => { setTab('ai'); setError(null) }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded transition-colors ${tab === 'ai' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Sparkles size={12} /> AI Text
        </button>
      </div>

      {tab === 'bref' ? (
        <>
          <div className="p-3 bg-green-50 rounded border border-green-100 text-xs text-green-800 leading-relaxed">
            Paste any Basketball Reference team schedule URL — e.g. <span className="font-mono">basketball-reference.com/teams/ATL/2026_games.html</span>. All games are pulled directly, no API key needed.
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="label">Schedule URL</label>
              <input
                className="input text-sm"
                placeholder="https://www.basketball-reference.com/teams/ATL/2026_games.html"
                value={brefUrl}
                onChange={e => { setBrefUrl(e.target.value); setError(null) }}
              />
            </div>
            <div>
              <label className="label">Game Times In</label>
              <select className="input text-sm" value={brefTz} onChange={e => setBrefTz(e.target.value)}>
                {US_TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />{error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleBrefFetch} disabled={loading || !brefUrl.trim()}>
              {loading ? <><Loader size={13} className="animate-spin" /> Fetching…</> : <><Globe size={13} /> Fetch Schedule</>}
            </button>
          </div>
        </>
      ) : tab === 'ics' ? (
        <>
          <div className="p-3 bg-blue-50 rounded border border-blue-100 text-xs text-blue-700 leading-relaxed">
            <strong>How to get a .ics file:</strong> On NBA.com or ESPN, find the team's schedule and look for "Add to Calendar" or "Export". Download the .ics file, then upload it here. No API key needed.
          </div>

          <div>
            <label className="label">Calendar File (.ics)</label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${icsFile ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}
              onClick={() => fileRef.current.click()}
            >
              <Upload size={20} className={`mx-auto mb-2 ${icsFile ? 'text-blue-500' : 'text-gray-400'}`} />
              {icsFile ? (
                <div>
                  <div className="text-sm font-medium text-gray-800">{icsFile.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{(icsFile.size / 1024).toFixed(1)} KB · Click to change</div>
                </div>
              ) : (
                <div>
                  <div className="text-sm text-gray-600">Click to select a .ics file</div>
                  <div className="text-xs text-gray-400 mt-0.5">or drag and drop</div>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".ics,text/calendar"
                className="hidden"
                onChange={e => { setIcsFile(e.target.files[0] || null); setError(null) }}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />{error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleIcsParse} disabled={!icsFile}>
              <Calendar size={13} /> Parse File
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="p-3 bg-purple-50 rounded border border-purple-100 text-xs text-purple-700 leading-relaxed">
            Paste any schedule text — a copied webpage, plain list, or table. Claude will extract the games. Requires an Anthropic API key.
          </div>

          <div>
            <label className="label">Schedule Text</label>
            <textarea
              className="input min-h-[130px] text-sm font-mono"
              placeholder={"Paste schedule text here — from ESPN, NBA.com, etc.\n\nMar 19  vs Boston Celtics  7:30 PM\nMar 21  @ Miami Heat  8:00 PM\n..."}
              value={aiText}
              onChange={e => setAiText(e.target.value)}
            />
          </div>

          <div>
            <label className="label flex items-center gap-1.5"><Key size={12} /> Anthropic API Key</label>
            <input
              type="password"
              className="input text-sm font-mono"
              placeholder="sk-ant-..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer mt-1.5">
              <input type="checkbox" className="rounded border-gray-300" checked={saveKey} onChange={e => setSaveKey(e.target.checked)} />
              Save key locally for future imports
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />{error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleAiParse} disabled={loading}>
              {loading ? <><Loader size={13} className="animate-spin" /> Parsing…</> : <><Sparkles size={13} /> Parse Schedule</>}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
