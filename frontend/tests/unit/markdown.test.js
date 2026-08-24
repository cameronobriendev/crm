import { describe, it, expect } from 'vitest'
import { escapeHTML, renderMarkdown } from '@/utils/markdown'

describe('escapeHTML', () => {
  it('escapes the characters that can start markup', () => {
    expect(escapeHTML('<b>&"\'')).toBe('&lt;b&gt;&amp;&quot;&#39;')
  })

  it('coerces non-strings', () => {
    expect(escapeHTML(5)).toBe('5')
  })
})

describe('renderMarkdown', () => {
  it('returns nothing for empty or non-string input', () => {
    expect(renderMarkdown('')).toBe('')
    expect(renderMarkdown('   ')).toBe('')
    expect(renderMarkdown(null)).toBe('')
    expect(renderMarkdown(undefined)).toBe('')
  })

  it('renders headings', () => {
    expect(renderMarkdown('# Title')).toBe('<h1>Title</h1>')
    expect(renderMarkdown('### Deep')).toBe('<h3>Deep</h3>')
  })

  it('renders paragraphs split on blank lines', () => {
    expect(renderMarkdown('one\n\ntwo')).toBe('<p>one</p>\n<p>two</p>')
  })

  it('keeps a soft line break inside a paragraph', () => {
    expect(renderMarkdown('one\ntwo')).toBe('<p>one<br>two</p>')
  })

  it('renders bullet lists', () => {
    expect(renderMarkdown('- a\n- b')).toBe('<ul><li>a</li><li>b</li></ul>')
  })

  it('renders numbered lists', () => {
    expect(renderMarkdown('1. a\n2. b')).toBe('<ol><li>a</li><li>b</li></ol>')
  })

  it('separates a numbered list from a bullet list', () => {
    expect(renderMarkdown('- a\n1. b')).toBe(
      '<ul><li>a</li></ul>\n<ol><li>b</li></ol>',
    )
  })

  it('renders emphasis', () => {
    expect(renderMarkdown('**bold** and *italic*')).toBe(
      '<p><strong>bold</strong> and <em>italic</em></p>',
    )
  })

  it('renders inline code without applying other transforms inside it', () => {
    expect(renderMarkdown('use `a *b* c`')).toBe(
      '<p>use <code>a *b* c</code></p>',
    )
  })

  it('renders fenced code blocks verbatim', () => {
    expect(renderMarkdown('```js\nconst a = 1\n```')).toBe(
      '<pre><code>const a = 1</code></pre>',
    )
  })

  it('renders blockquotes', () => {
    expect(renderMarkdown('> quoted')).toBe('<blockquote>quoted</blockquote>')
  })

  it('renders horizontal rules', () => {
    expect(renderMarkdown('---')).toBe('<hr>')
  })

  it('renders markdown links with a safe target', () => {
    expect(renderMarkdown('[site](https://brasshelm.com)')).toBe(
      '<p><a href="https://brasshelm.com" target="_blank" rel="noopener noreferrer">site</a></p>',
    )
  })

  it('renders mailto links', () => {
    expect(renderMarkdown('[mail](mailto:a@b.com)')).toContain(
      'href="mailto:a@b.com"',
    )
  })

  it('refuses a javascript link and leaves it as text', () => {
    // The scheme is not linkable, so the source stays literal text.
    const html = renderMarkdown('[click](javascript:alert(1))')
    expect(html).not.toContain('<a ')
    expect(html).not.toContain('href=')
    expect(html).toBe('<p>[click](javascript:alert(1))</p>')
  })

  it('autolinks a bare url', () => {
    expect(renderMarkdown('see https://brasshelm.com now')).toBe(
      '<p>see <a href="https://brasshelm.com" target="_blank" rel="noopener noreferrer">https://brasshelm.com</a> now</p>',
    )
  })

  it('escapes raw HTML in the source', () => {
    const html = renderMarkdown('<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('escapes an image tag hidden in a list item', () => {
    const html = renderMarkdown('- <img src=x onerror=alert(1)>')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img')
  })

  it('escapes an attribute break attempt inside a link label', () => {
    const html = renderMarkdown('["><img src=x>](https://a.com)')
    expect(html).not.toContain('<img')
  })

  it('renders a realistic brief', () => {
    const html = renderMarkdown(
      [
        '# Jane Doe',
        '',
        '## The one thing',
        '',
        'She owns **1,400 doors** and is replacing her phone system.',
        '',
        '- Last spoke on Tuesday',
        '- Wants a `callback` flow',
        '',
        '> Follow up before Friday.',
      ].join('\n'),
    )
    expect(html).toContain('<h1>Jane Doe</h1>')
    expect(html).toContain('<h2>The one thing</h2>')
    expect(html).toContain('<strong>1,400 doors</strong>')
    expect(html).toContain('<li>Wants a <code>callback</code> flow</li>')
    expect(html).toContain('<blockquote>Follow up before Friday.</blockquote>')
  })
})
