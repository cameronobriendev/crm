import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  OS_BASE_URL,
  OS_ERRORS,
  contactPath,
  getBrief,
  getComms,
  getMeeting,
  getMeetings,
  osUrl,
} from '@/data/brasshelmOS'

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

let originalFetch

beforeEach(() => {
  originalFetch = globalThis.fetch
})

afterEach(() => {
  globalThis.fetch = originalFetch
  vi.restoreAllMocks()
})

describe('url building', () => {
  it('builds paths under the crm-tabs API', () => {
    expect(osUrl('/contact/jane/brief')).toBe(
      `${OS_BASE_URL}/api/crm-tabs/contact/jane/brief`,
    )
  })

  it('encodes the os id', () => {
    expect(contactPath('a/b?c')).toBe('/contact/a%2Fb%3Fc')
  })

  it('encodes the meeting slug', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ slug: 'x' }))
    globalThis.fetch = fetchMock
    await getMeeting('jane', 'a b/c')
    expect(fetchMock.mock.calls[0][0]).toBe(
      `${OS_BASE_URL}/api/crm-tabs/contact/jane/meeting/a%20b%2Fc`,
    )
  })
})

describe('request options', () => {
  it('sends the shared session cookie and never caches', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ osId: 'jane' }))
    globalThis.fetch = fetchMock
    await getBrief('jane')
    const options = fetchMock.mock.calls[0][1]
    expect(options.credentials).toBe('include')
    expect(options.cache).toBe('no-store')
  })

  it('returns the parsed body', async () => {
    globalThis.fetch = async () => jsonResponse({ osId: 'jane', notes: 'hi' })
    await expect(getComms('jane')).resolves.toEqual({
      osId: 'jane',
      notes: 'hi',
    })
  })
})

describe('failure classification', () => {
  it('classifies 401 as unauthenticated', async () => {
    globalThis.fetch = async () => jsonResponse({}, 401)
    await expect(getBrief('jane')).rejects.toMatchObject({
      kind: OS_ERRORS.unauthenticated,
    })
  })

  it('classifies 403 as unauthenticated', async () => {
    globalThis.fetch = async () => jsonResponse({}, 403)
    await expect(getBrief('jane')).rejects.toMatchObject({
      kind: OS_ERRORS.unauthenticated,
    })
  })

  it('classifies 404 as not found', async () => {
    globalThis.fetch = async () => jsonResponse({ error: 'not_found' }, 404)
    await expect(getBrief('jane')).rejects.toMatchObject({
      kind: OS_ERRORS.notFound,
    })
  })

  it('classifies a server error as unavailable', async () => {
    globalThis.fetch = async () => jsonResponse({}, 500)
    await expect(getMeetings('jane')).rejects.toMatchObject({
      kind: OS_ERRORS.unavailable,
    })
  })

  it('classifies a network or CORS failure as unavailable', async () => {
    globalThis.fetch = async () => {
      throw new TypeError('Failed to fetch')
    }
    await expect(getMeetings('jane')).rejects.toMatchObject({
      kind: OS_ERRORS.unavailable,
    })
  })

  it('classifies a non-JSON body as unavailable', async () => {
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token')
      },
    })
    await expect(getComms('jane')).rejects.toMatchObject({
      kind: OS_ERRORS.unavailable,
    })
  })
})
