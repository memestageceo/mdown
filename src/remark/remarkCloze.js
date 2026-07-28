// Turns Anki cloze syntax into styled spans in the preview.
//
// The walk only ever splits `text` nodes. That is what keeps cloze syntax inside
// fenced blocks and inline code rendering literally — mdast holds those as
// `code` / `inlineCode` nodes, which carry their value out of band and are never
// visited here.
//
// Unknown node types are given `data.hName` / `data.hProperties`, which
// mdast-util-to-hast honours when it has no handler registered for a type.

const CLOZE = /\{\{c(\d+)::([\s\S]*?)(?:::([\s\S]*?))?\}\}/g

export default function remarkCloze() {
  return (tree) => visit(tree)
}

function visit(node) {
  if (!Array.isArray(node.children)) return
  const next = []
  let changed = false

  for (const child of node.children) {
    if (child.type === 'text') {
      const parts = split(child.value)
      if (parts) {
        next.push(...parts)
        changed = true
        continue
      }
    } else {
      visit(child)
    }
    next.push(child)
  }

  if (changed) node.children = next
}

function split(value) {
  CLOZE.lastIndex = 0
  if (!CLOZE.test(value)) return null
  CLOZE.lastIndex = 0

  const parts = []
  let cursor = 0
  let match

  while ((match = CLOZE.exec(value))) {
    if (match.index > cursor) parts.push({ type: 'text', value: value.slice(cursor, match.index) })
    parts.push(clozeNode(match[1], match[2], match[3]))
    cursor = match.index + match[0].length
  }
  if (cursor < value.length) parts.push({ type: 'text', value: value.slice(cursor) })
  return parts
}

function clozeNode(number, answer, hint) {
  const properties = { className: ['cloze'], 'data-cloze': number }
  if (hint !== undefined) properties['data-hint'] = hint
  return {
    type: 'cloze',
    children: [{ type: 'text', value: answer }],
    data: { hName: 'span', hProperties: properties },
  }
}
