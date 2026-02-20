"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface Track {
  id: string;
  title: string;
  artist: string;
  release_year: number;
  duration_ms: number;
}

const formatDuration = (duration_ms?: number): string => {
  if (duration_ms === undefined) return "-";
  const minutes = Math.floor(duration_ms / 60000);
  const seconds = ((duration_ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${parseInt(seconds) < 10 ? "0" : ""}${seconds}`;
};

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const spotifyId = searchParams.get("spotify_id");

  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [tracksLoading, setTracksLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!spotifyId) {
      setTracksLoading(false);
      return;
    }

    const fetchTopTracks = async () => {
      try {
        setTracksLoading(true);
        const response = await fetch(
          `http://localhost:8000/tracks/top?spotify_id=${spotifyId}`
        );
        if (!response.ok) throw new Error("Failed to fetch top tracks");
        const data = await response.json();
        setTopTracks(data);
        setError("");
      } catch (err) {
        setError("Could not load top tracks");
        console.error(err);
      } finally {
        setTracksLoading(false);
      }
    };

    fetchTopTracks();
  }, [spotifyId]);

  const handleGetRecommendations = async () => {
    if (!spotifyId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8000/recommendations?spotify_id=${spotifyId}`
      );
      if (!response.ok) throw new Error("Failed to fetch recommendations");
      const data = await response.json();
      setRecommendations(data);
      setError("");
    } catch (err) {
      setError("Could not load recommendations");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!spotifyId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-black mb-4">Dashboard</h1>
          <p className="text-lg text-gray-600">No Spotify ID found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-5xl font-bold text-black mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-12">
          Logged in as:{" "}
          <span className="font-mono text-gray-800">{spotifyId}</span>
        </p>

        {error && <p className="text-red-600 mb-6">{error}</p>}

        {/* Top Tracks Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-black mb-6">Your Top Tracks</h2>
          {tracksLoading ? (
            <p className="text-gray-600">Loading tracks...</p>
          ) : topTracks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-3 px-4 font-semibold text-black">#</th>
                    <th className="text-left py-3 px-4 font-semibold text-black">Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-black">Artist</th>
                    <th className="text-left py-3 px-4 font-semibold text-black">Release Year</th>
                    <th className="text-left py-3 px-4 font-semibold text-black">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {topTracks.map((track, index) => {
                    const duration = formatDuration(track.duration_ms);

                    return (
                      <tr
                        key={track.id ?? index}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-600">{index + 1}</td>
                        <td className="py-3 px-4 text-black font-medium">{track.title}</td>
                        <td className="py-3 px-4 text-gray-700">{track.artist}</td>
                        <td className="py-3 px-4 text-gray-700">{track.release_year ?? "-"}</td>
                        <td className="py-3 px-4 text-gray-700">{duration}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No top tracks found.</p>
          )}
        </section>

        {/* Recommendations Section */}
        <section>
          <button
            onClick={handleGetRecommendations}
            disabled={loading}
            className="mb-6 px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 transition-colors disabled:bg-gray-400"
          >
            {loading ? "Loading..." : "Get AI Recommendations"}
          </button>

          {recommendations.length > 0 && (
            <div>
              <h2 className="text-3xl font-bold text-black mb-6">
                Recommendations
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-3 px-4 font-semibold text-black">#</th>
                      <th className="text-left py-3 px-4 font-semibold text-black">Title</th>
                      <th className="text-left py-3 px-4 font-semibold text-black">Artist</th>
                      <th className="text-left py-3 px-4 font-semibold text-black">Release Year</th>
                      <th className="text-left py-3 px-4 font-semibold text-black">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recommendations.map((track, index) => {
                      const duration = formatDuration(track.duration_ms);

                      return (
                        <tr
                          key={track.id ?? index}
                          className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-4 text-gray-600">{index + 1}</td>
                          <td className="py-3 px-4 text-black font-medium">{track.title}</td>
                          <td className="py-3 px-4 text-gray-700">{track.artist}</td>
                          <td className="py-3 px-4 text-gray-700">{track.release_year ?? "-"}</td>
                          <td className="py-3 px-4 text-gray-700">{duration}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
