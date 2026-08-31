// Prose stored by the unified store arrives in one of two shapes.
//
// Frappe's Text Editor fields hold HTML, and the BrassHelm OS writes markdown
// straight into the same field, so a stored value is one or the other and the
// field itself does not say which. These helpers decide by reading the text,
// so a renderer can pick the right path instead of showing markdown source or
// escaped tags.

// Deliberately an opening-tag match against a closed list of the tags real
// stored HTML actually opens with. A markdown autolink like <https://x> has no
// tag name from this list and an inequality like `a < b` has no `>` after a
// tag name, so neither is mistaken for markup.
const HTML_TAG =
  /<(?:p|div|br|hr|ul|ol|li|h[1-6]|table|thead|tbody|tr|td|th|blockquote|pre|code|strong|em|b|i|u|a|span|img|figure)\b[^>]*>/i

export function looksLikeHTML(text) {
  if (typeof text !== 'string') return false
  return HTML_TAG.test(text)
}

// The visible characters of a value, with markup removed when there is any.
// An empty Text Editor field is not an empty string: it is markup wrapped
// around nothing, and it must read as empty.
export function richTextIsEmpty(text) {
  if (typeof text !== 'string' || !text.trim()) return true
  if (!looksLikeHTML(text)) return false

  const visible = text
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/g, ' ')

  return !visible.trim()
}
