// Who was on a meeting.
//
// A CRM Meeting keeps its people in participants and external_participants, and
// those fields can arrive in more than one shape depending on how the doctype
// stores them: a child table gives rows, a Small Text field gives one string, a
// JSON field gives an encoded array. This flattens all of them to a plain list
// of names so the panel never has to care which one it got.

const SEPARATORS = /[\n;,]+/

// The keys a row-shaped participant might carry its name under, best first.
const NAME_KEYS = [
  'full_name',
  'participant_name',
  'participant',
  'user_name',
  'email',
  'email_address',
  'user',
  'name',
]

function nameOfRow(row) {
  for (const key of NAME_KEYS) {
    const value = row[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function fromString(text) {
  const trimmed = text.trim()
  if (!trimmed) return []

  // A JSON field hands back an encoded array rather than a separated list.
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parseParticipants(parsed)
    } catch {
      // Not JSON after all. Fall through and read it as a separated list.
    }
  }

  return trimmed
    .split(SEPARATORS)
    .map((part) => part.trim())
    .filter(Boolean)
}

export function parseParticipants(value) {
  if (!value) return []

  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === 'string') return entry.trim()
        if (entry && typeof entry === 'object') return nameOfRow(entry)
        return ''
      })
      .filter(Boolean)
  }

  if (typeof value === 'string') return fromString(value)

  return []
}

// The two fields merged into one ordered list, externals first, because the
// people from outside are the ones being read about. Duplicates across the two
// fields keep their external reading: a person named on both sides is external.
export function meetingParticipants(meeting = {}) {
  const external = parseParticipants(meeting.external_participants)
  const internal = parseParticipants(meeting.participants)

  const seen = new Set()
  const out = []

  for (const name of external) {
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ name, external: true })
  }

  for (const name of internal) {
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ name, external: false })
  }

  return out
}
