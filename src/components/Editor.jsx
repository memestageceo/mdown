import { useCallback } from 'react'
import { applyEdit, planClozeEdit } from '../lib/cloze.js'

// Splice text into the textarea through execCommand so the browser's native undo
// stack survives — rewriting `value` from React state would throw it away, which
// is a real loss on a writing surface. It fires `input`, so React's onChange
// syncs state for us. `setMarkdown` is the fallback if the call is refused.
function spliceWithUndo(textarea, edit) {
  textarea.focus()
  textarea.setSelectionRange(edit.from, edit.to)
  try {
    return document.execCommand('insertText', false, edit.replacement)
  } catch {
    return false
  }
}

export function Editor({ markdown, onChange, textareaRef }) {
  const runCloze = useCallback(
    (mode) => {
      const textarea = textareaRef.current
      if (!textarea) return false

      const edit = planClozeEdit(markdown, textarea.selectionStart, textarea.selectionEnd, mode)
      if (!edit) return false

      if (!spliceWithUndo(textarea, edit)) {
        onChange(applyEdit(markdown, edit))
      }
      // Leave the answer selected so the next shortcut can act on it immediately.
      window.requestAnimationFrame(() => {
        textarea.setSelectionRange(edit.select[0], edit.select[1])
      })
      return true
    },
    [markdown, onChange, textareaRef],
  )

  const onKeyDown = (event) => {
    // Match on `code`: Option+C emits "ç" on macOS, so `key` is unreliable.
    if (event.code !== 'KeyC') return
    // Ctrl/Cmd+Shift+C is offered as an Anki-parity alias, but Chrome and Firefox
    // reserve it for Inspect Element and will usually take it first.
    const isAlias = (event.metaKey || event.ctrlKey) && event.shiftKey && !event.altKey
    if (!event.altKey && !isAlias) return
    if (event.altKey && (event.metaKey || event.ctrlKey)) return

    if (runCloze(event.shiftKey && event.altKey ? 'same' : 'new')) {
      event.preventDefault()
    }
  }

  return (
    <textarea
      ref={textareaRef}
      value={markdown}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      spellCheck="false"
      aria-label="Markdown source"
      placeholder="Write or paste your notes here, then select a phrase and press Alt+C to make it a cloze deletion."
      className="mx-auto block min-h-[62vh] w-full max-w-[720px] resize-none border-0 bg-transparent font-mono text-[15px] leading-[1.75] text-ink outline-none placeholder:text-muted max-sm:text-[14px]"
    />
  )
}
