// One confirmation, for the small things.
//
// Deleting a lead has always asked first. Deleting a note happened the instant
// the menu item was clicked, and a note is no easier to get back than a lead.
// This is the same dialog the contact and organization pages already use,
// pulled into one place so every surface asks the same way and, unlike those
// two, names the thing it is about to destroy.

import { globalStore } from '@/stores/global'

const MAX_SUBJECT = 60

// What to call the thing on screen. A note carries HTML content and may have no
// title at all, so markup comes out, whitespace collapses, and what is left is
// trimmed to something a sentence can hold.
export function describeSubject(text, max = MAX_SUBJECT) {
  if (typeof text !== 'string') return ''

  const plain = text
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()

  if (!plain) return ''
  if (plain.length <= max) return plain
  return plain.slice(0, max).trimEnd() + '...'
}

export function askBeforeDelete({ title, subject, fallback, onConfirm }) {
  const { $dialog } = globalStore()
  const named = describeSubject(subject)

  $dialog({
    title,
    message: named
      ? __('Are you sure you want to delete "{0}"?', [named])
      : fallback || __('Are you sure you want to delete this?'),
    actions: [
      {
        label: __('Delete'),
        theme: 'red',
        variant: 'solid',
        async onClick(close) {
          await onConfirm()
          close()
        },
      },
    ],
  })
}
