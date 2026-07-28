import { useCopy } from '../hooks/useCopy.js'

export function InlineCode({ text, children, ...props }) {
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
