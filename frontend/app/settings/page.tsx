"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import { useAuth } from "@/context/AuthContext"

export default function Settings() {
  const router = useRouter()
  const { spotifyId, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !spotifyId) {
      router.push("/")
    }
  }, [spotifyId, isLoading, router])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-96">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!spotifyId) {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-8 py-16">
        <h1 className="text-5xl font-bold text-black mb-4">Settings</h1>
        <p className="text-gray-600 text-lg">Coming soon...</p>
      </div>
    </main>
  )
}
