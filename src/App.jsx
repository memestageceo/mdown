import { useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'
import './App.css'

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

function App() {
  const [markdown, setMarkdown] = useState(sample)
  const [fileName, setFileName] = useState('welcome.md')
  const [isDragging, setIsDragging] = useState(false)
  const [copied, setCopied] = useState('')
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

  const copyInlineCode = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(value)
      window.setTimeout(() => setCopied(''), 1500)
    } catch {
      window.alert('Could not copy this code. Please copy it manually.')
    }
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
            rehypePlugins={[rehypeHighlight]}
            components={{
              code({ className, children, node, ...props }) {
                const text = String(children).replace(/\n$/, '')
                const isBlock = Boolean(className) || node?.position?.start.line !== node?.position?.end.line
                if (isBlock) return <code className={className} {...props}>{children}</code>
                const didCopy = copied === text
                return <button className={`inline-code ${didCopy ? 'is-copied' : ''}`} title={didCopy ? '✓ Copied' : 'Click to copy'} aria-label={didCopy ? 'Copied' : `Copy ${text}`} onClick={() => copyInlineCode(text)}><code {...props}>{children}</code></button>
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
