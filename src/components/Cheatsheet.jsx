import { useEffect, useRef } from 'react'
import { KEYS } from '../lib/platform.js'

const rows = [
  [KEYS.cloze, 'Wrap the selection in a new cloze deletion'],
  [KEYS.clozeSame, 'Reuse the last cloze number (one card, two blanks)'],
  [KEYS.cloze, 'On an existing cloze, removes it'],
  [KEYS.paste, 'Paste Markdown into the app'],
]

export function Cheatsheet({ onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    const onClick = (event) => {
      if (!ref.current?.contains(event.target)) onClose()
    }
    window.addEventListener('keydown', onKey)
    // Deferred to the next tick so the click that opened this doesn't close it.
    const id = window.setTimeout(() => window.addEventListener('mousedown', onClick), 0)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onClick)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Keyboard shortcuts"
      className="absolute top-[calc(100%+9px)] right-0 z-10 w-[330px] max-w-[86vw] rounded-[10px] border border-border bg-paper p-4 text-left shadow-[0_12px_34px_rgba(32,33,30,.14)]"
    >
      <h2 className="mb-2.5 font-sans text-[13px] font-bold tracking-[.05em] text-muted-2 uppercase">
        Shortcuts
      </h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 font-sans text-[13px] leading-snug">
        {rows.map(([key, description]) => (
          <div key={`${key}-${description}`} className="contents">
            <dt className="whitespace-nowrap rounded-[5px] bg-code-chip px-1.5 py-px text-center font-mono text-[12px] text-code-text">
              {key}
            </dt>
            <dd className="text-muted-3">{description}</dd>
          </div>
        ))}
      </dl>
      <h2 className="mt-4 mb-1.5 font-sans text-[13px] font-bold tracking-[.05em] text-muted-2 uppercase">
        Into Anki
      </h2>
      <p className="font-sans text-[13px] leading-snug text-muted-3">
        Export <strong className="text-muted-4">Anki deck (.tsv)</strong>, then in Anki choose{' '}
        <strong className="text-muted-4">File → Import</strong>. The note type, deck and tags are set
        by the file. Needs Anki 2.1.54 or newer.
      </p>
    </div>
  )
}
