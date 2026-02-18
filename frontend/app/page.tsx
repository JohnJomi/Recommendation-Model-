"use client"

import { useEffect, useState } from "react"

export default function Home() {
  const [message, setMessage] = useState("Connecting to backend...")

  useEffect(() => {
    fetch("http://localhost:8000/")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => {
        console.error(err)
        setMessage("Backend not reachable")
      })
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">{message}</h1>
    </main>
  )
}