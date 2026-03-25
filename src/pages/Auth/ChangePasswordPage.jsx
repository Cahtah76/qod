import React, { useState } from 'react'
import { KeyRound, Eye, EyeOff, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

export default function ChangePasswordPage() {
  const { currentUser, changePassword, logout } = useAuth()
  const [newPw, setNewPw]         = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showNew, setShowNew]     = useState(false)
  const [showConf, setShowConf]   = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (newPw.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (newPw !== confirmPw) { setError('Passwords do not match.'); return }
    setLoading(true)
    await changePassword(newPw)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#08080d] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-3">
            <KeyRound size={22} className="text-blue-400" />
          </div>
          <div className="text-center">
            <div className="text-white text-lg font-bold">Change Your Password</div>
            <div className="text-gray-500 text-xs mt-1">
              Welcome, {currentUser?.name}. You must set a new password before continuing.
            </div>
          </div>
        </div>

        <div className="bg-[#1e1e24] border border-gray-800 rounded-xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  autoFocus
                  className="w-full bg-[#13131a] border border-gray-700 rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder-gray-600
                             focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <button type="button" onClick={() => setShowNew(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300" tabIndex={-1}>
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConf ? 'text' : 'password'}
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className="w-full bg-[#13131a] border border-gray-700 rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder-gray-600
                             focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <button type="button" onClick={() => setShowConf(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300" tabIndex={-1}>
                  {showConf ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60
                         text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <KeyRound size={14} />}
              {loading ? 'Saving…' : 'Set New Password'}
            </button>
          </form>
        </div>

        <button
          onClick={logout}
          className="mt-4 w-full flex items-center justify-center gap-2 text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          <LogOut size={12} /> Sign out
        </button>
      </div>
    </div>
  )
}
