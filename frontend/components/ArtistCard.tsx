import Image from "next/image"

interface ArtistCardProps {
  id: string
  name: string
  genres: string[]
  image: string
  followers: number
  spotify_url: string
  isDarkMode: boolean
  onClick: () => void
}

export default function ArtistCard({
  id,
  name,
  genres,
  image,
  followers,
  spotify_url,
  isDarkMode,
  onClick,
}: ArtistCardProps) {
  const primaryGenre = genres && genres.length > 0 ? genres[0] : "Artist"
  const formattedFollowers = (followers: number): string => {
    if (followers >= 1000000) {
      return `${(followers / 1000000).toFixed(1)}M`
    }
    if (followers >= 1000) {
      return `${(followers / 1000).toFixed(1)}K`
    }
    return followers.toString()
  }

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
      {/* Artist Image */}
      <div className="relative w-full aspect-square bg-gradient-to-br from-amber-100 to-amber-200 overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={name}
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
            <span className="text-4xl">🎤</span>
          </div>
        )}
      </div>

      {/* Artist Info */}
      <div className="p-5">
        {/* Name */}
        <h3
          className={`text-base font-bold truncate mb-1 transition-colors duration-300 ${
            isDarkMode ? "text-white" : "text-amber-950"
          }`}
        >
          {name}
        </h3>

        {/* Primary Genre */}
        <p
          className={`text-sm truncate mb-3 transition-colors duration-300 ${
            isDarkMode ? "text-gray-400" : "text-amber-800/70"
          }`}
        >
          {primaryGenre || "Artist"}
        </p>

        {/* Metadata */}
        <div
          className={`space-y-2 text-sm transition-colors duration-300 ${
            isDarkMode ? "text-gray-400" : "text-amber-800/70"
          }`}
        >
          {/* Followers */}
          <div className="flex justify-between items-center">
            <span className="font-medium">Followers</span>
            <span
              className={`font-bold transition-colors duration-300 ${
                isDarkMode ? "text-gray-100" : "text-amber-900"
              }`}
            >
              {formattedFollowers(followers)}
            </span>
          </div>

          {/* Genres Count */}
          <div className="flex justify-between items-center">
            <span className="font-medium">Genres</span>
            <span
              className={`font-bold transition-colors duration-300 ${
                isDarkMode ? "text-gray-100" : "text-amber-900"
              }`}
            >
              {genres.length || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
