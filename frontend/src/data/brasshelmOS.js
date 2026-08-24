// Client for the BrassHelm OS crm-tabs API.
//
// The OS lives on a different host (app.brasshelm.com) and authenticates with
// the shared *.brasshelm.com session cookie, so every request goes out with
// credentials and the OS answers the CORS preflight for crm.brasshelm.com.
// Nothing here uses the Frappe session.
//
// Failures are classified, never thrown as raw fetch errors, so the panels can
// tell "you are signed out of the OS" apart from "this person has no brief".

export const OS_BASE_URL =
  import.meta.env?.VITE_BRASSHELM_OS_URL || 'https://app.brasshelm.com'

export const OS_ERRORS = {
  unauthenticated: 'unauthenticated',
  notFound: 'not_found',
  unavailable: 'unavailable',
}

export class OSError extends Error {
  constructor(kind, message) {
    super(message || kind)
    this.name = 'OSError'
    this.kind = kind
  }
}

export function osUrl(path) {
  return `${OS_BASE_URL}/api/crm-tabs${path}`
}

export function contactPath(osId, suffix = '') {
  return `/contact/${encodeURIComponent(osId)}${suffix}`
}

async function osFetch(path) {
  let response
  try {
    response = await fetch(osUrl(path), {
      credentials: 'include',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
  } catch {
    // Network failure, DNS, CORS rejection: the OS is simply not reachable.
    throw new OSError(OS_ERRORS.unavailable)
  }

  if (response.status === 401 || response.status === 403) {
    throw new OSError(OS_ERRORS.unauthenticated)
  }
  if (response.status === 404) {
    throw new OSError(OS_ERRORS.notFound)
  }
  if (!response.ok) {
    throw new OSError(OS_ERRORS.unavailable, `OS responded ${response.status}`)
  }

  try {
    return await response.json()
  } catch {
    throw new OSError(OS_ERRORS.unavailable, 'OS response was not JSON')
  }
}

export function getBrief(osId) {
  return osFetch(contactPath(osId, '/brief'))
}

export function getMeetings(osId) {
  return osFetch(contactPath(osId, '/meetings'))
}

export function getMeeting(osId, slug) {
  return osFetch(contactPath(osId, `/meeting/${encodeURIComponent(slug)}`))
}

export function getComms(osId) {
  return osFetch(contactPath(osId, '/comms'))
}
