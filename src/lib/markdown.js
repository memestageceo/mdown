// Pure helpers for slicing a Markdown document into the units that become Anki notes.
//
// A "block" here is one Anki note. Blocks are separated by blank lines, except
// that a list is broken up further so each item is its own note — a bullet list
// of facts should not collapse into a single card.

const FENCE = /^\s{0,3}(`{3,}|~{3,})/
const HEADING = /^(#{1,6})\s+(.*)$/
const LIST_ITEM = /^(\s*)(?:[-*+]|\d+[.)])\s+/

// Splits into fenced-code and prose runs so callers never treat code as note text.
// Returns [{ type: 'code' | 'prose', start, end }] with offsets into `source`.
export function splitFences(source) {
  const lines = source.split('\n')
  const runs = []
  let offset = 0
  let runStart = 0
  let runType = 'prose'
  let closing = null

  const push = (end) => {
    if (end > runStart) runs.push({ type: runType, start: runStart, end })
  }

  for (const line of lines) {
    const lineEnd = offset + line.length
    if (closing) {
      if (line.trimStart().startsWith(closing)) {
        push(lineEnd)
        runStart = Math.min(lineEnd + 1, source.length)
        runType = 'prose'
        closing = null
      }
    } else {
      const fence = FENCE.exec(line)
      if (fence) {
        push(offset)
        runStart = offset
        runType = 'code'
        closing = fence[1]
      }
    }
    offset = lineEnd + 1
  }
  push(source.length)
  return runs
}

// Every block in the document, in order, each with the heading trail above it.
// Offsets are absolute into `source` so the editor can map a cursor onto a block.
export function splitBlocks(source) {
  const blocks = []
  const headings = []

  for (const run of splitFences(source)) {
    if (run.type === 'code') {
      blocks.push({
        text: source.slice(run.start, run.end),
        start: run.start,
        end: run.end,
        isCode: true,
        headings: [...headings],
      })
      continue
    }

    const prose = source.slice(run.start, run.end)
    // Blank lines separate blocks; keep the offset arithmetic anchored to `run.start`.
    for (const chunk of scanChunks(prose, run.start)) {
      const heading = HEADING.exec(chunk.text.trim())
      if (heading) {
        const level = heading[1].length
        while (headings.length && headings[headings.length - 1].level >= level) headings.pop()
        headings.push({ level, text: heading[2].trim() })
        blocks.push({ ...chunk, isCode: false, isHeading: true, headings: [...headings] })
        continue
      }
      for (const item of splitListItems(chunk)) {
        blocks.push({ ...item, isCode: false, isHeading: false, headings: [...headings] })
      }
    }
  }

  return blocks
}

function scanChunks(text, base) {
  const chunks = []
  const re = /\n[ \t]*\n/g
  let cursor = 0
  let match
  while ((match = re.exec(text))) {
    chunks.push(makeChunk(text, base, cursor, match.index))
    cursor = match.index + match[0].length
  }
  chunks.push(makeChunk(text, base, cursor, text.length))
  return chunks.filter((chunk) => chunk && chunk.text.trim())
}

function makeChunk(text, base, from, to) {
  const raw = text.slice(from, to)
  if (!raw.trim()) return null
  // Trim surrounding blank space but keep offsets pointing at the real characters.
  const lead = raw.length - raw.trimStart().length
  const tail = raw.length - raw.trimEnd().length
  return {
    text: raw.slice(lead, raw.length - tail),
    start: base + from + lead,
    end: base + to - tail,
  }
}

// A list block becomes one note per item. Anything else passes through untouched.
function splitListItems(chunk) {
  const lines = chunk.text.split('\n')
  if (!lines.some((line) => LIST_ITEM.test(line))) return [chunk]

  const items = []
  let current = null
  let offset = chunk.start

  for (const line of lines) {
    if (LIST_ITEM.test(line)) {
      if (current) items.push(finishItem(current))
      current = { lines: [line], start: offset }
    } else if (current) {
      current.lines.push(line)
    } else {
      // Text before the first bullet (e.g. a lead-in line) stays its own note.
      items.push({ text: line, start: offset, end: offset + line.length })
    }
    offset += line.length + 1
  }
  if (current) items.push(finishItem(current))
  return items.filter((item) => item.text.trim())
}

function finishItem(current) {
  const text = current.lines.join('\n')
  const trimmed = text.trimEnd()
  return { text: trimmed, start: current.start, end: current.start + trimmed.length }
}

// The block containing `offset`. Used to scope cloze numbering to one note.
export function blockAt(source, offset) {
  const blocks = splitBlocks(source)
  return (
    blocks.find((block) => offset >= block.start && offset <= block.end) ??
    blocks.find((block) => offset < block.start) ??
    null
  )
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[`*_~[\]()#]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
