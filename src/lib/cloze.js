// Anki cloze-deletion syntax: {{c1::answer}} or {{c1::answer::hint}}.
//
// Numbering is scoped to the block the cursor sits in, because one block becomes
// one Anki note and Anki restarts numbering per note. Reusing a number within a
// note groups those blanks onto a single card.

import { blockAt } from './markdown.js'

export const CLOZE_OPEN = /\{\{c(\d+)::/g
const WORD = /[\p{L}\p{N}'’-]/u

// Every cloze span in `text`, with nesting resolved by brace matching.
export function findClozes(text) {
  const found = []
  const re = /\{\{c(\d+)::/g
  let match
  while ((match = re.exec(text))) {
    const end = matchClosing(text, match.index + match[0].length)
    if (end === -1) continue
    const body = text.slice(match.index + match[0].length, end)
    const hintAt = topLevelHint(body)
    found.push({
      start: match.index,
      end: end + 2,
      number: Number(match[1]),
      answer: hintAt === -1 ? body : body.slice(0, hintAt),
      hint: hintAt === -1 ? null : body.slice(hintAt + 2),
    })
  }
  return found
}

// Index of the `}}` that closes a cloze opened before `from`, or -1.
function matchClosing(text, from) {
  let depth = 0
  for (let i = from; i < text.length - 1; i += 1) {
    if (text[i] === '{' && text[i + 1] === '{') {
      depth += 1
      i += 1
    } else if (text[i] === '}' && text[i + 1] === '}') {
      if (depth === 0) return i
      depth -= 1
      i += 1
    }
  }
  return -1
}

// `::` separating answer from hint, ignoring any inside a nested cloze.
function topLevelHint(body) {
  let depth = 0
  for (let i = 0; i < body.length - 1; i += 1) {
    if (body[i] === '{' && body[i + 1] === '{') {
      depth += 1
      i += 1
    } else if (body[i] === '}' && body[i + 1] === '}') {
      depth -= 1
      i += 1
    } else if (depth === 0 && body[i] === ':' && body[i + 1] === ':') {
      return i
    }
  }
  return -1
}

export function highestNumber(text) {
  return findClozes(text).reduce((max, cloze) => Math.max(max, cloze.number), 0)
}

// Grow an empty selection to the word under the caret.
export function expandToWord(source, start, end) {
  if (start !== end) return [start, end]
  let from = start
  let to = end
  while (from > 0 && WORD.test(source[from - 1])) from -= 1
  while (to < source.length && WORD.test(source[to])) to += 1
  return [from, to]
}

// A cloze fully containing the selection — the thing Alt+C should remove.
function enclosingCloze(source, block, start, end) {
  return findClozes(block.text)
    .map((cloze) => ({ ...cloze, start: cloze.start + block.start, end: cloze.end + block.start }))
    .filter((cloze) => start >= cloze.start && end <= cloze.end)
    .sort((a, b) => b.start - a.start)[0] ?? null
}

/**
 * Work out the edit for a cloze keystroke, without touching the DOM.
 *
 * Returns { from, to, replacement, select } describing a splice of `source`,
 * where `select` is the offsets to leave highlighted afterwards (relative to the
 * document once the splice is applied). Returns null when there is nothing to do.
 *
 * `mode` is 'new' (next number in this note) or 'same' (reuse the last number).
 */
export function planClozeEdit(source, selectionStart, selectionEnd, mode = 'new') {
  const block = blockAt(source, selectionStart)
  if (!block || block.isCode) return null

  let start = Math.min(selectionStart, selectionEnd)
  let end = Math.max(selectionStart, selectionEnd)
  // A selection running past the block is a selection spanning two notes.
  if (end > block.end) return null

  // Double-clicking a word includes the trailing space in most browsers; keep it
  // out of the cloze so the answer text is exactly what was meant.
  while (start < end && /\s/.test(source[start])) start += 1
  while (end > start && /\s/.test(source[end - 1])) end -= 1

  const existing = enclosingCloze(source, block, start, end)
  if (existing) {
    const inner = existing.hint === null ? existing.answer : `${existing.answer}::${existing.hint}`
    return {
      from: existing.start,
      to: existing.end,
      replacement: inner,
      select: [existing.start, existing.start + inner.length],
    }
  }

  const [from, to] = expandToWord(source, start, end)
  // A selection that clips part of a neighbouring cloze would nest the markers
  // and corrupt both. Refuse rather than produce something unparseable.
  if (/\{\{c\d+::|\}\}/.test(source.slice(from, to))) return null

  const highest = highestNumber(block.text)
  const number = mode === 'same' ? Math.max(highest, 1) : highest + 1
  const answer = source.slice(from, to)
  const replacement = `{{c${number}::${answer}}}`
  const answerAt = from + `{{c${number}::`.length
  return { from, to, replacement, select: [answerAt, answerAt + answer.length] }
}

export function applyEdit(source, edit) {
  return source.slice(0, edit.from) + edit.replacement + source.slice(edit.to)
}
