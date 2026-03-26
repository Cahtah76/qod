const LEAGUE_MAP = {
  NFL:              { sport: 'football',    league: 'nfl' },
  NBA:              { sport: 'basketball',  league: 'nba' },
  'NCAA Football':  { sport: 'football',    league: 'college-football' },
  'NCAA Basketball':{ sport: 'basketball',  league: 'mens-college-basketball' },
  MLB:              { sport: 'baseball',    league: 'mlb' },
  NHL:              { sport: 'hockey',      league: 'nhl' },
  MLS:              { sport: 'soccer',      league: 'usa.1' },
}

function inferSeason(leagueName, eventDate) {
  const year = new Date(eventDate).getFullYear()
  const month = new Date(eventDate).getMonth() + 1 // 1-12

  // Season spans two years: NBA, NHL, NCAA Basketball, NCAA Football
  const twoYear = ['NBA', 'NHL', 'NCAA Football', 'NCAA Basketball']
  if (twoYear.includes(leagueName)) {
    // Fall/winter = season starts this year; spring = season started last year
    return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`
  }
  return String(year)
}

function toHex(color) {
  if (!color) return '#000000'
  return color.startsWith('#') ? color : `#${color}`
}

function normalizeEvent(espnEvent, leagueName) {
  const comp = espnEvent.competitions?.[0]
  const home = comp?.competitors?.find(c => c.homeAway === 'home')
  const away = comp?.competitors?.find(c => c.homeAway === 'away')
  const homeAbbr = home?.team?.abbreviation || '?'
  const awayAbbr = away?.team?.abbreviation || '?'

  return {
    name: `${leagueName} — ${homeAbbr} vs ${awayAbbr}`,
    league: leagueName,
    season: inferSeason(leagueName, espnEvent.date),
    homeTeam: {
      name: home?.team?.displayName || '',
      abbreviation: homeAbbr,
      primaryColor: toHex(home?.team?.color),
    },
    awayTeam: {
      name: away?.team?.displayName || '',
      abbreviation: awayAbbr,
      primaryColor: toHex(away?.team?.color),
    },
    startTime: espnEvent.date,
    // Pass venue info so the UI can display it — not stored directly on event
    _venueName: comp?.venue?.fullName || '',
    _venueCity: comp?.venue?.address?.city || '',
    _venueState: comp?.venue?.address?.state || '',
  }
}

export async function searchGames(leagueName, date) {
  const map = LEAGUE_MAP[leagueName]
  if (!map) return []

  const dateStr = date.replace(/-/g, '')
  const url = `https://site.api.espn.com/apis/site/v2/sports/${map.sport}/${map.league}/scoreboard?dates=${dateStr}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`ESPN API returned ${res.status}`)
  const data = await res.json()

  return (data.events || []).map(e => normalizeEvent(e, leagueName))
}
