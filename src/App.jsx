import { useEffect, useRef, useState } from 'react'
import { Editor } from './components/Editor.jsx'
import { Preview } from './components/Preview.jsx'
import { ExportMenu } from './components/ExportMenu.jsx'
import { Cheatsheet } from './components/Cheatsheet.jsx'
import { loadDoc, saveDoc } from './lib/storage.js'
import { KEYS } from './lib/platform.js'

const sample = `# Welcome to Mdown

Open a **Markdown** file from your computer, or paste Markdown text straight in, to read it in a calm, focused view.

## A few things it supports

- Tables, task lists, and strikethrough
- Syntax highlighted code blocks
- Clickable inline code, like \`npm run dev\`

| Feature | Ready |
| --- | --- |
| GitHub-flavoured Markdown | ✅ |
| Local files | ✅ |

> Your files stay in your browser. Nothing is uploaded.

## Making flashcards

Switch to **Edit**, select a phrase, and press **${KEYS.cloze}** to hide it behind a cloze deletion.

The {{c1::mitochondria}} is the powerhouse of the {{c2::cell}}.

Then use **Export → Anki deck (.tsv)** and import the file into Anki with File → Import.

\`\`\`js
function openFile() {
  console.log('Pick a .md file to begin')
}
\`\`\`
`

function App() {
  // Lazy initialiser rather than an effect: StrictMode-safe by construction, and
  // it avoids a flash of the welcome document before the saved one loads.
  const [doc, setDoc] = useState(() => loadDoc() ?? { text: sample, fileName: 'welcome.md' })
  const [mode, setMode] = useState('preview')
  const [isDragging, setIsDragging] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const inputRef = useRef(null)
  const textareaRef = useRef(null)
  const modeRef = useRef(mode)

  const { text: markdown, fileName } = doc
  const isEditing = mode === 'edit'
  modeRef.current = mode

  const showMarkdown = (text, name) => setDoc({ text, fileName: name })
  const setMarkdown = (text) => setDoc((current) => ({ ...current, text }))

  const openFile = async (file) => {
    if (!file) return
    const isMarkdown = /\.(md|markdown|mdown|mkdn)$/i.test(file.name) || file.type === 'text/markdown'
    if (!isMarkdown) {
      window.alert('Please choose a Markdown file (.md, .markdown, .mdown, or .mkdn).')
      return
    }
    showMarkdown(await file.text(), file.name)
  }

  const pasteMarkdown = (text) => {
    if (!text?.trim()) return
    showMarkdown(text, 'pasted.md')
  }

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (!text.trim()) {
        window.alert('Your clipboard is empty.')
        return
      }
      pasteMarkdown(text)
    } catch {
      window.alert('Could not read the clipboard. Try pressing Ctrl+V (or Cmd+V) anywhere on the page instead.')
    }
  }

  useEffect(() => {
    const handlePaste = (e) => {
      // In edit mode the textarea owns paste — replacing the whole document
      // would throw away whatever is already being written.
      if (modeRef.current === 'edit') return
      const text = e.clipboardData?.getData('text/plain')
      if (text?.trim()) {
        e.preventDefault()
        pasteMarkdown(text)
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [])

  useEffect(() => {
    if (markdown === sample) return undefined
    const id = window.setTimeout(() => saveDoc(markdown, fileName), 400)
    return () => window.clearTimeout(id)
  }, [markdown, fileName])

  return (
    <main className="min-h-screen text-ink">
      <header className="grid h-17 grid-cols-[1fr_auto_1fr] items-center gap-x-3 border-b border-border bg-paper/92 px-[5vw] backdrop-blur-[8px] sticky top-0 z-[2] max-sm:grid-cols-[1fr_auto] max-sm:px-[18px]">
        <button
          className="justify-self-start flex cursor-pointer items-center gap-[9px] border-0 bg-transparent py-1 font-brand text-xl font-bold leading-none text-ink"
          onClick={() => showMarkdown(sample, 'welcome.md')}
          aria-label="Show welcome document"
        >
          <span className="grid size-[25px] place-items-center rounded-[7px] bg-accent font-sans text-[15px] font-bold leading-none text-white">M</span>
          <span>mdown</span>
        </button>
        <div className="max-w-[32vw] truncate text-[13px] text-muted-2 max-sm:hidden">
          <span className="mr-[7px] inline-block size-[7px] rounded-full bg-accent-green" />
          {fileName}
        </div>
        <div className="justify-self-end flex items-center gap-2 whitespace-nowrap">
          <div className="flex items-center rounded-[7px] border border-border p-[3px]" role="group" aria-label="View mode">
            {['edit', 'preview'].map((value) => (
              <button
                key={value}
                className={`cursor-pointer rounded-[5px] px-2.5 py-1.5 font-sans text-[13px] font-semibold capitalize transition ${mode === value ? 'bg-ink text-white' : 'bg-transparent text-muted-2 hover:text-ink'}`}
                onClick={() => setMode(value)}
                aria-pressed={mode === value}
              >
                {value}
              </button>
            ))}
          </div>
          <ExportMenu markdown={markdown} fileName={fileName} />
          <button
            className="cursor-pointer whitespace-nowrap rounded-[7px] border border-border bg-transparent px-3.5 py-2.5 font-sans text-[13px] font-semibold text-ink transition hover:border-accent hover:text-accent max-sm:hidden"
            onClick={pasteFromClipboard}
            title={`Paste from clipboard (or press ${KEYS.paste} anywhere)`}
          >
            Paste
          </button>
          <button
            className="cursor-pointer whitespace-nowrap rounded-[7px] bg-ink px-3.5 py-2.5 font-sans text-[13px] font-semibold text-white transition hover:-translate-y-px hover:bg-accent max-sm:hidden"
            onClick={() => inputRef.current?.click()}
          >
            Open <span className="ml-[5px]">↗</span>
          </button>
          <div className="relative">
            <button
              className="grid size-[34px] cursor-pointer place-items-center rounded-full border border-border bg-transparent font-sans text-[13px] font-bold text-muted-2 transition hover:border-accent hover:text-accent"
              onClick={() => setShowHelp((value) => !value)}
              aria-expanded={showHelp}
              aria-label="Keyboard shortcuts"
            >
              ?
            </button>
            {showHelp && <Cheatsheet onClose={() => setShowHelp(false)} />}
          </div>
        </div>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept=".md,.markdown,.mdown,.mkdn,text/markdown"
          onChange={(e) => openFile(e.target.files?.[0])}
        />
      </header>

      <section
        className={`relative mx-auto mt-[58px] mb-[35px] max-w-[940px] px-7 max-sm:mt-[38px] max-sm:px-5 ${isDragging ? 'outline-2 outline-dashed outline-accent outline-offset-8' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); openFile(e.dataTransfer.files?.[0]) }}
      >
        <div
          className={`absolute inset-0 z-[1] place-items-center bg-white/85 font-bold text-accent ${isDragging ? 'grid' : 'hidden'}`}
          aria-hidden={!isDragging}
        >
          Drop your Markdown file here
        </div>
        {isEditing ? (
          <Editor markdown={markdown} onChange={setMarkdown} textareaRef={textareaRef} />
        ) : (
          <Preview markdown={markdown} />
        )}
      </section>
      <footer className="pt-5 px-[18px] pb-[38px] text-center font-sans text-[13px] leading-normal text-muted">
        {isEditing ? (
          <>
            Select a phrase and press <strong className="text-muted-4">{KEYS.cloze}</strong> to make a
            cloze deletion, or <strong className="text-muted-4">{KEYS.clozeSame}</strong> to reuse the
            last number. Export an Anki deck when you are done.
          </>
        ) : (
          <>
            Drop a <strong className="text-muted-4">.md</strong> file anywhere, paste Markdown text with{' '}
            <strong className="text-muted-4">{KEYS.paste}</strong>, or use Open. Inline code copies with
            a click.
          </>
        )}
      </footer>
    </main>
  )
}

export default App
