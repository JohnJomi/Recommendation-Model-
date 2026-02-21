"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"

interface AuthContextType {
  spotifyId: string | null
  isLoading: boolean
  setSpotifyId: (id: string | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [spotifyId, setSpotifyIdState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const storedSpotifyId = localStorage.getItem("spotify_id")
    if (storedSpotifyId) {
      setSpotifyIdState(storedSpotifyId)
    }
    setIsLoading(false)
  }, [])

  const setSpotifyId = (id: string | null) => {
    if (id) {
      localStorage.setItem("spotify_id", id)
      setSpotifyIdState(id)
    } else {
      localStorage.removeItem("spotify_id")
      setSpotifyIdState(null)
    }
  }

  const logout = () => {
    localStorage.removeItem("spotify_id")
    // Clear all cached tracks for this user from sessionStorage
    try {
      const cacheKey = `top_tracks_${spotifyId}`
      sessionStorage.removeItem(cacheKey)
    } catch {
      // Silently fail if sessionStorage is unavailable
    }
    setSpotifyIdState(null)
  }

  return (
    <AuthContext.Provider value={{ spotifyId, isLoading, setSpotifyId, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
