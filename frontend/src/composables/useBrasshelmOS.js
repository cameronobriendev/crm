// Lazy state for the BrassHelm OS tabs on the contact page.
//
// Each section loads once, the first time its tab is opened, and stays loaded
// while the page is open. Nothing here fires on page load.

import { ref, reactive, toValue } from 'vue'
import {
  OS_ERRORS,
  getBrief,
  getComms,
  getMeeting,
  getMeetings,
} from '@/data/brasshelmOS'

function newSection() {
  return { loading: false, loaded: false, error: '', data: null }
}

// osId may be a string, a ref or a getter: the contact document loads after
// setup runs, so the id is read at call time, never captured up front.
export function useBrasshelmOS(osId) {
  const currentId = () => toValue(osId) || ''

  const brief = reactive(newSection())
  const meetings = reactive(newSection())
  const comms = reactive(newSection())

  // slug -> { loading, loaded, error, data }
  const meetingDetails = reactive({})
  const expandedSlug = ref('')

  async function load(section, fetcher) {
    const id = currentId()
    if (!id || section.loading || section.loaded) return
    section.loading = true
    section.error = ''
    try {
      section.data = await fetcher(id)
      section.loaded = true
    } catch (err) {
      section.error = err?.kind || OS_ERRORS.unavailable
    } finally {
      section.loading = false
    }
  }

  const loadBrief = () => load(brief, getBrief)
  const loadMeetings = () => load(meetings, getMeetings)
  const loadComms = () => load(comms, getComms)

  async function loadMeetingDetail(slug) {
    const id = currentId()
    if (!id || !slug) return
    if (!meetingDetails[slug]) meetingDetails[slug] = newSection()
    const detail = meetingDetails[slug]
    if (detail.loading || detail.loaded) return
    detail.loading = true
    detail.error = ''
    try {
      detail.data = await getMeeting(id, slug)
      detail.loaded = true
    } catch (err) {
      detail.error = err?.kind || OS_ERRORS.unavailable
    } finally {
      detail.loading = false
    }
  }

  function toggleMeeting(slug) {
    if (expandedSlug.value === slug) {
      expandedSlug.value = ''
      return
    }
    expandedSlug.value = slug
    loadMeetingDetail(slug)
  }

  return {
    brief,
    meetings,
    comms,
    meetingDetails,
    expandedSlug,
    loadBrief,
    loadMeetings,
    loadComms,
    toggleMeeting,
  }
}
