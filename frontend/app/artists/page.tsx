"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import ArtistCard from "@/components/ArtistCard"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/context/ThemeContext"
import { API_BASE_URL, isNgrokUrl } from "@/lib/env"

interface Artist {
  id: string
  name: string
  genres: string[]
  image: string
  followers: number
  spotify_url: string
}

interface CachedArtists {
  artists: Artist[]
  cachedAt: number
}

const CACHE_DURATION_MS = 5 * 60 * 1000

const getArtistsCacheKey = (spotifyId: string): string => `top_artists_${spotifyId}`

const getFromCache = (spotifyId: string): Artist[] | null => {
  try {
    const cacheKey = getArtistsCacheKey(spotifyId)
    const cached = sessionStorage.getItem(cacheKey)

    if (!cached) return null

    const parsedCache: CachedArtists = JSON.parse(cached)
    const now = Date.now()
    const isExpired = now - parsedCache.cachedAt > CACHE_DURATION_MS

    if (isExpired) {
      sessionStorage.removeItem(cacheKey)
      return null
    }

    return parsedCache.artists
  } catch {
    return null
  }
}

const saveToCache = (spotifyId: string, artists: Artist[]): void => {
  try {
    const cacheKey = getArtistsCacheKey(spotifyId)
    const cacheData: CachedArtists = {
      artists,
      cachedAt: Date.now(),
    }
    sessionStorage.setItem(cacheKey, JSON.stringify(cacheData))
  } catch {
    // Silently fail if sessionStorage is unavailable or full
  }
}

export default function TopArtists() {
  const router = useRouter()
  const { spotifyId, isLoading: authLoading } = useAuth()
  const { isDarkMode, toggleDarkMode } = useTheme()

  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !spotifyId) {
      router.push("/")
    }
  }, [spotifyId, authLoading, router])

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!spotifyId) {
      setError("User not authenticated. Please log in via Spotify.")
      setLoading(false)
      return
    }

    const fetchArtists = async () => {
      try {
        setLoading(true)
        setError(null)

        const cachedArtists = getFromCache(spotifyId)

        if (cachedArtists && cachedArtists.length > 0) {
          setArtists(cachedArtists)
          setLoading(false)
          return
        }

        const response = await fetch(
          `${API_BASE_URL}/artists/top?spotify_id=${spotifyId}`,
          {
            headers: isNgrokUrl() ? {
              "ngrok-skip-browser-warning": "true",
            } : {}
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch artists: ${response.statusText}`)
        }

        const data: Artist[] = await response.json()
        const validArtists = Array.isArray(data) ? data : []

        setArtists(validArtists)

        if (validArtists.length > 0) {
          saveToCache(spotifyId, validArtists)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
        setError(errorMessage)
        setArtists([])
      } finally {
        setLoading(false)
      }
    }

    fetchArtists()
  }, [spotifyId, authLoading])

  const handleCardClick = (spotifyUrl: string) => {
    window.open(spotifyUrl, "_blank")
  }

  if (authLoading) {
    return (
      <main
        className={`min-h-screen transition-colors duration-300 ${
          isDarkMode
            ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
            : "bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50"
        }`}
      >
        <Navbar isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div
              className={`w-12 h-12 border-4 border-t-4 rounded-full animate-spin ${
                isDarkMode
                  ? "border-gray-700 border-t-amber-500"
                  : "border-amber-200 border-t-amber-500"
              }`}
            ></div>
            <p
              className={`transition-colors duration-300 ${
                isDarkMode ? "text-gray-400" : "text-amber-800/70"
              }`}
            >
              Loading...
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (!spotifyId) {
    return null
  }

  return (
    <main
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50"
      }`}
    >
      {/* Navbar */}
      <Navbar isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />

      {/* Main Content - add padding-top for fixed navbar */}
      <div className="max-w-7xl mx-auto px-8 pt-24 pb-16">
        {/* Hero Section */}
        <div className="mb-16">
          <h2
            className={`text-5xl font-bold mb-3 leading-tight transition-colors duration-300 ${
              isDarkMode ? "text-white" : "text-amber-950"
            }`}
          >
            Your Top <br />
            <span
              className={`bg-clip-text text-transparent transition-colors duration-300 ${
                isDarkMode
                  ? "bg-gradient-to-r from-amber-500 to-amber-600"
                  : "bg-gradient-to-r from-amber-500 to-orange-500"
              }`}
            >
              Artists
            </span>
          </h2>
          <p
            className={`text-lg max-w-2xl transition-colors duration-300 ${
              isDarkMode ? "text-gray-400" : "text-amber-800/70"
            }`}
          >
            Discover your most followed artists on Spotify
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center min-h-96">
            <div className="flex flex-col items-center gap-4">
              <div
                className={`w-12 h-12 border-4 border-t-4 rounded-full animate-spin transition-colors duration-300 ${
                  isDarkMode
                    ? "border-gray-700 border-t-amber-500"
                    : "border-amber-200 border-t-amber-500"
                }`}
              ></div>
              <p
                className={`transition-colors duration-300 ${
                  isDarkMode ? "text-gray-400" : "text-amber-800/70"
                }`}
              >
                Loading your artists...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div
            className={`rounded-2xl p-8 border transition-colors duration-300 ${
              isDarkMode
                ? "bg-red-900/20 border-red-800 text-red-200"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <p className="font-semibold mb-2">{error}</p>
            <p
              className={`text-sm transition-colors duration-300 ${
                isDarkMode ? "text-red-300" : "text-red-600"
              }`}
            >
              Please try logging in again or check the backend connection.
            </p>
          </div>
        )}

        {/* No Artists State */}
        {!loading && !error && artists.length === 0 && (
          <div
            className={`rounded-2xl p-12 border text-center transition-colors duration-300 ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <p
              className={`font-semibold text-lg transition-colors duration-300 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              No artists found
            </p>
            <p
              className={`text-sm mt-2 transition-colors duration-300 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Follow more artists on Spotify to see them here.
            </p>
          </div>
        )}

        {/* Artists Grid */}
        {!loading && !error && artists.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {artists.map((artist) => (
              <ArtistCard
                key={artist.id}
                id={artist.id}
                name={artist.name}
                genres={artist.genres}
                image={artist.image}
                followers={artist.followers}
                spotify_url={artist.spotify_url}
                isDarkMode={isDarkMode}
                onClick={() => handleCardClick(artist.spotify_url)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
