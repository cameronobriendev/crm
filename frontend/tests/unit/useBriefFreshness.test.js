import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { useBriefFreshness } from '@/composables/useBriefFreshness'

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

// The composable registers onScopeDispose, so it needs a scope to live in.
function inScope(fn) {
  const scope = effectScope()
  const result = scope.run(fn)
  return { result, stop: () => scope.stop() }
}

let originalFetch

beforeEach(() => {
  originalFetch = globalThis.fetch
})

afterEach(() => {
  globalThis.fetch = originalFetch
  vi.restoreAllMocks()
})

describe('loadStatus', () => {
  it('asks once per visit however many times it is called', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ pending: false, running: false }),
    )
    globalThis.fetch = fetchMock

    const { result, stop } = inScope(() => useBriefFreshness('jane'))
    await result.loadStatus()
    await result.loadStatus()
    await result.loadStatus()
    stop()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('says nothing at all when the brief is current', async () => {
    globalThis.fetch = async () =>
      jsonResponse({ pending: false, running: false })

    const { result, stop } = inScope(() => useBriefFreshness('jane'))
    await result.loadStatus()
    await nextTick()

    expect(result.hasSomethingToSay.value).toBe(false)
    stop()
  })

  it('asks nothing at all without an os id', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}))
    globalThis.fetch = fetchMock

    const { result, stop } = inScope(() => useBriefFreshness(''))
    await result.loadStatus()
    stop()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.hasSomethingToSay.value).toBe(false)
  })

  it('stays silent when the OS cannot be reached', async () => {
    globalThis.fetch = async () => {
      throw new Error('network down')
    }

    const { result, stop } = inScope(() => useBriefFreshness('jane'))
    await result.loadStatus()
    await nextTick()

    expect(result.hasSomethingToSay.value).toBe(false)
    stop()
  })
})

describe('refreshStatus', () => {
  it('asks again every time, unlike loadStatus', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ pending: false, running: false }),
    )
    globalThis.fetch = fetchMock

    const { result, stop } = inScope(() => useBriefFreshness('jane'))
    await result.loadStatus()
    await result.refreshStatus()
    await result.refreshStatus()
    stop()

    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  // The composition this patch exists for: a note is added, the OS now says
  // the brief is behind, and the header has to show it without a page reload.
  it('surfaces a brief that went stale since the page loaded', async () => {
    let pending = false
    globalThis.fetch = async () => jsonResponse({ pending, running: false })

    const { result, stop } = inScope(() => useBriefFreshness('jane'))

    await result.loadStatus()
    await nextTick()
    expect(result.hasSomethingToSay.value).toBe(false)

    // The note lands, and the OS changes its mind.
    pending = true
    await result.refreshStatus()
    await nextTick()

    expect(result.hasSomethingToSay.value).toBe(true)
    expect(result.isPending.value).toBe(true)
    stop()
  })

  // And the other direction: whatever made it stale is undone, so the chip
  // has to go away again on its own.
  it('clears the chip when the brief becomes current again', async () => {
    let pending = true
    globalThis.fetch = async () => jsonResponse({ pending, running: false })

    const { result, stop } = inScope(() => useBriefFreshness('jane'))

    await result.loadStatus()
    await nextTick()
    expect(result.hasSomethingToSay.value).toBe(true)

    pending = false
    await result.refreshStatus()
    await nextTick()

    expect(result.hasSomethingToSay.value).toBe(false)
    stop()
  })
})
