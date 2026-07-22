import { useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ShikiHighlighter from 'react-shiki/web'
import './App.css'

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
    <div className="code-block">
      <div className="code-block-bar">
        <span className="code-block-lang">{lang || 'text'}</span>
        <button
          className={`copy-button ${copied ? 'is-copied' : ''}`}
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
        className="code-block-pre"
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
      className={`inline-code ${copied ? 'is-copied' : ''}`}
      title={copied ? '✓ Copied' : 'Click to copy'}
      aria-label={copied ? 'Copied' : `Copy ${text}`}
      onClick={copy}
    >
      <code {...props}>{children}</code>
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
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => { setMarkdown(sample); setFileName('welcome.md') }} aria-label="Show welcome document">
          <span className="brand-mark">M</span><span>mdown</span>
        </button>
        <div className="file-label"><span className="file-dot" />{fileName}</div>
        <button className="open-button" onClick={() => inputRef.current?.click()}>Open Markdown <span>↗</span></button>
        <input ref={inputRef} className="visually-hidden" type="file" accept=".md,.markdown,.mdown,.mkdn,text/markdown" onChange={(e) => openFile(e.target.files?.[0])} />
      </header>

      <section
        className={`document-frame ${isDragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); openFile(e.dataTransfer.files?.[0]) }}
      >
        <div className="drop-hint" aria-hidden={!isDragging}>Drop your Markdown file here</div>
        <article className="markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
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
                return <a href={href} target="_blank" rel="noreferrer" {...props}>{children}</a>
              },
            }}
          >{markdown}</ReactMarkdown>
        </article>
      </section>
      <footer>Drop a <strong>.md</strong> file anywhere, or use Open Markdown. Inline code copies with a click.</footer>
    </main>
  )
}

export default App
