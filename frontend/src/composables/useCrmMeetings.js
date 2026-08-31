// The CRM Meeting records filed against one lead.
//
// The list is fetched with the page, because the Meetings tab only exists when
// there is at least one meeting and the tab row needs that answer before it can
// draw itself. It carries the row fields only: summary, transcript and audio are
// the heavy part of a meeting and none of them are on screen until a row is
// opened, so each meeting's full document is fetched the first time it expands
// and kept for the rest of the visit.
//
// The first page is a page, not a ceiling. next() moves the window forward and
// appends, and hasNextPage says whether there is more, so a lead past the page
// length keeps every meeting reachable instead of losing the tail in silence.

import { createListResource, createResource } from 'frappe-ui'
import { reactive, ref } from 'vue'

// Everything the collapsed row shows, and nothing else.
export const MEETING_ROW_FIELDS = [
  'name',
  'title',
  'meeting_date',
  'duration_seconds',
  'platform',
]

export const MEETING_PAGE_LENGTH = 100

export function useCrmMeetings(leadName) {
  const meetings = createListResource({
    type: 'list',
    doctype: 'CRM Meeting',
    cache: ['crmMeetings', 'CRM Lead', leadName],
    fields: MEETING_ROW_FIELDS,
    filters: {
      reference_doctype: 'CRM Lead',
      reference_docname: leadName,
    },
    orderBy: 'meeting_date desc',
    pageLength: MEETING_PAGE_LENGTH,
    auto: true,
    // A lead page is not the place to announce that the meeting store is
    // unreachable. A failed list leaves data empty, which hides the tab.
    onError: () => {},
  })

  // name -> createResource for the full document
  const details = reactive({})
  const expandedName = ref('')

  function detailFor(name) {
    return details[name] || null
  }

  function loadDetail(name) {
    if (!name || details[name]) return
    details[name] = createResource({
      url: 'frappe.client.get',
      params: { doctype: 'CRM Meeting', name },
      auto: true,
      onError: () => {},
    })
  }

  function toggleMeeting(name) {
    if (expandedName.value === name) {
      expandedName.value = ''
      return
    }
    expandedName.value = name
    loadDetail(name)
  }

  // Fetches the next window and appends it to the rows already on screen.
  function loadMore() {
    if (!meetings.hasNextPage || meetings.list?.loading) return
    meetings.next()
  }

  return { meetings, details, expandedName, detailFor, toggleMeeting, loadMore }
}
