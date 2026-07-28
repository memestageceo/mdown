import ShikiHighlighter from 'react-shiki/web'
import { useCopy } from '../hooks/useCopy.js'

const CODE_THEME = 'github-dark'

export function CodeBlock({ code, lang }) {
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
