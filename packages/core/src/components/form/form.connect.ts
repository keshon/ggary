import type { Dict, Normalizer } from '../../types'
import { formAnatomy, formSummaryAnatomy } from './form.anatomy'
import type { FormState, FormSummaryItem, FormSummaryWords } from './form.types'

/** A form's errors in one place, at its top: a heading, the server's message, and a link to each field. */
export function connectSummary<T = Dict>(state: FormState, normalize: Normalizer<T>, options: { headingLevel?: 1 | 2 | 3 | 4 | 5 | 6 } & { words?: FormSummaryWords } = {}) {
  const { words = {} } = options
  const shown = (state.status === 'invalid' || state.status === 'failed') && (state.summary.length > 0 || !!state.message)
  const titleId = `${state.id}-summary-title`
  return {
    shown,
    title: words.title ?? 'There is a problem',
    message: state.message,
    items: state.summary,
    itemText: (item: FormSummaryItem) => (words.item ?? ((label: string, message: string) => (label ? `${label}: ${message}` : message)))(item.label, item.message),
    rootProps: normalize({
      ...formSummaryAnatomy.attrs('root'),
      'data-form': state.id,
      // Focused after a failed submit, so its heading is read first.
      tabIndex: -1,
      role: 'region',
      'aria-labelledby': titleId,
      hidden: !shown || undefined,
    }),
    titleProps: normalize({ ...formSummaryAnatomy.attrs('title'), id: titleId, role: 'heading', 'aria-level': options.headingLevel ?? 2 }),
    messageProps: normalize({ ...formSummaryAnatomy.attrs('message') }),
    listProps: normalize({ ...formSummaryAnatomy.attrs('list') }),
    itemProps: normalize({ ...formSummaryAnatomy.attrs('item') }),
    getLinkProps: (item: FormSummaryItem) =>
      normalize({
        ...formSummaryAnatomy.attrs('link'),
        href: `#${item.id}`,
        // To the control itself, not to a scrolled-to anchor: the focus is what a keyboard needs.
        onClick: (event: MouseEvent) => {
          const target = (event.currentTarget as Element).ownerDocument.getElementById(item.id)
          if (!target) return
          event.preventDefault()
          target.focus()
          if (typeof target.scrollIntoView === 'function') target.scrollIntoView({ block: 'center' })
        },
      }),
  }
}

/** What a field named `name` shows from its form: the rule's or the server's error, if any. */
export function formErrorOf(state: FormState | null | undefined, name: string | undefined): string | undefined {
  return name && state ? state.errors[name] : undefined
}

/**
 * For a control that has no Field around it — Select, Combobox, DatePicker —
 * the error its form holds for it: the props to add to its focusable part,
 * and the element that says it.
 */
export function connectFieldError<T = Dict>(error: string | undefined, errorId: string, normalize: Normalizer<T>) {
  return {
    error,
    controlProps: { 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': error ? errorId : undefined, 'data-invalid': error ? '' : undefined },
    errorProps: normalize({ ...formAnatomy.attrs('field-error'), id: errorId, hidden: !error || undefined }),
  }
}

export function connectForm<T = Dict>(state: FormState, normalize: Normalizer<T>) {
  return {
    rootProps: normalize({
      ...formAnatomy.attrs('root'),
      id: state.id,
      'aria-busy': state.status === 'submitting' ? 'true' : undefined,
      'data-status': state.status,
    }),
  }
}
