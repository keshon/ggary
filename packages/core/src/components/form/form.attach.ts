import type { Machine } from '../../machine'
import type { AttachFormOptions, FormErrors, FormEvent, FormState, FormSummaryItem } from './form.types'

const isPromise = <T>(value: unknown): value is Promise<T> => !!value && typeof (value as Promise<T>).then === 'function'

/** The name a person reads for a control: its label, the label it points at, its own. */
function labelOf(element: Element): string {
  const labelled = (element as HTMLInputElement).labels?.[0]?.textContent
  if (labelled) return labelled.trim()
  const ids = element.getAttribute('aria-labelledby')
  if (ids) {
    const doc = element.ownerDocument
    const text = ids.split(/\s+/).map((id) => doc.getElementById(id)?.textContent?.trim() ?? '').filter(Boolean)
    // The label, not what the control says it holds: a Select's value follows its label.
    if (text.length) return text[0]
  }
  return element.getAttribute('aria-label') ?? (element as HTMLInputElement).name ?? ''
}

/** What the page says is wrong with a control: the error its field shows, or the browser's message. */
function messageOf(element: Element): string {
  const doc = element.ownerDocument
  for (const id of (element.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean)) {
    const described = doc.getElementById(id)
    const part = described?.getAttribute('data-part')
    if (described && (part === 'error' || part === 'field-error') && !described.hidden && described.textContent?.trim()) return described.textContent.trim()
  }
  return (element as HTMLInputElement).validationMessage ?? ''
}

const controlsOf = (form: HTMLFormElement) => [...form.elements].filter((element): element is HTMLInputElement => 'validity' in element && 'willValidate' in element)

/** Every error on the page, in its order: the browser's, then the rules' and the server's by name, one per field. */
export function collectSummary(form: HTMLFormElement, state: FormState): FormSummaryItem[] {
  const doc = form.ownerDocument
  const entries: { element: Element | null; item: FormSummaryItem }[] = []
  const named = new Set(Object.keys(state.errors))
  for (const control of controlsOf(form)) {
    if (!control.willValidate || control.validity.valid || (control.name && named.has(control.name))) continue
    if (!control.id) control.id = `${state.id}-control-${entries.length}`
    entries.push({ element: control, item: { id: control.id, name: control.name, label: labelOf(control), message: messageOf(control) } })
  }
  for (const [name, message] of Object.entries(state.errors)) {
    const field = state.fields[name]
    const element = (field && doc.getElementById(field.id)) || (form.elements.namedItem(name) as Element | null)
    const id = field?.id ?? (element as HTMLElement | null)?.id ?? ''
    entries.push({ element, item: { id, name, label: field?.label || (element ? labelOf(element) : name), message } })
  }
  entries.sort((a, b) => {
    if (!a.element || !b.element) return a.element ? -1 : b.element ? 1 : 0
    return a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  })
  return entries.map((entry) => entry.item)
}

/**
 * Validate a form on submit, show its errors, and send it. Returns the
 * cleanup. The adapters' Form calls it; a page of plain HTML can too.
 */
export function attachForm(form: HTMLFormElement, machine: Machine<FormState, FormEvent>, options: () => AttachFormOptions): () => void {
  const doc = form.ownerDocument
  // The kit shows the errors: no browser bubbles, which would also take the focus.
  const hadNoValidate = form.noValidate
  form.noValidate = true
  let passing = false
  let refresh: ReturnType<typeof setTimeout> | undefined

  /** After the fields have drawn their errors: read the summary off the page, and move the focus. */
  const settle = (moveFocus: boolean) => {
    clearTimeout(refresh)
    refresh = setTimeout(() => {
      const state = machine.getState()
      machine.send({ type: 'SUMMARY', items: collectSummary(form, state) })
      if (!moveFocus) return
      // Once the summary it just filled is drawn: a hidden element takes no focus.
      refresh = setTimeout(focusTarget, 0)
    }, 0)
  }

  const focusTarget = () => {
    const state = machine.getState()
    const target = state.focus.target
    if (target === 'summary') {
      const summary = form.querySelector<HTMLElement>('[data-scope="form-summary"][data-part="root"]') ?? doc.querySelector<HTMLElement>(`[data-scope="form-summary"][data-form="${state.id}"]`)
      if (summary) {
        summary.focus()
        return
      }
    }
    const first = state.summary[0]
    const element = first && doc.getElementById(first.id)
    element?.focus()
  }

  /** Every name the rules have answered for: a rule that is satisfied may simply leave its name out. */
  const ruleNames = new Set<string>()
  const runRules = (data: FormData) => {
    const validate = options().validate
    const errors = validate ? validate(data) : {}
    if (!isPromise(errors)) for (const name of Object.keys(errors)) ruleNames.add(name)
    return errors
  }

  const onSubmit = (event: SubmitEvent) => {
    if (passing) {
      passing = false
      return
    }
    // A second press while the first is out is not a second submission.
    if (machine.getState().status === 'submitting') {
      event.preventDefault()
      return
    }
    const submitter = event.submitter as HTMLElement | null
    const data = new FormData(form, submitter)
    // The browser's constraints: each invalid control hears `invalid`, and its field shows why.
    const nativeValid = form.checkValidity()
    const rules = runRules(data)
    const { onSubmit: send } = options()

    const decide = (errors: FormErrors) => {
      const found = Object.values(errors).some((text) => typeof text === 'string' && text !== '')
      if (!nativeValid || found) {
        machine.send({ type: 'INVALID', errors: errors as Record<string, string> })
        settle(true)
        return false
      }
      return true
    }

    if (!isPromise(rules) && !send) {
      // Plain HTML all the way: a valid form goes on to its action.
      if (!decide(rules)) event.preventDefault()
      else machine.send({ type: 'SUBMITTED' })
      return
    }

    event.preventDefault()
    Promise.resolve(rules).then((errors) => {
      if (!decide(errors)) return
      if (!send) {
        machine.send({ type: 'SUBMITTED' })
        passing = true
        form.requestSubmit(submitter && 'form' in submitter ? (submitter as HTMLButtonElement) : undefined)
        return
      }
      machine.send({ type: 'SUBMITTING' })
      Promise.resolve()
        .then(() => send(data, event))
        .then(
          (result) => {
            machine.send({ type: 'SUBMITTED', errors: (result?.errors ?? {}) as Record<string, string>, message: result?.message ?? null })
            if (machine.getState().status === 'failed') settle(true)
          },
          (error) => {
            machine.send({ type: 'SUBMITTED', message: error instanceof Error ? error.message : String(error) })
            settle(true)
          }
        )
    })
  }

  /** An edit: that field's rule or server error goes; the rules run again once a submit has been tried. */
  const onEdit = (event: Event) => {
    const target = event.target as HTMLInputElement | null
    const name = target?.name
    if (name) edited(name)
  }

  const edited = (name: string) => {
    machine.send({ type: 'EDITED', name })
    const state = machine.getState()
    if (state.submitCount === 0) return
    const rules = runRules(new FormData(form))
    if (!isPromise(rules)) machine.send({ type: 'RULES', errors: rules as Record<string, string>, names: [...ruleNames] })
    if (state.status === 'invalid' || state.status === 'failed') settle(false)
  }

  const onReset = () => {
    machine.send({ type: 'RESET' })
  }

  form.addEventListener('submit', onSubmit)
  form.addEventListener('input', onEdit)
  form.addEventListener('change', onEdit)
  form.addEventListener('reset', onReset)
  // A composite control says it was edited itself: its hidden input fires nothing.
  // It says so as its value changes, before the framework has drawn the new
  // value into its hidden input: the rules read the form once it has.
  const onComposite = (event: Event) => {
    const name = (event as CustomEvent<{ name?: string }>).detail?.name
    if (name) setTimeout(() => edited(name), 0)
  }
  form.addEventListener(EDIT_EVENT, onComposite)
  return () => {
    clearTimeout(refresh)
    form.noValidate = hadNoValidate
    form.removeEventListener('submit', onSubmit)
    form.removeEventListener('input', onEdit)
    form.removeEventListener('change', onEdit)
    form.removeEventListener('reset', onReset)
    form.removeEventListener(EDIT_EVENT, onComposite)
  }
}

/** The event a composite control sends up when its value changes: its hidden input fires none. */
export const EDIT_EVENT = 'gg:edit'

/** Tell the form around `element` that the field `name` was edited. */
export function formEdited(element: Element | null, name: string | undefined): void {
  if (!element || !name) return
  element.dispatchEvent(new CustomEvent(EDIT_EVENT, { bubbles: true, detail: { name } }))
}
