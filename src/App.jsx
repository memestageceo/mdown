import { createContext, useContext, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import ShikiHighlighter from 'react-shiki/web'
import { remarkFrontmatterCard } from './frontmatter'
import { useTheme } from './theme'

// Code cards keep their own dark surface in both themes, so one code theme
// serves both; the card's background comes from `--color-code-bg` instead of
// Shiki's, which keeps it in step with the rest of the palette.
const CODE_THEME = 'github-dark'

const sample = `---
title: Welcome to Mdown
author: Mdown
tags: [markdown, viewer]
---

# Welcome to Mdown

Open a **Markdown** file from your computer, or paste Markdown text straight in, to read it in a calm, focused view.

## A few things it supports

- Tables, task lists, and strikethrough
- Syntax highlighted code blocks
- Clickable inline code, like \`npm run dev\`
- YAML frontmatter, shown above as a metadata card
- A light and a dark theme — the toggle is up in the header

- [x] Parse YAML frontmatter
- [x] Render GitHub-flavoured Markdown
- [ ] Click a checkbox below to try it

| Feature | Ready |
| --- | --- |
| GitHub-flavoured Markdown | ✅ |
| Local files | ✅ |

> Your files stay in your browser. Nothing is uploaded.

\`const greeting = 'Hello, Markdown!'\`

\`\`\`js
function openFile() {
  console.log('Pick a .md file to begin')
}
\`\`\`
`

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }
  // Fallback for non-secure contexts or browsers without the Clipboard API.
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  try {
    if (!document.execCommand('copy')) throw new Error('execCommand failed')
  } finally {
    document.body.removeChild(textarea)
  }
}

function useCopy(text) {
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

function ThemeToggle() {
  const { theme, resolved, toggle } = useTheme()
  const next = resolved === 'dark' ? 'light' : 'dark'
  const label = `Switch to ${next} theme`

  return (
    <button
      className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-[9px] border border-border bg-transparent text-muted transition hover:border-accent hover:text-accent max-sm:size-[38px]"
      onClick={toggle}
      aria-label={label}
      title={theme === 'system' ? `${label} (following your system)` : label}
    >
      {resolved === 'dark' ? (
        // Sun
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4.1" />
          <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6" />
        </svg>
      ) : (
        // Moon
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.4 13.9A8.4 8.4 0 1 1 10.1 3.6a6.6 6.6 0 0 0 10.3 10.3Z" />
        </svg>
      )}
    </button>
  )
}

// react-markdown hands each component the hast `node` plus whatever classes
// the markdown itself produced (`contains-task-list`, `language-js`, …).
// Spreading those straight onto an element leaks `node` into the DOM and lets
// the markdown class replace the styling wholesale, so elements are built
// through this helper instead: own classes first, markdown classes appended.
function mdElement(Tag, classes) {
  return function MdElement({ node: _node, className, ...props }) {
    return <Tag className={className ? `${classes} ${className}` : classes} {...props} />
  }
}

function CodeBlock({ code, lang }) {
  const [copied, copy] = useCopy(code)
  return (
    <div className="my-[27px] w-full max-w-full min-w-0 overflow-hidden rounded-[10px] border border-black/5 bg-code-bg shadow-sm dark:border-white/8 dark:shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/8 bg-code-bar px-3.5 py-2 sm:flex-nowrap">
        <span className="truncate font-mono text-[11px] font-semibold tracking-[.06em] text-code-label uppercase">{lang || 'text'}</span>
        <button
          className={`shrink-0 cursor-pointer rounded-[6px] px-2.25 py-1 font-sans text-[12px] font-semibold transition-colors ${copied ? 'text-code-green' : 'text-copy-idle hover:bg-white/10 hover:text-white'}`}
          onClick={copy}
          aria-label={copied ? 'Copied' : 'Copy code'}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <ShikiHighlighter
        language={lang || 'text'}
        theme={CODE_THEME}
        showLanguage={false}
        addDefaultStyles={false}
        className="m-0 w-full max-w-full min-w-0 overflow-x-auto p-4 text-[13px] leading-[1.55] sm:p-5 sm:text-sm [&_code]:bg-transparent [&_pre]:!bg-transparent"
      >
        {code}
      </ShikiHighlighter>
    </div>
  )
}

function FrontmatterCard({ entries }) {
  let parsed = []
  try {
    parsed = JSON.parse(entries || '[]')
  } catch {
    parsed = []
  }
  if (!parsed.length) return null
  return (
    <dl className="mb-9 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 rounded-[10px] border border-border bg-surface px-5 py-4 font-sans text-[13px]">
      {parsed.map(({ key, value }) => (
        <div className="contents" key={key}>
          <dt className="self-start pt-px text-[11px] font-semibold tracking-[.05em] text-muted uppercase">{key}</dt>
          <dd className="break-words text-ink-2">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

// Task-list checkboxes are re-derived from the markdown source on every
// render, so toggling one has to edit the source text itself rather than
// component state. The `li` for a task item knows its offset into that
// source (from remark's position info); it's threaded down to the nested
// `input` through context since react-markdown gives synthesized checkbox
// nodes no position of their own.
const TaskCheckboxOffsetContext = createContext(null)
const TaskCheckboxToggleContext = createContext(() => {})

function TaskCheckboxInput({ node: _node, ...props }) {
  const offset = useContext(TaskCheckboxOffsetContext)
  const toggle = useContext(TaskCheckboxToggleContext)
  if (props.type === 'checkbox' && offset != null) {
    return (
      <input
        type="checkbox"
        checked={!!props.checked}
        onChange={() => toggle(offset)}
        className="mr-1.5 size-[15px] cursor-pointer accent-accent align-middle"
      />
    )
  }
  return <input className="accent-accent" {...props} />
}

function toggleCheckboxAtOffset(source, offset) {
  if (offset == null || offset < 0 || offset > source.length) return source
  const lineEnd = source.indexOf('\n', offset)
  const line = source.slice(offset, lineEnd === -1 ? source.length : lineEnd)
  const match = line.match(/\[([ xX])\]/)
  if (!match) return source
  const markerIndex = offset + match.index + 1
  const nextChar = match[1] === ' ' ? 'x' : ' '
  return source.slice(0, markerIndex) + nextChar + source.slice(markerIndex + 1)
}

function InlineCode({ text, children, ...props }) {
  const [copied, copy] = useCopy(text)
  return (
    <button
      className="relative cursor-pointer rounded-[5px] border-0 bg-code-chip px-1.25 py-px font-mono text-[0.86em] text-code-text transition-colors hover:bg-code-chip-hover"
      title={copied ? '✓ Copied' : 'Click to copy'}
      aria-label={copied ? 'Copied' : `Copy ${text}`}
      onClick={copy}
    >
      <code className="[font:inherit]" {...props}>{children}</code>
      {copied && (
        <span className="animate-copied-pop absolute -top-3 -right-2.75 grid size-[17px] place-items-center rounded-full bg-accent-green font-sans text-[11px] font-bold text-white">
          ✓
        </span>
      )}
    </button>
  )
}

function App() {
  const [markdown, setMarkdown] = useState(sample)
  const [fileName, setFileName] = useState('welcome.md')
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)

  const showMarkdown = (text, name) => {
    setMarkdown(text)
    setFileName(name)
  }

  const openFile = async (file) => {
    if (!file) return
    const isMarkdown = /\.(md|markdown|mdown|mkdn)$/i.test(file.name) || file.type === 'text/markdown'
    if (!isMarkdown) {
      window.alert('Please choose a Markdown file (.md, .markdown, .mdown, or .mkdn).')
      return
    }
    showMarkdown(await file.text(), file.name)
  }

  const toggleCheckbox = (offset) => setMarkdown((prev) => toggleCheckboxAtOffset(prev, offset))

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
      const text = e.clipboardData?.getData('text/plain')
      if (text?.trim()) {
        e.preventDefault()
        pasteMarkdown(text)
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [])

  return (
    <main className="min-h-screen text-ink">
      <header className="grid h-17 grid-cols-[1fr_auto_1fr] items-center gap-x-3 border-b border-border bg-paper/85 px-[5vw] backdrop-blur-[10px] sticky top-0 z-[2] max-sm:grid-cols-[1fr_auto] max-sm:gap-x-2 max-sm:px-[14px]">
        <button
          className="justify-self-start flex cursor-pointer items-center gap-[9px] border-0 bg-transparent py-1 font-brand text-xl font-bold leading-none text-ink-2"
          onClick={() => { setMarkdown(sample); setFileName('welcome.md') }}
          aria-label="Show welcome document"
        >
          <span className="grid size-[25px] place-items-center rounded-[7px] bg-accent font-sans text-[15px] font-bold leading-none text-on-accent">M</span>
          <span>mdown</span>
        </button>
        <div className="flex max-w-[32vw] items-center gap-[7px] rounded-full border border-border bg-surface px-3 py-1 text-[13px] text-muted max-sm:hidden">
          <span className="size-[7px] shrink-0 rounded-full bg-accent-green" />
          <span className="truncate">{fileName}</span>
        </div>
        <div className="justify-self-end flex items-center gap-2 whitespace-nowrap max-sm:gap-1.5">
          <ThemeToggle />
          <button
            className="h-10 cursor-pointer whitespace-nowrap rounded-[9px] border border-border bg-transparent px-3.5 font-sans text-[13px] font-semibold text-ink transition hover:border-accent hover:text-accent max-sm:h-[38px] max-sm:px-2.5"
            onClick={pasteFromClipboard}
            title="Paste from clipboard (or press Ctrl+V / Cmd+V anywhere)"
          >
            Paste<span className="max-sm:hidden"> Markdown</span>
          </button>
          <button
            className="h-10 cursor-pointer whitespace-nowrap rounded-[9px] bg-ink px-3.5 font-sans text-[13px] font-semibold text-paper transition hover:-translate-y-px hover:bg-accent hover:text-on-accent max-sm:h-[38px] max-sm:px-2.5"
            onClick={() => inputRef.current?.click()}
          >
            Open<span className="max-sm:hidden"> Markdown</span> <span className="ml-[5px]">↗</span>
          </button>
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
        className="relative mx-auto mt-[58px] mb-[35px] max-w-[940px] px-7 max-sm:mt-[38px] max-sm:px-5"
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); openFile(e.dataTransfer.files?.[0]) }}
      >
        <div
          className={`absolute inset-0 z-[1] place-items-center rounded-[14px] border-2 border-dashed border-accent bg-paper/90 font-semibold text-accent backdrop-blur-[2px] ${isDragging ? 'grid' : 'hidden'}`}
          aria-hidden={!isDragging}
        >
          Drop your Markdown file here
        </div>
        <article className="mx-auto max-w-[720px] font-sans text-lg leading-[1.72] max-sm:text-[17px]">
          <TaskCheckboxToggleContext.Provider value={toggleCheckbox}>
            <ReactMarkdown
              remarkPlugins={[remarkFrontmatter, remarkGfm, remarkFrontmatterCard]}
              components={{
                h1: mdElement('h1', 'mb-6.5 text-[clamp(36px,5vw,54px)] leading-[1.18] font-bold tracking-[-0.035em] text-ink-2'),
                h2: mdElement('h2', 'mt-13 mb-3.25 text-[29px] leading-[1.2] font-bold tracking-[-0.02em] text-ink-2'),
                h3: mdElement('h3', 'mt-8.75 mb-2 text-[22px] leading-[1.25] font-bold tracking-[-0.01em] text-ink-2'),
                h4: mdElement('h4', 'mt-7 mb-1.5 text-[18px] leading-[1.35] font-bold text-ink-2'),
                h5: mdElement('h5', 'mt-6 mb-1.5 text-[16px] leading-[1.4] font-bold text-ink-2'),
                h6: mdElement('h6', 'mt-6 mb-1.5 text-[13px] font-bold tracking-[.06em] text-muted uppercase'),
                p: mdElement('p', 'mb-5.5'),
                // `[&_li>p]` keeps loose lists (the ones remark wraps in
                // paragraphs) from inheriting the full paragraph gap.
                ul: mdElement('ul', 'mb-5.5 list-disc space-y-2 pl-5 marker:text-accent [&_li>p]:mb-0 [&_li>p+p]:mt-3 [&_ul]:mt-2 [&_ul]:mb-0'),
                ol: mdElement('ol', 'mb-5.5 list-decimal space-y-2 pl-5 marker:font-semibold marker:text-accent [&_li>p]:mb-0 [&_li>p+p]:mt-3 [&_ol]:mt-2 [&_ol]:mb-0'),
                li: ({ node, children, className: _className, ...props }) => {
                  const isTask = Array.isArray(node?.properties?.className) && node.properties.className.includes('task-list-item')
                  const offset = node?.position?.start?.offset
                  if (!isTask || offset == null) {
                    return <li className="pl-[3px]" {...props}>{children}</li>
                  }
                  return (
                    <TaskCheckboxOffsetContext.Provider value={offset}>
                      {/* Pulled left so the checkbox lines up with the bullets of a plain list. */}
                      <li className="-ml-2.5 list-none pl-[3px]" {...props}>{children}</li>
                    </TaskCheckboxOffsetContext.Provider>
                  )
                },
                blockquote: mdElement('blockquote', 'my-7.5 rounded-r-[8px] border-l-[3px] border-accent bg-surface/70 py-3.5 pr-5 pl-5.5 text-muted [&>*:last-child]:mb-0'),
                hr: mdElement('hr', 'my-11 h-px border-0 bg-border'),
                table: ({ node: _node, className, ...props }) => (
                  <div className="my-7 w-full overflow-x-auto rounded-[10px] border border-border">
                    <table className={`w-full border-collapse font-sans text-sm [&_tr:last-child_td]:border-b-0 ${className || ''}`} {...props} />
                  </div>
                ),
                th: mdElement('th', 'border-b border-border bg-surface px-3.5 py-2.5 text-left font-semibold text-ink-2'),
                td: mdElement('td', 'border-b border-border px-3.5 py-2.5 text-left'),
                img: mdElement('img', 'max-w-full rounded-[8px] border border-border'),
                frontmattercard: FrontmatterCard,
                input: TaskCheckboxInput,
                pre({ children }) {
                  return <>{children}</>
                },
                code({ className, children, node, ...props }) {
                  const text = String(children).replace(/\n$/, '')
                  const isBlock = node?.position?.start.line !== node?.position?.end.line
                  if (isBlock) {
                    const match = /language-(\w+)/.exec(className || '')
                    return <CodeBlock code={text} lang={match?.[1]} />
                  }
                  return <InlineCode text={text} {...props}>{children}</InlineCode>
                },
                a({ href, children, node: _node, className: _className, ...props }) {
                  return (
                    <a href={href} target="_blank" rel="noreferrer" className="text-link underline decoration-1 underline-offset-[3px] transition-colors hover:decoration-2" {...props}>
                      {children}
                    </a>
                  )
                },
              }}
            >{markdown}</ReactMarkdown>
          </TaskCheckboxToggleContext.Provider>
        </article>
      </section>
      <footer className="border-t border-border pt-5 px-[18px] pb-[38px] text-center font-sans text-[13px] leading-normal text-muted">
        Drop a <strong className="font-semibold text-ink">.md</strong> file anywhere, paste Markdown text with <strong className="font-semibold text-ink">Ctrl+V</strong>, or use Open Markdown. Inline code copies with a click.
      </footer>
    </main>
  )
}

export default App
