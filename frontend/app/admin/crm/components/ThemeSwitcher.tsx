'use client'

import { useState } from 'react'
import { useTheme, type Theme } from '../../ThemeProvider'

const THEMES: { key: Theme; label: string; swatch: [string, string] }[] = [
  { key: 'light', label: 'Light', swatch: ['#F7F7F7', '#2B8EC4'] },
  { key: 'dark', label: 'Dark', swatch: ['#0F1A2C', '#60A5FA'] },
  { key: 'warm', label: 'Warm', swatch: ['#EDE8D0', '#2B8EC4'] },
]

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const current = THEMES.find(t => t.key === theme) ?? THEMES[0]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border border-[var(--pv-border)] text-[var(--pv-muted)] hover:text-[var(--pv-text)] hover:bg-[var(--pv-accent-tint-hover)] transition-all"
      >
        <span
          className="w-3.5 h-3.5 rounded-full border border-[var(--pv-border)] flex-shrink-0"
          style={{ background: current.swatch[1] }}
        />
        Theme
        <span className="ml-auto text-[var(--pv-muted)]">{current.label}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-2 w-full min-w-[10rem] bg-[var(--pv-card)] border border-[var(--pv-border)] rounded-xl shadow-lg overflow-hidden z-50">
            {THEMES.map(t => (
              <button
                key={t.key}
                onClick={() => { setTheme(t.key); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-[var(--pv-accent-tint-hover)] transition-all ${
                  theme === t.key ? 'font-semibold text-[var(--pv-accent)]' : 'text-[var(--pv-text)]'
                }`}
              >
                <span className="flex rounded-full overflow-hidden w-4 h-4 border border-[var(--pv-border)] flex-shrink-0">
                  <span className="w-1/2 h-full" style={{ background: t.swatch[0] }} />
                  <span className="w-1/2 h-full" style={{ background: t.swatch[1] }} />
                </span>
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
