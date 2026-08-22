import { createContext, useContext, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import ShikiHighlighter from 'react-shiki/web'
import { remarkFrontmatterCard } from './frontmatter'

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

function CodeBlock({ code, lang }) {
  const [copied, copy] = useCopy(code)
  return (
    <div className="my-[27px] w-full max-w-full min-w-0 overflow-hidden rounded-[9px] bg-ink">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/8 bg-code-bar px-3.5 py-2 sm:flex-nowrap">
        <span className="truncate font-mono text-[11px] font-semibold tracking-[.06em] text-muted uppercase">{lang || 'text'}</span>
        <button
          className={`shrink-0 cursor-pointer rounded-[5px] px-2.25 py-1 font-sans text-[12px] font-semibold transition-colors ${copied ? 'text-accent-green' : 'text-copy-idle hover:bg-white/8 hover:text-white'}`}
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
        className="m-0 w-full max-w-full min-w-0 overflow-x-auto p-4 text-[13px] leading-[1.55] sm:p-5 sm:text-sm [&_code]:bg-transparent"
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
    <dl className="mb-9 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 rounded-[9px] border border-border bg-border-2/40 px-5 py-4 font-sans text-[13px]">
      {parsed.map(({ key, value }) => (
        <div className="contents" key={key}>
          <dt className="self-start pt-px text-[11px] font-semibold tracking-[.05em] text-muted-2 uppercase">{key}</dt>
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
        className="mr-1.5 cursor-pointer accent-accent align-middle"
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
      className="relative cursor-pointer rounded border-0 bg-code-chip px-1.25 py-px font-mono text-[0.86em] text-code-text hover:bg-code-chip-hover"
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
      <header className="grid h-17 grid-cols-[1fr_auto_1fr] items-center gap-x-3 border-b border-border bg-paper/92 px-[5vw] backdrop-blur-[8px] sticky top-0 z-[2] max-sm:grid-cols-[1fr_auto] max-sm:px-[18px]">
        <button
          className="justify-self-start flex cursor-pointer items-center gap-[9px] border-0 bg-transparent py-1 font-brand text-xl font-bold leading-none text-ink"
          onClick={() => { setMarkdown(sample); setFileName('welcome.md') }}
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
          <button
            className="cursor-pointer whitespace-nowrap rounded-[7px] border border-border bg-transparent px-3.5 py-2.5 font-sans text-[13px] font-semibold text-ink transition hover:border-accent hover:text-accent max-sm:px-[11px] max-sm:py-[9px]"
            onClick={pasteFromClipboard}
            title="Paste from clipboard (or press Ctrl+V / Cmd+V anywhere)"
          >
            Paste<span className="max-sm:hidden"> Markdown</span>
          </button>
          <button
            className="cursor-pointer whitespace-nowrap rounded-[7px] bg-ink px-3.5 py-2.5 font-sans text-[13px] font-semibold text-white transition hover:-translate-y-px hover:bg-accent max-sm:px-[11px] max-sm:py-[9px]"
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
        <article className="mx-auto max-w-[720px] font-sans text-lg leading-[1.72] max-sm:text-[17px]">
          <TaskCheckboxToggleContext.Provider value={toggleCheckbox}>
            <ReactMarkdown
              remarkPlugins={[remarkFrontmatter, remarkGfm, remarkFrontmatterCard]}
              components={{
                h1: (props) => <h1 className="mb-6.5 text-[clamp(36px,5vw,54px)] leading-[1.18] tracking-[-0.035em] text-ink-2" {...props} />,
                h2: (props) => <h2 className="mt-13 mb-3.25 text-[29px] leading-[1.18] text-ink-2" {...props} />,
                h3: (props) => <h3 className="mt-8.75 mb-2 text-[22px] leading-[1.18] text-ink-2" {...props} />,
                p: (props) => <p className="mb-5.5" {...props} />,
                ul: (props) => <ul className="mb-5.5 list-disc pl-5 marker:text-accent" {...props} />,
                ol: (props) => <ol className="mb-5.5 list-decimal pl-5 marker:text-accent" {...props} />,
                li: ({ node, children, ...props }) => {
                  const isTask = Array.isArray(node?.properties?.className) && node.properties.className.includes('task-list-item')
                  const offset = node?.position?.start?.offset
                  if (!isTask || offset == null) {
                    return <li className="pl-[3px]" {...props}>{children}</li>
                  }
                  return (
                    <TaskCheckboxOffsetContext.Provider value={offset}>
                      <li className="list-none pl-[3px]" {...props}>{children}</li>
                    </TaskCheckboxOffsetContext.Provider>
                  )
                },
                blockquote: (props) => <blockquote className="my-7.5 border-l-[3px] border-accent py-1.25 pl-5.5 text-muted-3" {...props} />,
                table: (props) => <table className="my-7 w-full border-collapse font-sans text-sm" {...props} />,
                th: (props) => <th className="border-b border-border bg-border-2 px-3 py-2.5 text-left" {...props} />,
                td: (props) => <td className="border-b border-border px-3 py-2.5 text-left" {...props} />,
                img: (props) => <img className="max-w-full rounded-[7px]" {...props} />,
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
                a({ href, children, ...props }) {
                  return (
                    <a href={href} target="_blank" rel="noreferrer" className="text-link underline decoration-1 underline-offset-[3px]" {...props}>
                      {children}
                    </a>
                  )
                },
              }}
            >{markdown}</ReactMarkdown>
          </TaskCheckboxToggleContext.Provider>
        </article>
      </section>
      <footer className="pt-5 px-[18px] pb-[38px] text-center font-sans text-[13px] leading-normal text-muted">
        Drop a <strong className="text-muted-4">.md</strong> file anywhere, paste Markdown text with <strong className="text-muted-4">Ctrl+V</strong>, or use Open Markdown. Inline code copies with a click.
      </footer>
    </main>
  )
}

export default App
