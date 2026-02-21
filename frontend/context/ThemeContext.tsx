"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"

interface ThemeContextType {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    // Check localStorage first
    const storedTheme = localStorage.getItem("theme")
    
    if (storedTheme) {
      // User has a saved preference
      setIsDarkMode(storedTheme === "dark")
    } else {
      // No saved preference, use system preference
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setIsDarkMode(systemPrefersDark)
    }
    
    setIsInitialized(true)
  }, [])

  // Listen for system theme changes (only if user hasn't set a preference)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't set a preference
      const storedTheme = localStorage.getItem("theme")
      if (!storedTheme) {
        setIsDarkMode(e.matches)
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    // Save user preference to localStorage
    localStorage.setItem("theme", newMode ? "dark" : "light")
  }

  // Prevent flash of wrong theme
  if (!isInitialized) {
    return null
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
