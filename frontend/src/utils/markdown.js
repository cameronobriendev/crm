// Minimal markdown renderer.
//
// The CRM ships no markdown library (rich text everywhere else is tiptap HTML),
// and the BrassHelm OS hands us markdown, so this covers the subset the OS
// writes: headings, emphasis, inline code, fenced code, links, bullet and
// numbered lists, blockquotes, horizontal rules and paragraphs.
//
// Safety: every input character is HTML-escaped BEFORE any markdown transform
// runs, so raw HTML in the source is shown as text and can never become markup.
// The only tags in the output are the ones this file emits. Link hrefs are
// restricted to http, https and mailto; anything else renders as plain text.

const ALLOWED_LINK_SCHEME = /^(https?:\/\/|mailto:)/i

export function escapeHTML(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Runs on already-escaped text.
function renderInline(text) {
  let out = text

  // `code` first: its content must not pick up any other inline transform.
  // The placeholder cannot collide with the text: an ampersand in the source
  // has already become &amp; by the time this runs.
  const codeSpans = []
  out = out.replace(/`([^`\n]+)`/g, (_, code) => {
    codeSpans.push(code)
    return `&#0;CODE${codeSpans.length - 1};`
  })

  // [label](href)
  out = out.replace(/\[([^\]\n]*)\]\(([^)\s]+)\)/g, (match, label, href) => {
    const unescapedHref = href.replace(/&amp;/g, '&')
    if (!ALLOWED_LINK_SCHEME.test(unescapedHref)) return match
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`
  })

  // Bare autolinks that were not already turned into anchors.
  out = out.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, (_, lead, url) => {
    return `${lead}<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
  })

  out = out.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/__([^_\n]+)__/g, '<strong>$1</strong>')
  out = out.replace(/(^|[^*\w])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  out = out.replace(/(^|[^_\w])_([^_\n]+)_/g, '$1<em>$2</em>')

  out = out.replace(/&#0;CODE(\d+);/g, (_, i) => `<code>${codeSpans[i]}</code>`)

  return out
}

function listItemMatch(line) {
  const bullet = line.match(/^\s*[-*+]\s+(.*)$/)
  if (bullet) return { ordered: false, content: bullet[1] }
  const ordered = line.match(/^\s*\d+[.)]\s+(.*)$/)
  if (ordered) return { ordered: true, content: ordered[1] }
  return null
}

export function renderMarkdown(markdown = '') {
  if (typeof markdown !== 'string' || !markdown.trim()) return ''

  const lines = escapeHTML(markdown.replace(/\r\n?/g, '\n')).split('\n')
  const html = []

  let paragraph = []
  let list = null // { ordered, items: [] }
  let quote = []

  function flushParagraph() {
    if (!paragraph.length) return
    html.push(
      `<p>${renderInline(paragraph.join('\n')).replace(/\n/g, '<br>')}</p>`,
    )
    paragraph = []
  }

  function flushList() {
    if (!list) return
    const tag = list.ordered ? 'ol' : 'ul'
    const items = list.items
      .map((item) => `<li>${renderInline(item)}</li>`)
      .join('')
    html.push(`<${tag}>${items}</${tag}>`)
    list = null
  }

  function flushQuote() {
    if (!quote.length) return
    html.push(`<blockquote>${renderInline(quote.join(' '))}</blockquote>`)
    quote = []
  }

  function flushAll() {
    flushParagraph()
    flushList()
    flushQuote()
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Fenced code block: consume verbatim until the closing fence or the end.
    const fence = line.match(/^\s*```(.*)$/)
    if (fence) {
      flushAll()
      const body = []
      i++
      while (i < lines.length && !/^\s*```/.test(lines[i])) {
        body.push(lines[i])
        i++
      }
      html.push(`<pre><code>${body.join('\n')}</code></pre>`)
      continue
    }

    if (!line.trim()) {
      flushAll()
      continue
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      flushAll()
      const level = heading[1].length
      html.push(`<h${level}>${renderInline(heading[2].trim())}</h${level}>`)
      continue
    }

    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      flushAll()
      html.push('<hr>')
      continue
    }

    const quoted = line.match(/^\s*&gt;\s?(.*)$/)
    if (quoted) {
      flushParagraph()
      flushList()
      quote.push(quoted[1])
      continue
    }

    const item = listItemMatch(line)
    if (item) {
      flushParagraph()
      flushQuote()
      if (list && list.ordered !== item.ordered) flushList()
      if (!list) list = { ordered: item.ordered, items: [] }
      list.items.push(item.content)
      continue
    }

    // A plain line directly under a list item continues that item.
    if (list) {
      list.items[list.items.length - 1] += '\n' + line.trim()
      continue
    }

    flushQuote()
    paragraph.push(line.trim())
  }

  flushAll()
  return html.join('\n')
}
