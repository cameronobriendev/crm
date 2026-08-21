// CRM Task and FCRM Note point at their parent record through
// reference_doctype + reference_docname. reference_doctype is the only thing
// that says which page owns that record, so the doctype -> route mapping lives
// here instead of being re-guessed at every call site.
const referenceRoutes = {
  'CRM Deal': { routeName: 'Deal', param: 'dealId' },
  'CRM Lead': { routeName: 'Lead', param: 'leadId' },
  'CRM Organization': { routeName: 'Organization', param: 'organizationId' },
  Contact: { routeName: 'Contact', param: 'contactId' },
}

/**
 * Route location for a referenced record, or null when the doctype has no page
 * of its own. Returning null keeps callers from inventing a URL for a doctype
 * they cannot render.
 */
export function getReferenceRoute(doctype, docname) {
  const reference = referenceRoutes[doctype]
  if (!reference || !docname) return null
  return { name: reference.routeName, params: { [reference.param]: docname } }
}

/**
 * Untranslated label for the referenced doctype, e.g. 'Organization' for
 * 'CRM Organization'. Wrap the result in __() at the call site so the string is
 * translated after the translations have loaded.
 */
export function getReferenceLabel(doctype) {
  return referenceRoutes[doctype]?.routeName || ''
}
