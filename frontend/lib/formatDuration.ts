/**
 * Format milliseconds to mm:ss format
 * @param durationMs - Duration in milliseconds
 * @returns Formatted duration string (e.g., "3:45")
 */
export const formatDuration = (durationMs: number): string => {
  if (!durationMs || durationMs <= 0) return "0:00"
  
  const minutes = Math.floor(durationMs / 60000)
  const seconds = Math.floor((durationMs % 60000) / 1000)
  const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds
  
  return `${minutes}:${formattedSeconds}`
}
