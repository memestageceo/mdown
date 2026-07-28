const KEY = 'mdown:doc:v1'

export function loadDoc() {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.text !== 'string') return null
    return { text: parsed.text, fileName: parsed.fileName || 'untitled.md' }
  } catch {
    return null
  }
}

export function saveDoc(text, fileName) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ text, fileName, savedAt: Date.now() }))
  } catch {
    // Quota exceeded or storage disabled — never let persistence block typing.
  }
}

export function clearDoc() {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // Ignore: nothing useful to do if storage is unavailable.
  }
}
