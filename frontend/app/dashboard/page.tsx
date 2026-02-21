"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import Image from "next/image"

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

export default function Dashboard() {
  const searchParams = useSearchParams()
  const spotifyId = searchParams.get("spotify_id")

  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!spotifyId) {
      setError("User not authenticated. Please log in via Spotify.")
      setLoading(false)
      return
    }

    const fetchTracks = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          `http://localhost:8000/tracks/top?spotify_id=${spotifyId}`
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch tracks: ${response.statusText}`)
        }

        const data: Track[] = await response.json()
        setTracks(Array.isArray(data) ? data : [])
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
        setError(errorMessage)
        setTracks([])
      } finally {
        setLoading(false)
      }
    }

    fetchTracks()
  }, [spotifyId])

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
    <main className="min-h-screen bg-white p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <h1 className="text-4xl font-bold text-black mb-2">Your Top Tracks</h1>
        <p className="text-gray-600">Discover your most played songs</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center min-h-96">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
            <p className="text-gray-600">Loading your tracks...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-medium">{error}</p>
            <p className="text-red-600 text-sm mt-2">
              Please try logging in again or check the backend connection.
            </p>
          </div>
        </div>
      )}

      {/* No Tracks State */}
      {!loading && !error && tracks.length === 0 && (
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-700 font-medium">No tracks found</p>
            <p className="text-gray-600 text-sm mt-2">
              Listen to more music on Spotify to see your top tracks here.
            </p>
          </div>
        </div>
      )}

      {/* Tracks Grid */}
      {!loading && !error && tracks.length > 0 && (
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {tracks.map((track) => (
              <div
                key={track.id}
                onClick={() => handleCardClick(track.spotify_url)}
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-105 group"
              >
                {/* Album Image */}
                <div className="relative w-full aspect-square bg-gray-100 overflow-hidden rounded-t-xl">
                  {track.album_image ? (
                    <Image
                      src={track.album_image}
                      alt={track.album_name || track.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <span className="text-gray-400 text-4xl">🎵</span>
                    </div>
                  )}
                </div>

                {/* Track Info */}
                <div className="p-4">
                  {/* Title */}
                  <h3 className="text-lg font-bold text-black truncate mb-1">
                    {track.title}
                  </h3>

                  {/* Artist */}
                  <p className="text-sm text-gray-600 truncate mb-3">
                    {track.artist || "Unknown Artist"}
                  </p>

                  {/* Album Name */}
                  {track.album_name && (
                    <p className="text-xs text-gray-500 truncate mb-3">
                      {track.album_name}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="space-y-2 text-xs text-gray-600">
                    {/* Duration */}
                    <div className="flex justify-between items-center">
                      <span>Duration</span>
                      <span className="font-medium text-black">
                        {formatDuration(track.duration_ms)}
                      </span>
                    </div>

                    {/* Release Year */}
                    <div className="flex justify-between items-center">
                      <span>Released</span>
                      <span className="font-medium text-black">
                        {track.release_year || "—"}
                      </span>
                    </div>

                    {/* Popularity */}
                    <div className="flex justify-between items-center">
                      <span>Popularity</span>
                      <span className="font-medium text-black">
                        {track.popularity ?? 0}%
                      </span>
                    </div>
                  </div>

                  {/* Popularity Bar */}
                  <div className="mt-3 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black transition-all duration-300"
                      style={{
                        width: `${track.popularity ?? 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
