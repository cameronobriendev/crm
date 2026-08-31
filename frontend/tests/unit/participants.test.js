import { describe, it, expect } from 'vitest'
import { meetingParticipants, parseParticipants } from '@/utils/participants'

describe('parseParticipants', () => {
  it('reads a newline separated field', () => {
    expect(parseParticipants('Ryan Bell\nKacy Singh\n')).toEqual([
      'Ryan Bell',
      'Kacy Singh',
    ])
  })

  it('reads a comma or semicolon separated field', () => {
    expect(parseParticipants('Ryan Bell, Kacy Singh; Matt Hatcher')).toEqual([
      'Ryan Bell',
      'Kacy Singh',
      'Matt Hatcher',
    ])
  })

  it('reads a plain array', () => {
    expect(parseParticipants(['Ryan Bell', ' Kacy Singh '])).toEqual([
      'Ryan Bell',
      'Kacy Singh',
    ])
  })

  it('reads child table rows by their best name field', () => {
    expect(
      parseParticipants([
        { name: 'row-1', full_name: 'Ryan Bell', email: 'ryan@example.com' },
        { name: 'row-2', email: 'kacy@example.com' },
      ]),
    ).toEqual(['Ryan Bell', 'kacy@example.com'])
  })

  it('reads a JSON encoded array', () => {
    expect(parseParticipants('["Ryan Bell","Kacy Singh"]')).toEqual([
      'Ryan Bell',
      'Kacy Singh',
    ])
  })

  it('falls back to separators when the text only looks like JSON', () => {
    expect(parseParticipants('[unclosed, Ryan Bell')).toEqual([
      '[unclosed',
      'Ryan Bell',
    ])
  })

  it('is empty for nothing', () => {
    expect(parseParticipants('')).toEqual([])
    expect(parseParticipants(null)).toEqual([])
    expect(parseParticipants(undefined)).toEqual([])
    expect(parseParticipants(7)).toEqual([])
    expect(parseParticipants([{ unrelated: 'x' }])).toEqual([])
  })
})

describe('meetingParticipants', () => {
  it('puts the outside people first and flags them', () => {
    expect(
      meetingParticipants({
        participants: 'Cameron OBrien\nKacy Singh',
        external_participants: 'Ryan Bell',
      }),
    ).toEqual([
      { name: 'Ryan Bell', external: true },
      { name: 'Cameron OBrien', external: false },
      { name: 'Kacy Singh', external: false },
    ])
  })

  it('keeps the external reading when a person is named on both sides', () => {
    expect(
      meetingParticipants({
        participants: 'Ryan Bell',
        external_participants: 'ryan bell',
      }),
    ).toEqual([{ name: 'ryan bell', external: true }])
  })

  it('handles a meeting with neither field', () => {
    expect(meetingParticipants({})).toEqual([])
    expect(meetingParticipants()).toEqual([])
  })
})
