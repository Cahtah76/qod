import { TEAM_ABBR_MAP, abbrFromName, teamColor } from './teamData.js'

// US timezone UTC offsets accounting for DST (2nd Sun Mar → 1st Sun Nov)
export const US_TIMEZONES = [
  { label: 'Eastern (ET)',  value: 'ET',  std: -5 },
  { label: 'Central (CT)',  value: 'CT',  std: -6 },
  { label: 'Mountain (MT)', value: 'MT',  std: -7 },
  { label: 'Pacific (PT)',  value: 'PT',  std: -8 },
  { label: 'UTC',           value: 'UTC', std:  0 },
]

function dstOffset(tz, date) {
  if (tz === 'UTC') return 0
  const entry = US_TIMEZONES.find(t => t.value === tz)
  const base = entry ? entry.std : -5
  const y = date.getFullYear()
  // DST starts: 2nd Sunday of March
  const mar1dow = new Date(y, 2, 1).getDay()
  const dstStart = new Date(y, 2, 8 + (7 - mar1dow) % 7)
  // DST ends: 1st Sunday of November
  const nov1dow = new Date(y, 10, 1).getDay()
  const dstEnd = new Date(y, 10, 1 + (7 - nov1dow) % 7)
  const isDst = date >= dstStart && date < dstEnd
  return isDst ? base + 1 : base
}

// Fetch a basketball-reference schedule page through the Vite proxy and parse it.
// url example: https://www.basketball-reference.com/teams/ATL/2026_games.html
export async function fetchBrefSchedule(url, sourceTz = 'ET') {
  // Extract the path portion after basketball-reference.com
  const match = url.match(/basketball-reference\.com(\/.*)/i)
  if (!match) throw new Error('Not a basketball-reference.com URL')

  const path = match[1]
  const res = await fetch(`/bref${path}`)
  if (!res.ok) throw new Error(`Failed to fetch schedule (${res.status})`)
  const html = await res.text()
  return parseBrefHtml(html, path, sourceTz)
}

function parseBrefHtml(html, path, sourceTz = 'ET') {
  // Extract team abbreviation from URL path e.g. /teams/ATL/2026_games.html
  const teamMatch = path.match(/\/teams\/([A-Z]+)\//i)
  const homeTeamAbbr = teamMatch ? teamMatch[1].toUpperCase() : null

  // Resolve home team full name from abbreviation
  const homeTeamName = homeTeamAbbr
    ? Object.entries(TEAM_ABBR_MAP).find(([, v]) => v === homeTeamAbbr)?.[0] || homeTeamAbbr
    : homeTeamAbbr

  const doc = new DOMParser().parseFromString(html, 'text/html')

  // basketball-reference sometimes wraps tables in HTML comments — unwrap them
  const comments = []
  const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_COMMENT)
  let node
  while ((node = walker.nextNode())) comments.push(node)
  for (const comment of comments) {
    const wrapper = doc.createElement('div')
    wrapper.innerHTML = comment.nodeValue
    comment.parentNode.replaceChild(wrapper, comment)
  }

  const table = doc.getElementById('games')
  if (!table) throw new Error('Schedule table not found on this page. Make sure it is a team season schedule URL.')

  const rows = Array.from(table.querySelectorAll('tbody tr'))
  const games = []

  for (const row of rows) {
    // Skip header rows and spacer rows
    if (row.classList.contains('thead') || row.classList.contains('spacer')) continue

    const get = (stat) => {
      const cell = row.querySelector(`[data-stat="${stat}"]`)
      return cell ? cell.textContent.trim() : ''
    }

    const dateStr = get('date_game')
    if (!dateStr || dateStr === 'Date') continue

    // Skip already-played games that have a result — only import future games
    // (W/L column — if it has a value the game is done; blank or empty = not played yet)
    // Comment out this filter if you want all games including past ones
    // const result = get('game_result')
    // if (result) continue

    const timeStr = get('game_start_time')   // e.g. "7:30p"
    const location = get('game_location')     // "@" = away, "" = home
    const oppName = get('opp_name')           // e.g. "Boston Celtics"

    if (!oppName) continue

    const isHome = location !== '@'
    const oppAbbr = abbrFromName(oppName)

    const homeTeam = isHome
      ? { name: homeTeamName, abbreviation: homeTeamAbbr, primaryColor: teamColor(homeTeamAbbr) }
      : { name: oppName, abbreviation: oppAbbr, primaryColor: teamColor(oppAbbr) }

    const awayTeam = isHome
      ? { name: oppName, abbreviation: oppAbbr, primaryColor: teamColor(oppAbbr) }
      : { name: homeTeamName, abbreviation: homeTeamAbbr, primaryColor: teamColor(homeTeamAbbr) }

    const startTime = parseDateTime(dateStr, timeStr, sourceTz)

    // Infer season from URL path (e.g. 2026 → 2025-2026)
    const yearMatch = path.match(/(\d{4})_games/)
    const endYear = yearMatch ? parseInt(yearMatch[1]) : new Date(startTime).getFullYear()
    const season = `${endYear - 1}-${endYear}`

    games.push({
      name: `NBA — ${homeTeam.abbreviation} vs ${awayTeam.abbreviation}`,
      league: 'NBA',
      season,
      homeTeam,
      awayTeam,
      startTime,
    })
  }

  return games
}

function parseDateTime(dateStr, timeStr, sourceTz = 'ET') {
  // dateStr: "Fri, Mar 14, 2026" — basketball-reference format
  // timeStr: "3:00p" or "7:30p"
  try {
    // Parse date parts directly to avoid local-timezone ambiguity
    const dateParsed = new Date(dateStr)
    const y = dateParsed.getFullYear()
    const mo = String(dateParsed.getMonth() + 1).padStart(2, '0')
    const d = String(dateParsed.getDate()).padStart(2, '0')

    let h = 19, mi = 0 // default 7 PM if no time
    if (timeStr) {
      const match = timeStr.match(/(\d+):(\d+)(a|p)/i)
      if (match) {
        h = parseInt(match[1])
        mi = parseInt(match[2])
        const ampm = match[3].toLowerCase()
        if (ampm === 'p' && h !== 12) h += 12
        if (ampm === 'a' && h === 12) h = 0
      }
    }

    // Build a date at noon UTC to determine DST status for that calendar day
    const midday = new Date(`${y}-${mo}-${d}T12:00:00Z`)
    const offset = dstOffset(sourceTz, midday)
    const sign = offset >= 0 ? '+' : '-'
    const absOff = String(Math.abs(offset)).padStart(2, '0')
    const hStr = String(h).padStart(2, '0')
    const miStr = String(mi).padStart(2, '0')

    // Construct ISO string with explicit timezone offset — JS will convert to UTC correctly
    return new Date(`${y}-${mo}-${d}T${hStr}:${miStr}:00${sign}${absOff}:00`).toISOString()
  } catch {
    return new Date(dateStr).toISOString()
  }
}
