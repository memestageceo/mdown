import { dump, load } from 'js-yaml'

function formatValue(value) {
  if (Array.isArray(value)) return value.map(formatValue).join(', ')
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return dump(value).trim()
  return String(value)
}

// Turns a parsed `yaml` frontmatter node into a `frontmattercard` hast node
// (via hName/hProperties) so it can be rendered with a dedicated component
// instead of being silently dropped by remark-rehype.
export function remarkFrontmatterCard() {
  return (tree) => {
    tree.children = tree.children.filter((node) => {
      if (node.type !== 'yaml') return true

      let entries = []
      try {
        const parsed = load(node.value)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          entries = Object.entries(parsed).map(([key, value]) => ({ key, value: formatValue(value) }))
        }
      } catch {
        entries = []
      }

      if (!entries.length) return false
      // mdast-util-to-hast has a built-in handler that unconditionally drops
      // `yaml` nodes, ignoring hName/hProperties. Retype the node so it falls
      // through to the default (unknown-node) handler instead, which honors them.
      // hast property values that are arrays get joined into a string (they're
      // modeled after space/comma-separated HTML attributes like `class`), so
      // the entries are passed through as JSON rather than as a real array.
      node.type = 'frontmatterCard'
      node.data = { hName: 'frontmattercard', hProperties: { entries: JSON.stringify(entries) } }
      return true
    })
  }
}
