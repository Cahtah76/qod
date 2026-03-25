import React, { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { Calendar, CheckCircle, XCircle, RefreshCw, Link2, Link2Off, AlertCircle, Loader } from 'lucide-react'
import { api } from '../../utils/api.js'
import { useApp } from '../../context/AppContext.jsx'

export default function GoogleCalendarSettings() {
  const { state } = useApp()
  const location = useLocation()

  const [status, setStatus] = useState(null)
  const [calendars, setCalendars] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [toast, setToast] = useState(null)
  const [connectError, setConnectError] = useState(false)

  const [settings, setSettings] = useState({
    calendarId: 'primary',
    settings: {
      createSetDay: true,
      createGameTime: true,
      gameTimeDurationMins: 210,
      createRemoteCall: true,
      remoteCallDurationMins: 300,
      createFieldCall: true,
      fieldCallDurationMins: 480,
      sendInvites: true,
    },
  })

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadStatus = useCallback(async () => {
    const s = await api.get('/api/google/status')
    setStatus(s)
    setSettings({ calendarId: s.calendarId || 'primary', settings: s.settings })
    if (s.connected) {
      try {
        const cals = await api.get('/api/google/calendars')
        setCalendars(cals)
      } catch { /* ignore if token is stale */ }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  // Handle redirect back from Google OAuth
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const googleParam = params.get('google')
    if (googleParam === 'connected') {
      showToast('Google Calendar connected successfully!')
      loadStatus()
    } else if (googleParam === 'error') {
      setConnectError(true)
    }
  }, [location.search, loadStatus])

  async function handleConnect() {
    setConnectError(false)
    try {
      const { url, error } = await api.get('/api/google/auth-url')
      if (error) { showToast(error, 'error'); return }
      window.location.href = url
    } catch {
      showToast('Failed to get authorization URL. Check server configuration.', 'error')
    }
  }

  async function handleDisconnect() {
    if (!confirm('Disconnect Google Calendar? Existing calendar events will remain but future syncing will stop.')) return
    await api.post('/api/google/disconnect')
    setStatus((s) => ({ ...s, connected: false, email: null }))
    setCalendars([])
    showToast('Google Calendar disconnected.')
  }

  async function handleSaveSettings() {
    setSaving(true)
    try {
      await api.post('/api/google/settings', settings)
      showToast('Settings saved.')
    } catch {
      showToast('Failed to save settings.', 'error')
    }
    setSaving(false)
  }

  async function handleSyncAll() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const result = await api.post('/api/google/sync-all')
      setSyncResult(result)
      showToast(`Synced ${result.synced} event(s) to Google Calendar.`)
    } catch {
      showToast('Sync failed. Check server logs.', 'error')
    }
    setSyncing(false)
  }

  const set = (field, value) => setSettings((s) => ({ ...s, [field]: value }))
  const setSetting = (key, value) =>
    setSettings((s) => ({ ...s, settings: { ...s.settings, [key]: value } }))

  const upcomingEvents = state.events
    .filter((e) => e.startTime && new Date(e.startTime) >= new Date())
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader size={20} className="text-gray-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2
          ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {toast.type === 'error' ? <XCircle size={15} /> : <CheckCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Connection card */}
      <div className="card p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Calendar size={16} className="text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800">Google Calendar</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Automatically create calendar events and send invites when events are saved.
            </div>
          </div>
        </div>

        {connectError && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            <AlertCircle size={13} />
            Authorization failed. Make sure your Google credentials are configured correctly.
          </div>
        )}

        {status?.connected ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle size={15} className="text-green-600" />
              <div>
                <div className="text-sm font-medium text-green-800">Connected</div>
                <div className="text-xs text-green-600">{status.email}</div>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium"
            >
              <Link2Off size={13} /> Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            className="flex items-center gap-2 btn-primary w-full justify-center"
          >
            <Link2 size={14} /> Connect Google Calendar
          </button>
        )}
      </div>

      {/* Settings (only when connected) */}
      {status?.connected && (
        <>
          <div className="card p-5 space-y-5">
            <h3 className="text-sm font-semibold text-gray-800">Calendar &amp; Event Settings</h3>

            {/* Calendar picker */}
            <div>
              <label className="label">Calendar to use</label>
              {calendars.length > 0 ? (
                <select
                  className="input"
                  value={settings.calendarId}
                  onChange={(e) => set('calendarId', e.target.value)}
                >
                  {calendars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.primary ? ' (Primary)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input className="input" value="Primary calendar" disabled />
              )}
              <p className="text-xs text-gray-400 mt-1">
                All synced events will be created in this calendar.
              </p>
            </div>

            {/* Event type toggles */}
            <div>
              <label className="label mb-2">Which events to create</label>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Toggle
                    checked={settings.settings.createSetDay}
                    onChange={(v) => setSetting('createSetDay', v)}
                    label="Set Day"
                    desc="All-day event the day before the game for all assigned crew"
                  />
                </div>
                <div className="space-y-2">
                  <Toggle
                    checked={settings.settings.createGameTime}
                    onChange={(v) => setSetting('createGameTime', v)}
                    label="Game Time"
                    desc="Timed event at game start for all crew"
                  />
                  {settings.settings.createGameTime && (
                    <DurationInput
                      label="Game event duration"
                      value={settings.settings.gameTimeDurationMins}
                      onChange={(v) => setSetting('gameTimeDurationMins', v)}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Toggle
                    checked={settings.settings.createRemoteCall}
                    onChange={(v) => setSetting('createRemoteCall', v)}
                    label="Remote Call Time"
                    desc="Timed event for the remote operator"
                  />
                  {settings.settings.createRemoteCall && (
                    <DurationInput
                      label="Remote call event duration"
                      value={settings.settings.remoteCallDurationMins}
                      onChange={(v) => setSetting('remoteCallDurationMins', v)}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Toggle
                    checked={settings.settings.createFieldCall}
                    onChange={(v) => setSetting('createFieldCall', v)}
                    label="Field Call Time"
                    desc="Timed event for on-site operators"
                  />
                  {settings.settings.createFieldCall && (
                    <DurationInput
                      label="Field call event duration"
                      value={settings.settings.fieldCallDurationMins}
                      onChange={(v) => setSetting('fieldCallDurationMins', v)}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Invites toggle */}
            <div>
              <label className="label mb-2">Invites</label>
              <Toggle
                checked={settings.settings.sendInvites}
                onChange={(v) => setSetting('sendInvites', v)}
                label="Send email invites to attendees"
                desc="Google will email crew members when calendar events are created or updated"
              />
            </div>

            <div className="flex justify-end">
              <button onClick={handleSaveSettings} disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : 'Save Settings'}
              </button>
            </div>
          </div>

          {/* Bulk sync */}
          <div className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Sync All Events</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Push all upcoming events to Google Calendar. New events sync automatically — use
                  this to catch up existing events or after changing settings.
                </p>
              </div>
              <button
                onClick={handleSyncAll}
                disabled={syncing}
                className="btn-secondary flex items-center gap-1.5 flex-shrink-0"
              >
                <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing…' : 'Sync All'}
              </button>
            </div>

            {syncResult && (
              <div className="mt-3 text-xs bg-gray-50 rounded-lg px-3 py-2 space-y-1">
                <div className="text-green-700 font-medium">✓ {syncResult.synced} event(s) synced</div>
                {syncResult.errors?.length > 0 && (
                  <div className="text-red-600">
                    {syncResult.errors.length} error(s) — check server logs.
                  </div>
                )}
              </div>
            )}

            {/* Upcoming events with sync status */}
            {upcomingEvents.length > 0 && (
              <div className="mt-4 space-y-1">
                <div className="text-xs font-medium text-gray-500 mb-2">Upcoming events</div>
                {upcomingEvents.map((event) => (
                  <EventSyncRow key={event.id} event={event} onSynced={loadStatus} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Setup instructions (not connected) */}
      {!status?.connected && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Setup Instructions</h3>
          <ol className="space-y-2 text-xs text-gray-600">
            <li className="flex gap-2">
              <span className="font-bold text-gray-400 flex-shrink-0">1.</span>
              Go to <span className="font-mono bg-gray-100 px-1 rounded">console.cloud.google.com</span> and create a project.
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-gray-400 flex-shrink-0">2.</span>
              Enable the <strong>Google Calendar API</strong> for the project.
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-gray-400 flex-shrink-0">3.</span>
              Create OAuth 2.0 credentials (Web Application type). Add{' '}
              <span className="font-mono bg-gray-100 px-1 rounded">{window.location.origin.replace('5173', '3001')}/api/google/callback</span>{' '}
              as an authorized redirect URI.
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-gray-400 flex-shrink-0">4.</span>
              Add <span className="font-mono bg-gray-100 px-1 rounded">GOOGLE_CLIENT_ID</span>,{' '}
              <span className="font-mono bg-gray-100 px-1 rounded">GOOGLE_CLIENT_SECRET</span>, and{' '}
              <span className="font-mono bg-gray-100 px-1 rounded">GOOGLE_REDIRECT_URI</span> to your <strong>.env</strong> file and restart the server.
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-gray-400 flex-shrink-0">5.</span>
              Click <strong>Connect Google Calendar</strong> above.
            </li>
          </ol>
        </div>
      )}
    </div>
  )
}

function DurationInput({ label, value, onChange }) {
  const hours = Math.floor(value / 60)
  const mins = value % 60

  return (
    <div className="ml-12 flex items-center gap-3">
      <span className="text-xs text-gray-500 w-36">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={0}
          max={23}
          value={hours}
          onChange={(e) => {
            const h = Math.max(0, Math.min(23, parseInt(e.target.value) || 0))
            onChange(h * 60 + mins)
          }}
          className="w-14 text-center text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
        />
        <span className="text-xs text-gray-500">hr</span>
        <input
          type="number"
          min={0}
          max={59}
          step={15}
          value={mins}
          onChange={(e) => {
            const m = Math.max(0, Math.min(59, parseInt(e.target.value) || 0))
            onChange(hours * 60 + m)
          }}
          className="w-14 text-center text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
        />
        <span className="text-xs text-gray-500">min</span>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange, label, desc }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="flex-shrink-0 mt-0.5">
        <div
          onClick={() => onChange(!checked)}
          className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer
            ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}
        >
          <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform
            ${checked ? 'translate-x-4' : 'translate-x-0'}`}
          />
        </div>
      </div>
      <div>
        <div className="text-sm font-medium text-gray-700">{label}</div>
        {desc && <div className="text-xs text-gray-500 mt-0.5">{desc}</div>}
      </div>
    </label>
  )
}

function EventSyncRow({ event, onSynced }) {
  const [syncing, setSyncing] = useState(false)

  async function handleSync() {
    setSyncing(true)
    try {
      await api.post(`/api/google/sync/${event.id}`)
      onSynced()
    } catch { /* ignore */ }
    setSyncing(false)
  }

  const isSynced = !!event.googleSyncedAt

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSynced ? 'bg-green-500' : 'bg-gray-300'}`} />
        <span className="text-xs text-gray-700 truncate">{event.name}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        {isSynced && (
          <span className="text-[10px] text-green-600">synced</span>
        )}
        <button
          onClick={handleSync}
          disabled={syncing}
          className="text-[10px] text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          <RefreshCw size={10} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing…' : isSynced ? 'Re-sync' : 'Sync'}
        </button>
      </div>
    </div>
  )
}
