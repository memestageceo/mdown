import { useCallback, useEffect, useState } from 'react'

export const THEME_STORAGE_KEY = 'mdown-theme'

// Matches the colour the header settles on in each theme, so the browser and
// OS chrome around a PWA window don't fight the page.
const THEME_COLOR = { light: '#faf9f6', dark: '#22231f' }

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

function readStored() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    // Private mode, or storage blocked entirely: fall back to the system theme.
    return null
  }
}

function writeStored(theme) {
  try {
    if (theme) localStorage.setItem(THEME_STORAGE_KEY, theme)
    else localStorage.removeItem(THEME_STORAGE_KEY)
  } catch {
    // Not being able to remember the choice shouldn't break switching it.
  }
}

function systemTheme() {
  return darkQuery().matches ? 'dark' : 'light'
}

export function applyTheme(resolved) {
  document.documentElement.dataset.theme = resolved
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[resolved])
}

/**
 * Theme state with three settings — `light`, `dark`, and `system` (the
 * default, which tracks the OS preference live). `resolved` is the concrete
 * theme currently on screen.
 */
export function useTheme() {
  const [stored, setStored] = useState(readStored)
  const [system, setSystem] = useState(systemTheme)

  useEffect(() => {
    const query = darkQuery()
    const onChange = (e) => setSystem(e.matches ? 'dark' : 'light')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const resolved = stored ?? system

  useEffect(() => {
    applyTheme(resolved)
  }, [resolved])

  const setTheme = useCallback((theme) => {
    // Choosing the theme the system already gives you hands control back to
    // the system, rather than pinning it.
    const next = theme === systemTheme() ? null : theme
    writeStored(next)
    setStored(next)
  }, [])

  const toggle = useCallback(() => {
    setTheme(resolved === 'dark' ? 'light' : 'dark')
  }, [resolved, setTheme])

  return { theme: stored ?? 'system', resolved, setTheme, toggle }
}
