"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "@/context/ThemeContext"

export default function Recommendations() {
  const router = useRouter()
  const { spotifyId, isLoading } = useAuth()
  const { isDarkMode, toggleDarkMode } = useTheme()

  useEffect(() => {
    if (!isLoading && !spotifyId) {
      router.push("/")
    }
  }, [spotifyId, isLoading, router])

  if (isLoading) {
    return (
      <main className={`min-h-screen transition-colors duration-300 ${
        isDarkMode 
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" 
          : "bg-gradient-to-br from-gray-50 via-white to-gray-50"
      }`}>
        <Navbar isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
        <div className="flex items-center justify-center min-h-96 pt-24">
          <div className="flex flex-col items-center gap-4">
            <div className={`w-12 h-12 border-4 rounded-full animate-spin ${
              isDarkMode ? "border-gray-700 border-t-amber-500" : "border-gray-200 border-t-gray-900"
            }`}></div>
            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Loading...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!spotifyId) {
    return null
  }

  return (
    <main className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" 
        : "bg-gradient-to-br from-gray-50 via-white to-gray-50"
    }`}>
      <Navbar isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
      <div className="max-w-7xl mx-auto px-8 pt-24 pb-16">
        <h1 className={`text-5xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-black"}`}>AI Recommendations</h1>
        <p className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Coming soon...</p>
      </div>
    </main>
  )
}
