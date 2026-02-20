"use client"

export default function Home() {
  const handleSpotifyLogin = () => {
    window.location.href = "http://localhost:8000/auth/login"
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center px-6">
        <h1 className="text-6xl font-bold text-black mb-4">
          Music Recommender
        </h1>
        <p className="text-xl text-gray-700 mb-12 max-w-md mx-auto">
          Discover your next favorite track. Powered by Spotify.
        </p>
        <button
          onClick={handleSpotifyLogin}
          className="px-8 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 transition-colors duration-200"
        >
          Login with Spotify
        </button>
      </div>
    </main>
  )
}