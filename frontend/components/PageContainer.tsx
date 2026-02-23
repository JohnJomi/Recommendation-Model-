import { ReactNode } from "react"

interface PageContainerProps {
  isDarkMode: boolean
  children: ReactNode
}

export default function PageContainer({ isDarkMode, children }: PageContainerProps) {
  return (
    <main
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50"
      }`}
    >
      <div className="max-w-7xl mx-auto px-8 pt-24 pb-16">
        {children}
      </div>
    </main>
  )
}
