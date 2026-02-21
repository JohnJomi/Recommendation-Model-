"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

interface NavbarProps {
  isDarkMode: boolean
  onToggleDarkMode: () => void
}

export default function Navbar({ isDarkMode, onToggleDarkMode }: NavbarProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { label: "Top Tracks", href: "/dashboard" },
    { label: "Stats", href: "/stats" },
    { label: "AI Recommendations", href: "/recommendations" },
    { label: "Settings", href: "/settings" },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <nav className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl rounded-2xl border shadow-lg backdrop-blur-xl transition-all duration-300 ${
      isDarkMode 
        ? "bg-gray-900/70 border-gray-700/50" 
        : "bg-white/70 border-gray-200/50"
    }`}>
      <div className="px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
              isDarkMode 
                ? "bg-gradient-to-br from-amber-600 to-amber-700" 
                : "bg-gradient-to-br from-amber-400 to-amber-500"
            }`}>
              <span className="text-black font-bold text-sm">♪</span>
            </div>
            <h1 className={`text-lg font-bold transition-colors duration-200 ${
              isDarkMode ? "text-white group-hover:text-gray-300" : "text-black group-hover:text-gray-700"
            }`}>
              MusicFlow
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-all duration-200 px-3 py-1.5 rounded-full ${
                  isActive(item.href)
                    ? isDarkMode 
                      ? "bg-amber-600/20 text-amber-400" 
                      : "bg-amber-400/20 text-amber-700"
                    : isDarkMode
                      ? "text-gray-400 hover:text-white hover:bg-gray-700/50"
                      : "text-gray-600 hover:text-black hover:bg-gray-100/50"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Side - Dark Mode Toggle & Mobile Menu */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                isDarkMode
                  ? "bg-gray-700/50 text-yellow-400 hover:bg-gray-600/50"
                  : "bg-gray-200/50 text-gray-700 hover:bg-gray-300/50"
              }`}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1 rounded-full transition-colors ${
                isDarkMode 
                  ? "text-gray-300 hover:text-white hover:bg-gray-700/50" 
                  : "text-gray-700 hover:text-black hover:bg-gray-100/50"
              }`}
              aria-label="Toggle menu"
            >
              <span className={`w-5 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-1.5" : ""}`}></span>
              <span className={`w-5 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? "opacity-0" : ""}`}></span>
              <span className={`w-5 h-0.5 bg-current transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""}`}></span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className={`md:hidden border-t py-3 ${
            isDarkMode ? "border-gray-700/50" : "border-gray-200/50"
          }`}>
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-colors duration-200 ${
                    isActive(item.href)
                      ? isDarkMode 
                        ? "bg-amber-600/20 text-amber-400" 
                        : "bg-amber-400/20 text-amber-700"
                      : isDarkMode
                        ? "text-gray-400 hover:text-white hover:bg-gray-700/50"
                        : "text-gray-600 hover:text-black hover:bg-gray-100/50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
