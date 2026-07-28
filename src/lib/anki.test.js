import { describe, expect, it } from 'vitest'
import { blockToHtml, escapeField, markdownToNotes, markdownToTsv, notesToTsv, tsvFileName } from './anki.js'

describe('blockToHtml', () => {
  it('renders inline markdown and unwraps the paragraph', () => {
    expect(blockToHtml('The **powerhouse** of the cell.')).toBe(
      'The <strong>powerhouse</strong> of the cell.',
    )
  })

  it('leaves cloze syntax untouched', () => {
    expect(blockToHtml('A {{c1::fact}} here')).toBe('A {{c1::fact}} here')
  })

  it('strips the list marker', () => {
    expect(blockToHtml('- a bullet')).toBe('a bullet')
  })

  it('renders inline code', () => {
    expect(blockToHtml('run `npm test`')).toBe('run <code>npm test</code>')
  })
})

describe('markdownToNotes', () => {
  it('keeps only blocks that contain a cloze', () => {
    const notes = markdownToNotes('Plain paragraph.\n\nA {{c1::clozed}} one.')
    expect(notes).toHaveLength(1)
    expect(notes[0].text).toBe('A {{c1::clozed}} one.')
  })

  it('derives back extra and tags from the heading trail', () => {
    const [note] = markdownToNotes('# Biology\n\n## Cell structure\n\nThe {{c1::mitochondria}}.')
    expect(note.backExtra).toBe('Biology › Cell structure')
    expect(note.tags).toEqual(['biology', 'cell-structure'])
  })

  it('ignores cloze syntax inside a fenced code block', () => {
    expect(markdownToNotes('```\n{{c1::not a card}}\n```')).toEqual([])
  })

  it('ignores a clozed heading', () => {
    expect(markdownToNotes('# A {{c1::heading}}')).toEqual([])
  })

  it('emits one note per list item', () => {
    const notes = markdownToNotes('- {{c1::alpha}} one\n- {{c1::beta}} two')
    expect(notes.map((note) => note.text)).toEqual(['{{c1::alpha}} one', '{{c1::beta}} two'])
  })
})

describe('escapeField', () => {
  it('quotes unconditionally', () => {
    expect(escapeField('plain')).toBe('"plain"')
  })

  it('flattens a tab to a space so it cannot split the row', () => {
    expect(escapeField('a\tb')).toBe('"a b"')
  })

  it('doubles internal quotes', () => {
    expect(escapeField('say "hi"')).toBe('"say ""hi"""')
  })

  it('turns a newline into a line break Anki renders', () => {
    expect(escapeField('a\nb')).toBe('"a<br>b"')
  })

  it('handles null and undefined', () => {
    expect(escapeField(undefined)).toBe('""')
  })
})

// Anki's CSV reader uses `.comment(Some(b'#'))`, so a data line starting with
// `#` is dropped without an error. Quoting must keep that from ever happening.
describe('the # comment trap', () => {
  it('never emits a data line beginning with #', () => {
    const tsv = markdownToTsv('#1 cause of death is {{c1::heart disease}}.')
    const rows = tsv.trim().split('\n').filter((line) => !line.startsWith('#separator') && !line.startsWith('#html') && !line.startsWith('#notetype') && !line.startsWith('#deck') && !line.startsWith('#tags'))
    expect(rows).toHaveLength(1)
    expect(rows[0].startsWith('"')).toBe(true)
  })
})

describe('notesToTsv', () => {
  it('writes the headers Anki needs and no #columns line', () => {
    const tsv = notesToTsv([], { deck: 'bio' })
    expect(tsv.split('\n').slice(0, 5)).toEqual([
      '#separator:tab',
      '#html:true',
      '#notetype:Cloze',
      '#deck:bio',
      '#tags column:3',
    ])
    expect(tsv).not.toContain('#columns:')
  })

  it('lays out three tab-separated columns per note', () => {
    const tsv = markdownToTsv('# Bio\n\nThe {{c1::mitochondria}} is the **powerhouse**.')
    const row = tsv.trim().split('\n').at(-1)
    expect(row.split('\t')).toEqual([
      '"The {{c1::mitochondria}} is the <strong>powerhouse</strong>."',
      '"Bio"',
      '"bio"',
    ])
  })

  it('ends with a trailing newline', () => {
    expect(markdownToTsv('A {{c1::fact}}.')).toMatch(/\n$/)
  })
})

describe('tsvFileName', () => {
  it('swaps the extension', () => {
    expect(tsvFileName('notes.md')).toBe('notes.tsv')
  })

  it('falls back when there is no name', () => {
    expect(tsvFileName('')).toBe('mdown.tsv')
  })
})
