import Image from "next/image"
import { formatDuration } from "@/lib/formatDuration"

interface TrackCardProps {
  id: string
  title: string
  artist: string
  release_year: number
  duration_ms: number
  album_image: string
  album_name?: string
  spotify_url: string
  isDarkMode: boolean
  onClick: () => void
}

export default function TrackCard({
  id,
  title,
  artist,
  release_year,
  duration_ms,
  album_image,
  album_name,
  spotify_url,
  isDarkMode,
  onClick,
}: TrackCardProps) {
  return (
    <div
      key={id}
      onClick={onClick}
      className={`rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 group shadow-sm border ${
        isDarkMode
          ? "bg-gray-800 border-gray-700 hover:shadow-xl hover:shadow-gray-900/50"
          : "bg-white/80 border-amber-200 hover:shadow-amber-200/50"
      }`}
    >
      {/* Album Image */}
      <div className="relative w-full aspect-square bg-gradient-to-br from-amber-100 to-amber-200 overflow-hidden">
        {album_image ? (
          <Image
            src={album_image}
            alt={album_name || title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center ${
              isDarkMode
                ? "bg-gradient-to-br from-gray-700 to-gray-800"
                : "bg-gradient-to-br from-amber-200 to-amber-300"
            }`}
          >
            <span className="text-4xl">🎵</span>
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="p-5">
        {/* Title */}
        <h3
          className={`text-base font-bold truncate mb-1 transition-colors duration-300 ${
            isDarkMode ? "text-white" : "text-amber-950"
          }`}
        >
          {title}
        </h3>

        {/* Artist */}
        <p
          className={`text-sm truncate mb-3 transition-colors duration-300 ${
            isDarkMode ? "text-gray-400" : "text-amber-800/70"
          }`}
        >
          {artist || "Unknown Artist"}
        </p>

        {/* Album Name */}
        {album_name && (
          <p
            className={`text-xs truncate mb-4 transition-colors duration-300 ${
              isDarkMode ? "text-gray-500" : "text-amber-600/70"
            }`}
          >
            {album_name}
          </p>
        )}

        {/* Metadata */}
        <div
          className={`space-y-2 text-sm transition-colors duration-300 ${
            isDarkMode ? "text-gray-400" : "text-amber-800/70"
          }`}
        >
          {/* Duration */}
          <div className="flex justify-between items-center">
            <span className="font-medium">Duration</span>
            <span
              className={`font-bold transition-colors duration-300 ${
                isDarkMode ? "text-gray-100" : "text-amber-900"
              }`}
            >
              {formatDuration(duration_ms)}
            </span>
          </div>

          {/* Release Year */}
          <div className="flex justify-between items-center">
            <span className="font-medium">Released</span>
            <span
              className={`font-bold transition-colors duration-300 ${
                isDarkMode ? "text-gray-100" : "text-amber-900"
              }`}
            >
              {release_year || "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
