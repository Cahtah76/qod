import React, { useState } from 'react'
import { format } from 'date-fns'
import { Search, Loader, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '../../utils/api.js'

const LEAGUES = ['NFL', 'NBA', 'NHL', 'MLB', 'MLS', 'NCAA Football', 'NCAA Basketball']

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function GameLookupModal({ onSelect, onClose }) {
  const [league, setLeague] = useState('NBA')
  const [date, setDate] = useState(todayStr())
  const [games, setGames] = useState(null)  // null = not searched yet
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function fetchGames(l = league, d = date) {
    setLoading(true)
    setError(null)
    setGames(null)
    try {
      const results = await api.get(`/api/games/search?league=${encodeURIComponent(l)}&date=${d}`)
      setGames(results)
      if (results.length === 0) setError('No games found for this league and date.')
    } catch (e) {
      setError('Failed to fetch games. Check your internet connection.')
    } finally {
      setLoading(false)
    }
  }

  function shiftDate(days) {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() + days)
    const next = d.toISOString().slice(0, 10)
    setDate(next)
    fetchGames(league, next)
  }

  function handleLeagueChange(l) {
    setLeague(l)
    setGames(null)
    setError(null)
  }

  return (
    <div className="space-y-4">
      {/* League + date */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="label">League</label>
          <select
            className="input"
            value={league}
            onChange={e => handleLeagueChange(e.target.value)}
          >
            {LEAGUES.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="label">Date</label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => shiftDate(-1)}
              className="p-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-600"
            >
              <ChevronLeft size={14} />
            </button>
            <input
              type="date"
              className="input flex-1 text-center"
              value={date}
              onChange={e => { setDate(e.target.value); setGames(null); setError(null) }}
            />
            <button
              type="button"
              onClick={() => shiftDate(1)}
              className="p-2 border border-gray-300 rounded hover:bg-gray-50 text-gray-600"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => fetchGames()}
          disabled={loading}
          className="btn-primary flex items-center gap-1.5 mb-0.5"
        >
          {loading ? <Loader size={14} className="animate-spin" /> : <Search size={14} />}
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {/* Results */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
          <AlertCircle size={14} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {games !== null && !error && (
        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
          {games.map((game, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(game)}
              className="w-full text-left flex items-center gap-4 p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors group"
            >
              {/* Team colors + matchup */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: game.homeTeam.primaryColor }}
                  />
                  <span className="text-sm font-semibold text-gray-800">{game.homeTeam.abbreviation}</span>
                </div>
                <span className="text-xs text-gray-400">vs</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: game.awayTeam.primaryColor }}
                  />
                  <span className="text-sm font-semibold text-gray-800">{game.awayTeam.abbreviation}</span>
                </div>
                <span className="text-sm text-gray-600 truncate ml-1">
                  {game.homeTeam.name} vs {game.awayTeam.name}
                </span>
              </div>

              {/* Time + venue */}
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-medium text-gray-700">
                  {format(new Date(game.startTime), 'h:mm a')}
                </div>
                {game._venueName && (
                  <div className="text-[10px] text-gray-400 max-w-[160px] truncate">
                    {game._venueName}
                  </div>
                )}
              </div>

              <span className="text-xs text-blue-500 group-hover:text-blue-700 font-medium flex-shrink-0">
                Select →
              </span>
            </button>
          ))}
        </div>
      )}

      {games === null && !loading && !error && (
        <div className="text-center py-8 text-sm text-gray-400">
          Select a league and date, then click Search
        </div>
      )}

      <div className="flex justify-end pt-2 border-t border-gray-100">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}
