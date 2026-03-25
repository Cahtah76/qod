// Minimal ICS/iCal parser — extracts VEVENT blocks into game objects
import { abbrFromName, teamColor } from './teamData.js'

function parseIcsDate(value, tzid) {
  // value like: 20260319T193000 or 20260319T233000Z
  const clean = value.replace('Z', '')
  const y = clean.slice(0, 4), mo = clean.slice(4, 6), d = clean.slice(6, 8)
  const h = clean.slice(9, 11) || '19', mi = clean.slice(11, 13) || '30'
  const iso = `${y}-${mo}-${d}T${h}:${mi}:00`
  if (value.endsWith('Z')) return new Date(iso + 'Z').toISOString()
  // If no Z and no tzid, treat as local
  return new Date(iso).toISOString()
}

function parseTeamsFromSummary(summary) {
  // Common patterns:
  // "Atlanta Hawks vs. Boston Celtics"
  // "Atlanta Hawks at Boston Celtics"
  // "ATL Hawks @ BOS Celtics"
  // "Hawks vs Celtics"
  // "ATL @ BOS"
  const vsMatch = summary.match(/^(.+?)\s+(?:vs\.?|VS\.?)\s+(.+)$/)
  const atMatch = summary.match(/^(.+?)\s+(?:at|@|AT)\s+(.+)$/)

  if (vsMatch) {
    return { home: vsMatch[1].trim(), away: vsMatch[2].trim(), homeIsFirst: true }
  }
  if (atMatch) {
    // "away @ home"
    return { home: atMatch[2].trim(), away: atMatch[1].trim(), homeIsFirst: false }
  }
  return { home: summary, away: '', homeIsFirst: true }
}

function inferLeague(teamName) {
  const nba = ['Hawks', 'Celtics', 'Nets', 'Hornets', 'Bulls', 'Cavaliers', 'Mavericks',
    'Nuggets', 'Pistons', 'Warriors', 'Rockets', 'Pacers', 'Clippers', 'Lakers',
    'Grizzlies', 'Heat', 'Bucks', 'Timberwolves', 'Pelicans', 'Knicks', 'Thunder',
    'Magic', '76ers', 'Suns', 'Trail Blazers', 'Kings', 'Spurs', 'Raptors', 'Jazz', 'Wizards']
  const nfl = ['Cardinals', 'Falcons', 'Ravens', 'Bills', 'Panthers', 'Bears', 'Bengals',
    'Browns', 'Cowboys', 'Broncos', 'Lions', 'Packers', 'Texans', 'Colts', 'Jaguars',
    'Chiefs', 'Raiders', 'Chargers', 'Rams', 'Dolphins', 'Vikings', 'Patriots', 'Saints',
    'Giants', 'Jets', 'Eagles', 'Steelers', '49ers', 'Seahawks', 'Buccaneers', 'Titans', 'Commanders']
  if (nba.some(t => teamName.includes(t))) return 'NBA'
  if (nfl.some(t => teamName.includes(t))) return 'NFL'
  return 'Other'
}

function inferSeason(dateStr) {
  if (!dateStr) return '2025-2026'
  const year = new Date(dateStr).getFullYear()
  const month = new Date(dateStr).getMonth() + 1
  // NBA/NHL season spans two years; NFL same year
  return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`
}

export function parseIcs(text) {
  const events = []
  const blocks = text.split('BEGIN:VEVENT').slice(1)

  for (const block of blocks) {
    const get = (key) => {
      const re = new RegExp(`${key}(?:;[^:]*)?:([^\\r\\n]+)`, 'i')
      const m = block.match(re)
      return m ? m[1].trim() : null
    }
    const getTzid = (key) => {
      const re = new RegExp(`${key};TZID=([^:]+):([^\\r\\n]+)`, 'i')
      const m = block.match(re)
      return m ? { tzid: m[1], value: m[2].trim() } : null
    }

    const summary = get('SUMMARY')
    if (!summary) continue

    const dtRaw = getTzid('DTSTART')
    const dtStart = dtRaw
      ? parseIcsDate(dtRaw.value, dtRaw.tzid)
      : parseIcsDate(get('DTSTART') || '', null)

    const { home, away } = parseTeamsFromSummary(summary)
    const homeAbbr = abbrFromName(home)
    const awayAbbr = abbrFromName(away)
    const league = inferLeague(home) || inferLeague(away)
    const season = inferSeason(dtStart)

    events.push({
      name: `${league} — ${homeAbbr} vs ${awayAbbr}`,
      league,
      season,
      homeTeam: { name: home, abbreviation: homeAbbr, primaryColor: teamColor(homeAbbr) },
      awayTeam: { name: away, abbreviation: awayAbbr, primaryColor: teamColor(awayAbbr) },
      startTime: dtStart,
    })
  }

  return events
}
