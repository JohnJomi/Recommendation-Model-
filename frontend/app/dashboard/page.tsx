"use client";

import { useSearchParams } from "next/navigation";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const spotifyId = searchParams.get("spotify_id");

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-8 text-gray-900">Dashboard</h1>

        {spotifyId ? (
          <p className="text-lg text-gray-700">
            Logged in as Spotify ID:{" "}
            <span className="font-mono bg-gray-200 px-3 py-1 rounded text-gray-900">
              {spotifyId}
            </span>
          </p>
        ) : (
          <p className="text-lg text-red-600 font-semibold">
            No Spotify ID found.
          </p>
        )}
      </div>
    </div>
  );
}
