"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Navbar from "@/components/Navbar"
import { useAuth } from "@/context/AuthContext"

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

  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
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
    const spotifyId = contextSpotifyId

    if (!spotifyId) {
      if (!authLoading) {
        setError("User not authenticated. Please log in via Spotify.")
      }
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
          `http://localhost:8000/tracks/top?spotify_id=${spotifyId}`
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

  const formatDuration = (durationMs: number): string => {
    if (!durationMs) return "0:00"
    const minutes = Math.floor(durationMs / 60000)
    const seconds = Math.floor((durationMs % 60000) / 1000)
    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds
    return `${minutes}:${formattedSeconds}`
  }

  const handleCardClick = (spotifyUrl: string) => {
    window.open(spotifyUrl, "_blank")
  }

  return (
    <main className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" 
        : "bg-gradient-to-br from-gray-50 via-white to-gray-50"
    }`}>
      {/* Navbar */}
      <Navbar />

      {/* Dark Mode Toggle - Floating Button */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`fixed top-20 right-8 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 z-40 ${
          isDarkMode
            ? "bg-gray-700 text-yellow-400 hover:bg-gray-600"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {isDarkMode ? "☀️" : "🌙"}
      </button>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Hero Section */}
        <div className="mb-16">
          <h2 className={`text-5xl font-bold mb-3 leading-tight transition-colors duration-300 ${
            isDarkMode ? "text-white" : "text-black"
          }`}>
            Your Top <br />
            <span className={`bg-clip-text text-transparent transition-colors duration-300 ${
              isDarkMode
                ? "bg-gradient-to-r from-amber-500 to-amber-600"
                : "bg-gradient-to-r from-amber-400 to-amber-500"
            }`}>
              Tracks
            </span>
          </h2>
          <p className={`text-lg max-w-2xl transition-colors duration-300 ${
            isDarkMode ? "text-gray-400" : "text-gray-600"
          }`}>
            Discover and explore your most played songs on Spotify
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center min-h-96">
            <div className="flex flex-col items-center gap-4">
              <div className={`w-12 h-12 border-4 border-t-4 rounded-full animate-spin transition-colors duration-300 ${
                isDarkMode ? "border-gray-700 border-t-amber-500" : "border-gray-200 border-t-amber-400"
              }`}></div>
              <p className={`transition-colors duration-300 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
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
              <div
                key={track.id}
                onClick={() => handleCardClick(track.spotify_url)}
                className={`rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 group shadow-sm border ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700 hover:shadow-xl hover:shadow-gray-900/50"
                    : "bg-white border-gray-100"
                }`}
              >
                {/* Album Image */}
                <div className="relative w-full aspect-square bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                  {track.album_image ? (
                    <Image
                      src={track.album_image}
                      alt={track.album_name || track.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                      <span className="text-gray-500 text-4xl">🎵</span>
                    </div>
                  )}
                </div>

                {/* Track Info */}
                <div className="p-5">
                  {/* Title */}
                  <h3 className={`text-base font-bold truncate mb-1 transition-colors duration-300 ${
                    isDarkMode ? "text-white" : "text-black"
                  }`}>
                    {track.title}
                  </h3>

                  {/* Artist */}
                  <p className={`text-sm truncate mb-3 transition-colors duration-300 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}>
                    {track.artist || "Unknown Artist"}
                  </p>

                  {/* Album Name */}
                  {track.album_name && (
                    <p className={`text-xs truncate mb-4 transition-colors duration-300 ${
                      isDarkMode ? "text-gray-500" : "text-gray-500"
                    }`}>
                      {track.album_name}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className={`space-y-2 text-sm transition-colors duration-300 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}>
                    {/* Duration */}
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Duration</span>
                      <span className={`font-bold transition-colors duration-300 ${
                        isDarkMode ? "text-gray-100" : "text-gray-900"
                      }`}>
                        {formatDuration(track.duration_ms)}
                      </span>
                    </div>

                    {/* Release Year */}
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Released</span>
                      <span className={`font-bold transition-colors duration-300 ${
                        isDarkMode ? "text-gray-100" : "text-gray-900"
                      }`}>
                        {track.release_year || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

