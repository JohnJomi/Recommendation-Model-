"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Navbar from "@/components/Navbar"
import TrackCard from "@/components/TrackCard"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/context/ThemeContext"
import { API_BASE_URL, isNgrokUrl } from "@/lib/env"

interface Track {
  id: string
  title: string
  artist: string
  release_year: number
  duration_ms: number
  album_name: string
  album_image: string
  spotify_url: string
  popularity: number
}

interface CachedTracks {
  tracks: Track[]
  cachedAt: number
}

const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutes

const getTracksCacheKey = (spotifyId: string): string => `top_tracks_${spotifyId}`

const getFromCache = (spotifyId: string): Track[] | null => {
  try {
    const cacheKey = getTracksCacheKey(spotifyId)
    const cached = sessionStorage.getItem(cacheKey)

    if (!cached) return null

    const parsedCache: CachedTracks = JSON.parse(cached)
    const now = Date.now()
    const isExpired = now - parsedCache.cachedAt > CACHE_DURATION_MS

    if (isExpired) {
      sessionStorage.removeItem(cacheKey)
      return null
    }

    return parsedCache.tracks
  } catch {
    // If JSON parsing fails, clear invalid cache
    return null
  }
}

const saveToCache = (spotifyId: string, tracks: Track[]): void => {
  try {
    const cacheKey = getTracksCacheKey(spotifyId)
    const cacheData: CachedTracks = {
      tracks,
      cachedAt: Date.now(),
    }
    sessionStorage.setItem(cacheKey, JSON.stringify(cacheData))
  } catch {
    // Silently fail if sessionStorage is unavailable or full
  }
}

const clearCache = (spotifyId: string): void => {
  try {
    const cacheKey = getTracksCacheKey(spotifyId)
    sessionStorage.removeItem(cacheKey)
  } catch {
    // Silently fail
  }
}

export default function Dashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { spotifyId: contextSpotifyId, setSpotifyId, isLoading: authLoading } = useAuth()
  const { isDarkMode, toggleDarkMode } = useTheme()

  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)

  // Handle initial login: if spotify_id is in URL, save it to context and localStorage
  useEffect(() => {
    const urlSpotifyId = searchParams.get("spotify_id")

    if (urlSpotifyId && !contextSpotifyId) {
      // First time logging in: save to context/localStorage and clean URL
      setSpotifyId(urlSpotifyId)
      // Replace URL to remove the spotify_id param for security
      router.replace("/dashboard")
    }
  }, [searchParams, contextSpotifyId, setSpotifyId, router])

  // Fetch tracks with caching logic when spotifyId is available
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return
    }

    const spotifyId = contextSpotifyId

    if (!spotifyId) {
      setError("User not authenticated. Please log in via Spotify.")
      setLoading(false)
      return
    }

    const fetchTracks = async () => {
      try {
        // Check cache first
        const cachedTracks = getFromCache(spotifyId)

        if (cachedTracks && cachedTracks.length > 0) {
          // Load from cache - no loading spinner
          setTracks(cachedTracks)
          setIsFromCache(true)
          setError(null)
          setLoading(false)
          return
        }

        // Not in cache, fetch from backend
        setLoading(true)
        setIsFromCache(false)
        setError(null)

        const response = await fetch(
          `${API_BASE_URL}/tracks/top?spotify_id=${spotifyId}`,
          {
            headers: isNgrokUrl() ? {
              'ngrok-skip-browser-warning': 'true'
            } : {}
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch tracks: ${response.statusText}`)
        }

        const data: Track[] = await response.json()
        const validTracks = Array.isArray(data) ? data : []

        setTracks(validTracks)

        // Save to cache for future visits
        if (validTracks.length > 0) {
          saveToCache(spotifyId, validTracks)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
        setError(errorMessage)
        setTracks([])
      } finally {
        setLoading(false)
      }
    }

    fetchTracks()
  }, [contextSpotifyId, authLoading])

  const handleCardClick = (spotifyUrl: string) => {
    window.open(spotifyUrl, "_blank")
  }

  const formatDuration = (durationMs: number): string => {
    if (!durationMs) return "0:00"
    const minutes = Math.floor(durationMs / 60000)
    const seconds = Math.floor((durationMs % 60000) / 1000)
    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds
    return `${minutes}:${formattedSeconds}`
  }

  return (
    <main className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" 
        : "bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50"
    }`}>
      {/* Navbar */}
      <Navbar isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />

      {/* Main Content - add padding-top for fixed navbar */}
      <div className="max-w-7xl mx-auto px-8 pt-24 pb-16">
        {/* Hero Section */}
        <div className="mb-16">
          <h2 className={`text-5xl font-bold mb-3 leading-tight transition-colors duration-300 ${
            isDarkMode ? "text-white" : "text-amber-950"
          }`}>
            Your Top <br />
            <span className={`bg-clip-text text-transparent transition-colors duration-300 ${
              isDarkMode
                ? "bg-gradient-to-r from-amber-500 to-amber-600"
                : "bg-gradient-to-r from-amber-500 to-orange-500"
            }`}>
              Tracks
            </span>
          </h2>
          <p className={`text-lg max-w-2xl transition-colors duration-300 ${
            isDarkMode ? "text-gray-400" : "text-amber-800/70"
          }`}>
            Discover and explore your most played songs on Spotify
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center min-h-96">
            <div className="flex flex-col items-center gap-4">
              <div className={`w-12 h-12 border-4 border-t-4 rounded-full animate-spin transition-colors duration-300 ${
                isDarkMode ? "border-gray-700 border-t-amber-500" : "border-amber-200 border-t-amber-500"
              }`}></div>
              <p className={`transition-colors duration-300 ${isDarkMode ? "text-gray-400" : "text-amber-800/70"}`}>
                Loading your tracks...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className={`rounded-2xl p-8 border transition-colors duration-300 ${
            isDarkMode
              ? "bg-red-900/20 border-red-800 text-red-200"
              : "bg-red-50 border-red-200 text-red-700"
          }`}>
            <p className="font-semibold mb-2">{error}</p>
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? "text-red-300" : "text-red-600"
            }`}>
              Please try logging in again or check the backend connection.
            </p>
          </div>
        )}

        {/* No Tracks State */}
        {!loading && !error && tracks.length === 0 && (
          <div className={`rounded-2xl p-12 border text-center transition-colors duration-300 ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-gray-50 border-gray-200"
          }`}>
            <p className={`font-semibold text-lg transition-colors duration-300 ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}>
              No tracks found
            </p>
            <p className={`text-sm mt-2 transition-colors duration-300 ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}>
              Listen to more music on Spotify to see your top tracks here.
            </p>
          </div>
        )}

        {/* Tracks Grid */}
        {!loading && !error && tracks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {tracks.map((track) => (
              <TrackCard
                key={track.id}
                id={track.id}
                title={track.title}
                artist={track.artist}
                release_year={track.release_year}
                duration_ms={track.duration_ms}
                album_image={track.album_image}
                album_name={track.album_name}
                spotify_url={track.spotify_url}
                isDarkMode={isDarkMode}
                onClick={() => handleCardClick(track.spotify_url)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

