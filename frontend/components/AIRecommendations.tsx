"use client"

import { useEffect, useState } from "react"
import TrackCard from "@/components/TrackCard"

// Use ngrok URL for API calls (required for HTTPS)
const API_BASE_URL = "https://aliza-overcomplacent-isabell.ngrok-free.dev"

/**
 * Recommendation interface matching backend response
 */
interface Recommendation {
  id: string
  title: string
  artist: string
  release_year: number
  duration_ms: number
  album_image: string
  spotify_url: string
}

interface CachedRecommendations {
  recommendations: Recommendation[]
  cachedAt: number
}

// Cache for 24 hours (recommendations are cached on backend)
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000

const getRecommendationsCacheKey = (spotifyId: string): string =>
  `ai_recommendations_${spotifyId}`

/**
 * Retrieve recommendations from sessionStorage cache
 */
const getFromCache = (spotifyId: string): Recommendation[] | null => {
  try {
    const cacheKey = getRecommendationsCacheKey(spotifyId)
    const cached = sessionStorage.getItem(cacheKey)

    if (!cached) return null

    const parsedCache: CachedRecommendations = JSON.parse(cached)
    const now = Date.now()
    const isExpired = now - parsedCache.cachedAt > CACHE_DURATION_MS

    if (isExpired) {
      sessionStorage.removeItem(cacheKey)
      return null
    }

    return parsedCache.recommendations
  } catch {
    // If JSON parsing fails, clear invalid cache
    return null
  }
}

/**
 * Save recommendations to sessionStorage cache
 */
const saveToCache = (spotifyId: string, recommendations: Recommendation[]): void => {
  try {
    const cacheKey = getRecommendationsCacheKey(spotifyId)
    const cacheData: CachedRecommendations = {
      recommendations,
      cachedAt: Date.now(),
    }
    sessionStorage.setItem(cacheKey, JSON.stringify(cacheData))
  } catch {
    // Silently fail if sessionStorage is unavailable or full
  }
}

/**
 * Clear recommendations cache
 */
const clearCache = (spotifyId: string): void => {
  try {
    const cacheKey = getRecommendationsCacheKey(spotifyId)
    sessionStorage.removeItem(cacheKey)
  } catch {
    // Silently fail
  }
}

/**
 * Fetch recommendations from backend
 */
const fetchRecommendations = async (spotifyId: string): Promise<Recommendation[]> => {
  const response = await fetch(`${API_BASE_URL}/recommendations?spotify_id=${spotifyId}`, {
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch recommendations: ${response.statusText}`)
  }

  const data: Recommendation[] = await response.json()
  return Array.isArray(data) ? data : []
}

/**
 * Skeleton card for loading state
 */
const SkeletonCard = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <div
    className={`rounded-2xl overflow-hidden border animate-pulse shadow-sm ${
      isDarkMode ? "bg-gray-800 border-gray-700" :  "bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50"
    }`}
  >
    {/* Skeleton Image */}
    <div
      className={`w-full aspect-square ${
        isDarkMode ? "bg-gray-700" : "bg-amber-200"
      }`}
    ></div>

    {/* Skeleton Info */}
    <div className="p-5 space-y-3">
      <div className={`h-4 rounded ${isDarkMode ? "bg-gray-700" : "bg-amber-100"}`}></div>
      <div
        className={`h-3 rounded w-3/4 ${isDarkMode ? "bg-gray-700" : "bg-amber-100"}`}
      ></div>
      <div className="space-y-2 pt-2">
        <div className={`h-3 rounded ${isDarkMode ? "bg-gray-700" : "bg-amber-100"}`}></div>
        <div className={`h-3 rounded w-5/6 ${isDarkMode ? "bg-gray-700" : "bg-amber-100"}`}></div>
      </div>
    </div>
  </div>
)

interface AIRecommendationsProps {
  spotifyId: string | null
  isDarkMode: boolean
}

export default function AIRecommendations({
  spotifyId,
  isDarkMode,
}: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRegenerating, setIsRegenerating] = useState(false)

  /**
   * Fetch recommendations on mount or when spotifyId changes
   */
  useEffect(() => {
    if (!spotifyId) {
      setError("User not authenticated. Please log in via Spotify.")
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check cache first
        const cachedRecs = getFromCache(spotifyId)
        if (cachedRecs && cachedRecs.length > 0) {
          setRecommendations(cachedRecs)
          setLoading(false)
          return
        }

        // Fetch from backend
        const data = await fetchRecommendations(spotifyId)
        setRecommendations(data)

        // Save to cache
        if (data.length > 0) {
          saveToCache(spotifyId, data)
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load recommendations"
        setError(errorMessage)
        setRecommendations([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [spotifyId])

  /**
   * Open Spotify track in new tab
   */
  const handleRegenerate = async () => {
    if (!spotifyId) return

    try {
      setIsRegenerating(true)
      setError(null)

      // Clear cache to force fresh fetch
      clearCache(spotifyId)

      const data = await fetchRecommendations(spotifyId)
      setRecommendations(data)

      // Save new recommendations to cache
      if (data.length > 0) {
        saveToCache(spotifyId, data)
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to regenerate recommendations"
      setError(errorMessage)
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="mb-16">
        <h2
          className={`text-5xl font-bold mb-3 leading-tight transition-colors duration-300 ${
            isDarkMode ? "text-white" : "text-amber-950"
          }`}
        >
          AI <br />
          <span
            className={`bg-clip-text text-transparent transition-colors duration-300 ${
              isDarkMode
                ? "bg-gradient-to-r from-amber-500 to-amber-600"
                : "bg-gradient-to-r from-amber-500 to-orange-500"
            }`}
          >
            Recommendations
          </span>
        </h2>
        <p
          className={`text-lg max-w-2xl transition-colors duration-300 ${
            isDarkMode ? "text-gray-400" : "text-amber-800/70"
          }`}
        >
          Personalized tracks selected just for you
        </p>
      </div>

      {/* Regenerate Button */}
      <div className="mb-12 flex justify-center">
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating || loading || !spotifyId}
          className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700 text-gray-100 hover:bg-gray-700 hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              : "bg-amber-900 border-amber-800 text-white hover:bg-amber-800 hover:border-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
        >
          {isRegenerating ? (
            <span className="flex items-center gap-2">
              <span
                className={`inline-block w-4 h-4 border-2 border-t-2 rounded-full animate-spin ${
                  isDarkMode ? "border-gray-600 border-t-gray-100" : "border-amber-700 border-t-white"
                }`}
              ></span>
              Regenerating...
            </span>
          ) : (
            "Regenerate"
          )}
        </button>
      </div>

      {/* Loading State - Skeleton Cards */}
      {loading && !recommendations.length && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} isDarkMode={isDarkMode} />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div
          className={`rounded-2xl p-8 border transition-colors duration-300 ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <p
            className={`font-semibold mb-2 transition-colors duration-300 ${
              isDarkMode ? "text-gray-100" : "text-amber-950"
            }`}
          >
            {error}
          </p>
          <p
            className={`text-sm transition-colors duration-300 ${
              isDarkMode ? "text-gray-400" : "text-amber-800/70"
            }`}
          >
            Try regenerating recommendations or check your connection.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && recommendations.length === 0 && (
        <div
          className={`rounded-2xl p-12 border text-center transition-colors duration-300 ${
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-amber-50 border-amber-200"
          }`}
        >
          <p
            className={`font-semibold text-lg transition-colors duration-300 ${
              isDarkMode ? "text-gray-300" : "text-amber-950"
            }`}
          >
            No recommendations available
          </p>
          <p
            className={`text-sm mt-2 transition-colors duration-300 ${
              isDarkMode ? "text-gray-400" : "text-amber-800/70"
            }`}
          >
            Try regenerating recommendations or listen to more music on Spotify.
          </p>
        </div>
      )}

      {/* Recommendations Grid */}
      {!loading && !error && recommendations.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {recommendations.map((rec) => (
            <TrackCard
              key={rec.id}
              id={rec.id}
              title={rec.title}
              artist={rec.artist}
              release_year={rec.release_year}
              duration_ms={rec.duration_ms}
              album_image={rec.album_image}
              spotify_url={rec.spotify_url}
              isDarkMode={isDarkMode}
              onClick={() => window.open(rec.spotify_url, "_blank")}
            />
          ))}
        </div>
      )}
    </div>
  )
}
