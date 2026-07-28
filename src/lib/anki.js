// Builds a tab-separated file that Anki's built-in importer maps onto the Cloze
// note type. Requires Anki 2.1.54+ for the `#key:value` file headers (2.1.55
// makes the new import path the default).
//
// Columns are mapped positionally onto the note type's fields — column 1 to
// Text, column 2 to Back Extra. We deliberately do NOT emit a `#columns:` line:
// the stock Cloze field names are localised at runtime, so naming them would
// break the import for anyone running Anki in a non-English locale.

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { splitBlocks, slugify } from './markdown.js'

const HAS_CLOZE = /\{\{c\d+::/

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeStringify)

// One Markdown block -> the HTML that goes in Anki's Text field. Rendering to
// HTML (rather than shipping raw Markdown) keeps **bold** and `code` as
// formatting instead of literal asterisks. Cloze braces are plain text to the
// Markdown parser, so they pass through untouched.
export function blockToHtml(markdown) {
  const html = String(processor.processSync(stripLeadingMarker(markdown))).trim()
  return html
    .replace(/^<p>/, '')
    .replace(/<\/p>$/, '')
    .replace(/\n+/g, '')
    .trim()
}

// Drop the bullet or heading marker: it is list/document structure, not content.
function stripLeadingMarker(text) {
  return text
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/, '')
    .replace(/^\s*#{1,6}\s+/, '')
}

// Every block carrying at least one cloze becomes a note row.
export function markdownToNotes(source) {
  return splitBlocks(source)
    .filter((block) => !block.isCode && !block.isHeading && HAS_CLOZE.test(block.text))
    .map((block) => {
      const trail = block.headings.map((heading) => heading.text)
      return {
        text: blockToHtml(block.text),
        backExtra: trail.join(' › '),
        tags: trail.map(slugify).filter(Boolean),
      }
    })
}

// Every field is quoted unconditionally, and that is load-bearing rather than
// tidiness: Anki builds its CSV reader with `.comment(Some(b'#'))`
// (rslib/src/import_export/text/csv/import.rs), so any data line whose first
// byte is `#` is silently discarded with no import error. A note beginning with
// something like "#1 cause of death" would simply vanish. Leading with a quote
// on every row makes that impossible. Quoting also covers embedded tabs,
// newlines and quotes, which Anki reads with the usual doubling convention.
export function escapeField(value) {
  const text = String(value ?? '').replace(/\r?\n/g, '<br>').replace(/\t/g, ' ')
  return `"${text.replace(/"/g, '""')}"`
}

export function notesToTsv(notes, { deck = 'mdown' } = {}) {
  const header = [
    '#separator:tab',
    '#html:true',
    '#notetype:Cloze',
    `#deck:${deck}`,
    '#tags column:3',
  ]
  const rows = notes.map((note) =>
    [note.text, note.backExtra, note.tags.join(' ')].map(escapeField).join('\t'),
  )
  return [...header, ...rows].join('\n') + '\n'
}

export function markdownToTsv(source, options) {
  return notesToTsv(markdownToNotes(source), options)
}

// `notes.md` -> `notes.tsv`
export function tsvFileName(fileName) {
  const base = (fileName || 'mdown').replace(/\.[^.]+$/, '')
  return `${base || 'mdown'}.tsv`
}

export function deckName(fileName) {
  const base = (fileName || 'mdown').replace(/\.[^.]+$/, '')
  return base || 'mdown'
}
