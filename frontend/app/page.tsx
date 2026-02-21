"use client"

import Image from "next/image"
import { useTheme } from "@/context/ThemeContext"

// Use ngrok URL for Spotify OAuth (required for HTTPS)
const SPOTIFY_LOGIN_URL = "https://aliza-overcomplacent-isabell.ngrok-free.dev/auth/login"

export default function Home() {
  const { isDarkMode, toggleDarkMode } = useTheme()

  return (
    <main className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" 
        : "bg-gradient-to-br from-gray-50 via-white to-gray-50"
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-8 py-6 border-b transition-colors duration-300 ${
        isDarkMode ? "border-gray-700" : "border-gray-100"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
            isDarkMode 
              ? "bg-gradient-to-br from-amber-600 to-amber-700" 
              : "bg-gradient-to-br from-amber-300 to-amber-400"
          }`}>
            <span className="text-black font-bold text-lg">♪</span>
          </div>
          <h1 className={`text-2xl font-bold transition-colors duration-300 ${isDarkMode ? "text-white" : "text-black"}`}>
            MusicFlow
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
              isDarkMode
                ? "bg-gray-700 text-yellow-400 hover:bg-gray-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>
          <a
            href={SPOTIFY_LOGIN_URL}
            className={`px-6 py-2 font-semibold rounded-full transition-all duration-300 transform hover:scale-105 inline-block ${
              isDarkMode
                ? "bg-white text-black hover:bg-gray-200"
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            Sign In
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-20">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className={`text-5xl lg:text-6xl font-bold mb-6 leading-tight transition-colors duration-300 ${
              isDarkMode ? "text-white" : "text-black"
            }`}>
              Discover Music <br />
              <span className={`bg-clip-text text-transparent transition-colors duration-300 ${
                isDarkMode
                  ? "bg-gradient-to-r from-amber-500 to-amber-600"
                  : "bg-gradient-to-r from-amber-400 to-amber-500"
              }`}>
                Like Never Before
              </span>
            </h2>
            <p className={`text-xl mb-8 max-w-md transition-colors duration-300 ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}>
              AI-powered recommendations tailored to your taste. Connect with Spotify and let our smart algorithm find your next favorite track.
            </p>
            <a
              href={SPOTIFY_LOGIN_URL}
              className={`px-8 py-4 font-bold rounded-full transition-all duration-200 text-lg transform hover:scale-105 hover:shadow-xl inline-block text-center ${
                isDarkMode
                  ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-500 hover:to-amber-600"
                  : "bg-gradient-to-r from-amber-400 to-amber-500 text-black hover:from-amber-300 hover:to-amber-400"
              }`}
            >
              Get Started with Spotify
            </a>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 gap-4">
            {/* Top Card - Highlighted */}
            <div className={`rounded-2xl p-6 shadow-lg transition-colors duration-300 ${
              isDarkMode
                ? "bg-gradient-to-br from-amber-900 to-amber-800"
                : "bg-gradient-to-br from-amber-200 to-amber-300"
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className={`text-sm font-semibold opacity-75 transition-colors duration-300 ${
                    isDarkMode ? "text-amber-100" : "text-black"
                  }`}>
                    AI Assistant
                  </p>
                  <h3 className={`text-2xl font-bold mt-2 transition-colors duration-300 ${
                    isDarkMode ? "text-amber-100" : "text-black"
                  }`}>
                    Smart Picks
                  </h3>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isDarkMode ? "bg-amber-700" : "bg-black/10"
                }`}>
                  <span className="text-xl">✨</span>
                </div>
              </div>
              <p className={`text-sm opacity-75 transition-colors duration-300 ${
                isDarkMode ? "text-amber-100" : "text-black"
              }`}>
                Personalized recommendations based on your listening habits
              </p>
              <div className={`mt-4 w-full rounded-full h-2 transition-colors duration-300 ${
                isDarkMode ? "bg-amber-700" : "bg-black/20"
              }`}>
                <div className={`h-2 rounded-full w-2/3 transition-colors duration-300 ${
                  isDarkMode ? "bg-amber-400" : "bg-black/40"
                }`}></div>
              </div>
            </div>

            {/* Bottom Cards Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`rounded-2xl p-5 shadow-md border transition-all duration-300 ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700 hover:shadow-lg hover:bg-gray-750"
                  : "bg-white border-gray-100 hover:shadow-lg"
              }`}>
                <p className={`text-xs font-semibold mb-3 transition-colors duration-300 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}>
                  Your Top Tracks
                </p>
                <div className="flex items-end gap-1 h-12">
                  <div className={`w-2 h-6 rounded-sm transition-colors duration-300 ${
                    isDarkMode ? "bg-gray-600" : "bg-gray-300"
                  }`}></div>
                  <div className={`w-2 h-8 rounded-sm transition-colors duration-300 ${
                    isDarkMode ? "bg-gray-500" : "bg-gray-400"
                  }`}></div>
                  <div className={`w-2 h-5 rounded-sm transition-colors duration-300 ${
                    isDarkMode ? "bg-gray-600" : "bg-gray-300"
                  }`}></div>
                  <div className={`w-2 h-10 rounded-sm transition-colors duration-300 ${
                    isDarkMode ? "bg-amber-500" : "bg-black"
                  }`}></div>
                </div>
              </div>

              <div className={`rounded-2xl p-5 shadow-md transition-all duration-300 ${
                isDarkMode
                  ? "bg-gray-700 text-white hover:shadow-lg hover:bg-gray-650"
                  : "bg-black text-white hover:shadow-lg"
              }`}>
                <p className={`text-xs font-semibold mb-3 transition-colors duration-300 ${
                  isDarkMode ? "text-gray-300" : "text-gray-400"
                }`}>
                  Recommendations
                </p>
                <div className="text-3xl font-bold">15+</div>
                <p className={`text-xs mt-1 transition-colors duration-300 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}>
                  new songs weekly
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className={`rounded-2xl p-8 shadow-sm border transition-all duration-300 hover:shadow-md ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-100"
          }`}>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors duration-300 overflow-hidden bg-black`}>
              <Image 
                src="/images/Spotify_Icon.png" 
                alt="Spotify" 
                width={48} 
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className={`text-xl font-bold mb-3 transition-colors duration-300 ${
              isDarkMode ? "text-white" : "text-black"
            }`}>
              Spotify Integration
            </h3>
            <p className={`transition-colors duration-300 ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}>
              Connect seamlessly with your Spotify account. We analyze your top tracks and listening patterns.
            </p>
          </div>

          <div className={`rounded-2xl p-8 shadow-sm border transition-all duration-300 hover:shadow-md ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-100"
          }`}>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors duration-300 ${
              isDarkMode ? "bg-blue-900" : "bg-blue-100"
            }`}>
              <Image 
                src="/images/Google_Gemini_icon_2025.svg-2.png" 
                alt="Gemini" 
                width={32} 
                height={32}
                className="w-8 h-8"
              />
            </div>
            <h3 className={`text-xl font-bold mb-3 transition-colors duration-300 ${
              isDarkMode ? "text-white" : "text-black"
            }`}>
              AI Powered
            </h3>
            <p className={`transition-colors duration-300 ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}>
              Advanced algorithms learn your music taste and suggest tracks you'll actually love.
            </p>
          </div>

          <div className={`rounded-2xl p-8 shadow-sm border transition-all duration-300 hover:shadow-md ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-100"
          }`}>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors duration-300 ${
              isDarkMode ? "bg-amber-900" : "bg-amber-100"
            }`}>
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className={`text-xl font-bold mb-3 transition-colors duration-300 ${
              isDarkMode ? "text-white" : "text-black"
            }`}>
              Real Time
            </h3>
            <p className={`transition-colors duration-300 ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}>
              Get fresh recommendations updated daily. Discover new music that matches your evolving taste.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className={`rounded-3xl p-12 text-center shadow-lg transition-colors duration-300 ${
          isDarkMode
            ? "bg-gradient-to-r from-gray-800 to-gray-900"
            : "bg-gradient-to-r from-black to-gray-900"
        }`}>
          <h3 className={`text-3xl font-bold mb-4 transition-colors duration-300 ${
            isDarkMode ? "text-amber-100" : "text-white"
          }`}>
            Ready to discover new music?
          </h3>
          <p className={`mb-8 text-lg transition-colors duration-300 ${
            isDarkMode ? "text-gray-400" : "text-gray-300"
          }`}>
            Join thousands of music lovers using AI recommendations
          </p>
          <a
            href={SPOTIFY_LOGIN_URL}
            className={`px-8 py-3 font-bold rounded-full transition-all duration-200 transform hover:scale-105 hover:shadow-lg inline-block ${
              isDarkMode
                ? "bg-amber-500 text-black hover:bg-amber-400"
                : "bg-amber-400 text-black hover:bg-amber-300"
            }`}
          >
            Login with Spotify
          </a>
        </div>
      </div>
    </main>
  )
}