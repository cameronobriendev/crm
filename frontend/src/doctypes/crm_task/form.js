import { getReferenceLabel, getReferenceRoute } from '@/utils/reference'

export class CRMTask {
  onRender() {
    const route = getReferenceRoute(
      this.doc.reference_doctype,
      this.doc.reference_docname,
    )
    if (!route) return

    const label = getReferenceLabel(this.doc.reference_doctype)

    this.actions = [
      {
        name: 'Redirect Action',
        label: __('Open {0}', [label]),
        onClick: (close) => {
          this.router.push(route)
          close?.()
        },
      },
    ]
  }
}
