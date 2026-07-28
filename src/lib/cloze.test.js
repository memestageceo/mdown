import { describe, expect, it } from 'vitest'
import { applyEdit, expandToWord, findClozes, highestNumber, planClozeEdit } from './cloze.js'

// Applies a cloze keystroke and marks the resulting selection with « ».
function press(source, selection, mode = 'new') {
  const start = source.indexOf('[')
  const end = source.indexOf(']') - 1
  const clean = source.replace(/[[\]]/g, '')
  const [from, to] = selection ?? [start, end]
  const edit = planClozeEdit(clean, from, to, mode)
  if (!edit) return null
  const next = applyEdit(clean, edit)
  return next.slice(0, edit.select[0]) + '«' + next.slice(edit.select[0], edit.select[1]) + '»' + next.slice(edit.select[1])
}

const at = (source, needle) => [source.indexOf(needle), source.indexOf(needle) + needle.length]

describe('findClozes', () => {
  it('parses number, answer and hint', () => {
    const [cloze] = findClozes('The {{c2::answer::a hint}} here')
    expect(cloze).toMatchObject({ number: 2, answer: 'answer', hint: 'a hint' })
  })

  it('leaves hint null when absent', () => {
    expect(findClozes('{{c1::plain}}')[0].hint).toBeNull()
  })

  it('handles nested clozes without splitting on the inner braces', () => {
    const clozes = findClozes('{{c1::Canberra was {{c2::founded}}}}')
    expect(clozes).toHaveLength(2)
    expect(clozes[0].answer).toBe('Canberra was {{c2::founded}}')
    expect(clozes[1].answer).toBe('founded')
  })

  it('ignores an unterminated cloze', () => {
    expect(findClozes('{{c1::never closed')).toEqual([])
  })
})

describe('highestNumber', () => {
  it('returns 0 with no clozes', () => {
    expect(highestNumber('nothing here')).toBe(0)
  })

  it('takes the maximum, not the count', () => {
    expect(highestNumber('{{c3::a}} and {{c1::b}}')).toBe(3)
  })
})

describe('expandToWord', () => {
  it('grows an empty selection to the surrounding word', () => {
    const source = 'the mitochondria is'
    const [from, to] = expandToWord(source, 6, 6)
    expect(source.slice(from, to)).toBe('mitochondria')
  })

  it('leaves a real selection alone', () => {
    expect(expandToWord('abc def', 0, 3)).toEqual([0, 3])
  })
})

describe('planClozeEdit', () => {
  it('wraps a selection as c1 and selects the answer', () => {
    const source = 'The powerhouse of the cell.'
    expect(press(source, at(source, 'powerhouse'))).toBe('The {{c1::«powerhouse»}} of the cell.')
  })

  it('increments within the same block', () => {
    const source = 'The {{c1::mitochondria}} is the powerhouse.'
    expect(press(source, at(source, 'powerhouse'))).toContain('{{c2::«powerhouse»}}')
  })

  it('restarts numbering in a different block', () => {
    const source = 'First {{c1::a}} and {{c2::b}}.\n\nSecond block here.'
    expect(press(source, at(source, 'block'))).toContain('{{c1::«block»}}')
  })

  it('reuses the last number in same mode', () => {
    const source = 'The {{c1::mitochondria}} is the powerhouse.'
    expect(press(source, at(source, 'powerhouse'), 'same')).toContain('{{c1::«powerhouse»}}')
  })

  it('uses c1 in same mode when the block has no clozes yet', () => {
    const source = 'Nothing clozed yet.'
    expect(press(source, at(source, 'Nothing'), 'same')).toContain('{{c1::«Nothing»}}')
  })

  it('wraps the word under a bare caret', () => {
    const source = 'the mitochondria is'
    expect(press(source, [6, 6])).toBe('the {{c1::«mitochondria»}} is')
  })

  it('unwraps when the selection sits inside an existing cloze', () => {
    const source = 'The {{c1::powerhouse}} of the cell.'
    expect(press(source, at(source, 'powerhouse'))).toBe('The «powerhouse» of the cell.')
  })

  it('preserves the hint when unwrapping', () => {
    const source = 'The {{c1::powerhouse::organelle}} of the cell.'
    expect(press(source, at(source, 'powerhouse'))).toBe('The «powerhouse::organelle» of the cell.')
  })

  it('refuses to cloze inside a fenced code block', () => {
    const source = 'text\n\n```js\nconst x = 1\n```'
    expect(press(source, at(source, 'const'))).toBeNull()
  })

  it('refuses a selection spanning two blocks', () => {
    const source = 'first block\n\nsecond block'
    expect(press(source, [0, source.length])).toBeNull()
  })

  it('numbers list items independently', () => {
    const source = '- alpha value\n- beta value'
    expect(press(source, at(source, 'beta'))).toContain('{{c1::«beta»}}')
  })

  it('trims a trailing space out of the selection', () => {
    const source = 'the powerhouse of the cell'
    // Double-clicking a word selects the trailing space in most browsers.
    expect(press(source, [4, 15])).toBe('the {{c1::«powerhouse»}} of the cell')
  })

  it('refuses a selection that clips part of a neighbouring cloze', () => {
    const source = 'A {{c1::first}} and second.'
    expect(press(source, [source.indexOf('first'), source.indexOf('second') + 6])).toBeNull()
  })
})
