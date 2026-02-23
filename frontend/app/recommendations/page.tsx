"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import AIRecommendations from "@/components/AIRecommendations"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/context/ThemeContext"

export default function Recommendations() {
  const router = useRouter()
  const { spotifyId, isLoading: authLoading } = useAuth()
  const { isDarkMode, toggleDarkMode } = useTheme()

  useEffect(() => {
    if (!authLoading && !spotifyId) {
      router.push("/")
    }
  }, [spotifyId, authLoading, router])

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
                  ? "border-gray-700 border-t-gray-400"
                  : "border-gray-200 border-t-gray-700"
              }`}
            ></div>
            <p
              className={`transition-colors duration-300 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
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
      <Navbar isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
      <div className="max-w-7xl mx-auto px-8 pt-24 pb-16">
        <AIRecommendations spotifyId={spotifyId} isDarkMode={isDarkMode} />
      </div>
    </main>
  )
}
