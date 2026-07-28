import { useRef, useState } from 'react'
import { copyText } from '../lib/clipboard.js'

export function useCopy(text) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef(null)

  const copy = async () => {
    try {
      await copyText(text)
      setCopied(true)
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(() => setCopied(false), 1500)
    } catch {
      window.alert('Could not copy this code. Please copy it manually.')
    }
  }

  return [copied, copy]
}
