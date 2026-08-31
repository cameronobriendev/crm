import { describe, it, expect } from 'vitest'
import { looksLikeHTML, richTextIsEmpty } from '@/utils/richText'

describe('looksLikeHTML', () => {
  it('recognises stored Text Editor markup', () => {
    expect(looksLikeHTML('<p>We talked about the phone system.</p>')).toBe(true)
    expect(looksLikeHTML('<div class="ql-editor"><p>Hi</p></div>')).toBe(true)
    expect(looksLikeHTML('<ul><li>One</li></ul>')).toBe(true)
    expect(looksLikeHTML('<h2>Where things stand</h2>')).toBe(true)
    expect(looksLikeHTML('<br>')).toBe(true)
  })

  it('leaves markdown alone', () => {
    expect(looksLikeHTML('## Where things stand\n\n- One\n- Two')).toBe(false)
    expect(looksLikeHTML('**bold** and `code`')).toBe(false)
    expect(looksLikeHTML('')).toBe(false)
  })

  it('does not mistake an autolink for a tag', () => {
    expect(looksLikeHTML('<https://brasshelm.com>')).toBe(false)
  })

  it('does not mistake an inequality for a tag', () => {
    expect(looksLikeHTML('doors < employees > payroll')).toBe(false)
  })

  it('refuses anything that is not a string', () => {
    expect(looksLikeHTML(null)).toBe(false)
    expect(looksLikeHTML(undefined)).toBe(false)
    expect(looksLikeHTML(42)).toBe(false)
  })
})

describe('richTextIsEmpty', () => {
  it('treats nothing as empty', () => {
    expect(richTextIsEmpty('')).toBe(true)
    expect(richTextIsEmpty('   \n ')).toBe(true)
    expect(richTextIsEmpty(null)).toBe(true)
  })

  it('treats markup wrapped around nothing as empty', () => {
    expect(richTextIsEmpty('<p></p>')).toBe(true)
    expect(richTextIsEmpty('<p><br></p>')).toBe(true)
    expect(richTextIsEmpty('<div><p>&nbsp;</p></div>')).toBe(true)
  })

  it('keeps markup with words in it', () => {
    expect(richTextIsEmpty('<p>He runs 400 doors.</p>')).toBe(false)
  })

  it('keeps markdown', () => {
    expect(richTextIsEmpty('## Summary')).toBe(false)
  })
})
