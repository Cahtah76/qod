import React, { createContext, useContext, useState, useCallback } from 'react'
import { api } from '../utils/api.js'

const AUTH_KEY = 'qod_user'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const login = useCallback(async (email, password) => {
    try {
      const user = await api.post('/api/auth/login', { email, password })
      localStorage.setItem(AUTH_KEY, JSON.stringify(user))
      setCurrentUser(user)
      return { ok: true }
    } catch {
      return { ok: false, error: 'Invalid email or password.' }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY)
    setCurrentUser(null)
  }, [])

  const changePassword = useCallback(async (newPassword) => {
    if (!currentUser) return
    await api.post('/api/auth/change-password', {
      employeeId: currentUser.id,
      newPassword,
    })
    const updated = { ...currentUser, mustChangePassword: false }
    localStorage.setItem(AUTH_KEY, JSON.stringify(updated))
    setCurrentUser(updated)
  }, [currentUser])

  const can = useCallback((permission) => {
    if (!currentUser) return false
    switch (permission) {
      case 'admin':  return currentUser.role === 'Admin'
      case 'manage': return currentUser.role === 'Admin'
      default:       return true
    }
  }, [currentUser])

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: !!currentUser,
      mustChangePassword: !!currentUser?.mustChangePassword,
      login,
      logout,
      changePassword,
      can,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
