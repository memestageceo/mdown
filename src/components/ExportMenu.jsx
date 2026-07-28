import { useEffect, useRef, useState } from 'react'
import { deckName, markdownToNotes, notesToTsv, tsvFileName } from '../lib/anki.js'
import { downloadText } from '../lib/download.js'

export function ExportMenu({ markdown, fileName }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onClick = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onClick)
    }
  }, [open])

  const exportTsv = () => {
    setOpen(false)
    const notes = markdownToNotes(markdown)
    if (!notes.length) {
      window.alert(
        'No cloze deletions found yet.\n\nSwitch to Edit, select a phrase and press Alt+C to make one.',
      )
      return
    }
    downloadText(
      tsvFileName(fileName),
      notesToTsv(notes, { deck: deckName(fileName) }),
      'text/tab-separated-values',
    )
  }

  const exportMarkdown = () => {
    setOpen(false)
    downloadText(fileName || 'notes.md', markdown, 'text/markdown')
  }

  const clozeCount = open ? markdownToNotes(markdown).length : 0

  return (
    <div className="relative" ref={ref}>
      <button
        className="cursor-pointer whitespace-nowrap rounded-[7px] border border-border bg-transparent px-3.5 py-2.5 font-sans text-[13px] font-semibold text-ink transition hover:border-accent hover:text-accent max-sm:px-[11px] max-sm:py-[9px]"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        title="Download your notes or an Anki deck"
      >
        Export
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-[calc(100%+9px)] right-0 z-10 w-[268px] max-w-[86vw] overflow-hidden rounded-[10px] border border-border bg-paper py-1.5 text-left shadow-[0_12px_34px_rgba(32,33,30,.14)]"
        >
          <button
            role="menuitem"
            className="block w-full cursor-pointer px-3.5 py-2 text-left font-sans text-[13px] text-ink hover:bg-border-2"
            onClick={exportTsv}
          >
            <span className="font-semibold">Anki deck (.tsv)</span>
            <span className="mt-px block text-[12px] text-muted-2">
              {clozeCount === 1 ? '1 cloze note' : `${clozeCount} cloze notes`} · File → Import in Anki
            </span>
          </button>
          <button
            role="menuitem"
            className="block w-full cursor-pointer px-3.5 py-2 text-left font-sans text-[13px] text-ink hover:bg-border-2"
            onClick={exportMarkdown}
          >
            <span className="font-semibold">Markdown (.md)</span>
            <span className="mt-px block text-[12px] text-muted-2">
              Your notes, cloze syntax included
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
