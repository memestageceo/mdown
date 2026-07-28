import { describe, expect, it } from 'vitest'
import { blockAt, slugify, splitBlocks, splitFences } from './markdown.js'

const textsOf = (source) => splitBlocks(source).map((block) => block.text)

describe('splitFences', () => {
  it('separates fenced code from prose', () => {
    const source = 'before\n\n```js\ncode()\n```\n\nafter'
    const runs = splitFences(source)
    expect(runs.map((run) => run.type)).toEqual(['prose', 'code', 'prose'])
    expect(source.slice(runs[1].start, runs[1].end)).toBe('```js\ncode()\n```')
  })

  it('treats an unterminated fence as code to the end', () => {
    const runs = splitFences('intro\n\n```\nnever closed')
    expect(runs.at(-1).type).toBe('code')
  })
})

describe('splitBlocks', () => {
  it('splits paragraphs on blank lines', () => {
    expect(textsOf('one\n\ntwo\n\nthree')).toEqual(['one', 'two', 'three'])
  })

  it('keeps offsets pointing at the real characters', () => {
    const source = 'alpha\n\nbeta'
    const [, second] = splitBlocks(source)
    expect(source.slice(second.start, second.end)).toBe('beta')
  })

  it('makes each list item its own note', () => {
    expect(textsOf('- one\n- two\n- three')).toEqual(['- one', '- two', '- three'])
  })

  it('keeps a wrapped list item together', () => {
    expect(textsOf('- first line\n  continued\n- second')).toEqual([
      '- first line\n  continued',
      '- second',
    ])
  })

  it('handles ordered lists', () => {
    expect(textsOf('1. one\n2. two')).toEqual(['1. one', '2. two'])
  })

  it('marks headings and threads a heading trail onto later blocks', () => {
    const blocks = splitBlocks('# Bio\n\n## Cells\n\nMitochondria.')
    const last = blocks.at(-1)
    expect(last.text).toBe('Mitochondria.')
    expect(last.headings.map((h) => h.text)).toEqual(['Bio', 'Cells'])
  })

  it('pops the heading trail when a shallower heading arrives', () => {
    const blocks = splitBlocks('# A\n\n## B\n\n# C\n\nbody')
    expect(blocks.at(-1).headings.map((h) => h.text)).toEqual(['C'])
  })

  it('flags fenced code blocks', () => {
    const blocks = splitBlocks('text\n\n```js\ncode()\n```')
    expect(blocks.at(-1).isCode).toBe(true)
  })

  it('ignores runs of blank lines', () => {
    expect(textsOf('one\n\n\n\ntwo')).toEqual(['one', 'two'])
  })
})

describe('blockAt', () => {
  it('finds the block containing an offset', () => {
    const source = 'alpha\n\nbeta gamma'
    expect(blockAt(source, source.indexOf('gamma')).text).toBe('beta gamma')
  })

  it('returns null for an empty document', () => {
    expect(blockAt('   ', 1)).toBeNull()
  })
})

describe('slugify', () => {
  it('strips markdown and punctuation', () => {
    expect(slugify('**Cell** structure!')).toBe('cell-structure')
  })
})
