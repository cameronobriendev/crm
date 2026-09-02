// Whether the brief on screen is the one the OS would write today.
//
// The brief itself is a Frappe record and comes from the CRM. Whether it is
// still current is something only the OS knows, because the OS is what watches
// the contact for change and what rebuilds on a schedule. So this asks the OS,
// and everything it returns is decoration on a brief that renders with or
// without it.
//
// The whole layer fails INVISIBLE. No os id, no answer, a bad answer: the
// caller renders the brief exactly as it did before any of this existed. A
// freshness header is never the reason a brief cannot be read.

import { computed, onScopeDispose, reactive, ref, toValue } from 'vue'
import { getBriefStatus, requestRebuild } from '@/data/brasshelmOS'

// The OS takes a while to write a brief. Ten seconds between looks is often
// enough to catch the end without asking constantly.
const POLL_MS = 10000

export function useBriefFreshness(osId, { onRefreshed } = {}) {
  const currentId = () => toValue(osId) || ''

  // No `error` field on purpose: a failed status fetch is not a state the
  // panel renders, it is the absence of the header.
  const status = reactive({ loading: false, loaded: false, data: null })

  // Our own rebuild, held separately from the OS's `running`, so the button
  // reads as working the instant it is pressed rather than on the next poll.
  const starting = ref(false)
  const startRefused = ref('')

  let timer = null

  function stopPolling() {
    if (!timer) return
    clearInterval(timer)
    timer = null
  }

  onScopeDispose(stopPolling)

  async function fetchStatus() {
    const id = currentId()
    if (!id) return null

    try {
      const data = await getBriefStatus(id)
      status.data = data
      status.loaded = true
      return data
    } catch {
      // The OS is unreachable or says no. The brief still renders; the header
      // does not. A stale answer is not kept around to contradict it.
      status.data = null
      status.loaded = false
      return null
    }
  }

  async function loadStatus() {
    if (status.loading || status.loaded) return
    status.loading = true
    let data
    try {
      data = await fetchStatus()
    } finally {
      status.loading = false
    }

    // A rebuild a schedule started before the tab was opened is watched the
    // same way one of ours would be, so the brief refreshes when it lands.
    if (data?.running) pollUntilDone()
  }

  // Ask again, ignoring the once-per-visit guard. Editing a note changes the
  // very thing the OS decides freshness from, so the answer it gave when the
  // page loaded is out of date the moment that edit lands. The check is live
  // and instant, so this is one read per change and nothing periodic.
  async function refreshStatus() {
    const data = await fetchStatus()
    if (data?.running) pollUntilDone()
  }

  // Watches until the OS stops running, then lets the caller reload the brief
  // that the run just rewrote.
  function pollUntilDone() {
    stopPolling()
    timer = setInterval(async () => {
      const data = await fetchStatus()

      // A status we cannot read is not proof the run ended, but continuing to
      // poll a dead endpoint helps nobody. Stop and leave the header off.
      if (!data || !data.running) {
        stopPolling()
        starting.value = false
        if (data) onRefreshed?.()
      }
    }, POLL_MS)
  }

  async function rebuild() {
    const id = currentId()
    if (!id || starting.value) return

    startRefused.value = ''
    starting.value = true

    let result
    try {
      result = await requestRebuild(id)
    } catch {
      starting.value = false
      startRefused.value = 'The OS could not be reached'
      return
    }

    if (!result?.started) {
      starting.value = false
      startRefused.value = result?.reason || 'The OS did not start a rebuild'
      return
    }

    await fetchStatus()
    pollUntilDone()
  }

  // True while the OS is writing, whether we asked for it or a schedule did.
  const isRunning = computed(() => starting.value || !!status.data?.running)

  const isPending = computed(() => !!status.data?.pending)

  // Anything at all to say. A current brief says nothing: the header speaks
  // only when something needs attention. A rebuild we started keeps this true
  // even if a later status read comes back empty, so the affordance cannot
  // vanish underneath the person who just pressed it.
  const hasSomethingToSay = computed(
    () => isRunning.value || (!!status.data && isPending.value),
  )

  // Why it is behind, and when that gets fixed. Both live in the chip's
  // tooltip: the header states the problem, hovering explains it.
  const pendingDetail = computed(() => {
    const reason =
      status.data?.pendingReason || __('data changed since this brief')

    let schedule
    switch (status.data?.nextRun) {
      case 'today':
        schedule = __('rebuilds before your next meeting')
        break
      case 'tonight':
        schedule = __('rebuilds tonight')
        break
      default:
        schedule = __(
          'no rebuild scheduled, rebuilds when used, or right now with the button',
        )
    }

    return `${reason}, ${schedule}`
  })

  return {
    status,
    startRefused,
    isRunning,
    isPending,
    hasSomethingToSay,
    pendingDetail,
    loadStatus,
    refreshStatus,
    rebuild,
  }
}
