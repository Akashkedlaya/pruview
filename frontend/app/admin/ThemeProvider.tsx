'use client'

import { createContext, useContext, useCallback, useState } from 'react'

export type Theme = 'light' | 'dark' | 'warm'

const ThemeContext = createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
} | null>(null)

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export default function ThemeProvider({
  initialTheme,
  fontVariable,
  children,
}: {
  initialTheme: Theme
  fontVariable: string
  children: React.ReactNode
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme)

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    document.cookie = `pv-theme=${next}; path=/; max-age=31536000; samesite=lax`
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div data-theme={theme} className={`${fontVariable} pv-admin antialiased min-h-screen`}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}
