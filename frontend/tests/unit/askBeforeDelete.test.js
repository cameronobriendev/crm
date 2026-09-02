import { describe, it, expect } from 'vitest'
import { describeSubject } from '@/utils/askBeforeDelete'

describe('describeSubject', () => {
  it('passes a plain title through', () => {
    expect(describeSubject('Call Ryan about the phone system')).toBe(
      'Call Ryan about the phone system',
    )
  })

  it('strips the markup a note body carries', () => {
    expect(describeSubject('<p>He runs <b>400</b> doors.</p>')).toBe(
      'He runs 400 doors.',
    )
  })

  it('collapses whitespace and newlines', () => {
    expect(describeSubject('  Two   lines\n\nof  text ')).toBe(
      'Two lines of text',
    )
  })

  it('decodes the entities a stripped body leaves behind', () => {
    expect(describeSubject('<p>Doors&nbsp;&amp;&nbsp;units</p>')).toBe(
      'Doors & units',
    )
  })

  it('truncates past the limit and marks it', () => {
    expect(describeSubject('abcdefghij', 5)).toBe('abcde...')
  })

  it('does not truncate at exactly the limit', () => {
    expect(describeSubject('abcde', 5)).toBe('abcde')
  })

  it('does not leave a trailing space before the marker', () => {
    expect(describeSubject('abcd fghij', 5)).toBe('abcd...')
  })

  it('is empty for markup wrapped around nothing', () => {
    expect(describeSubject('<p></p>')).toBe('')
    expect(describeSubject('<p><br></p>')).toBe('')
  })

  it('is empty for anything that is not a string', () => {
    expect(describeSubject('')).toBe('')
    expect(describeSubject(null)).toBe('')
    expect(describeSubject(undefined)).toBe('')
    expect(describeSubject(42)).toBe('')
  })
})
