import { useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ShikiHighlighter from 'react-shiki/web'

const CODE_THEME = 'github-dark'

const sample = `# Welcome to Mdown

Open any **Markdown** file from your computer to read it in a calm, focused view.

## A few things it supports

- Tables, task lists, and strikethrough
- Syntax highlighted code blocks
- Clickable inline code, like \`npm run dev\`

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

  const openFile = async (file) => {
    if (!file) return
    const isMarkdown = /\.(md|markdown|mdown|mkdn)$/i.test(file.name) || file.type === 'text/markdown'
    if (!isMarkdown) {
      window.alert('Please choose a Markdown file (.md, .markdown, .mdown, or .mkdn).')
      return
    }
    setMarkdown(await file.text())
    setFileName(file.name)
  }

  return (
    <main className="min-h-screen text-ink">
      <header className="grid h-17 grid-cols-[1fr_auto_1fr] items-center border-b border-border bg-paper/92 px-[5vw] backdrop-blur-[8px] sticky top-0 z-[2] max-sm:grid-cols-[1fr_auto] max-sm:px-[18px]">
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
        <button
          className="justify-self-end cursor-pointer rounded-[7px] bg-ink px-3.5 py-2.5 font-sans text-[13px] font-semibold text-white transition hover:-translate-y-px hover:bg-accent max-sm:px-[11px] max-sm:py-[9px]"
          onClick={() => inputRef.current?.click()}
        >
          Open Markdown <span className="ml-[5px]">↗</span>
        </button>
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
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: (props) => <h1 className="mb-6.5 text-[clamp(36px,5vw,54px)] leading-[1.18] tracking-[-0.035em] text-ink-2" {...props} />,
              h2: (props) => <h2 className="mt-13 mb-3.25 text-[29px] leading-[1.18] text-ink-2" {...props} />,
              h3: (props) => <h3 className="mt-8.75 mb-2 text-[22px] leading-[1.18] text-ink-2" {...props} />,
              p: (props) => <p className="mb-5.5" {...props} />,
              ul: (props) => <ul className="mb-5.5 list-disc pl-5 marker:text-accent" {...props} />,
              ol: (props) => <ol className="mb-5.5 list-decimal pl-5 marker:text-accent" {...props} />,
              li: (props) => <li className="pl-[3px]" {...props} />,
              blockquote: (props) => <blockquote className="my-7.5 border-l-[3px] border-accent py-1.25 pl-5.5 text-muted-3" {...props} />,
              table: (props) => <table className="my-7 w-full border-collapse font-sans text-sm" {...props} />,
              th: (props) => <th className="border-b border-border bg-border-2 px-3 py-2.5 text-left" {...props} />,
              td: (props) => <td className="border-b border-border px-3 py-2.5 text-left" {...props} />,
              img: (props) => <img className="max-w-full rounded-[7px]" {...props} />,
              input: (props) => <input className="accent-accent" {...props} />,
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
        </article>
      </section>
      <footer className="pt-5 px-[18px] pb-[38px] text-center font-sans text-[13px] leading-normal text-muted">
        Drop a <strong className="text-muted-4">.md</strong> file anywhere, or use Open Markdown. Inline code copies with a click.
      </footer>
    </main>
  )
}

export default App
