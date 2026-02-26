/**
 * Centralized environment variable handling for API URLs
 * Eliminates hardcoded URLs across components
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export const getAuthLoginUrl = (): string => {
  return `${API_BASE_URL}/auth/login`
}

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === "production"
}

export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === "development"
}

export const isNgrokUrl = (): boolean => {
  return API_BASE_URL.includes("ngrok")
}
